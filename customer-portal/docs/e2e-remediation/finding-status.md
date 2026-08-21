# Finding Status

| ID | Sev | Status | Title |
| --- | --- | --- | --- |
| API-1 | P2 | OPEN | Four audit intake paths divergent guards |
| API-2 | P2 | OPEN | Analytics report surface auth verification |
| API-3 | P3 | OPEN | Error-shape inconsistency |
| API-4 | P2 | OPEN | Timeout matrix gaps (JWKS etc.) |
| API-5 | P3 | OPEN | Discovery surface alignment |
| CI-1 | P2 | OPEN | npm audit advisory-only; 2 high open |
| CI-2 | P2 | OPEN | Dead duplicate workflow files |
| CI-3 | P2 | OPEN | Coverage thresholds zero |
| CI-4 | P1 | OPEN | Root pytest suite + browser suites not in CI |
| CI-5 | P2 | OPEN | Deploy: migration step absent; no auto rollback path |
| CI-7 | P2 | OPEN | No deploy integration rehearsal |
| CODE-1 | P2 | OPEN | falsy-zero amount fallbacks |
| CODE-10 | P3 | OPEN | Positive finding unlock tokens (verify/close) |
| CODE-11 | P3 | OPEN | Swallowed exceptions hygiene |
| CODE-2 | P2 | OPEN | Subscription dropped when email unresolvable |
| CODE-3 | P2 | OPEN | CRM interested->cold downgrade contradiction |
| CODE-4 | P2 | OPEN | Session hash re-EXPIRE extends all sessions |
| CODE-5 | P3 | OPEN | Newsletter resubscribe resets suppression verify |
| CODE-6 | P3 | OPEN | Follow-up aging selector unbounded |
| CODE-7 | P3 | OPEN | Dead/duplicated code paths |
| CODE-8 | P2 | OPEN | Offer copy hardcoded vs 2027 rollover |
| CODE-9 | P3 | OPEN | Proxy coarse guard (verify adequate) |
| DATA-1 | P1 | OPEN | Dual-writer drift subscriptions; dead duplicate tables |
| DATA-2 | P1 | OPEN | No migration tracking/runner (FM-11) |
| DATA-3 | P2 | OPEN | Schema integrity gaps (naive ts, unconstrained enums) |
| DATA-4 | P1 | OPEN | Hardcoded fallback DSNs across modules |
| DATA-5 | P2 | OPEN | Side-effect coupling in update_audit; outbox dedup scope |
| DATA-6 | P2 | OPEN | Admission control unwired; pending ages to failed |
| DATA-7 | P2 | OPEN | Unbounded ledger queries growth curve |
| DATA-8 | P2 | OPEN | Naive datetime usage |
| DEP-1 | P2 | OPEN | ajv/fast-uri high vulns (fixable) |
| DEP-2 | P2 | OPEN | postcss moderate via next |
| DOC-1 | P2 | OPEN | CLAUDE.md :8765 claim normalizes stray server |
| DOC-2 | P2 | OPEN | CONTEXT.md hides public api.* ingress |
| DOC-3 | P2 | OPEN | platform-api unit docs URL .shop stale |
| DOC-4 | P2 | OPEN | CONTEXT.md workspace localStorage gate stale |
| DOC-5 | P2 | OPEN | CONTEXT.md change log stale by omission |
| DOC-6 | P2 | OPEN | deploy README superseded partially |
| DOC-7 | P2 | OPEN | CLAUDE.md understates secret spread |
| DOC-8 | P2 | OPEN | architecture doc missing public ingress/LAN PG |
| DOC-9 | P2 | OPEN | No rate-limit fail-mode operator doc |
| FE-1 | P3 | OPEN | Boundary hygiene verify |
| FE-2 | P3 | OPEN | Hydration risk review (no defect found -> verify) |
| FE-3 | P3 | OPEN | Workspace chunking verify |
| FE-4 | P3 | OPEN | A11y specs not in CI (overlaps TEST-2) |
| FE-5 | P2 | OPEN | 449 unreachable HTML files shipped |
| FE-6 | P3 | OPEN | Third-party consent verify |
| INF-1 | P2 | OPEN | PG posture: LAN listen, pool budget, slow-log off |
| INF-2 | P2 | OPEN | Redis unbounded, TTL-less state keys |
| INF-3 | P2 | OPEN | systemd asymmetries nextjs uncapped/repo-wide rw |
| INF-4 | P2 | OPEN | Orphan processes on prod host |
| INF-5 | P2 | OPEN | Tunnel blast radius/root user/catch-all |
| INF-6 | P2 | OPEN | Backup restore drill unevidenced |
| INF-8 | P2 | OPEN | Logging consolidation + slow-query visibility |
| PERF-1 | P2 | OPEN | HTML payload weight investigation |
| PERF-2 | P3 | OPEN | Cache semantics verified positive (close as NOT_A_FINDING if holds) |
| PERF-3 | P2 | OPEN | Ledger query time bounds |
| PERF-4 | P2 | OPEN | 0.25s poll amplification vs heartbeat |
| RES-1 | P1 | OPEN | No timeout checkout->Stripe; webhook pre-ack chain |
| RES-2 | P1 | OPEN | Outbox at-least-once w/o idempotency; sent-blocks-resend dedup |
| RES-3 | P2 | OPEN | Connection budget > max_connections; per-request pools |
| RES-4 | P2 | OPEN | Heartbeat/sweeper event-loop contention with pollers |
| RES-5 | P2 | OPEN | Fire-and-forget result email lost on crash |
| RES-6 | P2 | OPEN | Prod readiness gate inert; no startup validation |
| SEC-P0-1 | P0 | OPEN | Public FastAPI surface lacks classification/authn/authz |
| SEC-P0-2 | P0 | OPEN | Secret/host exposure (repo http.server, world-readable drop-ins) |
| SEC-P1-1 | P1 | OPEN | Rate-limit identity from client headers |
| SEC-P1-2 | P1 | OPEN | JWT verify ignores session store; login re-TTL all sessions |
| SEC-P1-3 | P1 | OPEN | GSC refresh tokens plaintext |
| SEC-P1-4 | P1 | OPEN | Secrets hardcoded / sourced outside env contract |
| SEC-P2-1 | P2 | OPEN | PG trust auth + LAN listener + superuser app role |
| SEC-P2-2 | P2 | OPEN | Chunked body-limit bypass FastAPI |
| SEC-P2-3 | P2 | OPEN | SSRF gap signal_verifier; JWKS timeout |
| SEC-P2-4 | P2 | OPEN | Unauth GA4 forwarder, no rate limit/timeout |
| TD-1 | P2 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-10 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-11 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-12 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-13 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-14 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-15 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-16 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-2 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-3 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-4 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-5 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-6 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-7 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-8 | P2 | OPEN | Technical debt item (see technical-debt-register.md) |
| TD-9 | P3 | OPEN | Technical debt item (see technical-debt-register.md) |
| TEST-1 | P1 | OPEN | Queue/outbox/locking only mocked |
