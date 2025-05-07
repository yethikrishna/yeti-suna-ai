from backend.celery_app import celery_app
from utils.logger import logger # Assuming your logger is accessible here
# We will need to import more things here later, like DBConnection, 
# parts of agent/api.py logic, update_agent_run_status, etc.
import time
import asyncio
import json
from typing import Optional, Dict, Any
import traceback
from datetime import datetime, timezone

# Imports from Suna RAG/Agent codebase
from services.supabase import DBConnection # For type hinting if needed, actual client via run_utils
from services import redis as redis_service # For direct use if any, actual init via run_utils
from agentpress.thread_manager import ThreadManager
from agent.run import run_agent # This is the core agent execution logic
# Import the utility functions we moved
from agent.run_utils import (
    update_agent_run_status,
    stop_agent_run,
    _cleanup_redis_instance_key,
    _cleanup_redis_response_list, # Though stop_agent_run calls this
    get_db_connection, # UPDATED
    ensure_redis_initialized,
    worker_init_services, # For connecting to Celery signals
    worker_shutdown_services, # For connecting to Celery signals
    REDIS_RESPONSE_LIST_TTL # Import constant
)
from utils.config import config # For default model name
from sandbox.sandbox import Sandbox # Added for type hint, actual object comes from params
from celery.signals import worker_process_init, worker_process_shutdown

# Connect Celery signals for worker process init and shutdown
@worker_process_init.connect
def init_worker_services(**kwargs):
    logger.info("Worker process init: Initializing services via Celery signal.")
    asyncio.run(worker_init_services())

@worker_process_shutdown.connect
def shutdown_worker_services(**kwargs):
    logger.info("Worker process shutdown: Shutting down services via Celery signal.")
    asyncio.run(worker_shutdown_services())

