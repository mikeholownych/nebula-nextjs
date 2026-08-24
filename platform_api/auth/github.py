"""GitHub OAuth 2.0 authorization code flow.

Flow:
1. Frontend redirects user to GitHub authorization URL
2. GitHub redirects back with authorization code
3. Backend exchanges code for access token
4. Backend fetches user profile from GitHub API
5. Returns verified user info

Security:
- State parameter (CSRF protection) stored in Redis with 10-min TTL
- Minimal scope: user:email only
- Uses immutable GitHub user ID as identity key (not username)
"""

import secrets
from typing import Dict, Optional

import httpx

from platform_api.config import settings
from platform_api.redis_client import RedisClient


GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"

STATE_TTL = 600  # 10 minutes


class GitHubOAuthError(Exception):
    """GitHub OAuth verification error."""
    pass


async def generate_authorize_url(redis: RedisClient, redirect_uri: str, state: Optional[str] = None) -> str:
    """Generate GitHub OAuth authorization URL with CSRF state.

    Args:
        redis: Redis client for state storage
        redirect_uri: The callback URL GitHub will redirect to
        state: Pre-minted CSRF state. When omitted, a fresh one is created
            and stored (legacy behavior). Callers that already bound a
            redirect_uri into a state must pass it here so the callback's
            stored URI matches the authorize request exactly.

    Returns:
        Full authorization URL to redirect the user to
    """
    if not settings.GITHUB_CLIENT_ID:
        raise GitHubOAuthError("GITHUB_CLIENT_ID not configured")

    if not state:
        state = secrets.token_urlsafe(32)

    # Store state in Redis with TTL for CSRF validation
    await redis.set(f"github_oauth_state:{state}", {"redirect_uri": redirect_uri}, ttl=STATE_TTL)

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "user:email",
        "state": state,
    }

    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GITHUB_AUTHORIZE_URL}?{query}"


async def validate_state(redis: RedisClient, state: str) -> Dict:
    """Validate and consume the OAuth state parameter.

    Args:
        redis: Redis client
        state: State parameter from callback

    Returns:
        State data dict

    Raises:
        GitHubOAuthError: If state is invalid or expired
    """
    key = f"github_oauth_state:{state}"
    data = await redis.get(key)
    if not data:
        raise GitHubOAuthError("Invalid or expired OAuth state")

    # Consume state (one-time use)
    await redis.delete(key)
    return data if isinstance(data, dict) else {}


async def exchange_code_for_token(code: str, redirect_uri: str) -> str:
    """Exchange authorization code for access token.

    Args:
        code: Authorization code from GitHub callback
        redirect_uri: Must match the redirect_uri used in authorize

    Returns:
        Access token string

    Raises:
        GitHubOAuthError: If exchange fails
    """
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise GitHubOAuthError("GitHub OAuth not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
            timeout=10.0,
        )

        if response.status_code != 200:
            raise GitHubOAuthError(f"Token exchange failed: HTTP {response.status_code}")

        data = response.json()
        if "error" in data:
            raise GitHubOAuthError(f"Token exchange failed: {data.get('error_description', data['error'])}")

        token = data.get("access_token")
        if not token:
            raise GitHubOAuthError("No access_token in response")

        return token


async def fetch_github_user(access_token: str) -> Dict:
    """Fetch GitHub user profile and primary email.

    Args:
        access_token: GitHub OAuth access token

    Returns:
        Dict with: subject (str), email (str|None), name (str|None),
        picture (str|None), login (str)

    Raises:
        GitHubOAuthError: If API call fails
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient() as client:
        # Fetch user profile
        user_resp = await client.get(GITHUB_USER_URL, headers=headers, timeout=10.0)
        if user_resp.status_code != 200:
            raise GitHubOAuthError(f"Failed to fetch user: HTTP {user_resp.status_code}")

        user_data = user_resp.json()

        # GitHub user ID is the immutable identity key
        subject = str(user_data["id"])
        email = user_data.get("email")
        name = user_data.get("name")
        picture = user_data.get("avatar_url")
        login = user_data.get("login", "")

        # If email is not public, fetch from /user/emails endpoint
        if not email:
            try:
                emails_resp = await client.get(GITHUB_EMAILS_URL, headers=headers, timeout=10.0)
                if emails_resp.status_code == 200:
                    emails = emails_resp.json()
                    # Find primary verified email
                    for e in emails:
                        if e.get("primary") and e.get("verified"):
                            email = e["email"]
                            break
                    # Fallback: any verified email
                    if not email:
                        for e in emails:
                            if e.get("verified"):
                                email = e["email"]
                                break
            except httpx.HTTPError:
                pass  # Email is optional

        return {
            "subject": subject,
            "email": email,
            "name": name,
            "picture": picture,
            "login": login,
        }
