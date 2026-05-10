#!/bin/bash
cd /home/z/my-project
cp prisma/schema.sqlite.prisma prisma/schema.prisma
npx prisma generate --silent 2>/dev/null

while true; do
  echo "[$(date)] Starting Next.js..." >> /tmp/server.log
  npx next dev -p 3000 --turbopack >> /tmp/server.log 2>&1 &
  PID=$!
  echo "[$(date)] Started PID=$PID" >> /tmp/server.log
  
  # Wait until it dies
  wait $PID 2>/dev/null
  EXIT=$?
  echo "[$(date)] PID=$PID exited with code $EXIT" >> /tmp/server.log
  
  sleep 3
done
