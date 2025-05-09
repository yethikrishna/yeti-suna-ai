import os
from typing import Optional
import uuid
import httpx

from daytona_sdk import Daytona, DaytonaConfig, CreateSandboxParams, Sandbox, SessionExecuteRequest
from daytona_api_client.models.workspace_state import WorkspaceState
from dotenv import load_dotenv

from agentpress.tool import Tool
from utils.logger import logger
from utils.config import config
from utils.files_utils import clean_path
from agentpress.thread_manager import ThreadManager

load_dotenv()

logger.debug("Initializing Daytona sandbox configuration")

# Prepare Daytona config arguments, excluding None values
daytona_config_args = {
    'server_url': config.DAYTONA_SERVER_URL
}
if config.DAYTONA_API_KEY:
    daytona_config_args['api_key'] = config.DAYTONA_API_KEY
if config.DAYTONA_TARGET:
    daytona_config_args['target'] = config.DAYTONA_TARGET

daytona_config = DaytonaConfig(**daytona_config_args)

if daytona_config_args.get('api_key'):
    logger.debug("Daytona API key configured successfully")
else:
    logger.info("No Daytona API key found in environment variables (this might be expected for local setups)")

if daytona_config.server_url:
    logger.debug(f"Daytona server URL set to: {daytona_config.server_url}")
else:
    # This should ideally not happen due to config validation, but good to check
    logger.error("CRITICAL: Daytona server URL is missing!") 

if daytona_config_args.get('target'):
    logger.debug(f"Daytona target set to: {daytona_config_args.get('target')}")
else:
    logger.info("No Daytona target found in environment variables (this might be expected for local setups)")

daytona = Daytona(daytona_config)
logger.debug("Daytona client initialized")

async def get_or_start_sandbox(sandbox_id: str):
    """Retrieve a sandbox by ID, check its state, and start it if needed."""
    
    logger.info(f"Getting or starting sandbox with ID: {sandbox_id}")
    
    try:
        sandbox = daytona.get_current_sandbox(sandbox_id)
        
        # Check if sandbox needs to be started
        if sandbox.instance.state == WorkspaceState.ARCHIVED or sandbox.instance.state == WorkspaceState.STOPPED:
            logger.info(f"Sandbox is in {sandbox.instance.state} state. Starting...")
            try:
                daytona.start(sandbox)
                # Wait a moment for the sandbox to initialize
                # sleep(5)
                # Refresh sandbox state after starting
                sandbox = daytona.get_current_sandbox(sandbox_id)
                
                # Start supervisord in a session when restarting
                start_supervisord_session(sandbox)
            except Exception as e:
                logger.error(f"Error starting sandbox: {e}")
                raise e
        
        logger.info(f"Sandbox {sandbox_id} is ready")
        return sandbox
        
    except Exception as e:
        logger.error(f"Error retrieving or starting sandbox: {str(e)}")
        raise e

def start_supervisord_session(sandbox: Sandbox):
    """Start supervisord in a session."""
    session_id = "supervisord-session"
    try:
        logger.info(f"Creating session {session_id} for supervisord")
        sandbox.process.create_session(session_id)
        
        # Execute supervisord command
        sandbox.process.execute_session_command(session_id, SessionExecuteRequest(
            command="exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf",
            var_async=True
        ))
        logger.info(f"Supervisord started in session {session_id}")
    except Exception as e:
        logger.error(f"Error starting supervisord session: {str(e)}")
        raise e

