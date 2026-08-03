import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse

from platform_api.redis_client import redis_client


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        await redis_client.connect()

        client_ip = request.client.host if request.client else "unknown"
        minute_bucket = int(time.time() // 60)
        key = f"rl:{client_ip}:{minute_bucket}"

        current = await redis_client.incr(key)
        if current == 1:
            await redis_client.expire(key, 60)

        if current > self.requests_per_minute:
            retry_after = 60 - int(time.time() % 60)
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded"},
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.requests_per_minute - current))
        return response
