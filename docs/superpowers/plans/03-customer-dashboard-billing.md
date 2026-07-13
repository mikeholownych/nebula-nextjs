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

### Task 3: Normalize Stripe billing state

**Files:**
- Create: `platform_api/services/billing_sync.py`
- Create: `platform_api/repositories/subscriptions.py`
- Create: `platform_api/schemas/billing.py`
- Modify: `stripe_webhook.py`
- Test: `tests/platform_api/test_billing_sync.py`
- Test: `tests/test_stripe_webhook_platform_sync.py`

**Interfaces:**
- Consumes verified Stripe events from existing webhook handler.
- Produces `sync_stripe_event(event_id: str, event_type: str, payload: Mapping[str, Any]) -> BillingSyncResult` and normalized subscriptions/entitlements.

- [ ] **Step 1: Write failing tests for checkout completion, subscription create/update/delete, payment failure, duplicate event, out-of-order event, unknown customer, and test/live mode mismatch**
- [ ] **Step 2: Add a narrow adapter call from the existing verified webhook handler after signature validation**

```python
result = sync_stripe_event(
    event_id=event["id"],
    event_type=event["type"],
    payload=event["data"]["object"],
)
```

The existing webhook response behavior must remain compatible even if platform synchronization records a retriable failure.

- [ ] **Step 3: Map Stripe product/price IDs to explicit entitlement codes in versioned configuration**
- [ ] **Step 4: Persist provider event before mutation and use Stripe event creation time to reject stale state regressions**
- [ ] **Step 5: Run existing webhook tests plus platform billing tests**
- [ ] **Step 6: Commit as `feat: synchronize Stripe billing entitlements`**

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

- [ ] **Step 1: Write failing authorization tests proving only authorized organization members can create a portal session for that organization's Stripe customer**
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
