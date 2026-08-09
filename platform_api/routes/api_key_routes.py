"""
API Key routes: create, list, revoke.
Gated to Growth+ plan. Plan is inferred from the workspace's active subscription.
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional
import logging

from platform_api.services.api_key_service import api_key_service, API_KEY_PLANS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/workspace/api-keys", tags=["api-keys"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _resolve_plan(workspace_email: str) -> str:
    """
    Look up the workspace's active subscription plan.
    Returns plan key string or 'free' if no paid sub.
    """
    from platform_api.services.audit_db import audit_db
    await audit_db.connect()
    assert audit_db.pool is not None
    pool = audit_db.pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT plan FROM subscriptions
            WHERE email = $1
            AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
            """,
            workspace_email,
        )
    return row["plan"] if row else "free"


# ── Request/Response models ───────────────────────────────────────────────────

class CreateKeyRequest(BaseModel):
    email: str
    label: str = "Default"


class RevokeKeyRequest(BaseModel):
    email: str
    key_id: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("")
async def create_api_key(body: CreateKeyRequest):
    """
    Create a new API key for a workspace.
    Plan is derived from the workspace's active subscription.
    The raw key is returned ONCE — store it immediately.
    """
    plan = await _resolve_plan(body.email)
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
            workspace_email=body.email,
            plan=plan,
            label=body.label,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": str(e)})

    return {
        **result,
        "warning": "Store this key securely — it will not be shown again.",
    }


@router.get("")
async def list_api_keys(email: str = Query(...)):
    """List active API keys for a workspace (prefixes only, no raw keys)."""
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
async def revoke_api_key(key_id: str, email: str = Query(...)):
    """Revoke an API key by ID."""
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
