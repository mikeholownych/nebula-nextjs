# Public API Model — Exposure Classes (Wave 0+)

The FastAPI service (`api.nebulacomponents.shop`, plus the workers.dev path) is
**intentionally public**. Public reachability is not the defect; implicit trust
was. Every route now carries one explicit exposure class, enforced in code:

| Class | Authentication | Examples |
| --- | --- | --- |
| `PUBLIC_ANONYMOUS` | none — but bounded: IP-keyed GCRA rate limits, body caps, SSRF validation, unenumerable identifiers | audit accept/run/{uuid}, results & share-token lookups, health/stats aggregates, newsletter double-opt-in |
| `PUBLIC_API_AUTHENTICATED` | `Authorization: Bearer nbk_…` or `X-API-Key:` — hashed at rest, revocable, workspace-bound, scoped | workspace data endpoints also accept session JWTs; keys default to read/create scopes |
| `USER_SESSION_AUTHENTICATED` | JWT cookie/bearer → server-side user lookup | workspace surfaces (by-email, recommendations, monitors, lab experiments, team, timeline, assistant…) |
| `INTERNAL_SERVICE` | shared `INTERNAL_API_SECRET` bearer (constant-time compare, fail-closed 503 when unset) | claim/email/quota, run-due, deploy-hook, dispatch/preview/send/run-all, all `/api/crm/*`, lead-gen webhooks, AB admin, outbox enqueue |
| `SIGNED_WEBHOOK` | provider HMAC (Stripe signature; Svix for newsletter events) | `/api/stripe/webhook`, `/api/newsletter/provider-events` |

## Invariants

1. Authorization derives **only** from a server-resolved principal
   (`platform_api/auth/principal.py`). Caller-supplied emails/workspace strings
   are advisory and must match the principal binding or the request fails.
2. A customer API key can never reach INTERNAL_SERVICE or OPERATOR_ADMIN
   capabilities regardless of scope.
3. Anonymous never means unrestricted: every anonymous capability has a rate
   class with fail-closed behavior on expensive work.
4. OpenAPI/docs are disabled in production (`ENVIRONMENT=production` arms both
   the docs-off switch and startup validation). A curated customer contract
   should be published deliberately when agent-facing APIs stabilize.
5. Rate-limit identity = trusted IP (anonymous) or credential hash
   (authenticated); caller-controlled headers never mint budget.

## Machine clients

Customer agents authenticate with `nbk_…` keys created in the workspace
(`POST /workspace/api-keys` via browser session). Keys are scoped
(`audit:create`, `audit:read`, `fixes:read`, `workspace:read/write`,
`agent:execute`), revocable, quota'd per plan, and attributable in
`api_key_usage`.

## Operational notes

- n8n callers of `/api/lead-gen/*` must send `Authorization: Bearer $INTERNAL_API_SECRET`.
- The Next BFF forwards browser credentials to tenant-bound endpoints and uses
  the internal secret for server-only calls (claim/email/quota/outbox/CRM).
