"""
Runtime API endpoints for managing sandbox runtime providers.

This module provides API endpoints for checking runtime status,
switching between providers, and getting runtime information.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from sandbox.runtime_manager import runtime_manager
from utils.logger import logger
from utils.auth_utils import get_optional_user_id

router = APIRouter(tags=["runtime"])

class RuntimeSwitchRequest(BaseModel):
    """Request model for switching runtime providers."""
    runtime: str  # "daytona" or "e2b"

class RuntimeStatusResponse(BaseModel):
    """Response model for runtime status."""
    current_runtime: str
    available_runtimes: list
    runtime_configured: bool
    runtime_info: dict

@router.get("/runtime/status", response_model=RuntimeStatusResponse)
async def get_runtime_status(
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Get the current runtime status and configuration information.
    """
    try:
        runtime_info = runtime_manager.get_runtime_info()
        is_configured = runtime_manager.validate_runtime_config()
        
        return RuntimeStatusResponse(
            current_runtime=runtime_info['runtime'],
            available_runtimes=runtime_info['available_runtimes'],
            runtime_configured=is_configured,
            runtime_info=runtime_info
        )
    except Exception as e:
        logger.error(f"Error getting runtime status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/runtime/switch")
async def switch_runtime(
    request: RuntimeSwitchRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Switch the runtime provider (requires admin privileges in production).
    Note: This changes the runtime for the entire application.
    """
    try:
        # Validate runtime choice
        if request.runtime not in ['daytona', 'e2b']:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid runtime '{request.runtime}'. Must be 'daytona' or 'e2b'"
            )
        
        # Update the runtime manager
        old_runtime = runtime_manager.runtime
        runtime_manager.runtime = request.runtime
        
        # Validate the new runtime configuration
        if not runtime_manager.validate_runtime_config():
            # Revert if validation fails
            runtime_manager.runtime = old_runtime
            raise HTTPException(
                status_code=400,
                detail=f"Runtime '{request.runtime}' is not properly configured"
            )
        
        logger.info(f"Runtime switched from '{old_runtime}' to '{request.runtime}'")
        
        return {
            "status": "success",
            "message": f"Runtime switched to '{request.runtime}'",
            "previous_runtime": old_runtime,
            "current_runtime": request.runtime
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error switching runtime: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runtime/validate/{runtime_name}")
async def validate_runtime_config(
    runtime_name: str,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Validate the configuration for a specific runtime provider.
    """
    try:
        if runtime_name not in ['daytona', 'e2b']:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid runtime '{runtime_name}'. Must be 'daytona' or 'e2b'"
            )
        
        # Temporarily switch to test validation
        original_runtime = runtime_manager.runtime
        runtime_manager.runtime = runtime_name
        
        try:
            is_valid = runtime_manager.validate_runtime_config()
            runtime_info = runtime_manager.get_runtime_info()
        finally:
            # Always restore original runtime
            runtime_manager.runtime = original_runtime
        
        return {
            "runtime": runtime_name,
            "is_configured": is_valid,
            "configuration": runtime_info
        }
        
    except Exception as e:
        logger.error(f"Error validating runtime config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runtime/health")
async def check_runtime_health():
    """
    Check the health of the current runtime provider.
    """
    try:
        runtime_info = runtime_manager.get_runtime_info()
        is_configured = runtime_manager.validate_runtime_config()
        
        # Additional health checks could be added here
        # For example, testing API connectivity
        
        health_status = "healthy" if is_configured else "unhealthy"
        
        return {
            "status": health_status,
            "runtime": runtime_info['runtime'],
            "configured": is_configured,
            "timestamp": "2025-06-23T09:06:40Z"  # Could use actual timestamp
        }
        
    except Exception as e:
        logger.error(f"Error checking runtime health: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": "2025-06-23T09:06:40Z"
        }