import sqlite3
from utils.logger import logger

def create_tables(conn: sqlite3.Connection):
    """
    Creates the necessary tables in the SQLite database if they don't already exist.
    Also creates indexes based on the Supabase schema.
    """
    try:
        cursor = conn.cursor()

        # Create projects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                project_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                account_id TEXT,
                sandbox TEXT DEFAULT '{}',
                is_public INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            )
        """)
        logger.info("Table 'projects' created or already exists.")

        # Create threads table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS threads (
                thread_id TEXT PRIMARY KEY,
                account_id TEXT,
                project_id TEXT,
                is_public INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE
            )
        """)
        logger.info("Table 'threads' created or already exists.")

        # Create messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                message_id TEXT PRIMARY KEY,
                thread_id TEXT NOT NULL,
                type TEXT NOT NULL,
                is_llm_message INTEGER NOT NULL DEFAULT 1,
                content TEXT NOT NULL,
                metadata TEXT DEFAULT '{}',
                created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                FOREIGN KEY (thread_id) REFERENCES threads (thread_id) ON DELETE CASCADE
            )
        """)
        logger.info("Table 'messages' created or already exists.")

        # Create agent_runs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_runs (
                id TEXT PRIMARY KEY,
                thread_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                started_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                completed_at TEXT,
                responses TEXT DEFAULT '[]',
                error TEXT,
                created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                FOREIGN KEY (thread_id) REFERENCES threads (thread_id) ON DELETE CASCADE
            )
        """)
        logger.info("Table 'agent_runs' created or already exists.")

        # Create Indexes (replicating from Supabase schema)
        # Indexes for projects table
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects (account_id)")
        
        # Indexes for threads table
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_threads_account_id ON threads (account_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_threads_project_id ON threads (project_id)")
        
        # Indexes for messages table
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages (thread_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_type ON messages (type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at)") # For sorting/filtering by time

        # Indexes for agent_runs table
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent_runs_thread_id ON agent_runs (thread_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs (status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs (created_at)")


        conn.commit()
        logger.info("Database schema created/verified and indexes applied successfully.")

    except sqlite3.Error as e:
        logger.error(f"An error occurred during table creation or indexing: {e}", exc_info=True)
        conn.rollback() # Rollback changes if any error occurs
        raise
    finally:
        # It's generally better to not close the cursor or connection here
        # if they are managed by the calling function (initialize_database)
        pass

if __name__ == '__main__':
    # For basic testing of this script
    # Note: utils.config and utils.logger might not be available if run directly
    # without proper PYTHONPATH setup. This is primarily for structure.
    db_path = "test_agentpress.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON;") # Enable foreign key enforcement
        create_tables(conn)
        logger.info(f"Test database '{db_path}' created and schema applied.")
        
        # Example: Insert a project and a thread to test FKs
        cursor = conn.cursor()
        project_id_test = "proj_test_123"
        cursor.execute("INSERT INTO projects (project_id, name, account_id) VALUES (?, ?, ?)", (project_id_test, "Test Project", "acc_test_123"))
        cursor.execute("INSERT INTO threads (thread_id, project_id, account_id) VALUES (?, ?, ?)", ("th_test_123", project_id_test, "acc_test_123"))
        conn.commit()
        logger.info("Test data inserted successfully.")

        # Example: Try to insert a thread with a non-existent project_id (should fail if FKs are on)
        try:
            cursor.execute("INSERT INTO threads (thread_id, project_id, account_id) VALUES (?, ?, ?)", ("th_test_fail", "proj_non_existent", "acc_test_123"))
            conn.commit()
            logger.error("FK_CONSTRAINT_TEST: Failed - Inserted thread with non-existent project_id.")
        except sqlite3.IntegrityError as ie:
            logger.info(f"FK_CONSTRAINT_TEST: Passed - Could not insert thread with non-existent project_id: {ie}")


    except Exception as e:
        logger.error(f"Error in test execution: {e}", exc_info=True)
    finally:
        if conn:
            conn.close()
        # if os.path.exists(db_path): # Clean up test db
        #     os.remove(db_path)
        #     logger.info(f"Test database '{db_path}' removed.")
