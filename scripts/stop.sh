#!/bin/bash
# Stop the continuous reply bot

BOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$BOT_DIR/state/.continuous-bot.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Bot not running (no PID file)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "Stopping bot (PID: $PID)..."
    kill "$PID"
    sleep 2

    if ps -p "$PID" > /dev/null 2>&1; then
        kill -9 "$PID"
    fi

    echo "Bot stopped."
else
    echo "Bot was not running."
fi

rm -f "$PID_FILE"
