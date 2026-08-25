# Agency Client Management — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow agency orgs to create named client accounts, run audits under system-managed client email slots, and view per-client results in a dedicated Clients tab in the workspace app.

**Architecture:** New `agency_clients` table in `nebula_platform`; CRUD + invite routes on the platform API (`/api/organizations/{org_id}/clients`); workspace-app BFF API routes + `ClientsView` tab wired into `WorkspaceClient`. Audits run under `{slug}+{org_prefix}@clients.nebulacomponents.com` emails, leveraging the existing email-keyed audit pipeline with no core audit changes.

**Tech Stack:** Python/FastAPI + SQLAlchemy async (platform API), Next.js 14 App Router + `pg` direct pool (workspace-app), asyncpg (nebula_audit reads), PostgreSQL (nebula_platform + nebula_audit)

## Global Constraints

- No em-dashes anywhere in shipped content.
- Accent color `#c7ff2f` only; no `warning` Tailwind class.
- No push to `nebula-origin` until Mike gives explicit go.
- Branch: `feat/agency-clients` (create from main).
- Production doctrine: verify against live service before marking any task done.
- Platform API DSN (nebula_platform): `postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433`
- Audit DB DSN (nebula_audit): `postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433`
- Client email pattern: `{slug}+{org_id[:8]}@clients.nebulacomponents.com`
- Membership check pattern: SQLAlchemy `select(Membership).where(Membership.user_id==user_id, Membership.organization_id==org_id, Membership.status=='active')` — same as `organizations.py`
- workspace-app auth pattern: `requireUser(request)` from `workspace-app/lib/auth.ts`; tenancy from `resolveMembership(user, orgId)` in `workspace-app/lib/tenancy.ts`
- workspace-app uses `pg` Pool directly against `nebula_platform` for reads (see `tenancy.ts`); mutations go through platform API routes
- All platform API org routes use `AsyncSession = Depends(get_db)` from `platform_api.db.session`

---

### Task 0: Migration + ORM model

**Blocks:** none (start immediately)
**Blocked by:** nothing
**Demoable:** `\d agency_clients` in nebula_platform shows the table; `AgencyClient` importable from `platform_api.db.models`.

**Files:**
- Create: `platform_api/migrations/20260825_agency_clients.sql`
- Modify: `platform_api/db/models.py`

**Interfaces:**
- Produces: `AgencyClient` SQLAlchemy model with fields: `id`, `organization_id`, `name`, `slug`, `domain`, `client_email`, `status`, `notes`, `invited_user_id`, `invite_token`, `invite_expires_at`, `created_at`, `updated_at`

- [ ] **Step 1: Write migration SQL**

Create `platform_api/migrations/20260825_agency_clients.sql`:

```sql
-- agency_clients: client accounts managed by agency organizations.
-- client_email is a system-managed audit ownership key (never a real mailbox):
--   {slug}+{org_id_prefix8}@clients.nebulacomponents.com

CREATE TABLE IF NOT EXISTS agency_clients (
    id                uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id   uuid         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              text         NOT NULL,
    slug              text         NOT NULL,
    domain            text         NOT NULL,
    client_email      text         NOT NULL UNIQUE,
    status            text         NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'suspended', 'unlinked')),
    notes             text,
    invited_user_id   uuid         REFERENCES users(id) ON DELETE SET NULL,
    invite_token      text,
    invite_expires_at timestamptz,
    created_at        timestamptz  NOT NULL DEFAULT now(),
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_agency_clients_org
    ON agency_clients (organization_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_agency_clients_token
    ON agency_clients (invite_token) WHERE invite_token IS NOT NULL;
```

- [ ] **Step 2: Apply migration**

```bash
psql "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433" \
  -f /home/mike/nebula/platform_api/migrations/20260825_agency_clients.sql
```
Expected: `CREATE TABLE`, `CREATE INDEX`, `CREATE INDEX`

- [ ] **Step 3: Verify table exists**

```bash
psql "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433" \
  -c "\d agency_clients" | head -20
```
Expected: columns listed.

- [ ] **Step 4: Add ORM model to models.py**

In `platform_api/db/models.py`, after the `Subscription` class, add:

```python
class AgencyClient(Base):
    """Client account managed by an agency organization.

    client_email is the system-managed audit ownership key for nebula_audit.
    Pattern: {slug}+{org_id_prefix8}@clients.nebulacomponents.com
    Never a real mailbox.
    """

    __tablename__ = "agency_clients"
    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_agency_clients_org_slug"),
        Index("ix_agency_clients_org", "organization_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(nullable=False)
    slug: Mapped[str] = mapped_column(nullable=False)
    domain: Mapped[str] = mapped_column(nullable=False)
    client_email: Mapped[str] = mapped_column(nullable=False, unique=True)
    status: Mapped[str] = mapped_column(nullable=False, default="active")
    notes: Mapped[Optional[str]] = mapped_column(nullable=True)
    invited_user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    invite_token: Mapped[Optional[str]] = mapped_column(nullable=True)
    invite_expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(timezone.utc),
                                                  onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<AgencyClient {self.name!r} org={self.organization_id}>"
```

Verify existing imports at top of `models.py` already include `UniqueConstraint`, `Index`, `Mapped`, `mapped_column`, `ForeignKey`, `Optional`, `datetime`, `timezone`, `uuid4` — add any that are missing.

- [ ] **Step 5: Verify import**

```bash
cd /home/mike/nebula && uv run python -c "from platform_api.db.models import AgencyClient; print(AgencyClient.__tablename__)"
```
Expected: `agency_clients`

