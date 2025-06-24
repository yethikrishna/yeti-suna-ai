import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

def apply_migrations():
    # Load environment variables from .env file in the backend directory
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
    load_dotenv(dotenv_path)

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in environment variables.")
        return

    migrations_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'supabase', 'migrations')
    if not os.path.isdir(migrations_dir):
        print(f"Error: Migrations directory not found at {migrations_dir}")
        return

    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

    if not migration_files:
        print("No SQL migration files found.")
        return

    conn = None
    try:
        print(f"Connecting to database: {db_url.split('@')[-1]}") # Avoid printing credentials
        conn = psycopg2.connect(db_url)
        conn.autocommit = False # Ensure transactions are handled explicitly
        cursor = conn.cursor()

        # Set search_path to ensure we're operating on the public schema primarily
        try:
            cursor.execute("SET search_path TO public;")
            conn.commit()
            print("Set search_path to public.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error setting search_path: {e}")
            # This might be serious, but we'll try to continue
            # raise # Option: make this fatal

        # Create Supabase-specific roles if they don't exist
        supabase_roles = ["anon", "authenticated", "service_role"]
        for role_name in supabase_roles:
            try:
                cursor.execute(f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role_name}') THEN CREATE ROLE {role_name}; END IF; END $$;")
                print(f"Ensured role '{role_name}' exists.")
            except psycopg2.Error as e:
                # If role already exists and CREATE ROLE fails, it might be fine,
                # but good to log it. Some DBs might error if you try to create an existing role without "IF NOT EXISTS"
                # The DO $$ BEGIN ... END $$ block should handle this gracefully in PostgreSQL.
                print(f"Notice: Could not create role '{role_name}' (it might already exist or other issue): {e}")
                # We will proceed, as the role might exist or not be strictly needed for all migrations for some reason.
        conn.commit()

        # Enable pgcrypto extension if it doesn't exist (usually in public)
        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
            conn.commit()
            print("Ensured pgcrypto extension is enabled in public schema.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error enabling pgcrypto extension (public): {e}")
            print("Aborting further migrations.")
            raise

        # Create 'extensions' schema if it doesn't exist, as Supabase migrations expect it
        try:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS extensions;")
            conn.commit()
            print("Ensured 'extensions' schema exists.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error creating 'extensions' schema: {e}")
            print("Aborting further migrations.")
            raise

        # Enable uuid-ossp extension in the 'extensions' schema
        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" WITH SCHEMA extensions;")
            conn.commit()
            print("Ensured uuid-ossp extension is enabled in extensions schema.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error enabling uuid-ossp extension (extensions): {e}")
            print("Aborting further migrations.")
            raise

        # --- DANGER ZONE: Drop and recreate public schema for a clean slate ---
        # This is to handle partial applications from previous failed attempts.
        # ONLY USE THIS IF YOU ARE SURE THE PUBLIC SCHEMA AND ITS CONTENTS CAN BE WIPED.
        try:
            print("Attempting to drop and recreate the public schema (for clean migration run)...")
            cursor.execute("DROP SCHEMA IF EXISTS public CASCADE;")
            cursor.execute("CREATE SCHEMA public;")
            # Grant usage to the main user and public if necessary - migrations should handle permissions.
            # cursor.execute(f"GRANT ALL ON SCHEMA public TO {os.getenv('DB_USER')};") # Assuming DB_USER is the owner or needs explicit grant
            # cursor.execute("GRANT USAGE ON SCHEMA public TO public;") # Default for 'public' role
            conn.commit()
            print("Successfully dropped and recreated public schema.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error dropping/recreating public schema: {e}")
            print("Aborting migrations as a clean schema is required.")
            raise


        # Re-ensure roles and extensions after schema recreation
        supabase_roles = ["anon", "authenticated", "service_role"]
        for role_name in supabase_roles:
            try:
                cursor.execute(f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role_name}') THEN CREATE ROLE {role_name}; END IF; END $$;")
                print(f"Ensured role '{role_name}' exists.")
            except psycopg2.Error as e:
                print(f"Notice: Could not create role '{role_name}' (it might already exist or other issue): {e}")
        conn.commit()

        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;")
            conn.commit()
            print("Ensured pgcrypto extension is enabled in public schema.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error enabling pgcrypto extension (public): {e}")
            print("Aborting further migrations.")
            raise

        try:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS extensions;") # Ensure extensions schema also exists
            conn.commit()
            print("Ensured 'extensions' schema exists.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error creating 'extensions' schema: {e}")
            print("Aborting further migrations.")
            raise

        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" WITH SCHEMA extensions;")
            conn.commit()
            print("Ensured uuid-ossp extension is enabled in extensions schema.")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error enabling uuid-ossp extension (extensions): {e}")
            print("Aborting further migrations.")
            raise

        # Create placeholder auth schema, users table, and uid function
        try:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS auth;")
            print("Ensured 'auth' schema exists.")

            # Ensure uuid-ossp is available for auth.uid() if it uses it
            # It's created in 'extensions' schema, so we might need to qualify uuid_generate_v4()
            # or ensure 'extensions' is in search_path for the function creation.
            # For simplicity, let's ensure extensions is in search_path for this block.
            original_search_path_query = "SHOW search_path;"
            cursor.execute(original_search_path_query)
            original_search_path = cursor.fetchone()[0]

            cursor.execute("SET LOCAL search_path TO public, extensions;")

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS auth.users (
                    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
                    -- Add other columns as might be minimally expected by migrations, e.g., email
                    email VARCHAR(255) UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
            """)
            print("Ensured 'auth.users' table exists (placeholder).")

            # Create a dummy user for auth.uid() to return something, or make function return a fixed UUID
            # Check if a dummy user exists, if not, create one.
            cursor.execute("SELECT id FROM auth.users WHERE email = 'dummy@example.com';")
            dummy_user = cursor.fetchone()
            dummy_uuid_str = "00000000-0000-0000-0000-000000000000"
            if not dummy_user:
                cursor.execute("INSERT INTO auth.users (id, email) VALUES (%s, 'dummy@example.com') ON CONFLICT (email) DO NOTHING;", (dummy_uuid_str,))
                print("Inserted dummy user for auth.uid() if it didn't exist.")
            else:
                dummy_uuid_str = str(dummy_user[0])


            cursor.execute(f"""
                CREATE OR REPLACE FUNCTION auth.uid()
                RETURNS uuid
                LANGUAGE sql
                STABLE -- Indicates the function cannot modify the database and always returns the same result for the same argument values within a single scan
                AS $$
                    SELECT '{dummy_uuid_str}'::uuid;
                $$;
            """)
            print("Ensured 'auth.uid()' function exists (placeholder).")

            cursor.execute(f"SET LOCAL search_path TO {original_search_path};") # Restore search path
            conn.commit()
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error creating placeholder auth schema/table/function: {e}")
            print("Aborting further migrations.")
            raise
        # End of re-ensuring roles/extensions and auth placeholders

        # The problematic policy is now handled directly in its SQL migration file.
        # The general schema reset for 'public' is kept below.

        # Create migrations table if it doesn't exist (Optional but good practice)
        # cursor.execute("""
        # CREATE TABLE IF NOT EXISTS applied_migrations (
        #     id SERIAL PRIMARY KEY,
        #     filename VARCHAR(255) UNIQUE NOT NULL,
        #     applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        # );
        # """)
        # print("Checked/created applied_migrations table.")

        for filename in migration_files:
            filepath = os.path.join(migrations_dir, filename)
            print(f"Applying migration: {filename}...")
            try:
                with open(filepath, 'r') as f:
                    sql_content = f.read()
                    if sql_content.strip(): # Ensure content is not empty
                        # Ensure search_path is set for each execution, as some SQL might reset it
                        cursor.execute("SET search_path TO public, extensions;")
                        cursor.execute(sql_content)
                        print(f"Successfully applied {filename}")
                    else:
                        print(f"Skipped empty file: {filename}")
                conn.commit() # Commit after each successful file execution
            except Exception as e:
                conn.rollback() # Rollback on error for the current file
                print(f"Error applying {filename}: {e}")
                print("Aborting further migrations.")
                raise # Re-raise the exception to stop the script

        print("All migrations applied successfully.")

    except psycopg2.Error as e:
        print(f"Database connection error or error during role/extension/schema creation: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    apply_migrations()
