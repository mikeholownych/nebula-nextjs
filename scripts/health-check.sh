#!/bin/bash
# Automated resource/process health check with Telegram alerts.
# Runs every 5 minutes via cron. Complements scripts/notify_production_health.py
# (which checks canonical-service ownership) — this checks response time,
# memory, disk, and the cloudflared process, none of which that script covers.
#
# Fixed 2026-07-24 (INC-0005 follow-up):
# - Telegram alerts were gated on TELEGRAM_BOT_TOKEN, which is never set
#   anywhere in this environment, so send_alert() has never actually
#   delivered anything — only ever wrote to the local log. Now uses the
#   same working `hermes send` mechanism as notify_production_health.py
#   and sre_responder.py.
# - Removed the "attempt restart" block, which ran `npm start &` outside
#   systemd from a separate git worktree on any failed check. This is the
#   same anti-pattern that caused INC-0004 (a stale, un-managed process
#   squatting on port 3000 and blocking the canonical systemd service).
#   Alert only now — a human decides how to recover, per
#   deploy/systemd/README.md's documented restart procedure.

set -uo pipefail

LOG_FILE="/home/mike/.hermes/cron/output/health-check.log"
STATE_FILE="/home/mike/nebula/health_check_alert_state.json"
TELEGRAM_TARGET="telegram:5920497760"
ALERT_COOLDOWN_SECONDS=300  # don't re-alert on the same condition within 5 min

mkdir -p "$(dirname "$LOG_FILE")"

log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# One cooldown timestamp per check (by key), stored in a tiny JSON file via python3.
should_alert() {
    local key="$1"
    /home/mike/nebula/venv/bin/python3 - "$STATE_FILE" "$key" "$ALERT_COOLDOWN_SECONDS" <<'PYEOF'
import json, sys, time
from pathlib import Path
state_path, key, cooldown = Path(sys.argv[1]), sys.argv[2], int(sys.argv[3])
try:
    state = json.loads(state_path.read_text())
except (FileNotFoundError, json.JSONDecodeError):
    state = {}
now = time.time()
last = state.get(key, 0)
if now - last < cooldown:
    sys.exit(1)
state[key] = now
tmp = state_path.with_suffix(".json.tmp")
tmp.write_text(json.dumps(state))
tmp.rename(state_path)
sys.exit(0)
PYEOF
}

send_alert() {
    local key="$1" message="$2"
    log_info "ALERT: ${message}"
    if should_alert "$key"; then
        cd /home/mike/nebula && hermes send --to "$TELEGRAM_TARGET" "$message" >/dev/null 2>&1
    fi
}

# Health checks
log_info "Starting health check cycle"

# 1. Check Next.js server
if ! curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    send_alert "nextjs_down" "🚨 *NEXT.JS DOWN* — server not responding on port 3000. Time: $(date)"
else
    log_info "Next.js server: OK"
fi

# 2. Check response times
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/ 2>/dev/null | awk '{printf "%.3f", $1}')
if [ -n "$RESPONSE_TIME" ] && (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
    send_alert "slow_response" "⚠️ *SLOW RESPONSE* — ${RESPONSE_TIME}s (threshold 1.0s). Time: $(date)"
else
    log_info "Response time: ${RESPONSE_TIME}s - OK"
fi

# 3. Check memory usage
MEMORY_PERCENT=$(free | awk '/Mem:/ {printf "%.1f", ($3/$2)*100}')
if (( $(echo "$MEMORY_PERCENT > 90" | bc -l) )); then
    send_alert "high_memory" "🚨 *HIGH MEMORY* — ${MEMORY_PERCENT}% (threshold 90%). Time: $(date)"
else
    log_info "Memory usage: ${MEMORY_PERCENT}% - OK"
fi

# 4. Check disk space
DISK_PERCENT=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_PERCENT" -gt 90 ]; then
    send_alert "low_disk" "🚨 *LOW DISK SPACE* — ${DISK_PERCENT}% used (threshold 90%). Time: $(date)"
else
    log_info "Disk space: ${DISK_PERCENT}% - OK"
fi

# 5. Check Cloudflare tunnel
if ! pgrep -f "cloudflared" > /dev/null; then
    send_alert "tunnel_down" "🚨 *CLOUDFLARE TUNNEL DOWN* — tunnel process not running. Time: $(date)"
else
    log_info "Cloudflare tunnel: OK"
fi

log_info "Health check cycle complete"

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE")" -gt 10000 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
    log_info "Log rotated"
fi
