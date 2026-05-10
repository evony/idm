#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ZSRV — Double-Fork Dev Server Launcher + Persistent Supervisor
# ═══════════════════════════════════════════════════════════════
# Technique:
#   1. Main script forks a "watcher" child
#   2. Watcher forks again (double-fork) to launch the actual server
#   3. Watcher exits → server becomes orphan, reparented to PID 1
#   4. A separate "supervisor" background process monitors and
#      auto-restarts the server if it dies
#
# This ensures the server survives shell disconnects and signal kills.
# ═══════════════════════════════════════════════════════════════

PROJECT="/home/z/my-project"
LOG="$PROJECT/dev.log"
PID_FILE="$PROJECT/.dev-server.pid"
SUPERVISOR_PID_FILE="$PROJECT/.supervisor.pid"
PORT=3000
MAX_RESTARTS=100

# ── Helper Functions ──────────────────────────────────────────

kill_existing() {
  echo "[zsrv] Cleaning up old processes..." | tee -a "$LOG"
  
  # Kill supervisor if running
  if [ -f "$SUPERVISOR_PID_FILE" ]; then
    OLD_SP=$(cat "$SUPERVISOR_PID_FILE" 2>/dev/null)
    if [ -n "$OLD_SP" ] && kill -0 "$OLD_SP" 2>/dev/null; then
      echo "[zsrv] Killing old supervisor (PID $OLD_SP)..." | tee -a "$LOG"
      kill -9 "$OLD_SP" 2>/dev/null
    fi
    rm -f "$SUPERVISOR_PID_FILE"
  fi
  
  # Kill server if running
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
      echo "[zsrv] Killing old server (PID $OLD_PID)..." | tee -a "$LOG"
      kill -9 "$OLD_PID" 2>/dev/null
    fi
    rm -f "$PID_FILE"
  fi
  
  # Kill anything on port 3000
  PORT_PID=$(lsof -ti :$PORT 2>/dev/null)
  if [ -n "$PORT_PID" ]; then
    echo "[zsrv] Killing process on port $PORT: $PORT_PID" | tee -a "$LOG"
    echo "$PORT_PID" | xargs kill -9 2>/dev/null
  fi
  
  sleep 2
}

prepare() {
  cd "$PROJECT"
  echo "[zsrv] Preparing project..." | tee -a "$LOG"
  cp prisma/schema.sqlite.prisma prisma/schema.prisma
  bun run db:generate 2>/dev/null || npx prisma generate --silent 2>/dev/null
  echo "[zsrv] Preparation complete" | tee -a "$LOG"
}

wait_for_ready() {
  local max_wait=${1:-60}
  local waited=0
  while [ $waited -lt $max_wait ]; do
    if curl -s -o /dev/null "http://localhost:$PORT/" 2>/dev/null; then
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
  done
  return 1
}

# ── Supervisor Function (runs in background, monitors server) ──

run_supervisor() {
  local restart_count=0
  
  echo "[supervisor] Supervisor started (PID $$)" | tee -a "$LOG"
  echo $$ > "$SUPERVISOR_PID_FILE"
  
  while [ $restart_count -lt $MAX_RESTARTS ]; do
    # Check if server is running
    SERVER_PID=$(cat "$PID_FILE" 2>/dev/null)
    
    if [ -z "$SERVER_PID" ] || ! kill -0 "$SERVER_PID" 2>/dev/null; then
      restart_count=$((restart_count + 1))
      echo "[supervisor] Server not running. Starting (attempt #$restart_count)..." | tee -a "$LOG"
      
      # Kill anything on port
      lsof -ti :$PORT 2>/dev/null | xargs kill -9 2>/dev/null
      sleep 1
      
      # Double-fork launch
      (
        # First fork - child
        (
          # Second fork - grandchild (actual server)
          cd "$PROJECT"
          exec bun --bun next dev -p $PORT >> "$LOG" 2>&1
        ) &
        # Save grandchild PID
        echo $! > "$PID_FILE"
        # First fork exits immediately → grandchild becomes orphan of PID 1
        exit 0
      )
      
      # Wait for server to be ready
      if wait_for_ready 60; then
        SERVER_PID=$(cat "$PID_FILE" 2>/dev/null)
        echo "[supervisor] Server ready (PID $SERVER_PID)" | tee -a "$LOG"
        restart_count=0  # Reset count on successful start
      else
        echo "[supervisor] Server failed to start within 60s" | tee -a "$LOG"
        sleep 5
        continue
      fi
    fi
    
    # Health check - try to fetch the page
    if ! curl -s -o /dev/null "http://localhost:$PORT/" 2>/dev/null; then
      # Server might be hung, check if process still exists
      if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "[supervisor] Server process alive but not responding, killing..." | tee -a "$LOG"
        kill -9 "$SERVER_PID" 2>/dev/null
        rm -f "$PID_FILE"
      fi
    fi
    
    sleep 10
  done
  
  echo "[supervisor] Max restarts reached. Stopping." | tee -a "$LOG"
}

# ── Main Entry Point ─────────────────────────────────────────

echo "" | tee -a "$LOG"
echo "════════════════════════════════════════════════════" | tee -a "$LOG"
echo "[zsrv] ZSRV Double-Fork Server Launcher" | tee -a "$LOG"
echo "[zsrv] $(date)" | tee -a "$LOG"
echo "════════════════════════════════════════════════════" | tee -a "$LOG"

# Step 1: Kill any existing processes
kill_existing

# Step 2: Prepare the project
prepare

# Step 3: Launch the supervisor in background using double-fork
(
  # First fork
  (
    # Second fork - the supervisor becomes an orphan
    run_supervisor
    exit 0
  ) &
  # First fork exits
  exit 0
)

# Wait a moment then verify
sleep 5

if wait_for_ready 60; then
  SERVER_PID=$(cat "$PID_FILE" 2>/dev/null)
  SUPERVISOR_PID=$(cat "$SUPERVISOR_PID_FILE" 2>/dev/null)
  echo "[zsrv] ✅ Server is LIVE on port $PORT (PID $SERVER_PID)" | tee -a "$LOG"
  echo "[zsrv] ✅ Supervisor running (PID $SUPERVISOR_PID)" | tee -a "$LOG"
  echo "[zsrv] Server will auto-restart if it crashes." | tee -a "$LOG"
else
  echo "[zsrv] ❌ Server failed to start. Check $LOG" | tee -a "$LOG"
fi
