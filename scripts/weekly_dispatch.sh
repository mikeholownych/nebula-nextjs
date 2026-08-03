#!/bin/bash
set -uo pipefail

LOCK="/tmp/nebula_dispatch.lock"
LOG="/home/mike/nebula/logs/dispatch.log"

trap 'rm -f "$LOCK"' EXIT

exec 200>"$LOCK"
flock -n 200 || { echo "$(date -Iseconds) [SKIP] Another dispatch instance running" >> "$LOG"; exit 0; }

RESULT=$(curl -s -X POST http://127.0.0.1:8769/dispatch/run-all)
echo "$(date -Iseconds) [DISPATCH] $RESULT" >> "$LOG"
