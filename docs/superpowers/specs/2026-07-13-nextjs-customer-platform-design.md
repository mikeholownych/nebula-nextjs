# Nebula Next.js Customer Platform Design

**Status:** Approved direction, implementation planning complete

**Decision:** Use Next.js 16.2.10 as Nebula's single primary frontend framework for the public marketing site and authenticated customer/agency application. Keep the existing Python audit, Stripe webhook, CRM, lead, and delivery systems as separate backend services. Add a bounded Python platform API and PostgreSQL for identity-linked tenant data.

## Objectives

1. Replace 461 standalone/generated HTML pages with reusable Next.js layouts, components, and schema-validated content.
2. Preserve production SEO, accessibility, analytics, Stripe links, and legacy `.html` URLs during migration.
3. Add an authenticated customer dashboard for account administration, billing, audit/delivery visibility, and entitlements.
4. Add agency workspaces for client management and white-label configuration.
5. Keep payment verification, audit execution, CRM, email delivery, lead-state transitions, and webhooks outside browser code.
6. Roll out by reversible page and product boundaries rather than a big-bang cutover.

## Current-state evidence

- 461 HTML files totaling 68,631 lines and 3,980,798 bytes.
- 391 generated case studies, representing 84.8% of HTML pages.
- 452 pages with inline CSS and 1,336,984 inline CSS characters.
- 408 pages with JSON-LD; only 10 pages use `fetch()` and 8 contain forms.
- Python `agentic_server.py` on port 8765 owns public files, audits, CRM/admin routes, agent discovery, and Stripe webhook handling.
- `webhook_server.py` on port 9000 owns stats aggregation.
- Cloudflare Tunnel exposes the current origin.
- Existing quality gates use pytest and Playwright.

## System boundaries

### Next.js frontend

- Public marketing pages and content.
- Authenticated dashboard routes.
- Session establishment through an OpenID Connect provider.
- Organization/client switcher and tenant-aware navigation.
- UI-level feature gating; backend authorization remains authoritative.
- Server-rendered tenant branding and hostname resolution.
- Browser-facing calls to `/api/platform/v1/*`.

### Existing Python services

- Audit engine and SSRF controls.
- Stripe webhook verification and existing product/checkout behavior.
- CRM/admin routes.
- Lead lifecycle, bounce suppression, and delivery automation.
- Agent discovery and commerce protocol endpoints.
- Operational JSONL ledgers that remain append-only evidence during migration.

### New Python platform API

- PostgreSQL-backed organizations, users, memberships, clients, entitlements, billing references, branding, domain claims, and audit events.
- JWT verification against provider JWKS.
- Tenant-scoped authorization on every query and mutation.
- Customer-facing platform API under `/api/platform/v1`.
- Stripe customer-portal session creation after authorization.

### PostgreSQL

- Source of truth for customer/agency platform state.
- Does not replace operational evidence ledgers until a separately verified migration is approved.
- Migrations managed by Alembic.

## Deployment topology

```text
Cloudflare Tunnel
  |-- Public/Next routes ----------------------> Next.js :3000
  |-- /api/platform/* -------------------------> Platform API :8770
  |-- Existing /api/*, /stripe-webhook,
  |   discovery and tracking routes ----------> Agentic Python :8765
  `-- /api/stats ------------------------------> Existing proxy -> :9000

PostgreSQL :5432
  `-- Platform API only
```

Text alternative: Cloudflare routes browser pages to Next.js, new customer-platform API requests to a new bounded Python service, and existing operational endpoints to the existing Python server. Only the platform API connects to PostgreSQL.

## Frontend structure

```text
web/
  package.json
  next.config.ts
  tsconfig.json
  src/
    app/
      (marketing)/
      (dashboard)/
      sign-in/
      api/auth/
    components/
      marketing/
      dashboard/
      shared/
    content/
      articles/
      case-studies/
      comparisons/
      learning-centre/
      products/
    lib/
      api/
      auth/
      content/
      metadata/
      tenancy/
    proxy.ts
  public/
```

Marketing pages are prerendered wherever possible. Dashboard pages are dynamically rendered and protected. Existing `.html` requests are internally rewritten to canonical Next route implementations while external URLs remain stable during the parity period.

## Identity and authorization

