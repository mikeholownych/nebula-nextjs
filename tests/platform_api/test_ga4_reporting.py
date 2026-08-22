"""Phase-2 GA4 reporting gates: window math, deltas, tenant binding."""

from datetime import date, timedelta

import pytest

from platform_api.ga4.reporting import compute_deltas, normalize_window, window_dates


def test_windows_anchor_correctly():
    anchor = date(2026, 8, 22)
    pre, post = window_dates(anchor, days=14)
    assert pre == (date(2026, 8, 8), date(2026, 8, 21))
    assert post == (date(2026, 8, 22), date(2026, 9, 5))


def test_normalize_zero_sessions_is_none_not_nan():
    assert normalize_window({"sessions": 0, "key_events": 0})["conversion_rate_pct"] is None
    assert normalize_window({"sessions": 100, "key_events": 3})["conversion_rate_pct"] == 3.0


def test_deltas_sessions_normalized_and_small_sample_note():
    b = {"sessions": 50, "key_events": 1, "conversion_rate_pct": 2.0}
    p = {"sessions": 60, "key_events": 3, "conversion_rate_pct": 5.0}
    d = compute_deltas(b, p)
    assert d["conversions_change_pct"] == 150.0
    assert d["sample_note"] is not None  # <100 sessions


def test_deltas_none_when_baseline_has_no_traffic():
    b = {"sessions": 0, "key_events": 0, "conversion_rate_pct": None}
    p = {"sessions": 60, "key_events": 3, "conversion_rate_pct": 5.0}
    assert compute_deltas(b, p)["conversions_change_pct"] is None


@pytest.mark.asyncio
async def test_correlation_requires_session_with_db_stub():
    from httpx import ASGITransport, AsyncClient
    from platform_api.db import get_session
    from platform_api.main import app

    app.dependency_overrides[get_session] = lambda: iter([None])
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
            r = await c.get(
                "/api/ga4/correlation/00000000-0000-0000-0000-000000000001"
            )
            assert r.status_code == 401
    finally:
        app.dependency_overrides.pop(get_session, None)
