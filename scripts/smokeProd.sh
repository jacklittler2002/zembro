#!/bin/bash
# scripts/smokeProd.sh - Local production-mode smoke test for Zembro
set -e

# Build backend
npm run build

# Start API in background
PORT=4000 NODE_ENV=production node dist/httpServer.js &
API_PID=$!
sleep 2

# Start worker in background
WORKER_HEALTH_PORT=4002 NODE_ENV=production node dist/worker.js &
WORKER_PID=$!
sleep 2

# Health check API
curl -sf http://localhost:4000/health && echo "API health check: OK" || (echo "API health check: FAIL" && exit 1)

# Health check worker
curl -sf http://localhost:4002/health && echo "Worker health check: OK" || (echo "Worker health check: FAIL" && exit 1)

# Kill background processes
kill $API_PID $WORKER_PID

exit 0
