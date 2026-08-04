"""Google Search Console API routes.

Endpoints:
- GET  /api/gsc/connect    — start OAuth flow (redirects to Google)
- GET  /api/gsc/callback   — receive authorization code, save tokens
- DELETE /api/gsc/disconnect — remove the user's GSC connection
- GET  /api/gsc/status     — {connected, site_url, connected_at}
- GET  /api/gsc/metrics    — {clicks, impressions, avg_ctr, avg_position, top_pages}
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from platform_api.auth.routes import get_current_user
from platform_api.config import settings
from platform_api.db.models import GscConnection
from platform_api.db.session import get_session
from platform_api.redis_client import get_redis

from .oauth import (
    GSCOAuthError,
    exchange_gsc_code,
    get_gsc_auth_url,
    refresh_gsc_token,
    validate_gsc_state,
)

router = APIRouter(prefix="/api/gsc", tags=["gsc"])

# Portal redirect after successful connect
_PORTAL_SUCCESS_URL = "/workspace?tab=settings"
_PORTAL_ERROR_URL = "/workspace?tab=settings&gsc_error=1"


def _gsc_redirect_uri() -> str:
    """Build the absolute GSC callback URI."""
    base = settings.PUBLIC_BASE_URL.rstrip("/")
    return f"{base}/api/gsc/callback"


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class GscStatusResponse(BaseModel):
    connected: bool
    site_url: Optional[str] = None
    connected_at: Optional[str] = None


class TopPage(BaseModel):
    url: str
    clicks: int
    impressions: int
    position: float


class GscMetricsResponse(BaseModel):
    clicks: int
    impressions: int
    avg_ctr: float
    avg_position: float
    top_pages: List[TopPage]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_or_refresh_token(conn: GscConnection, db: Session) -> str:
    """Return a valid access token, refreshing if necessary."""
    now = datetime.now(timezone.utc)
    needs_refresh = (
        not conn.access_token
        or (
            conn.token_expiry is not None
            and conn.token_expiry.replace(tzinfo=timezone.utc) <= now + timedelta(minutes=5)
        )
    )

    if needs_refresh:
        if not conn.refresh_token:
            raise HTTPException(
                status_code=401,
                detail="GSC token expired and no refresh token available — please reconnect",
            )
        try:
            refreshed = refresh_gsc_token(conn.refresh_token)
        except GSCOAuthError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

        conn.access_token = refreshed["access_token"]
        if refreshed.get("expiry"):
            conn.token_expiry = refreshed["expiry"]
        db.commit()

    return conn.access_token  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/connect")
async def gsc_connect(
    request: Request,
    auth=Depends(get_current_user),
    redis=Depends(get_redis),
):
    """Redirect the authenticated user to Google's GSC consent screen."""
    user_id = auth["user_id"]
    redirect_uri = _gsc_redirect_uri()

    try:
        auth_url = await get_gsc_auth_url(redis, user_id, redirect_uri)
    except GSCOAuthError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/callback")
async def gsc_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    redis=Depends(get_redis),
    db: Session = Depends(get_session),
):
    """Handle Google's OAuth redirect, exchange code, persist tokens."""
    # User denied access
    if error:
        return RedirectResponse(url=_PORTAL_ERROR_URL, status_code=302)

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    # Validate CSRF state and recover user_id
    try:
        state_data = await validate_gsc_state(redis, state)
    except GSCOAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user_id_str = state_data.get("user_id")
    if not user_id_str:
        raise HTTPException(status_code=400, detail="Corrupt OAuth state — user_id missing")

    redirect_uri = _gsc_redirect_uri()

    # Exchange code for tokens
    try:
        tokens = await exchange_gsc_code(code, redirect_uri)
    except GSCOAuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    user_uuid = UUID(user_id_str)

    # Upsert the connection row
    conn = db.query(GscConnection).filter_by(user_id=user_uuid).first()
    if conn:
        conn.access_token = tokens["access_token"]
        conn.refresh_token = tokens.get("refresh_token") or conn.refresh_token
        conn.token_expiry = tokens.get("expiry")
        conn.connected_at = datetime.now(timezone.utc)
    else:
        conn = GscConnection(
            id=uuid4(),
            user_id=user_uuid,
            access_token=tokens["access_token"],
            refresh_token=tokens.get("refresh_token"),
            token_expiry=tokens.get("expiry"),
            gsc_site_url=None,   # User sets site in /settings UI
            connected_at=datetime.now(timezone.utc),
        )
        db.add(conn)

    db.commit()

    return RedirectResponse(url=_PORTAL_SUCCESS_URL, status_code=302)


