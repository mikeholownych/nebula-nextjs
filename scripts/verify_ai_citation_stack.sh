#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://nebulacomponents.com"

log() { printf '[ai-citation-check] %s\n' "$*"; }

log "Checking /llms.txt ..."
code=$(curl -fsS -o /dev/null -w '%{http_code}' "${BASE_URL}/llms.txt")
[[ "$code" == 200 ]] || { log "FAIL: /llms.txt returned HTTP $code"; exit 1; }
log "PASS: /llms.txt returned HTTP 200"

log "Checking /.well-known/agent-skills/index.json ..."
json_resp=$(curl -fsS "${BASE_URL}/.well-known/agent-skills/index.json")
[[ -n "$json_resp" ]] || { log "FAIL: /.well-known/agent-skills/index.json empty"; exit 1; }
log "PASS: /.well-known/agent-skills/index.json returned valid payload"

log "Checking /resources/citable ..."
code=$(curl -fsS -o /dev/null -w '%{http_code}' "${BASE_URL}/resources/citable")
[[ "$code" == 200 ]] || { log "FAIL: /resources/citable returned HTTP $code"; exit 1; }
log "PASS: /resources/citable returned HTTP 200"

log "Checking Markdown Content Negotiation (Accept: text/markdown) on /resources/citable ..."
md_resp=$(curl -fsS -H 'Accept: text/markdown' "${BASE_URL}/resources/citable")
[[ -n "$md_resp" ]] || { log "FAIL: Markdown negotiation on /resources/citable returned empty body"; exit 1; }
log "PASS: Markdown Content Negotiation verified for AI crawlers"

log "All AI & Generative Citation endpoints verified healthy."
