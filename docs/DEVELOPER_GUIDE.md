# Suna Developer Guide

This document gives developers an overview of the main pieces of the project and how they fit together. It also describes how to run the project locally and how to add a new sandbox provider.

## Module Overview

### Backend services (`backend/`)
- **API** (`api.py`): FastAPI service exposing REST endpoints used by the frontend. It manages threads, messages and authentication through Supabase.
- **Worker** (`run_agent_background.py`): Dramatiq worker consuming tasks via RabbitMQ to execute the agent logic in the background.
- **Services** (`services/`): Helpers for Supabase access, Redis caching, LLM providers and billing logic.

### Agent logic (`backend/agent` and `backend/agentpress`)
- Implements the conversation workflow. `run_agent` orchestrates tool usage and reasoning cycles.
- `agentpress` provides utilities for thread management, response processing and context management.

### Sandbox provider (`backend/sandbox`)
- Handles creation and lifecycle of isolated execution environments. The default implementation uses **Daytona** via the SDK in `sandbox.py`.
- Tools inside `sandbox/tools` (shell, files, browser, etc.) interact with the sandbox through its API.

### Frontend structure (`frontend/`)
- Next.js application (`src/`) with pages under `app/`, shared components in `components/` and hooks/contexts for state management.
- Communicates with the backend API and Supabase authentication from the browser.

### Setup scripts
- **`setup.py`** – interactive wizard that configures environment variables, Supabase and optional services.
- **`start.py`** – convenience script to start/stop the Docker Compose stack.

## Component Interaction

1. **API requests**: The frontend calls the FastAPI backend (port `8000`). Authentication and data persistence are handled by Supabase using the `basejump` schema (see migrations in `backend/supabase/migrations`).
2. **Background tasks**: Agent runs are queued via RabbitMQ and processed by the Dramatiq worker. Redis is used to store state and stream results back to the API.
3. **Sandbox execution**: The worker spins up or resumes a sandbox container through the provider (Daytona by default) and the agent tools operate inside that environment.

The architecture diagram in the README illustrates these relationships.

## Adding a New Sandbox Provider

1. Implement a module under `backend/sandbox` that exposes functions similar to `create_sandbox` and `get_or_start_sandbox` but using your provider's API/SDK.
2. Update `utils/config.py` to include any new environment variables required by the provider.
3. Adjust `docker-compose.yaml` or deployment configuration to supply those variables.
4. Register the new module in the agent tools or replace calls in existing code where Daytona is used.
5. Test by running the worker and ensuring containers are created and commands execute correctly.

## Running Suna Locally

The [Self-Hosting Guide](./SELF-HOSTING.md) contains the full setup instructions. In short:

```bash
python setup.py               # gather config and prepare env files
python start.py               # start or stop the Docker stack
```

For manual development you can start each service separately as shown below:

```bash
docker compose up redis rabbitmq -d
cd frontend && npm run dev      # frontend
cd backend && poetry run python3.11 api.py    # backend API in another terminal
cd backend && poetry run python3.11 -m dramatiq run_agent_background   # worker
```

Refer to the backend README for important environment variables such as `REDIS_HOST` and `RABBITMQ_HOST` when running services outside of Docker.

