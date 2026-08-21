# Enterprise Refactor Plan

> **For agentic workers:** Do not start a rewrite. Execute phases in order. Each phase must leave the app deployable. Preserve the canonical event registry, append-only ledger, immutable-intent `journey_id`, `nebula_platform` ledger store, eligible-denominator semantics, `/api/build-info` no-store, and CI claim/evidence gates.

**Companion docs:** `current-state-architecture.md`, `architecture-risk-register.md`, `performance-baseline.md`, `failure-mode-analysis.md`, `target-architecture.md`.

**Assessment date:** 2026-08-20
**Tech stack (unchanged):** Next.js 16 App Router, FastAPI/uvicorn, PostgreSQL 15, Redis (sessions/rate limits), systemd, Cloudflare Tunnel, Stripe, AgentMail, PostHog projection.

---

## Executive assessment

### 1. Five largest architectural risks

1. **Split-brain data.** `audits`, `purchases`, `subscriptions`, and `analytics_event_ledger` exist in both `nebula_platform` and `nebula_audit` with different shapes. Quota and fulfillment SQL hit the empty platform `audits` table (0 rows) while 211 real audits live in `nebula_audit`.
2. **Two money paths.** Next `/api/webhooks/stripe` (signature, DB claim, Python kit) and FastAPI `/api/stripe/webhook` (fail-open if secret empty, in-memory dedup, CRM). Two checkout creators.
3. **Audit engine is a CLI bolted onto an async HTTP server.** `subprocess.run(deliver_audit.py, timeout=120)` inside `async def` on **one** uvicorn worker.
4. **BFF that is not a boundary.** Portal both proxies FastAPI and talks to Postgres, execs Python, and forwards unauthenticated client `email=` to internal APIs.
5. **Presentation mixed with product.** 70 KB `ResultsClient`, 101 KB `deliver_audit.py`, 449 public HTML files, `/` rewrite to a **missing** `public/index.html`.

### 2. Five largest reliability risks

1. FastAPI returns **HTTP 200** `status:"error"` on timeout/script failure; portal treats 2xx as success; timeout catch on start **does not** write `audit_failed`.
2. Stripe webhook can 500 after `pool.connect()` + advisory lock **without** `release()` — lock/pool leak under Stripe retry.
3. Paid fulfillment **re-scores the live page** and can exit 1 after payment.
4. Redis rate-limit and FastAPI Stripe verify **fail-open**; production `ready()` does not require secrets.
5. Pending audits only fail on **process restart** after 5 minutes; a live hung worker leaves rows `pending` and ledger `IN_FLIGHT`.

### 3. Five largest performance bottlenecks

1. User-visible audit = blocking 120s CLI (measured: 195 `audit_started` vs 6 completed on 2026-08-20).
2. Homepage origin transfer **~1.23 MB uncompressed** (941 KB JS + 100 KB CSS + 188 KB HTML). TTFB is fine (~15 ms HIT); JS is not.
3. Single-thread event loop serializes all FastAPI work behind one audit.
4. Results page hydrates a god client then `GET /api/audit/:id` which **401s anonymous unlock-cookie users**.
5. Stripe webhook waits up to 120s for Python + Telegram before 200.

Postgres size (ledger 2.5 MB, audits 784 KB) is **not** a bottleneck. Do not add Redis/Kafka to hide (1)–(5).

### 4. What must not change

- Canonical event registry + append-only `analytics_event_ledger` + eligible-denominator math.
- `journey_id` as the funnel join (make it more consistently present; do not replace with a new ID scheme).
- `nebula_platform` as ledger/auth store; `nebula_audit` as pipeline store (clarify, don’t merge).
- `/api/build-info` no-store + SHA generation at build.
- Next.js Stripe signature verification + `stripe_session_id` uniqueness + advisory lock **idea**.
- SSRF guard on `/api/audit/start`.
- systemd + Cloudflare tunnel (ADR-004).
- Consent-gated PostHog/GA as **projections**, not a second ledger.
- Local `npm run ci` claim/brand/evidence/citable gates.
- Anonymous synthetic email pattern `anonymous+<uuid>@invalid.nebulacomponents.com`.

### 5. Highest engineering ROI

