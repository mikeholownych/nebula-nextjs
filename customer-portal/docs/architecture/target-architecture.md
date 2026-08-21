# Target Architecture

**Principle:** a simpler modular monolith. Same two processes. Same two Postgres databases with **clarified ownership**. No Kubernetes, no extra Redis for query caching, no Kafka, no second analytics truth.

---

## 1. Dependency direction

```
Presentation (RSC + small client islands)
        ↓
Application / BFF (Next route handlers)
        ↓  (HTTP, timeouts, request-id)
Domain (pure functions: scoring, unlock, fulfillment claim, ledger recipes)
        ↓
Persistence adapters
        ├── nebula_platform   auth, ledger, Stripe receipts, orgs
        └── nebula_audit      audits, customers, findings, monitors, newsletter
        ↓
Infrastructure
        ├── Stripe, AgentMail, Redis (sessions/rate limits only)
        └── Playwright (bounded, off request)
```

**Forbidden:** UI importing `pg` except through a persistence module; FastAPI handlers calling `subprocess` for the product path; Next `execFile` of Python on the webhook request.

---

## 2. Ownership boundaries

| Fact | Authoritative store | Who writes | Who reads |
|---|---|---|---|
| Funnel event | `nebula_platform.analytics_event_ledger` | Portal server + Platform API **server** only | Funnel report, SLOs |
| Stripe Checkout receipt + fulfillment | `nebula_platform.purchases` | Portal webhook only | Billing, re-audit cron |
| Identity (login) | `nebula_platform.users` + `user_identities` | Platform API auth | Portal via `/api/auth/me` |
| Organization membership | `nebula_platform.organizations/memberships` | Platform API | Workspace |
| Operational audit run | `nebula_audit.audits` + `customers` | Platform API only | Portal via FastAPI |
| Newsletter legal evidence | `nebula_audit` newsletter tables | Platform API | Platform API |
| Session | Redis + JWT | Platform API | Both |
| Outreach sequences | Keep SQLite until volume forces PG; **do not** duplicate into a fourth CRM now | Scripts | Scripts |

**Delete or stop writing:** the empty `nebula_audit.analytics_event_ledger`, FastAPI CRM `purchases` insert **or** make it a projection from portal `purchases` (one way). SQLAlchemy `Audit` model if unused. FastAPI `/api/checkout` if unused by production Stripe.

PostHog and GA4 remain **projections**. They never become the funnel.

---

## 3. Audit lifecycle (explicit)

```
accepted (ledger, after persist)
  → pending     (row in nebula_audit.audits)
  → running     (worker claimed; heartbeat)
  → completed   | failed
  → (optional) email_sent
```

HTTP:

1. `POST /api/audit/start` validates + SSRF + inserts `pending` via FastAPI **fast path** (`<300ms`).
2. Returns `{audit_id, status:"pending"}`. Writes `audit_accepted`/`audit_started` **with `audit_id` so dedup_key exists**.
3. Worker in the **same** FastAPI process (`asyncio` process pool, cap=2) runs scoring **in-process** (import `score_*`, do not `subprocess` the CLI).
4. Processing page **polls** `GET /api/audit/:id` (unlock-cookie allowed).
5. On failure: `status=failed`, ledger `audit_failed` with `fetch_timeout|script_error|…`. HTTP 5xx from engine to the worker, not to the browser accept call.

CLI `deliver_audit.py` remains for **outreach batch** only.

---

## 4. Payment / fulfillment lifecycle

```
checkout_started (ledger)
  → Stripe session (Idempotency-Key = audit_id+offer+journey)
  → purchases pending           (webhook, signature required)
  → processing                  (claim)
  → delivered | failed | review
```

HTTP webhook:

1. Verify signature (KEEP Next path).
2. Advisory lock + insert/claim in **one** try/finally.
3. If canonical $97: enqueue fulfillment on **Postgres outbox** (already exists).
4. Return 200 once claimed (or 500 only if persist failed).
5. In-process drain (Next `waitUntil` or a small loop in the same Node process, **or** FastAPI outbox drain cron already on the host) sends AgentMail using **stored findings**, never a live re-score gate.

