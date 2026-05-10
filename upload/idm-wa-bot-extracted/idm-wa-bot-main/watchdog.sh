#!/bin/bash
# Simple watchdog: restart dev server if it dies
LOCKFILE=/tmp/tarkam-dev.lock
PIDFILE=/tmp/tarkam-dev.pid
LOGFILE=/home/z/my-project/dev.log

cd /home/z/my-project

while true; do
  if [ -f "$PIDFILE" ]; then
    OLDPID=$(cat "$PIDFILE")
    if kill -0 "$OLDPID" 2>/dev/null; then
      sleep 5
      continue
    fi
  fi
  
  echo "[$(date)] Starting dev server..." >> "$LOGFILE"
  cp prisma/schema.sqlite.prisma prisma/schema.prisma
  npx prisma generate >> "$LOGFILE" 2>&1
  
  node node_modules/.bin/next dev -p 3000 >> "$LOGFILE" 2>&1 &
  PID=$!
  echo "$PID" > "$PIDFILE"
  
  # Wait for the process to exit
  wait $PID 2>/dev/null
  echo "[$(date)] Dev server exited (code: $?), restarting in 3s..." >> "$LOGFILE"
  sleep 3
done
