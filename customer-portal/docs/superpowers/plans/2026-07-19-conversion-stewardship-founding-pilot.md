# Conversion Stewardship Founding Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the minimum secure operating system required to deliver Nebula Conversion Stewardship to no more than three consenting founding customers at $2,500 per month.

**Architecture:** Extend the existing Next.js 16 application with a small raw-PostgreSQL service domain, encrypted Google OAuth connections, read-only Google Ads v24 and GA4 Data API v1 adapters, deterministic privacy suppression, an evidence/initiative ledger, private invitation and subscription flows, and an operator CLI. The founding pilot deliberately does not build a customer login or live dashboard; it produces customer-owned Markdown and JSON evidence bundles from an auditable operator workflow.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript 5.9.3, Node 24, PostgreSQL via `pg`, Jest 30, Google OAuth via `googleapis`, Google Ads API v24 REST, Google Analytics Data API v1 REST, Stripe 22, AgentMail, Playwright/browser QA through the existing Hermes browser tools.

## Global Constraints

- Initial capacity is exactly three concurrent founding customers.
- Price is exactly $2,500 per month with a 90-day initial contractual term.
- Google Ads is evidence-only: no mutate endpoint, campaign operation, bid, budget, keyword, targeting, or creative code may exist.
- Google Ads OAuth uses the `https://www.googleapis.com/auth/adwords` scope because Google exposes no narrower reporting scope; the customer must grant the connecting Google identity a read-only Google Ads account role, and Nebula's adapter must expose only `Search` reporting calls.
- GA4 OAuth uses `https://www.googleapis.com/auth/analytics.readonly`.
- Google Ads API version is `v24`, verified against Google's 2026-07-07 release notes; version upgrades require a separate tested migration.
- Version one supports Google Ads and GA4 only.
- No raw search terms are stored. Use Google's privacy-thresholded `campaign_search_term_insight` category labels for intent context.
- No user-level GA4 export, audience export, GCLID, client ID, fingerprint, identity resolution, or individual visitor statistic is permitted.
- Minimum cohort size of 20 applies to stored Google Ads and GA4 behavioral evidence; smaller rows are suppressed or rolled up before persistence. Rendered experience and intervention records contain no visitor cohort and store `NULL` for cohort size.
- Only minimized aggregate evidence may enter an LLM. The founding-pilot diagnostic engine is deterministic and does not require an LLM.
- Refresh tokens are encrypted with AES-256-GCM using a versioned envelope and a 32-byte base64 environment key.
- Credentials are revoked and deleted immediately at termination; operational aggregate data is deleted within 30 days.
- Customer reports and intervention history are exportable before deletion.
- No public self-serve monthly checkout is created.
- No customer dashboard or customer authentication system is created in the founding pilot.
- All private operator routes fail closed when `INTERNAL_API_SECRET` is absent or invalid.
- All public invite tokens are random, single-purpose, stored only as SHA-256 hashes, expire, and are single-use where specified.
- Every production implementation requires rendered-browser QA, form/event verification, mobile checks, WCAG AA checks, and rollback instructions.
- Existing unrelated dirty files must not be staged. Each task commits only its named files.
- Legacy files are archived under `.legacy/` with `.legacy/ARCHIVE_INVENTORY.md`; nothing is deleted without an inventory entry.
- Use TDD: failing focused test, minimal implementation, passing focused test, then relevant suite.

## File Map

### Database and service core

- `db/migrations/2026071901_stewardship_core.sql` — clients, applications, tokens, OAuth connections, evidence, initiatives, interventions, billing events, audit events, deletion queue.
- `scripts/run-migrations.mjs` — idempotent SQL migration runner and `schema_migrations` ledger.
- `app/lib/stewardship/types.ts` — shared domain types and literal unions.
- `app/lib/stewardship/repository.ts` — parameterized PostgreSQL persistence only.
- `app/lib/stewardship/crypto.ts` — AES-256-GCM envelope encryption and token hashing.
- `app/lib/stewardship/auth.ts` — internal bearer authorization and public invite validation.

### Customer connection and data ingestion

- `app/lib/stewardship/google-oauth.ts` — authorization URL, code exchange, refresh, revocation.
- `app/lib/stewardship/google-ads.ts` — Google Ads v24 reporting-only REST adapter.
- `app/lib/stewardship/ga4.ts` — GA4 Data API v1 reporting-only REST adapter.
- `app/lib/stewardship/privacy.ts` — URL sanitization, cohort suppression, allowed dimensions, canonicalization.
- `app/lib/stewardship/sync.ts` — orchestrated collection and atomic snapshot persistence.
- `app/api/stewardship/google/connect/route.ts` — invite-bound OAuth start.
- `app/api/stewardship/google/callback/route.ts` — OAuth callback and encrypted token persistence.

### Offer workflow and evidence delivery

- `app/lib/stewardship/readiness.ts` — application validation and deterministic readiness status.
- `app/lib/stewardship/diagnostics.ts` — evidence-backed Leak Map candidates and claim labels.
- `app/lib/stewardship/report.ts` — Markdown and JSON customer bundle generation.
- `scripts/stewardship.ts` — operator commands for invite, accept, sync, initiative, export, checkout, terminate, and purge.
- `app/conversion-stewardship/apply/[token]/page.tsx` — private noindex application page.
- `components/stewardship/ApplicationForm.tsx` — accessible application form.
- `app/api/stewardship/apply/route.ts` — token-bound application submission.
- `app/api/internal/stewardship/sync/route.ts` — authenticated sync endpoint.
- `app/api/internal/stewardship/export/route.ts` — authenticated evidence bundle export.
- `app/api/internal/stewardship/checkout/route.ts` — authenticated private Stripe subscription session creation.

### Existing surfaces to modify