1. Close public authz holes (API keys, share-token, v1/fixes, audit email, funnel ingest allowlist) — hours, stops real incidents.
2. Fix audit HTTP contract + unlock-cookie GET + ledger `audit_failed` on timeout — restores the advertised funnel.
3. Replace `subprocess.run` with in-process bounded worker + immediate `audit_id` — reliability **and** p95.
4. Webhook try/finally + fulfill from stored findings + outbox ack — money path.
5. Cut default-shell JS (recording off, Searchable/HeyCatch/RB2B off homepage, RSC hero) — CWV without a rewrite.

### 6. What fails first under 10× current load

10× is ~60 audits/day or a simultaneous burst of a few starts. **Postgres will not fail first.**

First: the **single uvicorn event loop** plus **5/min /audit/run on 127.0.0.1**. Concurrent starts queue, Next hits 120s abort, ledger fills with `audit_started` and no completion. Second: Next workers blocked on those 120s fetches. Third: Playwright `create_task` memory if many complete.

### 7. What most likely produces a serious production incident

1. Unauthenticated API-key or share-token mint (data leak / agent API abuse).
2. Paid customer, kit not delivered, because live re-score returned “all signals ≥7” or webhook lock leak stuck Stripe retries.
3. Forged FastAPI Stripe webhook if that URL is ever exposed without a secret.
4. Live secrets in `.env.local` copied by backup/agent.

### 8. Technical debt that can safely remain

- 418 public case-study HTML files until a dedicated crawl-budget sprint (P3).
- Duplicate marketing lander templates (P3) after a vertical-guide component.
- SQLAlchemy unused `Audit` model until Phase 3.
- SQLite outreach (`lead_state.db`) at current sequence volume (ADR-003 still valid).
- Framer Motion on ROI calculator.
- Storybook-only `EmailGate`.
- Coverage thresholds at 0 until failure-path tests exist (raising them now would encourage mocks).

### 9. Changes that would create unnecessary complexity

Microservices, Kubernetes, service mesh, Kafka, extra Redis cache, CQRS, event sourcing, OpenTelemetry vendor, splitting Postgres, a custom job framework, rewriting Next in Python or FastAPI in Node.

### 10. What prevents “enterprise-grade” today

Not missing YAML. It is: **public routes without server authz**, **success responses for failed work**, **a blocked event loop as the audit runtime**, **two sources of truth for money and audits**, **unbounded ingest into the evidence ledger**, **revision identity that disagrees with itself**, and **CI that can skip lint**. Until those are gone, a due-diligence reviewer will correctly refuse the label.

---

## Scorecard

| Dimension | Current | After this plan | Why current is not higher |
|---|---|---|---|
| Architecture | **2** | **4** | Split-brain tables, dual webhooks, CLI-in-HTTP |
| Performance | **2** | **4** | 1.2 MB homepage; 120s blocking audit; results waterfall |
| Reliability | **2** | **4** | HTTP 200 errors; lock leak; fail-open limiter/webhook |
| Database Design | **2** | **4** | Duplicate schemas; runtime DDL; no statement_timeout |
| Failure Handling | **2** | **4** | Timeouts not ledgered; pending only cleared on restart |
| Observability | **3** | **4** | Ledger is real; no request-id; SHA drift; HTML-as-health |
| Deployment Safety | **3** | **4** | SHA verifier exists; `ignoreBuildErrors`; API not in portal deploy |
| Security Boundaries | **1** | **4** | Multiple unauthenticated IDOR/mail/key paths |
| Test Confidence | **3** | **4** | Strong unit tests; workspace tests miss api-keys; no engine failure E2E |
| Maintainability | **2** | **4** | God files, bak/html debris, mixed ownership |
| Operational Readiness | **2** | **4** | No Next probes; deep health HTTP 200; 1 worker |

0 = unsafe, 5 = enterprise-grade. **5 is not claimed** until the plan has been executed and re-measured.

---

## Reliability properties (acceptance)

After Phase 1–3:

- Retrying `POST /api/audit/start` with the same `audit_attempt_id` does not create two running audits.
- Stripe redelivery does not send two kits or two Telegram sale alerts.
- Process crash cannot leave a paid session without a `purchases` row in `pending|processing|failed|delivered|review`.
- Failed AgentMail leaves `failed` + outbox retry, not a silent success.
- Every accepted audit has a durable `nebula_audit.audits` row before the browser is told `pending`.
- Every outbound call has an explicit timeout ≤ caller budget.
- Concurrency of scoring workers is a named constant.
- Background jobs are idempotent or marked non-retryable in code.
- Rolling deploy: add-only migrations first; app versions compatible.

