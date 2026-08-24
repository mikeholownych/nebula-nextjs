"""Benchmark rollups and personal positioning (Phase 3 Task 4).

Rollup job: over completed audits in a trailing window, excluding founder
emails and Nebula's own domains (same exclusion rule as
AuditDB.get_benchmarks), compute a composite score distribution
{p25,p50,p75,p90} plus per-signal pass rates via signal_extract, and INSERT
one benchmark_rollups row. Inserts only: history is never deleted or
rewritten.

Personal positioning: /audit/analytics/benchmarks/me interpolates a caller's
audit score against the latest global rollup and marks each of their signals
above/below the corpus pass rate.

asyncpg returns jsonb columns as JSON strings - every consumer here accepts
dict | str like services.signal_extract does. All helpers tolerate missing or
malformed data by degrading to neutral defaults rather than raising.
"""

import json
import logging
import math

from platform_api.services.audit_db import (
    INTERNAL_EMAILS,
    SELF_DOMAINS,
)
from platform_api.services.signal_extract import extract_signal_map

logger = logging.getLogger(__name__)

_CORPUS_QUERY = """
    SELECT score, engine_output, email
    FROM audits
    WHERE status = 'completed'
      AND score IS NOT NULL
      AND email != ALL($1::text[])
      AND split_part(email, '@', 2) != ALL($2::text[])
      AND created_at >= NOW() - make_interval(days => $3::int)
"""


def _coerce_jsonb(value) -> dict:
    """dict passthrough; JSON string -> dict (asyncpg jsonb); else {}."""
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except json.JSONDecodeError:
            return {}
    return value if isinstance(value, dict) else {}


def percentile_rank(values: list[float], v: float) -> int:
    """Share of corpus strictly below v, 0-100 rounded. Empty corpus -> 50."""
    if not values:
        return 50
    try:
        vf = float(v)
    except (TypeError, ValueError):
        return 50
    vals = []
    for x in values:
        try:
            vals.append(float(x))
        except (TypeError, ValueError):
            continue
    if not vals:
        return 50
    below = sum(1 for x in vals if x < vf)
    return round(below / len(vals) * 100)


def _percentile(sorted_values: list[float], pct: float) -> float | None:
    """Linear-interpolated percentile of pre-sorted values, pct in [0,100]."""
    n = len(sorted_values)
    if n == 0:
        return None
    if n == 1:
        return float(sorted_values[0])
    idx = (n - 1) * (pct / 100.0)
    lo, hi = math.floor(idx), math.ceil(idx)
    if lo == hi:
        return float(sorted_values[lo])
    frac = idx - lo
    return sorted_values[lo] * (1 - frac) + sorted_values[hi] * frac


def interpolate_percentile(composite_json, your_score) -> int:
    """Your score's percentile against stored {p25,p50,p75,p90} anchors.

    Piecewise linear between (0,0), the four anchors and (100,100). Missing or
    malformed composite -> 50 (unknown distribution). Result clamped 0-100.
    """
    composite = _coerce_jsonb(composite_json)
    anchors: list[tuple[float, float]] = [(0.0, 0.0)]
    ok = True
    for key, pct in (("p25", 25), ("p50", 50), ("p75", 75), ("p90", 90)):
        val = composite.get(key)
        try:
            anchors.append((float(val), float(pct)))
        except (TypeError, ValueError):
            ok = False
            break
    if not ok:
        return 50
    anchors.append((100.0, 100.0))
    # Same score keeps the higher percentile; enforce monotonic percentiles.
    by_score: dict[float, float] = {}
    for score, pct in sorted(anchors):
        by_score[score] = max(pct, by_score.get(score, 0.0))
    points = sorted(by_score.items())
    try:
        score = float(your_score)
    except (TypeError, ValueError):
        return 50
    running_min = 0.0
    prev_score, prev_pct = points[0]
    for cur_score, cur_pct in points[1:]:
        if score <= prev_score:
            return round(running_min)
        if score <= cur_score:
            span = cur_score - prev_score
            frac = 0.0 if span == 0 else (score - prev_score) / span
            return round(prev_pct + frac * (cur_pct - prev_pct))
        prev_score, prev_pct = cur_score, cur_pct
        running_min = cur_pct
    return round(running_min)


