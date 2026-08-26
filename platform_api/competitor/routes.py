"""Competitor benchmark tracking routes.

Free workspaces keep legacy parity: up to 3 tracked rivals, score-only
comparison (paid diagnostics are never exposed to them - frontend gating
handles the surface). Paid tiers use their entitlement slots (pro 2 /
growth 5 / agency 10) with full diagnostics. Rival audits run on the same
engine and persist full findings for later upgrade value. Scores are
stored on the 0-100 display scale to match the workspace dashboard.
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel

from platform_api.auth.routes import get_current_user
from platform_api.services.audit_db import audit_db

router = APIRouter(prefix="/api/competitors", tags=["competitors"])

MAX_COMPETITORS = 3
FREE_LEGACY_COMPETITOR_SLOTS = 3
AUDIT_API_URL = "http://localhost:8001/audit/run"


class CompetitorCreateRequest(BaseModel):
    url: str
    label: Optional[str] = None
    project_domain: Optional[str] = None


def _competitor_email(user_id: str) -> str:
    """Synthetic identity for competitor audits - keeps them out of the
    user's workspace audit list (which is keyed by their real email)."""
    return f"competitor+{user_id}@internal.nebulacomponents.com"


def _audit_domain(url: str) -> str:
    return (urlparse(url).hostname or "").lower().removeprefix("www.")


def _owner_email(session, user_id: str) -> Optional[str]:
    """Workspace owner email for a user_id (users table, platform db)."""
    from sqlalchemy import text
    row = session.execute(
        text("SELECT email FROM users WHERE id = :uid"),
        {"uid": user_id},
    ).fetchone()
    return row.email if row and row.email else None


def effective_slots(email: Optional[str], ent) -> int:
    """Slots this workspace may occupy.

    Free keeps grandfathered parity with the legacy three-rival cap
    (entitlement fixture says 0, spec 2026-08-24 restores 3). Paid tiers
    use their plan's entitlement slots.
    """
    if getattr(ent, "plan", None) == "free":
        return FREE_LEGACY_COMPETITOR_SLOTS
    return ent.competitor_slots


async def _linked_competitor_urls(owner_email: str) -> set:
    """Distinct rival URLs with at least one persisted audit for the owner."""
    await audit_db.connect()
    async with audit_db.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT DISTINCT competitor_url FROM competitor_audits WHERE owner_email = $1",
            owner_email,
        )
    return {r["competitor_url"] for r in rows}


