# Current-State Architecture

**Assessment date:** 2026-08-20
**Scope:** Nebula Components as operated in production on this host
**Sources of truth:** running systemd units, live Postgres, in-tree code, CI config, and origin HTTP measurements. The July 2026 `ENTERPRISE_AUDIT_REPORT.md` is stale and was not used.

---

## 1. What this system is

Nebula is a **modular monolith** split across two long-lived processes plus cron/scripts:

| Process | Unit | Port | Role |
|---|---|---|---|
| Customer Portal | `nebula-nextjs.service` | `:3000` | Public origin. Marketing, audit UI, checkout, workspace, BFF routes. |
| Platform API | `nebula-platform-api.service` | `127.0.0.1:8001` | Auth, audit engine invocation, CRM, newsletter, GSC, org APIs. |
| Cloudflare Tunnel | `cloudflared-tunnel.service` | public → `:3000` | Only Next.js is on the public internet. FastAPI is loopback. |
| MCP | `nebula-mcp.service` | `:8002` | Internal agent surface. |

There is no Kubernetes, no second application database cluster, and no message broker on the money path. Redis (`127.0.0.1:6379`) already exists for rate limits, JWT blacklist, and magic links. It is not a cache of business records.

Production load on 2026-08-20 is **low**: 6 completed audits in 24 hours, 51 in 7 days, 1 live delivered purchase in `nebula_platform.purchases`. Architecture risk is **correctness and failure semantics**, not hyperscale throughput.

---

## 2. Runtime topology

```
User / Browser / Agents
        │
        ▼
Cloudflare CDN + Tunnel  (nebulacomponents.com → 127.0.0.1:3000)
        │
        ▼
Next.js 16.2.11  (single next-server, ~186 MB RSS)
  pages + app/api/* BFF
        │
        ├── pg.Pool ──────────────────────────► nebula_platform :5433
        │     purchases, analytics_event_ledger,
        │     workspace billing, outreach queue
        │
        ├── HTTP fetch ───────────────────────► FastAPI :8001
        │     auth, /audit/run, GSC, monitors,
        │     newsletter, CRM, API keys
        │
        ├── Stripe (Checkout + webhook)
        ├── PostHog / GA4 / HeyCatch / Searchable
        └── execFile ──► python3 scripts/deliver_prompt_pack.py
                          + hermes send (Telegram)

FastAPI  (single uvicorn worker, ~141 MB RSS, MemoryMax=2G)
        ├── SQLAlchemy pool ──► nebula_platform  (users, orgs, memberships)
        ├── asyncpg AuditDB ──► nebula_audit     (audits, customers, CRM)
        ├── asyncpg Analytics ► nebula_platform.analytics_event_ledger
        ├── Redis :6379       (rate limit, sessions, magic links)
        └── subprocess.run ──► deliver_audit.py  (≤120s, blocks event loop)

Cron / scripts / n8n
        ├── SQLite lead_state.db, JSONL queues
        └── content_ops Postgres :5432 on 10.0.8.220 (n8n host; not in Next/FastAPI runtime)
```

Observed listening ports: Next `*:3000`, FastAPI `127.0.0.1:8001`, Redis `127.0.0.1:6379`, Postgres `127.0.0.1:5433` **and** `10.0.22.65:5433`.

---

## 3. Applications, packages, generated code

There is **no npm workspace / published package graph**. Python is one project (`/home/mike/nebula/pyproject.toml`).

| Kind | Location |
|---|---|
| Frontend | `customer-portal/app/**`, `customer-portal/components/**` |
| BFF | `customer-portal/app/api/**` (~88 route files) |
| Domain/lib (portal) | `customer-portal/app/lib/**` (ledger, auth, SSRF, quota, brand, facts) |
| Backend | `platform_api/**` |
| Audit engine | `deliver_audit.py` (~101 KB) + `platform_api/services/signal_verifier.py` |
| Fulfillment | `scripts/deliver_prompt_pack.py` |
| Generated | `app/lib/build-info.json`, learning-centre markdown, evidence/proof/citable projections |
| Dead weight | 449 `public/*.html` (418 case-study HTML files), 26 `*.bak` files |