@celery_app.task(bind=True, acks_late=True, reject_on_worker_lost=True)
async def execute_agent_processing(self,
                                 agent_run_id: str,
                                 project_id: str, # ADDED
                                 thread_id: str,
                                 model_name: str,
                                 enable_thinking: bool,
                                 reasoning_effort: str,
                                 stream: bool, # This task's stream param - how it affects run_agent call needs care
                                 enable_context_manager: bool,
                                 user_id: str,
                                 instance_id: str,
                                 initial_prompt_message: Optional[Dict[str, Any]] = None
                                 ):
    """
    Celery task to encapsulate the agent processing logic, adapted from agent.api.run_agent_background.
    acks_late=True means the task message will be acknowledged after the task has been executed, not just before.
    reject_on_worker_lost=True will cause the task to be re-queued if the worker process executing it crashes.
    """
    logger.info(f"[Task {self.request.id}] EXECUTE_AGENT_PROCESSING for agent_run_id: {agent_run_id}, project_id: {project_id}, thread_id: {thread_id}")

    db_connection = await get_db_connection() # Use the new function to get DBConnection object
    db_client = await db_connection.client # Get client if needed for direct use, e.g. update_agent_run_status

    active_run_key = f"active_run:{instance_id}:{agent_run_id}"
    control_channel_instance = f"agent_run:{agent_run_id}:control:{instance_id}"
    control_channel_global = f"agent_run:{agent_run_id}:control"
    stop_event = asyncio.Event()

    tm = ThreadManager(db_connection_override=db_connection) # Pass DBConnection object

    # Handle initial_prompt_message by adding it to the thread
    if initial_prompt_message:
        try:
            msg_role = initial_prompt_message.get('role', 'user')
            msg_content = initial_prompt_message.get('content')
            if msg_content: # Ensure there is content
                logger.info(f"[Task {self.request.id}] Adding initial prompt message to thread {thread_id} for agent_run {agent_run_id}")
                await tm.add_message(
                    thread_id=thread_id,
                    type=msg_role,
                    content=msg_content,
                    is_llm_message=(msg_role == 'assistant') # Or determine based on actual role
                )
            else:
                logger.warning(f"[Task {self.request.id}] Initial prompt message for {agent_run_id} lacked content.")
        except Exception as e:
            logger.error(f"[Task {self.request.id}] Failed to add initial prompt message for {agent_run_id}: {e}", exc_info=True)
            # Decide if this is a fatal error for the task
            await update_agent_run_status(agent_run_id, status="failed", error=f"Failed to process initial message: {str(e)}", db_client_override=db_client)
            return {"status": "failed", "agent_run_id": agent_run_id, "error": "Failed to process initial message"}


    async def check_for_stop_signal():
        pubsub = None
        try:
            # Ensure redis is up for this new connection (already handled by worker_init_services)
            # await ensure_redis_initialized() 
            redis_cli = await redis_service.get_async_client() # Get a client instance
            pubsub = redis_cli.pubsub()
            await pubsub.subscribe(control_channel_instance, control_channel_global)
            logger.info(f"[Task {self.request.id}] Subscribed to {control_channel_instance} and {control_channel_global} for stop signals.")
            while not stop_event.is_set():
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
                if message and message["type"] == "message":
                    if message["data"].decode('utf-8') == "STOP":
                        logger.info(f"[Task {self.request.id}] STOP signal received for {agent_run_id} on {message['channel'].decode('utf-8')}. Setting stop_event.")
                        stop_event.set()
                        break
                await asyncio.sleep(0.1) 
        except asyncio.CancelledError:
            logger.info(f"[Task {self.request.id}] Stop signal listener cancelled for {agent_run_id}.")
        except Exception as e:
            logger.error(f"[Task {self.request.id}] Error in stop signal listener for {agent_run_id}: {e}", exc_info=True)
        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe(control_channel_instance, control_channel_global)
                    # Safely close pubsub if it's a real connection object, redis-py's pubsub objects are typically closed with the connection
                    # If redis_cli is the main connection, it's managed by worker_shutdown_services.
                    # If pubsub has its own close method distinct from the connection: await pubsub.close()
                    logger.debug(f"[Task {self.request.id}] Unsubscribed from pubsub for stop signal listener.")
                except Exception as e:
                    logger.error(f"[Task {self.request.id}] Error cleaning up pubsub for stop signal: {e}", exc_info=True)
            logger.info(f"[Task {self.request.id}] Stop signal listener for {agent_run_id} terminated.")

    stop_signal_task = asyncio.create_task(check_for_stop_signal())
    current_status = "running" 

    try:
        logger.info(f"[Task {self.request.id}] Setting active_run key in Redis: {active_run_key}")
        redis_cli = await redis_service.get_async_client()
        await redis_cli.set(active_run_key, json.dumps({"status": "running", "started_at": datetime.now(timezone.utc).isoformat()}), ex=REDIS_RESPONSE_LIST_TTL)

        final_assistant_messages = [] # Renamed to clarify content
        response_list_key = f"agent_run:{agent_run_id}:responses" # For assistant messages primarily

        async for item in run_agent(
            thread_id=thread_id,
            project_id=project_id,
            stream=False, # Force stream=False for run_agent's internal LLM calls to get whole messages per turn
            thread_manager=tm,
            model_name=model_name or config.MODEL_TO_USE,
            enable_thinking=enable_thinking,
            reasoning_effort=reasoning_effort,
            enable_context_manager=enable_context_manager
        ):
            if isinstance(item, dict):
                item_type = item.get('type')

                if item_type == 'assistant':
                    # This is a direct assistant message object yielded by ResponseProcessor
                    message_obj = item
                    if message_obj.get('role') == 'assistant': # Confirming role
                        final_assistant_messages.append(message_obj)
                        try:
                            await redis_cli.rpush(response_list_key, json.dumps(message_obj))
                            await redis_cli.expire(response_list_key, REDIS_RESPONSE_LIST_TTL)
                            logger.debug(f"[Task {self.request.id}] Appended assistant message to Redis list {response_list_key}")
                        except Exception as e_redis:
                            logger.error(f"[Task {self.request.id}] Failed to push assistant message to Redis list {response_list_key}: {e_redis}", exc_info=True)
                    else:
                        logger.warning(f"[Task {self.request.id}] Received item with type 'assistant' but unexpected role: {message_obj.get('role')}")
                
                elif item_type == 'status':
                    content = item.get('content', {})
                    status_type = content.get('status_type')
                    logger.info(f"[Task {self.request.id}] Agent run {agent_run_id} event: {status_type} - Details: {content}")
                    if status_type == 'tool_error':
                        # Logged for diagnostics, error will be in agent_runs.error if it leads to overall failure
                        logger.error(f"[Task {self.request.id}] Tool error during agent run {agent_run_id}: {content.get('error_details')}")
                    elif status_type == 'thread_run_failed':
                        logger.error(f"[Task {self.request.id}] Agent run {agent_run_id} reported as failed by ResponseProcessor: {content.get('error')}")
                        # This might be an early signal to fail the task

                # Tool messages are saved to the DB by ResponseProcessor but not yielded directly as message objects in non-streaming mode.
                # They are recorded in the 'messages' table. The 'agent_runs.responses' field typically stores assistant outputs.
                # Thus, we are not explicitly collecting 'tool' role messages here for final_assistant_messages.

                elif isinstance(item, dict) and item.get('type') == 'content' and "Agent reached maximum auto-continue limit" in str(item.get('content')):
                    logger.warning(f"[Task {self.request.id}] Agent reached max auto-continue limit for run {agent_run_id}.")
                # else:
                    # logger.debug(f"[Task {self.request.id}] Agent for run {agent_run_id} yielded unhandled item type '{item_type}': {item}")
            else:
                logger.warning(f"[Task {self.request.id}] Agent for run {agent_run_id} yielded non-dict item: {item}")

        if stop_event.is_set():
            logger.info(f"[Task {self.request.id}] Agent run {agent_run_id} was stopped by signal.")
            current_status = "stopped"
            await update_agent_run_status(agent_run_id, status=current_status, error="Manually stopped by user/system.", responses=final_assistant_messages, db_client_override=db_client)
        else:
            logger.info(f"[Task {self.request.id}] Agent run {agent_run_id} completed normally.")
            current_status = "completed"
            await update_agent_run_status(agent_run_id, status=current_status, responses=final_assistant_messages, db_client_override=db_client)

        return {"status": current_status, "agent_run_id": agent_run_id, "final_responses_summary": final_assistant_messages[:3] if final_assistant_messages else None}

    except asyncio.CancelledError:
        logger.warning(f"[Task {self.request.id}] Agent run {agent_run_id} was cancelled.")
        current_status = "failed" 
        try:
            await update_agent_run_status(agent_run_id, status=current_status, error="Task cancelled (worker lost or revoked)", db_client_override=db_client)
        except Exception as db_e:
            logger.error(f"[Task {self.request.id}] Failed to update DB status for cancelled task {agent_run_id}: {db_e}")
        raise 
    except Exception as e:
        logger.error(f"[Task {self.request.id}] Exception in agent run {agent_run_id}: {str(e)}\n{traceback.format_exc()}")
        current_status = "failed"
        try:
            await update_agent_run_status(agent_run_id, status=current_status, error=str(e), db_client_override=db_client)
        except Exception as db_e:
            logger.error(f"[Task {self.request.id}] Failed to update DB status for failed task {agent_run_id}: {db_e}")
        raise 
    finally:
        logger.info(f"[Task {self.request.id}] Cleaning up for agent_run {agent_run_id}, final status: {current_status}")
        stop_event.set() 
        if stop_signal_task:
            try:
                await asyncio.wait_for(stop_signal_task, timeout=5.0) 
            except asyncio.TimeoutError:
                logger.warning(f"[Task {self.request.id}] Timeout waiting for stop_signal_task to finish for {agent_run_id}.")
                stop_signal_task.cancel() 
            except Exception as e_stop_task:
                logger.error(f"[Task {self.request.id}] Exception during stop_signal_task cleanup: {e_stop_task}")

        await _cleanup_redis_instance_key(agent_run_id, instance_id)

        if current_status not in ["completed"]:
             logger.info(f"[Task {self.request.id}] Run did not complete successfully ({current_status}), calling stop_agent_run for full cleanup for {agent_run_id}.")
             await stop_agent_run(agent_run_id, 
                                  error_message=f"Run ended with status: {current_status}", 
                                  instance_id_for_cleanup=instance_id)
        else:
            await _cleanup_redis_response_list(agent_run_id)
            
        logger.info(f"[Task {self.request.id}] Finished execute_agent_processing for {agent_run_id}")
