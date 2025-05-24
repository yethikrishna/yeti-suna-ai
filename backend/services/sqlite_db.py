import sqlite3
import os
from utils.config import config
from utils.logger import logger
from database.schema import create_tables # Ensure this path is correct

# The database file path from configuration
DATABASE_URL = config.SQLITE_DB_PATH

def get_db_connection() -> sqlite3.Connection:
    """
    Establishes and returns a connection to the SQLite database.
    The connection will have row_factory set to sqlite3.Row for dict-like access.
    Foreign key constraints are enabled for the connection.
    """
    try:
        # Ensure the directory for the database file exists
        db_dir = os.path.dirname(DATABASE_URL)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            logger.info(f"Created directory for SQLite database: {db_dir}")

        conn = sqlite3.connect(DATABASE_URL, check_same_thread=False) # check_same_thread=False for FastAPI
        conn.row_factory = sqlite3.Row  # Access columns by name
        conn.execute("PRAGMA foreign_keys = ON;") # Enable foreign key enforcement
        logger.debug(f"Successfully connected to SQLite database at {DATABASE_URL}")
        return conn
    except sqlite3.Error as e:
        logger.error(f"Error connecting to SQLite database at {DATABASE_URL}: {e}", exc_info=True)
        raise
    except Exception as e: # Catch other potential errors like permission issues for makedirs
        logger.error(f"An unexpected error occurred while setting up DB connection: {e}", exc_info=True)
        raise


_db_connection_for_init = None

def initialize_database():
    """
    Initializes the database by creating tables if they don't exist.
    This function should be called once at application startup.
    It uses a dedicated connection for initialization.
    """
    global _db_connection_for_init
    conn = None
    try:
        logger.info(f"Initializing SQLite database at {DATABASE_URL}...")
        # Use a temporary connection for initialization to avoid issues with shared connections
        # if this is called outside of a request context where a global conn might be problematic.
        conn = sqlite3.connect(DATABASE_URL) # Basic connection for schema creation
        conn.execute("PRAGMA foreign_keys = ON;")

        create_tables(conn) # Pass the connection to the schema creation function
        
        conn.commit()
        logger.info("Database initialization complete. Tables created/verified.")
    except sqlite3.Error as e:
        logger.error(f"Error initializing SQLite database: {e}", exc_info=True)
        if conn:
            conn.rollback()
        raise # Re-raise the exception to signal failure in startup
    except Exception as e: # Catch other potential errors
        logger.error(f"An unexpected error occurred during database initialization: {e}", exc_info=True)
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()
        _db_connection_for_init = None # Clear the temporary connection

if __name__ == '__main__':
    # Example of how to use initialize_database and get_db_connection
    # This would typically be part of your application startup and request handling.
    
    # 1. Initialize (typically once at app start)
    print(f"Attempting to initialize database at: {DATABASE_URL}")
    # In a real app, config might need to be loaded first.
    # For direct script run, ensure SQLITE_DB_PATH is sensible or default it.
    if not config.SQLITE_DB_PATH : # Basic fallback for direct script run
        config.SQLITE_DB_PATH = "agentpress_test_main.db"
        DATABASE_URL = config.SQLITE_DB_PATH
        print(f"SQLITE_DB_PATH not in env, defaulting to {DATABASE_URL} for test run")
        # Clean up previous test db if it exists
        if os.path.exists(DATABASE_URL):
            os.remove(DATABASE_URL)
            print(f"Removed existing test DB: {DATABASE_URL}")

    initialize_database()
    print("Database initialized.")

    # 2. Usage example (typically in a request handler or service function)
    conn1 = None
    conn2 = None
    try:
        conn1 = get_db_connection()
        print("Connection 1 obtained.")
        # Example query
        cursor = conn1.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects';")
        table = cursor.fetchone()
        if table:
            print(f"Table 'projects' exists in {DATABASE_URL}.")
            # Test insert
            project_id = "proj_main_test_001"
            try:
                cursor.execute("INSERT INTO projects (project_id, name, account_id) VALUES (?, ?, ?)",
                               (project_id, "Main Test Project", "acc_main_test"))
                conn1.commit()
                print(f"Inserted test project {project_id}.")
            except sqlite3.IntegrityError as ie: # e.g. if it already exists from a previous partial run
                print(f"Could not insert test project (might already exist): {ie}")
                conn1.rollback()

            # Test select
            cursor.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,))
            project_row = cursor.fetchone()
            if project_row:
                print(f"Fetched project: {dict(project_row)}")

        else:
            print("Table 'projects' does not exist.")

        # Simulate concurrent connection
        conn2 = get_db_connection()
        print("Connection 2 obtained.")
        cursor2 = conn2.cursor()
        cursor2.execute("SELECT COUNT(*) FROM projects")
        count = cursor2.fetchone()[0]
        print(f"Connection 2 sees {count} projects.")


    except sqlite3.Error as e:
        print(f"SQLite error during test: {e}")
    finally:
        if conn1:
            conn1.close()
            print("Connection 1 closed.")
        if conn2:
            conn2.close()
            print("Connection 2 closed.")
        # Clean up the test database file created by this __main__ block
        # if DATABASE_URL == "agentpress_test_main.db" and os.path.exists(DATABASE_URL):
        #     os.remove(DATABASE_URL)
        #     print(f"Cleaned up test database: {DATABASE_URL}")
