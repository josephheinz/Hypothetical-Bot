#!/bin/bash
# Exit immediately if a command fails
set -e

# 1️⃣ Build TypeScript
echo "Building TypeScript..."
npx tsc

# 2️⃣ Kill any process on port 3001
echo "Checking for process on port 3001..."
PID=$(lsof -t -i:3001 || true)
if [ -n "$PID" ]; then
  echo "Killing process $PID on port 3001..."
  kill -9 $PID
else
  echo "No process found on port 3001."
fi

# 3️⃣ Start localtunnel
echo "Starting localtunnel on port 3001..."
npx localtunnel --port 3001 --subdomain mybot &
LT_PID=$!
echo "Localtunnel running with PID $LT_PID"

# 4️⃣ Run the built Node project
echo "Starting Node app..."
node dist/index.js
