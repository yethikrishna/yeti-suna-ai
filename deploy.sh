#!/bin/bash
set -e

# =====================
# 1. Header
# =====================
echo "🚀 Starting Suna deployment process..."
echo "📋 Running pre-flight checks..."

# =====================
# 2. Environment Check
# =====================
echo "🔍 Verifying required environment variables..."

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_BACKEND_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ ERROR: Missing required environment variable: $var"
    exit 1
  fi
done

# =====================
# 3. Build Phase
# =====================
echo "🔨 Rebuilding containers with clean cache..."
docker-compose build --no-cache --pull

# =====================
# 4. Startup & Health Checks
# =====================
echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to initialize (30 seconds)..."
sleep 30

echo "🏥 Running health checks..."

# Check frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$FRONTEND_HEALTH" != "200" ]; then
  echo "❌ Frontend health check failed (Status: $FRONTEND_HEALTH)"
  docker-compose logs frontend
  exit 1
fi

# Check Supabase connection
SUPABASE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")
if [ "$SUPABASE_HEALTH" != "200" ] && [ "$SUPABASE_HEALTH" != "401" ]; then
  echo "❌ Supabase connection failed (Status: $SUPABASE_HEALTH)"
  docker-compose logs backend
  exit 1
fi

# Check Redis
REDIS_HEALTH=$(docker-compose exec redis redis-cli ping | grep -q PONG && echo "OK" || echo "FAIL")
if [ "$REDIS_HEALTH" != "OK" ]; then
  echo "❌ Redis connection failed"
  docker-compose logs redis
  exit 1
fi

echo "✅ All systems operational!"
echo "🌐 Frontend URL: http://localhost:3000"
echo "🔌 API URL: $NEXT_PUBLIC_BACKEND_URL"
echo "🛢️ Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# =====================
# Deployment Complete
# =====================
echo "🎉 Suna deployment completed successfully!"

