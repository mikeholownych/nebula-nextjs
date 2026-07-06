#!/usr/bin/env bash
# Nebula watchdog — runs every 5 min via cron
# Checks: port 8765, port 8766 (WP), cloudflared, webhook server (9000)
# Restarts anything dead. Logs to /home/mike/nebula/watchdog.log
set -euo pipefail

LOG="/home/mike/nebula/watchdog.log"
ts() { date '+%Y-%m-%d %H:%M:%S'; }

check_port() {
  local port=$1
  curl -s --max-time 3 "http://localhost:$port/" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000"
}

log() { echo "[$(ts)] $*" >> "$LOG"; }

# --- 8765 nebula-site ---
code=$(check_port 8765)
if [[ "$code" != "200" && "$code" != "301" && "$code" != "302" ]]; then
  log "RESTART nebula-site (got HTTP $code)"
  systemctl restart nebula-site 2>>"$LOG" || true
fi

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
