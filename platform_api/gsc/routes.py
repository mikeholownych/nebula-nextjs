"""Google Search Console API routes.

Endpoints:
- GET  /api/gsc/connect    - start OAuth flow (redirects to Google)
- GET  /api/gsc/callback   - receive authorization code, save tokens
- DELETE /api/gsc/disconnect - remove the user's GSC connection
- GET  /api/gsc/status     - {connected, site_url, connected_at}
- GET  /api/gsc/metrics    - {clicks, impressions, avg_ctr, avg_position, top_pages}
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from platform_api.auth.routes import get_current_user
from platform_api.config import settings
from platform_api.db.models import GscConnection
from platform_api.db.session import get_session
from platform_api.redis_client import get_redis
from platform_api.infra.secret_box import decrypt as sb_decrypt, encrypt as sb_encrypt

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


class DailyRow(BaseModel):
    date: str
    clicks: int
    impressions: int
    ctr: float
    position: float


class GscTotals(BaseModel):
    clicks: int
    impressions: int
    ctr: float
    position: float


class GscMetricsResponse(BaseModel):
    clicks: int
    impressions: int
    avg_ctr: float
    avg_position: float
    totals: Optional[GscTotals] = None
    rows: List[DailyRow] = []
    top_pages: List[TopPage] = []
    site_url: Optional[str] = None


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
                detail="GSC token expired and no refresh token available - please reconnect",
            )
        try:
            refreshed = refresh_gsc_token(sb_decrypt(conn.refresh_token))
        except GSCOAuthError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

        conn.access_token = sb_encrypt(refreshed["access_token"])
        if refreshed.get("refresh_token"):
            conn.refresh_token = sb_encrypt(refreshed["refresh_token"])
        if refreshed.get("expiry"):
            conn.token_expiry = refreshed["expiry"]
        db.commit()

    return sb_decrypt(conn.access_token)  # type: ignore[return-value]


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
        raise HTTPException(status_code=400, detail="Corrupt OAuth state - user_id missing")

    redirect_uri = _gsc_redirect_uri()

    # Exchange code for tokens
    try:
        tokens = await exchange_gsc_code(
            code,
            redirect_uri,
            code_verifier=state_data.get("code_verifier"),
        )
    except GSCOAuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    user_uuid = UUID(user_id_str)

    # Auto-detect the user's primary GSC property (first one returned)
    auto_site_url: str | None = None
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://www.googleapis.com/webmasters/v3/sites",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            if resp.status_code == 200:
                sites = resp.json().get("siteEntry", [])
                if sites:
                    auto_site_url = sites[0].get("siteUrl")
    except Exception:
        pass  # Non-fatal - user can select manually in settings

    # Upsert the connection row
    conn = db.query(GscConnection).filter_by(user_id=user_uuid).first()
    if conn:
        conn.access_token = sb_encrypt(tokens["access_token"])
        conn.refresh_token = sb_encrypt(tokens.get("refresh_token")) if tokens.get("refresh_token") else conn.refresh_token
        conn.token_expiry = tokens.get("expiry")
        conn.connected_at = datetime.now(timezone.utc)
        if auto_site_url and not conn.gsc_site_url:
            conn.gsc_site_url = auto_site_url
    else:
        conn = GscConnection(
            id=uuid4(),
            user_id=user_uuid,
            access_token=sb_encrypt(tokens["access_token"]),
            refresh_token=sb_encrypt(tokens.get("refresh_token")) if tokens.get("refresh_token") else None,
            token_expiry=tokens.get("expiry"),
            gsc_site_url=auto_site_url,
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
        f"https://www.googleapis.com/webmasters/v3/sites/{encoded_site}/searchAnalytics/query"
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
                    detail="GSC token rejected - please reconnect",
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

            # Daily breakdown query (sparkline)
            daily_payload = {
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "dimensions": ["date"],
                "rowLimit": 90,
            }
            daily_resp = await client.post(api_base, json=daily_payload, headers=headers)
            daily_data = daily_resp.json() if daily_resp.status_code == 200 else {}

            # Top pages query
            pages_payload = {
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "dimensions": ["page"],
                "rowLimit": 500,
                "orderBy": [{"fieldName": "clicks", "sortOrder": "DESCENDING"}],
            }
            pages_resp = await client.post(api_base, json=pages_payload, headers=headers)
            pages_data = pages_resp.json() if pages_resp.status_code == 200 else {}

    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Network error reaching GSC API: {exc}") from exc

    daily_rows: List[DailyRow] = []
    for row in daily_data.get("rows", []):
        keys = row.get("keys", [])
        daily_rows.append(
            DailyRow(
                date=keys[0] if keys else "",
                clicks=int(row.get("clicks", 0)),
                impressions=int(row.get("impressions", 0)),
                ctr=float(row.get("ctr", 0.0)),
                position=float(row.get("position", 0.0)),
            )
        )

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
        totals=GscTotals(
            clicks=total_clicks,
            impressions=total_impressions,
            ctr=avg_ctr,
            position=avg_position,
        ),
        rows=daily_rows,
        top_pages=top_pages,
        site_url=site_url,
    )


# ---------------------------------------------------------------------------
# Sitemap discovery
# ---------------------------------------------------------------------------

import xml.etree.ElementTree as ET


class SitemapPage(BaseModel):
    url: str
    lastmod: Optional[str] = None


class SitemapResponse(BaseModel):
    site_url: str
    pages: List[SitemapPage]
    total: int


@router.get("/sitemap", response_model=SitemapResponse)
async def gsc_sitemap(
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Fetch and parse the user's sitemap.xml based on their GSC site URL."""
    user_id = UUID(auth["user_id"])
    conn = db.query(GscConnection).filter_by(user_id=user_id).first()
    if not conn or not conn.gsc_site_url:
        raise HTTPException(status_code=404, detail="No GSC connection or site URL configured")

    site_url = conn.gsc_site_url
    if site_url.startswith("sc-domain:"):
        domain = site_url.replace("sc-domain:", "")
        sitemap_url = f"https://{domain}/sitemap.xml"
    elif site_url.startswith("http"):
        sitemap_url = site_url.rstrip("/") + "/sitemap.xml"
    else:
        raise HTTPException(status_code=400, detail=f"Cannot derive sitemap from: {site_url}")

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(sitemap_url)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Sitemap returned {resp.status_code}")

            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            root = ET.fromstring(resp.text)
            pages: List[SitemapPage] = []

            # Check if sitemap index
            sitemaps = root.findall("sm:sitemap", ns)
            if sitemaps:
                for sm_elem in sitemaps[:5]:
                    loc_elem = sm_elem.find("sm:loc", ns)
                    if loc_elem is not None and loc_elem.text:
                        child_resp = await client.get(loc_elem.text.strip())
                        if child_resp.status_code == 200:
                            child_root = ET.fromstring(child_resp.text)
                            for url_elem in child_root.findall("sm:url", ns):
                                loc = url_elem.find("sm:loc", ns)
                                lastmod = url_elem.find("sm:lastmod", ns)
                                if loc is not None and loc.text:
                                    pages.append(SitemapPage(
                                        url=loc.text.strip(),
                                        lastmod=lastmod.text.strip() if lastmod is not None and lastmod.text else None,
                                    ))
            else:
                for url_elem in root.findall("sm:url", ns):
                    loc = url_elem.find("sm:loc", ns)
                    lastmod = url_elem.find("sm:lastmod", ns)
                    if loc is not None and loc.text:
                        pages.append(SitemapPage(
                            url=loc.text.strip(),
                            lastmod=lastmod.text.strip() if lastmod is not None and lastmod.text else None,
                        ))

    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Network error: {exc}") from exc
    except ET.ParseError as exc:
        raise HTTPException(status_code=502, detail=f"XML parse error: {exc}") from exc

    return SitemapResponse(site_url=site_url, pages=pages, total=len(pages))


