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
