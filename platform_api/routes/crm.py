"""CRM API — attribution dashboards, feedback, weekly reviews.

Endpoints:
  GET  /api/crm/funnel?days=30         Daily conversion funnel
  GET  /api/crm/sources                Revenue by UTM source
  GET  /api/crm/objections             Open objections
  GET  /api/crm/objections/summary     Objection frequency
  POST /api/crm/feedback               Log a feedback / objection
  POST /api/crm/weekly-review          Save / update weekly review
"""

from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from platform_api.services.crm import (
    get_daily_funnel,
    get_prospects_by_source,
    log_feedback,
    open_objections,
    objection_summary,
    resolve_feedback,
    save_weekly_review,
)

router = APIRouter(prefix="/crm")


# ── Attribution dashboards ────────────────────────────────────────────────────


@router.get("/funnel")
async def daily_funnel(days: int = 30):
    """Daily funnel: audits → checkouts → revenue."""
    rows = await get_daily_funnel(days)
    return {"days": days, "rows": rows}


@router.get("/sources")
async def sources():
    """Revenue, audits, conversion rate by UTM source."""
    rows = await get_prospects_by_source()
    return {"sources": rows}


# ── Feedback / objections ─────────────────────────────────────────────────────


class FeedbackIn(BaseModel):
    customer_email: str
    interaction_type: str        # objection | win | churn | question
    objection_reason: str | None = None
    source: str | None = None    # support_email | sales_call | live_chat | form
    notes: str | None = None
    follow_up_at: date | None = None


class ResolveIn(BaseModel):
    resolution_type: str         # price_discount | proof_demo | followup | educated | none
    outcome: str                 # closed_won | closed_lost | nurturing


@router.post("/feedback")
async def add_feedback(body: FeedbackIn):
    row = await log_feedback(
        body.customer_email,
        body.interaction_type,
        objection_reason=body.objection_reason,
        source=body.source,
        notes=body.notes,
        follow_up_at=body.follow_up_at,
    )
    return {"success": True, "id": str(row["id"])}


@router.post("/feedback/{feedback_id}/resolve")
async def resolve(feedback_id: UUID, body: ResolveIn):
    await resolve_feedback(feedback_id, body.resolution_type, body.outcome)
    return {"success": True}


@router.get("/objections")
async def objections():
    rows = await open_objections()
    return {"open_objections": rows}


@router.get("/objections/summary")
async def objections_summary():
    rows = await objection_summary()
    return {"summary": rows}


# ── Weekly review ─────────────────────────────────────────────────────────────


class WeeklyReviewIn(BaseModel):
    week_starting: date
    one_change_text: str
    one_change_metric: str
    notes: str | None = None


@router.post("/weekly-review")
async def weekly_review(body: WeeklyReviewIn):
    row = await save_weekly_review(
        body.week_starting,
        one_change_text=body.one_change_text,
        one_change_metric=body.one_change_metric,
        notes=body.notes,
    )
    return {"success": True, "review": row}
