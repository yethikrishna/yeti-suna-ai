import aiosqlite
import logging

async def create_users_table(conn: aiosqlite.Connection):
    """
    Creates the 'users' table.
    - id: Primary key (TEXT UUID from Supabase Auth)
    - email: User's email (TEXT, UNIQUE)
    - display_name: User's display name (TEXT, nullable)
    - created_at: Timestamp of creation (TEXT, default to current timestamp)
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            display_name TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    logging.info("Table 'users' created or already exists.")

async def create_threads_table(conn: aiosqlite.Connection):
    """
    Creates the 'threads' table.
    - id: Primary key (TEXT UUID)
    - user_id: Foreign key to users table (TEXT)
    - agent_id: ID of the agent associated with the thread (TEXT, nullable)
    - title: Title of the thread (TEXT, nullable)
    - created_at: Timestamp of creation (TEXT, default to current timestamp)
    - updated_at: Timestamp of last update (TEXT, default to current timestamp)
    - metadata: JSON stored as TEXT (TEXT, nullable)
    """
    # SQLite doesn't have a native JSONB type, TEXT will be used to store JSON strings.
    # Timestamps are stored as TEXT in ISO8601 format.
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS threads (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            agent_id TEXT,
            title TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    # Trigger for updated_at
    await conn.execute("""
        CREATE TRIGGER IF NOT EXISTS update_threads_updated_at
        AFTER UPDATE ON threads
        FOR EACH ROW
        BEGIN
            UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    """)
    logging.info("Table 'threads' created or already exists.")

async def create_messages_table(conn: aiosqlite.Connection):
    """
    Creates the 'messages' table.
    - id: Primary key (TEXT UUID)
    - thread_id: Foreign key to threads table (TEXT)
    - role: Role of the message sender (e.g., 'user', 'assistant', 'system', 'tool') (TEXT)
    - content: Content of the message (JSON stored as TEXT)
    - type: Type of message (e.g., 'user', 'assistant', 'status', 'summary', 'tool_call', 'tool_result') (TEXT, default 'user')
    - run_id: ID of the agent run this message belongs to (TEXT, nullable)
    - created_at: Timestamp of creation (TEXT, default to current timestamp)
    - metadata: Additional metadata (JSON stored as TEXT, nullable)
    """
    # content and metadata will store JSON strings.
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            thread_id TEXT,
            role TEXT,
            content TEXT,
            type TEXT DEFAULT 'user',
            run_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE
        )
    """)
    logging.info("Table 'messages' created or already exists.")

async def create_projects_table(conn: aiosqlite.Connection):
    """
    Creates the 'projects' table.
    - id: Primary key (TEXT UUID)
    - user_id: Foreign key to users table (TEXT NOT NULL)
    - name: Project name (TEXT, nullable)
    - created_at: Timestamp of creation (TEXT, default to current timestamp)
    - updated_at: Timestamp of last update (TEXT, default to current timestamp)
    - sandbox: JSON sandbox info stored as TEXT (TEXT, nullable)
    - is_public: Boolean flag for public projects (BOOLEAN, default FALSE)
    - metadata: JSON stored as TEXT (TEXT, nullable)
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            sandbox TEXT,
            is_public BOOLEAN DEFAULT FALSE,
            metadata TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    # Trigger for updated_at
    await conn.execute("""
        CREATE TRIGGER IF NOT EXISTS update_projects_updated_at
        AFTER UPDATE ON projects
        FOR EACH ROW
        BEGIN
            UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    """)
    logging.info("Table 'projects' created or already exists.")

async def create_agents_table(conn: aiosqlite.Connection):
    """
    Creates the 'agents' table.
    - id: Primary key (TEXT UUID)
    - user_id: Foreign key to users table (TEXT, nullable, for user-owned agents)
    - name: Agent name (TEXT NOT NULL)
    - description: Agent description (TEXT, nullable)
    - system_prompt: System prompt for the agent (TEXT, nullable)
    - tools: JSON array of tool configurations stored as TEXT (TEXT, nullable)
    - model_name: Default model name for the agent (TEXT, nullable)
    - is_public: If the agent is publicly listed (BOOLEAN, default FALSE)
    - is_template: If the agent is a template (BOOLEAN, default FALSE)
    - created_at: Timestamp of creation (TEXT, default to current timestamp)
    - updated_at: Timestamp of last update (TEXT, default to current timestamp)
    - metadata: JSON stored as TEXT (TEXT, nullable)
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            system_prompt TEXT,
            tools TEXT,
            model_name TEXT,
            is_public BOOLEAN DEFAULT FALSE,
            is_template BOOLEAN DEFAULT FALSE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    # Trigger for updated_at
    await conn.execute("""
        CREATE TRIGGER IF NOT EXISTS update_agents_updated_at
        AFTER UPDATE ON agents
        FOR EACH ROW
        BEGIN
            UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    """)
    logging.info("Table 'agents' created or already exists.")

async def create_agent_runs_table(conn: aiosqlite.Connection):
    """
    Creates the 'agent_runs' table.
    - id: Primary key (TEXT UUID)
    - thread_id: Foreign key to threads table (TEXT NOT NULL)
    - agent_id: Foreign key to agents table (TEXT, nullable)
    - status: Run status (e.g., 'running', 'completed', 'failed', 'stopped') (TEXT NOT NULL)
    - started_at: Timestamp when run started (TEXT, default to current timestamp)
    - completed_at: Timestamp when run completed/failed/stopped (TEXT, nullable)
    - error_message: Error message if status is 'failed' (TEXT, nullable)
    - inputs: JSON inputs to the agent run stored as TEXT (TEXT, nullable)
    - outputs: JSON outputs from the agent run stored as TEXT (TEXT, nullable)
    - metadata: JSON stored as TEXT (TEXT, nullable)
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_runs (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL,
            agent_id TEXT,
            status TEXT NOT NULL,
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT,
            error_message TEXT,
            inputs TEXT,
            outputs TEXT,
            metadata TEXT,
            FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE,
            FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE SET NULL
        )
    """)
    logging.info("Table 'agent_runs' created or already exists.")

async def create_all_tables(conn: aiosqlite.Connection):
    """
    Creates all necessary tables in the SQLite database.
    Order matters due to foreign key constraints.
    """
    logging.info("Creating all tables...")
    await create_users_table(conn)
    await create_threads_table(conn)
    await create_messages_table(conn)
    await create_projects_table(conn)
    await create_agents_table(conn)
    await create_agent_runs_table(conn)

    await conn.commit()
    logging.info("All tables created and changes committed.")
