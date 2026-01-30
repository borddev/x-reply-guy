#!/bin/bash
# X Reply Guy Watchdog - Ensures bot stays running
# Run via cron every 5 minutes:
#   */5 * * * * /path/to/x-reply-guy/scripts/watchdog.sh

BOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$BOT_DIR/state/.continuous-bot.pid"
LOG_FILE="$BOT_DIR/logs/watchdog.log"
LOCK_FILE="$BOT_DIR/state/.watchdog.lock"

mkdir -p "$BOT_DIR/logs" "$BOT_DIR/state"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Prevent multiple watchdog instances
if [ -f "$LOCK_FILE" ]; then
    LOCK_PID=$(cat "$LOCK_FILE")
    if ps -p "$LOCK_PID" > /dev/null 2>&1; then
        exit 0
    fi
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# Check if bot is paused
STATE_FILE="$BOT_DIR/state/continuous-state.json"
if [ -f "$STATE_FILE" ]; then
    PAUSED=$(grep -o '"paused": *true' "$STATE_FILE" 2>/dev/null)
    if [ -n "$PAUSED" ]; then
        log "Bot is PAUSED - not restarting"
        exit 0
    fi
fi

# Check AdsPower
ADSPOWER_API="${ADSPOWER_API:-http://127.0.0.1:50325}"
ADSPOWER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ADSPOWER_API/api/v1/browser/local-active" 2>/dev/null)
if [ "$ADSPOWER_STATUS" != "200" ]; then
    log "AdsPower offline - will retry next run"
    exit 0
fi

# Check if bot is running
BOT_RUNNING=false
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        BOT_RUNNING=true
    fi
fi

if [ "$BOT_RUNNING" = false ]; then
    log "Bot not running - RESTARTING"

    rm -f "$PID_FILE"
    cd "$BOT_DIR"

    nohup node bots/continuous-reply-bot.js >> "$BOT_DIR/logs/continuous.log" 2>&1 &
    NEW_PID=$!
    echo $NEW_PID > "$PID_FILE"

    sleep 2
    if ps -p "$NEW_PID" > /dev/null 2>&1; then
        log "Bot restarted successfully (PID: $NEW_PID)"
    else
        log "ERROR: Bot failed to start!"
    fi
else
    # Check if stale (no log activity for 10 minutes)
    if [ -f "$BOT_DIR/logs/continuous.log" ]; then
        LAST_LOG_TIME=$(stat -f %m "$BOT_DIR/logs/continuous.log" 2>/dev/null || stat -c %Y "$BOT_DIR/logs/continuous.log" 2>/dev/null || echo 0)
        CURRENT_TIME=$(date +%s)
        DIFF=$((CURRENT_TIME - LAST_LOG_TIME))

        if [ "$DIFF" -gt 600 ]; then
            log "Bot stale (no activity for ${DIFF}s) - RESTARTING"
            kill -9 "$PID" 2>/dev/null
            rm -f "$PID_FILE"
            sleep 1

            cd "$BOT_DIR"
            nohup node bots/continuous-reply-bot.js >> "$BOT_DIR/logs/continuous.log" 2>&1 &
            NEW_PID=$!
            echo $NEW_PID > "$PID_FILE"
            log "Bot restarted (PID: $NEW_PID)"
        fi
    fi
fi

# Cleanup old logs
if [ -f "$LOG_FILE" ]; then
    tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
