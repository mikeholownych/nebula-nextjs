#!/bin/bash
# Nebula Components - Route Content Health Monitor
# Checks specific public routes return 200 - catches a page-level regression
# (e.g. /pricing 500ing) that a root-only "is the site up" check would miss.
# Complements scripts/health-check.sh (resource checks) and
# scripts/notify_production_health.py (canonical-service ownership).
#
# Fixed 2026-07-24: this only ever echoed to stdout and exited non-zero -
# nothing invoked it or captured that output, so a failure here has never
# actually notified anyone. Now alerts via the same working `hermes send`
# Telegram mechanism as the other health scripts, with a cooldown so a
# persistent failure doesn't re-alert every run.

set -uo pipefail

BASE_URL="https://nebulacomponents.com"
STATE_FILE="/home/mike/nebula/customer-portal/route_health_alert_state.json"
TELEGRAM_TARGET="telegram:5920497760"
ALERT_COOLDOWN_SECONDS=1800  # 30 min - this is a lower-urgency, content-level check

ROUTES=(
  "/"
  "/terms"
  "/privacy-policy"
  "/pricing"
  "/learning-centre"
  "/case-studies"
)

FAILED_ROUTES=""

for route in "${ROUTES[@]}"; do
  URL="$BASE_URL$route"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10 2>/dev/null || echo "000")

  if [ "$STATUS" != "200" ]; then
    FAILED_ROUTES="$FAILED_ROUTES\n- $route -> HTTP $STATUS"
  fi
done

if [ -n "$FAILED_ROUTES" ]; then
  echo "⚠️ NEBULA HEALTH ALERT"
  echo ""
  echo "Failed routes:"
  echo -e "$FAILED_ROUTES"

  should_alert=$(/home/mike/nebula/venv/bin/python3 - "$STATE_FILE" "$ALERT_COOLDOWN_SECONDS" <<'PYEOF'
import json, sys, time
from pathlib import Path
state_path, cooldown = Path(sys.argv[1]), int(sys.argv[2])
try:
    state = json.loads(state_path.read_text())
except (FileNotFoundError, json.JSONDecodeError):
    state = {}
now = time.time()
last = state.get("last_alert", 0)
if now - last < cooldown:
    print("no")
    sys.exit(0)
state["last_alert"] = now
tmp = state_path.with_suffix(".json.tmp")
tmp.write_text(json.dumps(state))
tmp.rename(state_path)
print("yes")
PYEOF
)
  if [ "$should_alert" = "yes" ]; then
    hermes send --to "$TELEGRAM_TARGET" "$(printf '⚠️ *NEBULA ROUTE CHECK FAILED*\n\nFailed routes:%b' "$FAILED_ROUTES")" >/dev/null 2>&1
  fi
  exit 1
else
  echo "✅ All routes healthy"
  exit 0
fi
