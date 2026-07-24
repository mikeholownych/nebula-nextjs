#!/usr/bin/env bash
# Nebula watchdog — runs every 5 min via cron
# Checks: port 8766 (WP), cloudflared, webhook server (9000)
# Restarts anything dead. Logs to /home/mike/nebula/watchdog.log
#
# Removed 2026-07-24 (INC-0004/INC-0005): this used to also check port 8765
# and `systemctl restart nebula-site` on failure. Port 8765 was the retired
# pre-Next.js Python server (see .legacy/python-web-server/) and has had
# nothing listening on it for a long time, so that check always "failed" and
# this watchdog was unconditionally restarting nebula-site every time it ran
# — nebula-site is the OBSOLETE alias unit that deploy/systemd/README.md
# says must stay disabled/inactive, because it conflicts with the canonical
# nebula-nextjs.service for port 3000. This is what caused nebula-nextjs.service
# to be down for 14+ hours while nebula-site silently served stale, pre-fix
# code — see governance/INCIDENTS/INC-0004 and INC-0005. Production health
# (including drift like this) is now monitored by
# scripts/notify_production_health.py, which alerts on Telegram instead of
# blindly restarting a service — a bad restart target here doesn't get a
# second chance to cause a multi-hour outage.
set -euo pipefail

LOG="/home/mike/nebula/watchdog.log"
ts() { date '+%Y-%m-%d %H:%M:%S'; }

check_port() {
  local port=$1
  curl -s --max-time 3 "http://localhost:$port/" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000"
}

log() { echo "[$(ts)] $*" >> "$LOG"; }

# --- 8766 WordPress ---
code=$(check_port 8766)
if [[ "$code" == "000" ]]; then
  log "RESTART blog-wordpress-1 docker container"
  docker restart blog-wordpress-1 2>>"$LOG" || true
fi

# --- cloudflared ---
if ! systemctl is-active --quiet cloudflared-tunnel; then
  log "RESTART cloudflared-tunnel"
  systemctl restart cloudflared-tunnel 2>>"$LOG" || true
fi

# --- webhook server 9000 ---
code=$(check_port 9000)
if [[ "$code" == "000" ]]; then
  log "RESTART nebula-webhook"
  systemctl restart nebula-webhook 2>>"$LOG" || true
fi

# Trim log to last 1000 lines
tail -1000 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG" 2>/dev/null || true