---

## Phase 0 — Baseline and protect

**Objective.** Freeze evidence, rotate obvious secrets, stop shipping with skipped gates.

**Problem.** Live `.env.local` material; three SHAs; nested CI `lint || true`; `typescript.ignoreBuildErrors`; no production mutation during later work.

**Evidence.** `ls .env.local` 1235 bytes gitignored; curl SHA mismatch; `customer-portal/.github/workflows/ci.yml`; `next.config.ts:36-37`.

**Files.** `.env.local` (remove secrets, do not commit), systemd drop-ins, `next.config.ts`, both CI yml files, `scripts/deploy_customer_portal.sh`, `docs/architecture/*` (this set).

**Changes.**
- Rotate Stripe live key + JWT `SECRET_KEY` if they ever lived in the working tree. Inject only via systemd `EnvironmentFile` with `0400` root ownership.
- Align `NEBULA_BUILD_REVISION` on API restart with git HEAD.
- Fail `next build` on type errors (`ignoreBuildErrors: false`).
- Delete `|| true` on lint in nested CI or delete the nested workflow.
- Record this baseline (already in `performance-baseline.md`).

**Dependencies.** None.

**Migration / rollback.** Config only. Rollback = revert CI/next.config.

**Risks.** Build starts failing on pre-existing type errors — **fix them**, do not re-enable ignore.

**Validation.** `npm run typecheck`; curl `/api/build-info` SHA == `git rev-parse HEAD` == `X-Nebula-Revision` after a full rebuild+restart.

**Acceptance.** No live secrets in the repo tree; SHA triple-match after deploy; CI cannot merge on lint failure.

**Class:** HARDEN.

---

## Phase 1 — Correctness and failure semantics (P0)

**Objective.** Close authz holes and make failed work look like failure.

**Problem.** Public origin exposes FastAPI without re-auth; engine errors are HTTP 200; anonymous reports 401; ledger is writable by anyone; fulfillment can refuse a paid job.

**Evidence.** Risk register R01–R06, R09–R12, R15, R21. Jest `workspace-auth-enforcement.test.ts` does **not** cover `/api/workspace/api-keys`.

**Files.**
- `app/api/workspace/api-keys/route.ts`, `[keyId]/route.ts`
- `platform_api/routes/api_key_routes.py`
- `app/api/audit/[id]/share-token/route.ts`, `[id]/route.ts`, `email/route.ts`, `claim/route.ts`, `start/route.ts`
- `app/api/v1/fixes/route.ts`, `[auditId]/route.ts`
- `app/api/analytics/funnel/route.ts`
- `app/lib/funnel-ledger.ts`
- `platform_api/routes/audit_api.py` (HTTP status + SSRF)
- `platform_api/routes/stripe_webhook.py`
- `app/api/webhooks/stripe/route.ts` (try/finally)
- `scripts/deliver_prompt_pack.py` (use stored findings)
- `__tests__/workspace-auth-enforcement.test.ts`, `__tests__/stripe-webhook-fulfillment-gate.test.ts`, new tests for share-token, v1/fixes, funnel allowlist, start timeout ledger

**Changes (ordered).**

1. **Authz default:** `requireWorkspaceUser` on api-keys; FastAPI `get_current_user`; ignore body/query email.
2. Share-token mint requires unlock cookie or owner session.
3. `/api/v1/fixes*` requires valid API key.
4. `/api/audit/email` requires unlock cookie or session.
5. Funnel ingest: allowlist event names whose `source_of_truth` is `client`; reject `purchase_completed`; body cap 16 KB; invalid payload → 400 (not warn+insert).
6. `GET /api/audit/[id]` accepts HMAC unlock cookie **or** owner session (copy the PDF route pattern). Bind session email to `audits.email`.
7. FastAPI `/audit/run` returns **504/500** on timeout/script failure and `UPDATE status='failed'`. Portal inspects `status` and writes `audit_failed`.
8. Start `catch` writes `audit_failed` with `fetch_timeout` / `network_error`.
9. Webhook: single `try/finally` for connect/lock/release; never return 500 while holding the client.
10. FastAPI Stripe verify: `if not secret: raise 503`. Production boot requires `STRIPE_WEBHOOK_SECRET` if that router stays mounted.
11. Fulfillment uses `audits.findings` already stored; remove live re-score as a hard gate.
12. Rotate secrets (if not done in Phase 0).

