"""Experiment tracking routes (Feature 7).

Endpoints (all require an authenticated session):
- GET    /api/experiments/            - list user's experiments, newest first
- POST   /api/experiments/            - start an experiment (captures baseline)
- PATCH  /api/experiments/{id}        - conclude / mark inconclusive
- DELETE /api/experiments/{id}        - delete
- POST   /api/experiments/{id}/refresh - re-capture current metrics

Baseline/current metrics:
- Audit score: latest completed audit for (user email, url) from the
  nebula_audit DB (cross-DB via audit_db - same pattern as
  platform_api/routes/report_routes.py).
- GSC position/CTR: last-28-day searchAnalytics for the page, when the
  user has a gsc_connections row; null otherwise.
"""

import logging
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from platform_api.auth.routes import get_current_user
from platform_api.db.models import GscConnection
from platform_api.db.session import get_session
from platform_api.gsc.routes import _get_or_refresh_token
from platform_api.services.audit_db import audit_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/experiments", tags=["experiments"])

VALID_STATUSES = ("running", "concluded", "inconclusive")


class ExperimentCreateRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048)
    description: str = Field(..., min_length=1, max_length=2000)
    finding_keys: List[str] = Field(default_factory=list)


class ExperimentPatchRequest(BaseModel):
    status: str


# ── Metric capture helpers ──────────────────────────────────────────────────


async def _latest_audit_score(email: str, url: str) -> Optional[float]:
    """Latest completed audit score (0-100 scale) for (email, url), or None."""
    try:
        audit = await audit_db.get_latest_completed_audit(email, url)
        if audit and audit.get("score") is not None:
            return round(float(audit["score"]), 1)
    except Exception:
        logger.warning("experiment: audit score lookup failed for %s", url,
                       exc_info=True)
    return None


async def _gsc_page_metrics(
    db: Session, user_id: str, url: str
) -> tuple[Optional[float], Optional[float]]:
    """Last-28-day GSC (position, ctr) for one page, or (None, None).

    Never raises - GSC outages must not break experiment CRUD.
    """
    try:
        conn = (
            db.query(GscConnection)
            .filter_by(user_id=UUID(user_id))
            .first()
        )
        if not conn or not conn.gsc_site_url:
            return None, None

        access_token = _get_or_refresh_token(conn, db)

        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=27)
        encoded_site = urllib.parse.quote(conn.gsc_site_url, safe="")
        api_url = (
            "https://www.googleapis.com/webmasters/v3/sites/"
            f"{encoded_site}/searchAnalytics/query"
        )
        payload = {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dimensions": [],
            "dimensionFilterGroups": [
                {
                    "filters": [
                        {
                            "dimension": "page",
                            "operator": "equals",
                            "expression": url,
                        }
                    ]
                }
            ],
            "rowLimit": 1,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                api_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
            )
        if resp.status_code != 200:
            logger.warning(
                "experiment: GSC query for %s returned %s", url, resp.status_code
            )
            return None, None
        rows = resp.json().get("rows", [])
        if not rows:
            return None, None
        r = rows[0]
        return round(float(r.get("position", 0.0)), 1), round(
            float(r.get("ctr", 0.0)), 4
        )
    except Exception:
        logger.warning("experiment: GSC metrics failed for %s", url, exc_info=True)
        return None, None


# ── Serialization ────────────────────────────────────────────────────────────


def _num(v) -> Optional[float]:
    return float(v) if v is not None else None


