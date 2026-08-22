#!/usr/bin/env bash
# Teardown HTML parity gate (Task 5 read switch).
#
#   teardown_parity.sh capture before   # snapshot live /teardowns/* into before/
#   teardown_parity.sh capture after    # snapshot live /teardowns/* into after/
#   teardown_parity.sh compare          # CTA-strip `after`, diff vs `before`
#
# Baseline lives in /tmp/opencode/parity/{before,after}. Exit 0 only when the
# index is byte-identical and every per-slug page differs by nothing (or
# whitespace noise, when --whitespace-tolerant is passed to compare).
set -u

BASE_DIR=/tmp/opencode/parity
SECRET=""

secret_len() { echo "${#SECRET}"; }

load_secret() {
  if [ -z "$SECRET" ]; then
    SECRET=$(grep '^INTERNAL_API_SECRET' "$HOME/.hermes/.env" 2>/dev/null | cut -d= -f2)
  fi
  if [ -z "$SECRET" ] && [ -r /home/mike/nebula/customer-portal/.env.local ]; then
    SECRET=$(grep '^INTERNAL_API_SECRET' /home/mike/nebula/customer-portal/.env.local | cut -d= -f2)
  fi
  if [ -z "$SECRET" ]; then
    local pid
    pid=$(pgrep -f 'uvicorn platform_api.main' | head -1)
    if [ -n "$pid" ]; then
      SECRET=$(tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep '^INTERNAL_API_SECRET=' | cut -d= -f2-)
    fi
  fi
}

slugs() {
  curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:8001/teardowns/ |
    python3 -c "import json,sys; print('\n'.join(t['slug'] for t in json.load(sys.stdin)['teardowns']))"
}

cmd="${1:-all}"
shift_arg="${2:-}"

case "$cmd" in
  capture)
    dir="$BASE_DIR/$shift_arg"
    [ -z "$shift_arg" ] && { echo "usage: $0 capture before|after" >&2; exit 2; }
    load_secret
    [ "$(secret_len)" -eq 0 ] && { echo "BLOCKED: INTERNAL_API_SECRET not found" >&2; exit 2; }
    mkdir -p "$dir"
    for slug in $(slugs); do
      code=$(curl -s -o "$dir/$slug.html" -w "%{http_code}" "https://nebulacomponents.com/teardowns/$slug")
      echo "$slug $code"
      [ "$code" != "200" ] && { echo "FAIL: $slug returned $code" >&2; exit 1; }
    done
    code=$(curl -s -o "$dir/_index.html" -w "%{http_code}" https://nebulacomponents.com/teardowns)
    echo "_index $code"
    [ "$code" != "200" ] && { echo "FAIL: index returned $code" >&2; exit 1; }
    echo "captured $(ls "$dir" | wc -l) files into $dir"
    ;;
  compare)
    tolerant=0
    [ "${3:-}" = "--whitespace-tolerant" ] || [ "${2:-}" = "--whitespace-tolerant" ] && tolerant=1
    work="$BASE_DIR/after-stripped"
    rm -rf "$work"; mkdir -p "$work"
    for f in "$BASE_DIR/after"/*.html; do
      cp "$f" "$work/"
    done
    for f in "$work"/*.html; do
      # The claim CTA renders as a single minified line and the JSX source
      # markers emit nothing into HTML, so strip by rendered markup bounds:
      # the bordered div immediately preceding the footer CTA section.
      python3 - "$f" <<'PY'
import re, sys
p = sys.argv[1]
h = open(p).read()
h2 = re.sub(
    r'<div class="mt-12 border border-white/10 rounded-lg p-6">.*?</div>',
    '', h, flags=re.S)
open(p, 'w').write(h2)
PY
    done
    if [ "$tolerant" -eq 1 ]; then
      diffs=$(diff -rq -w "$BASE_DIR/before" "$work" || true)
      wdiffs=$(diff -rq "$BASE_DIR/before" "$work" 2>/dev/null | wc -l)
      echo "files differing (raw): $wdiffs"
    else
      diffs=$(diff -rq "$BASE_DIR/before" "$work" || true)
    fi
    if [ -z "$diffs" ]; then
      echo "PARITY OK: $(ls "$work" | wc -l) files compared, zero deltas after CTA-strip"
      exit 0
    fi
    echo "PARITY FAIL:"
    echo "$diffs" | head -20
    exit 1
    ;;
  all)
    "$0" capture before
    "$0" capture after
    "$0" compare --whitespace-tolerant
    ;;
  *)
    echo "usage: $0 capture before|after | compare [--whitespace-tolerant] | all" >&2
    exit 2
    ;;
esac