---

## 4. Persistence

### PostgreSQL :5433

| Database | Live tables (sampled) | Authority |
|---|---|---|
| **`nebula_platform`** | `users`, `user_identities`, `organizations`, `memberships`, `purchases` (Stripe session shape), **`analytics_event_ledger` (2,037 rows)**, `subscriptions` (UUID/org), GSC, experiments | Auth + **funnel ledger** + portal Stripe receipts |
| **`nebula_audit`** | `audits` (211 rows: 180 completed, 31 failed), `customers` (47), `recommendations`, monitors, newsletter, `outbox_messages`, a **second** `purchases` / `subscriptions` / `analytics_event_ledger` (empty) | Operational audit pipeline + CRM |

`max_connections=100`, `statement_timeout=0`, `idle_in_transaction_session_timeout=0`, `listen_addresses=localhost,10.0.22.65`.

### Other stores

- Redis: sessions, JWT blacklist, magic links, rate limits, circuit-breaker cache, maintenance flag.
- SQLite: `lead_gen/lead_state.db` and several sibling copies.
- JSONL: `/home/mike/nebula/ledgers/*`, `signal_queue.jsonl`, `audit_queue.jsonl`.
- `content_ops` on `10.0.8.220:5432`: n8n lifecycle tables, **third** `audits` schema. Not connected from Next/FastAPI.

### Connection pools (current process)

| Client | Bound |
|---|---|
| Next `app/lib/db.ts` | `max: 10` |
| Next `app/lib/email-service.ts` | **second** `max: 10` pool to the same DB |
| SQLAlchemy | `pool_size=10`, `max_overflow=20` |
| AuditDB asyncpg | `min=2, max=10` |
| Analytics asyncpg | `min=1, max=5` |
| Redis | `max_connections=50` |

---

## 5. Migrations

Three uncoordinated systems:

1. **Alembic** `/home/mike/nebula/migrations/versions/0001–0007` → `nebula_platform` ORM tables.
2. **Hand SQL** `customer-portal/db/migrations/*.sql` (ledger, purchases, monitoring).
3. **Hand SQL** `platform_api/migrations/*.sql` plus **runtime** `ALTER TABLE ... IF NOT EXISTS` in `AuditDB.connect()`.

There is no single migration runner, no rollback catalog, and no CI that applies migrations against a throwaway database.

---

## 6. Request path (money funnel)

```
Landing (/)
  → CTA → /audit
  → POST /api/audit/start                 [Next: SSRF, ledger accepted+started, 120s proxy]
      → POST /audit/run                   [FastAPI: INSERT pending, subprocess deliver_audit.py ≤120s]
          → UPDATE audits completed       [nebula_audit]
          → ledger audit_completed        [nebula_platform]
  → /audit/[id]/processing                [fake 10s timer, does not poll]
  → /audit/[id]/results                   [SSR unlock gates + 70KB ResultsClient]
      → GET /api/audit/[id]               [requires workspace login]
  → POST /api/checkout                    [unlock cookie + completed audit + Stripe session]
  → Stripe Checkout
  → POST /api/webhooks/stripe             [signature, advisory lock, exec deliver_prompt_pack.py ≤120s]
  → purchases.fulfillment_status=delivered
```

A **second** Stripe webhook exists at FastAPI `POST /api/stripe/webhook` (CRM). A **second** checkout creator exists at FastAPI `POST /api/checkout`.

---

## 7. Auth and trust boundaries

| Mechanism | Enforcement |
|---|---|
| Google / GitHub OAuth, magic-link JWT | FastAPI; cookie `access_token` |
| Workspace API | Mixed: some routes `requireWorkspaceUser()`, some take `email` from the client |
| Audit unlock | HMAC cookie `audit_unlock_{id}` (`AUDIT_UNLOCK_SECRET`) |
| Share token | Unauthenticated mint via `GET /api/audit/[id]/share-token` |
| API keys | `nbk_…` hashed in audit DB; **create/list via unauthenticated Next proxy** |
| Edge guard | `proxy.ts` redirects `/workspace` if cookie missing. Not the security boundary. |
| EmailGate | localStorage; not used as production auth |

