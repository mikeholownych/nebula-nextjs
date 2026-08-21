import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.main import app


@pytest.mark.asyncio
async def test_stripe_webhook_returns_503_when_secret_missing(monkeypatch):
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    monkeypatch.setattr("platform_api.routes.stripe_webhook._STRIPE_SECRET", "", raising=False)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/stripe/webhook",
            content=b'{"type":"charge.succeeded"}',
            headers={"stripe-signature": "t=1,v1=abc"},
        )

    assert response.status_code == 503
