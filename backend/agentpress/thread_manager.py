"""
Conversation thread management system for AgentPress.

This module provides comprehensive conversation management, including:
- Thread creation and persistence
- Message handling with support for text and images
- Tool registration and execution
- LLM interaction with streaming support
- Error handling and cleanup
- Context summarization to manage token limits
"""

import json
from typing import List, Dict, Any, Optional, Type, Union, AsyncGenerator, Literal
from services.llm import make_llm_api_call
from agentpress.tool import Tool
from agentpress.tool_registry import ToolRegistry
from agentpress.context_manager import ContextManager
from agentpress.response_processor import (
    ResponseProcessor,
    ProcessorConfig
)
# from services.supabase import DBConnection # Replaced by DAL
from backend.database.dal import get_db_client, DatabaseInterface, get_or_create_default_user # Import DAL & default user fn
from utils.logger import logger
from langfuse.client import StatefulGenerationClient, StatefulTraceClient
from services.langfuse import langfuse
import datetime

# Type alias for tool choice
ToolChoice = Literal["auto", "required", "none"]

class ThreadManager:
    """Manages conversation threads with LLM models and tool execution.

    Provides comprehensive conversation management, handling message threading,
    tool registration, and LLM interactions with support for both standard and
    XML-based tool execution patterns.
    """

    def __init__(self, trace: Optional[StatefulTraceClient] = None, is_agent_builder: bool = False, target_agent_id: Optional[str] = None):
        """Initialize ThreadManager.

        Args:
            trace: Optional trace client for logging
            is_agent_builder: Whether this is an agent builder session
            target_agent_id: ID of the agent being built (if in agent builder mode)
        """
        # self.db = DBConnection() # Old direct Supabase connection
        self.db_client: Optional[DatabaseInterface] = None # To be initialized in async methods
        self.tool_registry = ToolRegistry()
        self.trace = trace
        self.is_agent_builder = is_agent_builder
        self.target_agent_id = target_agent_id
        if not self.trace:
            self.trace = langfuse.trace(name="anonymous:thread_manager")
        self.response_processor = ResponseProcessor(
            tool_registry=self.tool_registry,
            add_message_callback=self.add_message,
            trace=self.trace,
            is_agent_builder=self.is_agent_builder,
            target_agent_id=self.target_agent_id
        )
        self.context_manager = ContextManager()

    def add_tool(self, tool_class: Type[Tool], function_names: Optional[List[str]] = None, **kwargs):
        """Add a tool to the ThreadManager."""
        self.tool_registry.register_tool(tool_class, function_names, **kwargs)

    async def add_message(
        self,
        thread_id: str,
        type: str,
        content: Union[Dict[str, Any], List[Any], str],
        is_llm_message: bool = False,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Add a message to the thread in the database.

        Args:
            thread_id: The ID of the thread to add the message to.
            type: The type of the message (e.g., 'text', 'image_url', 'tool_call', 'tool', 'user', 'assistant').
            content: The content of the message. Can be a dictionary, list, or string.
                     It will be stored as JSONB in the database.
            is_llm_message: Flag indicating if the message originated from the LLM.
                            Defaults to False (user message).
            is_llm_message: Flag indicating if the message originated from the LLM.
                            Defaults to False (user message).
            metadata: Optional dictionary for additional message metadata.
                      Defaults to None, stored as an empty JSONB object if None.
        """
        logger.debug(f"Adding message of type '{type}' to thread {thread_id}")
        if not self.db_client:
            self.db_client = await get_db_client()

        # Ensure content and metadata are JSON strings for SQLite
        content_for_db = json.dumps(content) if isinstance(content, (dict, list)) else content
        metadata_for_db = json.dumps(metadata or {}) # Ensure metadata is always a JSON string

        message_id = str(uuid.uuid4())

        data_to_insert = {
            'id': message_id,
            'thread_id': thread_id,
            # 'type': type, # Schema has 'type'
            'role': content.get('role') if isinstance(content, dict) and 'role' in content else type, # Infer role
            'content': content_for_db,
            'type': type, # Storing original 'type' passed, could be 'user', 'assistant', 'tool_call', 'tool_result', 'status'
            'run_id': metadata.get('run_id') if metadata and isinstance(metadata, dict) else None,
            'metadata': metadata_for_db,
            # created_at is handled by DB default
        }

        # 'is_llm_message' is not in the new 'messages' schema. Role and type should cover this.
        # The 'role' field in data_to_insert is based on OpenAI's typical roles.
        # The 'type' field stores the original type passed to this function.

        try:
            # The DAL's insert method returns a dict like {'id': new_id} for SQLite.
            # Supabase used to return a list containing a dict of the inserted row.
            await self.db_client.insert('messages', data=data_to_insert, returning='id')
            logger.info(f"Successfully added message to thread {thread_id} with ID {message_id}")

            # Construct a representation similar to what Supabase might have returned, if needed by caller.
            # For now, returning the input data with the generated ID.
            # Callers might expect a dict containing the inserted data.
            return_data = data_to_insert.copy()
            return_data['content'] = content # original content, not json string
            return_data['metadata'] = metadata or {} # original metadata
            return_data['created_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat() # Approximate
            return return_data

        except Exception as e:
            logger.error(f"Failed to add message to thread {thread_id}: {str(e)}", exc_info=True)
            raise

    async def get_llm_messages(self, thread_id: str) -> List[Dict[str, Any]]: # Renamed from get_messages_for_llm for clarity
        """Get all messages for a thread.

        This method uses the SQL function which handles context truncation
        by considering summary messages.

        Args:
            thread_id: The ID of the thread to get messages for.

        Returns:
            List of message objects, where each message has 'role' and 'content'.
        """
        logger.debug(f"Getting LLM-formatted messages for thread {thread_id}")
        if not self.db_client:
            self.db_client = await get_db_client()

        try:
            # Filters: list of tuples (column, operator, value)
            filters = [('thread_id', '=', thread_id)]
            # The old query selected 'message_id, content' and had an 'is_llm_message' filter.
            # Our new schema has 'role' and 'content' (which is JSON string).
            # We need to reconstruct the messages in the format expected by the LLM (typically list of {'role': ..., 'content': ...}).

            message_rows = await self.db_client.select(
                table_name='messages',
                columns="id, role, content, type, created_at", # Select relevant columns
                filters=filters,
                order_by="created_at ASC" # Ensure messages are in chronological order
            )

            if not message_rows:
                return []

            llm_messages = []
            for row in message_rows:
                db_content_str = row.get('content')
                # The 'role' in the 'messages' table should directly map to LLM role.
                llm_role = row.get('role')

                if not llm_role: # Skip if role is missing from DB record
                    logger.warning(f"Skipping message with ID {row.get('id')} due to missing role.")
                    continue

                parsed_llm_content_value = None
                try:
                    # Stored content could be a JSON string representing the LLM content field
                    # (which can be text, or a list of parts for vision models)
                    parsed_llm_content_value = json.loads(db_content_str)
                except (json.JSONDecodeError, TypeError):
                    # If not a valid JSON string, treat it as plain text content
                    parsed_llm_content_value = db_content_str

                llm_message = {"role": llm_role, "content": parsed_llm_content_value}

                # LiteLLM/OpenAI expect 'name' for tool role, not 'tool_call_id' at the top level of the message.
                # If the original message 'type' was 'tool' (meaning tool result),
                # and the content needs a 'tool_call_id', that ID should be part of the content itself
                # or handled by the response processor.
                # For now, we are just reconstructing based on 'role' and 'content'.
                # The 'id' of the message (row.get('id')) could be used by agent to link tool calls if needed.

                llm_messages.append(llm_message)

            return llm_messages

        except Exception as e:
            logger.error(f"Failed to get LLM messages for thread {thread_id}: {str(e)}", exc_info=True)
            return []

    async def get_thread_by_id(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a thread by its ID."""
        logger.debug(f"Getting thread by ID: {thread_id}")
        if not self.db_client:
            self.db_client = await get_db_client()

        try:
            thread_data = await self.db_client.select('threads', columns="id, user_id, agent_id, title, created_at, updated_at, metadata", filters=[('id', '=', thread_id)], single=True)
            if thread_data:
                if isinstance(thread_data.get('metadata'), str):
                    try:
                        thread_data['metadata'] = json.loads(thread_data['metadata'])
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse metadata for thread {thread_id} (ID: {thread_data.get('id')})")
                        thread_data['metadata'] = {} # Default to empty dict if parsing fails
                else:
                    # Ensure metadata is a dict if it's None or not a string (though TEXT column should yield string or None)
                    thread_data['metadata'] = thread_data.get('metadata') or {}

            return thread_data
        except Exception as e:
            logger.error(f"Error getting thread {thread_id}: {e}", exc_info=True)
            return None

    async def create_thread(self, user_id: Optional[str] = None, agent_id: Optional[str] = None, title: Optional[str] = None, metadata: Optional[dict] = None) -> Optional[Dict[str, Any]]:
        """Create a new thread. user_id is required."""
        logger.debug(f"Creating new thread for user '{user_id}' with agent '{agent_id}'")
        if not self.db_client:
            self.db_client = await get_db_client()

        actual_user_id = user_id
        # In SQLite mode, if no user_id is provided, use a default one.
        # This is primarily for local development or scenarios where user context might be missing.
        if not actual_user_id and hasattr(self.db_client, 'db_path'): # Heuristic for SQLiteDB
            actual_user_id = await get_or_create_default_user(self.db_client)
            logger.info(f"No user_id provided for create_thread with SQLite backend. Using default user: {actual_user_id}")
        elif not actual_user_id:
            logger.error("User ID is required to create a thread for non-SQLite backends or when default user creation is not applicable.")
            raise ValueError("User ID is required to create a thread.")

        thread_id = str(uuid.uuid4())
        current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

        thread_data_to_insert = {
            'id': thread_id,
            'user_id': actual_user_id,
            'agent_id': agent_id,
            'title': title,
            'metadata': json.dumps(metadata or {}), # Ensure metadata is stored as JSON string
            'created_at': current_time,
            'updated_at': current_time
        }

        try:
            inserted_info = await self.db_client.insert('threads', data=thread_data_to_insert, returning='id')
            if inserted_info and inserted_info.get('id'):
                logger.info(f"Successfully created thread with ID {thread_id} for user {actual_user_id}")
                # Fetch the created thread to return the full object as stored in DB, ensuring correct types
                return await self.get_thread_by_id(thread_id)
            else:
                logger.error(f"Thread insertion failed or did not return ID for thread {thread_id}")
                return None
        except Exception as e:
            logger.error(f"Failed to create thread for user {actual_user_id}: {str(e)}", exc_info=True)
            raise

    async def update_thread_metadata(self, thread_id: str, metadata: dict) -> bool:
        """Update the metadata of a thread."""
        logger.debug(f"Updating metadata for thread {thread_id}")
        if not self.db_client:
            self.db_client = await get_db_client()

        current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
        update_data = {
            'metadata': json.dumps(metadata or {}), # Ensure metadata is stored as JSON string
            'updated_at': current_time
        }

        try:
            # The filters argument for db.update expects a list of tuples: [(column, operator, value)]
            await self.db_client.update('threads', data=update_data, filters=[('id', '=', thread_id)])
            logger.info(f"Successfully updated metadata for thread {thread_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update metadata for thread {thread_id}: {e}", exc_info=True)
            return False

    async def run_thread(
        self,
        thread_id: str,
        system_prompt: Dict[str, Any],
        stream: bool = True,
        temporary_message: Optional[Dict[str, Any]] = None,
        llm_model: str = "gpt-4o",
        llm_temperature: float = 0,
        llm_max_tokens: Optional[int] = None,
        processor_config: Optional[ProcessorConfig] = None,
        tool_choice: ToolChoice = "auto",
        native_max_auto_continues: int = 25,
        max_xml_tool_calls: int = 0,
        include_xml_examples: bool = False,
        enable_thinking: Optional[bool] = False,
        reasoning_effort: Optional[str] = 'low',
        enable_context_manager: bool = True,
        generation: Optional[StatefulGenerationClient] = None,
    ) -> Union[Dict[str, Any], AsyncGenerator]:
        """Run a conversation thread with LLM integration and tool execution.

        Args:
            thread_id: The ID of the thread to run
            system_prompt: System message to set the assistant's behavior
            stream: Use streaming API for the LLM response
            temporary_message: Optional temporary user message for this run only
            llm_model: The name of the LLM model to use
            llm_temperature: Temperature parameter for response randomness (0-1)
            llm_max_tokens: Maximum tokens in the LLM response
            processor_config: Configuration for the response processor
            tool_choice: Tool choice preference ("auto", "required", "none")
            native_max_auto_continues: Maximum number of automatic continuations when
                                      finish_reason="tool_calls" (0 disables auto-continue)
            max_xml_tool_calls: Maximum number of XML tool calls to allow (0 = no limit)
            include_xml_examples: Whether to include XML tool examples in the system prompt
            enable_thinking: Whether to enable thinking before making a decision
            reasoning_effort: The effort level for reasoning
            enable_context_manager: Whether to enable automatic context summarization.

        Returns:
            An async generator yielding response chunks or error dict
        """

        logger.info(f"Starting thread execution for thread {thread_id}")
        logger.info(f"Using model: {llm_model}")
        # Log parameters
        logger.info(f"Parameters: model={llm_model}, temperature={llm_temperature}, max_tokens={llm_max_tokens}")
        logger.info(f"Auto-continue: max={native_max_auto_continues}, XML tool limit={max_xml_tool_calls}")

        # Log model info
        logger.info(f"🤖 Thread {thread_id}: Using model {llm_model}")

        # Apply max_xml_tool_calls if specified and not already set in config
        if max_xml_tool_calls > 0 and not processor_config.max_xml_tool_calls:
            processor_config.max_xml_tool_calls = max_xml_tool_calls

        # Create a working copy of the system prompt to potentially modify
        working_system_prompt = system_prompt.copy()

        # Add XML examples to system prompt if requested, do this only ONCE before the loop
        if include_xml_examples and processor_config.xml_tool_calling:
            xml_examples = self.tool_registry.get_xml_examples()
            if xml_examples:
                examples_content = """
--- XML TOOL CALLING ---

In this environment you have access to a set of tools you can use to answer the user's question. The tools are specified in XML format.
Format your tool calls using the specified XML tags. Place parameters marked as 'attribute' within the opening tag (e.g., `<tag attribute='value'>`). Place parameters marked as 'content' between the opening and closing tags. Place parameters marked as 'element' within their own child tags (e.g., `<tag><element>value</element></tag>`). Refer to the examples provided below for the exact structure of each tool.
String and scalar parameters should be specified as attributes, while content goes between tags.
Note that spaces for string values are not stripped. The output is parsed with regular expressions.

Here are the XML tools available with examples:
"""
                for tag_name, example in xml_examples.items():
                    examples_content += f"<{tag_name}> Example: {example}\\n"

                # # Save examples content to a file
                # try:
                #     with open('xml_examples.txt', 'w') as f:
                #         f.write(examples_content)
                #     logger.debug("Saved XML examples to xml_examples.txt")
                # except Exception as e:
                #     logger.error(f"Failed to save XML examples to file: {e}")

                system_content = working_system_prompt.get('content')

                if isinstance(system_content, str):
                    working_system_prompt['content'] += examples_content
                    logger.debug("Appended XML examples to string system prompt content.")
                elif isinstance(system_content, list):
                    appended = False
                    for item in working_system_prompt['content']: # Modify the copy
                        if isinstance(item, dict) and item.get('type') == 'text' and 'text' in item:
                            item['text'] += examples_content
                            logger.debug("Appended XML examples to the first text block in list system prompt content.")
                            appended = True
                            break
                    if not appended:
                        logger.warning("System prompt content is a list but no text block found to append XML examples.")
                else:
                    logger.warning(f"System prompt content is of unexpected type ({type(system_content)}), cannot add XML examples.")
        # Control whether we need to auto-continue due to tool_calls finish reason
        auto_continue = True
        auto_continue_count = 0

        # Define inner function to handle a single run
        async def _run_once(temp_msg=None):
            try:
                # Ensure processor_config is available in this scope
                nonlocal processor_config
                # Note: processor_config is now guaranteed to exist due to check above

                # 1. Get messages from thread for LLM call
                messages = await self.get_llm_messages(thread_id)

                # 2. Check token count before proceeding
                token_count = 0
                try:
                    from litellm import token_counter
                    # Use the potentially modified working_system_prompt for token counting
                    token_count = token_counter(model=llm_model, messages=[working_system_prompt] + messages)
                    token_threshold = self.context_manager.token_threshold
                    logger.info(f"Thread {thread_id} token count: {token_count}/{token_threshold} ({(token_count/token_threshold)*100:.1f}%)")

                    # if token_count >= token_threshold and enable_context_manager:
                    #     logger.info(f"Thread token count ({token_count}) exceeds threshold ({token_threshold}), summarizing...")
                    #     summarized = await self.context_manager.check_and_summarize_if_needed(
                    #         thread_id=thread_id,
                    #         add_message_callback=self.add_message,
                    #         model=llm_model,
                    #         force=True
                    #     )
                    #     if summarized:
                    #         logger.info("Summarization complete, fetching updated messages with summary")
                    #         messages = await self.get_llm_messages(thread_id)
                    #         # Recount tokens after summarization, using the modified prompt
                    #         new_token_count = token_counter(model=llm_model, messages=[working_system_prompt] + messages)
                    #         logger.info(f"After summarization: token count reduced from {token_count} to {new_token_count}")
                    #     else:
                    #         logger.warning("Summarization failed or wasn't needed - proceeding with original messages")
                    # elif not enable_context_manager:
                    #     logger.info("Automatic summarization disabled. Skipping token count check and summarization.")

                except Exception as e:
                    logger.error(f"Error counting tokens or summarizing: {str(e)}")

                # 3. Prepare messages for LLM call + add temporary message if it exists
                # Use the working_system_prompt which may contain the XML examples
                prepared_messages = [working_system_prompt]

                # Find the last user message index
                last_user_index = -1
                for i, msg in enumerate(messages):
                    if msg.get('role') == 'user':
                        last_user_index = i

                # Insert temporary message before the last user message if it exists
                if temp_msg and last_user_index >= 0:
                    prepared_messages.extend(messages[:last_user_index])
                    prepared_messages.append(temp_msg)
                    prepared_messages.extend(messages[last_user_index:])
                    logger.debug("Added temporary message before the last user message")
                else:
                    # If no user message or no temporary message, just add all messages
                    prepared_messages.extend(messages)
                    if temp_msg:
                        prepared_messages.append(temp_msg)
                        logger.debug("Added temporary message to the end of prepared messages")

                # 4. Prepare tools for LLM call
                openapi_tool_schemas = None
                if processor_config.native_tool_calling:
                    openapi_tool_schemas = self.tool_registry.get_openapi_schemas()
                    logger.debug(f"Retrieved {len(openapi_tool_schemas) if openapi_tool_schemas else 0} OpenAPI tool schemas")


                uncompressed_total_token_count = token_counter(model=llm_model, messages=prepared_messages)

                if uncompressed_total_token_count > (llm_max_tokens or (100 * 1000)):
                    _i = 0 # Count the number of ToolResult messages
                    for msg in reversed(prepared_messages): # Start from the end and work backwards
                        if "content" in msg and msg['content'] and "ToolResult" in msg['content']: # Only compress ToolResult messages
                            _i += 1 # Count the number of ToolResult messages
                            msg_token_count = token_counter(messages=[msg]) # Count the number of tokens in the message
                            if msg_token_count > 5000: # If the message is too long
                                if _i > 1: # If this is not the most recent ToolResult message
                                    message_id = msg.get('message_id') # Get the message_id
                                    if message_id:
                                        msg["content"] = msg["content"][:10000] + "... (truncated)" + f"\n\nThis message is too long, use the expand-message tool with message_id \"{message_id}\" to see the full message" # Truncate the message
                                else:
                                    msg["content"] = msg["content"][:200000] + f"\n\nThis message is too long, repeat relevant information in your response to remember it" # Truncate to 300k characters to avoid overloading the context at once, but don't truncate otherwise

                compressed_total_token_count = token_counter(model=llm_model, messages=prepared_messages)
                logger.info(f"token_compression: {uncompressed_total_token_count} -> {compressed_total_token_count}") # Log the token compression for debugging later

                # 5. Make LLM API call
                logger.debug("Making LLM API call")
                try:
                    if generation:
                        generation.update(
                            input=prepared_messages,
                            start_time=datetime.datetime.now(datetime.timezone.utc),
                            model=llm_model,
                            model_parameters={
                              "max_tokens": llm_max_tokens,
                              "temperature": llm_temperature,
                              "enable_thinking": enable_thinking,
                              "reasoning_effort": reasoning_effort,
                              "tool_choice": tool_choice,
                              "tools": openapi_tool_schemas,
                            }
                        )
                    llm_response = await make_llm_api_call(
                        prepared_messages, # Pass the potentially modified messages
                        llm_model,
                        temperature=llm_temperature,
                        max_tokens=llm_max_tokens,
                        tools=openapi_tool_schemas,
                        tool_choice=tool_choice if processor_config.native_tool_calling else None,
                        stream=stream,
                        enable_thinking=enable_thinking,
                        reasoning_effort=reasoning_effort
                    )
                    logger.debug("Successfully received raw LLM API response stream/object")

                except Exception as e:
                    logger.error(f"Failed to make LLM API call: {str(e)}", exc_info=True)
                    raise

                # 6. Process LLM response using the ResponseProcessor
                if stream:
                    logger.debug("Processing streaming response")
                    response_generator = self.response_processor.process_streaming_response(
                        llm_response=llm_response,
                        thread_id=thread_id,
                        config=processor_config,
                        prompt_messages=prepared_messages,
                        llm_model=llm_model,
                    )

                    return response_generator
                else:
                    logger.debug("Processing non-streaming response")
                    # Pass through the response generator without try/except to let errors propagate up
                    response_generator = self.response_processor.process_non_streaming_response(
                        llm_response=llm_response,
                        thread_id=thread_id,
                        config=processor_config,
                        prompt_messages=prepared_messages,
                        llm_model=llm_model,
                    )
                    return response_generator # Return the generator

            except Exception as e:
                logger.error(f"Error in run_thread: {str(e)}", exc_info=True)
                # Return the error as a dict to be handled by the caller
                return {
                    "status": "error",
                    "message": str(e)
                }

        # Define a wrapper generator that handles auto-continue logic
        async def auto_continue_wrapper():
            nonlocal auto_continue, auto_continue_count

            while auto_continue and (native_max_auto_continues == 0 or auto_continue_count < native_max_auto_continues):
                # Reset auto_continue for this iteration
                auto_continue = False

                # Run the thread once, passing the potentially modified system prompt
                # Pass temp_msg only on the first iteration
                try:
                    response_gen = await _run_once(temporary_message if auto_continue_count == 0 else None)

                    # Handle error responses
                    if isinstance(response_gen, dict) and "status" in response_gen and response_gen["status"] == "error":
                        logger.error(f"Error in auto_continue_wrapper: {response_gen.get('message', 'Unknown error')}")
                        yield response_gen
                        return  # Exit the generator on error

                    # Process each chunk
                    try:
                        async for chunk in response_gen:
                            # Check if this is a finish reason chunk with tool_calls or xml_tool_limit_reached
                            if chunk.get('type') == 'finish':
                                if chunk.get('finish_reason') == 'tool_calls':
                                    # Only auto-continue if enabled (max > 0)
                                    if native_max_auto_continues > 0:
                                        logger.info(f"Detected finish_reason='tool_calls', auto-continuing ({auto_continue_count + 1}/{native_max_auto_continues})")
                                        auto_continue = True
                                        auto_continue_count += 1
                                        # Don't yield the finish chunk to avoid confusing the client
                                        continue
                                elif chunk.get('finish_reason') == 'xml_tool_limit_reached':
                                    # Don't auto-continue if XML tool limit was reached
                                    logger.info(f"Detected finish_reason='xml_tool_limit_reached', stopping auto-continue")
                                    auto_continue = False
                                    # Still yield the chunk to inform the client

                            # Otherwise just yield the chunk normally
                            yield chunk

                        # If not auto-continuing, we're done
                        if not auto_continue:
                            break
                    except Exception as e:
                        # If there's an exception, log it, yield an error status, and stop execution
                        logger.error(f"Error in auto_continue_wrapper generator: {str(e)}", exc_info=True)
                        yield {
                            "type": "status",
                            "status": "error",
                            "message": f"Error in thread processing: {str(e)}"
                        }
                        return  # Exit the generator on any error
                except Exception as outer_e:
                    # Catch exceptions from _run_once itself
                    logger.error(f"Error executing thread: {str(outer_e)}", exc_info=True)
                    yield {
                        "type": "status",
                        "status": "error",
                        "message": f"Error executing thread: {str(outer_e)}"
                    }
                    return  # Exit immediately on exception from _run_once

            # If we've reached the max auto-continues, log a warning
            if auto_continue and auto_continue_count >= native_max_auto_continues:
                logger.warning(f"Reached maximum auto-continue limit ({native_max_auto_continues}), stopping.")
                yield {
                    "type": "content",
                    "content": f"\n[Agent reached maximum auto-continue limit of {native_max_auto_continues}]"
                }

        # If auto-continue is disabled (max=0), just run once
        if native_max_auto_continues == 0:
            logger.info("Auto-continue is disabled (native_max_auto_continues=0)")
            # Pass the potentially modified system prompt and temp message
            return await _run_once(temporary_message)

        # Otherwise return the auto-continue wrapper generator
        return auto_continue_wrapper()