# ---------------------------------------------------------------------------
# URL Inspection (indexed status check)
# ---------------------------------------------------------------------------


class InspectionResult(BaseModel):
    url: str
    indexed: bool
    coverage_state: Optional[str] = None
    last_crawl: Optional[str] = None


class InspectionResponse(BaseModel):
    results: List[InspectionResult]


@router.post("/inspect", response_model=InspectionResponse)
async def gsc_inspect(
    urls: List[str] = Body(..., embed=False),
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
    redis=Depends(get_redis),
):
    """Check indexed status of URLs via the GSC URL Inspection API.

    Inspects URLs concurrently with bounded concurrency (semaphore=5)
    and caches responses in Redis (24h TTL) to avoid timeouts and rate limits.
    """
    user_id = UUID(auth["user_id"])
    conn = db.query(GscConnection).filter_by(user_id=user_id).first()
    check_urls = urls[:20]
    if not conn or not conn.gsc_site_url:
        return InspectionResponse(
            results=[
                InspectionResult(url=u, indexed=False, coverage_state="not_connected")
                for u in check_urls
            ]
        )

    access_token = _get_or_refresh_token(conn, db)
    site_url = conn.gsc_site_url
    results_map: dict[str, InspectionResult] = {}
    uncached_urls: List[str] = []

    # Check cache first
    for url in check_urls:
        cache_key = f"gsc:inspect:{str(user_id)}:{url}"
        cached = await redis.get(cache_key)
        if isinstance(cached, dict) and "indexed" in cached:
            results_map[url] = InspectionResult(
                url=url,
                indexed=cached["indexed"],
                coverage_state=cached.get("coverage_state"),
                last_crawl=cached.get("last_crawl"),
            )
        else:
            uncached_urls.append(url)

    if uncached_urls:
        sem = asyncio.Semaphore(5)

        async def inspect_single(client: httpx.AsyncClient, target_url: str) -> InspectionResult:
            async with sem:
                try:
                    resp = await client.post(
                        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                        json={
                            "inspectionUrl": target_url,
                            "siteUrl": site_url,
                        },
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        result = data.get("inspectionResult", {})
                        index_status = result.get("indexStatusResult", {})
                        coverage = index_status.get("coverageState", "")
                        last_crawl = index_status.get("lastCrawlTime")
                        indexed = coverage in (
                            "Submitted and indexed",
                            "Indexed, not submitted in sitemap",
                        )
                        res = InspectionResult(
                            url=target_url,
                            indexed=indexed,
                            coverage_state=coverage or None,
                            last_crawl=last_crawl,
                        )
                        cache_key = f"gsc:inspect:{str(user_id)}:{target_url}"
                        await redis.set(cache_key, res.model_dump(), ttl=86400)
                        return res
                    else:
                        return InspectionResult(url=target_url, indexed=False, coverage_state="error")
                except Exception:
                    return InspectionResult(url=target_url, indexed=False, coverage_state="error")

        async with httpx.AsyncClient(timeout=10) as client:
            tasks = [inspect_single(client, u) for u in uncached_urls]
            inspected_results = await asyncio.gather(*tasks)
            for res in inspected_results:
                results_map[res.url] = res

    ordered_results = [results_map.get(u, InspectionResult(url=u, indexed=False, coverage_state="error")) for u in check_urls]
    return InspectionResponse(results=ordered_results)


# ---------------------------------------------------------------------------
# IndexNow submission
# ---------------------------------------------------------------------------

INDEXNOW_KEY = "b9c3d6efa77742c3a718906911d9429f"


class IndexNowRequest(BaseModel):
    urls: List[str]


class IndexNowResponse(BaseModel):
    submitted: int
    accepted: bool


@router.post("/submit-index", response_model=IndexNowResponse)
async def gsc_submit_index(
    body: IndexNowRequest,
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Submit URLs to search engines via IndexNow for faster indexing."""
    user_id = UUID(auth["user_id"])
    conn = db.query(GscConnection).filter_by(user_id=user_id).first()
    if not conn or not conn.gsc_site_url:
        raise HTTPException(status_code=404, detail="No GSC connection")

    site_url = conn.gsc_site_url
    if site_url.startswith("sc-domain:"):
        host = site_url.replace("sc-domain:", "")
    else:
        from urllib.parse import urlparse
        host = urlparse(site_url).hostname or site_url

    submit_urls = body.urls[:100]  # Cap at 100

    payload = {
        "host": host,
        "key": INDEXNOW_KEY,
        "keyLocation": f"https://{host}/{INDEXNOW_KEY}.txt",
        "urlList": submit_urls,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.indexnow.org/indexnow",
                json=payload,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )
            accepted = resp.status_code in (200, 202)
    except Exception:
        accepted = False

    return IndexNowResponse(submitted=len(submit_urls), accepted=accepted)
