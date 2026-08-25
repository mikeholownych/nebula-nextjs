"""Agency custom and Nebula-managed tenant domain routes."""

import re
import secrets
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..auth.routes import get_current_user
from ..db.session import get_session as get_db
from ..services.cloudflare_hostnames import CloudflareHostnamesAdapter, CloudflareNotConfigured
from .agency_clients import _require_agency_membership

router = APIRouter(tags=["tenant-domains"])
HOST_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$")


class DomainCreate(BaseModel):
    hostname: Optional[str] = Field(default=None, max_length=253)


def normalize_host(value: str) -> str:
    host = value.strip().lower().rstrip(".")
    if "://" in host or "/" in host or not HOST_RE.fullmatch(host):
        raise HTTPException(status_code=400, detail="Enter a valid hostname without a scheme or path")
    return host


async def _admin(org_id: UUID, current_user: dict, db: Session):
    return await _require_agency_membership(org_id, current_user, db, min_role="admin")


def _rows(db: Session, org_id: UUID):
    return db.execute(
        text("""SELECT id, domain, status, verified_by, verified_at, verification_token
               FROM org_domains WHERE organization_id = :org ORDER BY created_at DESC"""),
        {"org": str(org_id)},
    ).mappings().all()


@router.get("/api/organizations/{org_id}/domains")
async def list_domains(org_id: UUID, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    await _require_agency_membership(org_id, current_user, db)
    return [dict(row) for row in _rows(db, org_id)]


@router.post("/api/organizations/{org_id}/domains", status_code=201)
async def create_domain(org_id: UUID, body: DomainCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    org = await _admin(org_id, current_user, db)
    managed = not body.hostname
    hostname = f"{org.slug}.app.nebulacomponents.com" if managed else normalize_host(body.hostname or "")
    if hostname.endswith(".app.nebulacomponents.com") and not managed:
        raise HTTPException(status_code=400, detail="Use the managed subdomain option for app.nebulacomponents.com")
    existing = db.execute(
        text("SELECT 1 FROM org_domains WHERE domain=:domain AND status IN ('active', 'pending_verification') LIMIT 1"),
        {"domain": hostname},
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Domain is already claimed")
    if not managed:
        existing_custom = db.execute(
            text("""SELECT 1 FROM org_domains
                    WHERE organization_id=:org AND status IN ('active', 'pending_verification')
                      AND domain NOT LIKE '%.app.nebulacomponents.com'
                    LIMIT 1"""),
            {"org": str(org_id)},
        ).first()
        if existing_custom:
            raise HTTPException(status_code=409, detail="Organization already has a custom domain")
    if not managed:
        try:
            created = await CloudflareHostnamesAdapter().create_hostname(hostname)
        except CloudflareNotConfigured as exc:
            raise HTTPException(status_code=503, detail=str(exc))
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc))
        cf_id = (created.get("result") or {}).get("id")
        domain_status, verified_by, token = "pending_verification", "dns_txt", secrets.token_urlsafe(24)
    else:
        cf_id, domain_status, verified_by, token = None, "active", "managed", None
    try:
        row = db.execute(
            text("""INSERT INTO org_domains
                    (organization_id, domain, status, verified_by, verified_at, created_by,
                     verification_token, cf_hostname_id)
                    VALUES (:org, :domain, :status, :verified_by, now(), :user,
                            :token, :cf_id)
                    RETURNING id, domain, status, verified_by, verified_at, verification_token"""),
            {"org": str(org_id), "domain": hostname, "status": domain_status, "verified_by": verified_by,
             "user": current_user["user_id"], "token": token, "cf_id": cf_id},
        ).mappings().one()
        db.commit()
    except Exception:
        db.rollback()
        if cf_id:
            try:
                await CloudflareHostnamesAdapter().delete_hostname(cf_id)
            except Exception:
                raise HTTPException(status_code=502, detail="Domain provisioning could not be completed")
        raise HTTPException(status_code=409, detail="Domain is already claimed")
    return dict(row)


@router.post("/api/organizations/{org_id}/domains/{domain_id}/verify")
async def verify_domain(org_id: UUID, domain_id: UUID, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    await _admin(org_id, current_user, db)
    row = db.execute(text("SELECT domain, status FROM org_domains WHERE id=:id AND organization_id=:org"), {"id": str(domain_id), "org": str(org_id)}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Domain not found")
    if row["status"] == "active":
        return {"status": "active", "message": "Domain is active"}
    try:
        cloudflare_status = await CloudflareHostnamesAdapter().get_hostname_status(row["domain"])
    except CloudflareNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    if cloudflare_status.get("status") != "active":
        return {"status": "pending", "message": "DNS and certificate verification is still pending"}
    db.execute(text("""UPDATE org_domains SET status='active', verified_by='dns_txt', verified_at=now(), updated_at=now()
                      WHERE id=:id AND organization_id=:org"""), {"id": str(domain_id), "org": str(org_id)})
    db.commit()
    return {"status": "active", "message": "Domain verified"}


@router.delete("/api/organizations/{org_id}/domains/{domain_id}", status_code=204)
async def delete_domain(org_id: UUID, domain_id: UUID, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    await _admin(org_id, current_user, db)
    row = db.execute(text("SELECT cf_hostname_id FROM org_domains WHERE id=:id AND organization_id=:org"), {"id": str(domain_id), "org": str(org_id)}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Domain not found")
    if row["cf_hostname_id"]:
        try:
            await CloudflareHostnamesAdapter().delete_hostname(row["cf_hostname_id"])
        except CloudflareNotConfigured as exc:
            raise HTTPException(status_code=503, detail=str(exc))
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc))
        except Exception:
            raise HTTPException(status_code=502, detail="Could not remove Cloudflare hostname")
    db.execute(text("UPDATE org_domains SET status='revoked', updated_at=now() WHERE id=:id"), {"id": str(domain_id)})
    db.commit()