async def _run_competitor_audit(tracking_id: str, user_id: str, url: str) -> None:
    """Background: run the audit synchronously via /audit/run (the endpoint
    itself blocks until the audit completes, up to 120s), then persist the
    resulting score to competitor_tracking and link the full audit to the
    workspace owner in competitor_audits."""
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
        audit_id = data.get("audit_id")

        from platform_api.db.session import SessionLocal
        if SessionLocal is None:
            return
        from sqlalchemy import text
        session = SessionLocal()
        owner_email = None
        try:
            owner_email = _owner_email(session, user_id)
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

        # Persist the rival link so diagnostics/history survive the score.
        # owner_email is the workspace owner resolved from user_id - never the
        # synthetic competitor email.
        if audit_id and owner_email:
            await audit_db.connect()
            async with audit_db.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO competitor_audits (owner_email, competitor_url, audit_id)
                    VALUES ($1, $2, $3)
                    """,
                    owner_email,
                    url,
                    audit_id,
                )
    except Exception:
        pass  # Best-effort - cron will retry stale competitors


@router.get("/")
async def list_competitors(
    project_domain: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    """List the current user's tracked competitors.

    Optional project_domain filter mirrors /comparison normalization.
    """
    user_id = current_user["user_id"]
    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        from sqlalchemy import text
        rows = session.execute(
            text("""
                SELECT id, competitor_url, label, project_domain, last_score, last_audited_at, created_at
                FROM competitor_tracking
                WHERE user_id = :user_id
                  AND (:project_domain IS NULL OR project_domain = :project_domain)
                ORDER BY created_at ASC
            """),
            {
                "user_id": user_id,
                "project_domain": (
                    project_domain.strip().lower().removeprefix("www.")
                    if project_domain and project_domain.strip()
                    else None
                ),
            },
        ).fetchall()
        competitors = []
        for row in rows:
            competitors.append({
                "id": str(row.id),
                "url": row.competitor_url,
                "label": row.label,
                "project_domain": row.project_domain,
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
    project_domain = (body.project_domain or "").strip().lower().removeprefix("www.") or None

    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    session = SessionLocal()
    try:
        owner_email = _owner_email(session, user_id)
        # Plan-driven slot enforcement (Phase 3): free is grandfathered at
        # legacy parity (3 rivals); paid tiers use entitlement slots
        # (pro 2, growth 5, agency 10). resolve_sync fails open to free.
        if not owner_email:
            raise HTTPException(
                status_code=403,
                detail={"message": "Competitor slots reached", "upgrade_url": "/pricing"},
            )
        from platform_api.services.entitlements import resolve_sync
        ent = resolve_sync(owner_email, session)
        # Usage = DISTINCT rival URLs across BOTH sources:
        # competitor_audits links (post-persistence era) UNION this user's
        # competitor_tracking rows (legacy era). Set union avoids double
        # charging a rival that exists in both.
        from sqlalchemy import text
        legacy_rows = session.execute(
            text("""
                SELECT competitor_url FROM competitor_tracking
                WHERE user_id = :user_id
            """),
            {"user_id": user_id},
        ).fetchall()
        linked_urls = await _linked_competitor_urls(owner_email)
        usage = len(linked_urls | {r.competitor_url for r in legacy_rows})
        if usage >= effective_slots(owner_email, ent):
            raise HTTPException(
                status_code=403,
                detail={
                    "message": "Competitor slots reached",
                    "upgrade_url": "/pricing",
                },
            )
        try:
            result = session.execute(
                text("""
                    INSERT INTO competitor_tracking (user_id, competitor_url, label, project_domain)
                    VALUES (:user_id, :url, :label, :project_domain)
                    RETURNING id, competitor_url, label, project_domain, last_score, last_audited_at, created_at
                """),
                {"user_id": user_id, "url": url, "label": label, "project_domain": project_domain},
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
            "project_domain": result.project_domain,
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
async def get_comparison(
    project_domain: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    """Your latest audit score vs tracked competitors (0-100 scale)."""
    user_id = current_user["user_id"]
    user = current_user.get("user")
    email = getattr(user, "email", None)

    your_score = None
    if email:
        try:
            audits = await audit_db.get_audits_by_email(email, limit=50)
            completed = [
                a for a in audits
                if a.get("status") == "completed"
                and a.get("score") is not None
                and (
                    not project_domain
                    or _audit_domain(a.get("url", "")) == project_domain.strip().lower().removeprefix("www.")
                )
            ]
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
                SELECT competitor_url, label, project_domain, last_score, last_audited_at
                FROM competitor_tracking
                WHERE user_id = :user_id
                  AND (:project_domain IS NULL OR project_domain = :project_domain)
                ORDER BY created_at ASC
            """),
            {"user_id": user_id, "project_domain": project_domain.strip().lower().removeprefix("www.") if project_domain else None},
        ).fetchall()
        competitors = []
        for row in rows:
            competitors.append({
                "url": row.competitor_url,
                "label": row.label,
                "project_domain": row.project_domain,
                "last_score": float(row.last_score) if row.last_score is not None else None,
                "last_audited_at": row.last_audited_at.isoformat() if row.last_audited_at else None,
            })
        return {"your_score": your_score, "competitors": competitors}
    finally:
        session.close()


@router.get("/comparison/{tracking_id}")
async def get_comparison_v2(tracking_id: str, current_user=Depends(get_current_user)):
    """Side-by-side signal diagnostics for one tracked rival (v2).

    Returns you/rival audit payloads with per-signal pass maps, edge/threat
    key lists, and a paired score history series. Falls back to legacy
    score-only rival data when either side lacks a linked completed audit.
    """
    try:
        UUID(tracking_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid competitor ID")

    user_id = current_user["user_id"]
    from platform_api.db.session import SessionLocal
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not available")
    from sqlalchemy import text

    session = SessionLocal()
    try:
        row = session.execute(
            text("""
                SELECT competitor_url, label, last_score, last_audited_at
                FROM competitor_tracking
                WHERE id = :id AND user_id = :user_id
            """),
            {"id": tracking_id, "user_id": user_id},
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Competitor not found")
        owner_email = _owner_email(session, user_id)
        if not owner_email:
            # Cannot attribute workspace audits - degrade to score-only view.
            return {
                "you": {},
                "rival": {
                    "url": row.competitor_url,
                    "label": row.label,
                    "last_score": (
                        float(row.last_score) if row.last_score is not None else None
                    ),
                    "last_audited_at": (
                        row.last_audited_at.isoformat() if row.last_audited_at else None
                    ),
                },
                "your_edge": [],
                "threats": [],
                "history": [],
            }
    finally:
        session.close()

    from platform_api.services import competitor_analytics

    return await competitor_analytics.competitor_comparison(
        owner_email,
        row.competitor_url,
        label=row.label,
        last_score=(
            float(row.last_score) if row.last_score is not None else None
        ),
        last_audited_at=row.last_audited_at,
    )
