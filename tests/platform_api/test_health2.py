"""Test health and readiness endpoints."""

import pytest
from httpx import AsyncClient

from platform_api.main import app


@pytest.mark.asyncio
async def test_health_endpoint_works_without_settings():
    """Health endpoint should return 200 without any settings."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data == {"status": "ok"}


@pytest.mark.asyncio
async def test_readyz_with_incomplete_settings():
    """Readiness endpoint should return 503 with missing required settings."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/readyz")
        assert response.status_code == 503
        data = response.json()
        assert "code" in data
        assert "message" in data
        assert "request_id" in data
        # Should contain missing key names but not values
        assert "missing" in data["message"].lower()


@pytest.mark.asyncio
async def test_error_envelope_on_404():
    """404 endpoints should return error envelope."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/nonexistent")
        assert response.status_code == 404
        data = response.json()
        assert "code" in data
        assert "message" in data
        assert "request_id" in data


@pytest.mark.asyncio
async def test_request_id_header_present():
    """Request ID should be echoed in X-Request-ID header."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/healthz")
        assert "X-Request-ID" in response.headers
        request_id = response.headers["X-Request-ID"]
        assert len(request_id) > 0