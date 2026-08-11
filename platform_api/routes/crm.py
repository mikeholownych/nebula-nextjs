"""CRM API - attribution dashboards, feedback, weekly reviews.

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
    get_pool,
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


# ── Pipeline metrics ──────────────────────────────────────────────────────

@router.get("/pipeline")
async def pipeline_metrics(brief: bool = False):
    """Stage conversion rates, sales velocity, total LTV - live from DB.

    Add ?brief=1 for a single-line summary (token-efficient for agent crons).
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM crm_funnel_metrics")
        stale = await conn.fetch(
            "SELECT email, crm_status, days_inactive, utm_source FROM crm_stale_prospects LIMIT 20"
        )

    if brief:
        # 8-token summary for agent consumption - mirrors daily_retro.py output
        r = dict(row) if row else {}
        return (
            f"{r.get('interested',0)}/{10} interested"
            f" | {r.get('purchased',0)} purchased"
            f" | {r.get('churned',0)} churned"
            f" | ltv_cents={r.get('total_ltv_cents',0)}"
            f" | stale={len(stale)}"
        )

    return {
        "funnel": dict(row) if row else {},
        "stale_prospects": [dict(r) for r in stale],
    }


# ── Win / Loss close reason ───────────────────────────────────────────────

class CloseReasonIn(BaseModel):
    customer_email: str
    outcome: str          # won | lost
    close_reason: str     # price | timing | competitor | no_need | no_response
    notes: str | None = None


@router.post("/close-reason")
async def log_close_reason(body: CloseReasonIn):
    """Log why a deal closed won or lost. Required for win/loss analysis."""
    valid_outcomes = {"won", "lost"}
    valid_reasons = {"price", "timing", "competitor", "no_need", "no_response", "other"}

    if body.outcome not in valid_outcomes:
        raise HTTPException(400, f"outcome must be one of: {valid_outcomes}")
    if body.close_reason not in valid_reasons:
        raise HTTPException(400, f"close_reason must be one of: {valid_reasons}")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Log as feedback entry with close reason
        await conn.execute("""
            INSERT INTO crm_feedback
                (customer_email, interaction_type, objection_reason,
                 close_reason, outcome, notes, resolved, logged_at)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE, now())
        """,
            body.customer_email,
            "churn" if body.outcome == "lost" else "win",
            body.close_reason if body.outcome == "lost" else None,
            body.close_reason,
            f"closed_{body.outcome}",
            body.notes,
        )
        # Update customer status
        new_status = "purchased" if body.outcome == "won" else "cold"
        await conn.execute(
            "UPDATE customers SET crm_status = $1, updated_at = now() WHERE email = $2",
            new_status, body.customer_email,
        )
    return {"success": True, "outcome": body.outcome, "reason": body.close_reason}


@router.get("/win-loss")
async def win_loss_analysis():
    """Win/loss breakdown by close reason - product-market fit diagnostic."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                outcome,
                COALESCE(close_reason, 'unspecified') AS reason,
                COUNT(*) AS count
            FROM crm_feedback
            WHERE close_reason IS NOT NULL
            GROUP BY outcome, COALESCE(close_reason, 'unspecified')
            ORDER BY outcome, count DESC
        """)
    return {"win_loss": [dict(r) for r in rows]}


@router.get("/health")
async def crm_health():
    """CRM health check - confirms DB connectivity and returns row counts."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        counts = await conn.fetchrow("""
            SELECT
                (SELECT count(*) FROM customers)            AS total_customers,
                (SELECT count(*) FROM customers WHERE crm_status='purchased') AS purchased,
                (SELECT count(*) FROM customers WHERE crm_status='pro_subscriber') AS pro,
                (SELECT count(*) FROM audits WHERE created_at >= now() - interval '24h') AS audits_24h,
                (SELECT count(*) FROM crm_feedback WHERE logged_at >= now() - interval '7d') AS feedback_7d
        """)
    return {"status": "healthy", "counts": dict(counts)}


@router.get("/hook-performance")
async def hook_performance():
    """Reply rate AND purchase rate by hook variant (A/B/C).

    Neil Gambit principle: optimize hooks for buyers, not just replies.
    A hook that gets replies but no purchases is the wrong signal to optimize on.

    Reads from SQLite sequence_state + PostgreSQL customers table.
    Trigger: if reply_rate < 5% after 10+ sends → rewrite hook.
    Trigger: if purchases > 0 and purchase_rate differs by variant → keep winner only.
    """
    import sqlite3
    from pathlib import Path
    db_path = Path(__file__).parent.parent.parent / "lead_gen" / "lead_state.db"
    if not db_path.exists():
        return {"hook_performance": [], "note": "No sequence data yet"}
    db = sqlite3.connect(str(db_path))
    db.row_factory = sqlite3.Row
    rows = db.execute("""
        SELECT
            COALESCE(hook_variant, 'A') AS variant,
            COUNT(*) AS sends,
            SUM(CASE WHEN replied_at IS NOT NULL THEN 1 ELSE 0 END) AS replies,
            GROUP_CONCAT(email) AS emails
        FROM sequence_state
        GROUP BY COALESCE(hook_variant, 'A')
        ORDER BY variant
    """).fetchall()
    db.close()

    # Count purchases per variant from PostgreSQL customers table
    purchase_map = {}
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            purchase_rows = await conn.fetch("""
                SELECT email, crm_status FROM customers
                WHERE crm_status = 'purchased'
            """)
            purchased_emails = {r["email"] for r in purchase_rows}
    except Exception:
        purchased_emails = set()

    result = []
    for r in rows:
        sends = r["sends"]
        replies = r["replies"]
        emails = set((r["emails"] or "").split(","))
        purchases = len(emails & purchased_emails)
        reply_rate = round(replies / sends * 100, 1) if sends > 0 else 0
        purchase_rate = round(purchases / sends * 100, 1) if sends > 0 else 0
        flag = "⚠️ NO_SIGNAL" if sends >= 10 and reply_rate == 0 else (
               "⚠️ NO_PURCHASES" if sends >= 20 and purchases == 0 else "✓"
               )
        result.append({
            "variant": r["variant"],
            "sends": sends,
            "replies": replies,
            "purchases": purchases,
            "reply_rate_pct": reply_rate,
            "purchase_rate_pct": purchase_rate,
            "flag": flag,
            "note": "Optimize for purchase_rate once data exists" if purchases == 0 else "",
        })
    return {"hook_performance": result}
