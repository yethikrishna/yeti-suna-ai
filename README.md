<div align="center">

# Suna - Open Source Generalist AI Agent

(that acts on your behalf)

![Suna Screenshot](frontend/public/banner.png)

Suna is a fully open source AI assistant that helps you accomplish real-world tasks with ease. Through natural conversation, Suna becomes your digital companion for research, data analysis, and everyday challenges—combining powerful capabilities with an intuitive interface that understands what you need and delivers results.

Suna's powerful toolkit includes seamless browser automation to navigate the web and extract data, file management for document creation and editing, web crawling and extended search capabilities, command-line execution for system tasks, website deployment, and integration with various APIs and services. These capabilities work together harmoniously, allowing Suna to solve your complex problems and automate workflows through simple conversations!

[![License](https://img.shields.io/badge/License-Apache--2.0-blue)](./license)
[![Discord Follow](https://dcbadge.limes.pink/api/server/Py6pCBUUPw?style=flat)](https://discord.gg/Py6pCBUUPw)
[![Twitter Follow](https://img.shields.io/twitter/follow/kortixai)](https://x.com/kortixai)
[![GitHub Repo stars](https://img.shields.io/github/stars/kortix-ai/suna)](https://github.com/kortix-ai/suna)
[![Issues](https://img.shields.io/github/issues/kortix-ai/suna)](https://github.com/kortix-ai/suna/labels/bug)

</div>

## Table of Contents

- [Suna Architecture](#project-architecture)
- [Use Cases](#use-cases)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Database Options](#database-options)
- [File Storage in Local Mode](#file-storage-in-local-mode)
- [Authentication in Local Mode](#authentication-in-local-mode)
- [Advanced Self-Hosting with Supabase](#advanced-self-hosting-with-supabase)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Project Architecture

![Architecture Diagram](docs/images/diagram.png)

Suna consists of four main components:

### Backend API
Python/FastAPI service that handles REST endpoints, thread management, and LLM integration. Supports both SQLite (local default) and Supabase (cloud) for data persistence.

### Frontend
Next.js/React application providing a responsive UI with chat interface, dashboard, etc.

### Agent Docker
Isolated execution environment for every agent - with browser automation, code interpreter, file system access, tool integration, and security features. (Often managed by Daytona for more complex sandbox needs, or can be run locally depending on configuration).

### Database
Handles data persistence, conversation history, agent state, etc.
- **Default Local:** SQLite database (auto-created).
- **Cloud/Advanced:** Supabase (PostgreSQL) for authentication, user management, real-time subscriptions, and scalable storage.

## Use Cases
(Use cases section remains unchanged - list of 12 examples)
1. **Competitor Analysis** ...
2. **VC List** ...
3. **Looking for Candidates** ...
4. **Planning Company Trip** ...
5. **Working on Excel** ...
6. **Automate Event Speaker Prospecting** ...
7. **Summarize and Cross-Reference Scientific Papers** ...
8. **Research + First Contact Draft** ...
9. **SEO Analysis** ...
10. **Generate a Personal Trip** ...
11. **Recently Funded Startups** ...
12. **Scrape Forum Discussions** ...


## Getting Started (Local Development)

Suna is designed for a quick local setup using SQLite by default.

1.  **Prerequisites:**
    *   Ensure Git, Docker (and Docker Compose), Python 3.11+, Poetry, Node.js, and npm are installed. The setup wizard (`python setup.py`) can help check these.
    *   Ensure Docker is running.

2.  **Clone the repository**:
    ```bash
    git clone https://github.com/kortix-ai/suna.git
    cd suna
    ```

3.  **Run the setup wizard**:
    *   This script will guide you through creating the necessary `.env` files.
    *   It defaults to SQLite for the database.
    ```bash
    python setup.py
    ```
    *   **Key local configuration (in `backend/.env`):**
        *   `DATABASE_TYPE=sqlite`
        *   `DATA_DIR=data_files` (stores SQLite DB & local file uploads)
        *   `SQLITE_DB_PATH=suna_local.db` (created as `data_files/suna_local.db`)
        *   You will need to provide at least one LLM API key (e.g., `OPENAI_API_KEY`) for AI features.
        *   Other cloud service keys (Supabase, Stripe, Sentry, etc.) are optional for basic local operation.

4.  **Start Suna services**:
    *   This command uses Docker Compose to build and start the backend, frontend, Redis, and RabbitMQ.
    ```bash
    python start.py
    ```
    *   Alternatively, to build images locally (if not using pre-built ones or modifying code):
        `docker compose up -d --build`

5.  **Access Suna**:
    *   Open your browser and go to `http://localhost:3000`.

## Database Options

Suna's backend can be configured to use different database types via the `DATABASE_TYPE` environment variable in `backend/.env`:

*   **`sqlite` (Default for Local Setup):**
    *   Uses a local SQLite database file.
    *   The path is defined by `SQLITE_DB_PATH`, which is relative to `DATA_DIR`. Default: `data_files/suna_local.db`.
    *   The database schema is automatically created on first run.
    *   Ideal for local development, testing, and single-user instances.

*   **`supabase` (For Cloud/Advanced Use):**
    *   Uses a Supabase project (PostgreSQL) for data storage, authentication, and other BaaS features.
    *   Requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to be set in `backend/.env`.
    *   Suitable for multi-user deployments, cloud hosting, and when leveraging Supabase-specific features like real-time subscriptions. See [Advanced Self-Hosting with Supabase](#advanced-self-hosting-with-supabase).

## File Storage in Local Mode

When `DATABASE_TYPE=sqlite`:
*   Files uploaded by or for agents (e.g., browser screenshots, generated documents) are stored locally on the filesystem.
*   The base directory for these uploads is `DATA_DIR/local_uploads/` (e.g., `data_files/local_uploads/`).
*   Files are organized by "bucket" and then by their specified path within the bucket (e.g., `data_files/local_uploads/browser-screenshots/some_file.png`).
*   Accessing these files from the frontend for display might require serving `DATA_DIR` via a static file server or specific API endpoints (future enhancement).

## Authentication in Local Mode

When `DATABASE_TYPE=sqlite`:
*   The system uses a default local user (`local_default_user`) for operations that require a user context if no JWT is provided via an `Authorization` header.
*   This simplifies local development as you can interact with most API endpoints without needing to generate or manage JWTs for this default user.
*   If a valid JWT is provided, its `user_id` will be used.
*   Full multi-user features and advanced authentication/authorization are typically managed by Supabase when `DATABASE_TYPE=supabase`.

## Disabled/Simplified Features in Local (SQLite) Mode
When using `DATABASE_TYPE=sqlite`, certain features that rely on Supabase or other cloud services are disabled or operate in a simplified manner:
*   **Stripe Billing:** Disabled. All users effectively operate on a permissive local plan.
*   **Multi-User Management:** Advanced user roles and organization features tied to Supabase/Basejump are not active. The system operates primarily with the `local_default_user`.
*   **Supabase-Specific Utility Scripts:** Several utility scripts in `backend/utils/scripts/` designed for a Supabase environment (e.g., related to billing customer status) are disabled.
*   **Real-time features:** Features relying on Supabase Realtime (if any were deeply integrated) would not be available.

## Advanced Self-Hosting with Supabase

For users who prefer or require a Supabase backend (e.g., for multi-user support, cloud hosting, or specific Supabase features), please refer to our detailed [Self-Hosting Guide](./docs/SELF-HOSTING.md). This guide covers:
- Setting up a Supabase project.
- Configuring Suna to use Supabase (`DATABASE_TYPE=supabase` and related keys).
- Running Supabase database migrations.
- Detailed setup for other optional cloud services.


## Contributing

We welcome contributions from the community! Please see our [Contributing Guide](./CONTRIBUTING.md) for more details.

## Acknowledgements
(Acknowledgements section remains unchanged)
### Main Contributors
### Technologies

## License

Kortix Suna is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.