Public origin **proxies** FastAPI. Loopback-only FastAPI is therefore **not** a security control for any route the portal exposes.

---

## 8. Observability (as deployed)

| Signal | State |
|---|---|
| Canonical event registry | `config/analytics-registry.json` + `scripts/check-analytics-governance.mjs` |
| Append-only ledger | `nebula_platform.analytics_event_ledger` with UPDATE/DELETE trigger |
| `journey_id` | First-class column, nullable, client-minted in sessionStorage |
| Request ID | FastAPI `X-Request-ID` only. Portal does not propagate. |
| Build identity | `/api/build-info` no-store JSON = git HEAD `389068bd…`. `X-Nebula-Revision` header on HTML = `419eae81…` (baked at last `next build`). FastAPI `/healthz` revision = `c8b24c56…` (stale systemd drop-in). |
| Health | FastAPI `/healthz` (liveness), `/readyz` (config flags only), `/health/deep` (Redis+Postgres, **HTTP 200 even when degraded**). Next.js has **no** `/healthz`. |
| Traces / metrics | None. No OpenTelemetry. |
| Logs | Unstructured `console.error` / `print`. |

---

## 9. CI and deploy

| Gate | What it actually does |
|---|---|
| `customer-portal` `npm run ci` | typecheck, lint, content/brand/analytics/claims/evidence/proof/citable/intelligence, build, Jest, Playwright. This is the **local deploy** gate (`scripts/deploy_customer_portal.sh`). |
| Root GitHub `.github/workflows/ci.yml` | governance, lint, typecheck, Jest (coverage thresholds 0), build, Lighthouse. **Omits** claims, analytics-governance, e2e. |
| Nested `customer-portal/.github/workflows/ci.yml` | `lint \|\| true`, placeholder Cloudflare deploy, curl `.shop`. |
| `next.config.ts` | `typescript.ignoreBuildErrors: true` — production build can ship type errors even if `npm run typecheck` is a separate job. |

Deploy: `systemctl restart nebula-nextjs`. API is **not** restarted by the portal deploy script. `ProtectHome=read-only` on Next; webhook still `execFile`s Python under `/home/mike/nebula`.

---

## 10. External dependencies

Stripe, AgentMail, PostHog, GA4, Google OAuth/GSC, GitHub OAuth, OpenRouter, Cloudflare, HeyCatch, Searchable, n8n (`n8n.mikeholownych.com`), Telegram via `hermes send`, x402/PayAI, MailCheck, Hunter.io (outreach).

---

## 11. Cross-boundary coupling (the actual architecture problem)

1. Portal writes **directly** to Postgres **and** proxies FastAPI.
2. Two `audits` tables, two `purchases` tables, two `subscriptions` tables, two `analytics_event_ledger` tables.
3. Two Stripe webhooks and two checkout APIs.
4. Audit execution is a **CLI subprocess** of an async HTTP handler.
5. Paid fulfillment is `execFile` of another Python script from the Next.js webhook.
6. Quota and `purchases.audit_url` query `nebula_platform.audits` (0 rows) while live audits live in `nebula_audit` (211 rows).
7. JSONL / SQLite outreach state is a third CRM.

These couplings, not missing microservices, are why failure behavior is hard to explain.

---

## 12. What is already appropriate

- Modular monolith + systemd + Cloudflare tunnel.
- Canonical funnel ledger in Postgres with append-only trigger.
- Next.js Stripe webhook signature verification, `stripe_session_id` uniqueness, advisory lock, fulfillment status claim.
- SSRF guard on `/api/audit/start`.
- `/api/build-info` no-store + SHA generation in `npm run build`.
- Consent-gated PostHog/GA architecture (even though third-party load is still heavy).
- Eligible-denominator conversion semantics in `funnel-ledger.ts`.
- Security headers / CSP on the origin.
