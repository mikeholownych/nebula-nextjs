# Finding Status

| ID | Sev | Status | Title |
| --- | --- | --- | --- |
| API-1 | P2 | RESOLVED | Shared principal/admission policy layer; intake wrappers delegate to one guard stack |
| API-2 | P2 | RESOLVED | Analytics report surface auth verification |
| API-3 | P3 | OPEN | Error-shape inconsistency |
| API-4 | P2 | RESOLVED | Timeout matrix gaps (JWKS etc.) |
| API-5 | P3 | OPEN | Discovery surface alignment |
| CI-1 | P2 | RESOLVED | npm audit advisory-only; 2 high open |
| CI-2 | P2 | RESOLVED | Dead duplicate workflow files |
| CI-3 | P2 | RESOLVED | Coverage thresholds zero |
| CI-4 | P1 | RESOLVED | Root pytest suite + browser suites not in CI |
| CI-5 | P2 | RESOLVED | Deploy: migration step absent; no auto rollback path |
| CI-7 | P2 | RESOLVED | No deploy integration rehearsal |
| CODE-1 | P2 | RESOLVED | falsy-zero amount fallbacks |
| CODE-10 | P3 | NOT_A_FINDING | Positive finding unlock tokens (verify/close) | Unlock-token design audited: HMAC+timing-safe+bounded cookies — sound |
| CODE-11 | P3 | RESOLVED | Swallowed exceptions hygiene |
| CODE-2 | P2 | RESOLVED | Subscription dropped when email unresolvable |
| CODE-3 | P2 | RESOLVED | CRM interested->cold downgrade contradiction |
| CODE-4 | P2 | RESOLVED | Session hash re-EXPIRE extends all sessions |
| CODE-5 | P3 | NOT_A_FINDING | Newsletter resubscribe resets suppression verify | verified safe: resubscribe forces re-confirm (double opt-in); provider-event suppression re-applies on bounce events |
| CODE-6 | P3 | RESOLVED | follow-up selector capped to 30-day aging window |
| CODE-7 | P3 | RESOLVED | Dead/duplicated code paths | dead limiter + .bak removed this wave; checkout-v2/impulse page-family removal tracked as deliberate-content decision by owner (marketing pages under active redesign) |
| CODE-8 | P2 | RESOLVED | Offer copy hardcoded vs 2027 rollover |
| CODE-9 | P3 | NOT_A_FINDING | Proxy coarse guard (verify adequate) | Proxy/UI guard layering verified consistent with per-route server checks |
| DATA-1 | P1 | RESOLVED | Dual-writer drift subscriptions; dead duplicate tables |
| DATA-2 | P1 | RESOLVED | No migration tracking/runner (FM-11) |
| DATA-3 | P2 | RESOLVED | Schema integrity gaps (naive ts, unconstrained enums) |
| DATA-4 | P1 | RESOLVED | Hardcoded fallback DSNs across modules |
| DATA-5 | P2 | RESOLVED | Side-effect coupling in update_audit; outbox dedup scope |
| DATA-6 | P2 | RESOLVED | Admission control unwired; pending ages to failed |
| DATA-7 | P2 | RESOLVED | Ledger queries: indexed access paths + 4.7k rows measured; growth curve documented in perf baseline |
| DATA-8 | P2 | RESOLVED | Naive datetime usage |
| DEP-1 | P2 | RESOLVED | ajv/fast-uri high vulns (fixable) |
| DEP-2 | P2 | RESOLVED | postcss moderate via next |
| DOC-1 | P2 | RESOLVED | CLAUDE.md :8765 claim normalizes stray server |
| DOC-2 | P2 | RESOLVED | CONTEXT.md hides public api.* ingress |
| DOC-3 | P2 | RESOLVED | platform-api unit docs URL .shop stale |
| DOC-4 | P2 | RESOLVED | CONTEXT.md workspace localStorage gate stale |
| DOC-5 | P2 | RESOLVED | CONTEXT.md change log stale by omission |
| DOC-6 | P2 | NOT_A_FINDING | deploy README superseded partially | deploy/systemd/README kept as rationale record; executable truth is scripts/deploy_customer_portal.sh |
| DOC-7 | P2 | RESOLVED | CLAUDE.md understates secret spread |
| DOC-8 | P2 | RESOLVED | architecture doc missing public ingress/LAN PG |
| DOC-9 | P2 | RESOLVED | No rate-limit fail-mode operator doc |
| FE-1 | P3 | NOT_A_FINDING | Boundary hygiene verify | RSC/Suspense boundary hygiene verified sound during Wave-0 deploy rehearsal |
| FE-2 | P3 | NOT_A_FINDING | Hydration risk review (no defect found -> verify) | hydration verified: suppressHydrationWarning scoped to consent attribute; Suspense boundaries isolate dynamic reads — no mismatch path found in review or deploy rehearsals |
| FE-3 | P3 | NOT_A_FINDING | Workspace chunking verify | workspace chunking verified adequate via route-segment splitting; no dynamic-import anti-patterns found |
| FE-4 | P3 | OPEN | A11y specs not in CI (overlaps TEST-2) |
| FE-5 | P2 | NOT_A_FINDING | 449 unreachable HTML files shipped | Same disposition as TD-7: intentional retention behind explicit legacy redirect map + .html blocker |
| FE-6 | P3 | NOT_A_FINDING | Third-party consent verify | consent verified: third parties load only via consent-gated AnalyticsRuntime; single init points; CSP allowlist matches |
| INF-1 | P2 | OPEN | PG posture: LAN listener + trust auth REMAIN (need maintenance window); slow-log enabled |
| INF-2 | P2 | RESOLVED | Redis unbounded, TTL-less state keys |
| INF-3 | P2 | RESOLVED | systemd asymmetries nextjs uncapped/repo-wide rw |
| INF-4 | P2 | RESOLVED | Orphan processes on prod host |
| INF-5 | P2 | OPEN | Catch-all now http_status:404; config/creds perms tightened; remaining: dedicated tunnel user + host split (operator window) |
| INF-6 | P2 | RESOLVED | Backup restore drill unevidenced |
| INF-8 | P2 | RESOLVED | Logging consolidation + slow-query visibility |
| NEW-P0-A | P0 | RESOLVED | INTERNAL_API_SECRET never provisioned: paid fulfillment enqueue would fail on first live purchase |
| PERF-1 | P2 | RESOLVED | HTML weight measured (150–170KB); Lighthouse lab budgets enforced in CI; field-data review recorded in perf baseline |
| PERF-2 | P3 | NOT_A_FINDING | Cache semantics verified positive (close as NOT_A_FINDING if holds) | Cache semantics verified correct end-to-end (s-maxage+SWR, CF purge in deploy, build-info no-store); incident class fixed pre-review |
| PERF-3 | P2 | RESOLVED | Ledger queries: indexed access paths + 4.7k rows measured; growth curve documented in perf baseline |
| PERF-4 | P2 | RESOLVED | 0.25s poll amplification vs heartbeat |
| RES-1 | P1 | RESOLVED | No timeout checkout->Stripe; webhook pre-ack chain |
| RES-2 | P1 | RESOLVED | Outbox at-least-once w/o idempotency; sent-blocks-resend dedup |
| RES-3 | P2 | RESOLVED | Connection budget > max_connections; per-request pools |
| RES-4 | P2 | RESOLVED | Heartbeat/sweeper event-loop contention with pollers |
| RES-5 | P2 | RESOLVED | Fire-and-forget result email lost on crash |
| RES-6 | P2 | RESOLVED | Prod readiness gate inert; no startup validation |
| SEC-P0-1 | P0 | RESOLVED | Public FastAPI surface lacks classification/authn/authz |
| SEC-P0-2 | P0 | RESOLVED | Secret/host exposure (repo http.server, world-readable drop-ins) |
| SEC-P1-1 | P1 | RESOLVED | Rate-limit identity from client headers |
| SEC-P1-2 | P1 | RESOLVED | JWT verify ignores session store; login re-TTL all sessions |
| SEC-P1-3 | P1 | RESOLVED | GSC refresh tokens plaintext |
| SEC-P1-4 | P1 | RESOLVED | Secrets hardcoded / sourced outside env contract |
| SEC-P2-1 | P2 | OPEN | pg_hba trust auth + superuser app role unchanged (scram migration needs operator window) |
| SEC-P2-2 | P2 | RESOLVED | Chunked body-limit bypass FastAPI |
| SEC-P2-3 | P2 | RESOLVED | SSRF gap signal_verifier; JWKS timeout |
| SEC-P2-4 | P2 | RESOLVED | Unauth GA4 forwarder, no rate limit/timeout |
| TD-1 | P2 | RESOLVED | Technical debt item (see technical-debt-register.md) |
| TD-10 | P3 | RESOLVED | Technical debt item (see technical-debt-register.md) |
| TD-11 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-12 | P3 | RESOLVED | audits timestamps migrated timestamptz; naive utcnow replaced with tz-aware now() |
| TD-13 | P3 | NOT_A_FINDING | Technical debt item (see technical-debt-register.md) | vitest scoped to Storybook tooling (@storybook/addon-vitest); jest owns app tests — documented |
| TD-14 | P3 | RESOLVED | Technical debt item (see technical-debt-register.md) |
| TD-15 | P3 | RESOLVED | Technical debt item (see technical-debt-register.md) |
| TD-16 | P3 | NOT_A_FINDING | Technical debt item (see technical-debt-register.md) | Single ts-ignore reviewed: acceptable scoped usage |
| TD-2 | P3 | RESOLVED | Technical debt item (see technical-debt-register.md) | legacy rate_limiter removed from module + package exports |
| TD-3 | P3 | NOT_A_FINDING | 410 checkout stub is a deliberate second-writer guard, not debt |
| TD-4 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-5 | P3 | RESOLVED | Technical debt item (see technical-debt-register.md) | .bak files deleted |
| TD-6 | P3 | RESOLVED | .legacy untracked from git (archive inventory retained on disk) |
| TD-7 | P3 | NOT_A_FINDING | Technical debt item (see technical-debt-register.md) | 449 static HTML retained deliberately for SEO/provenance per docs/architecture/ops-case-studies-html.md; proxy 404s unreachable paths |
| TD-8 | P2 | RESOLVED | Technical debt item (see technical-debt-register.md) |
| TD-9 | P3 | RESOLVED | Technical debt item (see technical-debt-register.md) |
| TEST-1 | P1 | RESOLVED | Queue/outbox locking now proven against real Postgres (tests/integration) + CI service container |
