"""Authentication API routes.

Endpoints:
- POST /auth/google - Google OAuth login
- POST /auth/magic-link - Request magic link
- GET /auth/verify - Verify magic link
- POST /auth/logout - Revoke current session
- POST /auth/logout-all - Revoke all sessions
- GET /auth/sessions - List active sessions
- GET /auth/me - Current user info
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from posthog import identify_context, new_context

from platform_api.config import settings
from platform_api.db import Organization, User, UserIdentity, get_session
from platform_api.posthog_client import get_posthog
from platform_api.redis_client import get_redis
from .google import GoogleOAuthError, verify_google_token
from .jwt import (
    JWTError,
    create_session,
    decode_jwt,
    get_active_sessions,
    revoke_all_sessions,
    revoke_session,
    verify_session,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# --- Request/Response Models ---

class GoogleAuthRequest(BaseModel):
    id_token: str


class MagicLinkRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    name: Optional[str]
    picture: Optional[str]
    created_at: datetime


class SessionInfo(BaseModel):
    session_id: str
    ip: Optional[str]
    user_agent: Optional[str]
    created_at: str


# --- Auth Dependency ---

async def get_current_user(
    request: Request,
    redis = Depends(get_redis),
    db = Depends(get_session)
) -> dict:
    """Extract and verify current user from JWT.
    
    Raises:
        HTTPException 401: If token invalid or missing
    """
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    token = auth_header[7:]  # Remove "Bearer " prefix
    
    try:
        # Verify JWT
        claims = await verify_session(redis, token)
        
        # Get user
        user_id = claims.get("user_id")
        user = db.query(User).filter(User.id == UUID(user_id)).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "user": user,
            "user_id": user_id,
            "org_id": claims.get("org_id"),
            "session_id": claims.get("jti")
        }
    
    except JWTError as e:
        raise HTTPException(status_code=401, detail=str(e))


# --- Google OAuth ---

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    request: Request,
    body: GoogleAuthRequest,
    redis = Depends(get_redis),
    db = Depends(get_session)
):
    """Authenticate with Google OAuth ID token.
    
    Flow:
    1. Frontend gets ID token from Google Sign-In
    2. Sends to this endpoint
    3. Backend verifies token and creates/updates user
    4. Returns JWT session token
    
    If user doesn't exist, creates:
    - User record
    - UserIdentity (google, subject)
    - Organization (default)
    - Membership (owner)
    """
    try:
        # Verify Google token
        google_user = await verify_google_token(body.id_token)
        
        if not google_user.get("email"):
            raise HTTPException(status_code=400, detail="Email required")
        if google_user.get("email_verified") is not True:
            raise HTTPException(status_code=401, detail="Verified email required")
        
        # Check if identity exists
        identity = db.query(UserIdentity).filter_by(
            issuer="google",
            subject=google_user["subject"]
        ).first()
        is_new_user = identity is None

        if identity:
            # Existing user
            user = identity.user
            org = db.query(Organization).join(
                Organization.memberships
            ).filter_by(user_id=user.id).first()
        else:
            # New user - create account
            user = User(
                id=uuid4(),
                email=google_user["email"]
            )
            db.add(user)
            
            # Create identity
            identity = UserIdentity(
                id=uuid4(),
                user_id=user.id,
                issuer="google",
                subject=google_user["subject"]
            )
            db.add(identity)
            
            # Create default organization
            org = Organization(
                id=uuid4(),
                name=f"{google_user.get('name', 'My')} Organization",
                slug=f"org-{user.id.hex[:8]}"
            )
            db.add(org)
            db.flush()  # Get org.id
            
            # Create membership
            from ..db.models import Membership
            membership = Membership(
                id=uuid4(),
                user_id=user.id,
                organization_id=org.id,
                role="owner"
            )
            db.add(membership)
            
            db.commit()
        
        # Create session
        session_data = {
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent", ""),
            "auth_method": "google"
        }
        
        token = await create_session(
            redis,
            str(user.id),
            str(org.id),
            session_data
        )
        
        ph = get_posthog()
        if ph:
            event_name = "user_signed_up" if is_new_user else "user_logged_in"
            with new_context(client=ph):
                identify_context(str(user.id))
                ph.capture(event_name, properties={"auth_method": "google"})

        return TokenResponse(
            access_token=token,
            user_id=str(user.id),
            email=user.email
        )

    except GoogleOAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


# --- Magic Link ---

MAGIC_LINK_TTL = 15 * 60  # 15 minutes in seconds


@router.post("/magic-link")
async def request_magic_link(
    body: MagicLinkRequest,
    redis = Depends(get_redis)
):
    """Request a magic link for passwordless email authentication.

    Generates a secure token, stores it in Redis with a 15-minute TTL,
    and sends the login link to the provided email address via AgentMail.
    """
    import asyncio
    import json as _json
    import os
    import secrets
    import urllib.error
    import urllib.request

    token = secrets.token_urlsafe(32)
    redis_key = f"magic:{token}"

    await redis.set(
        redis_key,
        {"email": body.email, "created_at": datetime.now(timezone.utc).isoformat()},
        ttl=MAGIC_LINK_TTL,
    )

    magic_url = f"https://nebulacomponents.shop/workspace?magic={token}"

    html_body = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Sign in to Nebula Components</h1>
        <p>Click the button below to sign in. This link expires in 15 minutes.</p>
        <p style="margin: 2rem 0;">
            <a href="{magic_url}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;
                      padding: 0.875rem 2rem; border-radius: 8px; text-decoration: none;
                      font-weight: 600; display: inline-block;">
                Sign In &rarr;
            </a>
        </p>
        <p style="color: #666; font-size: 0.9rem;">
            If you didn't request this link, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
        <p style="color: #999; font-size: 0.85rem;">
            Nebula Components &mdash; Conversion optimization for founders wasting money on ads.<br>
            <a href="https://nebulacomponents.shop" style="color: #999;">nebulacomponents.shop</a>
        </p>
    </body>
    </html>
    """

    text_body = f"""Sign in to Nebula Components

Click the link below to sign in (expires in 15 minutes):

{magic_url}

If you didn't request this link, you can safely ignore this email.

--
Nebula Components -- nebulacomponents.shop
""".strip()

    # Magic link is a transactional auth email — send directly via AgentMail REST API,
    # bypassing the marketing OutboundReleaseGate which applies to lead outreach only.
    _recipient_email = body.email

    def _send_transactional() -> dict:
        key_path = os.path.expanduser("~/.hermes/secrets/agentmail_org.key")
        api_key = os.environ.get("AGENTMAIL_API_KEY") or os.environ.get("AM_KEY") or ""
        if not api_key and os.path.exists(key_path):
            with open(key_path) as f:
                api_key = f.read().strip()

        inbox = "nebulashop@agentmail.to"
        payload = _json.dumps({
            "to": [_recipient_email],
            "subject": "Your Nebula Components sign-in link",
            "text": text_body,
            "html": html_body,
        }).encode()
        url = f"https://api.agentmail.to/v0/inboxes/{inbox}/messages/send"
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return _json.loads(resp.read())
        except urllib.error.HTTPError as exc:
            body_text = exc.read().decode()
            return {"_error": exc.code, "_body": body_text[:800]}
        except Exception as exc:
            return {"_error": str(exc)}

    result = await asyncio.to_thread(_send_transactional)

    if result.get("_error"):
        # Clean up the token so it doesn't sit unused
        await redis.delete(redis_key)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send magic link email: {result.get('_body', result.get('_error'))}"
        )

    return {"message": "Magic link sent — check your email (expires in 15 minutes)"}


