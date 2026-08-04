"""Google Search Console (GSC) OAuth 2.0 helpers.

Scopes:
- webmasters.readonly — read-only access to Search Analytics data

Flow:
1. generate get_gsc_auth_url() → redirect user to Google consent screen
2. Google redirects back with ?code=...&state=...
3. exchange_gsc_code() → {access_token, refresh_token, expiry}
4. Store tokens in gsc_connections table
5. refresh_gsc_token() when access_token has expired

Note: Uses the same GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET as the main auth
flow but requests the additional webmasters scope. The OAuth consent screen
must have the Google Search Console API enabled on the same Google Cloud project.
"""

import secrets
from datetime import datetime, timezone
from typing import Dict

from google_auth_oauthlib.flow import Flow  # type: ignore[import-untyped]
from google.oauth2.credentials import Credentials  # type: ignore[import-untyped]
from google.auth.transport.requests import Request as GRequest  # type: ignore[import-untyped]

from platform_api.config import settings
from platform_api.redis_client import RedisClient


# Only the webmasters readonly scope is required for Search Analytics queries.
GOOGLE_GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

# Google OAuth endpoints
GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# State TTL — 10 minutes, same as GitHub OAuth
STATE_TTL = 600


class GSCOAuthError(Exception):
    """GSC OAuth error."""


def _client_config() -> dict:
    """Build the client_config dict expected by google-auth-oauthlib."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise GSCOAuthError("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured")

    return {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": GOOGLE_AUTHORIZE_URL,
            "token_uri": GOOGLE_TOKEN_URL,
            "redirect_uris": [],  # Provided at call-time
        }
    }


async def get_gsc_auth_url(
    redis: RedisClient,
    user_id: str,
    redirect_uri: str,
) -> str:
    """Generate a Google OAuth consent-screen URL for GSC access.

    Args:
        redis: RedisClient for CSRF state storage
        user_id: The authenticated user's UUID string
        redirect_uri: Exact redirect URI registered in Google Cloud Console

    Returns:
        Full authorization URL to redirect the user to
    """
    state = secrets.token_urlsafe(32)

    flow = Flow.from_client_config(
        _client_config(),
        scopes=GOOGLE_GSC_SCOPES,
        redirect_uri=redirect_uri,
    )

    auth_url, _ = flow.authorization_url(
        access_type="offline",   # Request refresh token
        prompt="consent",        # Force consent to always get refresh token
        state=state,
        include_granted_scopes="false",
    )

    # google-auth-oauthlib auto-generates a PKCE code_verifier and includes
    # code_challenge in the URL. We must persist the verifier so the callback
    # can pass it to fetch_token() — without it Google returns invalid_grant.
    code_verifier = getattr(flow, "code_verifier", None)
    await redis.set(
        f"gsc_oauth_state:{state}",
        {"user_id": user_id, "redirect_uri": redirect_uri, "code_verifier": code_verifier},
        ttl=STATE_TTL,
    )

    return auth_url


async def validate_gsc_state(redis: RedisClient, state: str) -> dict:
    """Validate and consume the GSC OAuth state parameter (one-time use).

    Returns:
        Dict with user_id and redirect_uri

    Raises:
        GSCOAuthError: If state is invalid or expired
    """
    key = f"gsc_oauth_state:{state}"
    data = await redis.get(key)
    if not data:
        raise GSCOAuthError("Invalid or expired OAuth state")
    await redis.delete(key)
    return data if isinstance(data, dict) else {}


async def exchange_gsc_code(code: str, redirect_uri: str, code_verifier: str | None = None) -> dict:
    """Exchange an authorization code for GSC tokens.

    Args:
        code: Authorization code from Google callback
        redirect_uri: Must match the URI used in get_gsc_auth_url
        code_verifier: PKCE verifier stored in Redis during initiation

    Returns:
        Dict with access_token, refresh_token, expiry (datetime | None)

    Raises:
        GSCOAuthError: If exchange fails
    """
    try:
        flow = Flow.from_client_config(
            _client_config(),
            scopes=GOOGLE_GSC_SCOPES,
            redirect_uri=redirect_uri,
        )
        # Restore PKCE verifier so Google can validate the code_challenge
        if code_verifier:
            flow.code_verifier = code_verifier
        flow.fetch_token(code=code)
        creds = flow.credentials  # type: ignore[assignment]

        expiry: datetime | None = None
        if creds.expiry:
            # google-auth returns expiry as naive UTC; make it aware
            exp = creds.expiry
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            expiry = exp

        return {
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "expiry": expiry,
        }
    except Exception as exc:
        raise GSCOAuthError(f"Token exchange failed: {exc}") from exc


def refresh_gsc_token(refresh_token: str) -> dict:
    """Refresh an expired GSC access token.

    Args:
        refresh_token: The stored refresh token

    Returns:
        Dict with access_token, expiry (datetime | None)

    Raises:
        GSCOAuthError: If refresh fails
    """
    try:
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri=GOOGLE_TOKEN_URL,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        creds.refresh(GRequest())

        expiry: datetime | None = None
        if creds.expiry:
            exp = creds.expiry
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            expiry = exp

        return {
            "access_token": creds.token,
            "expiry": expiry,
        }
    except Exception as exc:
        raise GSCOAuthError(f"Token refresh failed: {exc}") from exc
