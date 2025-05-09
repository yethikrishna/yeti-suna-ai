FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENV_MODE="production" \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    # Add poetry installer
    && pip install poetry \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and set up directories
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/logs && \
    chown -R appuser:appuser /app

# Install Python dependencies
COPY --chown=appuser:appuser pyproject.toml poetry.lock* ./
# RUN pip install --no-cache-dir -r requirements.txt gunicorn # Old way
RUN poetry install --no-dev --no-interaction --no-ansi --no-root

# Switch to non-root user
USER appuser

# Copy application code
COPY --chown=appuser:appuser . .

# Expose the port the app runs on
EXPOSE 8000

# Calculate optimal worker count based on 16 vCPUs
# Using (2*CPU)+1 formula for CPU-bound applications
# ENV WORKERS=33 # Original high value
# ENV THREADS=2   # Original high value
# Adjust WORKERS based on available vCPUs (e.g., NUM_CORES or (2*NUM_CORES)+1) and performance testing
# ENV WORKERS=4 (This line will be removed)
# Uvicorn workers are async, THREADS typically 1 is fine
ENV THREADS=1 
# WORKER_CONNECTIONS reduced from 2000, still high, tune as needed
ENV WORKER_CONNECTIONS=1000

# Gunicorn configuration
# Default Gunicorn workers ($GUNICORN_WORKERS) are dynamically set based on os.cpu_count() (fallback to 2).
# Override by setting the WORKERS environment variable (e.g., 'docker run -e WORKERS=N ...').
# The $THREADS and $WORKER_CONNECTIONS variables are taken directly from the environment.
CMD ["sh", "-c", "AUTO_WORKERS=$(python3 -c \\"import os; print(os.cpu_count() or 2)\\"); GUNICORN_WORKERS=${WORKERS:-$AUTO_WORKERS}; exec gunicorn api:app --workers $GUNICORN_WORKERS --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 60 --graceful-timeout 30 --keep-alive 5 --max-requests 2000 --max-requests-jitter 400 --forwarded-allow-ips '*' --worker-connections $WORKER_CONNECTIONS --worker-tmp-dir /dev/shm --preload --log-level info --access-logfile - --error-logfile - --capture-output --enable-stdio-inheritance --threads $THREADS"]
