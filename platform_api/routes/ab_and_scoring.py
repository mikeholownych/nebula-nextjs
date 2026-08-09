"""A/B testing and lead scoring API routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from platform_api.services.ab_test import (
    assign_variant, record_exposure, record_conversion,
    get_stats, EXPERIMENTS,
)
from platform_api.services.lead_scoring import (
    compute_score_from_events, update_crm_score, decay_all_scores,
    get_pool,
)

router = APIRouter()


# ── A/B Test ──────────────────────────────────────────────────────────────────

@router.get("/ab/variant")
async def get_variant(experiment_id: str, user_id: str, audit_id: str | None = None):
    """Assign + record variant exposure for a user."""
    if experiment_id not in EXPERIMENTS:
        raise HTTPException(404, f"Unknown experiment: {experiment_id}")
    variant = assign_variant(experiment_id, user_id)
    await record_exposure(experiment_id, variant, user_id, audit_id)
    return {
        "experiment_id": experiment_id,
        "variant": variant,
        "label": EXPERIMENTS[experiment_id]["variants"][variant]["label"],
    }


@router.get("/ab/stats")
async def ab_stats(experiment_id: str):
    """Return variant stats and winner recommendation."""
    if experiment_id not in EXPERIMENTS:
        raise HTTPException(404, f"Unknown experiment: {experiment_id}")
    return await get_stats(experiment_id)


class ConversionIn(BaseModel):
    experiment_id: str
    user_id: str
    event_name: str
    value_cents: int = 0


@router.post("/ab/conversion")
async def record_ab_conversion(body: ConversionIn):
    """Record a conversion event for an A/B test participant."""
    await record_conversion(body.experiment_id, body.user_id, body.event_name, body.value_cents)
    return {"success": True}


@router.get("/ab/experiments")
async def list_experiments():
    """List all active experiments."""
    return {"experiments": list(EXPERIMENTS.keys())}


# ── Lead Scoring ──────────────────────────────────────────────────────────────

@router.get("/leads/score")
async def score_lead(email: str):
    """Compute live lead score for an email address."""
    pool = await get_pool()
    try:
        result = await compute_score_from_events(pool, email)
        return result
    finally:
        await pool.close()


@router.post("/leads/score/{email}/update")
async def update_score(email: str):
    """Recompute and persist lead score to customers table."""
    pool = await get_pool()
    try:
        result = await update_crm_score(pool, email)
        return {"success": True, **result}
    finally:
        await pool.close()


@router.post("/leads/decay-all")
async def run_decay():
    """Decay scores for all inactive prospects (run daily via cron)."""
    pool = await get_pool()
    try:
        updated = await decay_all_scores(pool)
        return {"success": True, "prospects_updated": updated}
    finally:
        await pool.close()
