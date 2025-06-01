import sentry
from fastapi import HTTPException, Request
from typing import Optional
import jwt
from jwt.exceptions import PyJWTError
import logging # Added logging
from backend.utils.config import config # Added config import
from backend.database.dal import get_db_client, get_or_create_default_user # Added DAL imports

# This function extracts the user ID from Supabase JWT
async def get_current_user_id_from_jwt(request: Request) -> str:
    """
    Extract and verify the user ID from the JWT in the Authorization header.
    
    This function is used as a dependency in FastAPI routes to ensure the user
    is authenticated and to provide the user ID for authorization checks.
    
    Args:
        request: The FastAPI request object
        
    Returns:
        str: The user ID extracted from the JWT
        
    Raises:
        HTTPException: If no valid token is found or if the token is invalid
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(
            status_code=401,
            detail="No valid authentication credentials found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(' ')[1]
    
    try:
        # For Supabase JWT, we just need to decode and extract the user ID
        # The actual validation is handled by Supabase's RLS
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Supabase stores the user ID in the 'sub' claim
        user_id = payload.get('sub')
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"}
            )

        sentry.sentry.set_user({ "id": user_id })
        return user_id
        
    except PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )

async def get_account_id_from_thread(client, thread_id: str) -> str:
    """
    Extract and verify the account ID from the thread.
    
    Args:
        client: The Supabase client
        thread_id: The ID of the thread
        
    Returns:
        str: The account ID associated with the thread
        
    Raises:
        HTTPException: If the thread is not found or if there's an error
    """
    try:
        response = await client.table('threads').select('account_id').eq('thread_id', thread_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Thread not found"
            )
        
        account_id = response.data[0].get('account_id')
        
        if not account_id:
            raise HTTPException(
                status_code=500,
                detail="Thread has no associated account"
            )
        
        return account_id
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving thread information: {str(e)}"
        )
    
async def get_user_id_from_stream_auth(
    request: Request,
    token: Optional[str] = None
) -> str:
    """
    Extract and verify the user ID from either the Authorization header or query parameter token.
    This function is specifically designed for streaming endpoints that need to support both
    header-based and query parameter-based authentication (for EventSource compatibility).
    
    Args:
        request: The FastAPI request object
        token: Optional token from query parameters
        
    Returns:
        str: The user ID extracted from the JWT
        
    Raises:
        HTTPException: If no valid token is found or if the token is invalid
    """
    # Try to get user_id from token in query param (for EventSource which can't set headers)
    if token:
        try:
            # For Supabase JWT, we just need to decode and extract the user ID
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get('sub')
            sentry.sentry.set_user({ "id": user_id })
            if user_id:
                return user_id
        except Exception:
            pass
    
    # If no valid token in query param, try to get it from the Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        try:
            # Extract token from header
            header_token = auth_header.split(' ')[1]
            payload = jwt.decode(header_token, options={"verify_signature": False})
            user_id = payload.get('sub')
            if user_id:
                return user_id
        except Exception:
            pass
    
    # If we still don't have a user_id, return authentication error
    raise HTTPException(
        status_code=401,
        detail="No valid authentication credentials found",
        headers={"WWW-Authenticate": "Bearer"}
    )

async def verify_thread_access(client, thread_id: str, user_id: str):
    """
    Verify that a user has access to a specific thread based on account membership.
    
    Args:
        client: The Supabase client
        thread_id: The thread ID to check access for
        user_id: The user ID to check permissions for
        
    Returns:
        bool: True if the user has access
        
    Raises:
        HTTPException: If the user doesn't have access to the thread
    """
    # Query the thread to get account information
    # Assuming 'client' is now an instance of DatabaseInterface
    thread_data = await client.select(
        table_name='threads',
        columns='user_id, project_id, metadata', # Select user_id (as account_id), project_id and metadata
        filters=[('id', '=', thread_id)],
        single=True
    )

    if not thread_data:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Check if project is public
    project_id = thread_data.get('project_id')
    if project_id:
        project_data = await client.select(
            table_name='projects',
            columns='is_public',
            filters=[('id', '=', project_id)],
            single=True
        )
        if project_data and project_data.get('is_public'): # is_public is stored as 0 or 1 in SQLite
            return True # Public project, access granted

    # Project is not public or no project_id, check ownership of the thread
    # The 'account_id' from the old Supabase schema is now 'user_id' in the 'threads' table.
    thread_owner_user_id = thread_data.get('user_id')

    if thread_owner_user_id == user_id:
        return True # User owns the thread

    # If using Basejump for team/account management and need to check roles within a shared account:
    # This part depends on whether Basejump's 'account_user' table and 'accounts' are being migrated to SQLite
    # or if access is simplified to direct ownership or public status for now.
    # The schema for 'account_user' is not defined in the current SQLite setup.
    # For now, we'll assume that if not public and not direct owner, access is denied in SQLite mode.
    # If DATABASE_TYPE is Supabase, original logic could be preserved or adapted.
    # from backend.utils.config import config # To check DATABASE_TYPE
    # if config.DATABASE_TYPE == "supabase" and client.__class__.__name__ == "SupabaseDB":
    #     # This would be Supabase-specific logic if basejump.account_user is used
    #     # account_id = thread_data.get('account_id') # Supabase might have a separate account_id concept
    #     # if account_id:
    #     #     account_user_result = await client.call_function('get_account_user_role', {'p_account_id': account_id, 'p_user_id': user_id}) # Example RPC
    #     #     if account_user_result ... : return True
    #     pass # Placeholder for Supabase specific team/account role check if needed

    raise HTTPException(status_code=403, detail="Not authorized to access this thread")

async def get_optional_user_id(request: Request) -> Optional[str]:
    """
    Extract the user ID from the JWT in the Authorization header if present,
    but don't require authentication. Returns None if no valid token is found.
    
    This function is used for endpoints that support both authenticated and 
    unauthenticated access (like public projects).
    
    Args:
        request: The FastAPI request object
        
    Returns:
        Optional[str]: The user ID extracted from the JWT, or None if no valid token
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    
    user_id_from_jwt: Optional[str] = None
    try:
        # For Supabase JWT, we just need to decode and extract the user ID
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id_from_jwt = payload.get('sub')
    except PyJWTError:
        logging.debug("Optional auth: Invalid JWT provided.")
        user_id_from_jwt = None # Explicitly set to None on error

    if user_id_from_jwt:
        sentry.sentry.set_user({ "id": user_id_from_jwt }) # Set sentry user if JWT valid
        return user_id_from_jwt

    # If no valid user_id from JWT, check if in SQLite mode to return default user
    if config.DATABASE_TYPE == "sqlite":
        try:
            db = await get_db_client()
            default_user_id = await get_or_create_default_user(db)
            logging.info(f"Optional auth: No valid JWT in SQLite mode. Using default user: {default_user_id}")
            # Set Sentry user for default user in SQLite mode for clarity in logs
            sentry.sentry.set_user({ "id": default_user_id , "username": "local_default_user" })
            return default_user_id
        except Exception as e:
            logging.error(f"Optional auth: Failed to get/create default user in SQLite mode: {e}", exc_info=True)
            # Fall through to returning None if default user retrieval fails, or raise an error
            # For permissive local dev, returning None might be acceptable if default user setup fails.
            # However, if operations downstream REQUIRE a user_id, this could lead to issues.
            # For now, let it return None if get_or_create_default_user fails.
            return None

    return None # Default for non-SQLite mode if no JWT

