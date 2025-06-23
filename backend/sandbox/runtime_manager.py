"""
Runtime Manager for Sandbox Providers

This module provides a unified interface for different sandbox runtime providers
(Daytona, E2B) and handles the selection and initialization of the appropriate
provider based on configuration.
"""

from typing import Optional, Union
from utils.logger import logger
from utils.config import config

# Import sandbox implementations
from sandbox.sandbox import (
    get_or_start_sandbox as get_or_start_daytona_sandbox,
    create_sandbox as create_daytona_sandbox,
    delete_sandbox as delete_daytona_sandbox
)

from sandbox.e2b_sandbox import (
    get_or_start_e2b_sandbox,
    create_e2b_sandbox,
    delete_e2b_sandbox
)

class RuntimeManager:
    """
    Manages different sandbox runtime providers and provides a unified interface.
    """
    
    def __init__(self):
        self.runtime = getattr(config, 'SANDBOX_RUNTIME', 'daytona').lower()
        logger.info(f"Initialized RuntimeManager with runtime: {self.runtime}")
        
        # Validate runtime selection
        if self.runtime not in ['daytona', 'e2b']:
            logger.warning(f"Invalid runtime '{self.runtime}', defaulting to 'daytona'")
            self.runtime = 'daytona'
    
    async def get_or_start_sandbox(self, sandbox_id: str):
        """
        Retrieve a sandbox by ID, check its state, and start it if needed.
        
        Args:
            sandbox_id: The sandbox ID to retrieve
            
        Returns:
            Sandbox object (Daytona or E2B wrapped)
        """
        logger.info(f"Getting or starting sandbox {sandbox_id} using {self.runtime} runtime")
        
        if self.runtime == 'e2b':
            return await get_or_start_e2b_sandbox(sandbox_id)
        else:
            return await get_or_start_daytona_sandbox(sandbox_id)
    
    def create_sandbox(self, password: str, project_id: str = None):
        """
        Create a new sandbox with all required services configured and running.
        
        Args:
            password: VNC password for the sandbox
            project_id: Optional project ID to associate with the sandbox
            
        Returns:
            Sandbox object (Daytona or E2B wrapped)
        """
        logger.info(f"Creating new sandbox using {self.runtime} runtime")
        
        if self.runtime == 'e2b':
            return create_e2b_sandbox(password, project_id)
        else:
            return create_daytona_sandbox(password, project_id)
    
    async def delete_sandbox(self, sandbox_id: str):
        """
        Delete a sandbox by its ID.
        
        Args:
            sandbox_id: The sandbox ID to delete
            
        Returns:
            bool: True if deletion was successful
        """
        logger.info(f"Deleting sandbox {sandbox_id} using {self.runtime} runtime")
        
        if self.runtime == 'e2b':
            return await delete_e2b_sandbox(sandbox_id)
        else:
            return await delete_daytona_sandbox(sandbox_id)
    
    def get_runtime_info(self) -> dict:
        """
        Get information about the current runtime configuration.
        
        Returns:
            dict: Runtime information
        """
        info = {
            'runtime': self.runtime,
            'available_runtimes': ['daytona', 'e2b']
        }
        
        if self.runtime == 'daytona':
            info.update({
                'daytona_configured': bool(getattr(config, 'DAYTONA_API_KEY', None)),
                'daytona_server': getattr(config, 'DAYTONA_SERVER_URL', None),
                'daytona_target': getattr(config, 'DAYTONA_TARGET', None)
            })
        elif self.runtime == 'e2b':
            info.update({
                'e2b_configured': bool(getattr(config, 'E2B_API_KEY', None)),
                'e2b_template': getattr(config, 'E2B_TEMPLATE_ID', 'base')
            })
        
        return info
    
    def validate_runtime_config(self) -> bool:
        """
        Validate that the selected runtime is properly configured.
        
        Returns:
            bool: True if runtime is properly configured
        """
        if self.runtime == 'daytona':
            required_keys = ['DAYTONA_API_KEY', 'DAYTONA_SERVER_URL', 'DAYTONA_TARGET']
            missing_keys = [key for key in required_keys if not getattr(config, key, None)]
            
            if missing_keys:
                logger.error(f"Daytona runtime missing required configuration: {missing_keys}")
                return False
            
            logger.info("Daytona runtime configuration validated successfully")
            return True
            
        elif self.runtime == 'e2b':
            if not getattr(config, 'E2B_API_KEY', None):
                logger.error("E2B runtime missing required E2B_API_KEY configuration")
                return False
            
            logger.info("E2B runtime configuration validated successfully")
            return True
        
        return False

# Create a singleton instance
runtime_manager = RuntimeManager()

# Export the main functions for backward compatibility
async def get_or_start_sandbox(sandbox_id: str):
    """Backward compatible function that uses the runtime manager."""
    return await runtime_manager.get_or_start_sandbox(sandbox_id)

def create_sandbox(password: str, project_id: str = None):
    """Backward compatible function that uses the runtime manager."""
    return runtime_manager.create_sandbox(password, project_id)

async def delete_sandbox(sandbox_id: str):
    """Backward compatible function that uses the runtime manager."""
    return await runtime_manager.delete_sandbox(sandbox_id)