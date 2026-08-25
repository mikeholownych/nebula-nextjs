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
from sqlalchemy.orm import Session

from ..auth.routes import get_current_user
from ..db.models import AgencyClient, Membership, Organization
from ..db.session import get_session as get_db
from ..services.audit_db import audit_db as _audit_db

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
    return slug[:40].strip("-")   # strip AFTER truncation too


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
    db: Session,
    min_role: str = "member",
) -> Organization:
    """Return org if caller has active membership + org is_agency=True.

    Raises 403 if no membership, 403 if not an agency org.
    """
    user_id = UUID(current_user["user_id"])
    result = db.execute(
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

    result = db.execute(select(Organization).where(Organization.id == org_id))
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
    db: Session = Depends(get_db),
):
    """List active clients for an agency org."""
    await _require_agency_membership(org_id, current_user, db)
    result = db.execute(
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
    db: Session = Depends(get_db),
):
    """Create a new client under an agency org."""
    await _require_agency_membership(org_id, current_user, db, min_role="admin")

    slug = derive_slug(body.name)
    if not slug:
        raise HTTPException(status_code=400, detail="Name produces an empty slug")

    # Check slug uniqueness within org
    existing = db.execute(
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
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    org_id: UUID,
    client_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single client by ID."""
    await _require_agency_membership(org_id, current_user, db)
    result = db.execute(
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
    db: Session = Depends(get_db),
):
    """Update client name, domain, notes, or status."""
    await _require_agency_membership(org_id, current_user, db, min_role="admin")
    result = db.execute(
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

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
async def unlink_client(
    org_id: UUID,
    client_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unlink a client. Data is preserved; invited user access is revoked."""
    await _require_agency_membership(org_id, current_user, db, min_role="owner")
    result = db.execute(
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
    db.commit()


@router.post("/{client_id}/invite")
async def invite_client(
    org_id: UUID,
    client_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a single-use invite token for the client to access their workspace."""
    await _require_agency_membership(org_id, current_user, db, min_role="admin")
    result = db.execute(
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
    db.commit()

    return {
        "invite_url": f"https://app.nebulacomponents.com/invite/{token}",
        "expires_at": client.invite_expires_at.isoformat(),
    }


@router.get("/{client_id}/audits")
async def list_client_audits(
    org_id: UUID,
    client_id: UUID,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return audit history for a client (keyed by client_email in nebula_audit)."""
    await _require_agency_membership(org_id, current_user, db)
    result = db.execute(
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


# ---------------------------------------------------------------------------
# Invite acceptance router (prefix /api/clients)
# ---------------------------------------------------------------------------

accept_router = APIRouter(
    prefix="/api/clients",
    tags=["agency-clients-invite"],
)


@accept_router.post("/invite/accept")
async def accept_invite(
    token: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a client invite by token. Links the current user to the client record.

    The token is validated for existence and expiry. On success the
    invited_user_id is set, the token is cleared, and the client name is
    returned so the workspace can greet the user.
    """
    from sqlalchemy import and_

    user_id = UUID(current_user["user_id"])

    result = db.execute(
        select(AgencyClient).where(
            and_(
                AgencyClient.invite_token == token,
                AgencyClient.status == "active",
            )
        )
    )
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(status_code=404, detail="Invite token not found or already used")

    now = datetime.now(timezone.utc)
    if client.invite_expires_at and client.invite_expires_at < now:
        raise HTTPException(status_code=410, detail="Invite token has expired")

    client.invited_user_id = user_id
    client.invite_token = None
    client.invite_expires_at = None
    client.updated_at = now
    db.commit()

    return {
        "client_name": client.name,
        "client_email": client.client_email,
    }
