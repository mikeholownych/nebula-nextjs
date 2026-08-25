"""Unified principal resolution and route-guard dependencies.

Every externally reachable capability must resolve to an explicit caller
class with authentication, tenant binding, and scopes:

    PUBLIC_ANONYMOUS        no auth, but bounded (rate limit + body cap)
    PUBLIC_API_AUTHENTICATED nbk_ API key -> workspace-bound principal
    USER_SESSION_AUTHENTICATED JWT session cookie/bearer -> user principal
    INTERNAL_SERVICE        shared INTERNAL_API_SECRET bearer
    SIGNED_WEBHOOK          provider signature (Stripe HMAC, Svix)
    OPERATOR_ADMIN          internal secret AND operator allowlist (future)

Authorization must derive ONLY from server-resolved principals - never from
caller-supplied email/workspace strings (query params, X-* headers).
"""

from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass, field
from typing import Optional, Set

import asyncpg
from fastapi import HTTPException, Request

# ── Scopes ────────────────────────────────────────────────────────────────────

SCOPE_AUDIT_CREATE = "audit:create"
SCOPE_AUDIT_READ = "audit:read"
SCOPE_AUDIT_SHARE = "audit:share"
SCOPE_FIXES_READ = "fixes:read"
SCOPE_WORKSPACE_READ = "workspace:read"
SCOPE_WORKSPACE_WRITE = "workspace:write"
SCOPE_AGENT_EXECUTE = "agent:execute"

# Scopes granted to API keys created before per-key scope storage existed.
DEFAULT_API_KEY_SCOPES = frozenset({
    SCOPE_AUDIT_CREATE,
    SCOPE_AUDIT_READ,
    SCOPE_FIXES_READ,
    SCOPE_WORKSPACE_READ,
})

ALL_SCOPES = frozenset({
    SCOPE_AUDIT_CREATE, SCOPE_AUDIT_READ, SCOPE_AUDIT_SHARE,
    SCOPE_FIXES_READ, SCOPE_WORKSPACE_READ, SCOPE_WORKSPACE_WRITE,
    SCOPE_AGENT_EXECUTE,
})


@dataclass(frozen=True)
class Principal:
    """Server-resolved caller identity. Never construct from request params."""

    principal_type: str                    # 'api_key' | 'user' | 'internal'
    principal_id: str                      # api key id or user id
    workspace_email: Optional[str] = None  # tenant binding for api keys
    email: Optional[str] = None            # user email for sessions
    scopes: frozenset = field(default_factory=frozenset)

    def has_scopes(self, required: Set[str]) -> bool:
        return set(required).issubset(set(self.scopes))


def _hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def extract_bearer(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    return auth[7:].strip() if auth.lower().startswith("bearer ") else ""


async def _load_api_key_principal(raw_key: str) -> Optional[Principal]:
    """Validate raw nbk_ key against hashed store; return bound principal."""
    if not raw_key.startswith("nbk_"):
        return None
    from platform_api.services.audit_db import audit_db
    await audit_db.connect()
    assert audit_db.pool is not None, "DB pool failed to initialize"
    key_hash = _hash_key(raw_key)
    async with audit_db.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, workspace_email, scopes
            FROM api_keys
            WHERE key_hash = $1 AND is_active = TRUE AND revoked_at IS NULL
            """,
            key_hash,
        )
    if not row:
        return None
    scopes = DEFAULT_API_KEY_SCOPES
    if row["scopes"]:
        stored = set(row["scopes"])
        if not stored <= set(ALL_SCOPES):
            stored &= set(ALL_SCOPES)
        scopes = frozenset(stored)
    return Principal(
        principal_type="api_key",
        principal_id=str(row["id"]),
        workspace_email=(row["workspace_email"] or "").strip().lower(),
        scopes=scopes,
    )


def require_internal_service(request: Request) -> None:
    """INTERNAL_SERVICE guard: constant-time shared-secret bearer, fail-closed."""
    secret = (os.getenv("INTERNAL_API_SECRET") or "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Internal service not configured")
    supplied = extract_bearer(request)
    if not supplied or not hmac.compare_digest(supplied, secret):
        raise HTTPException(status_code=401, detail="Unauthorized")


async def resolve_principal(
    request: Request,
    *,
    allow_api_key: bool = True,
    allow_session: bool = True,
) -> Principal:
    """Resolve API-key or session principal. Raises 401 when neither applies."""
    # API key first: explicit machine credential wins over ambient cookies.
    raw_key = request.headers.get("x-api-key", "").strip()
    bearer = extract_bearer(request)
    if allow_api_key and raw_key.startswith("nbk_"):
        principal = await _load_api_key_principal(raw_key)
        if principal is None:
            raise HTTPException(status_code=401, detail="Invalid or revoked API key")
        return principal
    if allow_api_key and bearer.startswith("nbk_"):
        principal = await _load_api_key_principal(bearer)
        if principal is None:
            raise HTTPException(status_code=401, detail="Invalid or revoked API key")
        return principal

    if allow_session:
        try:
            from platform_api.auth.routes import get_current_user
            from platform_api.redis_client import get_redis
            from platform_api.db import get_session
            redis = await get_redis()
            session = next(get_session())
            try:
                ctx = await get_current_user(request, redis=redis, db=session)
            finally:
                session.close()
            user = ctx.get("user") if isinstance(ctx, dict) else None
            email = getattr(user, "email", None) or (
                user.get("email") if isinstance(user, dict) else None
            )
            workspace_email = email
            if user is not None:
                from platform_api.db.models import AgencyClient
                binding = (
                    session.query(AgencyClient.client_email)
                    .filter(
                        AgencyClient.invited_user_id == getattr(user, "id", None),
                        AgencyClient.status == "active",
                    )
                    .order_by(AgencyClient.updated_at.desc())
                    .first()
                )
                if binding and binding[0]:
                    workspace_email = binding[0]
        except HTTPException:
            user, email = None, None
        except Exception:
            user, email = None, None
        if user and email:
            return Principal(
                principal_type="user",
                principal_id=str(ctx.get("user_id") or email),
                email=email.strip().lower(),
                workspace_email=(workspace_email or email).strip().lower(),
                scopes=frozenset(ALL_SCOPES),
            )
    raise HTTPException(status_code=401, detail="Authentication required")


def require_principal(*required_scopes: str, allow_api_key: bool = True):
    """Dependency factory: authenticated principal with all required scopes."""

    async def dependency(request: Request) -> Principal:
        principal = await resolve_principal(
            request, allow_api_key=allow_api_key, allow_session=True,
        )
        missing = set(required_scopes) - set(principal.scopes)
        if missing:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient scope: requires {','.join(sorted(missing))}",
            )
        return principal

    return dependency


def bind_email(principal: Principal, requested_email: Optional[str]) -> str:
    """Return the only email a principal may act on.

    Tenant isolation invariant: the effective email ALWAYS derives from the
    server-resolved principal. A requested email is honored solely when it is
    byte-identical to the principal binding (case/space-normalized); any
    mismatch is a cross-tenant access attempt -> 403 with existence-hiding
    semantics left to callers that prefer 404.
    """
    own = (principal.workspace_email or principal.email or "").strip().lower()
    if not own:
        raise HTTPException(status_code=403, detail="Principal has no tenant binding")
    if requested_email is not None:
        req = requested_email.strip().lower()
        if req != own:
            raise HTTPException(status_code=403, detail="Forbidden")
    return own


async def internal_service_dependency(request: Request) -> None:
    """Router-level INTERNAL_SERVICE guard (use in APIRouter(dependencies=))."""
    require_internal_service(request)