def _serialize(row) -> dict:
    return {
        "id": str(row.id),
        "url": row.url,
        "description": row.description,
        "finding_keys": list(row.finding_keys or []),
        "started_at": row.started_at.isoformat() if row.started_at else None,
        "concluded_at": row.concluded_at.isoformat() if row.concluded_at else None,
        "status": row.status,
        "baseline_score": _num(row.baseline_score),
        "baseline_position": _num(row.baseline_position),
        "baseline_ctr": _num(row.baseline_ctr),
        "current_score": _num(row.current_score),
        "current_position": _num(row.current_position),
        "current_ctr": _num(row.current_ctr),
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _get_owned(db: Session, exp_id: str, user_id: str):
    try:
        exp_uuid = UUID(exp_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid experiment ID format")
    row = db.execute(
        text("SELECT * FROM experiments WHERE id = :id"),
        {"id": str(exp_uuid)},
    ).first()
    if not row or str(row.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return row


# ── Routes ───────────────────────────────────────────────────────────────────


@router.get("/")
async def list_experiments(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """List the current user's experiments, newest first."""
    rows = db.execute(
        text(
            """
            SELECT * FROM experiments
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 200
            """
        ),
        {"user_id": current_user["user_id"]},
    ).fetchall()
    return {"experiments": [_serialize(r) for r in rows]}


@router.post("/", status_code=201)
async def create_experiment(
    body: ExperimentCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Start an experiment: capture baseline audit score + GSC metrics."""
    user_id = current_user["user_id"]
    email = (current_user["user"].email or "").strip().lower()

    baseline_score = await _latest_audit_score(email, body.url)
    baseline_position, baseline_ctr = await _gsc_page_metrics(db, user_id, body.url)

    row = db.execute(
        text(
            """
            INSERT INTO experiments
                (user_id, url, description, finding_keys,
                 baseline_score, baseline_position, baseline_ctr,
                 current_score, current_position, current_ctr)
            VALUES
                (:user_id, :url, :description, :finding_keys,
                 :baseline_score, :baseline_position, :baseline_ctr,
                 :current_score, :current_position, :current_ctr)
            RETURNING *
            """
        ),
        {
            "user_id": user_id,
            "url": body.url.strip(),
            "description": body.description.strip(),
            "finding_keys": [k for k in body.finding_keys if k][:50],
            "baseline_score": baseline_score,
            "baseline_position": baseline_position,
            "baseline_ctr": baseline_ctr,
            "current_score": baseline_score,
            "current_position": baseline_position,
            "current_ctr": baseline_ctr,
        },
    ).first()
    db.commit()
    return _serialize(row)


@router.patch("/{exp_id}")
async def update_experiment(
    exp_id: str,
    body: ExperimentPatchRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Mark an experiment concluded or inconclusive (sets concluded_at)."""
    user_id = current_user["user_id"]
    _get_owned(db, exp_id, user_id)

    status = body.status.strip().lower()
    if status not in ("concluded", "inconclusive", "running"):
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of: {', '.join(VALID_STATUSES)}",
        )

    row = db.execute(
        text(
            """
            UPDATE experiments
            SET status = :status,
                concluded_at = CASE WHEN :status = 'running' THEN NULL ELSE now() END
            WHERE id = :id
            RETURNING *
            """
        ),
        {"status": status, "id": exp_id},
    ).first()
    db.commit()
    return _serialize(row)


@router.delete("/{exp_id}")
async def delete_experiment(
    exp_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Delete an experiment."""
    user_id = current_user["user_id"]
    _get_owned(db, exp_id, user_id)
    db.execute(
        text("DELETE FROM experiments WHERE id = :id"), {"id": exp_id}
    )
    db.commit()
    return {"deleted": True, "id": exp_id}


@router.post("/{exp_id}/refresh")
async def refresh_experiment(
    exp_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Re-capture current_score (latest audit) + current GSC metrics."""
    user_id = current_user["user_id"]
    exp = _get_owned(db, exp_id, user_id)
    email = (current_user["user"].email or "").strip().lower()

    current_score = await _latest_audit_score(email, exp.url)
    current_position, current_ctr = await _gsc_page_metrics(db, user_id, exp.url)

    row = db.execute(
        text(
            """
            UPDATE experiments
            SET current_score = :score,
                current_position = :position,
                current_ctr = :ctr
            WHERE id = :id
            RETURNING *
            """
        ),
        {
            "score": current_score,
            "position": current_position,
            "ctr": current_ctr,
            "id": exp_id,
        },
    ).first()
    db.commit()
    return _serialize(row)
