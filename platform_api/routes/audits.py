"""Audit management routes."""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models import Audit, Membership, Organization, User
from ..db.session import get_session as get_db
from ..auth.routes import get_current_user


router = APIRouter(prefix="/api/audits", tags=["audits"])


# Request/Response models
class AuditCreate(BaseModel):
    org_id: UUID
    site_url: HttpUrl


class AuditResponse(BaseModel):
    id: UUID
    org_id: UUID
    user_id: UUID
    site_url: str
    status: str
    score: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class AuditDetailResponse(AuditResponse):
    metadata: dict


@router.post("", response_model=AuditResponse)
async def create_audit(
    audit_data: AuditCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new audit request."""
    # Check membership
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.organization_id == audit_data.org_id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization",
        )

    # Create audit
    audit = Audit(
        org_id=audit_data.org_id,
        user_id=user.id,
        site_url=str(audit_data.site_url),
        status="pending",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(audit)

    return audit


@router.get("", response_model=List[AuditResponse])
async def list_audits(
    org_id: Optional[UUID] = None,
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List audits for user's organizations."""
    # Get user's organization IDs
    result = await db.execute(
        select(Membership.organization_id).where(Membership.user_id == user.id)
    )
    org_ids = [row[0] for row in result.fetchall()]

    if not org_ids:
        return []

    # Build query
    query = select(Audit).where(Audit.org_id.in_(org_ids))

    if org_id:
        if org_id not in org_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this organization",
            )
        query = query.where(Audit.org_id == org_id)

    query = query.order_by(desc(Audit.created_at)).limit(limit).offset(offset)

    result = await db.execute(query)
    audits = result.scalars().all()

    return audits


@router.get("/{audit_id}", response_model=AuditDetailResponse)
async def get_audit(
    audit_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get audit details."""
    # Get audit
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()

    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found",
        )

    # Check membership
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.organization_id == audit.org_id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this audit",
        )

    return audit
