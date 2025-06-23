"""
Test suite for E2B runtime integration.

This module contains tests to verify that the E2B runtime integration
works correctly and provides the expected interface compatibility.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sandbox.runtime_manager import RuntimeManager, runtime_manager
from sandbox.e2b_sandbox import (
    E2BSandboxWrapper, 
    E2BProcessWrapper, 
    E2BFilesystemWrapper,
    get_or_start_e2b_sandbox,
    create_e2b_sandbox,
    delete_e2b_sandbox
)

class TestRuntimeManager:
    """Test the RuntimeManager class."""
    
    def test_runtime_manager_initialization(self):
        """Test that RuntimeManager initializes correctly."""
        manager = RuntimeManager()
        assert manager.runtime in ['daytona', 'e2b']
        assert hasattr(manager, 'get_runtime_info')
        assert hasattr(manager, 'validate_runtime_config')
    
    def test_runtime_info(self):
        """Test getting runtime information."""
        info = runtime_manager.get_runtime_info()
        assert 'runtime' in info
        assert 'available_runtimes' in info
        assert info['available_runtimes'] == ['daytona', 'e2b']
    
    @patch('sandbox.runtime_manager.config')
    def test_daytona_validation(self, mock_config):
        """Test Daytona runtime validation."""
        # Mock Daytona configuration
        mock_config.DAYTONA_API_KEY = 'test_key'
        mock_config.DAYTONA_SERVER_URL = 'http://test.com'
        mock_config.DAYTONA_TARGET = 'test_target'
        
        manager = RuntimeManager()
        manager.runtime = 'daytona'
        
        assert manager.validate_runtime_config() == True
    
    @patch('sandbox.runtime_manager.config')
    def test_e2b_validation(self, mock_config):
        """Test E2B runtime validation."""
        # Mock E2B configuration
        mock_config.E2B_API_KEY = 'test_key'
        mock_config.E2B_TEMPLATE_ID = 'base'
        
        manager = RuntimeManager()
        manager.runtime = 'e2b'
        
        assert manager.validate_runtime_config() == True
    
    @patch('sandbox.runtime_manager.config')
    def test_invalid_daytona_config(self, mock_config):
        """Test invalid Daytona configuration."""
        # Mock missing Daytona configuration
        mock_config.DAYTONA_API_KEY = None
        mock_config.DAYTONA_SERVER_URL = None
        mock_config.DAYTONA_TARGET = None
        
        manager = RuntimeManager()
        manager.runtime = 'daytona'
        
        assert manager.validate_runtime_config() == False
    
    @patch('sandbox.runtime_manager.config')
    def test_invalid_e2b_config(self, mock_config):
        """Test invalid E2B configuration."""
        # Mock missing E2B configuration
        mock_config.E2B_API_KEY = None
        
        manager = RuntimeManager()
        manager.runtime = 'e2b'
        
        assert manager.validate_runtime_config() == False

class TestE2BSandboxWrapper:
    """Test the E2B sandbox wrapper classes."""
    
    def test_e2b_sandbox_wrapper_initialization(self):
        """Test E2BSandboxWrapper initialization."""
        mock_sandbox = Mock()
        wrapper = E2BSandboxWrapper(mock_sandbox, "test_id")
        
        assert wrapper.id == "test_id"
        assert wrapper.state == "RUNNING"
        assert hasattr(wrapper, 'process')
        assert hasattr(wrapper, 'fs')
    
    def test_e2b_process_wrapper(self):
        """Test E2BProcessWrapper functionality."""
        mock_sandbox = Mock()
        process_wrapper = E2BProcessWrapper(mock_sandbox)
        
        # Test session creation
        process_wrapper.create_session("test_session")
        assert "test_session" in process_wrapper._sessions
    
    def test_e2b_filesystem_wrapper(self):
        """Test E2BFilesystemWrapper functionality."""
        mock_sandbox = Mock()
        mock_sandbox.files = Mock()
        
        fs_wrapper = E2BFilesystemWrapper(mock_sandbox)
        
        # Test file upload
        test_content = b"test content"
        fs_wrapper.upload_file(test_content, "/test/path")
        mock_sandbox.files.write.assert_called()
        
        # Test file download
        mock_sandbox.files.read.return_value = "test content"
        result = fs_wrapper.download_file("/test/path")
        assert isinstance(result, bytes)

class TestE2BIntegration:
    """Test E2B integration functions."""
    
    @patch('sandbox.e2b_sandbox.E2BSandbox')
    @patch('sandbox.e2b_sandbox.E2B_API_KEY', 'test_key')
    @patch('sandbox.e2b_sandbox.E2B_TEMPLATE_ID', 'base')
    @pytest.mark.asyncio
    async def test_get_or_start_e2b_sandbox(self, mock_e2b_sandbox):
        """Test getting or starting an E2B sandbox."""
        mock_sandbox_instance = Mock()
        mock_sandbox_instance.id = "test_sandbox_id"
        mock_e2b_sandbox.return_value = mock_sandbox_instance
        
        result = await get_or_start_e2b_sandbox("test_id")
        
        assert isinstance(result, E2BSandboxWrapper)
        assert result.id == "test_id"
        mock_e2b_sandbox.assert_called_once()
    
    @patch('sandbox.e2b_sandbox.E2BSandbox')
    @patch('sandbox.e2b_sandbox.E2B_API_KEY', 'test_key')
    @patch('sandbox.e2b_sandbox.E2B_TEMPLATE_ID', 'base')
    def test_create_e2b_sandbox(self, mock_e2b_sandbox):
        """Test creating an E2B sandbox."""
        mock_sandbox_instance = Mock()
        mock_sandbox_instance.id = "test_sandbox_id"
        mock_sandbox_instance.process = Mock()
        mock_sandbox_instance.process.start_and_wait = Mock()
        mock_e2b_sandbox.return_value = mock_sandbox_instance
        
        result = create_e2b_sandbox("test_password", "test_project")
        
        assert isinstance(result, E2BSandboxWrapper)
        mock_e2b_sandbox.assert_called_once()
        # Verify environment variables were set
        assert mock_sandbox_instance.process.start_and_wait.call_count > 0
    
    @pytest.mark.asyncio
    async def test_delete_e2b_sandbox(self):
        """Test deleting an E2B sandbox."""
        result = await delete_e2b_sandbox("test_id")
        assert result == True

class TestRuntimeSwitching:
    """Test runtime switching functionality."""
    
    @patch('sandbox.runtime_manager.get_or_start_daytona_sandbox')
    @patch('sandbox.runtime_manager.get_or_start_e2b_sandbox')
    @pytest.mark.asyncio
    async def test_runtime_switching(self, mock_e2b_get, mock_daytona_get):
        """Test switching between runtimes."""
        manager = RuntimeManager()
        
        # Test E2B runtime
        manager.runtime = 'e2b'
        await manager.get_or_start_sandbox("test_id")
        mock_e2b_get.assert_called_once_with("test_id")
        
        # Test Daytona runtime
        manager.runtime = 'daytona'
        await manager.get_or_start_sandbox("test_id")
        mock_daytona_get.assert_called_once_with("test_id")

class TestBackwardCompatibility:
    """Test backward compatibility with existing code."""
    
    @patch('sandbox.runtime_manager.runtime_manager')
    @pytest.mark.asyncio
    async def test_backward_compatible_functions(self, mock_manager):
        """Test that backward compatible functions work."""
        from sandbox.runtime_manager import (
            get_or_start_sandbox,
            create_sandbox,
            delete_sandbox
        )
        
        # Mock the runtime manager methods
        mock_manager.get_or_start_sandbox = AsyncMock()
        mock_manager.create_sandbox = Mock()
        mock_manager.delete_sandbox = AsyncMock()
        
        # Test the functions
        await get_or_start_sandbox("test_id")
        create_sandbox("password", "project_id")
        await delete_sandbox("test_id")
        
        # Verify they call the runtime manager
        mock_manager.get_or_start_sandbox.assert_called_once_with("test_id")
        mock_manager.create_sandbox.assert_called_once_with("password", "project_id")
        mock_manager.delete_sandbox.assert_called_once_with("test_id")

if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])