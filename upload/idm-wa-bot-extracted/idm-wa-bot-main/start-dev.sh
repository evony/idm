#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Double Fork Technique for Next.js Dev Server (Turbopack)
# 
# Parent → Child (forks & exits) → Grandchild (actual server)
# Grandchild becomes orphan, adopted by init PID 1,
# immune to shell/session termination signals.
# ═══════════════════════════════════════════════════════════

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/dev.log"
PORT=3000

cd "$PROJECT_DIR"

# Step 1: First fork — child process
(
  # Step 2: Detach from parent's session/terminal
  setsid bash -c "
    cd '$PROJECT_DIR'
    
    # Step 3: Second fork — grandchild (the actual server process)
    # This is the 'double fork' — grandchild is fully detached
    NODE_OPTIONS='--max-old-space-size=4096' npx next dev -p $PORT > '$LOG_FILE' 2>&1 &
    SERVER_PID=\$!
    echo \"[\$(date '+%H:%M:%S')] Server started with PID \$SERVER_PID (double-forked)\" >> '$LOG_FILE'
    
    # Keep the intermediate process alive to monitor
    while kill -0 \$SERVER_PID 2>/dev/null; do
      sleep 5
    done
    echo \"[\$(date '+%H:%M:%S')] Server process \$SERVER_PID died\" >> '$LOG_FILE'
  "
) &

# Parent exits immediately — child and grandchild run independently
echo "Double-fork initiated. Server starting on port $PORT..."
echo "Check logs: tail -f $LOG_FILE"
