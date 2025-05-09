# Suna Backend

## Running the backend

Within the backend directory, run the following command to stop and start the backend:
```bash
docker compose down && docker compose up --build
```

## Running Individual Services

You can run individual services from the docker-compose file. This is particularly useful during development:

### Running only Redis
```bash
docker compose up redis
```

### Running only the API
```bash
docker compose up api
```

### Running Celery Workers

Celery workers are responsible for handling background tasks, such as those initiated by the agent.

**Using Docker Compose (Recommended for most scenarios):**

If a `worker` service is defined in your `docker-compose.yml` file, you can start it with:

```bash
docker compose up worker
```

To build and start the worker service:

```bash
docker compose up --build worker
```

**Running locally with Poetry (for development):**

Ensure your environment is configured (e.g., `.env` file with `REDIS_HOST=localhost` if Redis is running in Docker and you're running the worker locally).

Navigate to the `backend` directory and run:

```bash
poetry run celery -A celery_app worker -l info --pool=prefork
```

Replace `--pool=prefork` with a different pool if needed (e.g., `gevent` for I/O-bound tasks, but ensure `gevent` is added as a dependency). The default prefork pool is often suitable for CPU-bound tasks.

## Development Setup

For local development, you might only need to run Redis while working on the API locally. This is useful when:
- You're making changes to the API code and want to test them directly
- You want to avoid rebuilding the API container on every change
- You're running the API service directly on your machine

To run just Redis for development:```bash
docker compose up redis
```

Then you can run your API service locally with your preferred method (e.g., poetry run python3.11 api.py).

### Environment Configuration
When running services individually, make sure to:
1. Check your `.env` file and adjust any necessary environment variables
2. Ensure Redis connection settings match your local setup (default: `localhost:6379`)
3. Update any service-specific environment variables if needed

### Important: Redis Host Configuration
When running the API locally with Redis in Docker, you need to set the correct Redis host in your `.env` file:
- For Docker-to-Docker communication (when running both services in Docker): use `REDIS_HOST=redis`
- For local-to-Docker communication (when running API locally): use `REDIS_HOST=localhost`

Example `.env` configuration for local development:
```env
REDIS_HOST=localhost (instead of 'redis')
REDIS_PORT=6379
REDIS_PASSWORD=
```