FastAPI Stripe webhook: **fail-closed** or **removed** in favor of portal calling `crm_hooks.purchase_completed` after persist.

---

## 5. Authz rule

Every public `/api/*` that touches tenant data:

- Session cookie / Bearer JWT **or**
- HMAC unlock cookie bound to `audit_id` **or**
- Valid `nbk_` API key **or**
- Signed share token **already issued by an owner**.

Never: client-supplied `email=` as authorization. Never: mint share tokens anonymously. Never: optional API key.

Workspace `requireWorkspaceUser` is the default. FastAPI must re-check JWT even when the caller is Next.

---

## 6. Observability

KEEP registry, append-only ledger, journey_id, `/api/build-info` no-store.

Add, without a tracing vendor:

- `X-Request-ID` minted in Next `proxy.ts`, forwarded to FastAPI, echoed, included in ledger `properties.request_id` and logs.
- `audit_failed` on every abort.
- One SHA: runtime `build-info.json` for both HTML header and JSON; API `NEBULA_BUILD_REVISION` updated on API deploy.
- Next `/api/healthz` (process) and `/api/readyz` (PG ping with 200ms timeout, **not** `/audit/run`). Deep health remains internal and must **not** be HTTP 200 when PG is down if used for admission.

No second analytics database.

---

## 7. What we will not introduce

| Idea | Why not |
|---|---|
| Microservices / k8s / mesh | Two processes already; load is 6 audits/day |
| Kafka / extra Redis cache | Outbox table already exists; engine cap=2 is enough |
| CQRS / event sourcing | Ledger is already append-only evidence, not a rewrite of commerce |
| New Postgres cluster | Ownership clarification, not a new store |
| Custom framework | Next + FastAPI stay |

---

## 8. ADRs

### ADR-E1 — Keep two processes, fix the engine

**Decision:** Next remains the public origin; FastAPI remains the audit/auth service.
**Context:** Splitting further does not fix `subprocess.run` or authz holes.
**Alternatives:** Merge FastAPI into Next Route Handlers (rejects: Python scoring/Playwright); explode into workers+queue (unjustified volume).
**Why:** Smallest change that restores a runnable event loop.
**Ops:** systemd unchanged.
**Reversal:** low.

### ADR-E2 — Keep two Postgres databases, assign facts

**Decision:** Do not merge `nebula_platform` and `nebula_audit`. Assign each table a single owner; stop dual writes.
**Context:** CONTEXT.md already forbids mixing; the code already mixed.
**Alternatives:** One database (larger migration risk); three databases (worse).
**Why:** Cross-DB FKs are the problem, not the existence of two DBs.
**Ops:** backups already dump both.
**Reversal:** medium if dual writes are deleted.

### ADR-E3 — In-process audit worker, not a new broker

**Decision:** `ProcessPoolExecutor` / `asyncio.to_thread` inside FastAPI, concurrency=2, Postgres `pending` as the queue.
**Alternatives:** Redis queue, systemd timer, n8n. All add moving parts for <10 audits/day.
**Why:** The row is already the durable queue.
**Ops:** crash recovery = existing pending sweeper + claim with `FOR UPDATE SKIP LOCKED`.
**Reversal:** low.

### ADR-E4 — Portal Stripe webhook remains money authority

**Decision:** Next `/api/webhooks/stripe` is the only fulfillment writer. FastAPI webhook is CRM-only or removed.
**Alternatives:** Move fulfillment to FastAPI (more Python in the money path); Stripe Queue (unneeded).
**Why:** Signature verification, tests, and `purchases` already live there.
**Ops:** one Stripe endpoint in the dashboard.
**Reversal:** low.

### ADR-E5 — Redis stays for sessions and rate limits only

**Decision:** Do not add Redis as a response cache for audits or HTML.
**Context:** Redis already exists; `/health/deep` currently treats it as required.
**Alternatives:** Drop Redis (magic links and limiter would need PG); cache HTML in Redis (CDN already does).
**Why:** CDN + Postgres are sufficient caches.
**Ops:** Redis down should not mark the **audit product** unready.
**Reversal:** n/a.
