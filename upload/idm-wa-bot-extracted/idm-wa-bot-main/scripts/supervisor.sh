#!/bin/bash
# ═══════════════════════════════════════════════════════════
# IDM LEAGUE — Dev Server Auto-Restart Supervisor
# ═══════════════════════════════════════════════════════════
# Keeps the Next.js dev server alive by automatically
# restarting it when it crashes or is killed.
# ═══════════════════════════════════════════════════════════

LOG="/home/z/my-project/dev.log"
RESTART_COUNT=0
MAX_RESTARTS=50  # Safety limit

echo "[supervisor] Starting dev server supervisor..." | tee -a "$LOG"

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
  RESTART_COUNT=$((RESTART_COUNT + 1))
  echo "[supervisor] Starting server (attempt #$RESTART_COUNT)..." | tee -a "$LOG"
  
  # Start the dev server
  cd /home/z/my-project
  bun run dev >> "$LOG" 2>&1
  EXIT_CODE=$?
  
  echo "[supervisor] Server exited with code $EXIT_CODE" | tee -a "$LOG"
  
  # Wait a bit before restarting (avoid rapid restart loop)
  sleep 3
done

echo "[supervisor] Max restarts reached ($MAX_RESTARTS). Stopping." | tee -a "$LOG"
