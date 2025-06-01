# Suna Self-Hosting Guide (Advanced / Supabase Backend)

**Note for Local Development:** The default and quickest way to get Suna running locally is now with SQLite, which simplifies setup considerably. Please see the main [README.md](../README.md#getting-started-local-development) for the local SQLite setup instructions. This guide provides detailed instructions for setting up Suna with a **Supabase backend**, which is recommended for multi-user environments, cloud deployments, or when leveraging specific Supabase features.

## Table of Contents
(Table of Contents remains the same)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Manual Configuration](#manual-configuration)
- [Post-Installation Steps](#post-installation-steps)
- [Troubleshooting](#troubleshooting)

## Overview
(Overview remains mostly the same, but clarifies Supabase is one option)
Suna consists of four main components:
1.  **Backend API** - Python/FastAPI service.
2.  **Backend Worker** - Python/Dramatiq worker service.
3.  **Frontend** - Next.js/React application.
4.  **Agent Docker** - Isolated execution environment.
5.  **Database Backend**:
    *   **SQLite (Default for Local):** Simple local file-based database. See main `README.md`.
    *   **Supabase (PostgreSQL):** Used for this guide. Handles data persistence, authentication, user management, etc.

## Prerequisites

To follow this guide for a **Supabase-backed Suna instance**, you'll need:

### 1. Supabase Project (If using Supabase)
    *   Create an account at [Supabase](https://supabase.com/)
    *   Create a new project
    *   Note down: Project URL, anon key, service role key (from Project Settings → API).

### 2. API Keys
Obtain the following API keys:

#### Required (for core functionality)
*   **LLM Provider** (at least one): Anthropic, OpenAI, Groq, OpenRouter, AWS Bedrock.
*   **Search and Web Scraping**: Tavily, Firecrawl.
*   **Agent Execution (Optional but Recommended for advanced sandboxing)**: Daytona. If not configured, local Docker execution might be used for sandboxes, which has different security implications.

#### Optional (for extended features)
*   **RapidAPI**
*   **Sentry, Langfuse** (for observability)
*   **Stripe** (if enabling billing for a deployed version)


### 3. Required Software
(List remains the same: Git, Docker, Python 3.11, Poetry, Node.js & npm, Supabase CLI - Supabase CLI is essential if managing a Supabase backend).

## Installation Steps

These steps assume you are setting up Suna with a **Supabase backend**. For the default SQLite local setup, refer to the main `README.md`.

### 1. Clone the Repository
```bash
git clone https://github.com/kortix-ai/suna.git
cd suna
```

### 2. Run the Setup Wizard
The setup wizard will guide you. **Ensure you select "Supabase" when prompted for the database type.**
```bash
python setup.py
```
The wizard will:
- Check prerequisites.
- Collect API keys and configuration.
- If Supabase is chosen:
    - Guide Supabase CLI login and project linking.
    - Run database migrations against your Supabase instance.
- Configure `.env` files (e.g., `backend/.env` will have `DATABASE_TYPE=supabase`).
- Install dependencies.
- Guide starting Suna.

### 3. Supabase Configuration (If Supabase selected in wizard)
The wizard automates much of this. Manual steps include:
1.  Log in to the Supabase CLI (`supabase login`).
2.  Link to your project (`supabase link --project-ref YOUR_PROJECT_REF`). This is done from the `backend` directory.
3.  Push database migrations (`supabase db push`). This is done from the `backend` directory.
4.  **Manually expose the 'basejump' schema in Supabase Dashboard:**
    *   Project Settings → API → Exposed schemas. Add 'basejump'.

### 4. Daytona Configuration (If using Daytona)
(Daytona configuration steps remain the same)

## Manual Configuration

If you need to manually configure or update your `.env` files:

### Backend Configuration (`backend/.env`)
Ensure `DATABASE_TYPE=supabase` if using Supabase.
```sh
# Environment Mode
ENV_MODE=local # or staging, production

# DATABASE Configuration
DATABASE_TYPE=supabase # Set to supabase for this guide
DATA_DIR=data_files # Still used for other local data if any, less critical for Supabase setup

# SQLite Configuration (Ignored if DATABASE_TYPE=supabase)
# SQLITE_DB_PATH=suna_local.db

# Supabase Configuration (Required if DATABASE_TYPE=supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ... (other variables like REDIS, RABBITMQ, LLM keys, optional service keys as before) ...
# Ensure LLM keys, TAVILY_API_KEY, FIRECRAWL_API_KEY are set.
# Daytona keys if used.
# Optional: SENTRY_DSN, LANGFUSE keys, STRIPE keys etc.

NEXT_PUBLIC_URL=http://localhost:3000 # Or your deployed frontend URL
```

### Frontend Configuration (`frontend/.env.local`)
If using Supabase for the backend, ensure these are correctly set:
```sh
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=http://backend:8000/api # Or your deployed backend URL
NEXT_PUBLIC_URL=http://localhost:3000 # Or your deployed frontend URL
NEXT_PUBLIC_ENV_MODE=LOCAL # or STAGING, PRODUCTION
```

## Post-Installation Steps
(Remains the same)
1. **Create an account** - Use Supabase authentication.
2. **Verify installations**.

## Startup Options
(Remains the same, but context is now a Supabase-backed setup if this guide was followed)

### 1. Using Docker Compose (Recommended)
```bash
docker compose up -d # Use `docker compose down` to stop it later
# or
python start.py # Use the same to stop it later
```

### 2. Manual Startup
(Instructions remain the same)

## Troubleshooting
(Remains largely the same, but database issues will point to Supabase)

### Common Issues
1.  **Docker services not starting**
2.  **Database connection issues**
    *   Verify Supabase URL and keys in `backend/.env`.
    *   Check if 'basejump' schema is exposed in Supabase.
    *   Ensure Supabase project is active and accessible.
3.  **LLM API key issues**
4.  **Daytona connection issues**

### Logs
(Log commands remain the same)

---

For further assistance, join the [Suna Discord Community](https://discord.gg/Py6pCBUUPw) or check the [GitHub repository](https://github.com/kortix-ai/suna) for updates and issues.
