"""Test the before/after badge mechanism.

A badge documents one real event: a customer's score on a given URL
genuinely improved between their first audit and a later one. No fixed
pass bar — any real, positive delta qualifies (business decision, not a
default). Idempotent per (customer_id, url) via a DB unique constraint.
"""
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

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


def make_conn(audit_row, history_rows, insert_row):
    conn = AsyncMock()
    conn.fetchrow.side_effect = [audit_row, insert_row]
    conn.fetch = AsyncMock(return_value=history_rows)
    return conn


@pytest.mark.asyncio
async def test_no_badge_without_a_linked_customer():
    db = AuditDB()
    audit_id = uuid4()
    conn = AsyncMock()
    conn.fetchrow.return_value = {"customer_id": None, "url": "https://example.com"}

    result = await db.check_and_award_badge(conn, audit_id)

    assert result is None
    conn.fetch.assert_not_called()


@pytest.mark.asyncio
async def test_no_badge_with_only_one_completed_audit():
    db = AuditDB()
    audit_id = uuid4()
    customer_id = uuid4()
    conn = AsyncMock()
    conn.fetchrow.return_value = {"customer_id": customer_id, "url": "https://example.com"}
    conn.fetch.return_value = [{"id": audit_id, "score": 60, "created_at": datetime(2026, 7, 1)}]

    result = await db.check_and_award_badge(conn, audit_id)

    assert result is None


@pytest.mark.asyncio
async def test_no_badge_when_score_did_not_improve():
    db = AuditDB()
    audit_id = uuid4()
    customer_id = uuid4()
    conn = AsyncMock()
    conn.fetchrow.return_value = {"customer_id": customer_id, "url": "https://example.com"}
    conn.fetch.return_value = [
        {"id": uuid4(), "score": 70, "created_at": datetime(2026, 6, 1)},
        {"id": audit_id, "score": 65, "created_at": datetime(2026, 7, 1)},
    ]

    result = await db.check_and_award_badge(conn, audit_id)

    assert result is None
    # Only the audit-history fetch happened — no INSERT attempt.
    assert conn.fetchrow.call_count == 1


@pytest.mark.asyncio
async def test_badge_awarded_on_real_improvement():
    db = AuditDB()
    audit_id = uuid4()
    customer_id = uuid4()
    before_id, after_id = uuid4(), audit_id
    badge_id = uuid4()

    conn = AsyncMock()
    conn.fetchrow.side_effect = [
        {"customer_id": customer_id, "url": "https://example.com"},  # audit lookup
        {"id": badge_id, "serial_number": 7},  # INSERT ... RETURNING
    ]
    conn.fetch.return_value = [
        {"id": before_id, "score": 38, "created_at": datetime(2026, 6, 1)},
        {"id": after_id, "score": 61, "created_at": datetime(2026, 7, 1)},
    ]

    result = await db.check_and_award_badge(conn, audit_id)

    assert result == {"id": badge_id, "serial_number": 7}
    insert_call = conn.fetchrow.call_args_list[1]
    assert insert_call.args[0].strip().startswith("INSERT INTO badges")
    assert insert_call.args[1:] == (
        customer_id, "https://example.com", before_id, after_id, 38, 61, 2026
    )


@pytest.mark.asyncio
async def test_badge_award_is_idempotent_on_conflict():
    """ON CONFLICT DO NOTHING means a second award attempt for the same
    (customer_id, url) returns no row — not an error, not a duplicate."""
    db = AuditDB()
    audit_id = uuid4()
    customer_id = uuid4()
    conn = AsyncMock()
    conn.fetchrow.side_effect = [
        {"customer_id": customer_id, "url": "https://example.com"},
        None,  # ON CONFLICT DO NOTHING -> no RETURNING row
    ]
    conn.fetch.return_value = [
        {"id": uuid4(), "score": 38, "created_at": datetime(2026, 6, 1)},
        {"id": audit_id, "score": 61, "created_at": datetime(2026, 7, 1)},
    ]

    result = await db.check_and_award_badge(conn, audit_id)

    assert result is None


@pytest.mark.asyncio
async def test_update_audit_badge_check_failure_does_not_break_completion():
    """The audit UPDATE already succeeded by the time badge-check runs —
    a badge-check exception must never surface as an update_audit failure."""
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    conn.execute.return_value = 'UPDATE 1'
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    with patch.object(AuditDB, "check_and_award_badge", side_effect=Exception("boom")):
        result = await db.update_audit(uuid4(), 7.5, "B", [], status="completed")

    assert result is True


@pytest.mark.asyncio
async def test_badge_route_returns_real_shape(client):
    badge_id = str(uuid4())
    with patch(
        "platform_api.routes.audit_api.audit_db.get_badge",
        new=AsyncMock(return_value={
            "badge_id": badge_id,
            "url": "https://example.com",
            "serial_number": 7,
            "before_score": 3.8,
            "after_score": 6.1,
            "earned_year": 2026,
        }),
    ):
        response = await client.get(f"/audit/badge/{badge_id}")

    assert response.status_code == 200
    assert response.json()["serial_number"] == 7
    assert response.json()["before_score"] == 3.8
    assert response.json()["after_score"] == 6.1


@pytest.mark.asyncio
async def test_badge_route_404s_for_unknown_badge(client):
    with patch(
        "platform_api.routes.audit_api.audit_db.get_badge",
        new=AsyncMock(return_value=None),
    ):
        response = await client.get(f"/audit/badge/{uuid4()}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_badge_route_rejects_malformed_id(client):
    response = await client.get("/audit/badge/not-a-uuid")
    assert response.status_code == 400
