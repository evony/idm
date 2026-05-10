#!/usr/bin/env bash
# ──────────────────────────────────────────────
# TARKAM Dev Server — Double Fork Technique
# Keeps the Next.js dev server alive as a daemon
# Location: zscript/start-server.sh
# ──────────────────────────────────────────────

set -euo pipefail

PROJECT_DIR="/home/z/my-project"
PID_FILE="$PROJECT_DIR/.server.pid"
LOG_FILE="$PROJECT_DIR/dev.log"
PORT=3000
NEXT_BIN="$PROJECT_DIR/node_modules/.bin/next"

# ── Cleanup: kill old server if running ──
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[start-server] Stopping old server (PID $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null || true
        sleep 2
        kill -9 "$OLD_PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
fi

# Also kill anything lingering on port 3000
fuser -k "$PORT/tcp" 2>/dev/null || true
sleep 1

# ── Load env vars ──
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

cd "$PROJECT_DIR"

echo "[start-server] Launching Next.js dev server on port $PORT..."
echo "[start-server] Log file: $LOG_FILE"

# ── Double Fork: grandchild becomes session leader ──
# Parent -> Child (fork1) -> Grandchild (fork2, setsid, exec)
(
    # First fork — child process
    (
        # Second fork — grandchild process
        # Create new session, detach from terminal
        setsid "$NEXT_BIN" dev -p "$PORT" > "$LOG_FILE" 2>&1 &

        # Save the grandchild PID
        GRANDCHILD_PID=$!
        echo "$GRANDCHILD_PID" > "$PID_FILE"
        echo "[start-server] Server started as daemon (PID $GRANDCHILD_PID)"
    )
    # First child exits immediately
) &

# Wait for server to initialize
echo "[start-server] Waiting for server to be ready..."
for i in $(seq 1 20); do
    sleep 1
    if [ -f "$PID_FILE" ]; then
        SERVER_PID=$(cat "$PID_FILE")
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            # Check if HTTP is responding
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" --max-time 2 2>/dev/null || echo "000")
            if [ "$HTTP_CODE" != "000" ]; then
                echo "[start-server] ✓ Server is running (PID $SERVER_PID) on port $PORT"
                echo "[start-server] ✓ HTTP response: $HTTP_CODE"
                echo "[start-server] ✓ Logs: tail -f $LOG_FILE"
                exit 0
            fi
        fi
    fi
    echo "[start-server]   ... waiting ($i/20)"
done

# Final check
if [ -f "$PID_FILE" ]; then
    SERVER_PID=$(cat "$PID_FILE")
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "[start-server] ✓ Server process alive (PID $SERVER_PID), still initializing..."
        echo "[start-server] ✓ Logs: tail -f $LOG_FILE"
    else
        echo "[start-server] ✗ Server PID $SERVER_PID not responding. Check $LOG_FILE"
        exit 1
    fi
else
    echo "[start-server] ✗ PID file not created. Check $LOG_FILE"
    exit 1
fi
