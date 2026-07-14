"""Rate-limiting middleware using Redis token bucket algorithm.

Enforces configurable limits per endpoint and identifier (IP or user_id).

Usage:
    @app.get("/api/endpoint")
    @rate_limit(max_requests=100, window_seconds=60)
    async def endpoint():
        return {"message": "ok"}
"""

import time
from typing import Callable, Optional

from fastapi import HTTPException, Request, Response
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware

from ..redis_client import RedisClient


# Rate limit tiers (requests per window)
RATE_LIMITS = {
    "/api/auth/google": (10, 60),       # 10 req/min
    "/api/auth/magic-link": (5, 900),   # 5 req/15min
    "/api/auth/logout": (10, 60),       # 10 req/min
    "/api/webhook/stripe": (1000, 60),  # 1000 req/min (webhooks)
    "default_authenticated": (100, 60), # 100 req/min
    "default_anonymous": (20, 60),      # 20 req/min
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate-limit middleware for all requests.
    
    Uses Redis token bucket algorithm for distributed rate-limiting.
    """
    
    def __init__(self, app, redis: RedisClient):
        super().__init__(app)
        self.redis = redis
        self._lua_script = """
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        -- Clear expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window * 1000)
        
        -- Count requests in window
        local count = redis.call('ZCARD', key)
        
        if count < limit then
            -- Add request
            redis.call('ZADD', key, now, now .. '-' .. math.random())
            redis.call('EXPIRE', key, window)
            return count + 1
        else
            -- Rate limit exceeded
            return nil
        end
        """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate-limiting for health checks
        if request.url.path in ["/healthz", "/readyz"]:
            return await call_next(request)
        
        # Get rate limit config
        max_requests, window_seconds = self._get_rate_limit(request)
        
        # Get identifier (user_id or IP)
        identifier = self._get_identifier(request)
        
        # Build Redis key
        key = f"ratelimit:{identifier}:{request.url.path}"
        
        # Check rate limit
        allowed = await self._check_rate_limit(
            key, max_requests, window_seconds
        )
        
        if not allowed:
            # Get TTL for retry-after header
            ttl = await self.redis.ttl(key)
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Retry in {ttl} seconds.",
                headers={"Retry-After": str(ttl)}
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Window"] = str(window_seconds)
        
        return response
    
    def _get_rate_limit(self, request: Request) -> tuple[int, int]:
        """Get rate limit for endpoint."""
        path = request.url.path
        
        # Check specific endpoint limits
        if path in RATE_LIMITS:
            return RATE_LIMITS[path]
        
        # Check if authenticated
        # (Will be updated when auth middleware is added)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return RATE_LIMITS["default_authenticated"]
        
        return RATE_LIMITS["default_anonymous"]
    
    def _get_identifier(self, request: Request) -> str:
        """Get identifier for rate-limiting (user_id or IP)."""
        # Try user_id from JWT (if authenticated)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Decode JWT to get user_id
            # (Simplified - production should use proper JWT verification)
            try:
                token = auth_header[7:]
                # For now, use token hash as identifier
                # TODO: Decode JWT and extract user_id
                import hashlib
                return hashlib.sha256(token.encode()).hexdigest()[:16]
            except Exception:
                pass
        
        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        return request.client.host if request.client else "unknown"
    
    async def _check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> bool:
        """Check if request is allowed using token bucket.
        
        Returns:
            True if allowed, False if rate limit exceeded
        """
        now = int(time.time() * 1000)  # Current time in milliseconds
        
        try:
            # Execute Lua script atomically
            result = await self.redis.client.eval(
                self._lua_script,
                1,
                key,
                max_requests,
                window_seconds,
                now
            )
            
            return result is not None
        
        except Exception as e:
            # On Redis error, allow request (fail open)
            print(f"Rate limit error: {e}")
            return True


def setup_rate_limiting(app, redis: RedisClient):
    """Add rate-limiting middleware to app."""
    app.add_middleware(RateLimitMiddleware, redis=redis)
