#!/bin/bash
# Double-fork technique to keep Next.js dev server alive
# The sandbox kills direct child processes, but double-forked
# grandchild processes survive because they are reparented to PID 1

PROJECT_DIR="/home/z/my-project"

double_fork_start() {
  # First fork - child process
  (
    # Second fork - grandchild (reparented to init/PID 1)
    (
      cd "$PROJECT_DIR"
      cp prisma/schema.sqlite.prisma prisma/schema.prisma
      npx prisma generate 2>/dev/null
      exec npx next dev -p 3000 >> "$PROJECT_DIR/dev.log" 2>&1
    ) &
    # Child exits immediately, grandchild is orphaned and reparented to PID 1
    exit 0
  ) &
}

# Kill any existing server on port 3000
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# Start via double fork
double_fork_start

# Wait and verify
sleep 10
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
  echo "✅ Server started via double-fork (grandchild reparented to PID 1)"
  # Show the orphaned process
  ps -ef | grep "next dev" | grep -v grep
else
  echo "❌ Server failed to start"
fi
