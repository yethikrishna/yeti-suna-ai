import asyncio
import json
import traceback
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import uuid
import os

import dramatiq
from dramatiq.brokers.rabbitmq import RabbitmqBroker
from dramatiq.middleware import AsyncIO

from agent.run import run_agent
from utils.logger import logger
from agentpress.thread_manager import ThreadManager # Assuming this is still relevant
# services.supabase.DBConnection is removed
# services.redis is removed
from services.sqlite_db import get_db_connection, initialize_database # Import SQLite services
from utils.config import config # For SQLITE_DB_PATH if needed for initialization path

# --- Dramatiq Setup ---
rabbitmq_host = os.getenv('RABBITMQ_HOST', 'rabbitmq')
rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
# Add retries to middleware
rabbitmq_broker = RabbitmqBroker(
    host=rabbitmq_host,
    port=rabbitmq_port,
    middleware=[
        AsyncIO(),
        dramatiq.middleware.Retries(min_backoff=1000, max_backoff=300000, max_retries=5) # 5 retries, up to 5 mins
    ]
)
dramatiq.set_broker(rabbitmq_broker)

# --- Global State (minimized) ---
_initialized = False
thread_manager = None # Initialized in initialize()
# instance_id is passed as an argument now, so no global instance_id needed here.

# --- Initialization ---
async def initialize_background_runner():
    """
    Initialize resources for the background agent runner.
    This should be called before any agent tasks are processed if not already done by main app.
    """
    global thread_manager, _initialized
    if _initialized:
        return

    logger.info("Initializing background agent runner...")
    # Ensure SQLite DB is initialized (creates tables if they don't exist)
    # This might be redundant if the main FastAPI app already calls it,
    # but good for standalone worker execution or testing.
    try:
        initialize_database() # Synchronous, but should be fine for init
        logger.info("SQLite database initialized/verified for background runner.")
    except Exception as e:
        logger.error(f"Failed to initialize SQLite database for background runner: {e}", exc_info=True)
        raise # Critical failure if DB can't be initialized

    thread_manager = ThreadManager() # Assuming this doesn't have heavy I/O or external deps for init
    _initialized = True
    logger.info("Background agent runner initialized successfully.")


