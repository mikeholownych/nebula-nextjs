from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.main import app
from platform_api.services.audit_db import audit_db


class _FakeConn:
    def __init__(self, sql_sink):
        self.sql_sink = sql_sink

    async def fetchrow(self, sql, email):
        self.sql_sink["sql"] = sql
        self.sql_sink["email"] = email
        return {"cnt": 3}

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False


class _FakePool:
    def __init__(self, sql_sink):
        self.sql_sink = sql_sink

    def acquire(self):
        return _FakeConn(self.sql_sink)


@pytest.mark.asyncio
async def test_count_completed_this_month_sql_uses_audit_status(monkeypatch):
    captured = {}
    monkeypatch.setattr(audit_db, "connect", AsyncMock())
    monkeypatch.setattr(audit_db, "pool", _FakePool(captured))

    count = await audit_db.count_completed_this_month("Founder@Example.com")

    assert count == 3
    assert captured["email"] == "founder@example.com"
    assert "status = 'completed'" in captured["sql"]
    assert "date_trunc('month'" in captured["sql"]


@pytest.mark.asyncio
async def test_audit_quota_endpoint_requires_internal_service(monkeypatch):
    """SEC-P0-1 regression: /audit/quota is INTERNAL_SERVICE, not anonymous."""
    monkeypatch.setenv("INTERNAL_API_SECRET", "test-internal-secret")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        anon = await client.get("/audit/quota", params={"email": "founder@example.com"})
        assert anon.status_code in (401, 403)
        wrong = await client.get(
            "/audit/quota",
            params={"email": "founder@example.com"},
            headers={"Authorization": "Bearer wrong-secret"},
        )
        assert wrong.status_code == 401


@pytest.mark.asyncio
async def test_audit_quota_endpoint_returns_completed_count(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_SECRET", "test-internal-secret")
    monkeypatch.setattr(
        audit_db,
        "count_completed_this_month",
        AsyncMock(return_value=2),
    )
    headers = {"Authorization": "Bearer test-internal-secret"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/audit/quota", params={"email": "founder@example.com"}, headers=headers
        )

    assert response.status_code == 200
    body = response.json()
    assert body["completed_this_month"] == 2
    audit_db.count_completed_this_month.assert_awaited_once()
