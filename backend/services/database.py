"""
Centralized database connection management for Yeti AI using Neon (PostgreSQL).
"""

import os
from typing import Optional
import asyncpg
from utils.logger import logger
from utils.config import config  # Assuming this loads DATABASE_URL
import base64
import uuid
from datetime import datetime

class DBConnection:
    """Singleton database connection manager using asyncpg for PostgreSQL."""

    _instance: Optional['DBConnection'] = None
    _initialized = False
    _pool: Optional[asyncpg.Pool] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def initialize(self):
        """Initialize the database connection pool."""
        if self._initialized:
            return

        try:
            db_url = config.DATABASE_URL # Fetched from .env via utils.config

            if not db_url:
                logger.error("Missing required environment variable DATABASE_URL for PostgreSQL connection")
                raise RuntimeError("DATABASE_URL environment variable must be set.")

            logger.debug("Initializing PostgreSQL connection pool")
            # Adjust connection options as needed, e.g., min/max_size, timeouts
            self._pool = await asyncpg.create_pool(dsn=db_url, min_size=1, max_size=10)
            self._initialized = True
            logger.debug("Database connection pool initialized with PostgreSQL (Neon)")
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            raise RuntimeError(f"Failed to initialize database connection pool: {str(e)}")

    @classmethod
    async def disconnect(cls):
        """Close the database connection pool."""
        if cls._pool:
            logger.info("Closing PostgreSQL connection pool")
            await cls._pool.close()
            cls._initialized = False
            cls._pool = None # Clear the pool instance
            logger.info("Database connection pool closed successfully")

    @property
    async def pool(self) -> asyncpg.Pool:
        """Get the asyncpg connection pool instance."""
        if not self._initialized or not self._pool:
            logger.debug("PostgreSQL pool not initialized, initializing now")
            await self.initialize()
        if not self._pool: # Should be caught by above, but as a safeguard
            logger.error("Database pool is None after initialization")
            raise RuntimeError("Database pool not initialized")
        return self._pool

    async def execute(self, query: str, *args):
        """Execute a SQL query and return the result (e.g., for SELECT)."""
        pool = await self.pool
        async with pool.acquire() as connection:
            return await connection.fetch(query, *args)

    async def execute_val(self, query: str, *args):
        """Execute a SQL query and return a single value (e.g., for SELECT one column/row)."""
        pool = await self.pool
        async with pool.acquire() as connection:
            return await connection.fetchval(query, *args)

    async def execute_row(self, query: str, *args):
        """Execute a SQL query and return a single row."""
        pool = await self.pool
        async with pool.acquire() as connection:
            return await connection.fetchrow(query, *args)

    async def execute_many(self, command: str, args_list: list):
        """Execute a command multiple times with different arguments (e.g., for batch INSERTs)."""
        pool = await self.pool
        async with pool.acquire() as connection:
            async with connection.transaction(): # Usually good to wrap batch ops in a transaction
                await connection.executemany(command, args_list)

    async def execute_script(self, script: str):
        """Execute a script containing multiple SQL statements."""
        pool = await self.pool
        async with pool.acquire() as connection:
            await connection.execute(script)


    # The upload_base64_image method relied on Supabase storage.
    # For a direct PostgreSQL setup, file/image storage needs a different solution:
    # 1. Store images in a bytea column in PostgreSQL (not recommended for large/many files).
    # 2. Use a separate file storage service (like AWS S3, Google Cloud Storage, or a local file server)
    #    and store URLs/references in the database.
    # Since setting up S3/GCS is out of scope for "free alternatives" without more user setup,
    # I will comment out this method for now. If image upload is critical, it needs a dedicated plan.
    # If we want a quick local solution, we could save to a folder on the server and serve it,
    # but that has its own complexities (serving static files, persistence with docker, etc.).

    # async def upload_base64_image(self, base64_data: str, bucket_name: str = "browser-screenshots") -> str:
    #     """
    #     Placeholder: Image uploading needs a new strategy without Supabase storage.
    #     This could involve saving to a local filesystem (if backend is stateful and has disk access)
    #     or integrating with a third-party object storage.
    #     """
    #     logger.warning("upload_base64_image is not implemented for direct PostgreSQL. Relies on object storage.")
    #     # For now, return a dummy path or raise NotImplementedError
    #     # raise NotImplementedError("Image upload needs a non-Supabase storage solution.")
    #
    #     # Example: saving locally (highly dependent on deployment environment)
    #     try:
    #         if base64_data.startswith('data:'):
    #             base64_data = base64_data.split(',')[1]
    #         image_data = base64.b64decode(base64_data)
    #
    #         # Ensure 'uploads' directory exists (relative to where api.py is run)
    #         uploads_dir = "uploads"
    #         os.makedirs(uploads_dir, exist_ok=True)
    #
    #         timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    #         unique_id = str(uuid.uuid4())[:8]
    #         filename = f"image_{timestamp}_{unique_id}.png"
    #         filepath = os.path.join(uploads_dir, filename)
    #
    #         with open(filepath, 'wb') as f:
    #             f.write(image_data)
    #
    #         # This URL would only work if 'uploads' is served statically by the backend
    #         # and the backend is accessible at http://localhost:8000
    #         public_url = f"http://localhost:8000/uploads/{filename}"
    #         logger.debug(f"Image saved locally to {filepath}, accessible at {public_url} (if serving uploads)")
    #         return public_url
    #     except Exception as e:
    #         logger.error(f"Error saving base64 image locally: {e}")
    #         raise RuntimeError(f"Failed to save image locally: {str(e)}")

# Helper to get a DB connection instance easily (optional)
# async def get_db_connection() -> DBConnection:
#     db_conn = DBConnection()
#     if not db_conn._initialized:
#         await db_conn.initialize()
#     return db_conn

# Example usage (if this file were run directly for testing):
# async def main():
#     db = DBConnection()
#     await db.initialize()
#     # Example: Test connection by getting current time from DB
#     # time = await db.execute_val("SELECT NOW();")
#     # print(f"Current DB time: {time}")
#     await db.disconnect()

# if __name__ == "__main__":
#     import asyncio
#     asyncio.run(main())
[end of backend/services/database.py]
