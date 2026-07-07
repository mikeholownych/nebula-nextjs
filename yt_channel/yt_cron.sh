#!/usr/bin/env bash
# YouTube channel cron wrapper — run by cron every Mon+Thu.
# Produces a video and publishes it.
set -e
cd "$(dirname "$0")"
source venv/bin/activate

# Log to file for debugging
LOG_DIR="yt_channel/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M-%S).log"

echo "=== YouTube Pipeline Run: $(date) ===" >> "$LOG_FILE" 2>&1
python3 yt_orchestrator.py >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "=== Pipeline OK ===" >> "$LOG_FILE"
else
    echo "=== Pipeline FAILED (exit $EXIT_CODE) ===" >> "$LOG_FILE"
fi

# Show last 10 lines to stdout (for cron delivery)
tail -5 "$LOG_FILE"
