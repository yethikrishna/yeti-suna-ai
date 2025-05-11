# Fix Authentication Page Rendering Issue

This document provides instructions for fixing the authentication page rendering issue in the Suna application.

## Root Cause

The issue is related to the Next.js configuration, specifically the "output: standalone" setting which requires a different start command. The current start command `npm start` doesn't work with the standalone output mode.

## Solution

Follow these steps to fix the authentication page rendering issue:

1. **Update the Supabase client to use HTTPS protocol**

   Edit `frontend/src/lib/supabase/client.ts`:
   ```typescript
   // Ensure the URL is in the proper format with https protocol
   if (supabaseUrl && !supabaseUrl.startsWith('http')) {
     // If it's just a hostname without protocol, add https://
     supabaseUrl = `https://${supabaseUrl}`;
   }
   ```

2. **Create a custom start script**

   Create a new file `frontend/start.sh`:
   ```bash
   #!/bin/bash

   # This script checks if the Next.js application is in standalone mode
   # and uses the appropriate start command

   # Check if we're in standalone mode
   if [ -f .next/standalone/server.js ]; then
     echo "Starting Next.js in standalone mode..."
     node .next/standalone/server.js
   else
     echo "Starting Next.js in regular mode..."
     npm start
   fi
   ```

   Make the script executable:
   ```bash
   chmod +x frontend/start.sh
   ```

3. **Update the Next.js configuration**

   Edit `frontend/next.config.js`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     typescript: {
       // ⚠️ Dangerously allow production builds to successfully complete even if
       // your project has type errors.
       ignoreBuildErrors: true,
     },
     eslint: {
       // ⚠️ Dangerously allow production builds to successfully complete even if
       // your project has ESLint errors.
       ignoreDuringBuilds: true,
     },
     // Configure output to use standalone mode for better deployment compatibility
     output: 'standalone',
     env: {
       // These values will be overridden by environment variables at runtime
       NEXT_PUBLIC_BACKEND_URL: 'http://backend:8000/api',
       NEXT_PUBLIC_URL: 'https://suna-dev.m2w.io',
       NEXT_PUBLIC_ENV_MODE: 'PRODUCTION',
     },
     // Add any other Next.js config options here
   };
   ```

4. **Update the Dockerfile**

   Edit `frontend/Dockerfile`:
   ```dockerfile
   # Copy the start script and make it executable
   COPY start.sh ./
   RUN chmod +x ./start.sh

   # Use the custom start script to handle both standalone and regular mode
   CMD ["./start.sh"]
   ```

5. **Update the package.json file**

   Edit `frontend/package.json`:
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "start:standalone": "node .next/standalone/server.js",
     "start:auto": "bash ./start.sh",
     "lint": "next lint"
   },
   ```

6. **Restart the application**

   ```bash
   cd /data/coolify/applications/qcooscsw0kgwsgsk888k8ook
   docker-compose down frontend
   docker-compose up -d frontend
   ```

## Environment Variables

Make sure the following environment variables are set in the Coolify application:

```
NEXT_PUBLIC_SUPABASE_URL=https://supabasekong-akowwgwwwwcwossg4cgwk0ok.m2w.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NjA3NzU4MCwiZXhwIjo0OTAxNzUxMTgwLCJyb2xlIjoiYW5vbiJ9.j51zQk3iB6WC6BzBOSpKgwYb2kDfIbnNNt5iCCFsLfs
SUPABASE_URL=https://supabasekong-akowwgwwwwcwossg4cgwk0ok.m2w.io
SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NjA3NzU4MCwiZXhwIjo0OTAxNzUxMTgwLCJyb2xlIjoiYW5vbiJ9.j51zQk3iB6WC6BzBOSpKgwYb2kDfIbnNNt5iCCFsLfs
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NjA3NzU4MCwiZXhwIjo0OTAxNzUxMTgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.zG-25yMY-sBmjqTbqEiaI_yFsuyxoXyE88JCKZb21Ls
NEXT_PUBLIC_SITE_URL=https://suna-dev.m2w.io
SITE_URL=https://suna-dev.m2w.io
NEXT_PUBLIC_BACKEND_URL=https://suna-dev.m2w.io
NEXT_PUBLIC_URL=https://suna-dev.m2w.io
NODE_ENV=production
```

## User Credentials

You can use the following credentials to log in to the Suna application:

- Email: admin@suna-dev.m2w.io
- Password: password123456

## Testing

After implementing these changes, you should be able to access the authentication page at https://suna-dev.m2w.io/auth and log in with the credentials provided above.
