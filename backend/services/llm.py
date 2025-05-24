"""
LLM API interface for making calls to Google Gemini models.
"""

import os
import asyncio
import json
from typing import Union, Dict, Any, Optional, AsyncGenerator, List

import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError, InvalidArgument, PermissionDenied, ResourceExhausted

from utils.logger import logger
from utils.config import config

# Constants
MAX_RETRIES = 3 # Increased for potentially more transient network issues
RETRY_DELAY_BASE = 1  # seconds
RATE_LIMIT_DELAY = 60 # More specific delay for rate limit errors from Gemini

class LLMError(Exception):
    """Base exception for LLM-related errors."""
    pass

class LLMRetryError(LLMError):
    """Exception raised when retries are exhausted."""
    pass

def configure_gemini() -> None:
    """Configure the Google Gemini API key."""
    api_key = config.GEMINI_API_KEY
    if api_key:
        try:
            genai.configure(api_key=api_key)
            logger.info("Successfully configured Google Gemini API.")
        except Exception as e:
            logger.error(f"Failed to configure Google Gemini API: {str(e)}", exc_info=True)
            # Potentially raise an error here if configuration is critical at startup
    else:
        logger.warning("GEMINI_API_KEY not found in environment variables. Gemini API calls will fail.")

async def handle_gemini_error(error: Exception, attempt: int, max_attempts: int) -> None:
    """Handle Gemini API errors with appropriate delays and logging."""
    if isinstance(error, ResourceExhausted): # Specific to Gemini for rate limits
        delay = RATE_LIMIT_DELAY
        logger.warning(f"Rate limit error on attempt {attempt + 1}/{max_attempts}: {str(error)}. Waiting {delay}s.")
    elif isinstance(error, (GoogleAPIError, asyncio.TimeoutError)): # General API errors or timeouts
        delay = RETRY_DELAY_BASE * (2 ** attempt)  # Exponential backoff
        logger.warning(f"API error on attempt {attempt + 1}/{max_attempts}: {str(error)}. Waiting {delay}s.")
    else: # Unexpected errors
        logger.error(f"Unexpected error: {str(error)}", exc_info=True)
        raise LLMError(f"Unexpected API error: {str(error)}") # Re-raise if not a known retryable error

    await asyncio.sleep(delay)


