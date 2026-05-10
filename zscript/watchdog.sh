#!/usr/bin/env bash
# ──────────────────────────────────────────────
# TARKAM Server Watchdog — Auto-restart if crashed
# Uses double-fork to become a daemon
# Location: zscript/watchdog.sh
# ──────────────────────────────────────────────

PROJECT_DIR="/home/z/my-project"
PID_FILE="$PROJECT_DIR/.server.pid"
WATCHDOG_PID_FILE="$PROJECT_DIR/.watchdog.pid"
PORT=3000
WATCHDOG_LOG="$PROJECT_DIR/watchdog.log"
MAX_RESTARTS=5
RESTART_COUNT=0
RESTART_WINDOW=300
FIRST_RESTART_TIME=0

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [watchdog] $1" | tee -a "$WATCHDOG_LOG"
}

# ── Double-fork to become a daemon ──
if [ "${_WATCHDOG_DAEMONIZED:-}" != "1" ]; then
    (
        (
            _WATCHDOG_DAEMONIZED=1 setsid bash "$0" >> "$WATCHDOG_LOG" 2>&1 &
            echo $! > "$WATCHDOG_PID_FILE"
        )
    ) &
    sleep 1
    log "Watchdog daemon started (PID $(cat "$WATCHDOG_PID_FILE" 2>/dev/null))"
    exit 0
fi

# ── Daemon main loop ──
log "Watchdog started (checking every 30s)"

while true; do
    sleep 30

    # Check if server process is alive
    SERVER_ALIVE=false
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            SERVER_ALIVE=true
        fi
    fi

    # Check if HTTP is responding
    HTTP_OK=false
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" --max-time 3 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        HTTP_OK=true
    fi

    if $SERVER_ALIVE && $HTTP_OK; then
        RESTART_COUNT=0
        continue
    fi

    log "⚠ Server check failed (alive=$SERVER_ALIVE, http=$HTTP_CODE)"

    # Rate limit restarts
    NOW=$(date +%s)
    if [ $RESTART_COUNT -eq 0 ]; then
        FIRST_RESTART_TIME=$NOW
    fi

    ELAPSED=$((NOW - FIRST_RESTART_TIME))
    if [ $RESTART_COUNT -ge $MAX_RESTARTS ] && [ $ELAPSED -lt $RESTART_WINDOW ]; then
        log "✗ Max restarts ($MAX_RESTARTS) reached. Cooling down 60s..."
        sleep 60
        RESTART_COUNT=0
        continue
    fi

    RESTART_COUNT=$((RESTART_COUNT + 1))
    log "Restarting server (attempt $RESTART_COUNT)..."

    bash "$PROJECT_DIR/zscript/start-server.sh" >> "$WATCHDOG_LOG" 2>&1
    log "Restart command issued. Waiting 10s..."
    sleep 10
done
