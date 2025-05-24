# Novah Backend

The Novah backend consists of an API service and one or more Worker services, orchestrated using Docker Compose (see `backend/docker-compose.yml` for this specific configuration or the root `docker-compose.yaml` for the full application stack).

## Running the Backend (using `backend/docker-compose.yml`)

Within the `backend` directory, you can manage the backend services (API, workers, RabbitMQ) using its dedicated Docker Compose file. This is typically used for more isolated backend development or testing.

To stop and restart all services defined in `backend/docker-compose.yml`:
```bash
docker-compose down && docker-compose up --build -d
```
*(The `-d` flag runs containers in detached mode.)*

To view logs:
```bash
docker-compose logs -f <service_name> 
# e.g., docker-compose logs -f api
# or docker-compose logs -f worker-1
```

## Running Individual Services (using `backend/docker-compose.yml`)

You can run individual services from this Docker Compose file.

### Running only RabbitMQ
RabbitMQ is essential for the workers.
```bash
docker-compose up rabbitmq -d
```

### Running only the API and Workers
This assumes RabbitMQ is already running (either via the command above or managed externally).
```bash
docker-compose up api worker-1 worker-2 --build -d 
# Adjust worker names as defined in backend/docker-compose.yml
```

## Development Setup (Local Python, Dockerized RabbitMQ)

For local development of the backend API or worker code without full containerization of the Python services:

1.  **Start RabbitMQ using Docker Compose**:
    ```bash
    # From the backend directory
    docker-compose up rabbitmq -d
    ```

2.  **Configure `backend/.env` for Local Development**:
    Ensure your `backend/.env` file has `RABBITMQ_HOST=localhost` if RabbitMQ is running in Docker but your Python services are running directly on your host.
    Also, set your `GEMINI_API_KEY` and define a local path for `SQLITE_DB_PATH`, e.g., `SQLITE_DB_PATH=./agentpress_dev.db`.

    Example relevant lines in `backend/.env` for local development:
    ```sh
    RABBITMQ_HOST=localhost 
    RABBITMQ_PORT=5672

    GEMINI_API_KEY=your_gemini_api_key_here
    SQLITE_DB_PATH=./agentpress_dev.db 
    # This will create the SQLite file in your current backend directory
    ```

3.  **Run API Service Locally** (in one terminal):
    ```bash
    # Navigate to the backend directory
    cd backend 
    poetry install # Install dependencies
    poetry run uvicorn api:app --host 0.0.0.0 --port 8000 --reload 
    ```
    The API service will start, and on its first run, it will create the SQLite database file (`agentpress_dev.db` in this example) if it doesn't exist.

4.  **Run Worker Service Locally** (in another terminal):
    ```bash
    # Navigate to the backend directory
    cd backend
    poetry install # If not already done
    poetry run dramatiq run_agent_background
    ```

### Environment Configuration Notes:

*   The `backend/docker-compose.yml` file defines services like `api`, `worker-1`, `worker-2`, and `rabbitmq`.
*   When services run within this Docker Compose network, they can refer to each other by their service names (e.g., `rabbitmq`).
*   If you run Python services locally but RabbitMQ in Docker (as per the development setup above), `localhost` is used for `RABBITMQ_HOST` because Docker typically maps the container's port to `localhost` on your host machine.
*   Ensure `GEMINI_API_KEY` is always set in your active `.env` file.
*   The `SQLITE_DB_PATH` in `backend/.env` will determine where the SQLite database file is stored. For Dockerized services in `backend/docker-compose.yml`, this path is inside the container (e.g., `/app/db/agentpress.db`) and is mapped to a host volume (`./db_data_backend`). For local development, you'd set it to a local file path.
