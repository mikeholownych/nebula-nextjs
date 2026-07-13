# Nebula Next.js Customer Platform Design

**Status:** Approved direction, implementation planning complete

**Decision:** Use Next.js 16.2.10 as Nebula's single primary frontend framework for the public marketing site and authenticated customer/agency application. Keep the existing Python audit, CRM, lead, and delivery systems as separate backend services. Add a bounded Python platform API and PostgreSQL for identity-linked tenant data; consolidate Stripe webhook ownership into that API before customer-account provisioning.

## Objectives

1. Replace 461 standalone/generated HTML pages with reusable Next.js layouts, components, and schema-validated content.
2. Preserve production SEO, accessibility, analytics, Stripe links, and legacy `.html` URLs during migration.
3. Add an authenticated customer dashboard for account administration, billing, audit/delivery visibility, and entitlements.
4. Add agency workspaces for client management and white-label configuration.
5. Keep payment verification, audit execution, CRM, email delivery, lead-state transitions, and webhooks outside browser code.
6. Roll out by reversible page and product boundaries rather than a big-bang cutover.

## Current-state evidence

- The initial inventory captured 461 HTML files and 391 generated case studies. A later live review observed 489 HTML files and a case-study family changing from 419 to 420 files while the review ran. The migration manifest must therefore be captured only after pausing generators and obtaining two stable counts.
- The initial inventory recorded 68,631 HTML lines, 1,336,984 inline CSS characters, and 408 JSON-LD pages; the later live review found 480 inline-style pages and 436 JSON-LD pages.
- Only 8 pages contain forms, so public pages remain Server Components by default and only interactive controls become Client Components.
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
- Existing product/checkout and fulfillment behavior, retained temporarily behind a verified platform-webhook compatibility adapter.
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
  |-- /api/platform/* and gated /stripe-webhook
  |                                            -> Platform API :8770
  |-- Existing operational API, discovery,
  |   CRM and tracking routes ----------------> Agentic Python :8765
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

- `users`: internal user profiles; email is contact data, not the identity key.
- `user_identities`: unique `(issuer, subject)` mappings to users; provider organization claims are never authorization truth.
- `organizations`: `nebula`, `agency`, or `client` tenant.
- `memberships`: user-to-organization role mapping.
- `agency_clients`: agency-to-client relationship with status and service tier.
- `subscriptions`: separates `payer_organization_id` from `service_organization_id`, allowing an agency to pay without exposing agency invoices to client administrators.
- `entitlements`: feature flags derived from paid products and operator grants for the service organization.
- `brand_profiles`: logo, colors, support identity, and email display settings.
- `brand_assignments`: explicit brand-to-client assignment; no implicit inheritance from hostname alone.
- `domain_claims`: hostname, verification token hash, status, and certificate state.
- `audit_events`: append-only actor/action/target records.
- `webhook_events`: Stripe/provider webhook idempotency records.
- `outbox_events`: transactional handoff to legacy ledgers, fulfillment, email, and domain workers.

Every tenant-owned row carries `organization_id`. Composite indexes begin with `organization_id`. Service methods require an `AuthorizationContext`; repositories do not expose unscoped list methods.

## Billing design

- Stripe remains the billing source of truth.
- The current webhook paths are not safe enough to provision customer accounts: `agentic_server.py` and `webhook_server.py` parse JSON without verifying `Stripe-Signature`, no durable Stripe event-ID idempotency exists, and `stripe_webhook.py` contains duplicate subscription-update handling. Billing release is blocked until one platform endpoint verifies Stripe's signature against the raw body, inserts the event ID under a unique PostgreSQL constraint, and processes side effects through a transactional outbox.
- During transition, existing fulfillment behavior remains available behind a compatibility adapter, but only the verified/idempotent processor may invoke it. Cloudflare moves `/stripe-webhook` to the new platform endpoint only after replay, duplicate, ordering, and rollback tests pass.
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
2. Every tenant query is scoped by verified membership; PostgreSQL row-level security is added as defense in depth, and the application role cannot use `BYPASSRLS`.
3. Provider organization claims, email addresses, host headers, Stripe metadata, and route identifiers are not authorization truth.
4. Cross-tenant object identifiers return 404 rather than disclose existence.
5. CSRF protection is required for cookie-authenticated mutations.
6. Session cookies are `HttpOnly`, `Secure`, and `SameSite=Lax` or stricter.
7. CSP prohibits arbitrary inline scripts after migration; temporary hashes/nonces are documented per route.
8. Stripe and identity webhooks require signature verification and idempotency.
9. Uploaded assets are never executed and are served from a separate asset origin.
10. Sensitive operational ledgers are excluded from Next build context and public artifacts.
11. Authorization and tenant-isolation tests block deployment.

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
