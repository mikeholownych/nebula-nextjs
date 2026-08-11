#!/usr/bin/env bash
# Builds and deploys customer-portal atomically: build -> restart -> verify.
#
# Exists because the 2026-07-26 CSS-outage incident happened when a build was
# run (commit 8aa1434a) but the systemd service was never restarted to pick
# it up - nebula-nextjs.service kept serving an old build's HTML against a
# static-asset directory a later build had already overwritten. The manual
# fix ("build, then restart, then verify") was already documented in
# deploy/systemd/README.md; this script is that same sequence made
# impossible to run halfway. Never run `npm run build`/`npm run start`
# directly for a production deploy - use this script so the restart and
# verify steps can't be skipped or forgotten.
set -euo pipefail

PORTAL_DIR="/home/mike/nebula/customer-portal"
SITE_UNIT="nebula-nextjs.service"
VERIFY_SCRIPT="/home/mike/nebula/scripts/verify_production_services.sh"

log() { printf '[deploy] %s\n' "$*"; }

log "Building in $PORTAL_DIR ..."
cd "$PORTAL_DIR"
npm ci --include=dev
npm run ci

log "Build succeeded. Confirming $SITE_UNIT's cgroup before restart ..."
pre_cgroup=$(systemctl show "$SITE_UNIT" -p ControlGroup --value)
log "Current cgroup: ${pre_cgroup:-<not running>}"

log "Restarting $SITE_UNIT to load the new build ..."
sudo systemctl restart "$SITE_UNIT"

# Give the new process a moment to bind and become ready before verifying.
for i in $(seq 1 15); do
  if curl -fsS -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
    break
  fi
  sleep 1
done

log "Verifying deployed state ..."
if ! bash "$VERIFY_SCRIPT"; then
  log "FAIL: post-deploy verification failed. $SITE_UNIT is running the new build but is not healthy - investigate before considering this deploy complete."
  exit 1
fi

log "Deploy complete: $SITE_UNIT restarted, verified healthy, and serving the current build."
