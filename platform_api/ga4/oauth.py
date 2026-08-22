"""GA4 (Google Analytics 4) read-only OAuth helpers.

Phase 1 of customer GA4 integration: connect a property, list available
properties. Reporting lands in Phase 2.

Scope: analytics.readonly ONLY - never request write scopes.

Reuses the GSC PKCE pattern: state stored in Redis with the code_verifier,
consumed once at callback.
"""

import secrets
from typing import Dict

from google_auth_oauthlib.flow import Flow  # type: ignore[import-untyped]

from platform_api.config import settings
from platform_api.redis_client import RedisClient

GOOGLE_GA4_SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"

STATE_TTL = 600


class GA4OAuthError(Exception):
    """GA4 OAuth error."""


def _client_config() -> dict:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise GA4OAuthError("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured")
    return {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": GOOGLE_AUTHORIZE_URL,
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [],
        }
    }


def _ga4_redirect_uri() -> str:
    return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/api/ga4/callback"


async def get_ga4_auth_url(
    redis: RedisClient,
    user_id: str,
) -> str:
    state = secrets.token_urlsafe(32)
    flow = Flow.from_client_config(
        _client_config(),
        scopes=GOOGLE_GA4_SCOPES,
        redirect_uri=_ga4_redirect_uri(),
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        state=state,
        include_granted_scopes="false",
    )
    code_verifier = getattr(flow, "code_verifier", None)
    await redis.set(
        f"ga4_oauth_state:{state}",
        {"user_id": user_id, "code_verifier": code_verifier},
        ttl=STATE_TTL,
    )
    return auth_url


async def validate_ga4_state(redis: RedisClient, state: str) -> Dict:
    key = f"ga4_oauth_state:{state}"
    data = await redis.get(key)
    if not data or not isinstance(data, dict):
        raise GA4OAuthError("Invalid or expired OAuth state")
    await redis.delete(key)  # one-time consume
    return data


def exchange_ga4_code(code: str, code_verifier: str) -> Dict:
    flow = Flow.from_client_config(
        _client_config(),
        scopes=GOOGLE_GA4_SCOPES,
        redirect_uri=_ga4_redirect_uri(),
    )
    flow.fetch_token(code=code, code_verifier=code_verifier)
    creds = flow.credentials
    expiry = None
    if getattr(creds, "expiry", None):
        expiry = creds.expiry if hasattr(creds.expiry, "isoformat") else creds.expiry
    return {
        "access_token": creds.token,
        "refresh_token": getattr(creds, "refresh_token", None),
        "expiry": expiry,
    }


def refresh_ga4_token(refresh_token: str) -> Dict:
    from google.oauth2.credentials import Credentials  # type: ignore[import-untyped]
    from google.auth.transport.requests import Request as GRequest  # type: ignore[import-untyped]

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=GOOGLE_GA4_SCOPES,
    )
    creds.refresh(GRequest())
    return {
        "access_token": creds.token,
        "expiry": getattr(creds, "expiry", None),
    }


async def list_account_summaries(access_token: str) -> list[dict]:
    """Admin API accountSummaries -> flat [{property_id, display_name}]."""
    import httpx

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://analyticsadmin.googleapis.com/v1beta/accountSummaries"
            "?pageSize=200&limit=200",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        payload = resp.json()

    out: list[dict] = []
    for summary in payload.get("accountSummaries", []):
        for prop in summary.get("propertySegments", []) or [
            {"property": summary.get("name"), "displayName": summary.get("displayName")}
        ]:
            out.append({
                "property_id": prop.get("property"),
                "display_name": prop.get("displayName") or summary.get("displayName"),
            })
    return out
