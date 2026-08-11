"""Report generation routes.

Endpoints:
- GET /api/report/pdf?audit_id=<id>[&share=<token>] - branded audit PDF

Access: the audit's owner (authenticated session) or anyone holding the
audit share token. Agency branding (agency_name / agency_logo_url) is read
from the owner's workspace_preferences JSONB.
"""

import io
import json
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from platform_api.auth.routes import get_current_user
from platform_api.db.session import get_session
from platform_api.redis_client import get_redis
from platform_api.reports.pdf_generator import generate_audit_pdf
from platform_api.services.audit_db import audit_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/report", tags=["reports"])


def _get_branding(db: Session, email: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Read agency_name / agency_logo_url from workspace_preferences JSONB."""
    if not email:
        return None, None
    try:
        row = db.execute(
            text("SELECT preferences FROM workspace_preferences WHERE email = :e"),
            {"e": email.strip().lower()},
        ).first()
        if not row or not row[0]:
            return None, None
        prefs = row[0] if isinstance(row[0], dict) else json.loads(row[0])
        return prefs.get("agency_name") or None, prefs.get("agency_logo_url") or None
    except Exception:
        logger.warning("branding lookup failed for %s", email, exc_info=True)
        return None, None


@router.get("/pdf")
async def get_report_pdf(
    request: Request,
    audit_id: str = Query(...),
    share: Optional[str] = Query(default=None),
    db: Session = Depends(get_session),
    redis=Depends(get_redis),
):
    """Stream the audit report as a PDF attachment.

    Two access paths:
      1. `share` matches the audit's share_token - read-only share link.
      2. Authenticated session whose email owns the audit.
    Branding comes from the audit owner's preferences for share links, and
    from the requesting user's preferences for authenticated downloads.
    """
    try:
        audit_uuid = UUID(audit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit ID format")

    branding_email: Optional[str] = None

    if share:
        audit = await audit_db.get_audit_by_share_token(share)
        if not audit or audit.get("audit_id") != audit_id:
            raise HTTPException(status_code=404, detail="Audit not found")
        branding_email = audit.get("email")
    else:
        try:
            current = await get_current_user(request, redis, db)
        except HTTPException:
            raise HTTPException(status_code=401, detail="Authentication required")
        audit = await audit_db.get_audit(audit_uuid)
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        user_email = (current.get("user").email or "").strip().lower()
        owner_email = (audit.get("email") or "").strip().lower()
        if not user_email or user_email != owner_email:
            raise HTTPException(status_code=403, detail="You do not own this audit")
        branding_email = user_email

    agency_name, agency_logo_url = _get_branding(db, branding_email)

    try:
        pdf_bytes = generate_audit_pdf(
            audit,
            audit.get("findings") or [],
            agency_name=agency_name,
            agency_logo_url=agency_logo_url,
        )
    except Exception:
        logger.exception("PDF generation failed for audit %s", audit_id)
        raise HTTPException(status_code=500, detail="PDF generation failed")

    filename = f"nebula-audit-{audit_id[:8]}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-cache",
        },
    )
