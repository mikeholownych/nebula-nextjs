# Master Findings Register

| ID | Severity | Domain | Finding | Evidence (anchor) | Impact | Confidence | Remediation Class |
| -- | -------- | ------ | ------- | ------------------ | ------ | ---------- | ----------------- |
| SEC-P0-1 | P0 | Security | FastAPI publicly exposed via tunnel with unauthenticated CRM/audit/dispatch endpoints + docs | live probes; `.cloudflared/config.yml`; `audit_api.py:357` | Customer data breach, job abuse | Confirmed | CONFIGURE+HARDEN |
| SEC-P0-2 | P0 | Security | Repo root HTTP server leaks .env/secrets; world-readable systemd stripe.conf; 0664 env files | PID 1047801 probes; drop-in perms 0644 | Stripe/OAuth compromise | Confirmed | REMOVE+CONFIGURE |
| DATA-1 | P1 | Data | Dual-writer drift: subscriptions diverge across DBs; duplicate dead tables (ledger/purchases) | live row comparison both DBs | State inconsistency | Confirmed | REFACTOR |
| DATA-2 | P1 | Data/Ops | No migration tracking/runner; manual SQL per deploy | no schema_migrations; deploy script msg | Deploy drift/failure | Confirmed | REPLACE |
| RES-1 | P1 | Resilience | No timeout on checkout→Stripe call; webhook long pre-ack chain | `checkout/route.ts:183` | Money-path hang/retry storm | High | HARDEN |
| RES-2 | P1 | Resilience | Outbox at-least-once w/o idempotency key; sent-blocks-resend dedup flaw | `outbox.py:58-72,119-150` | Duplicate customer emails / suppressed sends | High | HARDEN |
| SEC-P1-1 | P1 | Security | Rate-limit identity from client headers | `rate_limit.py:307-315` | Limit bypass, cost abuse | High | HARDEN |
| SEC-P1-2 | P1 | Security | JWT verify ignores session store; login re-TTLs all sessions | `jwt.py:158-195` | Logout not guaranteed | High | HARDEN |
| SEC-P1-3 | P1 | Security | GSC refresh tokens plaintext in DB | `db/models.py:243-244` | Token theft on DB read | High | REPLACE |
| SEC-P1-4 | P1 | Security | Secrets/DSNs hardcoded or sourced outside env contract | multiple anchors (SEC-P1-4 list) | Rotation gaps, silent wrong-DB | High | REPLACE |
| DATA-4 | P1 | Data | Hardcoded fallback DSNs ×7 modules | e.g. `audit_db.py:48-51` | Silent attach to local socket DB | High | REPLACE |
| CI-4 | P1 | CI/Test | Root pytest suite (88 files) & browser suites never run in CI | ci.yml scope | False confidence | Confirmed | TEST |
| TEST-1 | P1 | Test | Queue/outbox/locking semantics only ever mocked | no service containers in CI | Locking bugs ship undetected | High | TEST |
| FM-11 | P1 | Ops | Migration mismatch risk (manual apply order) | deploy script operator-order | Failed deploys | High | REPLACE |
| INF-1 | P2 | Infra | PG LAN listener + trust auth + pool budget >100 vs max_connections=100 | pg_settings/pg_hba live | Exhaustion/lateral movement | Confirmed | CONFIGURE |
| INF-2 | P2 | Infra | Redis unbounded; TTL-less cb/maintenance keys | redis INFO; circuit_breaker.py | Stuck states possible | High | CONFIGURE |
| INF-3 | P2 | Infra | systemd asymmetry: nextjs uncapped memory, repo-wide ReadWritePaths, HUP reload | unit files | Resource/blast-radius | Confirmed | CONFIGURE |
| INF-4 | P2 | Infra | Orphan next-server :4173 + stray static servers + jest on prod host | ps/ss live | Hygiene/confusion | Confirmed | REMOVE |
| INF-5 | P2 | Infra | Single root-run tunnel carries all estates + catch-all to :3000 | config.yml | Wide blast radius | Confirmed | CONFIGURE |
| INF-6 | P2 | Infra | Backups run but no restore drill evidence | backups dir; cron | Unverified recoverability | Medium | TEST |
| INF-8 | P2 | Infra | No slow-query log; scattered cron logs | pg_settings; crontab -l | Blind spots | Confirmed | CONFIGURE |
| RES-3 | P2 | Resilience | Per-request pools + raw connects churn connections | lead_scoring.py:91; newsletter_events.py:115 | Latency/exhaustion under load | High | REFACTOR |
| RES-4 | P2 | Resilience | Heartbeat/sweeper share event loop with 0.25 s pollers | audit_runner.py | Live audits failed spuriously | Medium | HARDEN |
| RES-5 | P2 | Resilience | Fire-and-forget result email lost on crash | audit_api.py:345 | Customer never emailed | High | REPLACE |
| RES-6 | P2 | Resilience | Prod readiness gate inert (ENVIRONMENT=development default), startup not validated | config.py:66; main.py:227 | Misconfig reaches traffic | Confirmed | CONFIGURE |
| SEC-P2-1..4 | P2 | Security | trust-auth PG; chunked body bypass; SSRF gap in signal_verifier; unauth GA4 forwarder | respective anchors | Defense-in-depth gaps | High | HARDEN |
| CODE-1 | P2 | Code | `amount_total \|\| 9700` falsy-zero | webhook:307,335,340,391 | Wrong revenue analytics | High | REFACTOR |
| CODE-2 | P2 | Code | Subscription events dropped when email unresolvable | webhook:441-447 | Billing state lost silently | High | HARDEN |
| CODE-3 | P2 | Code | CRM interested→cold downgrade contradicts invariant | crm_hooks.py:163-167 | Pipeline corruption | High | REFACTOR |
| CODE-8 | P2 | Code | $97 copy hardcoded in Python vs 2027 price rollover | email_service.py:267,334 | Offer contradiction at rollover | Confirmed | REFACTOR |
| FE-5 | P2 | Frontend | 449 unreachable HTML files shipped (58 MB) | public/ count; proxy 404 rule | Artifact bloat/re-exposure risk | Confirmed | DOCUMENT+REMOVE |
| API-1 | P2 | API | Four audit intake paths with divergent guards | route files | Fix-drift across intakes | High | REFACTOR |
| PERF-4 | P2 | Perf | 0.25 s poll waiters starve heartbeat loop | audit_runner.py:84-92 | Spurious failures at scale | Medium | HARDEN |
| CI-1 | P2 | CI | npm audit advisory-only; 2 high vulns open | ci.yml security job | Known vulns ship | Confirmed | HARDEN |
| CI-2 | P2 | CI | Dead duplicate workflow files | customer-portal/.github | Drift illusion | Confirmed | REMOVE |
| CI-3 | P2 | CI | Coverage thresholds zero | ci.yml test job | Coverage decorative | Confirmed | TEST |
| DOC-1..9 | P2/P3 | Docs | Drift table incl. CLAUDE.md :8765 claim normalizing P0 server | documentation-drift.md | Operator misdirection | Confirmed | DOCUMENT |
| TD-* | P3 | Debt | Dead code, .bak files, dual runners, legacy limiter, 410 stub | technical-debt-register.md | Maintenance drag | Confirmed | REMOVE |
| DATA-3/7/8, CODE-5/6, API-3/5, FE-2/4, PERF-1/3, INF-7, DEP items | P3 | Mixed | Enumerated minor items | respective files | Minor | Mixed |

Counts: **P0 = 2 · P1 = 9 · P2 = 18 · P3 = 8** (P3 grouped where noted).