**Dependencies.** Phase 0 preferred for secret rotation.

**Migration.** Compatible. Old anonymous clients with unlock cookies start working (behavior fix, not a break). Agent clients without keys start getting 401 — **intended**.

**Rollback.** Git revert; Stripe endpoint remains Next.

**Risks.** Any undocumented client using unauthenticated v1/fixes will break — that client was unauthorized.

**Validation.**
- Jest: unauthenticated api-keys/share-token/v1/fixes/email → 401/403.
- Jest: unlock cookie GET audit JSON → 200 for owner, 404 for other email.
- Pytest or Jest: FastAPI timeout → non-2xx **and** `audits.status=failed`.
- Webhook unit: persist error path calls `release()`.
- Manual: one staging audit + unlock without login sees findings.

**Acceptance.** No public route grants tenant data by query email; failed audits never return HTTP 200 success to the portal; paid kit does not depend on a second scrape.

**Class:** HARDEN (authz, contracts, lock) / KEEP (Next Stripe signature).

---

## Phase 2 — Architectural boundaries

**Objective.** Make the BFF a real boundary; stop dual writers.

**Problem.** Portal `email=` passthrough; two checkout/webhook APIs; two purchases writers; quota/fulfillment query wrong DB.

**Evidence.** R08, R11, `audit-quota.ts` vs `nebula_audit.audits`; FastAPI `routes/checkout.py` success URL still `.shop`.

**Files.** `app/lib/workspace-auth.ts`, `app/lib/audit-quota.ts`, `app/api/checkout/route.ts`, `app/api/webhooks/stripe/route.ts` (`audit_url` subquery), `platform_api/routes/checkout.py`, `platform_api/routes/stripe_webhook.py`, `platform_api/services/crm_hooks.py`, `app/lib/db.ts`, `app/lib/email-service.ts`.

**Changes.**
- Quota counts `nebula_audit` via FastAPI, not platform `audits`.
- `purchases.audit_url` from Stripe metadata / FastAPI GET, not platform `audits`.
- Remove or feature-flag FastAPI checkout if unused; CRM updates invoked from portal after persist (HTTP to FastAPI with internal secret) **or** FastAPI webhook fail-closed and documented as the only CRM path — **pick one**, not both.
- Delete duplicate Next `email-service` Pool; import `app/lib/db.ts`.
- Forward `X-Forwarded-For` / `X-Request-ID` on portal → FastAPI; rate-limit `/audit/run` by visitor IP + email, not 127.0.0.1.
- `PLATFORM_API_URL` single default (`:8001`); remove `:8769` leftovers.

**Dependencies.** Phase 1.

**Migration.** Confirm Stripe dashboard has **one** webhook URL (`https://nebulacomponents.com/api/webhooks/stripe`).

**Rollback.** Re-enable second webhook only with fail-closed secret.

**Validation.** Quota test against audit DB; one live test-mode purchase updates **one** `purchases` table; CRM still moves if that is required.

**Acceptance.** One writer per fact (see target architecture table).

**Class:** REFACTOR (ownership) / REMOVE (duplicate checkout) / KEEP (two DBs).

---

## Phase 3 — Persistence, transactions, audit runtime

**Objective.** Durable audit queue in existing tables; stop blocking the event loop; stop runtime DDL.

**Problem.** R07, R13, R19, R20, R26, R33.

**Files.** `platform_api/routes/audit_api.py`, `platform_api/services/audit_db.py`, `platform_api/infra/outbox.py`, `deliver_audit.py` (import surface only), `app/api/audit/start/route.ts`, `app/audit/[id]/processing/page.tsx`, new `platform_api/services/audit_runner.py`, migrations for `statement_timeout` + `running` status if needed.

**Changes.**
1. FastAPI `POST /audit/run` (internal) **or** new `POST /audit/accept`: create row `pending`, return id. Public start maps to this (<300 ms).
2. Runner: `SELECT … FOR UPDATE SKIP LOCKED` + `asyncio` process pool, **max_in_flight=2**. Import scoring; do not `subprocess` the CLI on the HTTP path.
3. Heartbeat / `running` status; sweeper fails `running` with stale heartbeat (not only `pending` on boot).
4. `INSERT customers … ON CONFLICT (email) DO UPDATE RETURNING`.
5. Remove `ALTER TABLE` from `connect()`.
6. `statement_timeout` (e.g. 15s) on interactive sessions; worker connections can be higher.
7. Outbox drain uses `SKIP LOCKED`; webhook enqueues kit send, returns 200 after claim.
8. Dedup `audit_started` with `audit_{id}_started` once `audit_id` exists.

