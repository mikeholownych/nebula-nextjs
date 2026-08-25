"""Agency workspace brand profile routes."""

import os
import re
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..auth.routes import get_current_user
from ..db.models import BrandProfile
from ..db.session import get_session as get_db
from ..services.object_storage import ALLOWED_LOGO_TYPES, ObjectStorage, ObjectStorageNotConfigured
from .agency_clients import _require_agency_membership

router = APIRouter(tags=["brand-profiles"])
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class BrandCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)
    primary_color: str = "#c7ff2f"
    support_email: Optional[EmailStr] = None
    footer_text: Optional[str] = Field(default=None, max_length=500)

    @field_validator("primary_color")
    @classmethod
    def valid_color(cls, value: str) -> str:
        if not COLOR_RE.fullmatch(value):
            raise ValueError("primary_color must be a six-digit hex color")
        return value.lower()


class BrandUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    logo_url: Optional[str] = None
    logo_dark_url: Optional[str] = None
    primary_color: Optional[str] = None
    support_email: Optional[EmailStr] = None
    footer_text: Optional[str] = Field(default=None, max_length=500)
    published: Optional[bool] = None

    @field_validator("primary_color")
    @classmethod
    def valid_color(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not COLOR_RE.fullmatch(value):
            raise ValueError("primary_color must be a six-digit hex color")
        return value.lower() if value else value

    @field_validator("logo_url", "logo_dark_url")
    @classmethod
    def valid_logo_url(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.startswith(("https://", "http://")):
            raise ValueError("logo URL must be absolute")
        return value


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    display_name: str
    logo_url: Optional[str]
    logo_dark_url: Optional[str]
    primary_color: str
    support_email: Optional[str]
    footer_text: Optional[str]
    published: bool
    created_at: datetime
    updated_at: datetime


def _profile(db: Session, org_id: UUID) -> Optional[BrandProfile]:
    return db.query(BrandProfile).filter(BrandProfile.organization_id == org_id).first()


async def _agency_admin(org_id: UUID, current_user: dict, db: Session):
    return await _require_agency_membership(org_id, current_user, db, min_role="admin")


@router.get("/api/organizations/{org_id}/brand", response_model=BrandResponse)
async def get_brand(org_id: UUID, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    await _require_agency_membership(org_id, current_user, db)
    profile = _profile(db, org_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return profile


@router.post("/api/organizations/{org_id}/brand", response_model=BrandResponse, status_code=201)
async def create_brand(
    org_id: UUID,
    body: BrandCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    await _agency_admin(org_id, current_user, db)
    if _profile(db, org_id):
        raise HTTPException(status_code=409, detail="Brand profile already exists")
    profile = BrandProfile(organization_id=org_id, **body.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/api/organizations/{org_id}/brand", response_model=BrandResponse)
async def update_brand(
    org_id: UUID,
    body: BrandUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    await _agency_admin(org_id, current_user, db)
    profile = _profile(db, org_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key in {"logo_url", "logo_dark_url"} and value is not None:
            _validate_logo_url(value, org_id)
        setattr(profile, key, value)
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/api/organizations/{org_id}/brand", status_code=204)
async def delete_brand(org_id: UUID, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    await _agency_admin(org_id, current_user, db)
    profile = _profile(db, org_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    db.delete(profile)
    db.commit()


@router.post("/api/organizations/{org_id}/brand/logo-upload-url")
async def logo_upload_url(
    org_id: UUID,
    content_type: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    await _agency_admin(org_id, current_user, db)
    if content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(status_code=400, detail="Logo must be PNG, SVG, or WebP")
    try:
        return ObjectStorage().create_logo_upload(org_id, content_type)
    except ObjectStorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Could not prepare logo upload")


def _validate_logo_url(value: str, org_id: UUID) -> None:
    public_url = os.getenv("R2_PUBLIC_URL", "").rstrip("/")
    parsed = urlparse(value)
    expected_prefix = f"/organizations/{org_id}/brand/logo-"
    if (
        not public_url
        or f"{parsed.scheme}://{parsed.netloc}" != public_url
        or not parsed.path.startswith(expected_prefix)
        or not re.fullmatch(rf"{re.escape(expected_prefix)}[0-9a-f-]+\.(?:png|svg|webp)", parsed.path)
    ):
        raise HTTPException(status_code=400, detail="Logo URL must be an uploaded organization logo")


@router.get("/api/tenant-brand")
async def tenant_brand(domain: str = Query(...), db: Session = Depends(get_db)):
    host = domain.strip().lower().split(":", 1)[0].rstrip(".")
    row = db.execute(
        text(
            """SELECT bp.display_name, bp.logo_url, bp.logo_dark_url, bp.primary_color,
                      bp.support_email, bp.footer_text, o.id AS org_id, o.slug AS org_slug
               FROM brand_profiles bp
               JOIN organizations o ON o.id = bp.organization_id
               JOIN org_domains od ON od.organization_id = o.id
              WHERE lower(od.domain) = :domain
                AND od.status = 'active'
                AND bp.published = true
              LIMIT 1"""
        ),
        {"domain": host},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Tenant brand not found")
    return dict(row)