def _translate_messages_to_gemini_format(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Translates a list of messages from a generic format to Gemini's format.
    Gemini expects 'parts' to be a list, and roles to be 'user' or 'model'.
    The last message is typically the current prompt.
    """
    gemini_messages = []
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")

        # Adapt role names if necessary (e.g. "system" or "assistant" to "model")
        if role == "assistant":
            role = "model"
        elif role == "system":
            # Gemini prefers system instructions via `GenerativeModel(system_instruction=...)`
            # or as the first part of a 'user' message.
            # For now, we'll make it a model message or let it be part of the user message.
            # This might need refinement based on how system prompts are used.
            role = "model" # Or handle as a special case if needed

        if not isinstance(content, list):
            # Gemini expects content to be a list of Parts.
            # If it's a string, wrap it in the standard text part structure.
            # If it's a list of dicts (e.g. for images or tool calls), ensure it's correctly formatted.
            if isinstance(content, str):
                content = [{"text": content}]
            else: # Attempt to pass through if already structured (e.g. for tool calls/responses)
                pass


        gemini_messages.append({"role": role, "parts": content if isinstance(content, list) else [{"text": str(content)}]})
    return gemini_messages

def _translate_tools_to_gemini_format(tools: Optional[List[Dict[str, Any]]]) -> Optional[List[genai.types.Tool]]:
    """
    Translates a list of tool definitions from a generic format to Gemini's Tool object.
    Example generic tool:
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "The city and state"}
                },
                "required": ["location"]
            }
        }
    }
    """
    if not tools:
        return None

    gemini_tools = []
    for tool_dict in tools:
        if tool_dict.get("type") == "function":
            func_data = tool_dict["function"]
            # Ensure parameters is a dict, not a string, before passing
            parameters_dict = func_data.get("parameters")
            if isinstance(parameters_dict, str):
                try:
                    parameters_dict = json.loads(parameters_dict)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse parameters JSON string for tool {func_data.get('name')}: {parameters_dict}")
                    continue # Skip this tool or raise error

            declaration = genai.types.FunctionDeclaration(
                name=func_data.get("name"),
                description=func_data.get("description"),
                parameters=parameters_dict
            )
            gemini_tools.append(genai.types.Tool(function_declarations=[declaration]))
    logger.debug(f"Translated {len(gemini_tools)} tools to Gemini format.")
    return gemini_tools if gemini_tools else None


def _parse_gemini_response_to_choices(response: genai.types.GenerateContentResponse, stream: bool = False) -> Dict[str, Any]:
    """
    Parses the Gemini API response into a dictionary format similar to OpenAI's,
    focusing on 'choices' with 'message' and 'tool_calls'.
    """
    choices = []
    finish_reason = None
    usage_metadata = None

    if hasattr(response, 'usage_metadata'):
        usage_metadata = {
            "prompt_token_count": response.usage_metadata.prompt_token_count,
            "candidates_token_count": response.usage_metadata.candidates_token_count,
            "total_token_count": response.usage_metadata.total_token_count
        }

    for candidate in response.candidates:
        message_content = []
        tool_calls = []
        # Determine finish reason from the candidate if available
        # Gemini's finish_reason can be on the candidate or top-level response for non-streaming
        candidate_finish_reason = candidate.finish_reason.name if candidate.finish_reason else None


        for part in candidate.content.parts:
            if part.text:
                message_content.append({"type": "text", "text": part.text})
            if hasattr(part, "function_call") and part.function_call:
                fc = part.function_call
                tool_calls.append({
                    "id": f"call_{fc.name}_{os.urandom(4).hex()}", # Gemini doesn't provide an ID, so generate one
                    "type": "function",
                    "function": {
                        "name": fc.name,
                        "arguments": json.dumps(dict(fc.args)) if fc.args else "{}"
                    }
                })

        # Consolidate text parts into a single string for 'content' if no tool calls
        # otherwise, keep as list of parts.
        final_content = ""
        if not tool_calls:
            final_content = "".join([item["text"] for item in message_content if item["type"] == "text"])
        else: # If there are tool calls, the content should reflect the parts structure if needed by agent
            final_content = message_content # Or a specific format the agent expects for mixed content

        choice = {
            "message": {
                "role": "model", # Gemini responses are from the 'model'
                "content": final_content,
                "tool_calls": tool_calls if tool_calls else None
            },
            "finish_reason": candidate_finish_reason,
            # Other fields like 'index' can be added if needed
        }
        choices.append(choice)
    
    # For non-streaming, the top-level response.prompt_feedback.finish_reason might be more relevant
    # or response.candidates[0].finish_reason.
    # For streaming, this function is called per chunk, and finish_reason is on the *last* chunk's candidate.
    if not stream and response.candidates:
        finish_reason = response.candidates[0].finish_reason.name if response.candidates[0].finish_reason else None
    elif stream and choices: # Use the finish reason from the first choice if streaming
        finish_reason = choices[0].get("finish_reason")


    return {
        "choices": choices,
        "usage": usage_metadata,
        "finish_reason_top_level": finish_reason # Providing a top-level one for convenience
    }


async def generate_gemini_content(
    messages: List[Dict[str, Any]],
    model_name: str = "gemini-1.5-flash-latest", # Default to a reasonable model
    temperature: float = 0.7,
    top_p: Optional[float] = None,
    max_tokens: Optional[int] = None, # Gemini uses max_output_tokens
    stream: bool = False,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: Optional[str] = None, # Gemini uses tool_config with specific modes
    system_instruction: Optional[str] = None,
) -> Union[Dict[str, Any], AsyncGenerator[Dict[str, Any], None]]:
    """
    Makes an API call to a Google Gemini language model.

    Args:
        messages: List of message dictionaries for the conversation.
                  The last message is the current user prompt.
        model_name: Name of the Gemini model to use.
        temperature: Sampling temperature (0.0-1.0).
        top_p: Top-p sampling parameter.
        max_tokens: Maximum tokens in the response (maps to max_output_tokens).
        stream: Whether to stream the response.
        tools: List of tool definitions for function calling.
        tool_choice: Controls how the model uses tools (e.g., "auto", "any", "none", or specific function).
                     Gemini's `tool_config` handles this.
        system_instruction: System-level instructions for the model.

    Returns:
        Union[Dict[str, Any], AsyncGenerator[Dict[str, Any], None]]:
            API response (dictionary) or an async generator of response chunks.
    """
    logger.info(f"Making Gemini API call to model: {model_name} (Stream: {stream})")

    generation_config_params = {
        "temperature": temperature,
    }
    if top_p is not None:
        generation_config_params["top_p"] = top_p
    if max_tokens is not None:
        generation_config_params["max_output_tokens"] = max_tokens
    
    generation_config = genai.types.GenerationConfig(**generation_config_params)
    
    gemini_tools_formatted = _translate_tools_to_gemini_format(tools)
    
    # Handle tool_choice for Gemini's tool_config
    gemini_tool_config = None
    if gemini_tools_formatted:
        if tool_choice:
            if tool_choice == "auto":
                gemini_tool_config = {"mode": "auto"}
            elif tool_choice == "any":
                 gemini_tool_config = {"mode": "any"} # Model decides to use a tool or not
            elif tool_choice == "none":
                gemini_tool_config = {"mode": "none"} # Model will not use tools
            elif tool_choice.startswith("tool_"): # Specific tool e.g. "tool_get_current_weather"
                # This implies a specific function must be called.
                # Gemini's `allowed_function_names` expects a list of names.
                # Assuming tool_choice format is "tool_FUNCTION_NAME"
                func_name = tool_choice.split("tool_")[-1]
                gemini_tool_config = {"mode": "required", "allowed_function_names": [func_name]}
            else: # Default to auto if value is not recognized
                 gemini_tool_config = {"mode": "auto"}
        else: # Default to auto if tools are provided but no specific choice
            gemini_tool_config = {"mode": "auto"}
        logger.debug(f"Using Gemini tool_config: {gemini_tool_config}")


    # Gemini handles history differently. The `messages` are usually passed directly.
    # The `genai.GenerativeModel` can take `system_instruction`.
    # The `start_chat` method is for multi-turn conversations.
    # For a single generation, pass all `messages` (history + current prompt) to `generate_content`.

    model_kwargs = {"model_name": model_name}
    if system_instruction:
        model_kwargs["system_instruction"] = system_instruction
    if gemini_tools_formatted:
        model_kwargs["tools"] = gemini_tools_formatted
    
    model = genai.GenerativeModel(**model_kwargs)

    # Separate history and current prompt for Gemini's `send_message` if using chat,
    # or combine for `generate_content`. For now, assuming `generate_content` with full history.
    # The _translate_messages_to_gemini_format handles the roles.
    # Gemini's `generate_content` takes the whole conversation as `contents`.
    processed_messages = _translate_messages_to_gemini_format(messages)
    
    # Ensure there's content to send
    if not processed_messages:
        raise LLMError("No messages provided to generate content.")

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            logger.debug(f"Gemini API Call Attempt {attempt + 1}/{MAX_RETRIES} with model {model_name}")
            # logger.debug(f"Gemini Request: Messages: {json.dumps(processed_messages, indent=2)}, Config: {generation_config}")
            
            if stream:
                async def stream_generator():
                    try:
                        response_stream = await model.generate_content_async(
                            contents=processed_messages,
                            generation_config=generation_config,
                            stream=True,
                            tool_config=gemini_tool_config
                        )
                        async for chunk in response_stream:
                            # logger.debug(f"Gemini Stream Chunk: {chunk}")
                            parsed_chunk = _parse_gemini_response_to_choices(chunk, stream=True)
                            # Filter out empty choices which can happen in stream before content/tool_calls
                            if parsed_chunk["choices"]:
                                yield parsed_chunk
                    except (GoogleAPIError, asyncio.TimeoutError, AttributeError) as e: # AttributeError for model.generate_content_async if not available
                        logger.error(f"Gemini streaming error: {str(e)}", exc_info=True)
                        # This error needs to be propagated or handled to stop the generator gracefully
                        # Yielding an error message or raising a specific exception might be options
                        # For now, let it be caught by the outer try-except if it's a GoogleAPIError
                        # or re-raise if it's something else critical for the stream.
                        if not isinstance(e, GoogleAPIError): # e.g. AttributeError
                             raise LLMError(f"Gemini SDK error during streaming: {str(e)}") from e
                        raise # Re-raise GoogleAPIError to be handled by retry logic

                return stream_generator()
            else:
                response = await model.generate_content_async(
                    contents=processed_messages,
                    generation_config=generation_config,
                    tool_config=gemini_tool_config
                )
                # logger.debug(f"Gemini Response (non-stream): {response}")
                return _parse_gemini_response_to_choices(response)

        except (GoogleAPIError, asyncio.TimeoutError) as e:
            last_error = e
            await handle_gemini_error(e, attempt, MAX_RETRIES)
        except Exception as e: # Catch-all for unexpected errors during the attempt
            logger.error(f"Unexpected error during Gemini API call attempt {attempt + 1}: {str(e)}", exc_info=True)
            # Depending on the error, might not be retryable.
            # For now, let it be caught by the generic LLMError after retries.
            last_error = e
            # If it's not a GoogleAPIError, retrying might not help.
            if not isinstance(e, GoogleAPIError):
                 raise LLMError(f"Non-API error during Gemini call: {str(e)}") from e
            # If it is a GoogleAPIError but not handled by handle_gemini_error's specific types,
            # it will use the generic exponential backoff.

    error_msg = f"Failed to make Gemini API call to {model_name} after {MAX_RETRIES} attempts."
    if last_error:
        error_msg += f" Last error: {type(last_error).__name__}: {str(last_error)}"
    logger.error(error_msg, exc_info=True if last_error else False)
    raise LLMRetryError(error_msg) from last_error

# Configure Gemini when the module is loaded.
configure_gemini()

async def main_test():
    """ Main function to test the Gemini integration. """
    logger.info("Starting Gemini LLM service test...")

    # Basic text generation test
    try:
        logger.info("\n--- Test 1: Basic Text Generation (Non-Streaming) ---")
        messages_text = [{"role": "user", "content": "Tell me a short story about a curious robot."}]
        response_text = await generate_gemini_content(messages_text, model_name="gemini-1.5-flash-latest")
        logger.info(f"Response (text): {json.dumps(response_text, indent=2)}")
        if response_text["choices"] and response_text["choices"][0]["message"]["content"]:
            logger.info("Test 1 PASSED.")
        else:
            logger.error("Test 1 FAILED or got empty response.")
    except Exception as e:
        logger.error(f"Test 1 FAILED: {str(e)}", exc_info=True)

    # Streaming text generation test
    try:
        logger.info("\n--- Test 2: Streaming Text Generation ---")
        messages_stream = [{"role": "user", "content": "Write a poem about the stars, in 3 stanzas."}]
        response_stream_gen = await generate_gemini_content(messages_stream, model_name="gemini-1.5-flash-latest", stream=True)
        full_streamed_content = []
        async for chunk in response_stream_gen:
            logger.info(f"Stream chunk: {json.dumps(chunk, indent=2)}")
            if chunk["choices"] and chunk["choices"][0]["message"]["content"]:
                 full_streamed_content.append(chunk["choices"][0]["message"]["content"])
        logger.info(f"Full streamed response: {''.join(full_streamed_content)}")
        if full_streamed_content:
            logger.info("Test 2 PASSED.")
        else:
            logger.error("Test 2 FAILED or got empty streamed response.")
    except Exception as e:
        logger.error(f"Test 2 FAILED: {str(e)}", exc_info=True)

    # Function calling test
    try:
        logger.info("\n--- Test 3: Function Calling (Non-Streaming) ---")
        tools_def = [
            {
                "type": "function",
                "function": {
                    "name": "get_current_weather",
                    "description": "Get the current weather in a given location.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {"type": "string", "description": "The city and state, e.g., San Francisco, CA"},
                            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature unit"}
                        },
                        "required": ["location"]
                    }
                }
            }
        ]
        messages_func = [{"role": "user", "content": "What's the weather like in Boston in Celsius?"}]
        response_func = await generate_gemini_content(
            messages_func,
            model_name="gemini-1.5-flash-latest", # Ensure this model supports function calling well
            tools=tools_def,
            tool_choice="auto" # or "any"
        )
        logger.info(f"Response (function calling): {json.dumps(response_func, indent=2)}")

        if response_func["choices"] and response_func["choices"][0]["message"]["tool_calls"]:
            tool_call = response_func["choices"][0]["message"]["tool_calls"][0]
            logger.info(f"Detected tool call: {tool_call['function']['name']} with args {tool_call['function']['arguments']}")
            
            # Simulate providing function response
            func_response_messages = messages_func + [
                {"role": "model", "content": None, "tool_calls": response_func["choices"][0]["message"]["tool_calls"]}, # Original model response with tool call
                {"role": "tool", "content": json.dumps({"temperature": "22", "unit": "celsius", "description": "Sunny"}), "tool_call_id": tool_call["id"]}
            ]
            
            logger.info("\n--- Test 3b: Sending Function Response ---")
            final_response = await generate_gemini_content(
                func_response_messages,
                model_name="gemini-1.5-flash-latest",
                tools=tools_def # Important to pass tools again
            )
            logger.info(f"Final response after tool call: {json.dumps(final_response, indent=2)}")
            if final_response["choices"] and final_response["choices"][0]["message"]["content"]:
                 logger.info("Test 3 (including function response) PASSED.")
            else:
                logger.error("Test 3b FAILED to get final answer.")

        elif response_func["choices"] and response_func["choices"][0]["message"]["content"]:
             logger.warning("Test 3 SKIPPED function call, LLM answered directly. This is valid but doesn't test tool use.")
        else:
            logger.error("Test 3 FAILED to get a tool call or direct answer.")

    except Exception as e:
        logger.error(f"Test 3 FAILED: {str(e)}", exc_info=True)

    # Test with system instruction
    try:
        logger.info("\n--- Test 4: System Instruction Test (Non-Streaming) ---")
        messages_sys = [{"role": "user", "content": "Who are you?"}]
        system_instruction_text = "You are a helpful pirate assistant. You always talk like a pirate."
        response_sys = await generate_gemini_content(
            messages_sys,
            model_name="gemini-1.5-flash-latest",
            system_instruction=system_instruction_text
        )
        logger.info(f"Response (system instruction): {json.dumps(response_sys, indent=2)}")
        if response_sys["choices"] and "ahoy" in response_sys["choices"][0]["message"]["content"].lower(): # Example check
            logger.info("Test 4 PASSED.")
        else:
            logger.error("Test 4 FAILED or response did not reflect system instruction.")
    except Exception as e:
        logger.error(f"Test 4 FAILED: {str(e)}", exc_info=True)


if __name__ == "__main__":
    # This basic configuration is for testing the script directly.
    # In a real application, logging might be configured elsewhere.
    import logging
    logging.basicConfig(level=logging.INFO)
    # Note: GEMINI_API_KEY must be set in the environment for these tests to run.
    if not config.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not set. Tests will likely fail or be skipped.")
        logger.error("Please set the GEMINI_API_KEY environment variable.")
    else:
        asyncio.run(main_test())

"""
TODO & Considerations:
- Gemini Message Role Translation:
  - "system": Gemini prefers system instructions via `GenerativeModel(system_instruction=...)` or as the first part of a 'user' message. The current `_translate_messages_to_gemini_format` maps "system" to "model", which might not be optimal. This needs review based on how system prompts are constructed and used by the agent. If `system_instruction` parameter in `generate_gemini_content` is used, then system role messages in the `messages` list might need special handling (e.g. removed or prepended to user message).
  - "tool": For providing responses from a tool back to the model, Gemini expects a `Part.from_function_response`. The current message translation might need to be augmented to correctly format these `tool` role messages. The test case for function calling manually constructs this, but a generic solution in `_translate_messages_to_gemini_format` would be better.