async def create_sandbox(password: str, project_id: str = None):
    """Create a new sandbox with all required services configured and running."""
    
    logger.debug("Creating new Daytona sandbox environment for legacy Daytona")
    logger.debug("Configuring sandbox with browser-use image and environment variables")

    if not daytona_config.target:
        logger.error("Daytona target is not configured. Cannot create workspace for legacy Daytona.")
        raise ValueError("Daytona target (DAYTONA_TARGET) is required for legacy workspace creation.")

    current_sandbox_id = project_id or str(uuid.uuid4())
    sandbox_name = f"Sandbox-{current_sandbox_id[:8]}"

    env_vars_payload = {
        "CHROME_PERSISTENT_SESSION": "true",
        "RESOLUTION": "1024x768x24",
        "RESOLUTION_WIDTH": "1024",
        "RESOLUTION_HEIGHT": "768",
        "VNC_PASSWORD": password,
        "ANONYMIZED_TELEMETRY": "false",
        "CHROME_PATH": "",
        "CHROME_USER_DATA": "",
        "CHROME_DEBUGGING_PORT": "9222",
        "CHROME_DEBUGGING_HOST": "localhost",
        "CHROME_CDP": ""
    }

    # This is the payload structure we believe the legacy Daytona API expects
    legacy_payload = {
        "Name": sandbox_name,
        "TargetId": daytona_config.target, # From your DaytonaConfig
        "Source": {
            "Image": {
                "Name": "adamcohenhillel/kortix-suna:0.0.20" # Your image
            }
            # If you were using a git repository, it might look like:
            # "Repository": {
            #     "Url": "https://github.com/your/repo.git"
            # }
        },
        "EnvVars": env_vars_payload,
        # The legacy API might not support 'public', 'labels', 'resources' directly in this call
        # or may have different names/structures for them.
    }

    logger.debug(f"Attempting to create workspace with legacy payload: {legacy_payload}")

    try:
        # Using httpx for async HTTP request
        # Ensure this function is async or run httpx calls in a separate thread if create_sandbox is sync
        # For now, assuming create_sandbox can be made async or this part is adapted.
        # If create_sandbox must remain synchronous, use 'requests' library instead of 'httpx'.
        
        # This part needs to be async if create_sandbox is async.
        # If create_sandbox is synchronous, you'd use 'requests.post(...)'
        # For simplicity, let's assume we can make this part work. 
        # A practical implementation might require `async def create_sandbox`
        # and `await` for the httpx call.
        
        # Placeholder for actual HTTP call - illustrating the structure
        # This section will need to be adapted to be truly async or use 'requests'
        
        headers = {
            "Content-Type": "application/json",
        }
        if daytona_config.api_key:
            headers["Authorization"] = f"Bearer {daytona_config.api_key}"

        # This is a synchronous illustration using requests for simplicity here.
        # If your create_sandbox is part of an async FastAPI flow, use httpx.AsyncClient()
        # import requests # Temporary import for synchronous example
        # response = requests.post(
        #     f"{daytona_config.server_url}/workspace", # Common endpoint for workspace creation
        #     json=legacy_payload,
        #     headers=headers
        # )
        # response.raise_for_status() # Will raise an exception for 4xx/5xx errors
        
        # response_data = response.json()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{daytona_config.server_url}/workspace", # Common endpoint for workspace creation
                json=legacy_payload,
                headers=headers
            )
            response.raise_for_status() # Will raise an exception for 4xx/5xx errors
            response_data = response.json()

        created_sandbox_id = response_data.get("id") # Or "workspaceId", "ID", etc. - inspect actual response
        
        if not created_sandbox_id:
            logger.error(f"Legacy workspace creation succeeded but no ID returned in response: {response_data}")
            raise ValueError("Legacy workspace created but ID was not found in response.")

        logger.info(f"Legacy workspace created successfully with ID: {created_sandbox_id}")
        
        # IMPORTANT: The 'daytona.create(params)' call returned a 'Sandbox' object.
        # Now, you're getting a JSON response. You'll need to adapt how you use the result.
        # You might need to fetch the sandbox details using daytona.get_current_sandbox(created_sandbox_id)
        # or construct a simplified Sandbox-like object if only the ID and a few details are needed immediately.
        
        # For now, let's try to get the Sandbox object using the SDK after creation
        # This assumes the legacy server creates something the SDK can then retrieve by ID.
        new_sandbox = daytona.get_current_sandbox(created_sandbox_id)
        if not new_sandbox:
             raise Exception(f"Could not retrieve sandbox {created_sandbox_id} via SDK after legacy creation.")

        # Start supervisord in a session for new sandbox
        # This part should work if 'new_sandbox' is a valid Sandbox object
        start_supervisord_session(new_sandbox)
        
        logger.debug(f"Sandbox environment {created_sandbox_id} successfully initialized via legacy API")
        return new_sandbox # Return the Sandbox object fetched by the SDK

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error during legacy workspace creation: {e.response.status_code} - {e.response.text}")
        raise e
    except Exception as e:
        logger.error(f"Error during legacy Daytona workspace creation: {str(e)}")
        raise e


class SandboxToolsBase(Tool):
    """Base class for all sandbox tools that provides project-based sandbox access."""
    
    # Class variable to track if sandbox URLs have been printed
    _urls_printed = False
    
    def __init__(self, project_id: str, thread_manager: Optional[ThreadManager] = None):
        super().__init__()
        self.project_id = project_id
        self.thread_manager = thread_manager
        self.workspace_path = "/workspace"
        self._sandbox = None
        self._sandbox_id = None
        self._sandbox_pass = None

    async def _ensure_sandbox(self) -> Sandbox:
        """Ensure we have a valid sandbox instance, retrieving it from the project if needed."""
        if self._sandbox is None:
            try:
                # Get database client
                client = await self.thread_manager.db.client
                
                # Get project data
                project = await client.table('projects').select('*').eq('project_id', self.project_id).execute()
                if not project.data or len(project.data) == 0:
                    raise ValueError(f"Project {self.project_id} not found")
                
                project_data = project.data[0]
                sandbox_info = project_data.get('sandbox', {})
                
                if not sandbox_info.get('id'):
                    raise ValueError(f"No sandbox found for project {self.project_id}")
                
                # Store sandbox info
                self._sandbox_id = sandbox_info['id']
                self._sandbox_pass = sandbox_info.get('pass')
                
                # Get or start the sandbox
                self._sandbox = await get_or_start_sandbox(self._sandbox_id)
                
                # # Log URLs if not already printed
                # if not SandboxToolsBase._urls_printed:
                #     vnc_link = self._sandbox.get_preview_link(6080)
                #     website_link = self._sandbox.get_preview_link(8080)
                    
                #     vnc_url = vnc_link.url if hasattr(vnc_link, 'url') else str(vnc_link)
                #     website_url = website_link.url if hasattr(website_link, 'url') else str(website_link)
                    
                #     print("\033[95m***")
                #     print(f"VNC URL: {vnc_url}")
                #     print(f"Website URL: {website_url}")
                #     print("***\033[0m")
                #     SandboxToolsBase._urls_printed = True
                
            except Exception as e:
                logger.error(f"Error retrieving sandbox for project {self.project_id}: {str(e)}", exc_info=True)
                raise e
        
        return self._sandbox

    @property
    def sandbox(self) -> Sandbox:
        """Get the sandbox instance, ensuring it exists."""
        if self._sandbox is None:
            raise RuntimeError("Sandbox not initialized. Call _ensure_sandbox() first.")
        return self._sandbox

    @property
    def sandbox_id(self) -> str:
        """Get the sandbox ID, ensuring it exists."""
        if self._sandbox_id is None:
            raise RuntimeError("Sandbox ID not initialized. Call _ensure_sandbox() first.")
        return self._sandbox_id

    def clean_path(self, path: str) -> str:
        """Clean and normalize a path to be relative to /workspace."""
        cleaned_path = clean_path(path, self.workspace_path)
        logger.debug(f"Cleaned path: {path} -> {cleaned_path}")
        return cleaned_path