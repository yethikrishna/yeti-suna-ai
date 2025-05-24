import docker
from docker.errors import NotFound, APIError, ImageNotFound
from dotenv import load_dotenv
from utils.logger import logger
from utils.config import config, Configuration # Assuming Configuration holds SANDBOX_IMAGE_NAME

load_dotenv()

logger.info("Initializing Docker client")
try:
    client = docker.from_env()
    # Test connection
    client.ping()
    logger.info("Docker client initialized and connected successfully.")
except docker.errors.DockerException as e:
    logger.error(f"Failed to initialize Docker client: {e}. Ensure Docker is running and accessible.", exc_info=True)
    # Depending on application requirements, might want to raise an error here or handle it gracefully.
    # For now, we'll let it proceed, but operations will fail.
    client = None 


# Default sandbox configuration values (can be overridden or extended)
DEFAULT_ENV_VARS = {
    "CHROME_PERSISTENT_SESSION": "true",
    "RESOLUTION": "1024x768x24",
    "RESOLUTION_WIDTH": "1024",
    "RESOLUTION_HEIGHT": "768",
    # "VNC_PASSWORD" will be set from create_sandbox parameter
    "ANONYMIZED_TELEMETRY": "false",
    "CHROME_PATH": "", # These might be set within the Docker image
    "CHROME_USER_DATA": "",
    "CHROME_DEBUGGING_PORT": "9222",
    "CHROME_DEBUGGING_HOST": "localhost", # Or "0.0.0.0" if accessed from outside container host
    "CHROME_CDP": ""
}

DEFAULT_RESOURCES = { # Docker resource limits
    # "cpu_shares": 1024, # Default is 1024. Relative weight.
    # "mem_limit": "4g", # e.g., 4GB memory limit
    # "nano_cpus": 2 * 10**9, # 2 CPUs
    # Disk limits are harder to enforce directly with Docker `run` without custom storage drivers.
    # For now, we'll omit direct disk limits here.
}

# Define a base name prefix for sandboxes for easier identification
SANDBOX_NAME_PREFIX = "agentpress-sandbox-"

def _get_sandbox_name(project_id_or_custom_id: str) -> str:
    """Generates a consistent Docker container name for a sandbox."""
    return f"{SANDBOX_NAME_PREFIX}{project_id_or_custom_id}"

async def get_or_start_sandbox(sandbox_identifier: str) -> dict | None:
    """
    Retrieve a Docker container by its name (derived from sandbox_identifier),
    check its state, and start it if needed.
    
    Args:
        sandbox_identifier: A unique identifier for the sandbox (e.g., project_id),
                            which will be used to derive the container name.
                            
    Returns:
        A dictionary with container info (id, name, status) if found/started, or None.
    """
    if not client:
        logger.error("Docker client not initialized. Cannot get or start sandbox.")
        return None

    container_name = _get_sandbox_name(sandbox_identifier)
    logger.info(f"Getting or starting sandbox (Docker container) with name: {container_name}")

    try:
        container = client.containers.get(container_name)
        logger.info(f"Found container {container.short_id} ('{container_name}') with status: {container.status}")

        if container.status == 'exited' or container.status == 'created':
            logger.info(f"Container '{container_name}' is '{container.status}'. Starting...")
            try:
                container.start()
                container.reload() # Refresh container state
                logger.info(f"Container '{container_name}' started. New status: {container.status}")
                # Any post-start logic (like ensuring supervisord is running if not handled by CMD/ENTRYPOINT)
                # could be added here, e.g., using container.exec_run if necessary.
                # For now, assuming image handles supervisord or it's started in create_sandbox.

            except APIError as e:
                logger.error(f"Error starting container '{container_name}': {e}", exc_info=True)
                raise # Re-raise to be caught by the outer try-except
        
        return {
            "id": container.id,
            "short_id": container.short_id,
            "name": container.name,
            "status": container.status,
            "ports": container.ports, # Useful for connection info
            "raw_container_obj": container # For more advanced use if needed by caller
        }

    except NotFound:
        logger.warning(f"Container with name '{container_name}' not found.")
        # Depending on desired behavior, we might want to create it here or signal to the caller.
        # The original get_or_start_sandbox seemed to assume existence or handled creation implicitly.
        # For now, this function will not create if not found; `create_sandbox` is responsible for that.
        return None 
    except APIError as e:
        logger.error(f"API error retrieving or starting container '{container_name}': {e}", exc_info=True)
        raise
    except Exception as e: # Catch any other unexpected errors
        logger.error(f"Unexpected error in get_or_start_sandbox for '{container_name}': {e}", exc_info=True)
        raise