- Gemini Tool Choice/Tool Config:
  - The `tool_choice` parameter is translated to Gemini's `tool_config`. The "required" mode with `allowed_function_names` is an interpretation of a specific tool choice like "tool_FUNCTION_NAME". This needs to be validated against common use cases.
  - If `tool_choice` is a dictionary (more complex scenarios), it might need direct translation to `tool_config`.

- Error Handling and Retries:
  - `handle_gemini_error` has specific handling for `ResourceExhausted` (rate limits). Other `GoogleAPIError` subtypes (e.g., `InternalServerError`, `ServiceUnavailable`) could also benefit from specific retry strategies or logging.
  - Timeouts: `asyncio.TimeoutError` is caught. Consider if `google.api_core.exceptions.DeadlineExceeded` should also be handled specifically for retries.

- Response Parsing (`_parse_gemini_response_to_choices`):
  - Tool Call IDs: Gemini doesn't provide IDs for tool calls in the request. An ID is generated (`call_{fc.name}_{os.urandom(4).hex()}`). This is necessary for mapping tool responses back. Ensure this ID generation is robust enough.
  - Finish Reason: The logic for determining `finish_reason` (candidate vs. top-level) is present. Test thoroughly with streaming and non-streaming, especially error cases or safety cutoffs. Gemini might provide safety ratings and other feedback that could be parsed and returned.
  - Mixed Content: If a model responds with both text and a tool call in the same turn, how this is represented in `message.content` and `message.tool_calls` needs to be consistent with agent expectations. Current parsing puts all text into `content` and tool calls into `tool_calls`.

