# Nebula Next.js Customer Platform Transformation Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Nebula's standalone HTML estate with Next.js 16.2.10 and deliver an authenticated, tenant-safe customer and agency platform without regressing the existing Python revenue pipeline.

**Architecture:** Next.js owns public pages and the customer-facing application. Existing Python services retain audit, CRM, lead, and delivery responsibilities; a new bounded Python platform API owns PostgreSQL-backed tenant state and becomes the single verified/idempotent Stripe webhook processor before billing launch. Cloudflare routes each request to the correct service.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript strict mode, CSS custom properties, Vitest, Playwright, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, OIDC/JWKS, Stripe Customer Portal, pytest, Cloudflare Tunnel.

## Global Constraints

- Preserve existing `.html` URLs externally until an approved redirect migration passes SEO verification.
- Do not change existing Python API, Stripe webhook, SSRF, lead-state, bounce, or admin-auth behavior during frontend migration.
- Do not expose secrets, ledgers, lead data, or private audit artifacts to Next.js build output.
- Keep Stripe as billing source of truth; never collect or store card data.
- Treat the current unsigned, non-idempotent Stripe paths as a release blocker: no customer-account provisioning or billing entitlement rollout occurs until one verified/idempotent platform webhook owns `/stripe-webhook`.
- Derive tenant scope from verified identity and memberships; never trust browser-supplied tenant IDs.
- Maintain WCAG 2.1 AA, metadata, JSON-LD, analytics-event, and Stripe-link parity.
- Use expand/contract database migrations and reversible route-level rollout.
- Use `venv/bin/python3`, not system Python, for repository Python tests.
- Restart affected servers after CSS or runtime changes and verify health before browser tests.

---

## Plan set

1. [`01-nextjs-public-site-migration.md`](01-nextjs-public-site-migration.md) — framework foundation, route compatibility, content migration, and public-site parity.
2. [`02-platform-api-identity-tenancy.md`](02-platform-api-identity-tenancy.md) — OIDC boundary, PostgreSQL, tenant model, RBAC, and platform APIs.
3. [`03-customer-dashboard-billing.md`](03-customer-dashboard-billing.md) — dashboard shell, account administration, Stripe portal, entitlements, and audit visibility.
4. [`04-agency-whitelabel-management.md`](04-agency-whitelabel-management.md) — agency/client hierarchy, branding, managed subdomains, and custom domains.
5. [`05-deployment-cutover-operations.md`](05-deployment-cutover-operations.md) — Cloudflare routing, CI, observability, security gates, production cutover, and rollback.

## Dependency graph

```text
01 Next.js foundation --------+------> 03 Customer dashboard ----+
                              |                                  |
02 Identity and tenancy ------+------> 04 Agency white-label -----+----> 05 Cutover
01 Public content migration -------------------------------------+
```

Text alternative: plans 01 and 02 can begin independently. Customer dashboard requires both. Agency white-label requires tenant identity and the dashboard shell. Production cutover requires every applicable plan's release gates.

## Release sequence

### Release 0 — Baseline and proof

- [ ] Create an isolated worktree and feature branch.
- [ ] Freeze route, metadata, screenshot, analytics, Stripe-link, and API baselines.
- [ ] Prove Next.js can internally rewrite legacy `.html` URLs while keeping the browser URL and canonical unchanged.
- [ ] Prove Cloudflare path routing can separate Next, existing Python, and platform API traffic.
- [ ] Stop if either proof fails; revise the architecture decision before migrating content.

### Release 1 — Framework foundation

- [ ] Complete Plan 01 Tasks 1–4.
- [ ] Serve a canary page through Next.js while all other routes remain on Python.
- [ ] Verify rollback by returning the canary route to Python.

### Release 2 — Content estate

- [ ] Migrate case studies, learning centre, articles, comparisons, and products.
- [ ] Run route, metadata, accessibility, visual, analytics, and link parity after each family.
- [ ] Keep forms, calculators, dashboard, and homepage on legacy routes.

### Release 3 — Identity and tenant foundation

- [ ] Complete Plan 02.
- [ ] Verify OIDC tokens in Python and pass the cross-tenant denial matrix.
- [ ] Run PostgreSQL backup/restore and migration rollback drills.

### Release 4 — Customer dashboard

- [ ] Complete Plan 03 behind `customer_dashboard` entitlement.
- [ ] Enable for an internal Nebula organization, then one test customer.
- [ ] Verify Stripe Customer Portal and webhook synchronization in Stripe test mode.

### Release 5 — Agency and white-label

- [ ] Complete Plan 04 managed-subdomain release.
- [ ] Enable custom domains only after DNS ownership and certificate automation pass staging.

### Release 6 — Production cutover

- [ ] Complete Plan 05.
- [ ] Migrate interactive marketing pages and homepage last.
- [ ] Retire legacy page generation only after the rollback window closes and production evidence remains healthy.

## Global verification command

Run from `/home/mike/nebula`:

```bash
npm --prefix web ci
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run test
npm --prefix web run build
venv/bin/python3 -m pytest -q
npx playwright test tests/platform-critical-flows.spec.ts tests/all-pages-audit.spec.ts
```

Expected: every command exits `0`; no route-contract, tenant-isolation, accessibility, Stripe-link, or browser-flow failure is waived.

## Completion gate

- [ ] Public route manifest reports 100% expected status/canonical parity.
- [ ] Existing backend suite passes without excluded tests.
- [ ] New platform API unit/integration tests pass.
- [ ] Cross-tenant access matrix passes for every role and resource.
- [ ] Stripe test-mode lifecycle passes checkout → webhook → entitlement → portal.
- [ ] Managed-subdomain and custom-domain isolation tests pass.
- [ ] Staging rollback restores the previous origin without data loss.
- [ ] Production dashboards label endpoint availability and source-data freshness separately.
