#!/usr/bin/env python3
import os
import sys
import time
import platform
import subprocess
from getpass import getpass
import re
import json
from pathlib import Path # Added for DATA_DIR handling

IS_WINDOWS = platform.system() == 'Windows'

# ANSI colors for pretty output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_banner():
    """Print Suna setup banner"""
    print(f"""
{Colors.BLUE}{Colors.BOLD}
   ███████╗██╗   ██╗███╗   ██╗ █████╗ 
   ██╔════╝██║   ██║████╗  ██║██╔══██╗
   ███████╗██║   ██║██╔██╗ ██║███████║
   ╚════██║██║   ██║██║╚██╗██║██╔══██║
   ███████║╚██████╔╝██║ ╚████║██║  ██║
   ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝
                                      
   Setup Wizard
{Colors.ENDC}
""")

PROGRESS_FILE = '.setup_progress'

def save_progress(step):
    with open(PROGRESS_FILE, 'w') as f:
        f.write(str(step))

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            try:
                return int(f.read().strip())
            except ValueError:
                return 0
    return 0

def clear_progress():
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)

ENV_DATA_FILE = '.setup_env.json'

def save_env_data(env_data):
    with open(ENV_DATA_FILE, 'w') as f:
        json.dump(env_data, f)

def load_env_data():
    if os.path.exists(ENV_DATA_FILE):
        with open(ENV_DATA_FILE, 'r') as f:
            return json.load(f)
    # Default structure
    return {
        'database_type': 'sqlite', # Default to sqlite
        'sqlite_db_path': 'suna_local.db',
        'data_dir': 'data_files',
        'supabase': {},
        'daytona': {},
        'llm': {},
        'search': {},
        'rapidapi': {},
        'optional_services': {} # For Sentry, Langfuse etc.
    }


def print_step(step_num, total_steps, step_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}Step {step_num}/{total_steps}: {step_name}{Colors.ENDC}")
    print(f"{Colors.CYAN}{'='*50}{Colors.ENDC}\n")

def print_info(message):
    print(f"{Colors.CYAN}ℹ️  {message}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅  {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌  {message}{Colors.ENDC}")

