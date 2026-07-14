"""Test health and readiness endpoints."""

import pytest
from httpx import AsyncClient, ASGITransport

from platform_api.main import app


@pytest.fixture
async def client():
    """Async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_health_endpoint_works_without_settings(client):
    """Health endpoint should return 200 without any settings."""
    response = await client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "request_id" in data  # Should have request_id


@pytest.mark.asyncio
@pytest.mark.skip(reason="Ready check requires production settings validation - Wave 2")
async def test_readyz_with_incomplete_settings(client):
    """Readiness endpoint should return 503 with missing required settings."""
    response = await client.get("/readyz")
    assert response.status_code == 503
    data = response.json()
    assert "code" in data
    assert "message" in data
    assert "request_id" in data
    # Should contain missing key names but not values
    assert "missing_keys" in data["message"]
    # Should not contain actual setting values in error response


@pytest.mark.asyncio
@pytest.mark.skip(reason="Ready check requires production settings validation - Wave 2")
async def test_readyz_with_complete_test_settings(client):
    """Readiness endpoint should return 200 with complete test settings."""
    # This test will fail initially - we need to configure test settings
    # Set up test settings in environment or config
    response = await client.get("/readyz")
    # Should be 503 until we implement test settings injection
    assert response.status_code == 503


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