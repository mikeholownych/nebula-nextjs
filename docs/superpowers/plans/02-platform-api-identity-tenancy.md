# Platform API, Identity, and Tenancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bounded, authenticated Python platform API and PostgreSQL tenant model for customer and agency features.

**Architecture:** A new FastAPI service on port 8770 verifies OIDC JWTs through JWKS, resolves memberships, and exposes tenant-scoped `/api/platform/v1` resources. PostgreSQL is the source of truth for platform state; existing operational Python services and ledgers remain unchanged.

**Tech Stack:** Python 3.12 venv, FastAPI, Uvicorn, SQLAlchemy 2, Alembic, psycopg 3, Pydantic 2, PostgreSQL, pytest, Testcontainers or isolated test database.

## Global Constraints

- No production identity subscription over $50/month without explicit approval.
- Never trust organization, role, client, or entitlement claims without backend verification.
- Every tenant-owned query includes `organization_id` derived from `AuthorizationContext`.
- Return 404 for inaccessible cross-tenant object IDs.
- Migrations use expand/contract and include downgrade verification.
- Secrets remain in `~/.hermes/secrets/` or injected environment, never repository files.

---

### Task 1: Select and encapsulate the OIDC provider

**Files:**
- Create: `docs/architecture/adr-001-identity-provider.md`
- Create: `platform_api/auth/provider.py`
- Create: `platform_api/auth/jwks.py`
- Create: `platform_api/auth/context.py`
- Test: `tests/platform_api/test_auth_provider.py`

**Interfaces:**
- Produces: `verify_access_token(token: str) -> Principal`; `AuthorizationContext(user_id, organization_ids, provider_subject)`.

- [ ] **Step 1: Write provider acceptance tests using a local RSA keypair and JWKS fixture**

```python
def test_verify_access_token_rejects_wrong_audience(auth_provider, token_factory):
    token = token_factory(audience="wrong")
    with pytest.raises(AuthenticationError):
        auth_provider.verify_access_token(token)
```

Tests cover issuer, audience, signature, expiry, not-before, key rotation, missing subject, and network timeout.

- [ ] **Step 2: Score Clerk, WorkOS AuthKit, and Auth0 against mandatory requirements**

The ADR records current monthly cost at expected user count, Next integration, Python/JWKS support, MFA, organization features, webhooks, custom domain support, exportability, DPA availability, and failure behavior. Select the highest-scoring option whose projected recurring spend is within authority; otherwise record an approval blocker before production activation.

- [ ] **Step 3: Implement provider-neutral verification**

```python
@dataclass(frozen=True)
class Principal:
    subject: str
    email: str | None
    issuer: str
```

JWKS responses use bounded caching, HTTPS-only URLs, issuer allowlisting, and fail closed when no valid key exists.

- [ ] **Step 4: Run tests**

Run: `venv/bin/python3 -m pytest tests/platform_api/test_auth_provider.py -q`
Expected: PASS, including rotation and invalid-token cases.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture/adr-001-identity-provider.md platform_api/auth tests/platform_api/test_auth_provider.py
git commit -m "feat: define provider-neutral OIDC authentication"
```

### Task 2: Establish FastAPI service and configuration

**Files:**
- Create: `platform_api/__init__.py`
- Create: `platform_api/main.py`
- Create: `platform_api/config.py`
- Create: `platform_api/errors.py`
- Create: `requirements-platform-api.txt`
- Test: `tests/platform_api/test_health.py`

**Interfaces:**
- Produces: ASGI app `platform_api.main:app`; `GET /healthz`; `GET /readyz`; JSON error envelope `{code,message,request_id}`.

- [ ] **Step 1: Write failing health/readiness tests**
- [ ] **Step 2: Install pinned API dependencies into the existing venv using `uv pip install --python venv/bin/python -r requirements-platform-api.txt`**
- [ ] **Step 3: Implement settings that validate `DATABASE_URL`, OIDC issuer/audience/JWKS URL, allowed origins, and environment name without logging values**
- [ ] **Step 4: Add request IDs, bounded JSON bodies, structured errors, and strict CORS for the production origin**
- [ ] **Step 5: Run `venv/bin/python3 -m pytest tests/platform_api/test_health.py -q` and start `venv/bin/uvicorn platform_api.main:app --host 127.0.0.1 --port 8770`**
- [ ] **Step 6: Commit as `feat: establish platform API service`**

### Task 3: Add PostgreSQL and migrations

**Files:**
- Create: `platform_api/db/base.py`
- Create: `platform_api/db/session.py`
- Create: `platform_api/db/models.py`
- Create: `alembic.ini`
- Create: `migrations/env.py`
- Create: `migrations/versions/0001_platform_core.py`
- Test: `tests/platform_api/test_migrations.py`
- Test: `tests/platform_api/test_row_level_security.py`

**Interfaces:**
- Produces tables: `users`, `user_identities`, `organizations`, `memberships`, `agency_clients`, `subscriptions`, `entitlements`, `brand_profiles`, `brand_assignments`, `domain_claims`, `audit_events`, `webhook_events`, `outbox_events`.

- [ ] **Step 1: Write failing migration round-trip test**

```python
def test_migrations_upgrade_and_downgrade(database_url):
    alembic_upgrade(database_url, "head")
    assert required_tables(database_url) == EXPECTED_TABLES
    alembic_downgrade(database_url, "base")
    assert required_tables(database_url) == set()
