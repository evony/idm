#!/usr/bin/env bash
# ──────────────────────────────────────────────
# TARKAM Dev Server — Stop Script
# ──────────────────────────────────────────────

set -euo pipefail

PROJECT_DIR="/home/z/my-project"
PID_FILE="$PROJECT_DIR/.server.pid"
PORT=3000

echo "[stop-server] Stopping dev server..."

# Kill via PID file
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[stop-server] Killing PID $OLD_PID..."
        kill "$OLD_PID" 2>/dev/null || true
        sleep 1
        kill -9 "$OLD_PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
fi

# Kill anything on port 3000
fuser -k "$PORT/tcp" 2>/dev/null || true

# Kill all next dev processes just in case
pkill -f "next dev" 2>/dev/null || true

sleep 1

# Verify
if lsof -i:$PORT >/dev/null 2>&1; then
    echo "[stop-server] ⚠ Port $PORT still in use"
else
    echo "[stop-server] ✓ Port $PORT freed"
fi
