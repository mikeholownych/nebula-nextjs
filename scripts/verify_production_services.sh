#!/usr/bin/env bash
set -euo pipefail

SITE_UNIT=nebula-nextjs.service
TUNNEL_UNIT=cloudflared-tunnel.service
PUBLIC_URL=https://nebulacomponents.com/
LOCAL_URL=http://127.0.0.1:3000/
READYZ_URL=http://127.0.0.1:3000/api/readyz
API_HEALTHZ_URL=http://127.0.0.1:8001/healthz

assert_state() {
  local unit=$1 expected_enabled=$2 expected_active=$3
  local enabled active
  enabled=$(systemctl is-enabled "$unit" 2>/dev/null || true)
  for i in $(seq 1 10); do
    active=$(systemctl is-active "$unit" 2>/dev/null || true)
    [[ "$active" == "$expected_active" ]] && break
    sleep 1
  done
  [[ "$enabled" == "$expected_enabled" ]] || {
    printf 'FAIL: %s enabled=%s expected=%s\n' "$unit" "$enabled" "$expected_enabled" >&2
    exit 1
  }
  [[ "$active" == "$expected_active" ]] || {
    printf 'FAIL: %s active=%s expected=%s\n' "$unit" "$active" "$expected_active" >&2
    exit 1
  }
  printf 'PASS: %s enabled=%s active=%s\n' "$unit" "$enabled" "$active"
}

assert_state "$SITE_UNIT" enabled active
assert_state "$TUNNEL_UNIT" enabled active
assert_state nebula-site.service disabled inactive
assert_state nebula-cloudflared.service disabled inactive

site_pid=$(systemctl show "$SITE_UNIT" -p MainPID --value)
site_cgroup=$(systemctl show "$SITE_UNIT" -p ControlGroup --value)
[[ -n "$site_pid" && "$site_pid" != 0 ]] || { echo 'FAIL: site unit has no MainPID' >&2; exit 1; }

listener_pid=$(ss -ltnp 'sport = :3000' | sed -n '2s/.*pid=\([0-9][0-9]*\).*/\1/p')
[[ -n "$listener_pid" ]] || { echo 'FAIL: port 3000 has no identifiable listener PID' >&2; exit 1; }
listener_cgroup=$(sed -n 's#^0::##p' "/proc/$listener_pid/cgroup")
site_cgroup_rel="${site_cgroup#/}"
listener_cgroup_rel="${listener_cgroup#/}"
[[ "$listener_cgroup_rel" == "$site_cgroup_rel" ]] || {
  printf 'FAIL: port 3000 listener PID %s is in %s, expected %s\n' "$listener_pid" "$listener_cgroup_rel" "$site_cgroup_rel" >&2
  exit 1
}
printf 'PASS: port 3000 listener PID %s belongs to %s\n' "$listener_pid" "$SITE_UNIT"

cloudflared_count=$(pgrep -xc cloudflared || true)
[[ "$cloudflared_count" == 1 ]] || {
  printf 'FAIL: expected one cloudflared process, found %s\n' "$cloudflared_count" >&2
  exit 1
}
echo 'PASS: exactly one cloudflared process'

code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 "$READYZ_URL")
[[ "$code" == 200 ]] || { printf 'FAIL: %s returned %s\n' "$READYZ_URL" "$code" >&2; exit 1; }
printf 'PASS: %s returned HTTP 200\n' "$READYZ_URL"

for target in "$LOCAL_URL" "$PUBLIC_URL"; do
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 "$target")
  [[ "$code" == 200 ]] || { printf 'FAIL: %s returned %s\n' "$target" "$code" >&2; exit 1; }
  printf 'PASS: %s returned HTTP 200\n' "$target"
done

# Verify stylesheet assets resolve on origin and edge
for target in "$LOCAL_URL" "$PUBLIC_URL"; do
  html=$(curl -fsS --max-time 15 "$target")
  css_path=$(printf '%s' "$html" | grep -oE 'href="/_next/static/chunks/[a-zA-Z0-9._-]*\.css"' | head -1 | sed -E 's/href="(.*)"/\1/')
  [[ -n "$css_path" ]] || { printf 'FAIL: %s has no /_next/static/*.css stylesheet link in its HTML\n' "$target" >&2; exit 1; }
  origin="${target%/}"
  asset_url="${origin%/*}"
  [[ "$target" == "$LOCAL_URL" ]] && asset_url="http://127.0.0.1:3000"
  [[ "$target" == "$PUBLIC_URL" ]] && asset_url="https://nebulacomponents.com"
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 "${asset_url}${css_path}")
  [[ "$code" == 200 ]] || { printf 'FAIL: stylesheet %s%s returned %s (page HTML was 200 - stale build/process mismatch)\n' "$asset_url" "$css_path" "$code" >&2; exit 1; }
  printf 'PASS: %s stylesheet %s returned HTTP 200\n' "$target" "$css_path"
