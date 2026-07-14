"""Organization management routes."""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, HttpUrl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models import Audit, Membership, Organization, User
from ..db.session import get_db
from .auth.routes import get_current_user


router = APIRouter(prefix="/api/organizations", tags=["organizations"])


# Request/Response models
class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    is_agency: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    is_agency: Optional[bool] = None


class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class MemberInvite(BaseModel):
    email: EmailStr
    role: str = "member"


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get organization by ID."""
    # Check membership
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.organization_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or you don't have access",
        )

    # Get organization
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return org


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    update_data: OrganizationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update organization."""
    # Check membership (must be owner or admin)
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.organization_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership or membership.role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can update organization",
        )

    # Get organization
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one()

    # Update fields
    if update_data.name is not None:
        org.name = update_data.name
    if update_data.is_agency is not None:
        org.is_agency = update_data.is_agency

    await db.commit()
    await db.refresh(org)

    return org


@router.get("/{org_id}/members", response_model=List[MemberResponse])
async def list_members(
    org_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List organization members."""
    # Check membership
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.organization_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or you don't have access",
        )

    # List all members
    result = await db.execute(
        select(Membership).where(Membership.organization_id == org_id)
    )
    members = result.scalars().all()

    return members


@router.post("/{org_id}/invites", response_model=MemberResponse)
async def invite_member(
    org_id: UUID,
    invite: MemberInvite,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a member to organization."""
    # Check membership (must be owner or admin)
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.organization_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership or membership.role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can invite members",
        )

    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == invite.email)
    )
    invited_user = result.scalar_one_or_none()

    if not invited_user:
        # Create user (will be completed on first login)
        invited_user = User(email=invite.email)
        db.add(invited_user)
        await db.flush()

    # Check if already member
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == invited_user.id,
            Membership.organization_id == org_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member",
        )

    # Create membership
    new_membership = Membership(
        user_id=invited_user.id,
        organization_id=org_id,
        role=invite.role,
    )
    db.add(new_membership)
    await db.commit()
    await db.refresh(new_membership)

    return new_membership
