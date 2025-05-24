# Novah Self-Hosting Guide

This guide provides detailed instructions for setting up and hosting your own instance of Novah, an open-source generalist AI agent.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Manual Configuration](#manual-configuration)
- [Post-Installation Steps](#post-installation-steps)
- [Troubleshooting](#troubleshooting)

## Overview

Novah's architecture includes the following main components:

1.  **Backend API** - Python/FastAPI service for REST endpoints, thread management, and LLM integration with Google Gemini.
2.  **Backend Worker** - Python/Dramatiq worker service for handling agent tasks via RabbitMQ.
3.  **Frontend** - Next.js/React application providing the user interface. Authentication is currently mocked.
4.  **Agent Docker Sandbox** - Isolated execution environment for each agent, managed by the Docker SDK. The sandbox image includes tools for browser automation (Playwright), code interpretation, and file system access.
5.  **SQLite Database** - Handles data persistence for conversation history, agent state, etc. Stored in a Docker volume.
6.  **RabbitMQ** - Message broker for the backend worker tasks.

## Prerequisites

Before starting the installation process, you'll need to set up the following:

### 1. API Keys

Obtain the following API key:

#### Required
- **LLM Provider**:
  - [Google Gemini API Key](https://ai.google.dev/): For core LLM capabilities.

#### Optional (for certain data provider tools, if used)
- **RapidAPI Key**: If you plan to use tools that leverage RapidAPI.

### 2. Required Software

Ensure the following tools are installed on your system:

- **[Git](https://git-scm.com/downloads)**
- **[Docker](https://docs.docker.com/get-docker/)** and **[Docker Compose](https://docs.docker.com/compose/install/)**
- **[Python 3.11+](https://www.python.org/downloads/)** (primarily for local development/setup scripts; core application runs in Docker)
- **[Poetry](https://python-poetry.org/docs/#installation)** (for backend Python dependency management if developing locally)
- **[Node.js & npm](https://nodejs.org/en/download/)** (for frontend development if developing locally)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/novah-ai/novah.git # TODO: Update with correct repo URL
cd novah
```

### 2. Configure Environment Variables

Copy the example environment files and fill in your details:

- **Backend**: Copy `backend/.env.example` to `backend/.env`.
  - Edit `backend/.env` and set your `GEMINI_API_KEY`.
  - `SQLITE_DB_PATH` is set to `/app/db/agentpress.db` by default (path inside the Docker container).
  - `RABBITMQ_HOST` defaults to `rabbitmq` (the service name in `docker-compose.yaml`).

- **Frontend**: Copy `frontend/.env.example` to `frontend/.env.local`.
  - `NEXT_PUBLIC_BACKEND_URL` should be set to `http://localhost:8000` if you're running the backend via the main `docker-compose.yaml`. (Note: The `api` prefix is handled by the frontend's API client).

### 3. Build and Run with Docker Compose

This is the recommended method for running Novah. It starts all required services (backend, worker, frontend, RabbitMQ) in Docker containers. The SQLite database will be stored in a Docker volume named `db_data` (as defined in the root `docker-compose.yaml`).

```bash
docker-compose up --build -d
```
To stop the services:
```bash
docker-compose down
```

### 4. (Optional) Setup Script
A `setup.py` script might be available for initial configuration or database migrations (though SQLite migrations are handled by the backend on startup). If available and updated for the new architecture:
```bash
python setup.py
```
*Note: The original `setup.py` and `start.py` scripts from the Suna architecture are likely outdated and may require significant updates or may no longer be necessary with the Docker Compose focused setup.*

## Manual Configuration Details

### Backend Configuration (`backend/.env`)

Key variables:
```sh
# Environment Mode (local, staging, production)
ENV_MODE=local

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

# LLM Provider (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# SQLite Database Path (inside the backend/worker containers)
SQLITE_DB_PATH=/app/db/agentpress.db

# Optional: For data provider tools
# RAPID_API_KEY=your_rapidapi_key
```

### Frontend Configuration (`frontend/.env.local`)

Key variables:
```sh
NEXT_PUBLIC_ENV_MODE="LOCAL" # Or "STAGING", "PRODUCTION"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000" # URL of the backend API
# NEXT_PUBLIC_URL="" # Base URL of the frontend application if needed
# NEXT_PUBLIC_GOOGLE_CLIENT_ID="" # Google Client ID if you re-implement Google Sign-In with a new backend
```
Authentication is currently mocked in the frontend. User-specific features will use a mock user.

## Post-Installation Steps

1.  **Verify Services**: After running `docker-compose up`, check the logs to ensure all services started correctly:
    ```bash
    docker-compose logs -f backend
    docker-compose logs -f worker
    docker-compose logs -f frontend
    docker-compose logs -f rabbitmq
    ```
2.  **Access Frontend**: Open your browser and navigate to `http://localhost:3000`.
3.  **Access Backend API Docs**: Navigate to `http://localhost:8000/docs` for the FastAPI Swagger UI.

## Startup Options

### 1. Using Docker Compose (Recommended)

This is the primary method described in **Installation Steps**.
```bash
docker-compose up --build -d
```
To view logs:
```bash
docker-compose logs -f
```
To stop:
```bash
docker-compose down
```

### 2. Manual Startup (for Development)

This method requires you to start each component separately and is generally used for development purposes.

1.  **Start RabbitMQ**:
    ```bash
    docker-compose up rabbitmq -d 
    ```
    *(Ensure your `backend/.env` `RABBITMQ_HOST` is set to `localhost` if running backend outside Docker but RabbitMQ in Docker, or configure Docker networking accordingly).*

2.  **Start the Backend API** (in one terminal):
    ```bash
    cd backend
    poetry install
    poetry run uvicorn api:app --host 0.0.0.0 --port 8000 --reload
    ```
    *(Ensure `backend/.env` is configured, especially `GEMINI_API_KEY` and `SQLITE_DB_PATH` for local storage, e.g., `SQLITE_DB_PATH=./agentpress_dev.db`)*. The backend will create and initialize the SQLite DB on startup.

3.  **Start the Backend Worker** (in another terminal):
    ```bash
    cd backend
    poetry install # if not already done
    poetry run dramatiq run_agent_background 
    ```
    *(Worker also reads `backend/.env`)*.

4.  **Start the Frontend** (in a third terminal):
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *(Ensure `frontend/.env.local` `NEXT_PUBLIC_BACKEND_URL` points to `http://localhost:8000`)*.

## Troubleshooting

### Common Issues

1.  **Docker Services Not Starting**:
    *   Check Docker daemon status.
    *   Run `docker-compose logs <service_name>` for specific error messages.
    *   Ensure required ports (e.g., 3000, 8000, 5672) are free on your host machine if not using default Docker networking.
2.  **Database Issues (SQLite)**:
    *   Check permissions for the Docker volume mount point (`./db_data` on the host mapped to `/app/db` in containers).
    *   The database file (`agentpress.db`) will be created by the backend on its first run if it doesn't exist.
3.  **LLM API Key Issues**:
    *   Verify `GEMINI_API_KEY` is correctly set in `backend/.env`.
    *   Check for API usage limits or restrictions with your Google AI Studio account.
4.  **Agent Sandbox Issues**:
    *   Ensure the Docker image specified in `backend/sandbox/sandbox.py` (via `Configuration.SANDBOX_IMAGE_NAME`) is available locally or can be pulled. This image should contain all necessary tools for the agent (Python, browser, etc.).
    *   The default sandbox image name is usually defined in `backend/utils/config.py` under `Configuration.SANDBOX_IMAGE_NAME`.

### Logs

-   **Docker Compose**: `docker-compose logs -f <service_name>` (e.g., `backend`, `worker`, `frontend`, `rabbitmq`)
-   **Manual Startup**: Check the console output in each terminal where the services are running. Backend and worker logs are also typically written to files within their Docker containers (or locally if run manually).

---

For further assistance, join the [Novah Discord Community](https://discord.gg/Py6pCBUUPw) <!-- TODO: Update Discord link --> or check the [GitHub repository](https://github.com/novah-ai/novah) <!-- TODO: Update GitHub repo link --> for updates and issues.
