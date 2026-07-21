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
listener_pid=$(ss -ltnp 'sport = :3000' | sed -n '2s/.*pid=\([0-9][0-9]*\).*/\1/p')
listener_cgroup=$(sed -n 's#^0::##p' "/proc/$listener_pid/cgroup")
[[ -n "$site_pid" && "$site_pid" != 0 ]] || { echo 'FAIL: site unit has no MainPID' >&2; exit 1; }
[[ "$listener_cgroup" == "$site_cgroup" ]] || {
  printf 'FAIL: port 3000 listener PID %s is in %s, expected %s\n' "$listener_pid" "$listener_cgroup" "$site_cgroup" >&2
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
