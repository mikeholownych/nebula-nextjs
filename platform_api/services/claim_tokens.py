"""Short-lived single-use tokens for teardown claim verification."""

import secrets
from datetime import datetime, timezone

CLAIM_TOKEN_TTL_SECONDS = 900


def token_key(slug: str, token: str) -> str:
    return f"tclaim:{slug}:{token}"


async def issue_claim_token(redis, slug: str, email: str,
                            ttl_seconds: int = CLAIM_TOKEN_TTL_SECONDS) -> str:
    token = secrets.token_urlsafe(32)
    await redis.set(token_key(slug, token),
                    {"email": email.strip().lower(),
                     "created_at": datetime.now(timezone.utc).isoformat()},
                    ttl=ttl_seconds)
    return token


async def consume_claim_token(redis, slug: str, token: str) -> str | None:
    data = await redis.get(token_key(slug, token))
    if not data or not isinstance(data, dict):
        return None
    await redis.delete(token_key(slug, token))
    return data.get("email")
