# Customer Dashboard and Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a protected customer dashboard for account administration, billing, entitlements, audits, and service-delivery visibility.

**Architecture:** Next.js dashboard routes render from the authenticated principal and call the Python platform API. Stripe remains authoritative; the UI opens Stripe Customer Portal rather than collecting payment details. Features release behind backend-derived entitlements.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, OIDC SDK selected in ADR-001, Zod, React Hook Form, Playwright, FastAPI, Stripe API/webhooks.

## Global Constraints

- Browser checks never replace backend authorization.
- Never expose Stripe secret keys or create portal sessions in client components.
- Do not infer paid status from return URLs; use signed webhooks and normalized backend state.
- Every loading, empty, stale, error, and unauthorized state has explicit UI.
- Dashboard data freshness is displayed separately from endpoint availability.

---

### Task 1: Establish authenticated dashboard shell

**Files:**
- Create: `web/src/app/(dashboard)/dashboard/layout.tsx`
- Create: `web/src/app/(dashboard)/dashboard/page.tsx`
- Create: `web/src/components/dashboard/AppShell.tsx`
- Create: `web/src/components/dashboard/TenantSwitcher.tsx`
- Create: `web/src/components/dashboard/Navigation.tsx`
- Create: `web/src/lib/auth/session.ts`
- Create: `web/src/lib/api/platform-client.ts`
- Test: `web/src/components/dashboard/AppShell.test.tsx`
- Test: `tests/dashboard-auth.spec.ts`

**Interfaces:**
- Consumes: `GET /api/platform/v1/me`.
- Produces: `getAuthenticatedSession()`, server-only `platformApi<T>()`, dashboard shell, and tenant switcher.

- [ ] **Step 1: Write failing tests for unauthenticated redirect, authenticated rendering, tenant selection, keyboard navigation, and API failure**

```ts
await page.goto('/dashboard')
await expect(page).toHaveURL(/sign-in/)
```

Authenticated fixtures must assert no protected response is cached publicly.

- [ ] **Step 2: Implement server-only API client**

