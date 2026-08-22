"""GA4 customer integration routes (Phase 1).

Exposure class: USER_SESSION_AUTHENTICATED (every route requires a live
session). Tokens are encrypted at rest via infra.secret_box. The stored
property_id is validated against the caller's own accountSummaries before it
is persisted - a caller can never bind a property they do not own.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from platform_api.db import get_session
from platform_api.db.models import Ga4Connection
from platform_api.ga4.oauth import (
    GA4OAuthError,
    exchange_ga4_code,
    get_ga4_auth_url,
    list_account_summaries,
    refresh_ga4_token,
    validate_ga4_state,
)
from platform_api.infra.secret_box import decrypt as sb_decrypt, encrypt as sb_encrypt
from platform_api.auth.routes import get_current_user
from platform_api.redis_client import get_redis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ga4", tags=["ga4"])

_PORTAL_SETTINGS_URL = "https://nebulacomponents.com/workspace?tab=integrations"


def _current_connection(db: Session, user_id) -> Optional[Ga4Connection]:
    return (
        db.query(Ga4Connection)
        .filter(Ga4Connection.user_id == user_id)
        .first()
    )


def _valid_access_token(conn: Ga4Connection, db: Session) -> str:
    """Decrypt + refresh-on-expiry. Returns plaintext access token."""
    now = datetime.now(timezone.utc)
    expiring = conn.token_expiry is None or conn.token_expiry.replace(
        tzinfo=timezone.utc
    ) <= now
    if not conn.access_token or expiring:
        if not conn.refresh_token:
            raise HTTPException(
                status_code=401,
                detail="GA4 token expired - please reconnect",
            )
        try:
            refreshed = refresh_ga4_token(sb_decrypt(conn.refresh_token))
        except Exception as exc:
            raise HTTPException(status_code=401, detail=str(exc)[:120]) from exc
        conn.access_token = sb_encrypt(refreshed["access_token"])
        if refreshed.get("expiry"):
            conn.token_expiry = refreshed["expiry"]
        db.commit()
    try:
        return sb_decrypt(conn.access_token)
    except RuntimeError:
        raise HTTPException(
            status_code=401, detail="Stored token unreadable - please reconnect"
        )


@router.get("/connect")
async def ga4_connect(
    request: Request,
    auth=Depends(get_current_user),
    redis=Depends(get_redis),
):
    """Redirect to Google consent (analytics.readonly). Session required."""
    from platform_api.auth.routes import get_current_user  # noqa: F811

    user_id = auth["user_id"]
    try:
        auth_url = await get_ga4_auth_url(redis, str(user_id))
    except GA4OAuthError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return RedirectResponse(url=auth_url, status_code=302)


class PropertySelect(BaseModel):
    property_id: str

    @field_validator("property_id")
    @classmethod
    def _shape(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("properties/") or not v.split("/", 1)[1].isdigit():
            raise ValueError("property_id must look like 'properties/<numeric>'")
        return v


@router.get("/callback")
async def ga4_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    redis=Depends(get_redis),
    db: Session = Depends(get_session),
):
    if error:
        return RedirectResponse(url=_PORTAL_SETTINGS_URL, status_code=302)
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    try:
        state_data = await validate_ga4_state(redis, state)
    except GA4OAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    try:
        tokens = exchange_ga4_code(code, state_data["code_verifier"])
    except GA4OAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user_id = state_data["user_id"]
    conn = _current_connection(db, user_id)
    if conn:
        conn.access_token = sb_encrypt(tokens["access_token"])
        conn.refresh_token = (
            sb_encrypt(tokens["refresh_token"])
            if tokens.get("refresh_token")
            else conn.refresh_token
        )
        conn.token_expiry = tokens.get("expiry")
    else:
        conn = Ga4Connection(
            user_id=user_id,
            access_token=sb_encrypt(tokens["access_token"]),
            refresh_token=(
                sb_encrypt(tokens["refresh_token"]) if tokens.get("refresh_token") else None
            ),
            token_expiry=tokens.get("expiry"),
        )
        db.add(conn)
    db.commit()
    logger.info("[ga4] connected user=%s", str(user_id)[:8])
    return RedirectResponse(url=f"{_PORTAL_SETTINGS_URL}&ga4=connected", status_code=302)


@router.get("/properties")
async def ga4_properties(
    auth=Depends(get_current_user),
    redis=Depends(get_redis),
    db: Session = Depends(get_session),
):
    """List the caller's own GA4 properties (ownership-bound picker data)."""
    conn = _current_connection(db, auth["user_id"])
    if not conn or not conn.refresh_token:
        raise HTTPException(status_code=404, detail="No GA4 connection - connect first")

    token = _valid_access_token(conn, db)
    summaries = await list_account_summaries(token)

    # Filter to the stored selection when one exists.
    selected = conn.property_id
    return {
        "properties": [
            {
                "property_id": p["property_id"],
                "display_name": p["display_name"],
                "selected": p["property_id"] == selected,
            }
            for p in summaries
        ]
    }


@router.post("/select")
async def ga4_select_property(
    body: PropertySelect,
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Persist the chosen property AFTER proving it belongs to the caller."""
    conn = _current_connection(db, auth["user_id"])
    if not conn:
        raise HTTPException(status_code=404, detail="No GA4 connection - connect first")

    token = _valid_access_token(conn, db)
    summaries = await list_account_summaries(token)
    match = next((p for p in summaries if p["property_id"] == body.property_id), None)
    if not match:
        # Existence-hiding: do not reveal whether the property exists elsewhere.
        raise HTTPException(status_code=403, detail="Property not available for this account")

    conn.property_id = body.property_id
    conn.property_display_name = match.get("display_name")
    db.commit()
    return {
        "property_id": conn.property_id,
        "display_name": conn.property_display_name,
    }


@router.get("/status")
async def ga4_status(
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    conn = _current_connection(db, auth["user_id"])
    return {
        "connected": bool(conn and conn.refresh_token),
        "property_id": conn.property_id if conn else None,
        "property_display_name": conn.property_display_name if conn else None,
        "connected_at": conn.connected_at.isoformat() if conn else None,
    }


@router.delete("/disconnect")
async def ga4_disconnect(
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Full erasure: tokens + selection (cached aggregates expire by TTL)."""
    conn = _current_connection(db, auth["user_id"])
    if conn:
        db.delete(conn)
        db.commit()
    return {"disconnected": True}
