"""Audit schedule routes — CRUD for re-audit schedules + diff endpoint."""

from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from platform_api.auth.routes import get_current_user
from platform_api.db.session import get_session
from platform_api.services.audit_db import audit_db

router = APIRouter(prefix="/api/audit/schedules", tags=["audit-schedules"])


# --- Request/Response Models ---

class ScheduleCreateRequest(BaseModel):
    url: str
    interval_days: int = 7
    enabled: bool = True


class ScheduleResponse(BaseModel):
    id: str
    user_id: str
    url: str
    interval_days: int
    next_run_at: Optional[str] = None
    enabled: bool
    created_at: str


# --- Routes ---

@router.get("/")
async def list_schedules(current_user=Depends(get_current_user)):
    """List all audit schedules for the current user."""
    user_id = current_user["user_id"]
    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        rows = session.execute(
            text("""
                SELECT id, user_id, url, interval_days, next_run_at, enabled, created_at
                FROM audit_schedules
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            """),
            {"user_id": user_id},
        ).fetchall()
        schedules = []
        for row in rows:
            schedules.append({
                "id": str(row.id),
                "user_id": str(row.user_id),
                "url": row.url,
                "interval_days": row.interval_days,
                "next_run_at": row.next_run_at.isoformat() if row.next_run_at else None,
                "enabled": row.enabled,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })
        return {"schedules": schedules}
    finally:
        session.close()


@router.post("/")
async def create_or_update_schedule(
    body: ScheduleCreateRequest,
    current_user=Depends(get_current_user),
):
    """Create or update an audit schedule (upsert by user_id + url)."""
    user_id = current_user["user_id"]
    url = body.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Valid URL required")

    interval_days = max(1, min(90, body.interval_days))
    next_run_at = datetime.now(timezone.utc) + timedelta(days=interval_days)

    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        result = session.execute(
            text("""
                INSERT INTO audit_schedules (user_id, url, interval_days, next_run_at, enabled)
                VALUES (:user_id, :url, :interval_days, :next_run_at, :enabled)
                ON CONFLICT (user_id, url)
                DO UPDATE SET
                    interval_days = EXCLUDED.interval_days,
                    next_run_at = EXCLUDED.next_run_at,
                    enabled = EXCLUDED.enabled
                RETURNING id, user_id, url, interval_days, next_run_at, enabled, created_at
            """),
            {
                "user_id": user_id,
                "url": url,
                "interval_days": interval_days,
                "next_run_at": next_run_at,
                "enabled": body.enabled,
            },
        ).fetchone()
        session.commit()
        return {
            "id": str(result.id),
            "user_id": str(result.user_id),
            "url": result.url,
            "interval_days": result.interval_days,
            "next_run_at": result.next_run_at.isoformat() if result.next_run_at else None,
            "enabled": result.enabled,
            "created_at": result.created_at.isoformat() if result.created_at else None,
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Schedule save failed: {str(e)}")
    finally:
        session.close()


@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: str, current_user=Depends(get_current_user)):
    """Delete an audit schedule."""
    user_id = current_user["user_id"]
    try:
        UUID(schedule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid schedule ID")

    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        result = session.execute(
            text("""
                DELETE FROM audit_schedules
                WHERE id = :schedule_id AND user_id = :user_id
                RETURNING id
            """),
            {"schedule_id": schedule_id, "user_id": user_id},
        ).fetchone()
        session.commit()
        if not result:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return {"deleted": True, "id": schedule_id}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
    finally:
        session.close()


@router.get("/diff")
async def diff_audits(
    audit_a: str,
    audit_b: str,
    current_user=Depends(get_current_user),
):
    """Compare two audits by their IDs. Returns score delta and findings diff."""
    try:
        UUID(audit_a)
        UUID(audit_b)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit ID(s)")

    # Fetch both audits from the audit database (nebula_audit)
    await audit_db.connect()
    async with audit_db.pool.acquire() as conn:
        row_a = await conn.fetchrow(
            "SELECT id, score, findings FROM audits WHERE id = $1",
            UUID(audit_a),
        )
        row_b = await conn.fetchrow(
            "SELECT id, score, findings FROM audits WHERE id = $1",
            UUID(audit_b),
        )

    if not row_a:
        raise HTTPException(status_code=404, detail=f"Audit {audit_a} not found")
    if not row_b:
        raise HTTPException(status_code=404, detail=f"Audit {audit_b} not found")

    # Parse findings
    import json
    findings_a_raw = row_a["findings"]
    findings_b_raw = row_b["findings"]

    if isinstance(findings_a_raw, str):
        findings_a = json.loads(findings_a_raw)
    elif findings_a_raw is None:
        findings_a = []
    else:
        findings_a = findings_a_raw

    if isinstance(findings_b_raw, str):
        findings_b = json.loads(findings_b_raw)
    elif findings_b_raw is None:
        findings_b = []
    else:
        findings_b = findings_b_raw

    # Build lookup by finding key
    keys_a = {f.get("key") or f.get("label", ""): f for f in findings_a if isinstance(f, dict)}
    keys_b = {f.get("key") or f.get("label", ""): f for f in findings_b if isinstance(f, dict)}

    set_a = set(keys_a.keys())
    set_b = set(keys_b.keys())

    findings_removed = [keys_a[k] for k in (set_a - set_b)]  # resolved in B
    findings_added = [keys_b[k] for k in (set_b - set_a)]    # new in B
    findings_unchanged = [keys_b[k] for k in (set_a & set_b)]

    score_a = (row_a["score"] or 0) / 10.0 if row_a["score"] is not None else 0
    score_b = (row_b["score"] or 0) / 10.0 if row_b["score"] is not None else 0
    score_delta = round(score_b - score_a, 1)

    return {
        "audit_a": audit_a,
        "audit_b": audit_b,
        "score_a": round(score_a, 1),
        "score_b": round(score_b, 1),
        "score_delta": score_delta,
        "findings_added": findings_added,
        "findings_removed": findings_removed,
        "findings_unchanged": findings_unchanged,
    }
