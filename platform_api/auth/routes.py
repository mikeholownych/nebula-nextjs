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

from ..config import settings
from ..db import Organization, User, UserIdentity, get_session
from ..redis_client import get_redis
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
        
        # Check if identity exists
        identity = db.query(UserIdentity).filter_by(
            issuer="google",
            subject=google_user["subject"]
        ).first()
        
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
            "ip": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "auth_method": "google"
        }
        
        token = await create_session(
            redis,
            str(user.id),
            str(org.id),
            session_data
        )
        
        return TokenResponse(
            access_token=token,
            user_id=str(user.id),
            email=user.email
        )
    
    except GoogleOAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


# --- Magic Link (placeholder) ---

@router.post("/magic-link")
async def request_magic_link(
    body: MagicLinkRequest,
    redis = Depends(get_redis)
):
    """Request magic link for email authentication.
    
    TO BE IMPLEMENTED:
    1. Generate token
    2. Store in Redis (magic:{email}:{token})
    3. Send email via SendGrid
    4. Return success message
    """
    # TODO: Implement magic link auth
    raise HTTPException(
        status_code=501,
        detail="Magic link authentication not yet implemented"
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
