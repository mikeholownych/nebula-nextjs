#!/usr/bin/env bash
# Builds and deploys customer-portal atomically: build -> restart -> verify -> CF purge.
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
#
# 2026-08-17: Added Cloudflare cache purge as a mandatory final step.
# Root cause of the 08:05 MIME-type incident: a new build changed chunk
# hashes (_next/static/css/*.css). CF had the old HTML (referencing old
# hashes) cached with max-age=immutable. Browsers fetched fresh HTML from
# origin but the old chunk URLs returned CF-cached 404s with text/plain,
# which browsers refused as stylesheets. Purging CF after every deploy
# prevents this class of stale-asset/MIME error.
set -euo pipefail

PORTAL_DIR="/home/mike/nebula/customer-portal"
SITE_UNIT="nebula-nextjs.service"
VERIFY_SCRIPT="/home/mike/nebula/scripts/verify_production_services.sh"
CF_ZONE="nebulacomponents.com"

log() { printf '[deploy] %s\n' "$*"; }

log "Building in $PORTAL_DIR ..."
cd "$PORTAL_DIR"
npm ci --include=dev
npm run ci

# Revision alignment (do not stamp from this script by default).
# After a full rebuild+restart, these four values must match:
#   1. git rev-parse HEAD
#   2. customer-portal/app/lib/build-info.json `revision` (written by npm run build)
#   3. HTML `X-Nebula-Revision` (baked from build-info.json at next build)
#   4. FastAPI GET /healthz `revision` via systemd drop-in NEBULA_BUILD_REVISION
# This script restarts nebula-nextjs only. It does NOT write a SHA into systemd
# and does NOT restart nebula-platform-api. To stamp the API revision after a
# coordinated deploy, write a 0400 drop-in then restart the API unit separately:
#   printf '[Service]\nEnvironment=NEBULA_BUILD_REVISION=%s\n' "$(git rev-parse HEAD)" \
#     | sudo tee /etc/systemd/system/nebula-platform-api.service.d/revision.conf
#   sudo chmod 0400 /etc/systemd/system/nebula-platform-api.service.d/revision.conf
#   sudo systemctl daemon-reload
#   sudo systemctl restart nebula-platform-api.service
# Gate that sequence behind an explicit operator action — never as a side effect
# of a portal-only deploy. See customer-portal/docs/architecture/deployment-revision.md.

log "Build succeeded. Confirming FastAPI already serves POST /audit/accept ..."
# Production FastAPI sets openapi_url=None. GET on a POST-only route is 405 when
# the path exists; 404 means the accept handler is not mounted.
accept_code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 \
  "http://127.0.0.1:8001/audit/accept" || echo 000)
if [[ "$accept_code" == "404" || "$accept_code" == "000" || -z "$accept_code" ]]; then
  log "FAIL: refuse to restart Next until FastAPI serves POST /audit/accept (GET probe HTTP ${accept_code})."
  log "Operator order: apply platform_api/migrations/20260820_audit_runner_queue.sql on nebula_audit → restart nebula-platform-api → then retry this script → stamp SHA."
  exit 1
fi
log "FastAPI /audit/accept reachable (GET HTTP ${accept_code})"

log "Confirming $SITE_UNIT's cgroup before restart ..."
pre_cgroup=$(systemctl show "$SITE_UNIT" -p ControlGroup --value)
log "Current cgroup: ${pre_cgroup:-<not running>}"

log "Restarting $SITE_UNIT to load the new build ..."
sudo systemctl restart "$SITE_UNIT"

# Give the new process a moment to bind and become ready before verifying.
for i in $(seq 1 15); do
  if curl -fsS -o /dev/null --max-time 2 http://127.0.0.1:3000/api/readyz; then
    break
  fi
  sleep 1
done

log "Verifying deployed state ..."
if ! bash "$VERIFY_SCRIPT"; then
  log "FAIL: post-deploy verification failed. $SITE_UNIT is running the new build but is not healthy - investigate before considering this deploy complete."
  exit 1
fi

# ── Cloudflare cache purge ────────────────────────────────────────────────────
# Must run AFTER verify so we only purge when the new build is confirmed healthy.
# Reads CLOUDFLARE_API_TOKEN from ~/.hermes/.env (not committed to repo).
CF_ENV_FILE="$HOME/.hermes/.env"
if [[ ! -f "$CF_ENV_FILE" ]]; then
  log "WARN: $CF_ENV_FILE not found - skipping Cloudflare cache purge. Old chunks may remain cached."
else
  CF_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' "$CF_ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d ' ')
  if [[ -z "$CF_TOKEN" ]]; then
    log "WARN: CLOUDFLARE_API_TOKEN not set in $CF_ENV_FILE - skipping CF purge."
  else
    log "Resolving Cloudflare zone ID for $CF_ZONE ..."
    CF_ZONE_ID=$(curl -sf \
      "https://api.cloudflare.com/client/v4/zones?name=${CF_ZONE}" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'])" 2>/dev/null || true)

    if [[ -z "$CF_ZONE_ID" ]]; then
      log "WARN: Could not resolve CF zone ID for $CF_ZONE - skipping purge. Check CLOUDFLARE_API_TOKEN."
    else
      log "Purging Cloudflare cache for zone $CF_ZONE ($CF_ZONE_ID) ..."
      PURGE_RESULT=$(curl -sf -X POST \
        "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer $CF_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' \
        | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if d.get('success') else 'FAILED: '+str(d.get('errors')))" 2>/dev/null || echo "curl_error")

      if [[ "$PURGE_RESULT" == "ok" ]]; then
        log "Cloudflare cache purged successfully."
      else
        log "WARN: CF purge returned: $PURGE_RESULT. Old chunks may remain cached at the edge - manually purge via the CF dashboard if users report MIME errors."
      fi
    fi
  fi
fi
# ─────────────────────────────────────────────────────────────────────────────

log "Deploy complete: $SITE_UNIT restarted, verified healthy, CF cache purged."
