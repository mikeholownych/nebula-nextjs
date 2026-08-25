# Archive Inventory

## `.legacy/plans/`

| File | Archived | Reason |
|---|---|---|
| `01-nextjs-public-site-migration.md` | 2026-08-25 | Pre-architecture blueprint. Targets `web/src/` tree that was never created; current app lives in `customer-portal/`. All file paths in this plan are fictional relative to the current repo layout. |
| `02-platform-api-identity-tenancy.md` | 2026-08-25 | Pre-architecture blueprint. Specifies a provider-neutral OIDC JWKS layer and `platform_api/api/v1/router.py` that were never built. Platform API evolved to Google/GitHub OAuth with JWT. |
| `03-customer-dashboard-billing.md` | 2026-08-25 | Pre-architecture blueprint. Targets `web/src/app/(dashboard)/` and `platform_api/api/v1/` routes that don't exist. Billing was subsequently implemented via Phase 2 (feat/billing-entitlements). |
| `04-agency-whitelabel-management.md` | 2026-08-25 | Superseded. Agency whitelabel is being re-specced from scratch with the current architecture as the baseline. The original plan targeted `platform_api/api/v1/` and `web/` paths that don't exist. |

## `.legacy/patches/`

| File | Archived | Reason |
|---|---|---|
| `wip-pre-remediation-snapshot-20260821.patch` | 2026-08-25 | Pre-remediation in-flight snapshot from 2026-08-21. Every meaningful code change in this 162KB patch (GSC daily sparklines, rate limit tuning, `_safe_json_dumps`, `get_audits_by_email` overloads, PLATFORM_API constants) was subsequently applied by the remediation waves (Phases 1/2/3). No actionable delta remains. |