@router.get("/verify")
async def verify_magic_link(
    response: Response,
    token: str,
    redis = Depends(get_redis),
    db = Depends(get_session)
):
    """Verify a magic link token and return a JWT session.

    Looks up the token in Redis, resolves or creates the user, issues a JWT,
    sets it as an HTTP-only cookie, and returns {access_token, email}.
    """
    redis_key = f"magic:{token}"

    data = await redis.get(redis_key)
    if not data:
        raise HTTPException(status_code=400, detail="Invalid or expired magic link")

    email: str = data.get("email") if isinstance(data, dict) else str(data)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid magic link data")

    # Consume the token (one-time use)
    await redis.delete(redis_key)

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    is_new_user = user is None

    if not user:
        user = User(id=uuid4(), email=email)
        db.add(user)

        org = Organization(
            id=uuid4(),
            name=f"My Organization",
            slug=f"org-{user.id.hex[:8]}"
        )
        db.add(org)
        db.flush()

        from ..db.models import Membership
        membership = Membership(
            id=uuid4(),
            user_id=user.id,
            organization_id=org.id,
            role="owner"
        )
        db.add(membership)
        db.commit()
    else:
        org = db.query(Organization).join(
            Organization.memberships
        ).filter_by(user_id=user.id).first()
        if not org:
            # Edge case: user exists but has no org
            org = Organization(
                id=uuid4(),
                name="My Organization",
                slug=f"org-{user.id.hex[:8]}"
            )
            db.add(org)
            db.flush()
            from ..db.models import Membership
            membership = Membership(
                id=uuid4(),
                user_id=user.id,
                organization_id=org.id,
                role="owner"
            )
            db.add(membership)
            db.commit()

    session_data = {"auth_method": "magic_link"}
    jwt_token = await create_session(redis, str(user.id), str(org.id), session_data)

    # Set JWT as HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.JWT_EXPIRATION_DAYS * 24 * 3600,
        path="/",
    )

    ph = get_posthog()
    if ph:
        event_name = "user_signed_up" if is_new_user else "user_logged_in"
        with new_context(client=ph):
            identify_context(str(user.id))
            ph.capture(event_name, properties={"auth_method": "magic_link"})

    return TokenResponse(
        access_token=jwt_token,
        user_id=str(user.id),
        email=email,
    )


