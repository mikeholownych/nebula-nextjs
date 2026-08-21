# Wave 0 Report — P0 Containment & Trust-Boundary Correction

Window: 2026-08-21 ~14:30–17:15 UTC · All changes deployed and live-validated unless noted.

## SEC-P0-1 — Public FastAPI surface: RESOLVED

Approach per design constraint: FastAPI stays intentionally public; every route now has an explicit exposure class enforced server-side.

### Exposure classification matrix (enforced in code)
| Class | Routes | Control |
| --- | --- | --- |
| INTERNAL_SERVICE | `/audit/claim`, `/audit/email`, `/audit/quota`, `/audit/monitors/run-due`, `/audit/partners` POST, `/verify/deploy-hook`, `/dispatch/{preview,send,run-all}`, `/api/crm/*` (router-level), `/api/leads/decay-all`, `/api/leads/score*` admin, `/api/ab/{stats,conversion,experiments}`, `/api/lead-gen/*` | shared `INTERNAL_API_SECRET` bearer via route-level dependencies (run before body validation), fail-closed 503 when unset |
| USER_SESSION or API-key principal (tenant-bound) | `/audit/by-email`, `/recommendations` (+PATCH w/ ownership), `/timeline`, `/team`, `/badges`, `/lab-experiments` CRUD (+ownership), `/monitors` CRUD (+ownership), `/fix-history`, `/assistant` (`agent:execute`), `/verify/recommendation/{id}` | `require_principal(scope)` → resolves `nbk_` API key (hashed, revocable, workspace-bound) or JWT session into normalized `Principal`; `bind_email()` makes caller-supplied emails advisory-only (mismatch ⇒ 403/404) |
| PUBLIC_ANONYMOUS (by product design) | `/audit/accept`, `/audit/run`, `/audit/{uuid}`, results/share-token/badge lookups, `/audit/health`, `/audit/stats/*`, `/fix-library`, `/fix-effectiveness`, newsletter double-opt-in, Stripe/Svix signed webhooks | IP-keyed GCRA limits, body caps, SSRF validation upstream; uuid/token spaces unenumerable |
| DISABLED_PRODUCTION | `/docs`, `/openapi.json` | `ENVIRONMENT=production` armed via systemd drop-in |

New module: `platform_api/auth/principal.py` (Principal, scopes `audit:create/read/share`, `fixes:read`, `workspace:read/write`, `agent:execute`; API keys default to read/create set; admin authority never granted to customer principals).

### Live acceptance matrix (public ingress, post-deploy)
| Probe | Before | After |
| --- | --- | --- |
| GET /api/crm/funnel | 200 + data | **401** |
| GET /audit/by-email?email=… | 200 enumeration | **401** |
| GET /audit/quota | 200 | **401** |
| POST /dispatch/run-all | reachable | **401** |
| POST /verify/deploy-hook | reachable | **401** |
| POST /audit/monitors/run-due | reachable | **401** |
| POST /api/lead-gen/rb2b-event | open | **401** |
| GET /docs, /openapi.json | 200 | **404** |
| quota with valid internal secret | n/a | **200** |
| anonymous audit accept→completed→results | worked | **works (validated end-to-end, example.com audit 0e36256e…)** |

Rate-limit identity fix (SEC-P1-1): `_resolve_identity` no longer reads `x-audit-email`/`x-email` (verified nothing legitimate ever sent them); identity = trusted IP (anonymous) or hashed nbk_ key / session token (authenticated). Regression tests assert email rotation cannot mint budget.

## SEC-P0-2 — Secret/host exposure: RESOLVED (exposure class eliminated)

- Stray repo-root `http.server :8765` killed — **twice**: first kill was undone by `/home/mike/.hermes/scripts/nebula_watchdog.sh`, which treated the repo server as "the backend" and relaunched it. Watchdog rewritten: 8765 block now ALERTS on unexpected listeners instead of spawning anything; verified stable through full watchdog cycles.
- `:8767` serves `/home/mike/launchcrate` (different project) — out of Nebula scope, documented.
- Permissions: both systemd `stripe.conf` drop-ins → 0400 root; root `.env`, `customer-portal/.env.local` → 0600; new `environment-prod.conf`/`internal-secret.conf` drop-ins created 0400.
- Rotations executed:
  - **Stripe webhook secret**: rotated via Stripe API (new endpoint `we_1U6w2K…`, legacy + stray endpoints deleted); both services restarted on new secret; zero signature-failure log lines post-cutover.
  - **JWT `SECRET_KEY`**: rotated (all sessions invalidated; users re-authenticate).
  - **`AUDIT_UNLOCK_SECRET`**: rotated (existing unlock cookies invalidated by design).
- Operator-dashboard rotations outstanding (no API path exists): Stripe account secret key, Google/GitHub OAuth client secrets, ElevenLabs/Hunter/Pexels/Zernio/PostHog-personal keys. Exact runbook recorded in `final-remediation-report.md`. Residual risk: credentials were exposed ≥8h45m on 0.0.0.0:8765 (external reachability depends on cloud firewall posture, unverified from host).

## NEW-P0-A (discovered during remediation) — RESOLVED
`INTERNAL_API_SECRET` was required by the paid-fulfillment enqueue path but provisioned to **neither** service — first real checkout would have paid and never received delivery. Provisioned to both units via 0400 drop-in; internal-path probe returns 200; fulfillment chain unblocked.

## Deployment-safety hardening (forced by a live incident)
First remediation deploy shipped a **corrupt build artifact** (~4 min of production 500s; rolled back via `.next-previous`). Root causes fixed in `scripts/deploy_customer_portal.sh`:
1. Pre-swap rehearsal: incoming build booted on :3100, must serve healthz+home 200 before swap.
2. Auto-rollback to `.next-previous` when post-swap verification fails (broken build kept at `.next-broken`).
3. FastAPI readiness wait after restart (uv cold start ~10s previously caused false-positive rollback).
Also reverted WIP `package.json` start-script `NODE_OPTIONS` override (silently discarded systemd heap settings) and extended ESLint ignores to sidecar dist dirs.

## Commits
`d852b96f` wip snapshot · `34c5fe08`/`2a09225d` docs · `f5f0dc43` deploy rehearsal+rollback · `1c69abd1` lint ignores · `14ebc14d` api readiness wait · `7b6e866d` SEC-P0-1 classification+guards · JsonLdModal overflow fix · watchdog rewrite (host file, not in repo)

## Residual risk
- Dashboard-only credential rotations pending operator execution (above).
- Session-happy-path tenant binding validated by unit tests + deny-matrix live; first real workspace login should be spot-checked.
- n8n lead-gen callers must add `Authorization: Bearer $INTERNAL_API_SECRET` header (single workflow edit) — lead intake currently 401s until then (fail-closed by design).
