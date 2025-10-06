#!/bin/bash
set -e

# Default port
PORT=${1:-3001}

echo "Using port $PORT"

# 1️⃣ Build TypeScript
echo "Building TypeScript..."
npx tsc

# 2️⃣ Kill any process on the port
echo "Checking for process on port $PORT..."
PID=$(lsof -t -i:$PORT || true)
if [ -n "$PID" ]; then
  echo "Killing process $PID on port $PORT..."
  kill -9 $PID
else
  echo "No process found on port $PORT."
fi

# 3️⃣ Start localtunnel
echo "Starting localtunnel on port $PORT..."
npx localtunnel --port $PORT --subdomain hypothetical-bot &
LT_PID=$!
echo "Localtunnel running with PID $LT_PID"

# 4️⃣ Run the built Node project
echo "Starting Node app..."
PORT=$PORT node dist/index.js
