#!/bin/bash
# IDM WA Bot — Keep-Alive Runner (for local dev only)
# Restarts the bot automatically if it dies
# Usage: bash run.sh
#
# REQUIRED ENV VARS (set before running):
# - DATABASE_URL
# - DIRECT_DATABASE_URL
# - ADMIN_WA_NUMBERS (optional)
# - ADMIN_WA_NAMES (optional)

cd "$(dirname "$0")"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo "Copy .env.example to .env and fill in your values"
  exit 1
fi

echo "[KEEP-ALIVE] Starting WA Bot runner..."
RESTART_COUNT=0

while true; do
  RESTART_COUNT=$((RESTART_COUNT + 1))
  echo "[KEEP-ALIVE] Starting bot (attempt $RESTART_COUNT)..."
  
  npx tsx index.ts 2>&1
  EXIT_CODE=$?
  
  echo "[KEEP-ALIVE] Bot exited with code $EXIT_CODE"
  
  # Wait before restarting
  sleep 10
done
