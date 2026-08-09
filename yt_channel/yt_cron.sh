#!/usr/bin/env bash
# YouTube channel cron wrapper — DAILY.
#   Mon + Thu (14:00 UTC): produce + upload BOTH long-form and Short
#   Other days:           : produce + upload Short only (daily Shorts cadence)
# Changed by Hermes 2026-08-09: daily Shorts + long on Mon/Thu, uploads both.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NEBULA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$NEBULA_DIR"
source "$NEBULA_DIR/venv/bin/activate"

# Log to file for debugging
LOG_DIR="$NEBULA_DIR/yt_channel/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M-%S).log"

DOW="$(date +%u)"  # 1=Mon, 4=Thu
if [ "$DOW" = "1" ] || [ "$DOW" = "4" ]; then
    MODE="both"
else
    MODE="short"
fi

echo "=== YouTube Pipeline Run: $(date) [mode=$MODE] ===" >> "$LOG_FILE" 2>&1
python3 yt_channel/yt_orchestrator.py --upload --mode "$MODE" >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "=== Pipeline OK ===" >> "$LOG_FILE"
else
    echo "=== Pipeline FAILED (exit $EXIT_CODE) ===" >> "$LOG_FILE"
fi

# Show last 10 lines to stdout (for cron delivery)
tail -10 "$LOG_FILE"
echo ""
echo "=== Studio Status ===" >> "$LOG_FILE" 2>&1
python3 yt_channel/studio_status.py >> "$LOG_FILE" 2>&1 || true
echo "=== Status End ===" >> "$LOG_FILE" 2>&1
