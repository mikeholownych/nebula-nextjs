#!/usr/bin/env bash
set -euo pipefail
LOCK=/tmp/nebula-monitors-runner.lock
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