@router.delete("/disconnect")
async def gsc_disconnect(
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Remove the user's GSC connection."""
    user_uuid = UUID(auth["user_id"])
    conn = db.query(GscConnection).filter_by(user_id=user_uuid).first()
    if conn:
        db.delete(conn)
        db.commit()
    return {"disconnected": True}


@router.get("/status", response_model=GscStatusResponse)
async def gsc_status(
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Return whether the user has a GSC connection and which site."""
    user_uuid = UUID(auth["user_id"])
    conn = db.query(GscConnection).filter_by(user_id=user_uuid).first()
    if not conn:
        return GscStatusResponse(connected=False)

    connected_at_str = None
    if conn.connected_at:
        ca = conn.connected_at
        if ca.tzinfo is None:
            ca = ca.replace(tzinfo=timezone.utc)
        connected_at_str = ca.isoformat()

    return GscStatusResponse(
        connected=True,
        site_url=conn.gsc_site_url,
        connected_at=connected_at_str,
    )


@router.get("/metrics", response_model=GscMetricsResponse)
async def gsc_metrics(
    site_url: str = Query(..., description="GSC site URL e.g. sc-domain:example.com"),
    days: int = Query(28, ge=1, le=90, description="Days of data to fetch"),
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Return Search Analytics metrics for the user's connected property.

    Calls: POST https://searchconsole.googleapis.com/v1/sites/{siteUrl}/searchAnalytics/query
    """
    user_uuid = UUID(auth["user_id"])
    conn = db.query(GscConnection).filter_by(user_id=user_uuid).first()
    if not conn:
        raise HTTPException(status_code=404, detail="GSC not connected")

    access_token = _get_or_refresh_token(conn, db)

    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days - 1)

    # --- Aggregate query (totals) ---
    payload = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": [],
        "rowLimit": 1,
    }

    import urllib.parse

    encoded_site = urllib.parse.quote(site_url, safe="")
    api_base = (
        f"https://searchconsole.googleapis.com/v1/sites/{encoded_site}/searchAnalytics/query"
    )
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Aggregate totals
            agg_resp = await client.post(api_base, json=payload, headers=headers)
            if agg_resp.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="GSC token rejected — please reconnect",
                )
            if agg_resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"GSC API error {agg_resp.status_code}: {agg_resp.text[:200]}",
                )

            agg_data = agg_resp.json()
            rows = agg_data.get("rows", [])
            if rows:
                r = rows[0]
                total_clicks = int(r.get("clicks", 0))
                total_impressions = int(r.get("impressions", 0))
                avg_ctr = float(r.get("ctr", 0.0))
                avg_position = float(r.get("position", 0.0))
            else:
                total_clicks = total_impressions = 0
                avg_ctr = avg_position = 0.0

            # Top pages query
            pages_payload = {
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "dimensions": ["page"],
                "rowLimit": 10,
                "orderBy": [{"fieldName": "clicks", "sortOrder": "DESCENDING"}],
            }
            pages_resp = await client.post(api_base, json=pages_payload, headers=headers)
            pages_data = pages_resp.json() if pages_resp.status_code == 200 else {}

    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Network error reaching GSC API: {exc}") from exc

    top_pages: List[TopPage] = []
    for row in pages_data.get("rows", []):
        keys = row.get("keys", [])
        top_pages.append(
            TopPage(
                url=keys[0] if keys else "",
                clicks=int(row.get("clicks", 0)),
                impressions=int(row.get("impressions", 0)),
                position=float(row.get("position", 0.0)),
            )
        )

    return GscMetricsResponse(
        clicks=total_clicks,
        impressions=total_impressions,
        avg_ctr=avg_ctr,
        avg_position=avg_position,
        top_pages=top_pages,
    )
