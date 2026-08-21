from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.main import app

CHECKOUT_SOURCE = Path("platform_api/routes/checkout.py").read_text()


@pytest.mark.asyncio
async def test_fastapi_checkout_is_gone_in_favor_of_portal_bff():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/checkout",
            json={
                "email": "founder@example.com",
                "audit_id": "123e4567-e89b-12d3-a456-426614174000",
                "url": "https://example.com",
            },
        )
    assert response.status_code == 410


@pytest.mark.asyncio
async def test_fastapi_checkout_gone_without_request_body():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/checkout")
    assert response.status_code == 410


def test_fastapi_checkout_stub_has_no_stripe_client_or_shop_urls():
    lowered = CHECKOUT_SOURCE.lower()
    assert "api.stripe.com" not in lowered
    assert "stripe_secret_key" not in lowered
    assert "urllib.request" not in CHECKOUT_SOURCE
    assert "nebulacomponents.shop" not in lowered
    assert "class CheckoutRequest" not in CHECKOUT_SOURCE