**Dependencies.** Phase 1 HTTP contract so the processing page can poll real status.

**Migration.** Deploy runner **before** removing CLI path (feature flag `AUDIT_ENGINE=inprocess|cli`). Default inprocess after one soak.

**Rollback.** Flag back to CLI (worse, but known).

**Risks.** Scoring import may pull heavy modules into API RSS — measure; MemoryMax is 2G.

**Validation.**
- 5 concurrent starts: all get `audit_id` immediately; at most 2 `running`; others stay `pending` then run.
- Kill uvicorn mid-run: row not `completed`; sweeper or reclaim → `failed` or retry once (document which).
- No `subprocess.run` on `/audit` accept path (`rg` gate).

**Acceptance.** Event loop answers `/healthz` during a 10s score. Audit p95 accept <300 ms.

**Class:** REFACTOR / REPLACE (CLI as HTTP implementation) / KEEP (CLI for outreach).

---

## Phase 4 — Performance (backend)

**Objective.** Cut wasted work on the remaining request paths.

**Evidence.** Serial ledger writes; `await ph.flush()` on start; PageSpeed on request; historical queries before CLI; unbounded `get_benchmarks`.

**Changes.**
- Fire-and-forget PostHog (already on checkout).
- Drop PageSpeed from synchronous scoring; HTML heuristic only on the request (KEEP as fallback that already exists).
- Limit `get_benchmarks` (time window + `LIMIT`).
- Screenshot: one browser, semaphore 1, not `public/` unbounded PNG.
- Checkout: Stripe call not blocked on PostHog.

**Do not** add caches for audits. Completed audits are authoritative in PG and tiny.

**Validation.** Repeat `performance-baseline.md` curl + a staging 20-start burst. Report p50/p95.

**Class:** HARDEN / REMOVE (PageSpeed on request).

---

## Phase 5 — Frontend runtime

**Objective.** Shrink first load; make report HTML.

**Evidence.** 941 KB JS on `/`; root layout mounts HeyCatch, ExitIntent, Searchable, RB2B; `ResultsClient` 70 KB; WorkspaceClient static-imports ~20 views; LHCI misses `/`, `/audit`, `/checkout`.

**Changes.**
- Server hero `<form action="/audit">`; dashboard mock dynamic or static image.
- Load ExitIntent/HeyCatch/RB2B only on `/` and `/audit` after consent; disable PostHog session recording default; sample if needed.
- SSR findings into `/audit/[id]/results` (RSC) + small islands for copy/share/checkout.
- Workspace tabs `next/dynamic`.
- Remove `/` → `/index.html` rewrite.
- Add `/`, `/audit`, `/checkout` to `lighthouserc.cjs` (one mobile run).

**Validation.** Re-run origin byte count; homepage JS <250 KB uncompressed listed scripts; LHCI on those URLs.

**Class:** REFACTOR / REMOVE (always-on third parties) / KEEP (consent architecture, server SiteNav, Stripe redirect).

---

## Phase 6 — Operational hardening

**Objective.** Operators can answer the incident questions.

**Changes.**
- Next `GET /api/healthz` (200 if process up) and `GET /api/readyz` (PG `SELECT 1` with 200ms timeout). **Do not** call `/audit/run`.
- `/health/deep` returns **503** when Postgres is down; Redis failure is `degraded` **without** failing audit readiness.
- `proxy.ts` mints/forwards `X-Request-ID`; include in ledger properties and `console.error` JSON line (`request_id`, `journey_id`, `revision`).
- Stamp `NEBULA_BUILD_REVISION` on **both** units at deploy; verifier checks both.
- `settings.ready()` in production requires `SECRET_KEY`, `DATABASE_URL`, `AUDIT_DATABASE_URL`.
- Cap Next body size on `/api/analytics/*` and `/api/audit/start`.
- Bind Postgres to localhost unless a named peer is documented.
- Fix GitHub `health-check.yml` rb2b `"ok"` assertion; align GH CI with `npm run ci` (claims + analytics-governance + e2e).

**Validation.** Stop Postgres → `readyz` 503, HTML health cron still uses `/api/readyz` not `/`. SHA match API+Next.

**Class:** HARDEN / KEEP (build-info no-store, append-only ledger).

