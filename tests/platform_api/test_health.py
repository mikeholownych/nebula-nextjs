"""Test health and readiness endpoints."""

import pytest
from unittest.mock import MagicMock

from platform_api.main import app
import platform_api.main as main_module


@pytest.mark.asyncio
async def test_health_endpoint_works_without_settings(client):
    """Health endpoint should return 200 without any settings."""
    response = await client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "request_id" in data  # Should have request_id


@pytest.mark.asyncio
async def test_readyz_with_incomplete_settings(client, monkeypatch):
    """Readiness endpoint should return 503 with missing required settings."""
    incomplete = MagicMock()
    incomplete.ready.return_value = False
    incomplete.missing_required_settings.return_value = ["DATABASE_URL", "SECRET_KEY"]
    monkeypatch.setattr(main_module, "settings", incomplete)
    response = await client.get("/readyz")
    assert response.status_code == 503
    data = response.json()
    assert "code" in data
    assert "message" in data
    assert "request_id" in data
    # Should contain missing key names but not values
    assert "DATABASE_URL" in data["message"]
    assert "SECRET_KEY" in data["message"]
    assert "postgresql://" not in data["message"]


@pytest.mark.asyncio
async def test_readyz_with_complete_test_settings(client, monkeypatch):
    """Readiness endpoint should return 200 with complete test settings."""
    complete = MagicMock()
    complete.ready.return_value = True
    monkeypatch.setattr(main_module, "settings", complete)
    response = await client.get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


@pytest.mark.asyncio
async def test_readyz_503_when_runner_not_started(client, monkeypatch):
    complete = MagicMock()
    complete.ready.return_value = True
    monkeypatch.setattr(main_module, "settings", complete)
    monkeypatch.setattr("platform_api.services.audit_runner._started", False)
    response = await client.get("/readyz")
    assert response.status_code == 503
    assert "runner" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_error_envelope_on_404(client):
    """404 endpoints should return error envelope."""
    response = await client.get("/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "code" in data
    assert "message" in data
    assert "request_id" in data
    # No stack traces in production


@pytest.mark.asyncio
async def test_request_id_header_present(client):
    """Request ID should be echoed in X-Request-ID header."""
    response = await client.get("/healthz")
    assert "X-Request-ID" in response.headers
    request_id = response.headers["X-Request-ID"]
    assert len(request_id) > 0
    # Should be in error envelope too
    data = response.json()
    assert data.get("request_id") == request_id


@pytest.mark.asyncio
async def test_json_body_limit_enforced(client):
    """Oversized JSON requests should return 413."""
    # Create a request body larger than configured limit
    oversized_body = {"data": "x" * 1024 * 1024}  # 1MB
    response = await client.post("/healthz", json=oversized_body)
    assert response.status_code == 413
    data = response.json()
    assert "code" in data
    assert "message" in data
    assert "request_id" in data


@pytest.mark.asyncio
async def test_health_deep_postgres_down_returns_503(client, monkeypatch):
    """Postgres probe failure must fail closed with HTTP 503."""
    from unittest.mock import AsyncMock

    redis = MagicMock()
    redis.connect = AsyncMock(return_value=None)
    redis.ping = AsyncMock(return_value=True)
    monkeypatch.setattr("platform_api.infra.health.redis_client", redis)

    audit = MagicMock()
    audit.connect = AsyncMock(side_effect=RuntimeError("postgres down"))
    audit.pool = MagicMock()
    monkeypatch.setattr("platform_api.infra.health.audit_db", audit)

    response = await client.get("/health/deep")
    assert response.status_code == 503
    data = response.json()
    assert data["components"]["postgres"]["status"] == "error"
    assert "postgresql://" not in str(data)


@pytest.mark.asyncio
async def test_health_deep_redis_failure_does_not_503(client, monkeypatch):
    """Redis failure degrades the component without failing overall readiness."""
    from datetime import datetime, timezone
    from unittest.mock import AsyncMock

    redis = MagicMock()
    redis.connect = AsyncMock(side_effect=RuntimeError("redis down"))
    monkeypatch.setattr("platform_api.infra.health.redis_client", redis)

    conn = MagicMock()
    conn.fetchval = AsyncMock(side_effect=[1, datetime.now(timezone.utc)])
    acquire_cm = MagicMock()
    acquire_cm.__aenter__ = AsyncMock(return_value=conn)
    acquire_cm.__aexit__ = AsyncMock(return_value=None)

    pool = MagicMock()
    pool.acquire.return_value = acquire_cm

    audit = MagicMock()
    audit.connect = AsyncMock(return_value=None)
    audit.pool = pool
    monkeypatch.setattr("platform_api.infra.health.audit_db", audit)

    response = await client.get("/health/deep")
    assert response.status_code == 200
    data = response.json()
    assert data["components"]["redis"]["status"] in ("degraded", "error")
    assert data["components"]["postgres"]["status"] == "ok"