The first implementation uses a provider-neutral OIDC/JWKS boundary. A short, testable ADR selects a provider only if it satisfies all mandatory checks: Next.js integration, Python JWT verification, MFA, organization claims or metadata, webhook support, production custom domain support, and projected recurring spend within delegated authority. Clerk, WorkOS AuthKit, and Auth0 are evaluated; no production subscription is activated without cost and data-processing review.

The platform API never trusts organization or client identifiers supplied by the frontend. It derives the authenticated principal from the verified token, loads memberships, and applies authorization before reading or writing tenant data.

Roles:

- `platform_admin`: Nebula operators across tenants.
- `agency_owner`: agency billing, members, clients, branding, and domains.
- `agency_admin`: agency members, clients, branding, and operational views; no ownership transfer.
- `agency_member`: assigned client and audit views.
- `client_admin`: own client account, users, billing visibility, and audit data.
- `client_viewer`: read-only own-client access.

## Core tenant model

- `users`: external identity mapping and profile.
- `organizations`: `nebula`, `agency`, or `client` tenant.
- `memberships`: user-to-organization role mapping.
- `agency_clients`: agency-to-client relationship with status and service tier.
- `subscriptions`: Stripe customer/subscription references and normalized entitlement state.
- `entitlements`: feature flags derived from paid products and operator grants.
- `brand_profiles`: logo, colors, support identity, and email display settings.
- `domain_claims`: hostname, verification token hash, status, and certificate state.
- `audit_events`: append-only actor/action/target records.
- `webhook_events`: Stripe/provider webhook idempotency records.

Every tenant-owned row carries `organization_id`. Composite indexes begin with `organization_id`. Service methods require an `AuthorizationContext`; repositories do not expose unscoped list methods.

## Billing design

- Stripe remains the billing source of truth.
- Existing signed webhook processing remains authoritative.
- The platform database stores Stripe identifiers and a normalized read model.
- Customers manage cards and invoices through Stripe Customer Portal; Nebula never handles card data.
- Portal-session creation occurs only after backend authorization confirms the requesting user belongs to the Stripe customer organization.
- Webhook event IDs are persisted before processing to guarantee idempotency.
- Test and live Stripe modes are never mixed.

## White-label design

Release in two stages:

1. **Managed subdomains:** `{agency-slug}.app.nebulacomponents.shop`; tenant resolution is deterministic and reversible.
2. **Custom domains:** agency proves ownership with a DNS token; Cloudflare hostname/certificate activation completes before traffic is accepted.

Brand settings are schema validated. CSS values are emitted as a fixed allowlist of custom properties; arbitrary CSS and JavaScript are prohibited. Logos use signed upload URLs, MIME/size validation, randomized object keys, and tenant-scoped storage paths.

## Content migration

- Case studies become typed content entries rendered by one template.
- Learning-centre resources become typed content entries rendered by shared list/detail templates.
- Shared metadata, JSON-LD, analytics, consent, navigation, footer, CTAs, and design tokens move into components.
- Low-interactivity pages migrate before forms and calculators.
- Homepage migrates last.
- Legacy HTML remains available until route, metadata, accessibility, visual, analytics, and conversion-flow parity passes.

## Security invariants

1. Browser role checks are presentational; Python authorization is authoritative.
2. Every tenant query is scoped by verified membership.
3. Cross-tenant object identifiers return 404 rather than disclose existence.
4. CSRF protection is required for cookie-authenticated mutations.
5. Session cookies are `HttpOnly`, `Secure`, and `SameSite=Lax` or stricter.
6. CSP prohibits arbitrary inline scripts after migration; temporary hashes/nonces are documented per route.
7. Stripe and identity webhooks require signature verification and idempotency.
8. Uploaded assets are never executed and are served from a separate asset origin.
9. Sensitive operational ledgers are excluded from Next build context and public artifacts.
10. Authorization and tenant-isolation tests block deployment.

## Rollout and rollback

Every release boundary has a route-level feature flag or Cloudflare routing switch. The old Python-served page family remains deployable until the new family passes production smoke checks. Rollback changes routing back to the old origin; database migrations use expand/contract sequencing and do not remove fields in the same release that stops writing them.

## Success measures

- No unplanned production 404, redirect loop, canonical change, or broken internal link.
- All existing pytest and Playwright critical-flow tests pass.
- Static marketing pages retain or improve accessibility and page-weight baselines.
- Cross-tenant test matrix shows zero unauthorized reads or writes.
- Stripe portal and webhook tests pass in test mode before live enablement.
- Customer and agency workflows are independently releasable behind flags.
- Rollback is exercised in staging before production cutover.
