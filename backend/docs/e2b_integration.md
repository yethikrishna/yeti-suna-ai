# E2B Runtime Integration

This document describes the E2B runtime integration for Suna, which provides an alternative to Daytona for sandbox environments.

## Overview

Suna now supports two runtime providers for sandbox environments:
- **Daytona**: The original provider with full-featured sandbox management
- **E2B**: A cloud-based sandbox provider with simplified deployment

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# E2B sandbox provider
E2B_API_KEY=your_e2b_api_key_here
E2B_TEMPLATE_ID=base

# Runtime provider selection (daytona or e2b)
SANDBOX_RUNTIME=e2b
```

### Configuration Options

- `E2B_API_KEY`: Your E2B API key (required for E2B runtime)
- `E2B_TEMPLATE_ID`: The E2B template to use (default: "base")
- `SANDBOX_RUNTIME`: Choose between "daytona" or "e2b" (default: "daytona")

## Features

### Runtime Manager

The `RuntimeManager` class provides a unified interface for both providers:

```python
from sandbox.runtime_manager import runtime_manager

# Get current runtime info
info = runtime_manager.get_runtime_info()

# Validate configuration
is_valid = runtime_manager.validate_runtime_config()

# Create sandbox (automatically uses configured runtime)
sandbox = runtime_manager.create_sandbox(password="mypass", project_id="proj123")
```

### API Endpoints

New API endpoints are available for runtime management:

- `GET /api/runtime/status` - Get current runtime status
- `POST /api/runtime/switch` - Switch between runtime providers
- `GET /api/runtime/validate/{runtime_name}` - Validate runtime configuration
- `GET /api/runtime/health` - Check runtime health

### E2B Sandbox Wrapper

The E2B implementation provides compatibility with the existing Daytona interface:

```python
from sandbox.e2b_sandbox import get_or_start_e2b_sandbox

# Get or create E2B sandbox
sandbox = await get_or_start_e2b_sandbox("sandbox_id")

# Use filesystem operations
sandbox.fs.upload_file(content, "/path/to/file")
files = sandbox.fs.list_files("/workspace")
content = sandbox.fs.download_file("/path/to/file")

# Use process operations
sandbox.process.create_session("session_id")
sandbox.process.execute_session_command("session_id", command)
```

## Differences Between Providers

### Daytona
- Full-featured sandbox management
- Persistent sandboxes with state management
- Advanced session management
- Custom resource allocation
- VNC access with password protection

### E2B
- Cloud-based, automatically managed
- Simplified deployment and scaling
- Template-based sandbox creation
- Built-in browser and development tools
- Automatic cleanup and resource management

## Migration Guide

### From Daytona to E2B

1. Set up E2B account and get API key
2. Update environment variables:
   ```bash
   E2B_API_KEY=your_api_key
   SANDBOX_RUNTIME=e2b
   ```
3. Restart the application
4. Existing projects will automatically use E2B for new sandboxes

### From E2B to Daytona

1. Ensure Daytona configuration is present:
   ```bash
   DAYTONA_API_KEY=your_api_key
   DAYTONA_SERVER_URL=your_server_url
   DAYTONA_TARGET=your_target
   SANDBOX_RUNTIME=daytona
   ```
2. Restart the application

## Troubleshooting

### Common Issues

1. **E2B API Key Invalid**
   - Verify your E2B API key is correct
   - Check E2B account status and billing

2. **Template Not Found**
   - Ensure the E2B_TEMPLATE_ID exists in your E2B account
   - Use "base" for the default template

3. **Runtime Switch Fails**
   - Check that the target runtime is properly configured
   - Verify all required environment variables are set

### Debugging

Enable debug logging to see runtime operations:

```python
import logging
logging.getLogger('sandbox').setLevel(logging.DEBUG)
```

### API Testing

Test runtime switching via API:

```bash
# Check current status
curl -X GET http://localhost:8000/api/runtime/status

# Switch to E2B
curl -X POST http://localhost:8000/api/runtime/switch \
  -H "Content-Type: application/json" \
  -d '{"runtime": "e2b"}'

# Validate E2B configuration
curl -X GET http://localhost:8000/api/runtime/validate/e2b
```

## Best Practices

1. **Environment Separation**: Use different runtime providers for different environments (dev/staging/prod)
2. **Configuration Validation**: Always validate runtime configuration before switching
3. **Monitoring**: Monitor runtime health and performance
4. **Backup Strategy**: Ensure important data is backed up before switching runtimes

## Limitations

### E2B Limitations
- Limited customization compared to Daytona
- Dependent on E2B service availability
- May have different performance characteristics

### Daytona Limitations
- Requires self-hosted infrastructure
- More complex setup and maintenance
- Resource management responsibility

## Support

For issues related to:
- **E2B**: Check E2B documentation and support channels
- **Daytona**: Check Daytona documentation and support channels
- **Suna Integration**: Create an issue in the Suna repository

## Future Enhancements

Planned improvements include:
- Runtime-specific optimizations
- Enhanced monitoring and metrics
- Automatic failover between providers
- Performance benchmarking tools