```ts
export async function platformApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.PLATFORM_API_ORIGIN}${path}`, {
    ...init,
    headers: { ...init?.headers, authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!response.ok) throw await PlatformApiError.fromResponse(response)
  return response.json() as Promise<T>
}
```

- [ ] **Step 3: Implement shell with skip link, visible focus, landmarks, responsive navigation, and an organization switcher restricted to memberships returned by `/me`**
- [ ] **Step 4: Add CSP, `Cache-Control: private, no-store`, and auth protection for the dashboard route group**
- [ ] **Step 5: Run Next unit/build and Playwright auth tests**
- [ ] **Step 6: Commit as `feat: add authenticated customer dashboard shell`**

### Task 2: Add profile, organization, and membership administration

**Files:**
- Create: `web/src/app/(dashboard)/dashboard/account/page.tsx`
- Create: `web/src/app/(dashboard)/dashboard/team/page.tsx`
- Create: `web/src/components/dashboard/MemberTable.tsx`
- Create: `web/src/components/dashboard/InviteMemberForm.tsx`
- Create: `platform_api/api/v1/invitations.py`
- Create: `platform_api/services/invitations.py`
- Test: `tests/platform_api/test_invitations.py`
- Test: `tests/dashboard-team.spec.ts`

**Interfaces:**
- Produces invitation create/list/revoke/accept endpoints with single-use hashed tokens and role ceilings.

- [ ] **Step 1: Write failing tests for invite creation, duplicate invite, expiry, replay, revoke, role escalation, foreign-tenant acceptance, and email-delivery failure**
- [ ] **Step 2: Add invitation schema and migration with `token_hash`, `expires_at`, `accepted_at`, `revoked_at`, and inviter identity**
- [ ] **Step 3: Implement backend invitation authorization; inviters cannot grant roles above their own authority**
- [ ] **Step 4: Send invite messages through the existing AgentMail REST adapter, never SMTP**
- [ ] **Step 5: Build account/team pages with accessible status messages and confirmation for destructive actions**
- [ ] **Step 6: Run API and browser tests; commit as `feat: add customer team administration`**

### Task 3: Consolidate and harden Stripe event processing

**Files:**
- Create: `platform_api/api/webhooks/stripe.py`
- Create: `platform_api/services/billing_sync.py`
- Create: `platform_api/services/stripe_event_processor.py`
- Create: `platform_api/services/outbox.py`
- Create: `platform_api/adapters/legacy_fulfillment.py`
- Create: `platform_api/repositories/subscriptions.py`
- Create: `platform_api/schemas/billing.py`
- Modify: `stripe_webhook.py`
- Modify: `agentic_server.py`
- Modify: `webhook_server.py`
- Test: `tests/platform_api/test_stripe_signature.py`
- Test: `tests/platform_api/test_billing_sync.py`
- Test: `tests/platform_api/test_stripe_outbox.py`
- Test: `tests/test_stripe_webhook_platform_sync.py`

**Interfaces:**
- Produces one target endpoint, `POST /api/platform/v1/webhooks/stripe`, which receives raw bytes, verifies `Stripe-Signature`, inserts the Stripe event ID under a unique PostgreSQL constraint, updates normalized billing state transactionally, and writes an outbox event for legacy fulfillment.

- [ ] **Step 1: Freeze the two unsafe current paths with failing security tests**

Tests must prove that `agentic_server.py` and `webhook_server.py` currently accept unsigned Stripe-shaped JSON, that duplicate delivery can repeat mutations, and that the second `customer.subscription.updated` branch in `stripe_webhook.py` is unreachable. These tests document the defect; they must not send live fulfillment messages or write production ledgers.

- [ ] **Step 2: Implement raw-body Stripe signature verification before JSON processing**

```python
try:
    event = stripe.Webhook.construct_event(
        payload=raw_body,
        sig_header=stripe_signature,
        secret=settings.stripe_webhook_secret,
    )
except (ValueError, stripe.error.SignatureVerificationError) as exc:
    raise InvalidWebhookSignature() from exc
