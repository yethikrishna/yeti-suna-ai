# backend/agent/tools/datetime_tool.py
from datetime import datetime, timezone, timedelta
import json

from agentpress.tool import Tool, ToolResult, openapi_schema, xml_schema
from utils.logger import logger

class CurrentDateTimeTool(Tool):
    """Tool to provide the current date and time."""

    def __init__(self):
        """Initialize the tool."""
        super().__init__()
        logger.info("Initialized CurrentDateTimeTool")

    @openapi_schema({
      "type": "function",
      "function": {
        "name": "get_current_datetime",
        "description": "Get the current date and time in UTC.",
        "parameters": {
          "type": "object",
          "properties": {
            "timezone_offset_hours": {
                "type": "number",
                "description": "Optional timezone offset from UTC in hours (e.g., -5 for EST, +1 for CET). If not provided, UTC time is returned.",
                "default": 0
            }
          }
        }
      }
    })
    @xml_schema(
        tag_name="get-current-datetime",
        mappings=[
            {"param_name": "timezone_offset_hours", "node_type": "attribute", "path": ".", "required": False}
        ],
        example='''
        <!-- Example 1: Get current UTC time -->
        <get-current-datetime />

        <!-- Example 2: Get current time in EST (UTC-5) -->
        <get-current-datetime timezone_offset_hours="-5" />
        '''
    )
    async def get_current_datetime(self, timezone_offset_hours: float = 0) -> ToolResult:
        """Get the current date and time, optionally adjusted by a timezone offset."""
        try:
            # Get current UTC time
            utc_now = datetime.now(timezone.utc)

            # Apply timezone offset if provided and valid
            target_time = utc_now
            offset_str = "UTC"
            if timezone_offset_hours != 0:
                try:
                    offset = timedelta(hours=timezone_offset_hours)
                    target_time = utc_now + offset
                    # Create a fixed timezone object for display purposes
                    tz_info = timezone(offset)
                    target_time = target_time.replace(tzinfo=tz_info) # Assign the timezone info
                    offset_str = f"UTC{timezone_offset_hours:+g}"
                except ValueError:
                    return self.fail_response(f"Invalid timezone offset: {timezone_offset_hours}. Please provide offset in hours (e.g., -5, +1).")

            # Format the time
            formatted_time = target_time.isoformat(timespec='seconds')

            logger.info(f"Returning current datetime: {formatted_time} ({offset_str})")
            return self.success_response({
                "current_datetime": formatted_time,
                "timezone": offset_str
            })
        except Exception as e:
            logger.error(f"Error getting current datetime: {str(e)}", exc_info=True)
            return self.fail_response(f"An unexpected error occurred while getting the date and time: {str(e)}")