```

- [ ] **Step 2: Define UUID primary keys, UTC timestamps, uniqueness, and tenant-first indexes**

Every tenant-owned table has non-null `organization_id`. `user_identities` is unique on `(issuer, subject)` and email is never the identity key. `memberships` is unique on `(user_id, organization_id)`. `subscriptions` separates payer and service organizations. `webhook_events` is unique on `(provider, external_event_id)`. Add PostgreSQL row-level-security policies using request-local user/organization settings; runtime roles cannot bypass RLS, while workers use separate narrowly scoped credentials.

- [ ] **Step 3: Implement Alembic migration, downgrade, and RLS policies**
- [ ] **Step 4: Run migration round-trip and RLS tests as the restricted runtime role; prove tenant A cannot select, update, or delete tenant B rows even when repository scoping is intentionally omitted in the test**
- [ ] **Step 5: Commit as `feat: add platform tenant database schema`**

### Task 4: Implement memberships and authorization

**Files:**
- Create: `platform_api/auth/dependencies.py`
- Create: `platform_api/auth/policy.py`
- Create: `platform_api/repositories/memberships.py`
- Create: `platform_api/services/authorization.py`
- Test: `tests/platform_api/test_authorization_matrix.py`

**Interfaces:**
- Produces: `require_permission(permission: Permission)` FastAPI dependency; `AuthorizationContext`; permission enum covering organization, membership, client, billing, branding, domain, and audit-log operations.

- [ ] **Step 1: Write the complete role/permission matrix as parameterized failing tests**

```python
@pytest.mark.parametrize("role,permission,allowed", ROLE_PERMISSION_CASES)
def test_role_permission_matrix(role, permission, allowed):
    assert policy.allows(role, permission) is allowed
