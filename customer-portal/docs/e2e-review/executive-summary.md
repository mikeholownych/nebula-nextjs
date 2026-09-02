# Executive Summary — End-to-End Review

Date: 2026-08-21 · Scope: full Nebula stack (Next.js portal, FastAPI platform API, Postgres ×2 DBs, Redis, systemd, Cloudflare Tunnel, CI, tests, docs) · Mode: review-only, zero changes to code/infra/data (documentation artifacts excepted).

## Verdict

**CRITICAL REMEDIATION REQUIRED.** The product journey works and much of the system shows genuine engineering care (HMAC unlock tokens, advisory-locked fulfillment, append-only ledger with dedup, atomic blue-green deploys). However, two confirmed P0 exposures and a cluster of P1 integrity/resilience gaps mean the system is not defensibly production-hardened.

## Counts

| Severity | Count |
| --- | --- |
| P0 | 2 |
| P1 | 9 |
| P2 | 18 |
| P3 | 8 |

## The two P0s

1. **SEC-P0-1 — FastAPI exposed publicly with unauthenticated business endpoints.** Cloudflare Tunnel routes `api.nebulacomponents.com` (and `nebula-api.f489709.workers.dev`) directly to uvicorn :8001, bypassing the Next BFF. Verified live: `/api/crm/funnel`, `/api/crm/sources` return real CRM data; `/audit/by-email?email=…` enumerates any email's audits; `/docs` + `/openapi.json` publish the full API surface; `/dispatch/run-all`, `/verify/deploy-hook`, `/leads/decay-all`, `/audit/monitors/run-due` are publicly triggerable jobs. Root cause: the FastAPI auth model assumes loopback-only deployment ("No auth required - email is the identity for now", `routes/audit_api.py:357`), which the tunnel ingress silently violates.
2. **SEC-P0-2 — Repo root served over HTTP with secrets readable.** A stray `python3 -m http.server 8765` (no systemd unit, cwd `/home/mike/nebula`, bound `0.0.0.0:8765`) serves directory listings and file contents: `GET /.env` → 200 (contains live Stripe/OAuth secrets), `GET /secrets/` → 200 listing, `GET /HOT_LEAD.json` → 200. Additionally, the live Stripe secret key sits world-readable (0644) in `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf`.

## Highest-risk subsystem

The **Cloudflare ingress ↔ FastAPI trust boundary**: every downstream control (rate limiting identity, authorization, body limits) was designed assuming "localhost = trusted", and the tunnel breaks that assumption in one config line.

## Most likely production incident (next 90 days)

A third party discovers `api.nebulacomponents.com/docs`, enumerates competitor/lead data via `/audit/by-email` and `/api/crm/*`, or triggers `/dispatch/run-all` causing a mass unsolicited email event and provider reputation damage.

## Most important test gap

No test asserts that business endpoints reject unauthenticated requests at their **public** URL. Existing suites test handlers in isolation against an assumed loopback topology; CI has no environment-representation test (`tests/platform_api` only; repo-root suite of 88 files not wired into CI).

## Most important infrastructure gap

Migrations have no tracking table or runner (three coexisting mechanisms: alembic, two raw-SQL dirs applied by hand per deploy-script operator instructions) — deploy correctness currently depends on tribal memory.

## What can still fail, why, and in what order

See `failure-mode-analysis.md` (12 subsystem failure tables), `master-findings-register.md` (37 findings with evidence), and `remediation-sequencing.md` (Wave 0 containment of the two P0s → Wave 1 authority/auth corrections → Wave 2 resilience bounds → Wave 3 data integrity → Wave 4 ops/deploy → Wave 5 performance → Wave 6 test repair → Wave 7 cleanup).

## No-change guarantee (confirmed)

Application code modified: NO · Infrastructure modified: NO · Production data modified: NO · Migrations applied: NO · Services restarted: NO · Secrets rotated: NO · CI modified: NO · Files deleted: NO. Only files under `customer-portal/docs/e2e-review/` were created.
