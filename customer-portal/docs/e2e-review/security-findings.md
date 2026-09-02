# Security Findings

## SEC-P0-1 · Public FastAPI exposure with unauthenticated business endpoints
- **Severity:** P0 · **Component:** Cloudflare Tunnel / platform_api auth model
- **Evidence (live, 2026-08-21):** `https://api.nebulacomponents.com/api/crm/funnel` → 200 with funnel data; `/api/crm/sources` → 200 listing utm sources + customer counts (`evidence/public-api-crm-sources.json`); `/audit/by-email?email=nonexistent-probe@invalid.example` → `{"email":…,"audits":[]}` (enumeration primitive; real emails return their audits); `/docs` and `/openapi.json` → 200 publishing all 115 paths; `/dispatch/run-all`, `/verify/deploy-hook`, `/leads/decay-all`, `/audit/monitors/run-due` reachable (run-all is a POST mass-email job — existence verified via openapi, not executed). Second path: `nebula-api.f489709.workers.dev` → same app.
- **Files:** `/home/mike/.cloudflared/config.yml` (ingress lines for api.nebulacomponents.com and workers.dev), `platform_api/routes/audit_api.py:357` ("No auth required - email is the identity for now"), `platform_api/main.py:106-161`.
- **Failure mode:** any internet client reads CRM/lead/audit data or triggers expensive/mass-effect jobs.
- **Impact:** customer data breach (audits tied to emails), competitive intelligence leak (funnel/conversion data), email-provider reputation damage, cost abuse (EXPENSIVE_WORK).
- **Likelihood:** High (subdomain is discoverable; docs UI exposed).
- **Current behavior:** trust-by-loopback design; tunnel violates assumption. **Expected:** either remove public ingress to :8001 (route through Next BFF only) or add authn to every non-webhook route + disable docs/openapi when publicly served.
- **Root cause hypothesis:** ingress config grew (n8n helper, MCP) without re-evaluating the API's loopback trust model; ENVIRONMENT defaults to `development` so the production readiness gate (`config.py:128-151`) never engages and docs stay on.
- **Confidence:** Confirmed (live probes). **Test coverage:** none that hits the public URL; handler tests assume no ingress.
- **Remediation direction:** CONFIGURE (tunnel) + HARDEN (authn middleware, ENVIRONMENT=production, docs off). Risk: low if BFF-only routing retained; medium if adding tokens (clients must be updated).

## SEC-P0-2 · Secrets readable via repo-root HTTP server and world-readable systemd drop-ins
- **Severity:** P0 · **Component:** host hygiene / secrets management
- **Evidence:** PID 1047801 `python3 -m http.server 8765`, cwd `/home/mike/nebula`, bound `0.0.0.0:8765`. Live: `GET /.env` → 200 (1,173 bytes: STRIPE_SECRET_KEY, SECRET_KEY, OAuth secrets), `GET /secrets/` → 200 directory listing, `GET /HOT_LEAD.json` → 200. Also `0.0.0.0:8767` second static server. `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` mode 0644 contains live `sk_live_…`; `nebula-platform-api.service.d/stripe.conf` 0644 contains webhook secret; root `.env`/`.env.local` mode 0664.
- **Files:** process list; `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf`; `/home/mike/nebula/.env` (perms).
- **Failure mode:** any local user/process — or any LAN peer if cloud firewall permits 8765/8767 — reads payment credentials and lead PII.
- **Impact:** full Stripe account compromise (charges, refunds, PII), OAuth account takeover, lead-data exfiltration.
- **Likelihood:** Medium-High (long-running since 05:50 today; unknown firewall posture; multi-tenant host with other stacks incl. docker).
- **Expected:** no static file server over repo root; secret files 0400/0600 owner-only; systemd drop-in secrets 0400 (deploy script already does this for revision.conf — pattern exists but not applied to stripe.conf).
- **Root cause hypothesis:** ad-hoc debugging servers left running; drop-in created before the chmod convention was adopted.
- **Confidence:** Confirmed. **Test coverage:** none (host hygiene untestable from app CI).
- **Remediation direction:** REMOVE (kill servers, add guardrails) + CONFIGURE (perms). Risk: minimal.

## SEC-P1-1 · Client-controlled rate-limit identity keys
- **Severity:** P1 · **Evidence:** `platform_api/middleware/rate_limit.py:307-315` derives EXPENSIVE_WORK/EMAIL bucket identity from `x-audit-email`/`x-email` headers — attacker rotates values to mint fresh buckets; effective limit = burst per fake identity.
- **Impact:** audit-engine cost abuse; email-sending budget abuse. **Confidence:** High (code-read). **Remediation:** HARDEN — key on IP+route for anonymous classes; keep email dimension only as secondary signal.