# --- Session Management ---

@router.post("/logout")
async def logout(
    request: Request,
    redis = Depends(get_redis),
    current_user = Depends(get_current_user)
):
    """Revoke current session.
    
    Removes from active sessions and blacklists JWT.
    """
    user_id = current_user["user_id"]
    session_id = current_user["session_id"]

    await revoke_session(redis, user_id, session_id)

    ph = get_posthog()
    if ph:
        with new_context(client=ph):
            identify_context(user_id)
            ph.capture("user_logged_out")

    return {"message": "Logged out successfully"}


@router.post("/logout-all")
async def logout_all(
    redis = Depends(get_redis),
    current_user = Depends(get_current_user)
):
    """Revoke all sessions for current user."""
    user_id = current_user["user_id"]
    
    count = await revoke_all_sessions(redis, user_id)
    
    return {"message": f"Revoked {count} sessions"}


@router.get("/sessions", response_model=list[SessionInfo])
async def list_sessions(
    redis = Depends(get_redis),
    current_user = Depends(get_current_user)
):
    """List all active sessions for current user."""
    user_id = current_user["user_id"]
    
    sessions = await get_active_sessions(redis, user_id)
    
    return [
        SessionInfo(
            session_id=sid,
            ip=data.get("ip"),
            user_agent=data.get("user_agent"),
            created_at=data.get("created_at", "")
        )
        for sid, data in sessions.items()
    ]


@router.delete("/sessions/{session_id}")
async def revoke_specific_session(
    session_id: str,
    redis = Depends(get_redis),
    current_user = Depends(get_current_user)
):
    """Revoke a specific session."""
    user_id = current_user["user_id"]
    
    await revoke_session(redis, user_id, session_id)
    
    return {"message": f"Session {session_id} revoked"}


# --- User Info ---

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user = Depends(get_current_user)
):
    """Get current user information."""
    user = current_user["user"]
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=None,  # TODO: Add name field to User model
        picture=None,
        created_at=user.created_at
    )
