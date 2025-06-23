import asyncio
from typing import Optional, Dict, Any
from e2b import Sandbox as E2BSandbox
from dotenv import load_dotenv
from utils.logger import logger
from utils.config import config
from utils.config import Configuration

load_dotenv()

logger.debug("Initializing E2B sandbox configuration")

# E2B configuration
E2B_API_KEY = getattr(config, 'E2B_API_KEY', None)
E2B_TEMPLATE_ID = getattr(config, 'E2B_TEMPLATE_ID', 'base')

if E2B_API_KEY:
    logger.debug("E2B API key configured successfully")
else:
    logger.warning("No E2B API key found in environment variables")

if E2B_TEMPLATE_ID:
    logger.debug(f"E2B template ID set to: {E2B_TEMPLATE_ID}")
else:
    logger.warning("No E2B template ID found, using default 'base'")

class E2BSandboxWrapper:
    """Wrapper class to provide a consistent interface for E2B sandboxes."""
    
    def __init__(self, sandbox: E2BSandbox, sandbox_id: str):
        self._sandbox = sandbox
        self.id = sandbox_id
        self.state = "RUNNING"  # E2B sandboxes are running when created
        
    @property
    def process(self):
        """Provide process interface similar to Daytona."""
        return E2BProcessWrapper(self._sandbox)
    
    @property
    def fs(self):
        """Provide filesystem interface similar to Daytona."""
        return E2BFilesystemWrapper(self._sandbox)
    
    def get_preview_link(self, port: int):
        """Get preview link for a specific port."""
        # E2B provides URL access through the sandbox
        return f"https://{self.id}-{port}.e2b.dev"

class E2BProcessWrapper:
    """Wrapper for E2B process operations to match Daytona interface."""
    
    def __init__(self, sandbox: E2BSandbox):
        self._sandbox = sandbox
        self._sessions = {}
    
    def create_session(self, session_id: str):
        """Create a new session."""
        # E2B doesn't have explicit sessions, but we can track them
        self._sessions[session_id] = True
        logger.info(f"Created E2B session: {session_id}")
    
    def execute_session_command(self, session_id: str, request):
        """Execute a command in a session."""
        if session_id not in self._sessions:
            raise ValueError(f"Session {session_id} not found")
        
        command = request.command if hasattr(request, 'command') else str(request)
        is_async = getattr(request, 'var_async', False)
        
        try:
            if is_async:
                # For async commands, start in background
                result = self._sandbox.process.start(command)
                logger.info(f"Started async command in session {session_id}: {command}")
                return result
            else:
                # For sync commands, wait for completion
                result = self._sandbox.process.start_and_wait(command)
                logger.info(f"Executed command in session {session_id}: {command}")
                return result
        except Exception as e:
            logger.error(f"Error executing command in session {session_id}: {str(e)}")
            raise e

