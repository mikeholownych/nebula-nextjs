from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from platform_api.redis_client import redis_client
from platform_api.services.audit_db import audit_db

router = APIRouter(prefix="/health")


@router.get("/ping")
async def ping():
    return {"status": "ok"}


@router.get("/deep")
async def deep_health():
    components = {}
    overall = True

    # Redis
    try:
        await redis_client.connect()
        redis_ok = await redis_client.ping()
        components["redis"] = {"status": "ok" if redis_ok else "degraded"}
        if not redis_ok:
            overall = False
    except Exception as exc:
        components["redis"] = {"status": "error", "detail": str(exc)}
        overall = False

    # Postgres
    try:
        await audit_db.connect()
        async with audit_db.pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        components["postgres"] = {"status": "ok"}
    except Exception as exc:
        components["postgres"] = {"status": "error", "detail": str(exc)}
        overall = False

    # Last audit completed
    try:
        async with audit_db.pool.acquire() as conn:
            last_completed = await conn.fetchval(
                "SELECT MAX(completed_at) FROM audits WHERE completed_at IS NOT NULL"
            )
        if last_completed is None:
            components["last_audit"] = {"status": "warning", "detail": "No completed audits found"}
        else:
            if last_completed.tzinfo is None:
                last_completed = last_completed.replace(tzinfo=timezone.utc)
            threshold = datetime.now(timezone.utc) - timedelta(hours=1)
            if last_completed < threshold:
                components["last_audit"] = {
                    "status": "warning",
                    "detail": f"Last audit completed at {last_completed.isoformat()}",
                }
            else:
                components["last_audit"] = {"status": "ok", "last": last_completed.isoformat()}
    except Exception as exc:
        components["last_audit"] = {"status": "error", "detail": str(exc)}

    return {
        "status": "ok" if overall else "degraded",
        "components": components,
    }
