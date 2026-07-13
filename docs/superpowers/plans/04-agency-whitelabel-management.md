# Agency and White-Label Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver tenant-safe agency client management and controlled white-label branding, first on managed subdomains and then on verified custom domains.

**Architecture:** Agencies and clients are separate organizations connected through explicit relationship rows. Branding is an allowlisted data model rendered by Next.js; arbitrary CSS/JS is prohibited. Hostnames resolve through verified domain claims, with Cloudflare certificate activation treated as an asynchronous state machine.

**Tech Stack:** Next.js 16.2.10, FastAPI, PostgreSQL, SQLAlchemy, Cloudflare API, object storage compatible with signed uploads, Playwright, pytest.

## Global Constraints

- Agency users receive no access to a client until an active relationship and membership permission both exist.
- Brand inputs are validated values, not arbitrary HTML, CSS, or JavaScript.
- Custom domains do not serve traffic until DNS ownership and certificate activation succeed.
- Domain removal and agency/client unlinking are reversible and audited.
- Start with managed subdomains; custom domains are a separate release gate.

---

### Task 1: Implement agency-client relationships

**Files:**
- Create: `platform_api/api/v1/agency_clients.py`
- Create: `platform_api/services/agency_clients.py`
- Create: `platform_api/repositories/agency_clients.py`
- Create: `web/src/app/(dashboard)/dashboard/clients/page.tsx`
- Create: `web/src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx`
- Create: `web/src/components/dashboard/ClientTable.tsx`
- Test: `tests/platform_api/test_agency_clients.py`
- Test: `tests/dashboard-agency-clients.spec.ts`

**Interfaces:**
- Produces agency client list/create/invite/suspend/unlink operations and client-scoped detail reads.

- [ ] **Step 1: Write failing tests for create, duplicate, accept, suspend, unlink, role restrictions, client self-access, and cross-agency IDOR**
- [ ] **Step 2: Implement relationship state machine `invited -> active -> suspended -> unlinked`; disallow invalid transitions**
- [ ] **Step 3: Require audit reasons for suspend/unlink and write append-only audit events**
- [ ] **Step 4: Build client list/detail pages with explicit status and no data leakage in counts or pagination**
- [ ] **Step 5: Run API and browser tests**
- [ ] **Step 6: Commit as `feat: add agency client management`**

### Task 2: Add safe brand profiles

**Files:**
- Create: `platform_api/api/v1/branding.py`
- Create: `platform_api/schemas/branding.py`
- Create: `platform_api/services/branding.py`
- Create: `web/src/app/(dashboard)/dashboard/branding/page.tsx`
- Create: `web/src/components/dashboard/BrandEditor.tsx`
- Create: `web/src/components/dashboard/BrandPreview.tsx`
- Create: `web/src/lib/tenancy/brand-css.ts`
- Test: `tests/platform_api/test_branding.py`
- Test: `web/src/lib/tenancy/brand-css.test.ts`

**Interfaces:**
- Produces `BrandProfile` fields: display name, logo asset ID, primary/secondary/accent colors, support email, footer text, and enabled flag; `brandCssVariables(profile) -> Record<string,string>`.

- [ ] **Step 1: Write failing schema tests for valid colors, disallowed CSS tokens, invalid emails, overlong copy, SVG script payloads, and foreign assets**
- [ ] **Step 2: Implement strict Pydantic and Zod schemas with matching limits**
- [ ] **Step 3: Emit only fixed CSS custom properties**

```ts
return {
  '--brand-primary': profile.primaryColor,
  '--brand-secondary': profile.secondaryColor,
  '--brand-accent': profile.accentColor,
}
```

- [ ] **Step 4: Build editor and isolated preview; preview never executes agency-supplied markup**
- [ ] **Step 5: Run schema, XSS, contrast, and browser tests**
- [ ] **Step 6: Commit as `feat: add safe agency brand profiles`**

### Task 3: Add secure logo uploads

**Files:**
- Create: `platform_api/api/v1/assets.py`
- Create: `platform_api/services/assets.py`
- Create: `platform_api/adapters/object_storage.py`
- Create: `web/src/components/dashboard/LogoUpload.tsx`
- Test: `tests/platform_api/test_brand_assets.py`

**Interfaces:**
- Produces signed upload initiation/finalization and tenant-scoped immutable asset records.

