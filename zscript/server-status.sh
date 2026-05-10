#!/usr/bin/env bash
# ──────────────────────────────────────────────
# TARKAM Dev Server — Status Check
# ──────────────────────────────────────────────

PROJECT_DIR="/home/z/my-project"
PID_FILE="$PROJECT_DIR/.server.pid"
PORT=3000

echo "═══════════════════════════════════════"
echo "  TARKAM Dev Server Status"
echo "═══════════════════════════════════════"

# Check PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "  PID File:  $PID (ALIVE ✓)"
    else
        echo "  PID File:  $PID (DEAD ✗)"
    fi
else
    echo "  PID File:  Not found"
fi

# Check port
if lsof -i:$PORT >/dev/null 2>&1; then
    PID_ON_PORT=$(lsof -t -i:$PORT 2>/dev/null | head -1)
    echo "  Port $PORT: IN USE (PID $PID_ON_PORT) ✓"
else
    echo "  Port $PORT: FREE ✗"
fi

# Check health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" --max-time 3 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "  HTTP:      $HTTP_CODE (OK ✓)"
else
    echo "  HTTP:      $HTTP_CODE (FAIL ✗)"
fi

echo "═══════════════════════════════════════"
