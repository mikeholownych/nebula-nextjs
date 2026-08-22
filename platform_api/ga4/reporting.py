"""GA4 Data API reporting client (Phase 2).

Aggregate-only pulls: landing-page sessions + key events for explicit date
windows. Cached in Redis (6h TTL); a lightweight Redis-backed breaker stops
hammering Google during outages. No user-level dimensions ever requested.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import date, timedelta

import httpx

logger = logging.getLogger(__name__)

DATA_API_URL = "https://analyticsdata.googleapis.com/v1beta/{property}:runReport"
CACHE_TTL_SECONDS = 6 * 3600
BREAKER_THRESHOLD = 5
BREAKER_OPEN_SECONDS = 60


def _cache_key(property_id: str, path: str, start: str, end: str) -> str:
    digest = hashlib.sha256(f"{property_id}|{path}|{start}|{end}".encode()).hexdigest()[:16]
    return f"ga4:report:{digest}"


async def _breaker_open(redis) -> bool:
    return bool(await redis.get("ga4:breaker:open_until")) and float(
        await redis.get("ga4:breaker:open_until") or 0
    ) > time.time()


async def _breaker_record_failure(redis) -> None:
    count = int(await redis.incr("ga4:breaker:failures") or 0)
    await redis.expire("ga4:breaker:failures", 3600)
    if count >= BREAKER_THRESHOLD:
        await redis.set(
            "ga4:breaker:open_until",
            str(time.time() + BREAKER_OPEN_SECONDS),
            ttl=BREAKER_OPEN_SECONDS,
        )
        logger.warning("[ga4] breaker OPEN for %ss", BREAKER_OPEN_SECONDS)


async def run_landing_page_report(
    redis,
    access_token: str,
    property_id: str,
    path: str,
    start: date,
    end: date,
) -> dict:
    """Return {'sessions': int, 'key_events': int} filtered to landing path.

    path must include the leading '/'; query strings are matched by prefix.
    """
    key = _cache_key(property_id, path, start.isoformat(), end.isoformat())
    cached = await redis.get(key)
    if cached:
        return cached

    if await _breaker_open(redis):
        raise RuntimeError("GA4 reporting temporarily unavailable (breaker open)")

    body = {
        "dateRanges": [{"startDate": start.isoformat(), "endDate": end.isoformat()}],
        "dimensions": [{"name": "landingPagePlusQueryString"}],
        "metrics": [
            {"name": "sessions"},
            {"name": "keyEvents"},
        ],
        "dimensionFilter": {
            "filter": {
                "fieldName": "landingPagePlusQueryString",
                "stringFilter": {"matchType": "BEGINS_WITH", "value": path},
            }
        },
        "limit": 100,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                DATA_API_URL.format(property=property_id),
                json=body,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code in (401, 403):
            resp.raise_for_status()
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        await _breaker_record_failure(redis)
        raise RuntimeError(f"GA4 report failed: {exc}") from exc

    await redis.delete("ga4:breaker:failures")
    rows = resp.json().get("rows", [])
    sessions = sum(int(r["metricValues"][0]["value"]) for r in rows)
    key_events = sum(int(float(r["metricValues"][1]["value"])) for r in rows)

    result = {"sessions": sessions, "key_events": key_events}
    await redis.set(key, result, ttl=CACHE_TTL_SECONDS)
    return result


def normalize_window(raw: dict) -> dict:
    """Attach conversion rate; zero-session windows report rate=None."""
    sessions = raw.get("sessions", 0)
    events = raw.get("key_events", 0)
    rate = round(events / sessions * 100, 3) if sessions else None
    return {**raw, "conversion_rate_pct": rate}


def compute_deltas(baseline: dict, post: dict) -> dict:
    """Sessions-normalized conversion delta + raw session delta."""

    def pct(new: float | None, old: float | None) -> float | None:
        if old in (None, 0) or new is None:
            return None
        return round((new - old) / old * 100, 1)

    b_rate = baseline.get("conversion_rate_pct")
    p_rate = post.get("conversion_rate_pct")
    conv_delta = (
        pct(p_rate, b_rate) if (b_rate not in (None, 0) and p_rate is not None) else None
    )
    return {
        "conversions_change_pct": conv_delta,
        "sessions_change_pct": pct(post["sessions"], baseline["sessions"]),
        "sample_note": (
            "small sample - treat directionally"
            if (baseline["sessions"] or 0) < 100 or (post["sessions"] or 0) < 100
            else None
        ),
    }


def window_dates(anchor: date, days: int = 14) -> tuple[tuple[date, date], tuple[date, date]]:
    """(pre window, post window): [anchor-days, anchor) and [anchor, anchor+days)."""
    pre = (anchor - timedelta(days=days), anchor - timedelta(days=1))
    post = (anchor, anchor + timedelta(days=days))
    return pre, post