def check_requirements():
    requirements = {'git': 'https://git-scm.com/downloads','docker': 'https://docs.docker.com/get-docker/','python3': 'https://www.python.org/downloads/','poetry': 'https://python-poetry.org/docs/#installation','pip3': 'https://pip.pypa.io/en/stable/installation/','node': 'https://nodejs.org/en/download/','npm': 'https://docs.npmjs.com/downloading-and-installing-node-js-and-npm'}
    missing = []
    for cmd, url in requirements.items():
        try:
            cmd_to_check = cmd.replace('3', '') if platform.system() == 'Windows' and cmd in ['python3', 'pip3'] else cmd
            subprocess.run([cmd_to_check, '--version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, shell=IS_WINDOWS)
            print_success(f"{cmd} is installed")
        except (subprocess.SubprocessError, FileNotFoundError):
            missing.append((cmd, url)); print_error(f"{cmd} is not installed")
    if missing:
        print_error("Missing required tools. Please install them:"); [print(f"  - {cmd}: {url}") for cmd, url in missing]; sys.exit(1)
    return True

def check_docker_running():
    try:
        subprocess.run(['docker', 'info'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, shell=IS_WINDOWS)
        print_success("Docker is running"); return True
    except subprocess.SubprocessError:
        print_error("Docker is installed but not running. Please start Docker and try again."); sys.exit(1)

def check_suna_directory():
    if not all(os.path.isdir(d) for d in ['backend', 'frontend']) or \
       not all(os.path.isfile(f) for f in ['README.md', 'docker-compose.yaml']):
        print_error("Script must be run from the Suna repository root directory."); return False
    print_success("Suna repository detected"); return True

def validate_url(url, allow_empty=False):
    if allow_empty and not url: return True
    pattern = re.compile(r'^(?:http|https)://(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:/?|[/?]\S+)$', re.IGNORECASE)
    return bool(pattern.match(url))

def validate_api_key(api_key, allow_empty=False):
    if allow_empty and not api_key: return True
    return bool(api_key and len(api_key) >= 10)

def get_user_input(prompt_message, default_value=None, validator=None, allow_empty_for_optional=False):
    while True:
        user_input = input(f"{prompt_message} {f'[{default_value}]' if default_value else ''}: ").strip()
        if not user_input and default_value is not None:
            user_input = default_value
        
        if validator:
            if validator(user_input, allow_empty=allow_empty_for_optional):
                return user_input
            else:
                print_error("Invalid input. Please try again.")
        else: # No validator, any input (or empty if allowed) is fine
            if not user_input and not allow_empty_for_optional and not default_value : # Requires input if no default and not optional
                 print_error("This field is required.")
            else:
                return user_input


def collect_database_info(env_data):
    print_info("Choose your database type:")
    print_info("  [1] SQLite (Recommended for local development, simplest setup)")
    print_info("  [2] Supabase (For cloud features or existing Supabase users)")

    db_choice = get_user_input("Enter choice (1 or 2)", default_value="1")

    if db_choice == '1':
        env_data['database_type'] = 'sqlite'
        print_info("SQLite selected.")
        env_data['data_dir'] = get_user_input("Enter local data directory (for DB, uploads)", default_value=env_data.get('data_dir', 'data_files'))
        env_data['sqlite_db_path'] = get_user_input("Enter SQLite database filename", default_value=env_data.get('sqlite_db_path', 'suna_local.db'))
        env_data['supabase'] = {} # Clear any old Supabase data
    elif db_choice == '2':
        env_data['database_type'] = 'supabase'
        print_info("Supabase selected.")
        print_info("You'll need a Supabase project. Visit https://supabase.com/dashboard/projects")
        print_info("From project settings -> API, get: URL, anon key, service role key.")
        input("Press Enter to continue once you have these details...")
        
        env_data['supabase']['SUPABASE_URL'] = get_user_input("Supabase Project URL", validator=validate_url)
        env_data['supabase']['SUPABASE_ANON_KEY'] = get_user_input("Supabase anon key", validator=validate_api_key)
        env_data['supabase']['SUPABASE_SERVICE_ROLE_KEY'] = get_user_input("Supabase service role key", validator=validate_api_key)
    else:
        print_error("Invalid choice. Defaulting to SQLite.")
        env_data['database_type'] = 'sqlite'
        env_data['data_dir'] = env_data.get('data_dir', 'data_files')
        env_data['sqlite_db_path'] = env_data.get('sqlite_db_path', 'suna_local.db')
    return env_data

def collect_daytona_info(env_data):
    if get_user_input("Configure Daytona for dynamic sandboxes? (y/n)", default_value="n").lower() == 'y':
        print_info("Visit https://app.daytona.io/ and generate an API key from 'Keys' menu.")
        env_data['daytona']['DAYTONA_API_KEY'] = get_user_input("Daytona API key", validator=validate_api_key)
        env_data['daytona']['DAYTONA_SERVER_URL'] = get_user_input("Daytona Server URL", default_value="https://app.daytona.io/api", validator=validate_url)
        env_data['daytona']['DAYTONA_TARGET'] = get_user_input("Daytona Target", default_value="us")
    else:
        env_data['daytona'] = {}
    return env_data

def collect_llm_api_keys(env_data):
    print_info("Configure LLM API Keys. At least one provider is recommended.")
    providers = {"OpenAI": "OPENAI_API_KEY", "Anthropic": "ANTHROPIC_API_KEY", "OpenRouter": "OPENROUTER_API_KEY", "Groq": "GROQ_API_KEY", "DeepSeek": "DEEPSEEK_API_KEY"}
    for name, key_env_var in providers.items():
        if get_user_input(f"Configure {name}? (y/n)", default_value="n").lower() == 'y':
            env_data['llm'][key_env_var] = get_user_input(f"Enter {name} API Key", validator=validate_api_key)

    env_data['llm']['MODEL_TO_USE'] = get_user_input("Enter default model name (e.g., openai/gpt-4o-mini)", default_value=env_data.get('llm',{}).get('MODEL_TO_USE','openai/gpt-4o-mini'))
    return env_data

def collect_optional_service_keys(env_data):
    print_info("Configure Optional Cloud Services:")
    services = {
        "Sentry DSN (Error Tracking)": "SENTRY_DSN",
        "Langfuse Public Key": "LANGFUSE_PUBLIC_KEY",
        "Langfuse Secret Key": "LANGFUSE_SECRET_KEY",
        "Langfuse Host": "LANGFUSE_HOST",
        "AWS Access Key ID (for Bedrock)": "AWS_ACCESS_KEY_ID",
        "AWS Secret Access Key": "AWS_SECRET_ACCESS_KEY",
        "AWS Region Name": "AWS_REGION_NAME",
        "Tavily API Key (Web Search)": "TAVILY_API_KEY",
        "Firecrawl API Key (Web Scraping)": "FIRECRAWL_API_KEY",
        "Firecrawl URL": "FIRECRAWL_URL",
        "RapidAPI Key (Data APIs)": "RAPID_API_KEY",
        "Smithery API Key": "SMITHERY_API_KEY",
        "Stripe Secret Key (Billing)": "STRIPE_SECRET_KEY",
        "Stripe Webhook Secret": "STRIPE_WEBHOOK_SECRET",
    }
    for desc, key_env_var in services.items():
        default_val = env_data.get('optional_services',{}).get(key_env_var, '')
        if key_env_var == "LANGFUSE_HOST": default_val = default_val or "https://cloud.langfuse.com"
        if key_env_var == "FIRECRAWL_URL": default_val = default_val or "https://api.firecrawl.dev"

        user_val = get_user_input(f"{desc} (optional, press Enter to skip or use default)", default_value=default_val, allow_empty_for_optional=True)
        if user_val: # Only save if user provided a value or accepted a non-empty default
            env_data['optional_services'][key_env_var] = user_val
    return env_data

def configure_backend_env(env_vars):
    env_path = os.path.join('backend', '.env')
    env_content = "# Generated by Suna setup wizard\n\n"
    env_content += f"ENV_MODE=local\n"
    env_content += f"DATABASE_TYPE={env_vars.get('database_type', 'sqlite')}\n"
    env_content += f"DATA_DIR={env_vars.get('data_dir', 'data_files')}\n"
    env_content += f"SQLITE_DB_PATH={env_vars.get('sqlite_db_path', 'suna_local.db')}\n\n"

    if env_vars.get('database_type') == 'supabase':
        env_content += "# Supabase Configuration (if DATABASE_TYPE=supabase)\n"
        for key, value in env_vars.get('supabase', {}).items(): env_content += f"{key}={value}\n"
    else:
        env_content += "# Supabase Configuration (disabled, using SQLite)\n# SUPABASE_URL=\n# SUPABASE_ANON_KEY=\n# SUPABASE_SERVICE_ROLE_KEY=\n"
    env_content += "\n"

    # Local services
    env_content += "# Local Services (Defaults for Docker Compose)\n"
    env_content += f"REDIS_HOST=redis\nREDIS_PORT=6379\nREDIS_PASSWORD=\nREDIS_SSL=false\n"
    env_content += f"RABBITMQ_HOST=rabbitmq\nRABBITMQ_PORT=5672\n\n"

    # LLM Providers
    env_content += "# LLM Providers\n"
    llm_vars = env_vars.get('llm', {})
    for key in ['MODEL_TO_USE', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY']:
        env_content += f"{key}={llm_vars.get(key, '')}\n"
    env_content += "\n"

    # Optional Services
    env_content += "# Optional External Cloud Services\n"
    optional_vars = env_vars.get('optional_services', {})
    for key in ['SENTRY_DSN', 'LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY', 'LANGFUSE_HOST',
                'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION_NAME',
                'TAVILY_API_KEY', 'FIRECRAWL_API_KEY', 'FIRECRAWL_URL', 'RAPID_API_KEY',
                'SMITHERY_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']:
        env_content += f"{key}={optional_vars.get(key, '')}\n"
    env_content += "\n"

    # Daytona
    daytona_vars = env_vars.get('daytona', {})
    if daytona_vars.get('DAYTONA_API_KEY'): # Only write if configured
        env_content += "# Daytona Sandbox Provider\n"
        for key, value in daytona_vars.items(): env_content += f"{key}={value}\n"
    else:
        env_content += "# Daytona Sandbox Provider (not configured)\n# DAYTONA_API_KEY=\n# DAYTONA_SERVER_URL=\n# DAYTONA_TARGET=\n"

    with open(env_path, 'w') as f: f.write(env_content)
    print_success(f"Backend .env file created at {env_path}")

def configure_frontend_env(env_vars):
    env_path = os.path.join('frontend', '.env.local')
    backend_url = "http://localhost:8000/api" # Standard for local Docker setup
    
    fe_config = {'NEXT_PUBLIC_BACKEND_URL': backend_url, 'NEXT_PUBLIC_URL': 'http://localhost:3000', 'NEXT_PUBLIC_ENV_MODE': 'LOCAL'}
    if env_vars.get('database_type') == 'supabase' and env_vars.get('supabase'):
        fe_config['NEXT_PUBLIC_SUPABASE_URL'] = env_vars['supabase'].get('SUPABASE_URL', '')
        fe_config['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = env_vars['supabase'].get('SUPABASE_ANON_KEY', '')
    else: # SQLite mode
        fe_config['NEXT_PUBLIC_SUPABASE_URL'] = "" # Ensure these are blank if not used
        fe_config['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = ""
    
    with open(env_path, 'w') as f:
        for key, value in fe_config.items(): f.write(f"{key}={value}\n")
    print_success(f"Frontend .env.local file created at {env_path}")

def setup_supabase_db_schema(env_vars):
    print_info("Setting up Supabase database schema (if Supabase is selected)...")
    if env_vars.get('database_type') != 'supabase':
        print_info("Skipping Supabase schema setup as SQLite is selected.")
        return

    try:
        subprocess.run(['supabase', '--version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, shell=IS_WINDOWS)
    except (subprocess.SubprocessError, FileNotFoundError):
        print_error("Supabase CLI not installed. Visit https://supabase.com/docs/guides/cli"); sys.exit(1)
    
    supabase_url = env_vars.get('supabase', {}).get('SUPABASE_URL', '')
    project_ref_match = re.search(r'https://([^.]+)\.supabase\.co', supabase_url)
    project_ref = project_ref_match.group(1) if project_ref_match else get_user_input("Supabase Project Reference (from your Supabase project URL)")
    
    backend_dir = os.path.join(os.getcwd(), 'backend')
    try:
        print_info("Logging into Supabase CLI..."); subprocess.run(['supabase', 'login'], check=True, shell=IS_WINDOWS)
        print_info(f"Linking to Supabase project {project_ref}..."); subprocess.run(['supabase', 'link', '--project-ref', project_ref], cwd=backend_dir, check=True, shell=IS_WINDOWS)
        print_info("Pushing database migrations..."); subprocess.run(['supabase', 'db', 'push'], cwd=backend_dir, check=True, shell=IS_WINDOWS)
        print_success("Supabase database schema setup completed.")
        print_warning("IMPORTANT: Manually expose 'basejump' schema in Supabase Dashboard (Project Settings -> API -> Exposed schemas) if not already done.")
        input("Press Enter once confirmed/done...")
    except subprocess.SubprocessError as e:
        print_error(f"Failed to setup Supabase schema: {e}"); sys.exit(1)

def install_dependencies():
    print_info("Installing dependencies...")
    try:
        print_info("Installing frontend dependencies (npm install)...")
        subprocess.run(['npm', 'install'], cwd='frontend', check=True, shell=IS_WINDOWS)
        print_success("Frontend dependencies installed.")
        
        print_info("Installing backend dependencies (poetry install)...")
        subprocess.run(['poetry', 'lock', '--no-update'], cwd='backend', check=True, shell=IS_WINDOWS) # Lock first
        subprocess.run(['poetry', 'install'], cwd='backend', check=True, shell=IS_WINDOWS)
        print_success("Backend dependencies installed.")
        return True
    except subprocess.SubprocessError as e:
        print_error(f"Failed to install dependencies: {e}"); return False

def start_suna(env_vars):
    print_info("Starting Suna application...")
    try:
        print_info("Using Docker Compose to start all services (backend, frontend, redis, rabbitmq)...")
        subprocess.run(['docker', 'compose', 'up', '-d', '--build'], check=True, shell=IS_WINDOWS)
        time.sleep(10) # Give services time to start
        result = subprocess.run(['docker', 'compose', 'ps', '-q'], capture_output=True, text=True, shell=IS_WINDOWS)
        if "backend" in result.stdout and "frontend" in result.stdout: print_success("Suna services are up and running!")
        else: print_warning("Some services might not be running. Check 'docker compose ps'.")
    except subprocess.SubprocessError as e:
        print_error(f"Failed to start Suna with Docker Compose: {e}"); sys.exit(1)

def final_instructions(env_vars):
    print(f"\n{Colors.GREEN}{Colors.BOLD}✨ Suna Setup Complete! ✨{Colors.ENDC}\n")
    default_model = env_vars.get('llm', {}).get('MODEL_TO_USE', 'Not configured')
    print_info(f"Default LLM model: {Colors.GREEN}{default_model}{Colors.ENDC}")
    db_type = env_vars.get('database_type', 'sqlite')
    print_info(f"Database type: {Colors.GREEN}{db_type}{Colors.ENDC}")
    if db_type == 'sqlite':
        db_path = env_vars.get('sqlite_db_path', 'suna_local.db')
        data_dir = env_vars.get('data_dir', 'data_files')
        full_db_path = Path(data_dir) / db_path # Construct path relative to DATA_DIR
        print_info(f"SQLite DB at: {Colors.GREEN}{full_db_path.resolve()}{Colors.ENDC}")


    print_info("Suna application is running via Docker Compose.")
    print_info(f"Access the frontend at: {Colors.CYAN}http://localhost:3000{Colors.ENDC}")
    if db_type == 'supabase':
        print_info("Create an account using Supabase authentication.")
    else: # SQLite
        print_info("For SQLite mode, user management is simplified (default user for now).")

    print("\nUseful Docker commands:")
    print(f"{Colors.CYAN}  docker compose ps{Colors.ENDC}         - Check status")
    print(f"{Colors.CYAN}  docker compose logs -f{Colors.ENDC}   - View logs")
    print(f"{Colors.CYAN}  docker compose down{Colors.ENDC}       - Stop Suna")

def main():
    total_steps = 6 # Adjusted total steps
    current_step = load_progress() + 1
    print_banner()
    print("This wizard guides Suna setup. It creates .env files from your input.\n")
    env_vars = load_env_data()

    if current_step <= 1:
        print_step(current_step, total_steps, "System & Repository Checks")
        check_requirements(); check_docker_running()
        if not check_suna_directory(): sys.exit(1)
        save_progress(current_step); current_step += 1; save_env_data(env_vars)

    if current_step <= 2:
        print_step(current_step, total_steps, "Database Configuration")
        env_vars = collect_database_info(env_vars)
        save_progress(current_step); current_step += 1; save_env_data(env_vars)

    if current_step <= 3:
        print_step(current_step, total_steps, "LLM API Keys")
        env_vars = collect_llm_api_keys(env_vars)
        save_progress(current_step); current_step += 1; save_env_data(env_vars)

    if current_step <= 4: # Optional Cloud Services & Daytona
        print_step(current_step, total_steps, "Optional Services & Daytona")
        env_vars = collect_optional_service_keys(env_vars)
        env_vars = collect_daytona_info(env_vars) # Daytona is also optional
        save_progress(current_step); current_step += 1; save_env_data(env_vars)

    if current_step <= 5: # Configure .env files and Install Dependencies
        print_step(current_step, total_steps, "Configure Environment & Install Dependencies")
        configure_backend_env(env_vars)
        configure_frontend_env(env_vars)
        if env_vars.get('database_type') == 'supabase': # Only run Supabase DB setup if chosen
            setup_supabase_db_schema(env_vars)
        install_dependencies()
        save_progress(current_step); current_step += 1; save_env_data(env_vars)

    if current_step <= 6: # Start Suna & Final Instructions
        print_step(current_step, total_steps, "Start Suna Application")
        start_suna(env_vars)
        final_instructions(env_vars)
        clear_progress();
        if os.path.exists(ENV_DATA_FILE): os.remove(ENV_DATA_FILE)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup interrupted. Resume by running script again.")
        sys.exit(1)
    except Exception as e:
        print_error(f"An unexpected error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)
