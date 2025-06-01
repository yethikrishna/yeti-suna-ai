"""
Utility functions for handling image operations.
"""

import base64
import uuid
from datetime import datetime
from utils.logger import logger
# from services.supabase import DBConnection # Replaced by DAL
from backend.database.dal import get_db_client # Import DAL
import base64 # Ensure base64 is imported

async def upload_base64_image(base64_data: str, bucket_name: str = "browser-screenshots", file_name_prefix: str = "image") -> str:
    """
    Upload a base64 encoded image using the DAL's storage interface and return the public URL.
    
    Args:
        base64_data (str): Base64 encoded image data (with or without data URL prefix)
        bucket_name (str): Name of the storage bucket to upload to
        file_name_prefix (str): Prefix for the generated filename.
        
    Returns:
        str: Public URL of the uploaded image
    """
    try:
        # Remove data URL prefix if present
        if base64_data.startswith('data:'):
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 data
        image_bytes = base64.b64decode(base64_data)
        
        # Generate unique filename (path within the bucket)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        # Example: browser-screenshots/image_20231027_123456_abcdef12.png
        # The DAL's upload_file takes file_path_in_bucket.
        # Let's construct a path that might include subdirectories if needed, e.g., based on user or date.
        # For simplicity, keeping it flat within the bucket for now.
        file_path_in_bucket = f"{file_name_prefix}_{timestamp}_{unique_id}.png"

        # Get DAL client
        db_dal = await get_db_client()

        # Upload using DAL
        # The DAL's upload_file returns the logical path used for storage.
        # For Supabase, this path is then used with get_public_url.
        # For LocalFileStorage, get_public_url might construct a file URI or a relative server path.
        logical_path = await db_dal.upload_file(
            bucket_name=bucket_name,
            file_path=file_path_in_bucket, # This is path_in_bucket for DAL's upload_file
            file_data=image_bytes,
            content_type="image/png"
        )
        
        # Get public URL using DAL
        # The `logical_path` returned by `upload_file` should be the `file_path_in_bucket` for `get_public_url`.
        public_url = await db_dal.get_public_url(bucket_name, logical_path)
        
        logger.debug(f"Successfully uploaded image via DAL. Public URL: {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"Error uploading base64 image via DAL: {e}", exc_info=True)
        raise RuntimeError(f"Failed to upload image via DAL: {str(e)}")