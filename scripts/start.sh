#!/bin/bash
# Start the continuous reply bot in background

BOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$BOT_DIR/state/.continuous-bot.pid"
LOG_FILE="$BOT_DIR/logs/continuous.log"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Bot already running (PID: $PID)"
        echo "Use ./scripts/stop.sh to stop it first"
        exit 1
    fi
fi

mkdir -p "$BOT_DIR/logs" "$BOT_DIR/state"
cd "$BOT_DIR"

echo "Starting continuous reply bot..."
echo "Target: 200 replies/day (1 every 5-9 min)"
echo ""

nohup node bots/continuous-reply-bot.js >> "$LOG_FILE" 2>&1 &
PID=$!
echo $PID > "$PID_FILE"

echo "Bot started! PID: $PID"
echo ""
echo "Commands:"
echo "  tail -f logs/continuous.log   # Watch live"
echo "  ./scripts/stop.sh             # Stop bot"
echo "  ./scripts/status.sh           # Check status"