- Streaming (`generate_gemini_content` stream_generator):
  - Error propagation from the async generator needs to be robust. If `model.generate_content_async` itself throws an error after some chunks, how is this handled by the caller? The current code re-raises `GoogleAPIError` for retries, and `LLMError` for others.
  - Empty Chunks: The code filters out choices if empty. This is usually fine as some chunks in Gemini stream might be metadata or empty content before actual text/tool_calls.

- Configuration and Initialization:
  - `configure_gemini()` is called at module load. If the API key is not present, it logs a warning. Consider if an error should be raised if the key is missing but the service is expected to function.

- Gemini Specific Features:
  - Safety Settings: Gemini API allows specifying `safety_settings`. This is not currently exposed but could be added as a parameter to `generate_gemini_content`.
  - System Instructions: Added `system_instruction` parameter to `GenerativeModel`. This is a good way to provide system prompts.
  - Content Types: Current implementation primarily handles text and function calls. Gemini supports other content types (e.g., images). If needed, `_translate_messages_to_gemini_format` and response parsing would need to handle these.

- Logging:
  - Sensitive data in logs: Request/response logging is commented out (`logger.debug(f"Gemini Request: ...")`). Ensure that if uncommented or if more detailed logging is added, sensitive information (like API keys if they were part of params, or PII in messages) is appropriately handled/redacted if necessary for production. (API key is not in params here, which is good).

- Testing:
  - The `main_test` function is a good start. More edge cases should be tested:
    - Errors during stream.
    - Model responding with no tool call when one is expected (and `tool_choice` allows it).
    - Model directly answering when a tool call was "required" (if this scenario is possible with Gemini's `tool_config`).
    - Different `finish_reason` types.
    - Max tokens reached.
    - Invalid API key.
"""