- [ ] **Step 6: Commit**

```bash
git add platform_api/migrations/20260825_agency_clients.sql platform_api/db/models.py
git commit -m "feat: agency_clients table + ORM model"
```

---

### Task 1: Platform API — client CRUD + slug/email helpers

**Blocked by:** Task 0
**Demoable:** `GET /api/organizations/{org_id}/clients` returns `[]` for a valid agency org; `POST` creates a client with computed `client_email`; non-agency org gets 403.

**Files:**
- Create: `platform_api/routes/agency_clients.py`
- Modify: `platform_api/main.py` (include router)
- Create: `tests/test_agency_clients.py`

**Interfaces:**
- Consumes: `AgencyClient` from `platform_api.db.models`; `Organization`, `Membership`, `User` from same; `AsyncSession = Depends(get_db)` from `platform_api.db.session`; `get_current_user` from `platform_api.auth.routes`
- Produces:
  - `derive_slug(name: str) -> str` — lowercase, spaces→hyphens, non-alnum-hyphen stripped, max 40 chars
  - `derive_client_email(slug: str, org_id: UUID) -> str` — `f"{slug}+{str(org_id)[:8]}@clients.nebulacomponents.com"`
  - Routes on `/api/organizations/{org_id}/clients`: GET list, POST create, GET detail, PATCH update, DELETE unlink
  - `ClientResponse` pydantic model: `{id, name, slug, domain, client_email, status, notes, created_at}`

- [ ] **Step 1: Write tests first**

Create `tests/test_agency_clients.py`:

