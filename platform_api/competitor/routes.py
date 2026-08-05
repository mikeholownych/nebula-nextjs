"""Competitor benchmark tracking routes.

Users track up to 3 competitor URLs. Competitors are audited with the same
engine (score only — findings are never exposed). Scores are stored on the
0-100 display scale to match the workspace dashboard.
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from platform_api.auth.routes import get_current_user
from platform_api.services.audit_db import audit_db

router = APIRouter(prefix="/api/competitors", tags=["competitors"])

MAX_COMPETITORS = 3
AUDIT_API_URL = "http://localhost:8001/audit/run"


class CompetitorCreateRequest(BaseModel):
    url: str
    label: Optional[str] = None


def _competitor_email(user_id: str) -> str:
    """Synthetic identity for competitor audits — keeps them out of the
    user's workspace audit list (which is keyed by their real email)."""
    return f"competitor+{user_id}@internal.nebulacomponents.com"


async def _run_competitor_audit(tracking_id: str, user_id: str, url: str) -> None:
    """Background: run the audit synchronously via /audit/run (the endpoint
    itself blocks until the audit completes, up to 120s), then persist the
    resulting score to competitor_tracking."""
    try:
        async with httpx.AsyncClient(timeout=150.0) as client:
            res = await client.post(
                AUDIT_API_URL,
                json={
                    "url": url,
                    "email": _competitor_email(user_id),
                    "source": "competitor_tracking",
                },
            )
        if res.status_code != 200:
            return
        data = res.json()
        if data.get("status") != "completed" or data.get("score") is None:
            return
        # /audit/run returns the 0-10 score; store on the 0-100 display scale
        score = round(float(data["score"]) * 10, 1)

        from platform_api.db.session import SessionLocal
        if SessionLocal is None:
            return
        from sqlalchemy import text
        session = SessionLocal()
        try:
            session.execute(
                text("""
                    UPDATE competitor_tracking
                    SET last_score = :score, last_audited_at = :at
                    WHERE id = :id
                """),
                {"score": score, "at": datetime.now(timezone.utc), "id": tracking_id},
            )
            session.commit()
        finally:
            session.close()
    except Exception:
        pass  # Best-effort — cron will retry stale competitors


@router.get("/")
async def list_competitors(current_user=Depends(get_current_user)):
    """List the current user's tracked competitors."""
    user_id = current_user["user_id"]
    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        rows = session.execute(
            text("""
                SELECT id, competitor_url, label, last_score, last_audited_at, created_at
                FROM competitor_tracking
                WHERE user_id = :user_id
                ORDER BY created_at ASC
            """),
            {"user_id": user_id},
        ).fetchall()
        competitors = []
        for row in rows:
            competitors.append({
                "id": str(row.id),
                "url": row.competitor_url,
                "label": row.label,
                "last_score": float(row.last_score) if row.last_score is not None else None,
                "last_audited_at": row.last_audited_at.isoformat() if row.last_audited_at else None,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })
        return {"competitors": competitors, "max": MAX_COMPETITORS}
    finally:
        session.close()


@router.post("/")
async def add_competitor(
    body: CompetitorCreateRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Add a competitor (max 3 per user) and trigger an immediate audit."""
    user_id = current_user["user_id"]
    url = body.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Valid URL required (http/https)")
    label = (body.label or "").strip()[:200] or None

    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        count = session.execute(
            text("SELECT COUNT(*) FROM competitor_tracking WHERE user_id = :user_id"),
            {"user_id": user_id},
        ).scalar()
        if count >= MAX_COMPETITORS:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {MAX_COMPETITORS} competitors allowed",
            )
        try:
            result = session.execute(
                text("""
                    INSERT INTO competitor_tracking (user_id, competitor_url, label)
                    VALUES (:user_id, :url, :label)
                    RETURNING id, competitor_url, label, last_score, last_audited_at, created_at
                """),
                {"user_id": user_id, "url": url, "label": label},
            ).fetchone()
            session.commit()
        except HTTPException:
            raise
        except Exception:
            session.rollback()
            raise HTTPException(status_code=400, detail="Competitor already tracked")

        tracking_id = str(result.id)
        # Immediate first audit in the background (updates score on completion)
        background_tasks.add_task(_run_competitor_audit, tracking_id, user_id, url)

        return {
            "id": tracking_id,
            "url": result.competitor_url,
            "label": result.label,
            "last_score": None,
            "last_audited_at": None,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "audit_triggered": True,
        }
    except HTTPException:
        raise
    finally:
        session.close()


@router.delete("/{competitor_id}")
async def delete_competitor(competitor_id: str, current_user=Depends(get_current_user)):
    """Remove a tracked competitor."""
    user_id = current_user["user_id"]
    try:
        UUID(competitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid competitor ID")

    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        result = session.execute(
            text("""
                DELETE FROM competitor_tracking
                WHERE id = :id AND user_id = :user_id
                RETURNING id
            """),
            {"id": competitor_id, "user_id": user_id},
        ).fetchone()
        session.commit()
        if not result:
            raise HTTPException(status_code=404, detail="Competitor not found")
        return {"deleted": True, "id": competitor_id}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
    finally:
        session.close()


@router.get("/comparison")
async def get_comparison(current_user=Depends(get_current_user)):
    """Your latest audit score vs tracked competitors (0-100 scale)."""
    user_id = current_user["user_id"]
    user = current_user.get("user")
    email = getattr(user, "email", None)

    your_score = None
    if email:
        try:
            audits = await audit_db.get_audits_by_email(email, limit=1)
            completed = [a for a in audits if a.get("status") == "completed" and a.get("score") is not None]
            if completed:
                # audits table stores score on the 0-100 scale
                your_score = float(completed[0]["score"])
        except Exception:
            your_score = None

    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        rows = session.execute(
            text("""
                SELECT competitor_url, label, last_score, last_audited_at
                FROM competitor_tracking
                WHERE user_id = :user_id
                ORDER BY created_at ASC
            """),
            {"user_id": user_id},
        ).fetchall()
        competitors = []
        for row in rows:
            competitors.append({
                "url": row.competitor_url,
                "label": row.label,
                "last_score": float(row.last_score) if row.last_score is not None else None,
                "last_audited_at": row.last_audited_at.isoformat() if row.last_audited_at else None,
            })
        return {"your_score": your_score, "competitors": competitors}
    finally:
        session.close()