class E2BFilesystemWrapper:
    """Wrapper for E2B filesystem operations to match Daytona interface."""
    
    def __init__(self, sandbox: E2BSandbox):
        self._sandbox = sandbox
    
    def upload_file(self, content: bytes, path: str):
        """Upload file content to the sandbox."""
        try:
            # E2B expects string content for text files, bytes for binary
            if isinstance(content, bytes):
                # Try to decode as text first
                try:
                    text_content = content.decode('utf-8')
                    self._sandbox.files.write(path, text_content)
                except UnicodeDecodeError:
                    # If it's binary content, we need to handle it differently
                    # E2B doesn't directly support binary uploads, so we'll base64 encode
                    import base64
                    encoded_content = base64.b64encode(content).decode('utf-8')
                    # Write a script to decode and write the binary file
                    script = f"""
import base64
with open('{path}', 'wb') as f:
    f.write(base64.b64decode('{encoded_content}'))
"""
                    self._sandbox.files.write('/tmp/upload_binary.py', script)
                    self._sandbox.process.start_and_wait('python /tmp/upload_binary.py')
                    self._sandbox.files.remove('/tmp/upload_binary.py')
            else:
                self._sandbox.files.write(path, content)
            logger.info(f"Uploaded file to E2B sandbox: {path}")
        except Exception as e:
            logger.error(f"Error uploading file to E2B sandbox: {str(e)}")
            raise e
    
    def download_file(self, path: str) -> bytes:
        """Download file content from the sandbox."""
        try:
            content = self._sandbox.files.read(path)
            # E2B returns string content, convert to bytes
            if isinstance(content, str):
                return content.encode('utf-8')
            return content
        except Exception as e:
            logger.error(f"Error downloading file from E2B sandbox: {str(e)}")
            raise e
    
    def list_files(self, path: str):
        """List files in the specified directory."""
        try:
            files = self._sandbox.files.list(path)
            # Convert E2B file objects to match Daytona interface
            result = []
            for file in files:
                # Create a simple object with the expected attributes
                file_obj = type('FileInfo', (), {
                    'name': file.name,
                    'is_dir': file.is_dir,
                    'size': getattr(file, 'size', 0),
                    'mod_time': getattr(file, 'modified_at', ''),
                })()
                result.append(file_obj)
            return result
        except Exception as e:
            logger.error(f"Error listing files in E2B sandbox: {str(e)}")
            raise e
    
    def delete_file(self, path: str):
        """Delete a file from the sandbox."""
        try:
            self._sandbox.files.remove(path)
            logger.info(f"Deleted file from E2B sandbox: {path}")
        except Exception as e:
            logger.error(f"Error deleting file from E2B sandbox: {str(e)}")
            raise e

async def get_or_start_e2b_sandbox(sandbox_id: str):
    """Retrieve or start an E2B sandbox by ID."""
    logger.info(f"Getting or starting E2B sandbox with ID: {sandbox_id}")
    
    try:
        # E2B sandboxes are created fresh each time
        # We'll use the sandbox_id as a reference but create a new instance
        sandbox = E2BSandbox(
            template=E2B_TEMPLATE_ID,
            api_key=E2B_API_KEY,
            metadata={"project_id": sandbox_id}
        )
        
        # Wrap the E2B sandbox to provide consistent interface
        wrapped_sandbox = E2BSandboxWrapper(sandbox, sandbox_id)
        
        logger.info(f"E2B sandbox {sandbox_id} is ready")
        return wrapped_sandbox
        
    except Exception as e:
        logger.error(f"Error retrieving or starting E2B sandbox: {str(e)}")
        raise e

def create_e2b_sandbox(password: str, project_id: str = None):
    """Create a new E2B sandbox with all required services configured and running."""
    
    logger.debug("Creating new E2B sandbox environment")
    logger.debug("Configuring E2B sandbox with browser-use template")
    
    try:
        # Create E2B sandbox
        sandbox = E2BSandbox(
            template=E2B_TEMPLATE_ID,
            api_key=E2B_API_KEY,
            metadata={
                "project_id": project_id or "default",
                "password": password,
                "created_by": "suna"
            }
        )
        
        # Set up environment variables
        env_vars = {
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
        
        # Set environment variables in the sandbox
        for key, value in env_vars.items():
            sandbox.process.start_and_wait(f'export {key}="{value}"')
        
        # Wrap the sandbox
        wrapped_sandbox = E2BSandboxWrapper(sandbox, sandbox.id)
        
        logger.debug(f"E2B sandbox created with ID: {sandbox.id}")
        logger.debug(f"E2B sandbox environment successfully initialized")
        
        return wrapped_sandbox
        
    except Exception as e:
        logger.error(f"Error creating E2B sandbox: {str(e)}")
        raise e

async def delete_e2b_sandbox(sandbox_id: str):
    """Delete an E2B sandbox by its ID."""
    logger.info(f"Deleting E2B sandbox with ID: {sandbox_id}")
    
    try:
        # E2B sandboxes are automatically cleaned up
        # We could keep track of active sandboxes and close them explicitly
        # For now, we'll just log the deletion
        logger.info(f"E2B sandbox {sandbox_id} marked for deletion")
        return True
    except Exception as e:
        logger.error(f"Error deleting E2B sandbox {sandbox_id}: {str(e)}")
        raise e

# Session execute request class to match Daytona interface
class SessionExecuteRequest:
    def __init__(self, command: str, var_async: bool = False):
        self.command = command
        self.var_async = var_async