- `package.json` and `package-lock.json` — migration/operator scripts and `googleapis`/`tsx` dependencies.
- `app/api/webhooks/stripe/route.ts` — persist subscription lifecycle idempotently.
- `app/pricing/page.tsx` — make the no-retainer claim Fix-Pack-specific and disclose invitation-only stewardship without public checkout.
- `app/privacy-policy/page.tsx` — aggregate evidence, OAuth, retention, processor, and deletion disclosures.
- `app/terms/page.tsx` — 90-day term, monthly billing, service credit, off-ramp, exclusions, and ownership.
- `app/sitemap.ts` — ensure private application routes are absent.
- `.gitignore` — exclude generated customer exports and local secrets.
- `.env.example` — document names only; never include values.
- `.legacy/ARCHIVE_INVENTORY.md` — archive provenance.
- `__tests__/stewardship/*.test.ts` — focused service tests.
- `__tests__/containment/production-safety.test.ts` — recursive route and public-copy containment.

---

### Task 1: Repository Hygiene and Migration Foundation

**Files:**
- Create: `db/migrations/2026071901_stewardship_core.sql`
- Create: `scripts/run-migrations.mjs`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `.env.example`
- Modify: `.legacy/ARCHIVE_INVENTORY.md`
- Move: quarantined prototype route directories identified by `notFound()` from `app/` to `.legacy/app/2026-07-19/`
- Modify: `__tests__/containment/production-safety.test.ts`
- Test: `__tests__/stewardship/migrations.test.ts`

**Interfaces:**
- Consumes: existing `PGHOST`, `PGPORT`, `PGDATABASE`, and `PGUSER` database configuration.
- Produces: `npm run db:migrate`; PostgreSQL tables keyed by UUID; a clean active App Router without quarantined stubs.

- [ ] **Step 1: Inventory quarantined routes before moving them**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
for page in sorted(Path('app').rglob('page.tsx')):
    text = page.read_text()
    if 'notFound()' in text and 'CASE_STUDIES' not in text:
        print(page.parent)
PY
```

Expected: only explicit prototype/alias routes appear. Record every source path, destination path, archive date, reason, and replacement/404 behavior in `.legacy/ARCHIVE_INVENTORY.md`; do not move dynamic routes that legitimately call `notFound()` for unknown IDs.

- [ ] **Step 2: Write the failing migration contract test**

```ts
// __tests__/stewardship/migrations.test.ts
import { readFileSync } from 'node:fs'

const sql = readFileSync('db/migrations/2026071901_stewardship_core.sql', 'utf8')

test('stewardship schema contains every privacy and lifecycle boundary', () => {
  for (const table of [
    'stewardship_clients', 'stewardship_applications', 'stewardship_tokens',
    'stewardship_connections', 'stewardship_evidence', 'stewardship_initiatives',
    'stewardship_interventions', 'stewardship_intervention_evidence',
    'stewardship_billing_events', 'stewardship_audit_events',
    'stewardship_deletion_queue',
  ]) expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
  expect(sql).toContain("source IN ('google_ads','ga4') AND cohort_size >= 20")
  expect(sql).toContain("source IN ('experience','intervention') AND cohort_size IS NULL")
  expect(sql).toContain('UNIQUE (provider, provider_event_id)')
  expect(sql).not.toMatch(/gclid|client_id_value|visitor_id/i)
})
```

- [ ] **Step 3: Run the focused test and verify RED**

Run: `npm test -- --runInBand __tests__/stewardship/migrations.test.ts`

Expected: FAIL because the migration file does not exist.

- [ ] **Step 4: Create the core schema**

The migration must use `CREATE EXTENSION IF NOT EXISTS pgcrypto`, UUID primary keys, foreign keys with explicit delete behavior, `TIMESTAMPTZ`, parameter-friendly JSONB, and these exact invariants:

```sql
CREATE TABLE IF NOT EXISTS stewardship_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  primary_url TEXT NOT NULL,
  conversion_action TEXT NOT NULL,
  conversion_value_cents BIGINT CHECK (conversion_value_cents IS NULL OR conversion_value_cents >= 0),
  status TEXT NOT NULL CHECK (status IN ('foundation','active','paused','terminated')),
  started_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  delete_after TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stewardship_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES stewardship_clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('application','google_connect')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stewardship_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES stewardship_clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider = 'google'),
  encrypted_refresh_token JSONB,
  granted_scopes TEXT[] NOT NULL,
  ads_customer_id TEXT NOT NULL,
  ads_login_customer_id TEXT,
  ga4_property_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','revoked','error')),
  last_synced_at TIMESTAMPTZ,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider)
);

CREATE TABLE IF NOT EXISTS stewardship_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES stewardship_clients(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('google_ads','ga4','experience','intervention')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dimensions JSONB NOT NULL,
  metrics JSONB NOT NULL,
  cohort_size INTEGER,
  provenance_hash TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL,
  CHECK (
    (source IN ('google_ads','ga4') AND cohort_size >= 20)
    OR (source IN ('experience','intervention') AND cohort_size IS NULL)
  ),
  UNIQUE (client_id, source, period_start, period_end, provenance_hash)
);
```

Add the remaining tables exactly as follows:

```sql
CREATE TABLE IF NOT EXISTS stewardship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES stewardship_tokens(id) ON DELETE SET NULL,
  client_id UUID REFERENCES stewardship_clients(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  primary_url TEXT NOT NULL,
  conversion_action TEXT NOT NULL,
  ads_customer_id TEXT NOT NULL,
  ads_login_customer_id TEXT,
  ga4_property_id TEXT NOT NULL,
  readiness_input JSONB NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('accepted','foundation_candidate','not_ready')),
  reason_codes TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted','accepted','declined')) DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  delete_after TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stewardship_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES stewardship_clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('traffic_intent','message_handoff','conversion_experience','measurement','offer')),
  hypothesis TEXT NOT NULL,
  acceptance_criteria JSONB NOT NULL,
  rollback_plan TEXT NOT NULL,
  measurement_plan TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed','approved','implementing','verifying','shipped','measuring','closed')),
  priority_interrupt BOOLEAN NOT NULL DEFAULT false,
  claim_label TEXT CHECK (claim_label IS NULL OR claim_label IN ('observed','directional','supported','controlled')),
  approved_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, period_start)
);