async def refresh_rollups(days: int = 90, db=None) -> dict:
    """Compute and persist one global rollup over the trailing window.

    Excludes INTERNAL_EMAILS + SELF_DOMAINS auditees. Empty corpora insert
    nothing (an empty rollup would poison /me reads). Returns {sample_size}.
    """
    from platform_api.services.audit_db import audit_db as default_db

    db = db or default_db
    await db.connect()
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            _CORPUS_QUERY, list(INTERNAL_EMAILS),
            list(SELF_DOMAINS), int(days))

        sample_size = len(rows)
        if sample_size == 0:
            return {"sample_size": 0}

        # Defense-in-depth: re-apply exclusions in Python so a founder row
        # never inflates aggregates even if the SQL filter regresses (D5).
        kept = []
        for r in rows:
            email = (r["email"] or "").strip().lower()
            domain = email.rsplit("@", 1)[-1] if "@" in email else ""
            if email in INTERNAL_EMAILS or domain in SELF_DOMAINS:
                continue
            kept.append(r)
        rows = kept
        sample_size = len(rows)
        if sample_size == 0:
            return {"sample_size": 0}

        scores = sorted(float(r["score"]) for r in rows)
        composite = {
            "p25": round(_percentile(scores, 25), 1),
            "p50": round(_percentile(scores, 50), 1),
            "p75": round(_percentile(scores, 75), 1),
            "p90": round(_percentile(scores, 90), 1),
        }

        acc: dict[str, dict] = {}
        for r in rows:
            for key, passed in extract_signal_map(r["engine_output"]).items():
                bucket = acc.setdefault(key, {"ok": 0, "n": 0})
                bucket["n"] += 1
                if passed:
                    bucket["ok"] += 1
        signals = {
            key: {"ok_rate": round(b["ok"] / b["n"], 4)}
            for key, b in sorted(acc.items())
        }

        await conn.fetchrow(
            """
            INSERT INTO benchmark_rollups
                (window_days, sample_size, composite, signals, segment)
            VALUES ($1, $2, $3, $4, 'global')
            RETURNING id
            """,
            int(days), sample_size,
            json.dumps(composite), json.dumps(signals))

    logger.info("benchmark rollup refreshed: window=%sd sample=%s",
                days, sample_size)
    return {"sample_size": sample_size}


async def latest_completed_audit_for_domain(
        email: str, domain: str, db=None) -> dict | None:
    """Owner's newest completed audit whose URL host belongs to domain."""
    from platform_api.services.audit_db import audit_db as default_db
    from platform_api.services.domains import registered_domain

    db = db or default_db
    await db.connect()
    label = domain.split(".")[0]
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, url, score, engine_output
            FROM audits
            WHERE email = $1 AND status = 'completed' AND url ILIKE $2
            ORDER BY created_at DESC LIMIT 200
            """,
            email.strip().lower(), f"%{label}%")
    for r in rows:
        if registered_domain(r["url"]) == domain:
            return dict(r)
    return None


async def latest_rollup(db=None, segment: str = "global") -> dict | None:
    """Newest rollup row for segment, jsonb fields coerced to dicts."""
    from platform_api.services.audit_db import audit_db as default_db

    db = db or default_db
    await db.connect()
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT computed_at, window_days, sample_size, composite, signals
            FROM benchmark_rollups
            WHERE segment = $1
            ORDER BY computed_at DESC LIMIT 1
            """,
            segment)
    if row is None:
        return None
    out = dict(row)
    out["composite"] = _coerce_jsonb(out["composite"])
    out["signals"] = _coerce_jsonb(out["signals"])
    return out
