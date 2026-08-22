"""Fixed-window rate limiter over Redis."""

import time

from fastapi import HTTPException


async def enforce_rate_limit(redis, key: str, limit: int,
                             window_seconds: int) -> None:
    window = int(time.time() // window_seconds)
    rk = f"rl:{key}:{window}"
    count = await redis.incr(rk)
    if count == 1:
        await redis.expire(rk, window_seconds)
    if count > limit:
        raise HTTPException(status_code=429, detail="Too many attempts, try later")
