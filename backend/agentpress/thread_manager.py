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
from services.supabase import DBConnection
from utils.logger import logger

# Type alias for tool choice
ToolChoice = Literal["auto", "required", "none"]

class ThreadManager:
    """Manages conversation threads with LLM models and tool execution.

    Provides comprehensive conversation management, handling message threading,
    tool registration, and LLM interactions with support for both standard and
    XML-based tool execution patterns.
    """

    def __init__(self):
        """Initialize ThreadManager."""
        self.db = DBConnection()
        self.tool_registry = ToolRegistry()
        self.response_processor = ResponseProcessor(
            tool_registry=self.tool_registry,
            add_message_callback=self.add_message
        )
        self.context_manager = ContextManager()

    def add_tool(
        self,
        tool_class: Type[Tool],
        function_names: Optional[List[str]] = None,
        **kwargs
    ):
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
        """Add a message to the thread in the database."""
        logger.debug(f"Adding message of type '{type}' to thread {thread_id}")
        client = await self.db.client

        data_to_insert = {
            'thread_id': thread_id,
            'type': type,
            'content': json.dumps(content) if isinstance(content, (dict, list)) else content,
            'is_llm_message': is_llm_message,
            'metadata': json.dumps(metadata or {})
        }

        try:
            result = await client.table('messages') \
                .insert(data_to_insert, returning='representation').execute()
            logger.info(f"Successfully added message to thread {thread_id}")
            if result.data and isinstance(result.data, list) and 'message_id' in result.data[0]:
                return result.data[0]
            logger.error(f"Unexpected insert result for thread {thread_id}: {result.data}")
            return None
        except Exception as e:
            logger.error(f"Failed to add message to thread {thread_id}: {e}", exc_info=True)
            raise

    async def get_llm_messages(
        self,
        thread_id: str
    ) -> List[Dict[str, Any]]:
        """Fetch formatted messages for LLM calls, handling summaries."""
        logger.debug(f"Getting messages for thread {thread_id}")
        client = await self.db.client
        try:
            result = await client.rpc(
                'get_llm_formatted_messages',
                {'p_thread_id': thread_id}
            ).execute()
            if not result.data:
                return []

            messages = []
            for item in result.data:
                if isinstance(item, str):
                    try:
                        messages.append(json.loads(item))
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON message: {item}")
                else:
                    messages.append(item)

            # Ensure tool_calls arguments are stringified
            for msg in messages:
                calls = msg.get('tool_calls') or []
                for call in calls:
                    func = call.get('function')
                    if func and 'arguments' in func and not isinstance(func['arguments'], str):
                        func['arguments'] = json.dumps(func['arguments'])

            return messages
        except Exception as e:
            logger.error(f"Error fetching messages for thread {thread_id}: {e}", exc_info=True)
            return []

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
        enable_context_manager: bool = True
    ) -> Union[Dict[str, Any], AsyncGenerator]:
        """Run a conversation thread with LLM integration and tool execution."""
        logger.info(f"Starting thread {thread_id} with model {llm_model}")

        # Apply XML tool limits if provided
        if max_xml_tool_calls > 0 and processor_config:
            processor_config.max_xml_tool_calls = max_xml_tool_calls

        # Snapshot the base prompt for safe reuse
        base_prompt = system_prompt.copy()

        # Optionally inject XML examples once
        if include_xml_examples and processor_config and processor_config.xml_tool_calling:
            xml_examples = self.tool_registry.get_xml_examples()
            if xml_examples:
                snippet = """
--- XML TOOL CALLING ---

Use these tags for tool calls:
"""
                for tag, ex in xml_examples.items():
                    snippet += f"<{tag}> Example: {ex}\n"
                content = base_prompt.get('content')
                if isinstance(content, str):
                    base_prompt['content'] += snippet
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get('type') == 'text':
                            item['text'] += snippet
                            break

        auto_continue = True
        auto_continue_count = 0

        async def _run_once(temp_msg=None):
            try:
                # Create a fresh copy of the prompt per run to avoid duplication
                working_prompt = {**base_prompt}

                # 1. Load messages
                messages = await self.get_llm_messages(thread_id)

                # 2. Fetch past memories
                if messages:
                    last_user = messages[-1]
                    query = last_user.get('content')
                    mem_tool_info = self.tool_registry.get_tool('retrieve_memories')
                    if mem_tool_info:
                        tool_res = await mem_tool_info['instance'].retrieve_memories(
                            thread_id=thread_id,
                            query=query,
                            memory_types=['semantic', 'procedural'],
                            limit=5,
                            min_importance=0.3
                        )
                        # Check ToolResult.success attribute
                        if getattr(tool_res, 'success', False):
                            try:
                                data = json.loads(tool_res.output)
                            except json.JSONDecodeError:
                                logger.error("Failed to parse memory tool output", exc_info=True)
                                data = {}
                            mems = data.get('memories', [])
                            if mems:
                                bullets = '\n'.join(f"- {m['content']}" for m in mems)
                                working_prompt['content'] = (
                                    working_prompt.get('content', '') +
                                    f"\n\n— Relevant Past Memories —\n{bullets}\n"
                                )

                # 3. Token check & summarization
                if llm_max_tokens and self.context_manager:
                    try:
                        from litellm import count_message_tokens
                        tc = count_message_tokens([working_prompt] + messages)
                        if tc + llm_max_tokens > getattr(self.context_manager, 'token_threshold', float('inf')) and enable_context_manager:
                            summary = await self.context_manager.summarize_context(thread_id, messages)
                            messages = [summary]
                    except ImportError:
                        pass

                # 4. Assemble inputs
                prepared = [working_prompt]
                if temporary_message and temp_msg:
                    prepared.extend(messages[:-1])
                    prepared.append(temp_msg)
                    prepared.append(messages[-1])
                else:
                    prepared.extend(messages)
                    if temporary_message:
                        prepared.append(temporary_message)

                # 5. Prepare tool schemas
                tools = None
                if processor_config and processor_config.native_tool_calling:
                    tools = self.tool_registry.get_openapi_schemas()

                # 6. Call LLM
                llm_resp = await make_llm_api_call(
                    prepared,
                    llm_model,
                    temperature=llm_temperature,
                    max_tokens=llm_max_tokens,
                    tools=tools,
                    tool_choice=tool_choice,
                    stream=stream,
                    enable_thinking=enable_thinking,
                    reasoning_effort=reasoning_effort
                )

                # 7. Process response
                if stream:
                    return self.response_processor.process_streaming_response(
                        llm_response=llm_resp,
                        thread_id=thread_id,
                        config=processor_config,
                        prompt_messages=prepared,
                        llm_model=llm_model
                    )
                return self.response_processor.process_non_streaming_response(
                    llm_response=llm_resp,
                    thread_id=thread_id,
                    config=processor_config,
                    prompt_messages=prepared,
                    llm_model=llm_model
                )

            except Exception as e:
                logger.error(f"Error in _run_once for thread {thread_id}: {e}", exc_info=True)
                return {"status": "error", "message": str(e)}

        async def auto_continue_wrapper():
            nonlocal auto_continue, auto_continue_count
            while auto_continue and (native_max_auto_continues == 0 or auto_continue_count < native_max_auto_continues):
                auto_continue = False
                gen = await _run_once(temporary_message if auto_continue_count == 0 else None)
                if isinstance(gen, dict):
                    yield gen
                    return
                async for chunk in gen:
                    if chunk.get('type') == 'finish' and chunk.get('finish_reason') == 'tool_calls':
                        if native_max_auto_continues > 0:
                            auto_continue = True
                            auto_continue_count += 1
                            continue
                    yield chunk
                if not auto_continue:
                    break
            if auto_continue_count >= native_max_auto_continues:
                yield {"type": "content", "content": f"\n[Reached max auto-continue of {native_max_auto_continues}]"}

        # Final return logic
        if native_max_auto_continues == 0:
            return await _run_once(temporary_message)
        return auto_continue_wrapper()