"""
Dispatch API — weekly workspace activity digest endpoints.
"""

from fastapi import APIRouter, HTTPException, Query

from platform_api.services.audit_db import audit_db
from platform_api.services.dispatch import build_manifest, send_dispatch

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


@router.get("/preview")
async def preview_dispatch(
    email: str = Query(..., min_length=3, max_length=320),
    period: int = Query(default=7, ge=1, le=30),
):
    """Preview the dispatch manifest for a workspace email (no send)."""
    manifest = await build_manifest(email, period_days=period)
    if manifest is None:
        return {"email": email, "dispatch": None, "reason": "below_threshold"}
    return {"email": email, "dispatch": manifest}


@router.post("/send")
async def trigger_dispatch(
    email: str = Query(..., min_length=3, max_length=320),
    period: int = Query(default=7, ge=1, le=30),
):
    """Build and send a dispatch email immediately for the given workspace."""
    manifest = await build_manifest(email, period_days=period)
    if manifest is None:
        return {"sent": False, "reason": "below_threshold"}

    success = await send_dispatch(email, manifest)
    if not success:
        raise HTTPException(status_code=502, detail="Dispatch send failed")

    return {"sent": True, "email": email, "summary": manifest["overall_summary"]}


@router.post("/run-all")
async def run_all_dispatches():
    """Cron endpoint: iterate all workspaces with active monitors and send
    dispatches to those that meet the significance threshold."""
    await audit_db.connect()

    async with audit_db.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT email FROM monitors WHERE active = true
            """
        )

    sent_count = 0
    skipped_count = 0
    errors = []

    for row in rows:
        email = row["email"]
        try:
            manifest = await build_manifest(email)
            if manifest is None:
                skipped_count += 1
                continue
            success = await send_dispatch(email, manifest)
            if success:
                sent_count += 1
            else:
                errors.append(email)
        except Exception as exc:
            errors.append(f"{email}: {str(exc)[:100]}")

    return {
        "sent": sent_count,
        "skipped": skipped_count,
        "errors": errors,
    }
