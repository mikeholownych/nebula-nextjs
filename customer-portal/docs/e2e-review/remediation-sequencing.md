# Remediation Sequencing (plan only — do not execute from this document without review)

## Wave 0 — P0 containment (same day)
- Findings: SEC-P0-1, SEC-P0-2.
- Actions (direction): stop the repo-root HTTP servers; chmod 0400 systemd stripe drop-ins + root env files; remove `api.nebulacomponents.com` and workers.dev ingress to :8001 (or front with authn) ; set `ENVIRONMENT=production` for platform-api so docs/openapi close and the readiness gate arms.
- Dependencies: none. Blast radius: n8n helpers using api.* host must be re-pointed first (inventory consumers before cutting).
- Validation: external probes of api.* return 401/404/deny; `.env` unfetchable via 8765; docs UI gone; smoke suite green.
- Rollback: restore ingress line; restart cloudflared.

## Wave 1 — Correctness & authority
- Findings: DATA-1, DATA-4, SEC-P1-2, SEC-P1-3, SEC-P1-4, CODE-1/2/3.
- Single authority per fact; delete dead duplicate tables after reconciliation snapshot; config-only DSNs with fail-fast; session-store check in JWT verify; encrypt GSC tokens; explicit nullish amount handling; subscription persistence by customer id; CRM transition semantics decision.
- Validation: dual-write detector query runs clean 7 days; auth/logout matrix tests; unit tests for amount edge cases.

## Wave 2 — Resilience & resource bounds
- Findings: RES-1..RES-6, INF-1/2/3, SEC-P1-1, SEC-P2-2.
- Timeouts on all outbound calls incl. Stripe checkout + GA4; outbox idempotency keys + dedup scope fix; shared pool architecture with global connection budget ≤60% max_connections; Redis maxmemory+TTLs; rate-limit identity hardening; chunked-body-safe size middleware; MemoryMax on nextjs.
- Validation: chaos drills in staging (kill worker mid-send; exhaust pool); load test /audit/run waiters.

## Wave 3 — State/data integrity
- Findings: DATA-2/3/5/6, FM-11, RES-5 (move side effects into outbox), CODE-8 (offer constants).
- Migration runner adoption (alembic extended or dedicated tracker) + baseline stamp; timestamptz migration; enum CHECK constraints; wire admission control; requeue policy for audits; result-email via outbox.
- Validation: fresh-host provisioning rehearsal from backups; migration dry-run CI job.

## Wave 4 — Deployment/ops
- Findings: CI-5/6/7, INF-4/5/8, DOC-*.
- Migration step inside deploy script w/ rollback hook; orphan reaping post-swap; tunnel least-privilege (dedicated user, explicit hosts, drop catch-all); log destinations consolidated; slow-query log on; docs corrected (CLAUDE.md :8765 entry removed).
- Validation: two consecutive green deploys with revision coherence assertions; restore drill executed and documented.

## Wave 5 — Performance
- Findings: PERF-1/3/4.
- Only after field-data review (CrUX/RUM): HTML weight investigation, ledger time-bounds, push-based audit completion.
- Validation: Lighthouse lab budgets unchanged-or-better; no regression in p75 TTFB.

## Wave 6 — Test-system repair
- Findings: TEST-1..5, CI-1/3/4.
- Dockerized integration job for queue/outbox/fulfillment; promote critical-flow + contrast Playwright specs; ratchet coverage minimums; make npm-audit high+ blocking with suppressions; production-equivalent post-deploy probes generalized from D13 pattern.
- Validation: red/green proof for one injected locking bug caught by new integration job.

## Wave 7 — Cleanup
- Findings: TD-*, FE-5, API-1 consolidation, dead workflows/pages/.bak/.legacy removal, single test runner.
- Validation: sitemap/route checks green; grep gates clean; bundle-size budget unchanged.
