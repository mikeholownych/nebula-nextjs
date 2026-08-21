# System Inventory

## Repositories / layout
- Monorepo `/home/mike/nebula` (git, remote `nebula-origin` → github.com:Nebula-Components/nebula-components.git; second remote `origin` diverged — per CLAUDE.md must not be pushed to).
- `customer-portal/` — Next.js 16.3.1 App Router (22 deps, 37 devDeps), ~90 API route handlers, proxy.ts middleware.
- `platform_api/` — FastAPI (uvicorn :8001), SQLAlchemy (nebula_platform) + asyncpg pools (nebula_audit), Redis client, audit runner, outbox.
- `mcp_server.py` — MCP HTTP server :8002 (systemd `nebula-mcp.service`).
- Repo-root Python ops estate: ~200 scripts (lead pipeline, outreach, tunnel monitors), SQLite DBs (`lead_state.db`, `lead_store.db`, `outbound_delivery.db`, …), JSONL ledgers.

## Route inventory (Next.js, abridged by class)
- **Public content**: `/`, `/audit`, `/audit/[id]/results`, `/pricing`, `/checkout`, `/vs/*`, `/compare/*`, `/for/[vertical]`, `/learning-centre/*`, `/case-studies/*`, `/teardowns`, `/playbooks`, ~100 marketing routes; legacy `.html` blocked/redirected via `proxy.ts` + `legacy-routes.ts`.
- **Public APIs**: `/api/analytics` (GA4 forwarder), `/api/newsletter/*`, `/api/webhooks/stripe`, `/api/webhooks/rb2b`, `/api/lead-gen/rb2b-event`, `/api/mpp/*`, `/api/v1/*`, `/api/widget/audit`, `/api/badge|badges`, `/api/bimi`, `/api/shared`, `/api/exit-intent`, `/api/build-info`, healthz/readyz.
- **Audit flow**: `/api/audit/start|run|claim|unlock|email|lab|compare|diff|stats/*|schedules/*|rewrites*`, `/api/audit/[id]` (+pdf, share-token, status).
- **Session-auth**: `/api/workspace/*` (api-keys incl. `[keyId]`, team, export, delete-account, preferences, dispatch, assistant, verify), `/api/audits/by-email`, `/api/auth/*` (google/github/magic-link/verify/me/logout), `/api/gsc/*`, `/api/billing/summary`, `/api/data-rights/export`, `/api/timeline`, `/api/team`.
- Duplicates/shadows noted: `checkout` vs `checkout-v2` vs `checkout-impulse` vs `create-97-checkout` vs `launch-page-97` pages; `api/audit/run` vs `start`; `mpp/audit` vs `mpp/audit-compat`; `subscribe` vs `newsletter/subscribe`.

## FastAPI route classes (from live openapi.json, 115 paths)
- Unauthenticated: entire `/audit/*` engine surface, `/verify/*`, `/dispatch/*`, `/leads/*`, `/api/crm/*` (except purchase-completed), `/api/ab/*`, newsletter, RB2B webhooks.
- JWT session: `/api/auth/*` mgmt, `/api/organizations/*`, `/api/audits/{id}`, `/api/gsc/*`, schedules, experiments, competitors, workspace api-keys.
- Internal secret: `/api/outbox/enqueue`, `/api/crm/purchase-completed` (fail-closed when unset).
- Signature-verified: `/api/stripe/webhook` (HMAC+5-min window+Redis dedup fail-open), `/api/newsletter/provider-events` (Svix HMAC, fail-closed).

## Persistence authorities (as-built)
| Fact | Authority | Notes |
| --- | --- | --- |
| Purchase record | `nebula_platform.purchases` | written by Next webhook; audit-DB copy empty remnant |
| Subscription | ambiguous — rows diverge across both DBs | DATA-1 |
| Audit pipeline state | `nebula_audit.audits` | platform copy exists with 0 rows |
| Funnel events | `nebula_platform.analytics_event_ledger` | audit-DB copy dead (0 rows) |
| Outbox | `nebula_audit.outbox_messages` | platform has separate empty `email_queue` |
| CRM customers | `nebula_audit.customers` (305) | |
| Sessions/JWT state | Redis (`user:{id}:sessions`, blacklist) | |

## Environment/config injection
- systemd drop-ins: nextjs (analytics, headers, mpp, platform-api, site-url, stripe); platform-api (mailcheck, newsletter×2, revision, stripe). Secrets in drop-ins: stripe.conf files are 0644 world-readable (SEC-P0-2b); revision.conf 0400.
- `.env` (repo root) and `customer-portal/.env.local`: mode 0664, contain STRIPE_SECRET_KEY etc.; not git-tracked (only `.env.example` committed).
- `~/.hermes/.env`: Stripe CLI key, CLOUDFLARE_API_TOKEN (deploy purge), OPENROUTER_API_KEY fallback scraped by FastAPI code.

## CI
`.github/workflows/ci.yml` (7 jobs: pytest platform_api only, governance, lint+typecheck, jest w/ 0% thresholds, build artifact, lighthouse lab budgets, advisory npm-audit `|| true`, playwright e2e), `production-smoke.yml` (*/15 cron against .com), `sync-citable-projection.yml`, plus customer-portal-local `ci.yml`/`health-check.yml` (duplicate pipeline names — see CI-2).

## Testing estate
- Jest: 89 test files; Playwright e2e: 7 specs (customer-portal/e2e) + repo-root `tests/*.spec.ts` browser suites not in CI; pytest: `tests/platform_api` in CI + 88-file root suite not in CI.