```

- [ ] **Step 2: Implement explicit allowlists; absence of a permission denies**
- [ ] **Step 3: Add cross-tenant object tests proving guessed UUIDs return 404**
- [ ] **Step 4: Run authorization tests with query logging and assert every tenant query includes organization scope**
- [ ] **Step 5: Commit as `feat: enforce tenant-scoped authorization`**

### Task 5: Expose organization, membership, and client APIs

**Files:**
- Create: `platform_api/api/v1/router.py`
- Create: `platform_api/api/v1/me.py`
- Create: `platform_api/api/v1/organizations.py`
- Create: `platform_api/api/v1/memberships.py`
- Create: `platform_api/api/v1/clients.py`
- Create: `platform_api/schemas/organizations.py`
- Create: `platform_api/services/organizations.py`
- Test: `tests/platform_api/test_organization_api.py`

**Interfaces:**
- Produces: `GET /api/platform/v1/me`; organization/member/client CRUD constrained by permissions; cursor pagination with stable `(created_at,id)` ordering.

- [ ] **Step 1: Write failing API tests for normal, validation, duplicate, unauthorized, cross-tenant, and pagination cases**
- [ ] **Step 2: Implement Pydantic request/response schemas that ignore no unknown security-sensitive fields**
- [ ] **Step 3: Implement service methods requiring `AuthorizationContext` as their first argument**
- [ ] **Step 4: Add append-only audit events for membership, role, and client changes**
- [ ] **Step 5: Run the platform API test suite and OpenAPI schema snapshot test**
- [ ] **Step 6: Commit as `feat: add tenant administration APIs`**

### Task 6: Add identity lifecycle webhooks and reconciliation

**Files:**
- Create: `platform_api/api/webhooks/identity.py`
- Create: `platform_api/services/identity_sync.py`
- Create: `platform_api/repositories/webhook_events.py`
- Create: `scripts/reconcile_identity_users.py`
- Test: `tests/platform_api/test_identity_webhooks.py`

**Interfaces:**
- Consumes provider-signed user lifecycle events.
- Produces idempotent user mappings and reconciliation report without deleting tenant data automatically.

- [ ] **Step 1: Write failing signature, replay, ordering, duplicate, and unknown-event tests**
- [ ] **Step 2: Verify webhook signatures against raw request bytes and configured tolerance**
- [ ] **Step 3: Persist event ID before mutation and make duplicate delivery a successful no-op**
- [ ] **Step 4: Implement reconciliation dry-run and explicit `--apply` modes**
- [ ] **Step 5: Run tests and a fixture reconciliation**
- [ ] **Step 6: Commit as `feat: synchronize identity lifecycle safely`**

### Task 7: Reconcile existing customers without implicit account claims

**Files:**
- Create: `scripts/import_customer_accounts.py`
- Create: `platform_api/services/customer_import.py`
- Create: `migrations/versions/0002_customer_import_staging.py`
- Create: `tests/platform_api/test_customer_import.py`
- Create: `docs/runbooks/customer-account-migration.md`

**Interfaces:**
- Consumes read-only snapshots from `ledgers/customer-ledger.jsonl`, `orders/*.json`, and an explicitly approved client-record export.
- Produces a dry-run reconciliation report, quarantined conflicts, Stripe-customer mappings, and explicit invitations/operator-approved claims. Matching an email address alone never grants account access.

- [ ] **Step 1: Write failing tests for duplicate emails, missing Stripe customers, test/live-mode records, conflicting products, repeated orders, malformed rows, and an email match without an approved identity claim**
- [ ] **Step 2: Import into staging tables only; normalize but retain source references and checksums for evidence**
- [ ] **Step 3: Reconcile Stripe customer/subscription IDs and payer/service organizations; quarantine ambiguity instead of guessing**
- [ ] **Step 4: Produce explicit invitations or an operator-reviewed claim file; never auto-link a provider identity solely by email**
- [ ] **Step 5: Run dry-run twice and require identical counts/checksums before `--apply` is available**
- [ ] **Step 6: Commit as `feat: add evidence-safe customer account migration`**

### Task 8: Security and database release gate

**Files:**
- Modify: `agentic_server.py`
- Create: `tests/platform_api/test_idor_matrix.py`
- Create: `tests/platform_api/test_rate_limits.py`
- Create: `tests/platform_api/test_legacy_client_auth_retirement.py`
- Create: `scripts/verify_platform_backup_restore.sh`
- Create: `docs/runbooks/platform-database.md`

**Interfaces:**
- Produces a blocking verification command and backup/restore runbook.

- [ ] **Step 1: Generate two agencies, two clients each, and every role in isolated test fixtures**
- [ ] **Step 2: Attempt every read/mutation against own and foreign tenant IDs; assert foreign access never returns data**
- [ ] **Step 3: After OIDC dashboard cutover, retire `/api/crm/login` and the email-plus-long-lived-token `/api/crm/client` path rather than extending them. Verify old credentials no longer create a session or return customer data; preserve operator CRM routes behind existing administrator authorization.**
- [ ] **Step 4: Test PostgreSQL backup, restore into an empty database, migration upgrade, and row-count/checksum parity**
- [ ] **Step 5: Run `venv/bin/python3 -m pytest tests/platform_api -q`**
- [ ] **Step 6: Commit as `test: gate platform API on tenant isolation`**