CREATE TABLE IF NOT EXISTS stewardship_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES stewardship_clients(id) ON DELETE CASCADE,
  initiative_id UUID NOT NULL REFERENCES stewardship_initiatives(id) ON DELETE CASCADE,
  production_url TEXT NOT NULL,
  deployment_reference TEXT NOT NULL,
  rollback_reference TEXT NOT NULL,
  changed_files JSONB NOT NULL,
  qa_evidence JSONB NOT NULL,
  confounders TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stewardship_intervention_evidence (
  intervention_id UUID NOT NULL REFERENCES stewardship_interventions(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES stewardship_evidence(id) ON DELETE RESTRICT,
  PRIMARY KEY (intervention_id, evidence_id)
);

CREATE TABLE IF NOT EXISTS stewardship_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES stewardship_clients(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider = 'stripe'),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  customer_id TEXT,
  subscription_id TEXT,
  invoice_id TEXT,
  amount_cents BIGINT CHECK (amount_cents IS NULL OR amount_cents >= 0),
  currency TEXT,
  status TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS stewardship_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES stewardship_clients(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer','operator','system','provider')),
  event_type TEXT NOT NULL,
  safe_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stewardship_deletion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES stewardship_clients(id) ON DELETE CASCADE,
  execute_after TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed')) DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (client_id)
);
```

- [ ] **Step 5: Implement the migration runner**

`scripts/run-migrations.mjs` must create `schema_migrations(filename TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`, execute unapplied SQL in a transaction, and abort if an applied filename's SHA-256 changes. Add:

```json
"db:migrate": "node scripts/run-migrations.mjs",
"stewardship": "tsx scripts/stewardship.ts"
```

Install `tsx` as a dev dependency. Add `stewardship-exports/` and `.env.local` to `.gitignore`. Add only variable names to `.env.example`: `STEWARDSHIP_ENCRYPTION_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `STRIPE_STEWARDSHIP_PRICE_ID`, and `INTERNAL_API_SECRET`.

- [ ] **Step 6: Move quarantined stubs and strengthen recursive containment**

Move only inventoried prototype directories to `.legacy/app/2026-07-19/`. Replace the hard-coded import-based unsupported-route test with a recursive assertion that archived source directories no longer exist in `app/`, remain present in `.legacy/`, and resolve as 404 in a production browser test. Preserve all active public routes.

- [ ] **Step 7: Verify schema and repository hygiene**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/migrations.test.ts __tests__/containment/production-safety.test.ts
npm run db:migrate
npm run db:migrate
git diff --check
```

Expected: tests PASS; first migration applies; second reports no pending migrations; no whitespace errors.

- [ ] **Step 8: Commit**

Stage only the migration files, test files, manifest files, inventory, the exact archived destinations recorded in the inventory, and deletion records for those same exact source paths. Verify `git diff --cached --name-only` contains no other active application file before committing:

```bash
git add db/migrations/2026071901_stewardship_core.sql scripts/run-migrations.mjs package.json package-lock.json .gitignore .env.example .legacy/ARCHIVE_INVENTORY.md .legacy/app/2026-07-19 __tests__/stewardship/migrations.test.ts __tests__/containment/production-safety.test.ts
git add -u -- app/accessible-nebula app/agency-partner app/ai-ops-retainer app/audit-dashboard app/audits app/beta-tester app/component-showcase app/dashboard app/demo app/generator app/growth-launch app/growth-launch-confirmation app/lead-dashboard app/marketing-ops app/organization app/subscription app/checkout-impulse app/checkout-v2 app/create-97-checkout app/launch-page-97 app/part-after app/part-before app/ad-burn-leaderboard app/audit/results app/audit/sample
git diff --cached --name-only
git commit -m "chore(stewardship): establish schema and archive prototypes"
```

### Task 2: Domain Types, Repository, Encryption, and Audit Trail

**Files:**
- Create: `app/lib/stewardship/types.ts`
- Create: `app/lib/stewardship/repository.ts`
- Create: `app/lib/stewardship/crypto.ts`
- Create: `app/lib/stewardship/auth.ts`
- Test: `__tests__/stewardship/crypto.test.ts`
- Test: `__tests__/stewardship/repository.test.ts`
- Test: `__tests__/stewardship/auth.test.ts`

**Interfaces:**
- Produces: `EncryptedEnvelope`, `encryptSecret(plaintext, key)`, `decryptSecret(envelope, key)`, `hashPublicToken(token)`, `isInternalRequest(request)`, and a `StewardshipRepository` with parameterized methods used by all later tasks.

- [ ] **Step 1: Define exact domain unions**

```ts
export type ClaimLabel = 'observed' | 'directional' | 'supported' | 'controlled'
export type ClientStatus = 'foundation' | 'active' | 'paused' | 'terminated'
export type InitiativeStatus = 'proposed' | 'approved' | 'implementing' | 'verifying' | 'shipped' | 'measuring' | 'closed'
export type EvidenceSource = 'google_ads' | 'ga4' | 'experience' | 'intervention'
export type EncryptedEnvelope = { v: 1; alg: 'A256GCM'; iv: string; tag: string; ciphertext: string }
```

- [ ] **Step 2: Write crypto RED tests**

Test round-trip, wrong-key failure, modified-tag failure, non-deterministic IVs, exact envelope version, SHA-256 token hashing, and rejection of keys not exactly 32 decoded bytes.

Run: `npm test -- --runInBand __tests__/stewardship/crypto.test.ts`

Expected: FAIL because exports do not exist.

- [ ] **Step 3: Implement AES-256-GCM**

Use `node:crypto` only. `encryptSecret` must use a fresh 12-byte IV and return base64url fields. `decryptSecret` must authenticate before returning plaintext. `loadEncryptionKey()` must decode `STEWARDSHIP_ENCRYPTION_KEY` from base64 and throw `STEWARDSHIP_ENCRYPTION_KEY_INVALID` unless it is 32 bytes. Never log plaintext, key material, envelopes, authorization codes, or tokens.

- [ ] **Step 4: Implement internal auth and repository contracts**

`isInternalRequest` must compare `Authorization: Bearer <secret>` with `timingSafeEqual`, and return false when the environment secret is absent. The repository must accept a `Pool | PoolClient` in its constructor and expose parameterized methods for applications, tokens, clients, connections, evidence, initiatives, interventions, billing events, audit events, and deletion jobs. No SQL string may interpolate customer-controlled values.

- [ ] **Step 5: Test auditability and idempotency**

Use a mocked query client to assert placeholders (`$1`, `$2`) and values arrays. Verify `saveBillingEvent()` maps PostgreSQL unique violations to `{ inserted: false }` rather than processing a Stripe event twice.

Run:

```bash
npm test -- --runInBand __tests__/stewardship/crypto.test.ts __tests__/stewardship/repository.test.ts __tests__/stewardship/auth.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/lib/stewardship __tests__/stewardship/crypto.test.ts __tests__/stewardship/repository.test.ts __tests__/stewardship/auth.test.ts
git commit -m "feat(stewardship): add secure domain repository"
```

### Task 3: Private Invitation, Application, and Readiness Workflow

**Files:**
- Create: `app/lib/stewardship/readiness.ts`
- Create: `components/stewardship/ApplicationForm.tsx`
- Create: `app/conversion-stewardship/apply/[token]/page.tsx`
- Create: `app/api/stewardship/apply/route.ts`
- Create: `scripts/stewardship.ts`
- Test: `__tests__/stewardship/readiness.test.ts`
- Test: `__tests__/stewardship/application-route.test.ts`
- Test: `__tests__/stewardship/application-page.test.tsx`

**Interfaces:**
- Consumes: repository token/application methods and `hashPublicToken`.
- Produces: `assessReadiness(input): ReadinessDecision`; CLI `invite` and `accept` commands; private application submission.

- [ ] **Step 1: Write readiness RED tests**

Use this exact input shape:

```ts
export type ReadinessInput = {
  primaryUrl: string
  conversionAction: string
  monthlyPaidSessions: number
  conversionValueCents: number | null
  hasGoogleAds30d: boolean
  hasGa4: boolean
  hasConsentAwareAnalytics: boolean
  canGrantImplementationAccess: boolean
  supportedStack: boolean
  wantsAdManagement: boolean
}
```

Assert `not_ready` for no recent Ads, no primary action, unsupported stack, no implementation access, or ad-management intent; assert `foundation_candidate` when tracking/GA4 is repairable; assert `accepted` only when hard gates pass. The function must return machine-readable reason codes, not a fabricated ROI estimate.

- [ ] **Step 2: Implement random invite creation**

`invite` generates 32 random bytes with `randomBytes`, stores only `sha256(token)`, sets a seven-day expiry, and prints one private HTTPS application URL once. It must reject creation when three clients already have `foundation` or `active` status.

Run: `npm run stewardship -- invite --email test@example.com`

Expected with a test database: one URL containing an opaque token; the database contains only its hash.

- [ ] **Step 3: Build the private application route and page**

The page metadata must set `robots: { index: false, follow: false }`. Invalid, expired, or consumed tokens call `notFound()`. The accessible form collects only the approved readiness fields plus company name, contact email, Ads customer ID, optional manager login customer ID, and GA4 property ID. It must not collect campaign-edit authority, visitor identifiers, or raw customer data.

- [ ] **Step 4: Implement atomic submission**

`POST /api/stewardship/apply` receives `{ token, ...ReadinessInput, companyName, email, adsCustomerId, adsLoginCustomerId, ga4PropertyId }`. In one transaction it locks the token row, rejects expired/consumed tokens, saves the application and decision, marks the application token consumed, and writes an audit event. Duplicate submission returns 409.

- [ ] **Step 5: Implement atomic operator acceptance and decline**

`npm run stewardship -- accept --application <uuid>` must lock the application, re-run `assessReadiness`, count clients in `foundation` or `active`, and reject when the count is three. For `accepted` or `foundation_candidate`, create one client with status `foundation`, link `stewardship_applications.client_id`, mark the application `accepted`, create a new seven-day single-purpose `google_connect` token, and print its private HTTPS URL once. For `not_ready`, `npm run stewardship -- decline --application <uuid>` marks the application `declined`, sets `delete_after = now() + interval '30 days'`, and creates no client or connect token. Both commands write safe audit events and are idempotent on replay.

- [ ] **Step 6: Verify privacy, noindex, capacity, and accessibility**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/readiness.test.ts __tests__/stewardship/application-route.test.ts __tests__/stewardship/application-page.test.tsx
npm run typecheck
npm run lint
```

Expected: PASS; page has named labels, keyboard-submit support, visible errors, and no indexing metadata. The fourth concurrent acceptance is rejected without creating a client.

- [ ] **Step 7: Commit**

```bash
git add app/lib/stewardship/readiness.ts components/stewardship app/conversion-stewardship app/api/stewardship/apply scripts/stewardship.ts __tests__/stewardship
git commit -m "feat(stewardship): add private readiness application"
```

### Task 4: Google OAuth Connection and Revocation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `app/lib/stewardship/google-oauth.ts`
- Create: `app/api/stewardship/google/connect/route.ts`
- Create: `app/api/stewardship/google/callback/route.ts`
- Test: `__tests__/stewardship/google-oauth.test.ts`
- Test: `__tests__/stewardship/google-oauth-routes.test.ts`

**Interfaces:**
- Produces: `createAuthorizationUrl(state)`, `exchangeAuthorizationCode(code)`, `getAccessToken(connection)`, `revokeGoogleConnection(connection)`.
- Requires: accepted client, purpose-specific `google_connect` token, Google OAuth environment variables, encrypted storage.

- [ ] **Step 1: Install the official Google Node client**

Run: `npm install googleapis`

Expected: `googleapis` appears in dependencies and lockfile resolves without audit failure introduced by the package.

- [ ] **Step 2: Write OAuth RED tests**

Assert authorization URL contains both approved scopes, `access_type=offline`, `include_granted_scopes=true`, `prompt=consent`, exact HTTPS callback URI, and signed state. Assert callback rejects missing state, expired token, scope omission, missing refresh token, and reused connect token.

- [ ] **Step 3: Implement signed, invite-bound state**

State payload is `{ tokenId, nonce, exp }`; sign canonical JSON with HMAC-SHA256 using `INTERNAL_API_SECRET`. Store the nonce hash with the connect token. Callback must compare signature, expiry, nonce, and token purpose before exchanging the authorization code.

- [ ] **Step 4: Exchange and persist only required credentials**

Require granted scopes to include `adwords` and `analytics.readonly`. Encrypt the refresh token immediately, discard access tokens after verification, persist selected Ads/GA4 IDs from the accepted application, consume the connect token, and write an audit event without token material.

- [ ] **Step 5: Implement revocation**

Call `https://oauth2.googleapis.com/revoke` with the decrypted refresh token. Treat HTTP 200 and `invalid_token` as terminal revocation states; mark the connection `revoked`, overwrite encrypted token storage with a non-secret revocation marker, and write an audit event.

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/google-oauth.test.ts __tests__/stewardship/google-oauth-routes.test.ts
npm run typecheck
```

Expected: PASS with HTTP mocked; no secret values appear in snapshots or console output.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app/lib/stewardship/google-oauth.ts app/api/stewardship/google __tests__/stewardship/google-oauth.test.ts __tests__/stewardship/google-oauth-routes.test.ts
git commit -m "feat(stewardship): add encrypted Google OAuth connection"
```

### Task 5: Read-Only Google Ads and GA4 Adapters

**Files:**
- Create: `app/lib/stewardship/google-ads.ts`
- Create: `app/lib/stewardship/ga4.ts`
- Test: `__tests__/stewardship/google-ads.test.ts`
- Test: `__tests__/stewardship/ga4.test.ts`

**Interfaces:**
- Produces: `fetchAdsEvidence(input): Promise<AdsEvidenceRow[]>`; `fetchGa4Evidence(input): Promise<Ga4EvidenceRow[]>`.
- Consumes: short-lived access token, accepted account/property IDs, date range.

- [ ] **Step 1: Write a static mutation-surface RED test**

The test must inspect `google-ads.ts` and reject `mutate`, `create`, `update`, `remove`, `upload`, and any Google Ads URL not ending in `googleAds:search`. It must require `/v24/` and headers `developer-token`, `authorization`, and optional `login-customer-id`.

- [ ] **Step 2: Implement Ads reporting queries**

Use paginated `POST https://googleads.googleapis.com/v24/customers/{customerId}/googleAds:search` only. Implement two constant GAQL queries:

1. `landing_page_view` by date, campaign, unexpanded final URL, and device with impressions, clicks, cost micros, conversions, and conversion value.
2. `campaign_search_term_insight` using Google-provided category labels and aggregate metrics; never request or store raw search-term text.

Normalize customer IDs to digits and reject any other format. Set a 30-second timeout, cap pages, retry 429/503 twice with jitter, and return typed provider errors containing only status, request ID, and safe code.

- [ ] **Step 3: Implement GA4 reports**

Call `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`. Use dimensions `date`, `landingPage`, `sessionSourceMedium`, and `deviceCategory`; metrics `sessions`, `engagedSessions`, `keyEvents`, and `totalRevenue`. Strip URL queries/fragments before returning rows. Do not call audience export, realtime user, or user-level methods.

- [ ] **Step 4: Verify adapters with fixtures**

Tests must cover Ads pagination, login-customer header omission/presence, REST error redaction, GA4 threshold flags, URL query stripping, numeric parsing, and no mutation strings.

Run:

```bash
npm test -- --runInBand __tests__/stewardship/google-ads.test.ts __tests__/stewardship/ga4.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/stewardship/google-ads.ts app/lib/stewardship/ga4.ts __tests__/stewardship/google-ads.test.ts __tests__/stewardship/ga4.test.ts
git commit -m "feat(stewardship): add reporting-only Google adapters"
```

### Task 6: Privacy Normalization and Atomic Evidence Sync

**Files:**
- Create: `app/lib/stewardship/privacy.ts`
- Create: `app/lib/stewardship/sync.ts`
- Create: `app/api/internal/stewardship/sync/route.ts`
- Test: `__tests__/stewardship/privacy.test.ts`
- Test: `__tests__/stewardship/sync.test.ts`
- Test: `__tests__/stewardship/internal-sync-route.test.ts`

**Interfaces:**
- Produces: `normalizeEvidence(rows)`, `canonicalEvidenceHash(record)`, `syncClientEvidence(clientId, range)`.
- Consumes: adapters, repository, encrypted connection.

- [ ] **Step 1: Write privacy RED tests**

Assert rows below 20 are not returned; equivalent suppressed rows may be rolled up only after removing fine dimensions; URLs lose query/fragment/userinfo; dimensions outside an allowlist are rejected; objects containing keys matching `/gclid|client.?id|user.?id|visitor|email|phone/i` throw `FORBIDDEN_EVIDENCE_FIELD`; canonical hashes are stable regardless of object key order.

- [ ] **Step 2: Implement deterministic minimization**

Allowed Ads dimensions: `date`, `campaignId`, `campaignName`, `landingPage`, `device`, `intentCategory`. Allowed GA4 dimensions: `date`, `landingPage`, `sourceMedium`, `device`. Geography is excluded from the founding pilot because adding it to daily page/device cohorts increases suppression and re-identification risk. Store no provider response bodies.

- [ ] **Step 3: Implement atomic sync**

For one client and one date range: lock connection, refresh access, collect both sources, normalize in memory, persist deduplicated rows in a transaction, update freshness only after both writes succeed, and record a safe audit event. On one-source failure, roll back all new rows, retain prior evidence, set safe error code, and return `partial: false`.

- [ ] **Step 4: Protect the internal endpoint**

`POST /api/internal/stewardship/sync` accepts `{ clientId, startDate, endDate }`, rejects non-internal requests with 401, validates ISO dates and a maximum 92-day span, and returns counts plus freshness—not evidence rows or credentials.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/privacy.test.ts __tests__/stewardship/sync.test.ts __tests__/stewardship/internal-sync-route.test.ts
npm run typecheck
```

Expected: PASS; a forced GA4 failure leaves zero new Ads rows in the transaction fixture.

- [ ] **Step 6: Commit**

```bash
git add app/lib/stewardship/privacy.ts app/lib/stewardship/sync.ts app/api/internal/stewardship/sync __tests__/stewardship
git commit -m "feat(stewardship): add privacy-safe evidence sync"
```

### Task 7: Leak Map, Initiative Ledger, and Evidence Labels

**Files:**
- Create: `app/lib/stewardship/diagnostics.ts`
- Extend: `scripts/stewardship.ts`
- Test: `__tests__/stewardship/diagnostics.test.ts`
- Test: `__tests__/stewardship/initiative-cli.test.ts`

**Interfaces:**
- Produces: `buildLeakMap(evidence, experienceFindings): LeakCandidate[]`; CLI `initiative propose|approve|ship|close`.

- [ ] **Step 1: Define exact Leak Map output**

```ts
export type LeakCandidate = {
  category: 'traffic_intent' | 'message_handoff' | 'conversion_experience' | 'measurement' | 'offer'
  title: string
  disposition: 'implement' | 'repair_measurement' | 'hand_off' | 'defer'
  claimLabel: ClaimLabel
  severity: 1 | 2 | 3 | 4 | 5
  controllable: boolean
  evidenceIds: string[]
  confounders: string[]
  rationale: string
}
```

- [ ] **Step 2: Write deterministic RED cases**

Cover: Ads clicks with no matching GA4 sessions → measurement repair; Ads intent category/landing mismatch supplied by a reviewed experience finding → message handoff; upstream traffic mismatch → `hand_off` and `controllable: false`; insufficient evidence → defer/directional; no rule may produce `controlled` without an explicit experiment record.

- [ ] **Step 3: Implement conservative diagnostics**

Rules may nominate and explain candidates; they may not estimate revenue or claim causality. Every candidate requires existing evidence IDs. Auto-generated claim labels are at most `directional`; `supported` requires multiple independent source IDs and a human approval record; `controlled` requires experiment metadata with allocation, sample size, dates, and result.

- [ ] **Step 4: Implement initiative state transitions**

Allowed transitions are:

```text
proposed → approved → implementing → verifying → shipped → measuring → closed
```

A broken-form or tracking repair may be marked `priority_interrupt=true`. `ship` requires acceptance results, production URL, deployment reference, rollback reference, and rendered QA evidence. Reject skipped states.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/diagnostics.test.ts __tests__/stewardship/initiative-cli.test.ts
npm run typecheck
```

Expected: PASS; no fixture produces a causal claim from before/after data alone.

- [ ] **Step 6: Commit**

```bash
git add app/lib/stewardship/diagnostics.ts scripts/stewardship.ts __tests__/stewardship/diagnostics.test.ts __tests__/stewardship/initiative-cli.test.ts
git commit -m "feat(stewardship): add leak map and initiative ledger"
```

### Task 8: Customer-Owned Report and Termination Export

**Files:**
- Create: `app/lib/stewardship/report.ts`
- Create: `app/api/internal/stewardship/export/route.ts`
- Extend: `scripts/stewardship.ts`
- Test: `__tests__/stewardship/report.test.ts`
- Test: `__tests__/stewardship/export-route.test.ts`
- Test: `__tests__/stewardship/termination.test.ts`

**Interfaces:**
- Produces: `buildCustomerBundle(clientId, period): { markdown: string; json: CustomerBundle }`; CLI `export`, `terminate`, and `purge`.

- [ ] **Step 1: Write report RED tests**

Require sections: system health/freshness, Post-Click Leak Map, current initiative and acceptance criteria, intervention/change ledger, QA proof, outcomes with claim labels, confounders, next-priority rationale, data lineage, and privacy note. Assert no encrypted tokens, emails other than the customer contact, raw search terms, or forbidden visitor keys appear.

- [ ] **Step 2: Implement deterministic report generation**

Generate Markdown and a versioned JSON schema from repository records. If evidence is stale or unavailable, place that fact above all findings. Render `observed`, `directional`, `supported`, and `controlled` labels visibly; never translate them to marketing adjectives.

- [ ] **Step 3: Implement export endpoint and CLI**

Internal endpoint returns a downloadable JSON bundle only after bearer auth. CLI writes both `.md` and `.json` under `stewardship-exports/<client-id>/<period>/` with mode `0600`; the directory is gitignored. It prints file paths and SHA-256 checksums.

- [ ] **Step 4: Implement termination and purge**

`terminate` first exports, then revokes Google, sets `encrypted_refresh_token = NULL`, marks the client terminated, sets `delete_after = now() + interval '30 days'`, and enqueues deletion. `purge` deletes the client row after the deadline, allowing cascades to remove accepted applications, tokens, connections, evidence, initiatives, and interventions while billing events survive with `client_id = NULL`. It separately deletes declined/unaccepted applications whose `delete_after` has passed. The founding pilot retains no cross-customer learning table. A failed provider revocation keeps the audit event retryable but still removes local credential material immediately.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/report.test.ts __tests__/stewardship/export-route.test.ts __tests__/stewardship/termination.test.ts
npm run typecheck
```

Expected: PASS; post-termination repository fixture has no decryptable token; pre-deadline purge changes nothing; post-deadline purge removes operational rows.

- [ ] **Step 6: Commit**

```bash
git add app/lib/stewardship/report.ts app/api/internal/stewardship/export scripts/stewardship.ts __tests__/stewardship .gitignore
git commit -m "feat(stewardship): add evidence export and deletion workflow"
```

### Task 9: Private Stripe Subscription and Idempotent Billing Ledger

**Files:**
- Create: `app/api/internal/stewardship/checkout/route.ts`
- Modify: `app/api/webhooks/stripe/route.ts`
- Extend: `scripts/stewardship.ts`
- Test: `__tests__/stewardship/checkout-route.test.ts`
- Test: `__tests__/stewardship/stripe-webhook.test.ts`

**Interfaces:**
- Produces: private subscription Checkout Session; idempotent persistence for checkout, invoice, and subscription events.

- [ ] **Step 1: Provision and verify the Stripe product during execution**

Use the Stripe product-management workflow to create one product named `Nebula Conversion Stewardship` and one recurring monthly USD price of exactly 250000 cents. Record only the returned price ID in `STRIPE_STEWARDSHIP_PRICE_ID`. Read the product back through Stripe and verify amount, currency, interval, and active state before continuing.

- [ ] **Step 2: Write private-checkout RED tests**

Assert unauthenticated requests return 401; absent Stripe configuration returns 503; unknown/non-accepted client returns 404/409; session uses server-side price ID, `mode=subscription`, one line item, verified HTTPS URLs, and metadata containing only stewardship client UUID. Assert no public `/api/checkout` offer key can create stewardship checkout.

- [ ] **Step 3: Implement private checkout**

Only the internal endpoint and operator CLI may create the session. The customer agreement records the 90-day commitment; Stripe bills monthly. Do not create a public pricing card or self-serve button. Return the hosted Stripe URL to the operator for direct customer delivery.

- [ ] **Step 4: Replace webhook placeholder logging with idempotent persistence**

Handle:

- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Insert the Stripe event ID before applying state; duplicate event IDs return 200 without repeating transitions. Store provider IDs, amount, currency, status, and timestamps—not full Stripe payloads. Preserve existing Fix Pack behavior.

- [ ] **Step 5: Verify with signed fixtures**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/checkout-route.test.ts __tests__/stewardship/stripe-webhook.test.ts
npm run typecheck
```

Expected: PASS; replayed event yields one billing record and one state transition.

- [ ] **Step 6: Commit**

```bash
git add app/api/internal/stewardship/checkout app/api/webhooks/stripe/route.ts scripts/stewardship.ts __tests__/stewardship
git commit -m "feat(stewardship): add private recurring billing"
```

### Task 10: Offer Consistency, Legal Terms, and Public Containment

**Files:**
- Modify: `app/pricing/page.tsx`
- Modify: `app/privacy-policy/page.tsx`
- Modify: `app/terms/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `__tests__/containment/production-safety.test.ts`
- Create: `__tests__/stewardship/legal-copy.test.ts`

**Interfaces:**
- Produces: truthful public copy and legally explicit service terms with no public monthly checkout.

- [ ] **Step 1: Write copy-containment RED tests**

Recursively scan all active `app/**/page.tsx`, metadata, JSON-LD, `public/`, and shared navigation. Assert:

- no absolute claim that Nebula has no retainers or monthly services;
- all Fix Pack prices are `$147`/`147` on active surfaces;
- no active `$97` Fix Pack reference;
- no public stewardship checkout link;
- no revenue, ROAS, conversion-rate, or guaranteed-lift promise;
- private application routes are absent from sitemap and carry noindex.

- [ ] **Step 2: Update pricing without turning stewardship into self-serve**

Replace the absolute paragraph with:

> The Conversion Fix Pack is a one-time purchase with no recurring charge. Nebula also operates a separate invitation-only Conversion Stewardship service for qualified businesses already running Google Ads.

Keep the Fix Pack FAQ explicitly one-time. Do not add the $2,500 price, application link, or checkout button to the public pricing grid during the founding pilot.

- [ ] **Step 3: Add exact privacy disclosures**

Disclose Google Ads/GA4 read-only evidence use, OAuth token processing, aggregate cohort minimum of 20, no individual profiling, no GCLID or user-level export, LLM minimization boundary, immediate credential revocation at termination, 30-day operational deletion, customer export, Stripe/Google/AgentMail processors, and separation of seven-year billing records.

- [ ] **Step 4: Add exact service terms**

Terms must state $2,500 monthly billing, 90-day initial contractual term, month-to-month continuation, cancellation before next renewal after day 90, one coherent monthly initiative, exclusions, customer access/approval delay pause, $2,500 service credit/refund when Nebula fails to ship for reasons within its control, Month 1 release from remaining payments when no worthwhile controllable opportunity exists, production rollback duty, customer ownership, and no performance guarantee.

- [ ] **Step 5: Verify full active-surface consistency**

Run:

```bash
npm test -- --runInBand __tests__/stewardship/legal-copy.test.ts __tests__/containment/production-safety.test.ts
npm run typecheck
npm run lint
npm run build
```

Expected: PASS; build emits no private application path in sitemap.

- [ ] **Step 6: Commit**

```bash
git add app/pricing/page.tsx app/privacy-policy/page.tsx app/terms/page.tsx app/sitemap.ts __tests__/containment/production-safety.test.ts __tests__/stewardship/legal-copy.test.ts
git commit -m "docs(stewardship): align offer privacy and terms"
```

### Task 11: Controlled End-to-End Rehearsal and Launch Gate

**Files:**
- Create: `docs/operations/conversion-stewardship-runbook.md`
- Create: `docs/operations/conversion-stewardship-rehearsal.md`
- Create: `__tests__/stewardship/e2e-fixture.test.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: verified operator runbook, rehearsal evidence, explicit GO/NO-GO launch decision.

- [ ] **Step 1: Build a non-customer fixture**

Create deterministic Ads and GA4 HTTP fixtures containing cohorts above and below 20, one tracking mismatch, one intent category, a failed provider response, and a Stripe event replay. Do not use fabricated output as customer proof; label the fixture `TEST DATA — NOT CUSTOMER EVIDENCE` everywhere.

- [ ] **Step 2: Exercise the full mocked vertical slice**

Run invite → application → accept → OAuth callback mock → sync → Leak Map → initiative transitions → report export → private checkout → webhook replay → termination → purge. Assert the generated bundle contains correct provenance and no forbidden keys.

Run: `npm test -- --runInBand __tests__/stewardship/e2e-fixture.test.ts`

Expected: PASS.

- [ ] **Step 3: Run complete quality gates**

Run:

```bash
npm ci --include=dev
npm run typecheck
npm run lint
npm run build
npm test -- --runInBand
npm audit --omit=dev
```

Expected: all commands exit 0. Any dependency vulnerability introduced by this work blocks launch until removed or explicitly mitigated with evidence.

- [ ] **Step 4: Rehearse with a consenting test Google account**

Verify OAuth consent, account ID validation, Google Ads read-only user role, Ads v24 reporting, GA4 Data API reporting, suppression, credential encryption, revocation, and deletion. If a Google Ads developer token or OAuth verification is unavailable, record NO-GO; do not substitute screenshots or mocked data for the live connector proof.

- [ ] **Step 5: Deploy local origin and verify through Cloudflare Tunnel**

Restart the local Next.js origin on port 3000, verify local readiness, then test the public tunnel. Use a rendered browser at desktop and mobile sizes to verify invalid invite 404, valid invite page, form errors, consent text, no public checkout, pricing copy, privacy, terms, keyboard navigation, contrast, no console errors, and no failed network calls. HTTP 200 alone is not sufficient.

- [ ] **Step 6: Validate production containment recursively**

Enumerate all public and extensionless active routes. Verify archived aliases return 404/noindex, private routes are noindex and unlinked, public sitemap excludes tokens, and API endpoints fail closed without secrets. Save exact commands, timestamps, URLs, screenshots, console/network results, and proof boundaries in `docs/operations/conversion-stewardship-rehearsal.md`.

- [ ] **Step 7: Write the runbook**

Document exact commands for invite, accept, connect, sync, diagnose, approve, ship, export, checkout, terminate, purge, key rotation, provider-error recovery, Stripe replay handling, rollback, and emergency credential revocation. Include escalation conditions and the three-client capacity gate.

- [ ] **Step 8: Issue the launch decision**

GO requires all of:

- live Google connector proof;
- encrypted-token and revocation proof;
- cohort suppression proof;
- Stripe product/price read-back;
- signed webhook replay proof;
- full rendered-browser PASS;
- recursive containment PASS;
- export/deletion PASS;
- final service terms approved by Mike or qualified counsel before customer signature;
- clean diff for scoped files;
- no more than three accepted active/foundation clients.

Otherwise issue NO-GO with the exact blocked gate. Do not sell or onboard a customer while any gate is red.

- [ ] **Step 9: Commit**

```bash
git add docs/operations/conversion-stewardship-runbook.md docs/operations/conversion-stewardship-rehearsal.md __tests__/stewardship/e2e-fixture.test.ts README.md
git commit -m "test(stewardship): prove founding pilot readiness"
```

## Final Verification

Run from `/home/mike/nebula/customer-portal`:

```bash
npm ci --include=dev
npm run db:migrate
npm run db:migrate
npm run typecheck
npm run lint
npm run build
npm test -- --runInBand
npm audit --omit=dev
git diff --check
git status --short
```

Expected:

- dependency install succeeds;
- migration is idempotent;
- typecheck, lint, build, and all tests pass;
- no introduced production dependency vulnerability remains unresolved;
- no whitespace errors;
- worktree contains no uncommitted files from this implementation;
- unrelated pre-existing work remains untouched and explicitly listed if the implementation ran in a non-clean parent repository.

## Execution Sequence and Review Gates

1. **Foundation gate:** Tasks 1–2 must pass before any credential work.
2. **Acquisition gate:** Tasks 3–4 must pass before requesting real customer authorization.
3. **Evidence gate:** Tasks 5–6 must pass before storing any provider-derived evidence.
4. **Decision gate:** Tasks 7–8 must pass before a customer-facing outcome memo is produced.
5. **Revenue gate:** Task 9 must pass before sending a subscription link.
6. **Claims gate:** Task 10 must pass before public copy changes deploy.
7. **Launch gate:** Task 11 must issue GO before accepting the first founding customer.

Each gate requires a fresh reviewer to compare the implementation against `docs/superpowers/specs/2026-07-19-nebula-conversion-stewardship-design.md`, not merely confirm that tests are green.
