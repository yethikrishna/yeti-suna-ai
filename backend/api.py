from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from agentpress.thread_manager import ThreadManager
from services.supabase import DBConnection
from datetime import datetime, timezone
from utils.config import config, EnvMode
import asyncio
from utils.logger import logger, request_id as logger_request_id
import uuid
import time
import os

# SlowAPI imports
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Import the agent API module
from agent import api as agent_api
from sandbox import api as sandbox_api
from services import billing as billing_api
from kb import api as kb_api_router

# Initialize managers
db = DBConnection()
thread_manager = None
instance_id = "single"

# Rate limiter state (Old - to be removed)
# ip_tracker = OrderedDict() # Removed
# MAX_CONCURRENT_IPS = 25 # Removed

# Initialize Limiter for SlowAPI
# It's good practice to ensure the REDIS_URL is set
# Using a similar pattern as in celery_app.py for Redis URL
# redis_url_for_slowapi = os.getenv('REDIS_URL', getattr(config, 'REDIS_URL', 'redis://redis:6379/0')) # Original line
redis_url_for_slowapi = 'redis://redis:6379/0' # DEBUG: Hardcoded Redis URL
limiter = Limiter(key_func=get_remote_address, storage_uri=redis_url_for_slowapi, strategy="fixed-window")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global thread_manager
    logger.info(f"Starting up FastAPI application with instance ID: {instance_id} in {config.ENV_MODE.value} mode")
    
    try:
        # Initialize database
        await db.initialize()
        thread_manager = ThreadManager()
        
        # Initialize the agent API with shared resources
        agent_api.initialize(
            thread_manager,
            db,
            instance_id
        )
        
        # Initialize the sandbox API with shared resources
        sandbox_api.initialize(db)
        
        # Initialize Redis connection
        from services import redis
        try:
            await redis.initialize_async()
            logger.info("Redis connection initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Redis connection: {e}")
            # Continue without Redis - the application will handle Redis failures gracefully
        
        # Start background tasks
        asyncio.create_task(agent_api.restore_running_agent_runs())
        
        yield
        
        # Clean up agent resources
        logger.info("Cleaning up agent resources")
        await agent_api.cleanup()
        
        # Clean up Redis connection
        try:
            logger.info("Closing Redis connection")
            await redis.close()
            logger.info("Redis connection closed successfully")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
        
        # Clean up database connection
        logger.info("Disconnecting from database")
        await db.disconnect()
    except Exception as e:
        logger.error(f"Error during application startup: {e}")
        raise

app = FastAPI(lifespan=lifespan)

# Add SlowAPI state and middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware) # Add the middleware
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware to set up request_id for logging
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    # Try to get request_id from header, otherwise generate a new one
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    
    # Set the request_id in the context variable for the logger
    token = logger_request_id.set(req_id)
    
    response = await call_next(request)
    
    # Add request_id to response headers
    response.headers["X-Request-ID"] = req_id
    
    # Reset the context variable
    logger_request_id.reset(token)
    
    return response

@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    client_ip = request.client.host
    method = request.method
    url = str(request.url)
    path = request.url.path
    query_params = str(request.query_params)
    
    # Log the incoming request
    logger.info(f"Request started: {method} {path} from {client_ip} | Query: {query_params}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.debug(f"Request completed: {method} {path} | Status: {response.status_code} | Time: {process_time:.2f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {method} {path} | Error: {str(e)} | Time: {process_time:.2f}s")
        raise

# Define allowed origins based on environment
allowed_origins = ["https://www.suna.so", "https://suna.so", "https://staging.suna.so", "http://localhost:3000"]

# Add staging-specific origins
if config.ENV_MODE == EnvMode.STAGING:
    allowed_origins.append("http://localhost:3000")
    
# Add local-specific origins
if config.ENV_MODE == EnvMode.LOCAL:
    allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include the agent router with a prefix and rate limit
# Example: Apply a specific limit to agent_api router
# You can define different limits for different routers or endpoints
AGENT_API_LIMIT = os.getenv("AGENT_API_LIMIT", "100/minute") 
app.include_router(agent_api.router, prefix="/api", dependencies=[Depends(limiter.limit(AGENT_API_LIMIT))])

# Include the sandbox router with a prefix (example of a different limit or no limit)
SANDBOX_API_LIMIT = os.getenv("SANDBOX_API_LIMIT", "50/minute")
app.include_router(sandbox_api.router, prefix="/api", dependencies=[Depends(limiter.limit(SANDBOX_API_LIMIT))])

# Include the billing router with a prefix
BILLING_API_LIMIT = os.getenv("BILLING_API_LIMIT", "100/minute")
app.include_router(billing_api.router, prefix="/api", dependencies=[Depends(limiter.limit(BILLING_API_LIMIT))])

# Include the kb router (example with a different limit)
KB_API_LIMIT = os.getenv("KB_API_LIMIT", "200/minute")
app.include_router(kb_api_router.router, dependencies=[Depends(limiter.limit(KB_API_LIMIT))])

@app.get("/api/health", 
         summary="Check API Health", 
         response_description="Returns the current operational status and timestamp.")
@limiter.limit("500/minute") # Example: Higher limit for health checks
async def health_check(request: Request): # Add request: Request for limiter
    """Health check endpoint to verify API is working."""
    logger.info("Health check endpoint called")
    return {
        "status": "ok", 
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "instance_id": instance_id
    }

if __name__ == "__main__":
    import uvicorn
    
    workers = 2
    
    logger.info(f"Starting server on 0.0.0.0:8000 with {workers} workers")
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=8000,
        workers=workers,
        reload=True
    )