# --- Helper: Message Insertion ---
async def _insert_agent_response_message(
    conn: Any, # sqlite3.Connection, but type hint as Any to avoid import if not available everywhere
    agent_run_id: str,
    thread_id: str,
    response_data: Dict[str, Any]
) -> str:
    """
    Inserts an agent's response into the messages table.
    Returns the generated message_id.
    """
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    content_str = json.dumps(response_data.get("content", response_data)) # Store full response as content if specific content field not present
    message_type = response_data.get("type", "agent_response") # Default type
    is_llm_msg = 1 if response_data.get("is_llm_message", True) else 0 # Default to true if not specified
    metadata_str = json.dumps(response_data.get("metadata", {"agent_run_id": agent_run_id}))

    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO messages (message_id, thread_id, type, is_llm_message, content, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            """,
            (message_id, thread_id, message_type, is_llm_msg, content_str, metadata_str)
        )
        conn.commit()
        logger.debug(f"Inserted message {message_id} for agent_run {agent_run_id} into thread {thread_id}")
        return message_id
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to insert message for agent_run {agent_run_id}: {e}", exc_info=True)
        raise # Re-raise to handle in the main loop

# --- Helper: Update Agent Run Status (Simplified) ---
async def update_agent_run_status_sqlite(
    conn: Any, # sqlite3.Connection
    agent_run_id: str,
    status: str,
    error: Optional[str] = None
    # responses field is removed as individual messages are stored
) -> bool:
    """Updates agent run status, error, and completed_at timestamp in SQLite."""
    try:
        cursor = conn.cursor()
        update_data = {
            "status": status,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        if error:
            update_data["error"] = error

        sql = f"UPDATE agent_runs SET status = :status, completed_at = :completed_at"
        if error:
            sql += ", error = :error"
        sql += " WHERE id = :agent_run_id"
        
        params = {**update_data, "agent_run_id": agent_run_id}

        cursor.execute(sql, params)
        conn.commit()

        if cursor.rowcount > 0:
            logger.info(f"Successfully updated agent_run {agent_run_id} status to '{status}'.")
            return True
        else:
            logger.warning(f"No rows updated for agent_run {agent_run_id} (status: {status}). It might not exist or status was already set.")
            return False # Indicate no row was updated
            
    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating agent_run {agent_run_id} status to '{status}': {e}", exc_info=True)
        return False


# --- Stop Signal Checker ---
POLL_INTERVAL_SECONDS = 1.0 # How often to check for stop signal

async def check_for_stop_signal_sqlite(
    conn: Any, # sqlite3.Connection
    agent_run_id: str,
    stop_event: asyncio.Event # Use an asyncio.Event to signal stop
):
    """Periodically polls the agent_runs table for a stop request."""
    logger.debug(f"Stop signal checker started for agent_run {agent_run_id}.")
    try:
        while not stop_event.is_set(): # Loop until stop_event is set externally or by this function
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
            cursor = conn.cursor()
            cursor.execute("SELECT status FROM agent_runs WHERE id = ?", (agent_run_id,))
            row = cursor.fetchone()
            if row:
                current_status = row["status"]
                if current_status in ['STOP_REQUESTED', 'stopped', 'failed', 'completed']:
                    logger.info(f"Stop signal detected for agent_run {agent_run_id}. Status: {current_status}. Stopping run.")
                    stop_event.set() # Signal the main loop to stop
                    break
            else:
                logger.warning(f"Agent run {agent_run_id} not found during stop check. Assuming it was deleted or completed.")
                stop_event.set() # Stop if the run record is gone
                break
    except asyncio.CancelledError:
        logger.info(f"Stop signal checker cancelled for agent_run {agent_run_id}.")
    except Exception as e:
        logger.error(f"Error in SQLite stop signal checker for {agent_run_id}: {e}", exc_info=True)
        stop_event.set() # Signal stop on checker error to prevent runaway agent
    finally:
        logger.debug(f"Stop signal checker stopped for agent_run {agent_run_id}.")


# --- Dramatiq Actor: run_agent_background ---
@dramatiq.actor(time_limit=3600 * 1000) # 1 hour time limit for the task
async def run_agent_background(
    agent_run_id: str,
    thread_id: str,
    # instance_id: str, # No longer needed from Redis logic
    project_id: str, # Assuming this is still relevant for agent context
    model_name: str,
    enable_thinking: Optional[bool],
    reasoning_effort: Optional[str],
    stream: bool, # Stream parameter for agent, not for Redis pub/sub
    enable_context_manager: bool
):
    await initialize_background_runner() # Ensure global resources are ready

    logger.info(f"Background agent run started: {agent_run_id} for thread: {thread_id}")
    logger.info(f"🚀 Using model: {model_name} (thinking: {enable_thinking}, reasoning_effort: {reasoning_effort})")

    db_conn = None # SQLite connection
    stop_event = asyncio.Event()
    stop_checker_task = None
    final_status = "running" # Initial status
    error_message = None
    start_time = datetime.now(timezone.utc)

    try:
        db_conn = get_db_connection() # Get a new SQLite connection

        # Start the stop signal checker
        stop_checker_task = asyncio.create_task(
            check_for_stop_signal_sqlite(db_conn, agent_run_id, stop_event)
        )

        # Initialize agent generator
        # Ensure thread_manager is initialized and passed correctly
        if not thread_manager:
             logger.error("ThreadManager not initialized before run_agent. This is a critical error.")
             raise RuntimeError("ThreadManager not initialized.")

        agent_gen = run_agent(
            thread_id=thread_id,
            project_id=project_id,
            stream=stream, # This controls how the agent yields responses
            thread_manager=thread_manager,
            model_name=model_name,
            enable_thinking=enable_thinking,
            reasoning_effort=reasoning_effort,
            enable_context_manager=enable_context_manager,
            # agent_run_id=agent_run_id # Pass agent_run_id if agent needs it
        )

        async for response_data in agent_gen:
            if stop_event.is_set():
                logger.info(f"Agent run {agent_run_id} stopping due to signal.")
                final_status = "stopped" # Or use the status from DB if that's more accurate
                break

            # Store response directly into SQLite messages table
            try:
                await _insert_agent_response_message(db_conn, agent_run_id, thread_id, response_data)
            except Exception as insert_err:
                logger.error(f"Failed to insert agent response into SQLite for {agent_run_id}: {insert_err}", exc_info=True)
                final_status = "failed"
                error_message = f"Failed to store agent response: {str(insert_err)}"
                stop_event.set() # Stop further processing
                break

            # Check for agent-signaled completion or error from response_data
            if isinstance(response_data, dict) and response_data.get('type') == 'status':
                status_val = response_data.get('status')
                if status_val in ['completed', 'failed', 'stopped']:
                    logger.info(f"Agent run {agent_run_id} finished via agent status message: {status_val}")
                    final_status = status_val
                    if status_val == 'failed' or status_val == 'stopped':
                        error_message = response_data.get('message', f"Run ended by agent with status: {status_val}")
                    stop_event.set() # Signal stop to exit loop and checker
                    break
        
        # If loop finished without explicit completion/error/stop signal, mark as completed
        if not stop_event.is_set() and final_status == "running":
            final_status = "completed"
            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            logger.info(f"Agent run {agent_run_id} completed normally (duration: {duration:.2f}s)")
            # Store a final completion message if desired
            completion_message_content = {"type": "status", "status": "completed", "message": "Agent run completed successfully"}
            try:
                await _insert_agent_response_message(db_conn, agent_run_id, thread_id, completion_message_content)
            except Exception as e:
                 logger.warning(f"Could not store final completion message for {agent_run_id}: {e}")


    except Exception as e:
        error_message = str(e)
        traceback_str = traceback.format_exc()
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        logger.error(f"Error in agent run {agent_run_id} after {duration:.2f}s: {error_message}\n{traceback_str}")
        final_status = "failed"
        if error_message is None: # Ensure error_message is set
            error_message = f"Agent run failed with an unexpected error: {traceback_str}"
        stop_event.set() # Ensure stop checker also exits

        # Store error message as a final response in messages table
        error_response_content = {"type": "status", "status": "error", "message": error_message}
        try:
            if db_conn: # Ensure db_conn is available
                 await _insert_agent_response_message(db_conn, agent_run_id, thread_id, error_response_content)
            else: # Fallback if db_conn itself failed
                 logger.error(f"db_conn not available to log error message for {agent_run_id}")
        except Exception as log_err:
            logger.error(f"Failed to store error response message to SQLite for {agent_run_id}: {log_err}")

    finally:
        # Ensure stop_event is set to terminate the checker task if not already
        stop_event.set()
        if stop_checker_task and not stop_checker_task.done():
            try:
                await asyncio.wait_for(stop_checker_task, timeout=5.0) # Give it a moment to finish
            except asyncio.TimeoutError:
                logger.warning(f"Stop checker task for {agent_run_id} did not finish promptly, cancelling.")
                stop_checker_task.cancel()
            except asyncio.CancelledError:
                logger.info(f"Stop checker task for {agent_run_id} was cancelled as expected.")
            except Exception as e:
                logger.warning(f"Error during stop_checker_task cleanup for {agent_run_id}: {e}", exc_info=True)

        # Update final status in agent_runs table
        if db_conn:
            # Construct the error string if it includes a traceback
            full_error_for_db = error_message
            if final_status == "failed" and 'traceback_str' in locals() and traceback_str:
                 full_error_for_db = f"{error_message}\n{traceback_str}" if error_message else traceback_str

            update_success = await update_agent_run_status_sqlite(
                db_conn, agent_run_id, final_status, error=full_error_for_db
            )
            if not update_success:
                 logger.error(f"Critical: Failed to update final status for agent_run {agent_run_id} to {final_status}.")
            
            # Close the SQLite connection
            try:
                db_conn.close()
                logger.debug(f"Closed SQLite connection for agent_run {agent_run_id}.")
            except Exception as e:
                logger.error(f"Error closing SQLite connection for agent_run {agent_run_id}: {e}", exc_info=True)
        else:
            logger.error(f"SQLite connection (db_conn) was not available at the end of agent_run {agent_run_id}. Final status update might have failed.")

        logger.info(f"Agent run background task fully completed for: {agent_run_id} with final status: {final_status}")

# Note: Old Redis cleanup functions (_cleanup_redis_instance_key, _cleanup_redis_response_list) are removed.
# The REDIS_RESPONSE_LIST_TTL constant is also removed.
# The global 'db' for Supabase and 'instance_id' for Redis are removed/refactored.

if __name__ == '__main__':
    # This block is for potential direct testing or local worker execution.
    # Ensure environment variables like SQLITE_DB_PATH are set.
    # Example: python -m backend.run_agent_background (if structure allows)
    # Or more commonly, run via `dramatiq backend.run_agent_background`
    
    logger.info("run_agent_background.py executed directly. Setting up for Dramatiq worker.")
    # To run this worker, you'd typically use the dramatiq CLI:
    # `dramatiq backend.run_agent_background`
    #
    # For a simple test, you could try to send a message if RabbitMQ is running:
    # async def test_send_task():
    #     await initialize_background_runner() # Important
    #     test_agent_run_id = f"test_run_{uuid.uuid4().hex[:6]}"
    #     test_thread_id = f"test_th_{uuid.uuid4().hex[:6]}"
    #     test_project_id = f"test_proj_{uuid.uuid4().hex[:6]}"
        
    #     # Create a dummy agent_runs entry
    #     conn = get_db_connection()
    #     try:
    #         cursor = conn.cursor()
    #         cursor.execute(
    #             "INSERT INTO agent_runs (id, thread_id, status, started_at) VALUES (?, ?, ?, ?)",
    #             (test_agent_run_id, test_thread_id, "running", datetime.now(timezone.utc).isoformat())
    #         )
    #         conn.commit()
    #         logger.info(f"Inserted dummy agent_run {test_agent_run_id}")
    #     except Exception as e:
    #         logger.error(f"Failed to insert dummy agent_run: {e}")
    #         conn.rollback()
    #     finally:
    #         if conn: conn.close()

    #     logger.info(f"Sending test task for agent_run_id: {test_agent_run_id}")
    #     run_agent_background.send(
    #         agent_run_id=test_agent_run_id,
    #         thread_id=test_thread_id,
    #         project_id=test_project_id,
    #         model_name="gemini-1.5-flash-latest", # or your default
    #         enable_thinking=False,
    #         reasoning_effort='low',
    #         stream=True, # Or False
    #         enable_context_manager=True
    #     )
    #     logger.info("Test task sent. Check worker logs and database.")

    # if config.ENV_MODE == "local": # Example condition to run test
    #    asyncio.run(test_send_task())
    # else:
    #    logger.info("Not in local mode, skipping direct task send test.")
    pass # Placeholder for when run as main module, Dramatiq CLI handles actor discovery.
