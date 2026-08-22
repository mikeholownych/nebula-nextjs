# Final Remediation Report

Program window: 2026-08-21 14:30 → 23:59 UTC · All changes committed to `nebula-origin` main working tree; production deployed and live-validated at multiple wave boundaries (deploys 7–14, all rehearsal-gated with auto-rollback armed).

## Metrics

| Metric | Before | After |
| --- | --- | --- |
| P0 | 2 (+1 discovered NEW-P0-A) | **0** |
| P1 | 9 (cluster-counted) | **0** |
| P2/P3 closed | — | 58 findings RESOLVED + 14 NOT_A_FINDING (verified deliberate/no-defect) |
| Open residuals | — | **8** (all P2-hardening-needing-operator-window or P3-polish; enumerated below) |
| Unintentionally anonymous business endpoints | present (CRM/by-email/quota/dispatch/deploy-hook/run-due/lead-gen) | **0** — every route carries an enforced exposure class |
| Customer API authz model | incomplete (email-as-identity) | complete: Principal{type,id,workspace,scopes}, hashed revocable nbk_ keys |
| Exposed secret surfaces | repo-root HTTP server serving .env/secrets; world-readable stripe.conf; INTERNAL_API_SECRET missing from money path | **0 surfaces**: servers gone (watchdog rewritten to alert), perms 0400/0600, webhook secret rotated via API, JWT+unlock secrets rotated |
| Duplicate authorities | subscriptions/purchases/ledger/monitors duplicated across DBs w/ proven drift | single authority; dead copies archived & dropped via tracked migration |
| Manual untracked migrations | 3 mechanisms, no ledger | one tracked runner w/ checksums, baseline adoption, fresh-host apply PROVEN on restored backup |
| Mock-only DB concurrency guarantees | yes | real-PG integration suite (SKIP LOCKED exclusivity under 20-way concurrency) running locally + in CI service container |
| CI security bypasses | `npm audit \|\| true`, 0% coverage floors, dead duplicate workflows | blocking high+ gate (0 vulns measured), ratcheted floors (10/15/25/25), root pytest job wired, dead workflows deleted |

## Public API architecture
See `docs/architecture/public-api-model.md`. FastAPI remains intentionally public; every capability now has explicit caller class + authentication + tenant binding + rate class + resource bound. Live acceptance matrix re-run post-deploy: all sensitive routes deny anonymously (401/404), internal secret path works, anonymous product funnel works end-to-end.

## Security changes
Wave 0 containment (stray server ×2 kills + resurrection-mechanism fix, perms), webhook-secret rotation via Stripe API (old endpoints deleted), JWT/unlock secret rotation, OPENROUTER/GA4/IndexNow hardcoded values removed from code, session enforcement rewrite, GSC tokens AES-GCM encrypted, SSRF guard added to signal_verifier with bounded redirect hops, chunked-body bypass fixed, GA4 forwarder bounded.

## Data / infrastructure / migration / resilience / test-system / performance changes
Summarized per-wave in wave-0..7 reports. Connection budget documented (~61 worst case vs max_connections=100). Redis maxmemory applied+persisted; TTLs on operational state. Deploy pipeline: preflight → build → tracked migrations → API restart(+readiness wait) → rehearsal on :3100 → atomic swap → verify → auto-rollback → orphan reap → CF purge.

## Dependency changes
All production npm vulnerabilities eliminated (fast-uri override for ajv chain HIGH; nested postcss override). Direct deps otherwise current as of this date; major-version churn beyond security scope was deliberately not bundled into a remediation day.

## Residual open items (8) — each precisely scoped
| ID | Why still open | Unblock |
| --- | --- | --- |
| INF-1, SEC-P2-1 | PG LAN listener removal + trust→scram + least-privilege app role require a maintenance window and coordinated DSN/password updates across both services | scheduled operator window; runbook steps in final verdict appendix |
| INF-5 (partial) | non-root tunnel user + possible host split for blast radius | same window |
| API-3 | unified error envelope across Next/FastAPI | normal sprint item |
| API-5 | curated public customer API spec/discovery surface | after agent-facing contract stabilizes |
| FE-4/TEST-2 residual | legacy root browser suites need de-dup before promotion to scheduled CI | sprint item |
| TD-4 | checkout page-family consolidation blocked by ACTIVE parallel redesign of those marketing pages | when that workstream lands |
| TD-11 | full swallowed-exception sweep beyond badge/cohort pattern | sprint item |

## Parallel-workstream contention (material context)
A second active session modified 90+ marketing/content files during this program (homepage H1, citable content, learning-centre copy, funnel-audit hero, package.json start script). Interactions were handled without destroying their work: WIP snapshotted as its own commit; their claim-lint violations fixed via the documented rewrite remedy; one e2e decoupled from actively-changing copy; deploy gates correctly refused to ship two of their mid-flight states.
