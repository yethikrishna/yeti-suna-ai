from fastapi import HTTPException, Request
from typing import Optional
from utils.logger import logger # Added logger

# Mock user and account IDs for now
MOCK_USER_ID = "mock_user_id_001"
MOCK_ACCOUNT_ID = "mock_account_id_001"

async def get_current_user_id_from_jwt(request: Request) -> str:
    """
    Returns a mock user ID.
    This function is a placeholder after removing Supabase JWT logic.
    
    Args:
        request: The FastAPI request object (currently unused but kept for signature consistency).
        
    Returns:
        str: A mock user ID.
    """
    logger.debug("get_current_user_id_from_jwt called, returning mock user ID.")
    # No actual JWT processing, just return a mock ID for now.
    # This allows dependent services to continue functioning in a basic mode.
    # In a future step, this could check for a simple API key or other auth.
    
    # Example: Check for a static API key if you want to add a very basic check
    # api_key = request.headers.get('X-API-KEY')
    # if api_key == "your_static_api_key":
    #     return MOCK_USER_ID
    # else:
    #     logger.warning("Missing or invalid X-API-KEY in get_current_user_id_from_jwt.")
    #     raise HTTPException(
    #         status_code=401,
    #         detail="Invalid or missing API Key",
    #     )
    return MOCK_USER_ID

async def get_account_id_from_thread(thread_id: str) -> str:
    """
    Returns a mock account ID for a given thread.
    This function is a placeholder after removing Supabase client calls.
    
    Args:
        thread_id: The ID of the thread (currently unused).
        
    Returns:
        str: A mock account ID.
    """
    logger.debug(f"get_account_id_from_thread called for thread_id {thread_id}, returning mock account ID.")
    # No database call, just return a mock ID.
    # This needs to be reimplemented with SQLite logic later if thread-to-account mapping is needed.
    return MOCK_ACCOUNT_ID
    
async def get_user_id_from_stream_auth(
    request: Request,
    token: Optional[str] = None
) -> str:
    """
    Returns a mock user ID for streaming endpoints.
    This function is a placeholder after removing Supabase JWT logic.
    It checks for an optional token parameter or header for basic API key simulation if desired.
    
    Args:
        request: The FastAPI request object.
        token: Optional token from query parameters.
        
    Returns:
        str: A mock user ID.
    """
    logger.debug(f"get_user_id_from_stream_auth called. Token in query: {'present' if token else 'absent'}.")
    
    # Example: Basic API key check (can be adapted from get_current_user_id_from_jwt)
    # query_token = token
    # header_token = request.headers.get('X-API-KEY') # Or Authorization: Bearer if preferred for key

    # if query_token == "your_static_api_key" or header_token == "your_static_api_key":
    #    logger.debug("Stream auth successful with API key.")
    #    return MOCK_USER_ID
    # else:
    #    logger.warning("Missing or invalid API Key in stream auth.")
    #    raise HTTPException(
    #        status_code=401,
    #        detail="Invalid or missing API Key for stream",
    #    )
    return MOCK_USER_ID

async def verify_thread_access(thread_id: str, user_id: str):
    """
    Placeholder function that always grants access to a thread.
    This function is a placeholder after removing Supabase client calls and RLS logic.
    
    Args:
        thread_id: The thread ID to check access for (currently unused).
        user_id: The user ID to check permissions for (currently unused).
        
    Returns:
        bool: True (access is always granted).
    """
    logger.debug(f"verify_thread_access called for thread_id {thread_id} and user_id {user_id}. Granting access by default.")
    # No database calls, always return True for now.
    # This needs to be reimplemented with SQLite logic later if access control is needed.
    return True