async def create_sandbox(password: str, project_id: str) -> dict | None:
    """
    Create and start a new Docker container as a sandbox.

    Args:
        password: VNC password for the sandbox environment.
        project_id: A unique identifier for the project, used to name the container.

    Returns:
        A dictionary with container info (id, name, status) if created successfully, or None.
    """
    if not client:
        logger.error("Docker client not initialized. Cannot create sandbox.")
        return None
    if not project_id:
        logger.error("project_id is required to create a sandbox.")
        return None # Or raise ValueError

    container_name = _get_sandbox_name(project_id)
    logger.info(f"Attempting to create sandbox (Docker container) with name: {container_name}")

    # First, check if a container with this name already exists
    try:
        existing_container = client.containers.get(container_name)
        logger.warning(f"Container '{container_name}' already exists with ID {existing_container.short_id} and status {existing_container.status}.")
        # Decide on behavior: error out, or return existing, or stop and remove then recreate.
        # For now, let's return the existing one's info, potentially after ensuring it's running.
        if existing_container.status == 'exited' or existing_container.status == 'created':
            logger.info(f"Existing container '{container_name}' is stopped. Starting it...")
            existing_container.start()
            existing_container.reload()
        
        # It might be desirable to run exec_run for supervisord here if it wasn't part of CMD
        # and this is a re-start or re-attach scenario.
        # Example (if supervisord is not auto-run by image CMD/ENTRYPOINT):
        # try:
        #    existing_container.exec_run("/usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf", detach=True)
        #    logger.info(f"Ensured supervisord is running in existing container {container_name}")
        # except APIError as exec_err:
        #    logger.error(f"Failed to start supervisord in existing container {container_name}: {exec_err}")

        return {
            "id": existing_container.id,
            "short_id": existing_container.short_id,
            "name": existing_container.name,
            "status": existing_container.status,
            "ports": existing_container.ports,
            "raw_container_obj": existing_container
        }
    except NotFound:
        logger.info(f"No existing container named '{container_name}'. Proceeding with creation.")
    except APIError as e:
        logger.error(f"API error checking for existing container '{container_name}': {e}", exc_info=True)
        return None


    env_vars = DEFAULT_ENV_VARS.copy()
    env_vars["VNC_PASSWORD"] = password
    
    # Add project_id to env_vars if needed by the sandbox environment itself
    env_vars["PROJECT_ID"] = project_id 

    labels = {'id': project_id, 'managed-by': 'agentpress'}

    # Port mapping: Example: {"internal_port/tcp": external_port}
    # e.g. if VNC is on 5900 and HTTP for browser on 8080 inside container
    # ports_map = {"5900/tcp": None, "8080/tcp": None} # None means assign random available host port
    # Or specific ports: {"5900/tcp": 5901, "8080/tcp": 8081}
    # For now, let's assume the image uses EXPOSE and we rely on that or define specific needs.
    # If specific ports are needed for VNC/debugging:
    ports_map = {
        "5900/tcp": None, # VNC server
        "9222/tcp": None  # Chrome debugging port
    }


    try:
        logger.info(f"Creating and starting new container '{container_name}' from image '{Configuration.SANDBOX_IMAGE_NAME}'")
        container = client.containers.run(
            image=Configuration.SANDBOX_IMAGE_NAME,
            detach=True, # Run in detached mode
            name=container_name,
            environment=env_vars,
            labels=labels,
            ports=ports_map,
            # **DEFAULT_RESOURCES, # Spread resource limits if defined and compatible
            # Volumes might be needed for persistence, e.g.
            # volumes={'my_volume_name': {'bind': '/workspace', 'mode': 'rw'}}
            # Or anonymous volume: volumes=['/workspace']
            # For now, assuming image handles workspace or it's ephemeral.
        )
        container.reload() # Get updated attributes like assigned ports
        logger.info(f"Container '{container_name}' created successfully with ID: {container.short_id}. Status: {container.status}")

        # If supervisord is not part of the image's CMD/ENTRYPOINT, start it now.
        # This is often better handled by the image itself.
        # Example:
        # try:
        #    exit_code, (output_bytes, _) = container.exec_run("/usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf", detach=False, user='root')
        #    output = output_bytes.decode('utf-8') if output_bytes else ""
        #    if exit_code == 0 or "already running" in output.lower(): # Crude check
        #        logger.info(f"Supervisord started or confirmed running in container {container_name}. Output: {output[:200]}")
        #    else:
        #        logger.error(f"Failed to start supervisord in container {container_name}. Exit code: {exit_code}. Output: {output}")
        # except APIError as exec_err:
        #    logger.error(f"APIError trying to start supervisord in {container_name}: {exec_err}")
        # except Exception as e_exec:
        #    logger.error(f"Unexpected error trying to start supervisord in {container_name}: {e_exec}")


        return {
            "id": container.id,
            "short_id": container.short_id,
            "name": container.name,
            "status": container.status,
            "ports": container.ports,
             "raw_container_obj": container
        }

    except ImageNotFound:
        logger.error(f"Docker image '{Configuration.SANDBOX_IMAGE_NAME}' not found. Cannot create sandbox.", exc_info=True)
        return None
    except APIError as e:
        logger.error(f"API error creating container '{container_name}': {e}", exc_info=True)
        return None
    except Exception as e: # Catch any other unexpected errors
        logger.error(f"Unexpected error in create_sandbox for '{container_name}': {e}", exc_info=True)
        return None


