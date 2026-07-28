#!/usr/bin/env bash
set -euo pipefail

SITE_UNIT=nebula-nextjs.service
TUNNEL_UNIT=cloudflared-tunnel.service
PUBLIC_URL=https://nebulacomponents.shop/
LOCAL_URL=http://127.0.0.1:3000/

assert_state() {
  local unit=$1 expected_enabled=$2 expected_active=$3
  local enabled active
  enabled=$(systemctl is-enabled "$unit" 2>/dev/null || true)
  active=$(systemctl is-active "$unit" 2>/dev/null || true)
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

for target in "$LOCAL_URL" "$PUBLIC_URL"; do
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 "$target")
  [[ "$code" == 200 ]] || { printf 'FAIL: %s returned %s\n' "$target" "$code" >&2; exit 1; }
  printf 'PASS: %s returned HTTP 200\n' "$target"
done

# A 200 on the page itself does not mean its assets loaded — the 2026-07-26
# incident (running server process serving a stale build's HTML, which still
# referenced a since-deleted static chunk hash) had every page return 200
# while every linked stylesheet 500'd or 404'd. Confirm the homepage's own
# stylesheet link actually resolves, on both the local origin and the public
# edge, so that specific failure mode can't hide behind a healthy page-level check again.
for target in "$LOCAL_URL" "$PUBLIC_URL"; do
  html=$(curl -fsS --max-time 15 "$target")
  css_path=$(printf '%s' "$html" | grep -oE 'href="/_next/static/chunks/[a-zA-Z0-9._-]*\.css"' | head -1 | sed -E 's/href="(.*)"/\1/')
  [[ -n "$css_path" ]] || { printf 'FAIL: %s has no /_next/static/*.css stylesheet link in its HTML\n' "$target" >&2; exit 1; }
  origin="${target%/}"
  asset_url="${origin%/*}"  # strip trailing path, keep scheme+host
  [[ "$target" == "$LOCAL_URL" ]] && asset_url="http://127.0.0.1:3000"
  [[ "$target" == "$PUBLIC_URL" ]] && asset_url="https://nebulacomponents.shop"
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 "${asset_url}${css_path}")
  [[ "$code" == 200 ]] || { printf 'FAIL: stylesheet %s%s returned %s (page HTML was 200 — stale build/process mismatch)\n' "$asset_url" "$css_path" "$code" >&2; exit 1; }
  printf 'PASS: %s stylesheet %s returned HTTP 200\n' "$target" "$css_path"
done

# Verify deployed build revision matches repository HEAD
expected_sha=$(git -C /home/mike/nebula/customer-portal rev-parse HEAD 2>/dev/null || true)
if [[ -n "$expected_sha" && "$expected_sha" =~ ^[a-f0-9]{40}$ ]]; then
  deployed_sha=$(curl -fsS --max-time 5 http://127.0.0.1:3000/api/build-info | grep -oE '"revision":"[a-f0-9]{40}"' | cut -d'"' -f4 || true)
  [[ "$deployed_sha" == "$expected_sha" ]] || {
    printf 'FAIL: deployed SHA %s does not match repository HEAD %s\n' "${deployed_sha:-<none>}" "$expected_sha" >&2
    exit 1
  }
  printf 'PASS: deployed SHA %s matches repository HEAD\n' "$deployed_sha"
fi
