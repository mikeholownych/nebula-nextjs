"""Teardown content + claim read endpoints (phase 1)."""

from fastapi import APIRouter, Depends, HTTPException

from platform_api.auth.principal import internal_service_dependency
from platform_api.services.teardown_db import get_teardown_db

router = APIRouter(prefix="/teardowns",
                   dependencies=[Depends(internal_service_dependency)])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_teardowns():
    rows = await get_teardown_db().list_teardowns()
    slim = [{k: r[k] for k in (
        "slug", "name", "url", "domain", "score", "grade",
        "audited_at", "summary", "screenshot_path", "claimed")} for r in rows]
    return {"teardowns": slim}


@router.get("/{slug}")
async def get_teardown(slug: str):
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    return rec


@router.get("/{slug}/claim-status")
async def claim_status(slug: str):
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    return {"claimed": bool(rec.get("claim"))}
