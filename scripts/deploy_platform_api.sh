#!/usr/bin/env bash
# Atomic platform_api deploy: compile-check -> migrate -> restart -> verify.
# Created 2026-08-22 after the fix_implementations incident (ledger claimed
# applied, table missing, /api/ga4/correlation 500ing for a day+ unnoticed).
# The route probe at the end is the gate: if any endpoint answers 5xx, the
# deploy reports FAIL loudly instead of shipping quiet trust damage.
set -uo pipefail

ROOT="/home/mike/nebula"
PY="$ROOT/venv/bin/python3"
SERVICE="nebula-platform-api"

log() { printf '[api-deploy] %s\n' "$*"; }

cd "$ROOT" || exit 2

log "1/5 compile check"
if ! $PY -m compileall -q platform_api; then
  log "FAIL: python compilation errors - nothing deployed."
  exit 1
fi

log "2/5 apply tracked migrations"
if ! PYTHONPATH="$ROOT" $PY platform_api/scripts/migrate.py apply; then
  log "FAIL: migration runner errored. Service NOT restarted on top of bad schema."
  exit 1
fi

log "3/5 restart $SERVICE"
if ! sudo systemctl restart "$SERVICE"; then
  log "FAIL: restart failed - inspect journalctl -u $SERVICE immediately."
  exit 1
fi

log "4/5 health gate"
ok=0
for i in $(seq 1 10); do
  sleep 1
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8001/healthz || true)
  [ "$code" = "200" ] && ok=1 && break
done
if [ "$ok" != "1" ]; then
  log "FAIL: /healthz never reached 200 within 10s of restart."
  exit 1
fi

log "5/5 full route probe (the nothing-errors-out gate)"
if PYTHONPATH="$ROOT" $PY platform_api/scripts/probe_routes.py; then
  log "PASS: all routes healthy. Deploy complete."
else
  log "FAIL: probe found 5xx routes AFTER deploy. Investigate now:"
  log "  journalctl -u $SERVICE --since '-2 min'"
  exit 1
fi
