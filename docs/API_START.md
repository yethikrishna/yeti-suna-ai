# How to Start the Suna API

This guide shows you how to run the Suna backend (FastAPI) locally.

## Prerequisites

- Python 3.10+
- [Poetry](https://python-poetry.org/) or `pip`
- A Supabase project and its credentials
- An OpenRouter API key (for LLM calls)
- Redis (for caching and pub/sub)

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/darwin-labs/suna-api.git
   cd suna-api/backend
   ```

2. Copy and fill environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and set:
   # SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   # OPENROUTER_API_KEY
   # REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
   ```

3. Install dependencies:

   **With Poetry**:
   ```bash
   poetry install
   poetry shell
   ```

   **With pip**:
   ```bash
   pip install -r requirements.txt
   ```

4. Start Redis (if not already running):
   ```bash
   redis-server --daemonize yes
   ```

5. Launch the FastAPI server:
   ```bash
   uvicorn api:app \
       --host 0.0.0.0 \
       --port 8000 \
       --reload
   ```

## Verify

- Open your browser at `http://localhost:8000/api/health-check`
- You should see:
  ```json
  { "status": "ok", "timestamp": "...", "instance_id": "..." }
  ```

## Next Steps

- Update your frontend `NEXT_PUBLIC_BACKEND_URL` to `http://localhost:8000`.
- Refer to the [API docs](http://localhost:8000/docs) for available endpoints.
- For production, consider deploying with Docker or Fly.io using provided config files.
