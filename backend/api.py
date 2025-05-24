from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from agentpress.thread_manager import ThreadManager
# from services.supabase import DBConnection # Removed Supabase
from services.sqlite_db import initialize_database, get_db_connection # Added SQLite
from datetime import datetime, timezone
from dotenv import load_dotenv
from utils.config import config, EnvMode
import asyncio
from utils.logger import logger
import uuid
import time
from collections import OrderedDict

# Import the agent API module
from agent import api as agent_api
from sandbox import api as sandbox_api
from services import billing as billing_api

# Load environment variables (these will be available through config)
load_dotenv()

# Initialize managers
# db = DBConnection() # Removed Supabase
thread_manager = None
instance_id = "single"
# Note: A global db connection instance for SQLite is not typically managed this way.
# Connections are usually obtained per request or per function needing db access.
# For now, we'll rely on get_db_connection() where needed.

# Rate limiter state
ip_tracker = OrderedDict()
MAX_CONCURRENT_IPS = 25

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global thread_manager
    logger.info(f"Starting up FastAPI application with instance ID: {instance_id} in {config.ENV_MODE.value} mode")

    try:
        # Initialize SQLite database
        initialize_database() # Synchronous call
        logger.info("SQLite database initialized successfully.")

        thread_manager = ThreadManager()

        # Initialize the agent API with shared resources
        # The `db` object needs to be replaced with a way to get SQLite connections
        # For now, agent_api.initialize might need to be adapted or take get_db_connection
        agent_api.initialize(
            thread_manager,
            None, # Passing None for db for now, needs refactor in agent_api
            # Consider passing get_db_connection or let agent_api import it
            instance_id
        )

        # Initialize the sandbox API with shared resources
        # Similar to agent_api, sandbox_api.initialize needs to be adapted for SQLite
        sandbox_api.initialize(None) # Passing None for db for now
        
        # Initialize Redis connection
        from services import redis
        try:
            await redis.initialize_async()
            logger.info("Redis connection initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Redis connection: {e}")
            # Continue without Redis - the application will handle Redis failures gracefully
        
        # Start background tasks
        # asyncio.create_task(agent_api.restore_running_agent_runs())
        
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
        
        # Clean up database connection (SQLite connections are typically managed per use)
        logger.info("SQLite connections are managed per use, no global disconnect needed in lifespan.")
        # If there were any global resources for SQLite, they would be cleaned here.
    except Exception as e:
        logger.error(f"Error during application startup: {e}", exc_info=True) # Added exc_info for more details
        raise

app = FastAPI(lifespan=lifespan)

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

# Include the agent router with a prefix
app.include_router(agent_api.router, prefix="/api")

# Include the sandbox router with a prefix
app.include_router(sandbox_api.router, prefix="/api")

# Include the billing router with a prefix
app.include_router(billing_api.router, prefix="/api")

@app.get("/api/health")
async def health_check():
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
        # reload=True
    )