done

# Verify build-info SHA assertion against repository HEAD on BOTH Origin and Edge
# Also require FastAPI /healthz.revision to match Next /api/build-info.revision.
# Do not stamp systemd from this check.
expected_sha=$(git -C /home/mike/nebula/customer-portal rev-parse HEAD 2>/dev/null || true)
origin_sha=$(curl -fsS --max-time 5 http://127.0.0.1:3000/api/build-info | grep -oE '"revision":"[^"]+"' | cut -d'"' -f4 || true)
api_sha=$(curl -fsS --max-time 5 "$API_HEALTHZ_URL" | grep -oE '"revision":"[^"]+"' | cut -d'"' -f4 || true)
[[ -n "$origin_sha" && "$origin_sha" == "$api_sha" ]] || {
  printf 'FAIL: Next /api/build-info revision %s does not match FastAPI /healthz revision %s\n' "${origin_sha:-<none>}" "${api_sha:-<none>}" >&2
  exit 1
}
printf 'PASS: Next /api/build-info and FastAPI /healthz revisions match (%s)\n' "$origin_sha"

if [[ -n "$expected_sha" && "$expected_sha" =~ ^[a-f0-9]{40}$ ]]; then
  [[ "$origin_sha" == "$expected_sha" ]] || {
    printf 'FAIL: origin SHA %s does not match repository HEAD %s\n' "${origin_sha:-<none>}" "$expected_sha" >&2
    exit 1
  }
  printf 'PASS: origin SHA %s matches repository HEAD\n' "$origin_sha"

  # Public edge check across user agents
  for agent in 'Mozilla/5.0' 'Googlebot' 'bingbot' 'curl/8.0'; do
    edge_sha=$(curl -fsS -A "$agent" -H 'Cache-Control: no-cache' --max-time 10 "https://nebulacomponents.com/api/build-info" | grep -oE '"revision":"[a-f0-9]{40}"' | cut -d'"' -f4 || true)
    [[ "$edge_sha" == "$expected_sha" ]] || {
      printf 'FAIL: public edge SHA %s for UA "%s" does not match expected SHA %s\n' "${edge_sha:-<none>}" "$agent" "$expected_sha" >&2
      exit 1
    }
  done
  printf 'PASS: public edge SHA %s matches repository HEAD across User-Agent profiles\n' "$expected_sha"
fi

# Verify Edge Content Marker Assertions
concepts_html=$(curl -fsS -H 'Cache-Control: no-cache' https://nebulacomponents.com/concepts || true)
if grep -Eq '40.?60%|90% of landing page problems' <<< "$concepts_html"; then
  printf 'FAIL: stale or prohibited copy detected on public /concepts\n' >&2
  exit 1
fi
printf 'PASS: public /concepts verified free of prohibited claims\n'

audit_html=$(curl -fsS -H 'Cache-Control: no-cache' https://nebulacomponents.com/audit || true)
if ! grep -Fq 'Audit Data Handling' <<< "$audit_html"; then
  printf 'FAIL: Audit Data Handling section missing from public /audit\n' >&2
  exit 1
fi
printf 'PASS: public /audit verified containing inspection boundaries disclosure\n'

# Verify Learning Centre Copy Governance (prohibit legacy dogmatic phrasing)
lc_html=$(curl -fsS -H 'Cache-Control: no-cache' https://nebulacomponents.com/learning-centre/landing-page-not-converting || true)
if grep -Eq 'at least one of five diagnosable leak patterns|strongly indicates' <<< "$lc_html"; then
  printf 'FAIL: dogmatic diagnostic claims detected on public learning-centre page\n' >&2
  exit 1
fi
printf 'PASS: public Learning Centre verified compliant with content governance\n'

# Verify AI Search & Generative Citation Stack
bash /home/mike/nebula/scripts/verify_ai_citation_stack.sh

# Trigger IndexNow URL submission on public edge post-deploy
python3 /home/mike/nebula/scripts/submit_indexnow.py || true