```

Missing, malformed, expired, or mismatched signatures return `400` and perform zero database, ledger, email, order, or entitlement writes.

- [ ] **Step 3: Persist and process idempotently**

Insert `(provider='stripe', external_event_id=event.id)` under a unique constraint. In one transaction, apply only a newer billing state, update payer/service-account entitlements, and insert an outbox event. Duplicate delivery returns `200` without repeating any side effect.

- [ ] **Step 4: Preserve existing fulfillment through one compatibility adapter**

Move legacy order/ledger/email behavior behind `legacy_fulfillment.py`; invoke it only from an idempotent outbox worker. Remove the duplicate subscription-update branch and test both subscription status and dunning behavior explicitly. Keep JSONL writes temporarily as append-only evidence, not billing truth.

- [ ] **Step 5: Cut over the public webhook atomically**

After replaying signed fixtures in staging, change Cloudflare `/stripe-webhook` ownership from `agentic_server` to `platform_api`. Disable the old Stripe handlers only after the new endpoint, outbox, and rollback route pass. Preserve a route-level emergency rollback that does not permit unsigned processing.

- [ ] **Step 6: Map Stripe product/price IDs to versioned entitlement codes and test checkout, subscription, invoice, refund, dispute, duplicate, out-of-order, unknown-customer, and test/live-mode cases**

- [ ] **Step 7: Run existing payment tests plus `venv/bin/python3 -m pytest tests/platform_api/test_stripe_signature.py tests/platform_api/test_billing_sync.py tests/platform_api/test_stripe_outbox.py tests/test_stripe_webhook_platform_sync.py -q`**

Expected: unsigned/replayed events cannot mutate state; every valid event produces at most one billing mutation and one fulfillment outbox action.

- [ ] **Step 8: Commit as `security: consolidate verified idempotent Stripe webhooks`**

### Task 4: Add billing dashboard and Customer Portal

**Files:**
- Create: `platform_api/api/v1/billing.py`
- Create: `platform_api/services/stripe_portal.py`
- Create: `web/src/app/(dashboard)/dashboard/billing/page.tsx`
- Create: `web/src/components/dashboard/BillingSummary.tsx`
- Create: `web/src/components/dashboard/OpenPortalButton.tsx`
- Test: `tests/platform_api/test_stripe_portal.py`
- Test: `tests/dashboard-billing.spec.ts`

**Interfaces:**
- Produces: `GET /api/platform/v1/billing`; `POST /api/platform/v1/billing/portal-session -> {url, expiresAt}`.

- [ ] **Step 1: Write failing authorization tests proving only a user with billing permission on the payer organization can create a portal session for that payer's Stripe customer; a client administrator cannot view agency invoices merely because the agency pays for the client's service entitlement**
- [ ] **Step 2: Implement server-side portal-session creation with an allowlisted return URL**
- [ ] **Step 3: Render plan, renewal/cancellation state, invoice link availability, entitlement freshness timestamp, and a stale-data warning**
- [ ] **Step 4: Make portal opening a POST action with duplicate-click protection; never embed card forms**
- [ ] **Step 5: Run Stripe test-mode API and Playwright tests**
- [ ] **Step 6: Commit as `feat: add secure billing self-service`**

### Task 5: Add audit and delivery visibility

**Files:**
- Create: `platform_api/api/v1/audits.py`
- Create: `platform_api/services/audit_projection.py`
- Create: `web/src/app/(dashboard)/dashboard/audits/page.tsx`
- Create: `web/src/app/(dashboard)/dashboard/audits/[auditId]/page.tsx`
- Create: `web/src/components/dashboard/AuditStatus.tsx`
- Test: `tests/platform_api/test_customer_audits.py`
- Test: `tests/dashboard-audits.spec.ts`

**Interfaces:**
- Produces tenant-safe read models from existing audit evidence; no dashboard endpoint mutates the lead pipeline.

- [ ] **Step 1: Write failing tests that map only paid/authorized customer records and redact internal lead notes, raw email data, and unrelated domains**
- [ ] **Step 2: Implement an adapter that projects existing audit/delivery evidence into customer-safe DTOs**
- [ ] **Step 3: Add list/detail pages with freshness timestamp, explicit processing/delivered/failed states, and accessible score presentation**
- [ ] **Step 4: Assert foreign audit IDs return 404 and list pagination cannot escape tenant scope**
- [ ] **Step 5: Run API, existing audit, and browser tests**
- [ ] **Step 6: Commit as `feat: expose customer audit delivery status`**

### Task 6: Entitlement and feature-flag release gate

**Files:**
- Create: `platform_api/services/entitlements.py`
- Create: `web/src/lib/auth/entitlements.ts`
- Create: `config/entitlement-products.json`
- Test: `tests/platform_api/test_entitlements.py`
- Test: `tests/dashboard-entitlements.spec.ts`

**Interfaces:**
- Produces backend `require_entitlement(code)` and frontend presentational `hasEntitlement(me, code)`.

- [ ] **Step 1: Write failing tests covering paid, trial, grace, past-due, canceled, operator-granted, expired, and unknown entitlements**
- [ ] **Step 2: Implement backend enforcement and append-only grant/revoke audit events**
- [ ] **Step 3: Hide unavailable navigation while ensuring direct URL/API access is also denied server-side**
- [ ] **Step 4: Enable `customer_dashboard` only for internal Nebula tenant and one Stripe test customer**
- [ ] **Step 5: Run complete dashboard, billing, and tenant-isolation suites**
- [ ] **Step 6: Commit as `feat: gate dashboard capabilities by entitlement`**