- [ ] **Step 1: Write failing tests for MIME spoofing, excessive size, script-bearing SVG, path injection, expired signature, replay, and cross-tenant asset assignment**
- [ ] **Step 2: Allow PNG, JPEG, and WebP initially; reject SVG until a proven sanitizer is added**
- [ ] **Step 3: Use randomized keys under `organizations/{organization_id}/brand/`; store checksum, detected MIME, dimensions, and size**
- [ ] **Step 4: Finalize only after server-side metadata validation; abandoned uploads expire automatically**
- [ ] **Step 5: Run upload and browser tests**
- [ ] **Step 6: Commit as `feat: add tenant-safe brand assets`**

### Task 4: Release managed agency subdomains

**Files:**
- Create: `platform_api/services/tenant_hosts.py`
- Create: `platform_api/api/v1/domains.py`
- Create: `web/src/lib/tenancy/resolve-host.ts`
- Modify: `web/src/proxy.ts`
- Create: `web/src/app/(whitelabel)/portal/page.tsx`
- Test: `tests/platform_api/test_managed_subdomains.py`
- Test: `tests/managed-subdomain-isolation.spec.ts`

**Interfaces:**
- Produces unique normalized agency slugs and host resolution for `{slug}.app.nebulacomponents.shop`.

- [ ] **Step 1: Write failing tests for reserved names, Unicode confusables, duplicate slugs, mixed case, trailing dots, unknown hosts, and host-header injection**
- [ ] **Step 2: Normalize hostnames with IDNA, exact suffix matching, lowercase, and trailing-dot removal**
- [ ] **Step 3: Cache positive host resolutions briefly; do not cache unauthorized data in shared page caches**
- [ ] **Step 4: Render branded shell while backend requests remain scoped to authenticated organization permissions**
- [ ] **Step 5: Prove two agency subdomains cannot observe each other's brand, clients, cache, or assets**
- [ ] **Step 6: Commit as `feat: add managed agency subdomains`**

### Task 5: Implement custom-domain ownership workflow

**Files:**
- Create: `platform_api/services/domain_claims.py`
- Create: `platform_api/adapters/cloudflare_custom_hostnames.py`
- Create: `platform_api/workers/domain_reconciler.py`
- Create: `web/src/app/(dashboard)/dashboard/branding/domains/page.tsx`
- Create: `web/src/components/dashboard/DomainVerification.tsx`
- Test: `tests/platform_api/test_domain_claims.py`
- Test: `tests/platform_api/test_cloudflare_hostname_adapter.py`

**Interfaces:**
- Produces state machine `pending_dns -> verifying -> certificate_pending -> active -> disabled`; provider adapter methods `create_hostname`, `get_hostname`, and `delete_hostname`.

- [ ] **Step 1: Write failing state-transition, duplicate-domain, ownership, provider-timeout, certificate-failure, and deletion tests**
- [ ] **Step 2: Generate a random verification token; store only its hash and display the plaintext once**
- [ ] **Step 3: Resolve DNS with bounded timeouts and reject private/internal targets, wildcard claims, apex ambiguity, and already-owned domains**
- [ ] **Step 4: Activate routing only after Cloudflare reports an active certificate**
- [ ] **Step 5: Reconcile pending/failed domains idempotently and audit every transition**
- [ ] **Step 6: Run adapter fixture tests and staging DNS/certificate test**
- [ ] **Step 7: Commit as `feat: add verified agency custom domains`**

### Task 6: White-label release gate

**Files:**
- Create: `tests/whitelabel-security.spec.ts`
- Create: `scripts/verify_tenant_hosts.py`
- Create: `docs/runbooks/whitelabel-domains.md`

**Interfaces:**
- Produces a blocking host-isolation and rollback verification command.

- [ ] **Step 1: Test unknown, disabled, suspended, managed, and custom hosts against authenticated and anonymous users**
- [ ] **Step 2: Test cache keys include resolved tenant and never share protected HTML/data across hosts**
- [ ] **Step 3: Test domain disable immediately removes branded routing while preserving audit history**
- [ ] **Step 4: Exercise Cloudflare hostname rollback in staging**
- [ ] **Step 5: Run platform API, Next, and Playwright white-label suites**
- [ ] **Step 6: Commit as `test: gate white-label release on tenant isolation`**
