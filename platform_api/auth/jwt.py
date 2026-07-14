"""JWT session management with Redis-backed revocation.

Flow:
1. User authenticates (Google OAuth or magic link)
2. Backend creates JWT with user_id, session_id, org_id
3. JWT stored in HTTP-only cookie (client)
4. Session tracked in Redis (user:{user_id}:sessions)
5. On logout: Redis session deleted + JWT blacklisted

Security:
- HS256 signing (configurable algorithm)
- 7-day expiration (configurable)
- Redis blacklist for instant revocation
- HTTP-only, Secure, SameSite cookies
"""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from authlib.jose import JoseError, jwt

from platform_api.config import settings
from platform_api.redis_client import RedisClient


class JWTError(Exception):
    """JWT session error."""
    pass


def create_jwt(
    payload: Dict[str, Any],
    expires_days: Optional[int] = None
) -> str:
    """Create JWT token.
    
    Args:
        payload: Claims to include (user_id, org_id, etc.)
        expires_days: Token expiration in days (default: settings.JWT_EXPIRATION_DAYS)
    
    Returns:
        Encoded JWT string
    """
    if not settings.SECRET_KEY:
        raise ValueError("SECRET_KEY not configured")
    
    # Default expiration
    if expires_days is None:
        expires_days = settings.JWT_EXPIRATION_DAYS
    
    # Build claims
    now = datetime.now(timezone.utc)
    claims = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=expires_days)).timestamp()),
        "jti": payload.get("jti") or secrets.token_urlsafe(16),  # JWT ID for revocation
    }
    
    # Encode JWT
    token = jwt.encode(
        {"alg": settings.JWT_ALGORITHM},
        claims,
        key=settings.SECRET_KEY
    )
    
    # Decode bytes to string
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    
    return token


def decode_jwt(token: str) -> Dict[str, Any]:
    """Decode and verify JWT token.
    
    Args:
        token: Encoded JWT string
    
    Returns:
        Decoded claims dictionary
    
    Raises:
        JWTError: If token is invalid or expired
    """
    if not settings.SECRET_KEY:
        raise ValueError("SECRET_KEY not configured")
    
    try:
        claims = jwt.decode(
            token,
            key=settings.SECRET_KEY,
            claims_options={
                "alg": {"values": [settings.JWT_ALGORITHM]}
            }
        )
        return claims
    except JoseError as e:
        raise JWTError(f"Invalid token: {e}")


async def create_session(
    redis: RedisClient,
    user_id: str,
    org_id: str,
    session_data: Optional[Dict] = None
) -> str:
    """Create session in Redis and return JWT.
    
    Args:
        redis: Redis client
        user_id: User UUID
        org_id: Organization UUID
        session_data: Optional metadata (IP, user agent, etc.)
    
    Returns:
        JWT token string
    """
    session_id = secrets.token_urlsafe(16)
    
    # Create JWT payload
    payload = {
        "user_id": user_id,
        "org_id": org_id,
        "jti": session_id,
    }
    
    # Create JWT
    token = create_jwt(payload)
    
    # Store session in Redis
    redis_key = f"user:{user_id}:sessions"
    session_info = {
        "session_id": session_id,
        "org_id": org_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **(session_data or {})
    }
    
    await redis.hset(redis_key, session_id, session_info)
    
    # Set TTL
    ttl = settings.JWT_EXPIRATION_DAYS * 24 * 3600
    await redis.expire(redis_key, ttl)
    
    return token


async def verify_session(
    redis: RedisClient,
    token: str
) -> Dict[str, Any]:
    """Verify JWT and check Redis blacklist.
    
    Args:
        redis: Redis client
        token: JWT token string
    
    Returns:
        Decoded claims dictionary
    
    Raises:
        JWTError: If token invalid, expired, or blacklisted
    """
    # Decode JWT
    claims = decode_jwt(token)
    
    # Check blacklist
    session_id = claims.get("jti")
    if not session_id:
        raise JWTError("Token missing jti claim")
    
    blacklisted = await redis.exists(f"blacklist:jwt:{session_id}")
    if blacklisted:
        raise JWTError("Session revoked")
    
    return claims


async def revoke_session(
    redis: RedisClient,
    user_id: str,
    session_id: str
) -> None:
    """Revoke a session.
    
    Removes from active sessions and adds to blacklist.
    
    Args:
        redis: Redis client
        user_id: User UUID
        session_id: Session ID (jti claim)
    """
    # Remove from active sessions
    await redis.hdel(f"user:{user_id}:sessions", session_id)
    
    # Add to blacklist (expire at JWT expiration)
    ttl = settings.JWT_EXPIRATION_DAYS * 24 * 3600
    await redis.set(f"blacklist:jwt:{session_id}", "revoked", ttl=ttl)


async def get_active_sessions(
    redis: RedisClient,
    user_id: str
) -> Dict[str, Dict]:
    """Get all active sessions for a user.
    
    Args:
        redis: Redis client
        user_id: User UUID
    
    Returns:
        Dictionary of session_id → session_info
    """
    sessions = await redis.hgetall(f"user:{user_id}:sessions")
    return sessions or {}


async def revoke_all_sessions(
    redis: RedisClient,
    user_id: str
) -> int:
    """Revoke all sessions for a user.
    
    Args:
        redis: Redis client
        user_id: User UUID
    
    Returns:
        Number of sessions revoked
    """
    # Get all sessions
    sessions = await get_active_sessions(redis, user_id)
    
    if not sessions:
        return 0
    
    # Revoke each session
    for session_id in sessions.keys():
        await revoke_session(redis, user_id, session_id)
    
    return len(sessions)
