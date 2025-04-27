#!/bin/bash

# Start the bot in a loop that restarts it if it crashes
echo "Starting Bluesky Tip Bot..."

# Build the TypeScript files
echo "Building TypeScript files..."
npm run build

while true; do
  echo "$(date) - Starting bot process..."
  node dist/index.js
  
  # If we get here, the bot crashed
  echo "$(date) - Bot process exited. Restarting in 10 seconds..."
  sleep 10
done 