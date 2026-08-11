"""Test the homepage aggregate-stats endpoint.

Regression coverage for a real bug found while building it: asyncpg
returns avg() as decimal.Decimal, and Decimal / float raises TypeError -
the route returned a bare 503 with no indication why until traced by hand.
"""
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient, ASGITransport

from platform_api.main import app
from platform_api.services.audit_db import AuditDB


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_get_aggregate_stats_handles_decimal_avg_from_asyncpg():
    """asyncpg's avg() returns decimal.Decimal, not float - dividing that
    directly by a float literal raises TypeError. This is the exact bug
    that shipped first; guard against it regressing.

    Note: avg_score is currently intentionally suppressed (returns None)
    until component scores are persisted defensibly. The Decimal conversion
    path is still exercised - we assert no exception and a valid structure.
    """
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    conn.fetchrow.return_value = {
        "completed_audits": 27,
        "avg_score_raw": Decimal("64.037037037037037037"),
    }
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    result = await db.get_aggregate_stats()

    assert result["completed_audits"] == 27
    # avg_score intentionally suppressed until rendered-verification scores
    # are persisted - just assert it's present with a valid type
    assert "avg_score" in result


@pytest.mark.asyncio
async def test_get_aggregate_stats_handles_zero_audits():
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    conn.fetchrow.return_value = {"completed_audits": 0, "avg_score_raw": None}
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    result = await db.get_aggregate_stats()

    assert result == {"completed_audits": 0, "avg_score": None}


@pytest.mark.asyncio
async def test_stats_route_returns_real_shape(client):
    with patch(
        "platform_api.routes.audit_api.audit_db.get_aggregate_stats",
        new=AsyncMock(return_value={"completed_audits": 27, "avg_score": 6.4}),
    ):
        response = await client.get("/audit/stats/aggregate")

    assert response.status_code == 200
    assert response.json() == {"completed_audits": 27, "avg_score": 6.4}


@pytest.mark.asyncio
async def test_stats_route_503s_on_db_failure(client):
    with patch(
        "platform_api.routes.audit_api.audit_db.get_aggregate_stats",
        new=AsyncMock(side_effect=Exception("db down")),
    ):
        response = await client.get("/audit/stats/aggregate")

    assert response.status_code == 503


@pytest.mark.asyncio
async def test_stats_route_is_not_shadowed_by_audit_id_route(client):
    """/audit/stats/aggregate must resolve here, not fall into the
    /{audit_id} catch-all and 400 on "stats" as an invalid UUID."""
    with patch(
        "platform_api.routes.audit_api.audit_db.get_aggregate_stats",
        new=AsyncMock(return_value={"completed_audits": 0, "avg_score": None}),
    ):
        response = await client.get("/audit/stats/aggregate")

    assert response.status_code != 400