async def stop_sandbox(sandbox_identifier: str, remove: bool = False):
    """Stops and optionally removes a sandbox container."""
    if not client:
        logger.error("Docker client not initialized. Cannot stop/remove sandbox.")
        return False
    
    container_name = _get_sandbox_name(sandbox_identifier)
    logger.info(f"Attempting to stop {'and remove ' if remove else ''}sandbox container: {container_name}")

    try:
        container = client.containers.get(container_name)
        if container.status != "exited":
            logger.info(f"Stopping container {container.short_id} ('{container_name}')...")
            container.stop(timeout=10) # Wait up to 10s for graceful stop
            logger.info(f"Container '{container_name}' stopped.")
        else:
            logger.info(f"Container '{container_name}' is already stopped.")

        if remove:
            logger.info(f"Removing container '{container_name}'...")
            container.remove()
            logger.info(f"Container '{container_name}' removed.")
        return True
    except NotFound:
        logger.warning(f"Container '{container_name}' not found. Cannot stop/remove.")
        return False
    except APIError as e:
        logger.error(f"API error stopping/removing container '{container_name}': {e}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Unexpected error stopping/removing container '{container_name}': {e}", exc_info=True)
        return False


# Example usage (for testing or direct script run):
if __name__ == "__main__":
    async def main_test():
        if not client:
            print("Docker client failed to initialize. Exiting test.")
            return

        print("--- Sandbox Test ---")
        test_project_id = "testproject123"
        test_password = "testpassword"

        # Try to get or start (will likely be None first time)
        print(f"\n1. Trying to get_or_start_sandbox for {test_project_id} (expect None or existing)...")
        sandbox_info = await get_or_start_sandbox(test_project_id)
        if sandbox_info:
            print(f"   Found existing sandbox: ID={sandbox_info['short_id']}, Status={sandbox_info['status']}")
            print(f"   Stopping and removing existing sandbox for clean test run...")
            await stop_sandbox(test_project_id, remove=True)
        else:
            print(f"   Sandbox for {test_project_id} not found, as expected for a clean run.")

        # Create sandbox
        print(f"\n2. Creating sandbox for project_id: {test_project_id}...")
        created_sandbox = await create_sandbox(password=test_password, project_id=test_project_id)
        if created_sandbox:
            print(f"   Sandbox created: ID={created_sandbox['short_id']}, Name={created_sandbox['name']}, Status={created_sandbox['status']}")
            print(f"   Ports: {created_sandbox['ports']}")
            
            # Test get_or_start_sandbox again (should find and potentially start if it stopped quickly)
            print(f"\n3. Getting or starting sandbox {test_project_id} again...")
            current_sandbox = await get_or_start_sandbox(test_project_id)
            if current_sandbox:
                print(f"   Got sandbox: ID={current_sandbox['short_id']}, Status={current_sandbox['status']}")
                
                # Example of exec_run, if supervisord wasn't part of CMD/ENTRYPOINT
                # print(f"\n   Attempting to run 'ls /' in container {current_sandbox['short_id']}...")
                # try:
                #    container_obj = current_sandbox.get("raw_container_obj")
                #    if container_obj:
                #        exit_code, (output_bytes, _) = container_obj.exec_run("ls /")
                #        output = output_bytes.decode('utf-8') if output_bytes else ""
                #        print(f"   'ls /' executed. Exit code: {exit_code}. Output:\n{output[:200]}...")
                #    else:
                #        print("    Could not get raw container object to run exec_run.")
                # except APIError as exec_err:
                #    print(f"    Error running exec_run: {exec_err}")


            # Stop and remove the sandbox for cleanup
            print(f"\n4. Stopping and removing sandbox {test_project_id}...")
            await stop_sandbox(test_project_id, remove=True)
            print(f"   Sandbox for {test_project_id} stopped and removed.")

            # Verify it's gone
            print(f"\n5. Verifying sandbox {test_project_id} is removed...")
            final_check = await get_or_start_sandbox(test_project_id)
            if not final_check:
                print(f"   Sandbox for {test_project_id} correctly reported as not found after removal.")
            else:
                print(f"   ERROR: Sandbox for {test_project_id} still found after removal: {final_check}")
        else:
            print(f"   Sandbox creation failed for {test_project_id}.")
            print(f"   Ensure Docker image '{Configuration.SANDBOX_IMAGE_NAME}' is available locally or in a configured registry.")

    asyncio.run(main_test())
