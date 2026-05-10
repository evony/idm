#!/bin/bash
cd /home/z/my-project
while true; do
  # Kill any leftover
  lsof -ti :3000 | xargs kill -9 2>/dev/null
  sleep 2
  
  echo "[$(date +%H:%M:%S)] Starting dev server..." >> /tmp/srv.log
  
  # Start server
  cp prisma/schema.sqlite.prisma prisma/schema.prisma
  npx prisma generate --silent 2>/dev/null
  npx next dev -p 3000 --turbopack 2>>/tmp/srv.log &
  PID=$!
  
  # Wait for ready
  for i in $(seq 1 20); do
    if curl -s -o /dev/null "http://localhost:3000/" 2>/dev/null; then
      echo "[$(date +%H:%M:%S)] Server ready PID=$PID" >> /tmp/srv.log
      break
    fi
    sleep 2
  done
  
  # Wait until it dies
  while kill -0 $PID 2>/dev/null; do
    sleep 5
  done
  
  echo "[$(date +%H:%M:%S)] Server died, restarting in 3s..." >> /tmp/srv.log
  sleep 3
done
