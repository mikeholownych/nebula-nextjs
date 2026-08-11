"""
API Key management service.
Handles creation, validation, quota enforcement, and revocation.
"""

import hashlib
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from platform_api.services.audit_db import audit_db

logger = logging.getLogger(__name__)

# Plan → daily quota (-1 = unlimited)
PLAN_QUOTAS: dict[str, int] = {
    "pro":    50,
    "growth": 200,
    "agency": -1,  # unlimited
}

# Plan → max keys allowed
PLAN_KEY_LIMITS: dict[str, int] = {
    "pro":    1,
    "growth": 3,
    "agency": 10,
}

# Minimum plan required to use API keys at all
API_KEY_PLANS = {"pro", "growth", "agency"}


def _hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def _make_raw_key() -> str:
    """Generate a secure random API key with 'nbk_' prefix."""
    token = secrets.token_urlsafe(32)
    return f"nbk_{token}"


class ApiKeyService:
    """Manage workspace API keys backed by the audit DB."""

    async def _pool(self):
        await audit_db.connect()
        assert audit_db.pool is not None, "DB pool failed to initialize"
        return audit_db.pool

    # ── Creation ──────────────────────────────────────────────────────────────

    async def create_key(
        self,
        workspace_email: str,
        plan: str,
        label: str = "Default",
    ) -> dict:
        """
        Create a new API key for a workspace.
        Returns the raw key ONCE - it is never stored in plaintext.
        Raises ValueError if the plan doesn't support API keys or the
        key limit for the plan is already reached.
        """
        if plan not in API_KEY_PLANS:
            raise ValueError(f"Plan '{plan}' does not include API key access")

        pool = await self._pool()
        async with pool.acquire() as conn:
            # Enforce per-plan key limit
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM api_keys WHERE workspace_email=$1 AND is_active=TRUE",
                workspace_email,
            )
            limit = PLAN_KEY_LIMITS.get(plan, 1)
            if count >= limit:
                raise ValueError(
                    f"Plan '{plan}' allows a maximum of {limit} active API key(s). "
                    f"Revoke an existing key to create a new one."
                )

            raw_key = _make_raw_key()
            key_hash = _hash_key(raw_key)
            key_prefix = raw_key[:12]  # "nbk_" + 8 chars
            daily_quota = PLAN_QUOTAS.get(plan, 50)

            row = await conn.fetchrow(
                """
                INSERT INTO api_keys
                    (workspace_email, key_hash, key_prefix, label, plan, daily_quota)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, key_prefix, label, plan, daily_quota, created_at
                """,
                workspace_email,
                key_hash,
                key_prefix,
                label,
                plan,
                daily_quota,
            )

        logger.info(
            "[api_keys] created key %s for %s (plan=%s)",
            row["key_prefix"],
            workspace_email,
            plan,
        )
        return {
            "id": str(row["id"]),
            "key": raw_key,           # returned ONCE, never stored
            "key_prefix": row["key_prefix"],
            "label": row["label"],
            "plan": row["plan"],
            "daily_quota": row["daily_quota"],
            "created_at": row["created_at"].isoformat(),
        }

    # ── Validation ────────────────────────────────────────────────────────────

    async def validate_key(
        self, raw_key: str, endpoint: str = "api"
    ) -> Optional[dict]:
        """
        Validate a raw API key and enforce daily quota.
        Returns the key record if valid and within quota, else None.
        Records usage on success.
        """
        if not raw_key or not raw_key.startswith("nbk_"):
            return None

        key_hash = _hash_key(raw_key)
        pool = await self._pool()

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, workspace_email, plan, daily_quota, is_active
                FROM api_keys
                WHERE key_hash = $1 AND is_active = TRUE AND revoked_at IS NULL
                """,
                key_hash,
            )
            if not row:
                return None

            key_id = row["id"]
            daily_quota = row["daily_quota"]

            # Quota check (-1 = unlimited)
            if daily_quota != -1:
                today_start = datetime.now(timezone.utc).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                used_today = await conn.fetchval(
                    """
                    SELECT COUNT(*) FROM api_key_usage
                    WHERE key_id = $1 AND used_at >= $2
                    """,
                    key_id,
                    today_start,
                )
                if used_today >= daily_quota:
                    logger.warning(
                        "[api_keys] quota exceeded key=%s used=%d limit=%d",
                        str(key_id)[:8],
                        used_today,
                        daily_quota,
                    )
                    return None

            # Record usage
            await conn.execute(
                "INSERT INTO api_key_usage (key_id, endpoint) VALUES ($1, $2)",
                key_id,
                endpoint,
            )
            # Update last_used_at
            await conn.execute(
                "UPDATE api_keys SET last_used_at = now() WHERE id = $1",
                key_id,
            )

        return {
            "id": str(key_id),
            "workspace_email": row["workspace_email"],
            "plan": row["plan"],
            "daily_quota": daily_quota,
        }

    # ── Listing ───────────────────────────────────────────────────────────────

    async def list_keys(self, workspace_email: str) -> list[dict]:
        """List active API keys for a workspace (no hashes, no raw keys)."""
        pool = await self._pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, key_prefix, label, plan, daily_quota,
                       last_used_at, created_at,
                       (SELECT COUNT(*) FROM api_key_usage u
                        WHERE u.key_id = api_keys.id
                          AND u.used_at >= date_trunc('day', now()))
                        AS used_today
                FROM api_keys
                WHERE workspace_email = $1 AND is_active = TRUE
                ORDER BY created_at DESC
                """,
                workspace_email,
            )
        return [
            {
                "id": str(r["id"]),
                "key_prefix": r["key_prefix"],
                "label": r["label"],
                "plan": r["plan"],
                "daily_quota": r["daily_quota"],
                "used_today": r["used_today"],
                "last_used_at": r["last_used_at"].isoformat() if r["last_used_at"] else None,
                "created_at": r["created_at"].isoformat(),
            }
            for r in rows
        ]

    # ── Revocation ────────────────────────────────────────────────────────────

    async def revoke_key(self, workspace_email: str, key_id: str) -> bool:
        """Revoke a key. Returns True if found and revoked, False if not found."""
        pool = await self._pool()
        async with pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE api_keys
                SET is_active = FALSE, revoked_at = now()
                WHERE id = $1 AND workspace_email = $2 AND is_active = TRUE
                """,
                UUID(key_id),
                workspace_email,
            )
        revoked = result == "UPDATE 1"
        if revoked:
            logger.info("[api_keys] revoked key %s for %s", key_id[:8], workspace_email)
        return revoked


# Singleton
api_key_service = ApiKeyService()
