import os
import aiofiles
from pathlib import Path
from backend.utils.config import config # Assuming config will have DATA_DIR
import logging
from typing import Optional

class LocalFileStorage:
    def __init__(self, base_storage_path: str = "local_uploads"):
        # Ensure DATA_DIR is defined in config, or have a default here
        data_dir = getattr(config, 'DATA_DIR', 'data_files') # Default to 'data_files' if not in config
        self.base_path = Path(data_dir) / base_storage_path

        try:
            self.base_path.mkdir(parents=True, exist_ok=True)
            logging.info(f"LocalFileStorage initialized at: {self.base_path.resolve()}")
        except Exception as e:
            logging.error(f"Failed to create base storage directory {self.base_path.resolve()}: {e}", exc_info=True)
            # Depending on desired strictness, could raise an error here
            # For now, we'll log and continue; operations will likely fail if dir doesn't exist.

    async def upload_file(self, bucket_name: str, file_path_in_bucket: str, file_body: bytes, content_type: Optional[str] = None) -> str:
        if not self.base_path.exists():
            logging.error(f"Base storage path {self.base_path} does not exist. Cannot upload file.")
            raise IOError(f"Base storage path {self.base_path} missing.")

        bucket_dir = self.base_path / bucket_name
        try:
            bucket_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logging.error(f"Failed to create bucket directory {bucket_dir}: {e}", exc_info=True)
            raise IOError(f"Could not create bucket directory {bucket_dir}.")

        # Sanitize file_path_in_bucket to prevent directory traversal issues if it contains '..'
        # Path objects usually handle this well, but an explicit check or more robust sanitization might be needed
        # depending on the source of file_path_in_bucket.
        # For now, relying on Path's behavior.
        full_file_path = bucket_dir / file_path_in_bucket

        try:
            full_file_path.parent.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logging.error(f"Failed to create parent directory for {full_file_path}: {e}", exc_info=True)
            raise IOError(f"Could not create parent directory for {full_file_path}.")

        async with aiofiles.open(full_file_path, "wb") as f:
            await f.write(file_body)

        logging.info(f"File uploaded to local storage: {full_file_path.resolve()}")
        # Return a "logical" path that can be used by get_public_url or for internal reference
        logical_path = str(Path(bucket_name) / file_path_in_bucket)
        return logical_path

    def get_public_url(self, bucket_name: str, file_path_in_bucket: str) -> str:
        # This needs to align with how files will actually be served.
        # Option 1: Return a file URI (works for local access, not web)
        # full_local_path = (self.base_path / bucket_name / file_path_in_bucket).resolve()
        # return full_local_path.as_uri()

        # Option 2: Return a path relative to a known static serving endpoint (e.g., /static_files/local_uploads/...)
        # This requires setting up a static file server in FastAPI for the DATA_DIR.
        # For now, we return a path that can be used by such an endpoint.
        # The actual URL construction would be: f"{config.APP_BASE_URL}/static_files/{storage_base_path}/{bucket_name}/{file_path_in_bucket}"
        # For simplicity, return the logical path that can be prepended by a base URL for static files.
        logical_path = str(Path(self.base_path.name) / bucket_name / file_path_in_bucket) # e.g. local_uploads/bucket/file.png
        logging.info(f"Local URL (logical path) requested for: {logical_path}")
        # This path would be relative to DATA_DIR if DATA_DIR is served.
        # e.g., if DATA_DIR is served at /data, then URL is /data/local_uploads/bucket/file.png
        return logical_path


    async def delete_file(self, bucket_name: str, file_path_in_bucket: str) -> None:
        if not self.base_path.exists():
            logging.warning(f"Base storage path {self.base_path} does not exist. Cannot delete file.")
            return

        full_file_path = self.base_path / bucket_name / file_path_in_bucket
        try:
            if full_file_path.is_file():
                os.remove(full_file_path)
                logging.info(f"File deleted from local storage: {full_file_path}")
            else:
                logging.warning(f"File not found for deletion (or not a file): {full_file_path}")
        except FileNotFoundError:
            logging.warning(f"File not found for deletion: {full_file_path}")
        except OSError as e:
            logging.error(f"Error deleting file {full_file_path}: {e}", exc_info=True)
            raise # Re-raise OS errors as they might be more critical

    async def file_exists(self, bucket_name: str, file_path_in_bucket: str) -> bool:
        if not self.base_path.exists():
            return False
        full_file_path = self.base_path / bucket_name / file_path_in_bucket
        return full_file_path.is_file()

    async def read_file(self, bucket_name: str, file_path_in_bucket: str) -> Optional[bytes]:
        if not await self.file_exists(bucket_name, file_path_in_bucket):
            logging.warning(f"Cannot read file, does not exist: {bucket_name}/{file_path_in_bucket}")
            return None

        full_file_path = self.base_path / bucket_name / file_path_in_bucket
        try:
            async with aiofiles.open(full_file_path, "rb") as f:
                content = await f.read()
            return content
        except Exception as e:
            logging.error(f"Error reading file {full_file_path}: {e}", exc_info=True)
            return None
