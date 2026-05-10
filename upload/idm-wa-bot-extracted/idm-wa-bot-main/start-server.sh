#!/bin/bash
while true; do
  NODE_OPTIONS="--max-old-space-size=4096" npx next dev -p 3000 --webpack 2>&1 | tee dev.log
  echo "Server died, restarting in 3s..."
  sleep 3
done
