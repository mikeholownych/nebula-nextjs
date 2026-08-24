"""Competitor comparison analytics (Phase 3 Task 3).

Pure gap logic plus async assembly of the side-by-side comparison payload:

    {
      "you":   {"url", "score", "grade", "signals": {key: bool}},
      "rival": {"url", "label", "score", "grade", "signals": {key: bool},
                "last_score", "last_audited_at"},
      "your_edge":  [signal keys where you pass and the rival fails],
      "threats":    [signal keys where you fail and the rival passes],
      "history":    [{"date", "you", "rival"}]  # paired by calendar day
    }

Data layout: competitor_audits (owner_email, competitor_url, audit_id) lives in
nebula_audit next to audits; competitor_tracking lives in nebula_platform.
Legacy tracking rows without any linked audit have no diagnostics - callers
fall back to score-only data for those (see routes.py).
"""

from typing import Optional

from platform_api.services.audit_db import audit_db
from platform_api.services.signal_extract import extract_signal_map

# Cap on paired history points returned per rival.
HISTORY_MAX_POINTS = 30


def compute_gaps(
    you_signals: dict[str, bool], rival_signals: dict[str, bool]
) -> dict[str, list[str]]:
    """Pure: edge = rival fails & you pass; threat = you fail & rival passes.

    Keys present on only one side count only when that side's value is a
    strict bool (unknown signals on either side are ignored, never guessed).
    Sorted output keeps responses deterministic.
    """
    keys = set(you_signals) | set(rival_signals)
    return {
        "your_edge": sorted(
            k for k in keys
            if you_signals.get(k) is True and rival_signals.get(k) is False
        ),
        "threats": sorted(
            k for k in keys
            if you_signals.get(k) is False and rival_signals.get(k) is True
        ),
    }


async def _latest_your_audit(owner_email: str):
    """Most recent non-internal completed audit for the owner's workspace."""
    await audit_db.connect()
    async with audit_db.pool.acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT id, url, score, grade, engine_output, created_at
            FROM audits
            WHERE email = $1
              AND status = 'completed'
              AND source IS DISTINCT FROM 'competitor_tracking'
            ORDER BY created_at DESC
            LIMIT 1
            """,
            owner_email,
        )


async def _latest_rival_audit(owner_email: str, competitor_url: str):
    """Rival's latest linked audit via competitor_audits JOIN audits."""
    await audit_db.connect()
    async with audit_db.pool.acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT a.id, a.url, a.score, a.grade, a.engine_output, a.created_at
            FROM competitor_audits ca
            JOIN audits a ON a.id = ca.audit_id
            WHERE ca.owner_email = $1
              AND ca.competitor_url = $2
              AND a.status = 'completed'
            ORDER BY a.created_at DESC
            LIMIT 1
            """,
            owner_email,
            competitor_url,
        )


async def _history_series(owner_email: str, competitor_url: str):
    """[{date, you, rival}] for days where both sides completed an audit."""
    await audit_db.connect()
    async with audit_db.pool.acquire() as conn:
        yours = await conn.fetch(
            """
            SELECT DISTINCT ON (created_at::date)
                   created_at::date AS day, score
            FROM audits
            WHERE email = $1
              AND status = 'completed'
              AND source IS DISTINCT FROM 'competitor_tracking'
              AND score IS NOT NULL
            ORDER BY created_at::date, created_at DESC
            """,
            owner_email,
        )
        rivals = await conn.fetch(
            """
            SELECT DISTINCT ON (a.created_at::date)
                   a.created_at::date AS day, a.score
            FROM competitor_audits ca
            JOIN audits a ON a.id = ca.audit_id
            WHERE ca.owner_email = $1
              AND ca.competitor_url = $2
              AND a.status = 'completed'
              AND a.score IS NOT NULL
            ORDER BY a.created_at::date, a.created_at DESC
            """,
            owner_email,
            competitor_url,
        )
    your_by_day = {r["day"]: float(r["score"]) for r in yours}
    rival_by_day = {r["day"]: float(r["score"]) for r in rivals}
    paired = sorted(set(your_by_day) & set(rival_by_day))[-HISTORY_MAX_POINTS:]
    return [
        {"date": day.isoformat(), "you": your_by_day[day], "rival": rival_by_day[day]}
        for day in paired
    ]


def _audit_payload(row) -> Optional[dict]:
    if row is None:
        return None
    try:
        engine_output = row.get("engine_output")
    except Exception:  # asyncpg Record has no .get for missing keys
        engine_output = None
    return {
        "url": row["url"],
        "score": float(row["score"]) if row["score"] is not None else None,
        "grade": row["grade"],
        "signals": extract_signal_map(engine_output),
        "audited_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


async def competitor_comparison(
    owner_email: str,
    competitor_url: str,
    *,
    label: Optional[str] = None,
    last_score: Optional[float] = None,
    last_audited_at=None,
) -> dict:
    """Assemble the v2 comparison payload for one tracked rival.

    Legacy fallback: when either side lacks a linked/completed audit, the
    caller-supplied score-only fields are surfaced and edge/threats/history
    stay empty.
    """
    your_row = await _latest_your_audit(owner_email)
    rival_row = await _latest_rival_audit(owner_email, competitor_url)

    rival_payload = _audit_payload(rival_row)
    if rival_payload is not None:
        rival_payload.update({
            "label": label,
            "last_audited_at": (
                last_audited_at.isoformat() if last_audited_at else None
            ),
        })

    history = []
    if your_row is not None and rival_row is not None:
        history = await _history_series(owner_email, competitor_url)

    your_payload = _audit_payload(your_row)
    if your_row is not None and rival_row is not None:
        gaps = compute_gaps(
            (your_payload or {}).get("signals", {}),
            (rival_payload or {}).get("signals", {}),
        )
    else:
        gaps = {"your_edge": [], "threats": []}

    legacy_rival = {
        "url": competitor_url,
        "label": label,
        "last_score": float(last_score) if last_score is not None else None,
        "last_audited_at": last_audited_at.isoformat() if last_audited_at else None,
    }

    return {
        "you": your_payload or {},
        "rival": rival_payload or legacy_rival,
        **gaps,
        "history": history,
    }
