from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse

from platform_api.redis_client import redis_client

MAINTENANCE_KEY = "maintenance:active"


class MaintenanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path.startswith("/health"):
            return await call_next(request)

        await redis_client.connect()
        reason = await redis_client.get(MAINTENANCE_KEY)

        if reason is not None:
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Maintenance in progress",
                    "reason": reason,
                    "retry_after": 300,
                },
                headers={"Retry-After": "300"},
            )

        return await call_next(request)


MAINTENANCE_TTL_SECONDS = 6 * 3600  # INF-2: a stuck flag must self-expire


async def enable_maintenance(reason: str) -> None:
    await redis_client.connect()
    await redis_client.set(MAINTENANCE_KEY, reason, ttl=MAINTENANCE_TTL_SECONDS)


async def disable_maintenance() -> None:
    await redis_client.connect()
    await redis_client.delete(MAINTENANCE_KEY)
