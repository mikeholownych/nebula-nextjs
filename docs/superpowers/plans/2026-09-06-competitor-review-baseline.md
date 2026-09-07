# Competitor review gaps baseline

Date: 2026-09-06
Repository: `/home/mike/nebula`
Branch: `feat/project-scoped-google-integrations`
Repository HEAD at baseline: `77f38a39329d6626b411a11ee51c55108bb9ec36`
Production revision: `77f38a39329d6626b411a11ee51c55108bb9ec36`

## Verification plan

For subsequent implementation slices, run focused tests, typecheck, lint, build, and live HTTP checks for `/`, `/audit`, and every changed route. Check the relevant systemd journals after any authorized deployment.

## Live route baseline

Measured with `curl` on 2026-09-06:

| Route | Status |
|---|---:|
| `/` | 200 |
| `/audit` | 200 |
| `/pricing` | 200 |
| `/repair-sprint` | 200 |
| `/ai-info` | 200 |
| `/research/landing-page-performance-q3-2026` | 200 |
| `/.well-known/mcp/server-card.json` | 200 |
| `/mcp` | 404, expected because the endpoint is on the MCP subdomain |
| `/llms.txt` | 200 |

MCP server-card advertises:

`https://mcp.nebulacomponents.com/mcp`

The server card lists `run_audit`, `compare_audits`, `get_audit`, and `recent_audits`. Authentication is currently declared as not required by the card. This must be verified against the running endpoint before publishing stronger integration copy.

## Repository state

The worktree contains unrelated active changes in the local blog pipeline, generated reports, ledgers, and backlink tooling. Those files are not part of this implementation baseline and must not be staged opportunistically.

Already present and requiring verification rather than duplication:

- `scripts/cron_competitor_audit.py`
- `tests/test_competitor_analytics.py`
- `mcp_server.py`
- `customer-portal/components/WebMCP.tsx`
- `customer-portal/public/.well-known/mcp/server-card.json`
- `customer-portal/public/llms.txt`
- `docs/superpowers/plans/2026-08-24-paid-analytics.md`
- `customer-portal/app/audit/[id]/results/ResultsClient.tsx`
- `customer-portal/app/pricing/page.tsx`
- `customer-portal/app/repair-sprint/page.tsx`
- `customer-portal/app/research/landing-page-performance-q3-2026/page.tsx`

## Evidence boundaries

- The frozen dataset contains 293 completed audits and is descriptive only.
- No attributable paid-client intervention and re-audit record currently supports a quantified case study.
- The proposed 23% form-submit lift is not an established Nebula outcome and is excluded from implementation.
- Existing 9-signal coverage includes `above_fold` and `ad_signals`; signal expansion remains gate-bound.
- Softrankings is excluded from active backlink work because the listing cannot be updated from Mike's side after repeated contact attempts.

## Verification completed after baseline

- MCP initialize request: HTTP 200; protocol `2025-06-18`; server `Nebula Audit Engine` version `1.29.0`; streamable HTTP response.
- Competitor analytics tests: `5 passed in 55.92s` using `/home/mike/nebula/venv/bin/python`.
- Live `competitor_tracking` table: present with 3 rows and columns `id`, `user_id`, `competitor_url`, `label`, `last_score`, `last_audited_at`, `created_at`, and `project_domain`.
- No real competitor re-audit was triggered during this verification because that would create external audit records and was not required to prove the schema and contract.

## Current blockers

- The MCP server card still declares authentication as not required; confirm this is intentional before publishing stronger integration copy.
- The public benchmark route needs governance review before any expansion beyond the frozen research page.
- The current worktree contains unrelated modifications and untracked artifacts; no broad staging is permitted.
