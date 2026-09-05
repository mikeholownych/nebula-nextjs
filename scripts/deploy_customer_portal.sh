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
API_UNIT="nebula-platform-api.service"
VERIFY_SCRIPT="/home/mike/nebula/scripts/verify_production_services.sh"
CF_ZONE="nebulacomponents.com"
REVISION_DROPIN="/etc/systemd/system/nebula-platform-api.service.d/revision.conf"

log() { printf '[deploy] %s\n' "$*"; }

probe_accept() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 5 \
    "http://127.0.0.1:8001/audit/accept" || echo 000
}

log "Confirming FastAPI already serves POST /audit/accept ..."
# Production FastAPI sets openapi_url=None. GET on a POST-only route is 405/400 when
# the path exists; 404 means the accept handler is not mounted.
accept_code=$(probe_accept)
if [[ "$accept_code" == "404" || "$accept_code" == "000" || -z "$accept_code" ]]; then
  log "FAIL: refuse to rebuild until FastAPI serves POST /audit/accept (GET probe HTTP ${accept_code})."
  log "Operator order: apply platform_api/migrations/20260820_audit_runner_queue.sql on nebula_audit → restart nebula-platform-api → then retry this script."
  exit 1
fi
log "FastAPI /audit/accept reachable (GET HTTP ${accept_code})"

log "Building in $PORTAL_DIR into .next-incoming (live process keeps serving .next) ..."
cd "$PORTAL_DIR"
rm -rf .next-incoming
export NEXT_DIST_DIR=.next-incoming
npm ci --include=dev
CI=1 npm run ci
unset NEXT_DIST_DIR

# ── Tracked migrations (DATA-2/FM-11) ────────────────────────────────────────
# Applied AFTER a good build exists and BEFORE anything is restarted, so a
# failed migration aborts the deploy with the live release untouched.
if [[ -f /home/mike/nebula/.env ]]; then set -a; source /home/mike/nebula/.env; set +a; fi
# Inherit the unit's EFFECTIVE environment (drop-ins included) so production
# DSN requirements are satisfied exactly as the running service sees them.
while IFS='=' read -r k v; do
  [[ "$k" == "DATABASE_URL" || "$k" == "AUDIT_DATABASE_URL" ]] && export "$k=$v"
done < <(systemctl show nebula-platform-api.service -p Environment --value | tr ' ' '\n' | grep -E '^(DATABASE_URL|AUDIT_DATABASE_URL)=')
: "${DATABASE_URL:=postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433}"
: "${AUDIT_DATABASE_URL:=postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433}"
export DATABASE_URL AUDIT_DATABASE_URL
log "Applying tracked migrations (audit + platform) ..."
if ! ENVIRONMENT=production PYTHONPATH=/home/mike/nebula \
    /home/mike/nebula/venv/bin/python3 /home/mike/nebula/platform_api/scripts/migrate.py apply; then
  log "FAIL: migration apply failed - live release untouched."
  exit 1
fi

SHA=$(git -C "$PORTAL_DIR" rev-parse HEAD)
log "Stamping $API_UNIT NEBULA_BUILD_REVISION=$SHA ..."
printf '[Service]\nEnvironment=NEBULA_BUILD_REVISION=%s\n' "$SHA" \
  | sudo tee "$REVISION_DROPIN" >/dev/null
sudo chmod 0400 "$REVISION_DROPIN"
sudo systemctl daemon-reload
sudo systemctl restart "$API_UNIT"

# Wait for FastAPI to finish booting (uv dependency resolution can take 10s+)
# before probing - a connection-refused here previously caused a false-positive
# post-swap verification failure and an unnecessary rollback.
api_ready=0
for i in $(seq 1 90); do
  if curl -fsS -o /dev/null --max-time 2 http://127.0.0.1:8001/healthz; then
    api_ready=1
    break
  fi
  sleep 1
done
if [[ "$api_ready" != "1" ]]; then
  log "FAIL: $API_UNIT did not become healthy within 90s of restart."
  exit 1
fi

