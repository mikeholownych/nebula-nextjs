"""
API Key routes: create, list, revoke.
Gated to Growth+ plan. Plan is inferred from the workspace's active subscription.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import logging

from platform_api.auth.routes import get_current_user
from platform_api.services.api_key_service import api_key_service, API_KEY_PLANS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/workspace/api-keys", tags=["api-keys"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _resolve_plan(workspace_email: str) -> str:
    """Look up the workspace's active plan via EntitlementService."""
    import asyncio

    from platform_api.db.session import session_scope
    from platform_api.services.entitlements import resolve_sync

    email = (workspace_email or "").strip().lower()
    if not email:
        return "free"

    def _query() -> str:
        try:
            with session_scope() as session:
                return resolve_sync(email, session).plan
        except Exception:
            return "free"

    return await asyncio.to_thread(_query)


# ── Request/Response models ───────────────────────────────────────────────────

class CreateKeyRequest(BaseModel):
    email: Optional[str] = None  # ignored; identity comes from the session JWT
    label: str = "Default"


class RevokeKeyRequest(BaseModel):
    email: Optional[str] = None  # ignored
    key_id: str


def _email_from_user(current_user) -> str:
    user = current_user["user"]
    email = (getattr(user, "email", None) or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail={"error": "Authenticated email required"})
    return email


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("")
async def create_api_key(body: CreateKeyRequest, current_user=Depends(get_current_user)):
    """
    Create a new API key for a workspace.
    Plan is derived from the workspace's active subscription.
    The raw key is returned ONCE - store it immediately.
    """
    email = _email_from_user(current_user)
    plan = await _resolve_plan(email)
    if plan not in API_KEY_PLANS:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "API key access requires a Pro plan or above",
                "code": "PLAN_REQUIRED",
                "upgrade_url": "https://nebulacomponents.com/pricing",
            },
        )
    try:
        result = await api_key_service.create_key(
            workspace_email=email,
            plan=plan,
            label=body.label,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": str(e)})

    return {
        **result,
        "warning": "Store this key securely - it will not be shown again.",
    }


@router.get("")
async def list_api_keys(current_user=Depends(get_current_user)):
    """List active API keys for a workspace (prefixes only, no raw keys)."""
    email = _email_from_user(current_user)
    keys = await api_key_service.list_keys(email)
    plan = await _resolve_plan(email)
    from platform_api.services.api_key_service import PLAN_KEY_LIMITS, PLAN_QUOTAS
    return {
        "plan": plan,
        "keys": keys,
        "limit": PLAN_KEY_LIMITS.get(plan, 0),
        "quota_per_key_per_day": PLAN_QUOTAS.get(plan, 0),
        "can_create": plan in API_KEY_PLANS and len(keys) < PLAN_KEY_LIMITS.get(plan, 0),
    }


@router.delete("/{key_id}")
async def revoke_api_key(key_id: str, current_user=Depends(get_current_user)):
    """Revoke an API key by ID."""
    email = _email_from_user(current_user)
    revoked = await api_key_service.revoke_key(workspace_email=email, key_id=key_id)
    if not revoked:
        raise HTTPException(status_code=404, detail={"error": "Key not found or already revoked"})
    return {"status": "revoked", "key_id": key_id}


@router.get("/validate")
async def validate_key_endpoint(authorization: Optional[str] = Header(None)):
    """
    Validate an API key from Authorization: Bearer header.
    Returns key metadata if valid. Used by the MCP server and external callers.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "Authorization header required"})
    raw_key = authorization[7:].strip()
    result = await api_key_service.validate_key(raw_key, endpoint="validate")
    if not result:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid or expired API key", "code": "INVALID_KEY"},
        )
    return {"valid": True, **result}
