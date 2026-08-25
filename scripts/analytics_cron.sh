#!/usr/bin/env bash
# Hourly analytics cron: run due monitors, then refresh benchmark rollups.
# Replaces scripts/run_due_monitors.sh as the crontab target (kept intact
# for rollback). Schedule lives in root's crontab: 23 * * * *.
set -euo pipefail
mkdir -p /tmp/opencode
LOCK=/tmp/nebula-analytics-cron.lock
trap 'rm -f "$LOCK"' EXIT
exec 9>"$LOCK"
flock -n 9 || exit 0

SECRET=$(sudo cat /proc/$(systemctl show -p MainPID --value nebula-platform-api.service)/environ \
  | tr '\0' '\n' | grep '^INTERNAL_API_SECRET=' | cut -d= -f2-)

CODE=$(curl -s -o /tmp/opencode/monitors_run.json -w "%{http_code}" \
  -X POST http://127.0.0.1:8001/audit/monitors/run-due \
  -H "Authorization: Bearer $SECRET" || echo 000)
echo "$(date -u +%FT%TZ) run-due -> $CODE $(head -c 200 /tmp/opencode/monitors_run.json 2>/dev/null)" \
  >> /home/mike/nebula/logs/monitors_runner.log
[ "$CODE" = "200" ] || [ "$CODE" = "000" ] || exit 1

RCODE=$(curl -s -o /tmp/opencode/rollups_refresh.json -w "%{http_code}" \
  -X POST http://127.0.0.1:8001/audit/analytics/rollups/refresh \
  -H "Authorization: Bearer $SECRET" || echo 000)
echo "$(date -u +%FT%TZ) rollups-refresh -> $RCODE $(head -c 200 /tmp/opencode/rollups_refresh.json 2>/dev/null)" \
  >> /home/mike/nebula/logs/analytics_cron.log
[ "$RCODE" = "200" ] || [ "$RCODE" = "000" ] || exit 1

FCODE=$(curl -s -o /tmp/opencode/funnel_sweep.json -w "%{http_code}" \
  -X POST http://127.0.0.1:8001/audit/funnel/sweep \
  -H "Authorization: Bearer $SECRET" || echo 000)
echo "$(date -u +%FT%TZ) funnel-sweep -> $FCODE $(head -c 200 /tmp/opencode/funnel_sweep.json 2>/dev/null)" \
  >> /home/mike/nebula/logs/analytics_cron.log
[ "$FCODE" = "200" ] || [ "$FCODE" = "000" ] || exit 1
