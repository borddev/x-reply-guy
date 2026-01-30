#!/bin/bash
# Check status of continuous reply bot

BOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$BOT_DIR/state/.continuous-bot.pid"
STATE_FILE="$BOT_DIR/state/continuous-state.json"

echo "=== X Reply Guy - Status ==="
echo ""

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Status: RUNNING (PID: $PID)"
        START_TIME=$(ps -p "$PID" -o lstart= 2>/dev/null)
        if [ -n "$START_TIME" ]; then
            echo "Started: $START_TIME"
        fi
    else
        echo "Status: STOPPED (stale PID file)"
    fi
else
    echo "Status: STOPPED"
fi

echo ""

if [ -f "$STATE_FILE" ]; then
    REPLIES_24H=$(node -e "
        const fs = require('fs');
        try {
            const state = JSON.parse(fs.readFileSync('$STATE_FILE'));
            const dayAgo = Date.now() - 24*60*60*1000;
            const recent = (state.repliesLast24h || []).filter(ts => new Date(ts).getTime() > dayAgo);
            console.log(recent.length);
        } catch { console.log(0); }
    " 2>/dev/null)

    REPLIES_TOTAL=$(node -e "
        const fs = require('fs');
        try {
            const state = JSON.parse(fs.readFileSync('$STATE_FILE'));
            console.log(state.repliesPosted || 0);
        } catch { console.log(0); }
    " 2>/dev/null)

    echo "Replies (total): ${REPLIES_TOTAL:-0}"
    echo "Replies (24h):   ${REPLIES_24H:-0}/200"
fi

echo ""

if [ -f "$BOT_DIR/logs/continuous.log" ]; then
    echo "Last activity:"
    tail -5 "$BOT_DIR/logs/continuous.log"
fi
