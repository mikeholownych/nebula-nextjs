#!/usr/bin/env bash
# YouTube channel cron wrapper — run by cron every Mon+Thu.
# Produces a video and publishes it.
# Changed by Hermes 2026-07-09: fix venv path, use nebula root.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NEBULA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$NEBULA_DIR"
source "$NEBULA_DIR/venv/bin/activate"

# Log to file for debugging
LOG_DIR="$NEBULA_DIR/yt_channel/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M-%S).log"

echo "=== YouTube Pipeline Run: $(date) ===" >> "$LOG_FILE" 2>&1
python3 yt_channel/yt_orchestrator.py --upload >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "=== Pipeline OK ===" >> "$LOG_FILE"
else
    echo "=== Pipeline FAILED (exit $EXIT_CODE) ===" >> "$LOG_FILE"
fi

# Show last 10 lines to stdout (for cron delivery)
tail -10 "$LOG_FILE"
