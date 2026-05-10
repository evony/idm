#!/bin/bash
# Start IDM WA Bot Mini-Service
# Usage: ./start.sh (from mini-services/wa-bot directory)

cd "$(dirname "$0")"

echo "🚀 Starting IDM WA Bot..."

# Kill existing process on port 3004
lsof -ti:3004 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Start the bot
exec npx tsx src/index.ts