async def get_optional_user_id_from_stream_auth(
    request: Request,
    token: Optional[str] = None
) -> Optional[str]:
    """
    Extracts user ID from JWT (header or query param).
    If no valid JWT & in SQLite mode, returns default user ID. Otherwise None.
    """
    user_id_from_jwt: Optional[str] = None
    if token:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id_from_jwt = payload.get('sub')
        except PyJWTError:
            logging.debug("Stream auth: Invalid JWT from token query param.")
            user_id_from_jwt = None

    if not user_id_from_jwt:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            header_token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(header_token, options={"verify_signature": False})
                user_id_from_jwt = payload.get('sub')
            except PyJWTError:
                logging.debug("Stream auth: Invalid JWT from Authorization header.")
                user_id_from_jwt = None

    if user_id_from_jwt:
        sentry.sentry.set_user({ "id": user_id_from_jwt })
        return user_id_from_jwt

    if config.DATABASE_TYPE == "sqlite":
        try:
            db = await get_db_client()
            default_user_id = await get_or_create_default_user(db)
            logging.info(f"Stream auth: No valid JWT in SQLite mode. Using default user: {default_user_id}")
            sentry.sentry.set_user({ "id": default_user_id , "username": "local_default_user" })
            return default_user_id
        except Exception as e:
            logging.error(f"Stream auth: Failed to get/create default user in SQLite mode: {e}", exc_info=True)
            return None

    return None # Default for non-SQLite mode if no JWT or if default user fetch failed
