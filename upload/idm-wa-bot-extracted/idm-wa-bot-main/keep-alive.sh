#!/bin/bash
# Auto-restart script for Next.js dev server
# Restarts the server if it dies
cd /home/z/my-project

while true; do
  # Check if port 3000 is in use
  if ! ss -tlnp 2>/dev/null | grep -q ':3000 '; then
    echo "[$(date)] Server down, restarting..." >> /home/z/my-project/keep-alive.log
    npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    SERVER_PID=$!
    echo "[$(date)] Started server PID=$SERVER_PID" >> /home/z/my-project/keep-alive.log
    sleep 10  # Wait for startup
  fi
  sleep 30  # Check every 30 seconds
done