## SEC-P1-2 · JWT session verification ignores session-store state
- **Severity:** P1 · **Evidence:** `platform_api/auth/jwt.py:167-195` verifies signature+blacklist only; a Redis flush (or hash expiry via `create_session` re-EXPIRE at :158-162 extending all sessions each login) resurrects "logged out" tokens; logout of *all* devices depends on hash existing.
- **Remediation:** HARDEN — check membership in `user:{id}:sessions` during verify. Risk: adds a Redis read per request (already Redis-dependent).

## SEC-P1-3 · GSC OAuth refresh tokens stored plaintext
- **Severity:** P1 · **Evidence:** `platform_api/db/models.py:243-244` Text columns; comment claims encryption, none implemented in `gsc/oauth.py`.
- **Impact:** DB read ⇒ Google search-console scope on victim properties. **Remediation:** REPLACE with envelope encryption using KMS/master key; DOCUMENT until done.

## SEC-P1-4 · Secret sourcing outside env contract
- **Severity:** P1 · **Evidence:** OPENROUTER_API_KEY fallback scrapes `~/.hermes/.env` (`platform_api/routes/audit_api.py:1026-1033`, `audit/rewrite_routes.py:162-171`); GA4 measurement ID hardcoded default `G-KJ9S3450LH` (`services/analytics.py:17`, `app/api/webhooks/stripe/route.ts:319`); HeyCatch project key hardcoded in source (`app/api/webhooks/stripe/route.ts:21`); IndexNow key hardcoded (`gsc/routes.py:549`); hardcoded fallback Postgres DSNs duplicated in ≥7 modules.
- **Impact:** silent dependency on files outside deployment contract; rotation misses hardcoded values. **Remediation:** REPLACE with explicit env + fail-fast.

## SEC-P2-1 · Local Postgres `trust` auth + LAN listener
- **Evidence:** `/etc/postgresql/16/main/pg_hba.conf`: `local all all trust`; `listen_addresses = localhost,10.0.22.65`; `host ugc_os ugc_user 10.0.0.0/8 md5`. Next.js connects as superuser role `postgres`.
- **Impact:** any local process = superuser; LAN-wide md5 surface; least-privilege absent. **Remediation:** CONFIGURE (scram, scoped roles, drop /8 line). Risk: must update app DSNs.

## SEC-P2-2 · Chunked-encoding body-limit bypass (FastAPI)
- **Evidence:** `platform_api/middleware.py:43-84` checks Content-Length only; chunked bodies skip the check (Stripe webhook does read-then-check at 512 KB — correct pattern). Next.js `readCappedJson` checks actual bytes (correct).
- **Remediation:** HARDEN — mirror Stripe's read-then-check.

## SEC-P2-3 · SSRF surface asymmetry
- **Evidence:** Next side enforces `assertPublicHttpUrl` (DNS-resolved private-range blocklist, `app/lib/ssrf-guard.ts`) at widget/compare/lab/start/monitors; engine `deliver_audit.fetch_page:181-206` validates every redirect hop. Gap: `platform_api/services/signal_verifier.py:15-19` uses httpx with default redirect-following and no equivalent guard; JWKS fetch has no explicit timeout (`auth/google.py:74-77`).
- **Remediation:** REFACTOR — reuse one validated fetcher everywhere.

## SEC-P2-4 · Unauthenticated GA4 event injection
- **Evidence:** `app/api/analytics/route.ts:17-58`: public POST forwards arbitrary events/client_ids to Measurement Protocol; consent explicitly delegated to client ("client should check before sending"); no rate limit; outbound fetch lacks timeout.
- **Impact:** quota burn, analytics poisoning. **Remediation:** HARDEN (rate limit + allowlisted event names + timeout).

## SEC-P3 group
- CSP allows `'unsafe-inline'` scripts and broadened img/connect hosts (`headers.conf` observed live) — weakens XSS containment.
- `Access-Control-Allow-Origin: *` on `/api/build-info` (info-only endpoint; cosmetic).
- Share tokens: `audits.share_token` unique-indexed 32-char — minting code not reviewed end-to-end here; flagged INVESTIGATE for entropy source.
- Magic-link consumption via GET (`auth/routes.py:349-361`) — prefetcher risk.
- MCP endpoint answers protocol negotiation without auth challenge at `mcp.nebulacomponents.com` (INVESTIGATE — x402 monetization may be intended boundary).