async def get_optional_user_id(request: Request) -> Optional[str]:
    """
    Returns a mock user ID or None, simulating optional authentication.
    This function is a placeholder after removing Supabase JWT logic.
    
    Args:
        request: The FastAPI request object (currently unused for actual auth).
        
    Returns:
        Optional[str]: A mock user ID or None.
    """
    # For now, let's assume if any "auth-like" header is present, we return mock_user_id,
    # otherwise None. This is a very loose interpretation.
    # A more robust temporary solution might look for a specific header or query param.
    auth_header = request.headers.get('Authorization') # Example: still checking for presence
    if auth_header: # Or check for X-API-KEY or any other indicator of "attempted auth"
        logger.debug("get_optional_user_id: Auth header present, returning mock user ID.")
        return MOCK_USER_ID
    
    logger.debug("get_optional_user_id: No auth header, returning None.")
    return None

# Example of how these functions might be used as FastAPI dependencies:
# from fastapi import Depends
# @app.get("/some_secure_route")
# async def secure_route_example(current_user: str = Depends(get_current_user_id_from_jwt)):
#     return {"message": f"Hello, {current_user}!"}

# @app.get("/some_optional_route")
# async def optional_route_example(current_user: Optional[str] = Depends(get_optional_user_id)):
#     if current_user:
#         return {"message": f"Hello, authenticated user {current_user}!"}
#     return {"message": "Hello, guest!"}

# @app.get("/threads/{thread_id}/view")
# async def view_thread_example(
#     thread_id: str,
#     current_user: str = Depends(get_current_user_id_from_jwt)
# ):
#     await verify_thread_access(thread_id=thread_id, user_id=current_user)
#     # ... proceed with thread logic ...
#     account_id_for_thread = await get_account_id_from_thread(thread_id=thread_id)
#     return {"message": f"You are viewing thread {thread_id} belonging to account {account_id_for_thread} as user {current_user}."}

if __name__ == '__main__':
    import asyncio

    # Basic test to demonstrate the functions
    class MockRequest:
        def __init__(self, headers=None, query_params=None):
            self.headers = headers or {}
            self.query_params = query_params or {}

    async def run_tests():
        print("--- Testing auth_utils (mocked) ---")

        # Test get_current_user_id_from_jwt
        req_no_auth = MockRequest()
        req_with_auth = MockRequest(headers={"Authorization": "Bearer faketoken"}) # Header content doesn't matter now

        user1 = await get_current_user_id_from_jwt(req_with_auth)
        print(f"get_current_user_id_from_jwt: {user1} (Expected: {MOCK_USER_ID})")
        # This would raise HTTPException if we implemented an API key check and it failed:
        # try:
        #     await get_current_user_id_from_jwt(req_no_auth)
        # except HTTPException as e:
        #     print(f"get_current_user_id_from_jwt (no auth): Correctly raised {e.status_code} - {e.detail}")


        # Test get_optional_user_id
        opt_user1 = await get_optional_user_id(req_with_auth)
        print(f"get_optional_user_id (with header): {opt_user1} (Expected: {MOCK_USER_ID})")
        opt_user2 = await get_optional_user_id(req_no_auth)
        print(f"get_optional_user_id (no header): {opt_user2} (Expected: None)")

        # Test get_user_id_from_stream_auth
        stream_user1 = await get_user_id_from_stream_auth(req_no_auth, token="fakequerytoken") # Query token doesn't matter now
        print(f"get_user_id_from_stream_auth (with query token): {stream_user1} (Expected: {MOCK_USER_ID})")
        stream_user2 = await get_user_id_from_stream_auth(req_with_auth) # Header doesn't matter now
        print(f"get_user_id_from_stream_auth (with header): {stream_user2} (Expected: {MOCK_USER_ID})")
        # This would raise if API key check was implemented and failed:
        # try:
        #     await get_user_id_from_stream_auth(req_no_auth)
        # except HTTPException as e:
        #     print(f"get_user_id_from_stream_auth (no auth): Correctly raised {e.status_code} - {e.detail}")


        # Test get_account_id_from_thread
        acc_id = await get_account_id_from_thread("thread_123")
        print(f"get_account_id_from_thread: {acc_id} (Expected: {MOCK_ACCOUNT_ID})")

        # Test verify_thread_access
        access_granted = await verify_thread_access("thread_123", MOCK_USER_ID)
        print(f"verify_thread_access: {access_granted} (Expected: True)")

        print("--- Mocked auth_utils tests completed ---")

    asyncio.run(run_tests())