accept_code=$(probe_accept)
if [[ "$accept_code" == "404" || "$accept_code" == "000" || -z "$accept_code" ]]; then
  log "FAIL: FastAPI /audit/accept unreachable after revision stamp (HTTP ${accept_code}). Not swapping Next."
  exit 1
fi

log "Confirming $SITE_UNIT's cgroup before swap ..."
pre_cgroup=$(systemctl show "$SITE_UNIT" -p ControlGroup --value)
log "Current cgroup: ${pre_cgroup:-<not running>}"

# ── Pre-swap rehearsal (added after 2026-08-21 corrupt-artifact incident) ────
# A build that exits 0 can still be a broken artifact. Boot the incoming
# build on a scratch port and smoke it BEFORE touching the live process.
log "Rehearsing incoming build on scratch port 3100 ..."
REHEARSAL_PORT=3100
NEXT_DIST_DIR=.next-incoming PORT=$REHEARSAL_PORT \
  npx next start >/tmp/opencode/deploy-rehearsal.log 2>&1 &
REHEARSAL_PID=$!
trap 'kill -9 "$REHEARSAL_PID" 2>/dev/null || true' EXIT
REHEARSAL_OK=0
for i in $(seq 1 20); do
  sleep 1
  h=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    "http://127.0.0.1:${REHEARSAL_PORT}/api/healthz" || echo 000)
  p=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 \
    "http://127.0.0.1:${REHEARSAL_PORT}/" || echo 000)
  if [[ "$h" == "200" && "$p" == "200" ]]; then REHEARSAL_OK=1; break; fi
done
kill -9 "$REHEARSAL_PID" 2>/dev/null || true
wait "$REHEARSAL_PID" 2>/dev/null || true
trap - EXIT
if [[ "$REHEARSAL_OK" != "1" ]]; then
  log "FAIL: incoming build failed rehearsal (healthz/home not 200). Keeping live release untouched."
  log "Rehearsal log tail:"; tail -5 /tmp/opencode/deploy-rehearsal.log || true
  exit 1
fi
log "Rehearsal passed."

log "Stopping $SITE_UNIT, swapping .next-incoming → .next, starting ..."
sudo systemctl stop "$SITE_UNIT"
rm -rf .next-previous
if [[ -d .next ]]; then
  mv .next .next-previous
fi
mv .next-incoming .next
sudo systemctl start "$SITE_UNIT"

# Give the new process a moment to bind and become ready before verifying.
READY=0
for i in $(seq 1 15); do
  if curl -fsS -o /dev/null --max-time 2 http://127.0.0.1:3000/api/readyz; then
    READY=1
    break
  fi
  sleep 1
done

log "Verifying deployed state ..."
VERIFY_FAILED=0
if [[ "$READY" != "1" ]] || ! bash "$VERIFY_SCRIPT"; then
  VERIFY_FAILED=1
fi

if [[ "$VERIFY_FAILED" == "1" ]]; then
  log "FAIL: post-deploy verification failed - AUTO-ROLLING BACK to .next-previous."
  sudo systemctl stop "$SITE_UNIT"
  if [[ -d .next-previous ]]; then
    rm -rf .next-broken
    mv .next .next-broken
    mv .next-previous .next
    sudo systemctl start "$SITE_UNIT"
    for i in $(seq 1 15); do
      if curl -fsS -o /dev/null --max-time 2 http://127.0.0.1:3000/api/readyz; then break; fi
      sleep 1
    done
    log "ROLLBACK COMPLETE: previous release restored. Broken build kept at .next-broken for triage."
  else
    log "CRITICAL: no .next-previous available; system left on failed release. Manual intervention required."
  fi
  exit 1
fi

# ── Orphan hygiene (INF-4/TD-15) ─────────────────────────────────────────────
# Any next-server parented to init (PPID 1) is an unreaped leftover from an
# interrupted start/e2e webServer. It must never keep serving a dead build.
for opid in $(pgrep -f "next-server" || true); do
  if [[ "$(ps -o ppid= -p "$opid" 2>/dev/null | tr -d ' ')" == "1" ]]; then
    log "Reaping orphaned next-server PID $opid"
    kill -9 "$opid" 2>/dev/null || true
  fi
done

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
