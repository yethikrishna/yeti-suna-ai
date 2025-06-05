import os
from langfuse import Langfuse

public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
secret_key = os.getenv("LANGFUSE_SECRET_KEY")
host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

enabled = False
if public_key and secret_key:
    enabled = True

# Initialize langfuse with proper configuration for v3
langfuse = Langfuse(
    public_key=public_key,
    secret_key=secret_key,
    host=host,
    tracing_enabled=enabled  # v3 uses tracing_enabled instead of enabled
)
