#!/usr/bin/env bash
# Platform API deploy with auto-rollback.
# compile-check -> migrate -> snapshot -> restart -> health gate -> probe.
#
# If the health gate or the route probe fails after restart, the previous
# release (snapshotted from disk pre-restart) is restored and restarted, then
# re-probed for the record. Migrations are additive/idempotent by policy and
# stay forward-compatible with the previous release, so they are NOT reverted;
# old code simply ignores columns it does not know about.
set -uo pipefail

ROOT="/home/mike/nebula"
PY="$ROOT/venv/bin/python3"
SERVICE="nebula-platform-api"
BACKUPS="$ROOT/.deploy-backups"
KEEP=5

log() { printf '[api-deploy] %s\n' "$*"; }

cd "$ROOT" || exit 2

log "1/6 compile check"
if ! $PY -m compileall -q platform_api; then
  log "FAIL: python compilation errors - nothing deployed."
  exit 1
fi

log "2/6 apply tracked migrations"
if ! PYTHONPATH="$ROOT" $PY platform_api/scripts/migrate.py apply; then
  log "FAIL: migration runner errored. Service NOT restarted on top of bad schema."
  exit 1
fi

log "3/6 snapshot current release for rollback"
mkdir -p "$BACKUPS"
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="$BACKUPS/$STAMP"
mkdir -p "$BACKUP"
cp -a platform_api "$BACKUP/platform_api"
find "$BACKUP/platform_api" -type d -name __pycache__ -prune -exec rm -rf {} +
# Retain only the newest $KEEP snapshots.
ls -1dt "$BACKUPS"/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
log "snapshot: $BACKUP"

wait_healthy() {
  local tries="$1"
  for _ in $(seq 1 "$tries"); do
    sleep 1
    if [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8001/healthz || true)" = "200" ]; then
      return 0
    fi
  done
  return 1
}

rollback() {
  log "ROLLBACK: restoring $BACKUP and restarting $SERVICE"
  if ! rsync -a --delete --exclude '__pycache__/' "$BACKUP/platform_api/" "$ROOT/platform_api/"; then
    log "CRITICAL: rollback rsync failed - manual recovery required."
    return 1
  fi
  if ! sudo systemctl restart "$SERVICE"; then
    log "CRITICAL: rollback restart failed - manual recovery required."
    return 1
  fi
  if wait_healthy 15; then
    log "Rollback complete: previous release healthy."
    return 0
  fi
  log "CRITICAL: previous release also unhealthy - manual recovery required."
  return 1
}

log "4/6 restart $SERVICE"
if ! sudo systemctl restart "$SERVICE"; then
  log "FAIL: restart failed - rolling back."
  rollback
  exit 1
fi

log "5/6 health gate"
if ! wait_healthy 10; then
  log "FAIL: /healthz never reached 200 within 10s of restart - rolling back."
  rollback
  exit 1
fi

log "6/6 full route probe (the nothing-errors-out gate)"
if PYTHONPATH="$ROOT" $PY platform_api/scripts/probe_routes.py; then
  log "PASS: all routes healthy. Deploy complete."
else
  log "FAIL: probe found 5xx routes AFTER deploy - rolling back."
  rollback
  if PYTHONPATH="$ROOT" $PY platform_api/scripts/probe_routes.py; then
    log "Post-rollback probe PASS."
  else
    log "Post-rollback probe FAIL - investigate now:"
    log "  journalctl -u $SERVICE --since '-5 min'"
  fi
  exit 1
fi