---

## Phase 7 — Load / failure validation

**Objective.** Prove the above with measurements, not hope.

**Scenarios (staging, not prod ledger).**
- Normal: 1 audit.
- Burst: 10 concurrent starts (10× daily volume in one second).
- Slow target: origin that times out.
- Postgres `pg_sleep` / stop.
- Stripe webhook replay (Stripe CLI).
- Kill worker mid-score and mid-kit send.

**Acceptance.** Cap=2 respected; no event-loop stall on `/healthz`; no duplicate kits; timeout → `failed` + ledger; webhook replay → `duplicate: true`.

**Class:** HARDEN (tests). No k8s.

---

## Phase 8 — Cleanup

**Objective.** Reduce surface without behavior change.

- Delete `*.bak`.
- Delete unused `app/components/SiteNav.tsx` if confirmed unused.
- Archive `public/case-studies/*.html` once App Router owns those URLs.
- Split `ResultsClient` leftovers; extract stripe fulfillment module (same process).
- Vertical lander template.
- Document `deliver_audit.py` as outreach-only.

**Class:** REMOVE / DEFER items from risk register R31–R32.

---

## Change classification summary

| Item | Class |
|---|---|
| Event registry, append-only ledger, journey_id, eligible denominators | **KEEP** |
| `/api/build-info` no-store, SHA generate-build-info | **KEEP** |
| Next Stripe signature + session uniqueness + advisory lock | **KEEP** (fix leak) |
| SSRF on `/api/audit/start` | **KEEP** (extend to other URL entrypoints) |
| systemd + tunnel + two processes + two DBs | **KEEP** |
| Redis for sessions/rate limits | **KEEP** (not as data cache) |
| Consent-gated PostHog/GA as projections | **KEEP** |
| Public authz holes, HTTP 200 errors, funnel ingest, fail-open webhook | **HARDEN** |
| Quota/fulfillment wrong DB, dual writers | **REFACTOR** |
| CLI as HTTP engine | **REPLACE** (in-process) / **KEEP** CLI for outreach |
| PageSpeed on request, session recording default, always-on Searchable/HeyCatch/RB2B | **REMOVE** |
| Kafka, k8s, extra Redis cache, merging DBs, new analytics store | **DEFER** forever unless load evidence changes |
| HTML debris, lander duplication | **DEFER** to Phase 8 |

---

## CI/CD

Enforce in **one** pipeline (root GH + `npm run ci`):

| Gate | Action |
|---|---|
| lint, format if present, typecheck | fail merge |
| unit (Jest + pytest) | fail merge |
| claims, analytics-governance, signal-canon, evidence, public-proof, citable | **KEEP** |
| build (no `ignoreBuildErrors`) | fail merge |
| Playwright e2e | fail merge |
| Lighthouse on `/`, `/audit`, editorial set | fail on regression |
| `npm audit` | fail on high in **direct** deps; stop `\|\| true` or pin exceptions explicitly |
| migration check | `alembic check` + SQL files applied on ephemeral PG in CI |
| bundle-size | homepage JS budget from Phase 5 |
| schema compatibility | expand/contract documented in PR |

Do not bypass. If a rule is wrong, change the rule.

---

## Testing pyramid (smallest effective)

1. **Unit:** authz matrix (every `/api/workspace/*` and audit share/v1/email), Stripe claim/lock/release, ledger reject of server-only events from client, SSRF.
2. **Integration (ephemeral PG):** start→pending→completed; webhook duplicate; claim race; migration up.
3. **Contract:** FastAPI error envelope vs Next handling; Stripe CLI replay.
4. **E2E:** one happy audit with mocked engine **and** one timeout path.
5. **Load:** Phase 7 script, not a hosted service.

Stop mocking `pg` for ledger uniqueness and purchase claim — those tests are why api-keys IDOR survived.

---

## Execution notes

- No production data mutation in this assessment. Do not run real audits against production to “benchmark p95.”
- `ENTERPRISE_AUDIT_REPORT.md` (2026-07-16) is obsolete (it claims zero tests). Ignore it.
- Implement with worktrees if parallelizing; do not mix Phase 1 authz with Phase 5 CSS in one PR.

**Plan complete.** Two execution options:

1. **Subagent-driven** — one phase (or P0 item) per subagent, review between.
2. **Inline** — Phase 0–1 in this repo first (highest ROI, lowest architecture theater).