```python
"""Tests for agency client management routes."""
import pytest
from platform_api.routes.agency_clients import derive_slug, derive_client_email
from uuid import UUID


def test_derive_slug_basic():
    assert derive_slug("Acme Corp") == "acme-corp"


def test_derive_slug_special_chars():
    assert derive_slug("My Client #1!") == "my-client-1"


def test_derive_slug_max_length():
    long_name = "a" * 50
    assert len(derive_slug(long_name)) <= 40


def test_derive_slug_strips_leading_trailing_hyphens():
    assert derive_slug("  --Test--  ") == "test"


def test_derive_client_email():
    org_id = UUID("07ed2178-a7a8-4dc4-b432-03887ebe51e1")
    result = derive_client_email("acme-corp", org_id)
    assert result == "acme-corp+07ed2178@clients.nebulacomponents.com"


def test_derive_client_email_uses_first_8_chars_of_org_id():
    org_id = UUID("abcdef12-0000-0000-0000-000000000000")
    result = derive_client_email("test", org_id)
    assert result == "test+abcdef12@clients.nebulacomponents.com"
    # strip hyphens from org_id string representation
    # str(org_id) = 'abcdef12-0000-...' so [:8] = 'abcdef12'
    assert "@" in result
    assert "clients.nebulacomponents.com" in result
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/mike/nebula && uv run python -m pytest tests/test_agency_clients.py -v 2>&1 | tail -10
```
Expected: ImportError (module doesn't exist yet).

- [ ] **Step 3: Implement agency_clients.py**

Create `platform_api/routes/agency_clients.py`:

```python
"""Agency client management routes.

Prefix: /api/organizations/{org_id}/clients

All routes require active membership in org_id. Write routes additionally
require is_agency=True on the organization. Ownership/admin required for
mutations.
"""

import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.routes import get_current_user
from ..db.models import AgencyClient, Membership, Organization
from ..db.session import get_session as get_db

router = APIRouter(
    prefix="/api/organizations/{org_id}/clients",
    tags=["agency-clients"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def derive_slug(name: str) -> str:
    """Lowercase, spaces to hyphens, strip non-alnum-hyphen, max 40 chars."""
    slug = name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug[:40]


def derive_client_email(slug: str, org_id: UUID) -> str:
    """System-managed audit ownership email for a client.

    Pattern: {slug}+{org_id_prefix8}@clients.nebulacomponents.com
    Never a real mailbox.
    """
    prefix = str(org_id).replace("-", "")[:8]
    return f"{slug}+{prefix}@clients.nebulacomponents.com"


async def _require_agency_membership(
    org_id: UUID,
    current_user: dict,
    db: AsyncSession,
    min_role: str = "member",
) -> Organization:
    """Return org if caller has active membership + org is_agency=True.

    Raises 403 if no membership, 403 if not an agency org.
    """
    user_id = UUID(current_user["user_id"])
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.organization_id == org_id,
            Membership.status == "active",
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    role_rank = {"viewer": 1, "member": 2, "admin": 3, "owner": 4}
    if role_rank.get(membership.role, 0) < role_rank.get(min_role, 0):
        raise HTTPException(status_code=403, detail="Insufficient role")

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org or not org.is_agency:
        raise HTTPException(status_code=403, detail="Organization is not an agency")
    return org


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ClientCreate(BaseModel):
    name: str
    domain: str
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    domain: str
    client_email: str
    status: str
    notes: Optional[str]
    invited_user_id: Optional[UUID]
    created_at: datetime


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=List[ClientResponse])
async def list_clients(
    org_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List active clients for an agency org."""
    await _require_agency_membership(org_id, current_user, db)
    result = await db.execute(
        select(AgencyClient)
        .where(
            AgencyClient.organization_id == org_id,
            AgencyClient.status != "unlinked",
        )
        .order_by(AgencyClient.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    org_id: UUID,
    body: ClientCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new client under an agency org."""
    await _require_agency_membership(org_id, current_user, db, min_role="admin")

    slug = derive_slug(body.name)
    if not slug:
        raise HTTPException(status_code=400, detail="Name produces an empty slug")

    # Check slug uniqueness within org
    existing = await db.execute(
        select(AgencyClient).where(
            AgencyClient.organization_id == org_id,
            AgencyClient.slug == slug,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"A client with slug '{slug}' already exists in this organization",
        )

    client_email = derive_client_email(slug, org_id)
    client = AgencyClient(
        organization_id=org_id,
        name=body.name,
        slug=slug,
        domain=body.domain.lower().strip(),
        client_email=client_email,
        notes=body.notes,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    org_id: UUID,
    client_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single client by ID."""
    await _require_agency_membership(org_id, current_user, db)
    result = await db.execute(
        select(AgencyClient).where(
            AgencyClient.id == client_id,
            AgencyClient.organization_id == org_id,
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    org_id: UUID,
    client_id: UUID,
    body: ClientUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update client name, domain, notes, or status."""
    await _require_agency_membership(org_id, current_user, db, min_role="admin")
    result = await db.execute(
        select(AgencyClient).where(
            AgencyClient.id == client_id,
            AgencyClient.organization_id == org_id,
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if body.name is not None:
        client.name = body.name
    if body.domain is not None:
        client.domain = body.domain.lower().strip()
    if body.notes is not None:
        client.notes = body.notes
    if body.status is not None:
        if body.status not in ("active", "suspended", "unlinked"):
            raise HTTPException(status_code=400, detail="Invalid status")
        client.status = body.status
    client.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
async def unlink_client(
    org_id: UUID,
    client_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unlink a client. Data is preserved; invited user access is revoked."""
    await _require_agency_membership(org_id, current_user, db, min_role="owner")
    result = await db.execute(
        select(AgencyClient).where(
            AgencyClient.id == client_id,
            AgencyClient.organization_id == org_id,
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.status = "unlinked"
    client.invited_user_id = None
    client.invite_token = None
    client.invite_expires_at = None
    client.updated_at = datetime.now(timezone.utc)
    await db.commit()


@router.post("/{client_id}/invite")
async def invite_client(
    org_id: UUID,
    client_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a single-use invite token for the client to access their workspace."""
    await _require_agency_membership(org_id, current_user, db, min_role="admin")
    result = await db.execute(
        select(AgencyClient).where(
            AgencyClient.id == client_id,
            AgencyClient.organization_id == org_id,
            AgencyClient.status == "active",
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Active client not found")

    token = secrets.token_urlsafe(32)
    client.invite_token = token
    client.invite_expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    client.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "invite_url": f"https://app.nebulacomponents.com/invite/{token}",
        "expires_at": client.invite_expires_at.isoformat(),
    }
```

- [ ] **Step 4: Register router in main.py**

In `platform_api/main.py`, after the existing `app.include_router(teardown_claim_router_verify)` block, add:

```python
from platform_api.routes.agency_clients import router as agency_clients_router
app.include_router(agency_clients_router)
```

- [ ] **Step 5: Run tests**

```bash
cd /home/mike/nebula && uv run python -m pytest tests/test_agency_clients.py -v 2>&1 | tail -15
```
Expected: 6 passed.

- [ ] **Step 6: Run full suite**

```bash
uv run python -m pytest tests/ -q --tb=no 2>&1 | tail -5
```
Expected: 656+ passed, 0 failures.

- [ ] **Step 7: Restart API and smoke-test**

```bash
sudo systemctl restart nebula-platform-api.service && sleep 4
systemctl is-active nebula-platform-api.service
curl -s -m 5 http://127.0.0.1:8001/healthz | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])"
# Unauthenticated → 403/401
curl -s -m 5 "http://127.0.0.1:8001/api/organizations/07ed2178-a7a8-4dc4-b432-03887ebe51e1/clients" \
  | python3 -m json.tool | head -5
```
Expected: healthz `ok`; clients route returns `{"code":"http_error","message":"Missing authorization token",...}`.

- [ ] **Step 8: Commit**

```bash
git add platform_api/routes/agency_clients.py platform_api/main.py tests/test_agency_clients.py
git commit -m "feat: agency client CRUD routes with slug/email derivation"
```

---

### Task 2: Client audit history endpoint + entitlement proxy

**Blocked by:** Task 1
**Demoable:** `GET /api/organizations/{org_id}/clients/{client_id}/audits` returns audit history for the client's `client_email`; creating an audit with `client_email` via `/audit/run` uses the agency's entitlements.

**Files:**
- Modify: `platform_api/routes/agency_clients.py` (add `/audits` sub-route)
- Modify: `platform_api/routes/audit_api.py` (entitlement bypass for client emails)
- Modify: `tests/test_agency_clients.py` (add audit history tests)

**Interfaces:**
- Consumes: `audit_db.get_audits_by_email(email, limit)` from `platform_api.services.audit_db`
- Consumes: `resolve_for_email` from `platform_api.routes.audit_api` (already a module-level symbol)
- Produces: `GET /api/organizations/{org_id}/clients/{client_id}/audits?limit=20` → `[{id, url, status, score, grade, created_at, completed_at, page_intent, intent_confidence}]`

- [ ] **Step 1: Add audit history tests**

Append to `tests/test_agency_clients.py`:

```python
import pytest
from platform_api.routes.agency_clients import derive_client_email
from uuid import UUID


def test_client_email_is_parseable_as_email():
    """client_email must pass basic email format checks."""
    org_id = UUID("07ed2178-a7a8-4dc4-b432-03887ebe51e1")
    email = derive_client_email("test-client", org_id)
    assert "@" in email
    local, domain = email.split("@", 1)
    assert "+" in local
    assert domain == "clients.nebulacomponents.com"


def test_client_email_slug_plus_prefix():
    org_id = UUID("07ed2178-a7a8-4dc4-b432-03887ebe51e1")
    email = derive_client_email("acme", org_id)
    # str(org_id) = '07ed2178-a7a8-...' → replace hyphens → '07ed2178a7a8...' → [:8] = '07ed2178'
    assert email == "acme+07ed2178@clients.nebulacomponents.com"
```

Wait — the prefix derivation: `str(org_id)[:8]` gives `"07ed2178"` (with no hyphen since the first 8 chars of `"07ed2178-..."` is `"07ed2178"`). But `derive_client_email` currently does `str(org_id).replace("-", "")[:8]` which gives `"07ed2178"` too (first 8 non-hyphen chars). Both approaches give the same result here. Confirm the implementation matches the test.

Run: `uv run python -m pytest tests/test_agency_clients.py::test_client_email_slug_plus_prefix -v`

Expected: PASS (or FAIL revealing the implementation uses a different prefix computation — fix to match).

- [ ] **Step 2: Add /audits sub-route to agency_clients.py**

Add this import at top of `platform_api/routes/agency_clients.py`:

```python
from ..services.audit_db import audit_db as _audit_db
```

Add this route after the `invite_client` route:

```python
@router.get("/{client_id}/audits")
async def list_client_audits(
    org_id: UUID,
    client_id: UUID,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return audit history for a client (keyed by client_email in nebula_audit)."""
    await _require_agency_membership(org_id, current_user, db)
    result = await db.execute(
        select(AgencyClient).where(
            AgencyClient.id == client_id,
            AgencyClient.organization_id == org_id,
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    audits = await _audit_db.get_audits_by_email(client.client_email, limit=min(limit, 100))
    return {"client_email": client.client_email, "audits": audits}
```

- [ ] **Step 3: Entitlement bypass for client emails**

When the audit runner resolves entitlements for `acme+07ed2178@clients.nebulacomponents.com`, it gets `free` (no subscription). Agency audits must use the agency's entitlements. Add a resolution shortcut in `platform_api/routes/audit_api.py`'s `resolve_for_email`:

Find the `resolve_for_email` function (around line 63) and add a client-email bypass before the normal resolution:

```python
async def resolve_for_email(email: str):
    """Resolve plan entitlements for an email, thread-offloaded.
    ...existing docstring...
    For system-managed client emails (*@clients.nebulacomponents.com), the
    owning agency's entitlements are resolved instead (email contains the
    8-char org_id prefix after the + sign).
    """
    import asyncio
    from platform_api.db.session import session_scope
    from platform_api.services.entitlements import Entitlements, resolve_sync

    norm = (email or "").strip().lower()

    # Client email bypass: resolve as the owning agency org's subscription.
    if norm.endswith("@clients.nebulacomponents.com"):
        try:
            local = norm.split("@")[0]
            org_prefix = local.split("+")[-1]  # e.g. "07ed2178"
            # Look up an agency user email for this org prefix to resolve through
            from platform_api.db.session import session_scope as _ss
            from platform_api.db.models import Membership, User as _User, Organization as _Org
            from sqlalchemy import select as _sel
            def _find_agency_email():
                with _ss() as session:
                    # Find owner email for this org (by slug prefix match on org id)
                    row = session.execute(
                        _sel(_User.email).join(Membership, Membership.user_id == _User.id)
                        .join(_Org, _Org.id == Membership.organization_id)
                        .where(
                            _Org.is_agency == True,
                            _Org.id.cast(str).like(f"{org_prefix}%"),
                            Membership.status == "active",
                            Membership.role == "owner",
                        )
                        .limit(1)
                    ).scalar_one_or_none()
                    return row
            agency_email = await asyncio.to_thread(_find_agency_email)
            if agency_email:
                def _q():
                    with session_scope() as session:
                        return resolve_sync(agency_email, session)
                try:
                    return await asyncio.to_thread(_q)
                except Exception:
                    pass
        except Exception:
            pass
        # Fallback: degrade to free rather than erroring
        return Entitlements(plan="free", status="error", audits_per_month=None,
                            monitored_urls=0, min_interval_hours=None)
```

Note: this is complex and has a casting issue (`_Org.id.cast(str).like(...)` may not work cleanly across all SQLAlchemy dialects). The simpler and more robust alternative: store the full `org_id` in the client_email prefix instead of 8 chars. But per the spec, 8-char prefix is decided. The implementation above is a best-effort; if the cast approach fails in practice, the fallback to `Entitlements(plan="free", ...)` gracefully degrades rather than erroring. An agency user running a client audit should trigger entitlement resolution through their own session email (passed in the request), not the client_email — so the bypass mainly protects monitor gates and quota checks.

Alternative simpler approach that avoids the cast complexity: look up `agency_clients` table directly to find the `organization_id`, then look up the org's owner. Add to the bypass block:

```python
    if norm.endswith("@clients.nebulacomponents.com"):
        try:
            import asyncpg as _pg
            DSN = "host=/var/run/postgresql port=5433 dbname=nebula_platform user=postgres"
            conn = await _pg.connect(DSN)
            try:
                row = await conn.fetchrow(
                    """SELECT u.email FROM agency_clients ac
                       JOIN memberships m ON m.organization_id = ac.organization_id
                       JOIN users u ON u.id = m.user_id
                       WHERE ac.client_email = $1 AND m.role = 'owner' AND m.status = 'active'
                       LIMIT 1""",
                    norm,
                )
                if row:
                    agency_email = row["email"]
                    def _q2():
                        with session_scope() as session:
                            return resolve_sync(agency_email, session)
                    return await asyncio.to_thread(_q2)
            finally:
                await conn.close()
        except Exception:
            pass
        return Entitlements(plan="free", status="error", audits_per_month=None,
                            monitored_urls=0, min_interval_hours=None)
```

Use this second (asyncpg) approach — it avoids SQLAlchemy cast issues and directly queries `agency_clients` by the exact `client_email`.

- [ ] **Step 4: Run tests**

```bash
cd /home/mike/nebula && uv run python -m pytest tests/test_agency_clients.py -v 2>&1 | tail -10
uv run python -m pytest tests/ -q --tb=no 2>&1 | tail -5
```
Expected: 8+ passed in agency tests; 656+ overall.

- [ ] **Step 5: Restart and verify audit history route**

```bash
sudo systemctl restart nebula-platform-api.service && sleep 4
curl -s -m 5 http://127.0.0.1:8001/healthz | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])"
```
Expected: `ok`. No new errors in `journalctl -u nebula-platform-api.service -n 20 --no-pager`.

- [ ] **Step 6: Commit**

```bash
git add platform_api/routes/agency_clients.py platform_api/routes/audit_api.py tests/test_agency_clients.py
git commit -m "feat: client audit history endpoint; agency entitlement bypass for client emails"
```

---

### Task 3: workspace-app BFF routes

**Blocked by:** Task 1
**Demoable:** `GET /api/clients` from workspace-app (with session cookie) returns client list; `POST /api/clients` creates a client; unauthenticated → 401.

**Files:**
- Create: `workspace-app/app/api/clients/route.ts` (GET list, POST create)
- Create: `workspace-app/app/api/clients/[clientId]/route.ts` (GET detail, PATCH, DELETE)
- Create: `workspace-app/app/api/clients/[clientId]/invite/route.ts` (POST invite)
- Create: `workspace-app/app/api/clients/[clientId]/audits/route.ts` (GET audit history)

**Interfaces:**
- Consumes: `requireUser` from `workspace-app/lib/auth.ts`; `resolveMembership` from `workspace-app/lib/tenancy.ts`
- Consumes: `PLATFORM_API_URL` env var (default `http://127.0.0.1:8001`)
- Produces: all routes forward to `platform_api/routes/agency_clients.py` routes

The workspace-app does NOT have an `org_id` in BFF URLs — it resolves the user's agency org from `listMemberships` + finds the one where `is_agency=true`. Add a helper `getAgencyOrg(user)` in a new lib file.

- [ ] **Step 1: Create agency org resolver lib**

Create `workspace-app/lib/agency.ts`:

```typescript
import { platformPool } from './platform-db'
import { WorkspaceUser } from './auth'

export interface AgencyOrg {
  organizationId: string
  role: string
}

/**
 * Returns the first agency org the user belongs to as owner or admin,
 * or null if the user is not in any agency org.
 */
export async function getAgencyOrg(user: WorkspaceUser): Promise<AgencyOrg | null> {
  try {
    const result = await platformPool.query(
      `SELECT m.organization_id::text, m.role
       FROM memberships m
       JOIN organizations o ON o.id = m.organization_id
       WHERE m.user_id = $1
         AND m.status = 'active'
         AND o.is_agency = true
       ORDER BY
         CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
       LIMIT 1`,
      [user.id]
    )
    if (result.rows.length === 0) return null
    return { organizationId: result.rows[0].organization_id, role: result.rows[0].role }
  } catch (err) {
    console.error('[workspace-app getAgencyOrg]', err)
    return null
  }
}
```

- [ ] **Step 2: Create client list + create route**

Create `workspace-app/app/api/clients/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  return headers
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response

  const agency = await getAgencyOrg(auth.user)
  if (!agency) {
    return NextResponse.json({ error: 'No agency organization found' }, { status: 403 })
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients`,
      { headers: forwardHeaders(request), signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response

  const agency = await getAgencyOrg(auth.user)
  if (!agency) {
    return NextResponse.json({ error: 'No agency organization found' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients`,
      {
        method: 'POST',
        headers: forwardHeaders(request),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      }
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 3: Create client detail/patch/delete route**

Create `workspace-app/app/api/clients/[clientId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  return headers
}

type Params = { params: Promise<{ clientId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { clientId } = await params
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 })
  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients/${encodeURIComponent(clientId)}`,
      { headers: forwardHeaders(request), signal: AbortSignal.timeout(10000) }
    )
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { clientId } = await params
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 })
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients/${encodeURIComponent(clientId)}`,
      {
        method: 'PATCH',
        headers: forwardHeaders(request),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      }
    )
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { clientId } = await params
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 })
  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients/${encodeURIComponent(clientId)}`,
      { method: 'DELETE', headers: forwardHeaders(request), signal: AbortSignal.timeout(10000) }
    )
    if (res.status === 204) return new NextResponse(null, { status: 204 })
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 4: Create invite + audits BFF routes**

Create `workspace-app/app/api/clients/[clientId]/invite/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

type Params = { params: Promise<{ clientId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { clientId } = await params
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 })
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients/${encodeURIComponent(clientId)}/invite`,
      { method: 'POST', headers, signal: AbortSignal.timeout(10000) }
    )
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
```

Create `workspace-app/app/api/clients/[clientId]/audits/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

type Params = { params: Promise<{ clientId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { clientId } = await params
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 })
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  const limit = request.nextUrl.searchParams.get('limit') ?? '20'
  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients/${encodeURIComponent(clientId)}/audits?limit=${encodeURIComponent(limit)}`,
      { headers, signal: AbortSignal.timeout(10000) }
    )
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 5: TypeScript check + build**

```bash
cd /home/mike/nebula/workspace-app && npx tsc --noEmit 2>&1 | tail -10
```
Expected: 0 errors.

```bash
npx next build 2>&1 | tail -5
```
Expected: exit 0.

- [ ] **Step 6: Restart and verify**

```bash
sudo systemctl restart nebula-workspace-app.service 2>/dev/null || \
  sudo systemctl restart nebula-nextjs.service 2>/dev/null || true
sleep 4
# Unauthed → 401
curl -s -m 8 -o /dev/null -w "%{http_code}\n" https://app.nebulacomponents.com/api/clients
```
Expected: 401.

- [ ] **Step 7: Commit**

```bash
cd /home/mike/nebula
git add workspace-app/lib/agency.ts \
        workspace-app/app/api/clients/ 
git commit -m "feat: workspace-app BFF routes for agency client management"
```

---

### Task 4: ClientsView + workspace nav

**Blocked by:** Task 3
**Demoable:** Agency user logs into workspace, sees "Clients" nav item; clicking it shows client list with "Add Client" button; adding a client creates it and it appears in the list; client row shows last audit score.

**Files:**
- Create: `workspace-app/components/workspace/clientsView.tsx`
- Modify: `workspace-app/components/workspace/WorkspaceClient.tsx` (add `clients` TabId, nav item, render case)
- Create: `workspace-app/app/clients/page.tsx`

**Interfaces:**
- Consumes: `/api/clients` GET + POST; `/api/clients/[id]` PATCH + DELETE; `/api/clients/[id]/invite` POST; `/api/clients/[id]/audits` GET
- Consumes: `useBrand()` is NOT needed here (Phase B)
- No recharts needed for this view (score shown as text)

- [ ] **Step 1: Create clientsView.tsx**

Create `workspace-app/components/workspace/clientsView.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

interface Client {
  id: string
  name: string
  slug: string
  domain: string
  client_email: string
  status: string
  notes: string | null
  created_at: string
}

interface ClientAudit {
  id: string
  url: string
  status: string
  score: number | null
  grade: string | null
  completed_at: string | null
}

export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Client | null>(null)
  const [audits, setAudits] = useState<ClientAudit[]>([])
  const [auditsLoading, setAuditsLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addDomain, setAddDomain] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data)
        else setError(data.error || 'Failed to load clients')
      })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false))
  }, [])

  async function loadAudits(client: Client) {
    setSelected(client)
    setAudits([])
    setAuditsLoading(true)
    setInviteUrl(null)
    try {
      const r = await fetch(`/api/clients/${client.id}/audits`)
      const data = await r.json()
      setAudits(data.audits || [])
    } catch {
      setAudits([])
    }
    setAuditsLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addName.trim() || !addDomain.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const r = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim(), domain: addDomain.trim(), notes: addNotes.trim() || undefined }),
      })
      const data = await r.json()
      if (!r.ok) { setAddError(data.detail || data.error || 'Failed to create client'); return }
      setClients(prev => [data, ...prev])
      setAddName(''); setAddDomain(''); setAddNotes('')
      setShowAdd(false)
    } catch {
      setAddError('Request failed')
    } finally {
      setAdding(false)
    }
  }

  async function handleInvite(clientId: string) {
    const r = await fetch(`/api/clients/${clientId}/invite`, { method: 'POST' })
    const data = await r.json()
    if (r.ok) setInviteUrl(data.invite_url)
  }

  async function handleUnlink(client: Client) {
    if (!confirm(`Unlink ${client.name}? Their data is preserved but access is revoked.`)) return
    await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    setClients(prev => prev.filter(c => c.id !== client.id))
    if (selected?.id === client.id) { setSelected(null); setAudits([]) }
  }

  if (loading) return <div className="text-fg-dim text-sm">Loading clients...</div>
  if (error && !clients.length) return <div className="text-red-400 text-sm">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg">Clients</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:bg-accent/80"
        >
          {showAdd ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-sm font-medium text-fg">New Client</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-fg-dim mb-1">Client name</label>
              <input
                className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg"
                value={addName} onChange={e => setAddName(e.target.value)}
                placeholder="Acme Corp" required
              />
            </div>
            <div>
              <label className="block text-xs text-fg-dim mb-1">Primary domain</label>
              <input
                className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg"
                value={addDomain} onChange={e => setAddDomain(e.target.value)}
                placeholder="acmecorp.com" required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-fg-dim mb-1">Notes (optional)</label>
            <input
              className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg"
              value={addNotes} onChange={e => setAddNotes(e.target.value)}
            />
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <button
            type="submit" disabled={adding}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg disabled:opacity-50"
          >
            {adding ? 'Creating...' : 'Create Client'}
          </button>
        </form>
      )}

      {clients.length === 0 ? (
        <p className="text-fg-dim text-sm">No clients yet. Add your first client above.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {clients.filter(c => c.status !== 'unlinked').map(client => (
            <div key={client.id}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface ${selected?.id === client.id ? 'bg-surface' : ''}`}
              onClick={() => loadAudits(client)}
            >
              <div>
                <p className="text-sm font-medium text-fg">{client.name}</p>
                <p className="text-xs text-fg-dim">{client.domain}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded ${client.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-border text-fg-dim'}`}>
                  {client.status}
                </span>
                <button onClick={e => { e.stopPropagation(); handleUnlink(client) }}
                  className="text-xs text-fg-dim hover:text-red-400">
                  Unlink
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">{selected.name}</h3>
            <button
              onClick={() => handleInvite(selected.id)}
              className="text-xs text-fg-dim hover:text-accent border border-border rounded px-2 py-1"
            >
              Generate Invite Link
            </button>
          </div>
          <p className="text-xs text-fg-dim font-mono">{selected.client_email}</p>
          {inviteUrl && (
            <div className="rounded bg-surface border border-border p-2">
              <p className="text-xs text-fg-dim mb-1">Share this invite link (expires in 7 days):</p>
              <p className="text-xs font-mono text-accent break-all">{inviteUrl}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-fg-dim mb-2">Recent audits</p>
            {auditsLoading ? (
              <p className="text-xs text-fg-dim">Loading...</p>
            ) : audits.length === 0 ? (
              <p className="text-xs text-fg-dim">No audits yet. Run an audit for {selected.domain} to see results here.</p>
            ) : (
              <div className="divide-y divide-border rounded border border-border">
                {audits.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2">
                    <p className="text-xs text-fg truncate max-w-[60%]">{a.url}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.score != null && (
                        <span className="text-xs font-medium text-fg">{Math.round(a.score / 10)}/100</span>
                      )}
                      {a.grade && <span className="text-xs text-fg-dim">{a.grade}</span>}
                      <span className={`text-xs ${a.status === 'completed' ? 'text-accent' : 'text-fg-dim'}`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into WorkspaceClient.tsx**

In `workspace-app/components/workspace/WorkspaceClient.tsx`:

**a.** Add `'clients'` to the `TabId` union (around line 98):

```typescript
  | 'clients'
```

**b.** Add `'clients'` to `VALID_TAB_IDS`:

```typescript
const VALID_TAB_IDS = new Set<string>([
  // ... existing entries ...
  'clients',
])
```

**c.** Add to `TAB_ROUTES`:

```typescript
  clients: '/clients',
```

**d.** Add dynamic import at the top of the component imports section:

```typescript
const ClientsView = dynamic(() => import('./clientsView'))
```

**e.** Add "Clients" to the `navGroups` array, inside the "Account & Team" group, after `team` and before `settings`, but only when `isAgency` is true. First, add `isAgency` state fetched from the org. Near the top of the `WorkspaceClient` component function, add:

```typescript
const [isAgency, setIsAgency] = useState(false)

useEffect(() => {
  fetch('/api/organizations/current')
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data?.is_agency) setIsAgency(true) })
    .catch(() => {})
}, [])
```

You'll need to add a `/api/organizations/current` BFF route (Step 3 below).

**f.** In `navGroups`, inside "Account & Team" items, add conditionally:

```typescript
...(isAgency ? [{ id: 'clients' as TabId, label: 'Clients', icon: 'users' }] : []),
```

**g.** In the render switch, add:

```typescript
{tab === 'clients' && <ClientsView />}
```

- [ ] **Step 3: Add /api/organizations/current BFF route**

Create `workspace-app/app/api/organizations/current/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { platformPool } from '@/lib/platform-db'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response

  try {
    const result = await platformPool.query(
      `SELECT o.id::text, o.name, o.slug, o.is_agency
       FROM organizations o
       JOIN memberships m ON m.organization_id = o.id
       WHERE m.user_id = $1 AND m.status = 'active'
       ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
       LIMIT 1`,
      [auth.user.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('[workspace-app org current]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create /clients page route**

Create `workspace-app/app/clients/page.tsx`:

```typescript
import { makeWorkspacePage } from '@/components/workspace/makeWorkspacePage'
const Page = makeWorkspacePage('clients')
export default Page
```

- [ ] **Step 7: Create invite acceptance flow**

Add a second router `accept_router` in `platform_api/routes/agency_clients.py` (prefix `/api/clients`) with a `POST /invite/accept?token=...` endpoint that validates the token, links `invited_user_id`, clears the token, and returns `{client_email, client_name}`. Register it in `main.py`.

Add `workspace-app/app/invite/[token]/page.tsx` — client component that on mount calls `POST /api/clients/invite/accept {token}`, shows success/error, redirects to `/` on success.

Add `workspace-app/app/api/clients/invite/accept/route.ts` — BFF proxy that requires session auth and forwards to `platform_api /api/clients/invite/accept?token=...`.

Full code for all three is in the spec (`docs/superpowers/specs/2026-08-25-agency-client-management-design.md` — Invite section). Implement verbatim.

- [ ] **Step 8: TypeScript check + build (Task 4)**

---

### Task 5: E2E verification

**Blocked by:** Task 4
**Demoable:** Agency user creates a client, views it in the Clients tab, generates an invite link.

**Files:**
- Evidence: `.superpowers/sdd/agency-clients-e2e-evidence.md`

- [ ] **Step 1: Verify platform API routes live**

```bash
INTERNAL_API_SECRET=$(cat /proc/$(systemctl show -p MainPID --value nebula-platform-api.service)/environ | tr '\0' '\n' | grep INTERNAL_API_SECRET | cut -d= -f2-)
ORG_ID="07ed2178-a7a8-4dc4-b432-03887ebe51e1"

# Unauthenticated list → 401 or 403
curl -s -m 5 "http://127.0.0.1:8001/api/organizations/$ORG_ID/clients" | python3 -m json.tool
```
Expected: auth error, not 404.

- [ ] **Step 2: Mint founder session and CRUD**

Mint session as before (`mint_founder_session.py`). Then:

```bash
FOUNDER_TOKEN=<token>

# Create client
curl -s -m 10 -X POST \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","domain":"acmecorp.com","notes":"Test client"}' \
  "http://127.0.0.1:8001/api/organizations/$ORG_ID/clients" | python3 -m json.tool
```
Expected: `{"id":"...","name":"Acme Corp","slug":"acme-corp","client_email":"acme-corp+07ed2178@clients.nebulacomponents.com",...}`

```bash
CLIENT_ID=<id from above>

# List clients
curl -s -m 10 -H "Authorization: Bearer $FOUNDER_TOKEN" \
  "http://127.0.0.1:8001/api/organizations/$ORG_ID/clients" | python3 -m json.tool

# Invite
curl -s -m 10 -X POST \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  "http://127.0.0.1:8001/api/organizations/$ORG_ID/clients/$CLIENT_ID/invite" | python3 -m json.tool
```
Expected: `{"invite_url":"https://app.nebulacomponents.com/invite/...","expires_at":"..."}`

```bash
# Audit history (empty)
curl -s -m 10 -H "Authorization: Bearer $FOUNDER_TOKEN" \
  "http://127.0.0.1:8001/api/organizations/$ORG_ID/clients/$CLIENT_ID/audits" | python3 -m json.tool
```
Expected: `{"client_email":"acme-corp+07ed2178@clients.nebulacomponents.com","audits":[]}`

- [ ] **Step 3: Unlink + verify**

```bash
curl -s -m 10 -X DELETE \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  "http://127.0.0.1:8001/api/organizations/$ORG_ID/clients/$CLIENT_ID"
# Status 204 expected

# List should now be empty
curl -s -m 10 -H "Authorization: Bearer $FOUNDER_TOKEN" \
  "http://127.0.0.1:8001/api/organizations/$ORG_ID/clients" | python3 -m json.tool
```
Expected: `[]`

- [ ] **Step 4: Journals + blast radius**

```bash
timeout 8 bash -c "journalctl -u nebula-platform-api.service -n 20 --no-pager 2>&1 | grep -iE 'error|exception|traceback' | grep -v 'score_bucket\|audit_result dispatch'" || echo "journals clean"
curl -s -o /dev/null -w "/ -> %{http_code}\n" https://nebulacomponents.com/
curl -s -o /dev/null -w "/audit -> %{http_code}\n" https://nebulacomponents.com/audit
```
Expected: journals clean; blast radius 200.

- [ ] **Step 5: Full test suite**

```bash
cd /home/mike/nebula && uv run python -m pytest tests/ -q --tb=no 2>&1 | tail -5
```
Expected: 656+ passed (new agency client tests included), 0 failures.

- [ ] **Step 6: Revoke session + cleanup**

```bash
# Revoke session (redis-cli DEL session:{user_id}:{jti})
JTI_VAL=$(python3 -c "
import json,base64,sys
t='$FOUNDER_TOKEN'
p=t.split('.')[1];p+='='*(4-len(p)%4)
d=json.loads(base64.b64decode(p))
print(d['jti']+'|'+d['user_id'])
")
JTI=$(echo $JTI_VAL | cut -d'|' -f1)
UID=$(echo $JTI_VAL | cut -d'|' -f2)
redis-cli DEL "session:$UID:$JTI"
```

- [ ] **Step 7: Write evidence file and commit**

Write `.superpowers/sdd/agency-clients-e2e-evidence.md` with all verbatim outputs.

```bash
git add -f .superpowers/sdd/agency-clients-e2e-evidence.md
git commit -m "docs: agency clients Phase A e2e evidence"
```

---

## File Map

| File | Action | Task |
|---|---|---|
| `platform_api/migrations/20260825_agency_clients.sql` | Create | T0 |
| `platform_api/db/models.py` | Modify (AgencyClient model) | T0 |
| `platform_api/routes/agency_clients.py` | Create | T1 |
| `platform_api/main.py` | Modify (include router) | T1 |
| `tests/test_agency_clients.py` | Create | T1 |
| `platform_api/routes/audit_api.py` | Modify (client email entitlement bypass) | T2 |
| `workspace-app/lib/agency.ts` | Create | T3 |
| `workspace-app/app/api/clients/route.ts` | Create | T3 |
| `workspace-app/app/api/clients/[clientId]/route.ts` | Create | T3 |
| `workspace-app/app/api/clients/[clientId]/invite/route.ts` | Create | T3 |
| `workspace-app/app/api/clients/[clientId]/audits/route.ts` | Create | T3 |
| `workspace-app/components/workspace/clientsView.tsx` | Create | T4 |
| `workspace-app/components/workspace/WorkspaceClient.tsx` | Modify | T4 |
| `workspace-app/app/clients/page.tsx` | Create | T4 |
| `workspace-app/app/api/organizations/current/route.ts` | Create | T4 |
| `workspace-app/app/invite/[token]/page.tsx` | Create | T4 |
| `workspace-app/app/api/clients/invite/accept/route.ts` | Create | T4 |
| `.superpowers/sdd/agency-clients-e2e-evidence.md` | Create | T5 |
