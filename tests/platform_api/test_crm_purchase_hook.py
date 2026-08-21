from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.main import app


@pytest.mark.asyncio
async def test_crm_purchase_hook_requires_internal_secret(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_SECRET", "s3cret")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/crm/purchase-completed",
            json={
                "email": "buyer@example.com",
                "amount_cents": 9700,
                "product_type": "fix_pack",
                "audit_id": "123e4567-e89b-12d3-a456-426614174000",
                "audit_url": "https://example.com",
            },
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_crm_purchase_hook_fail_closed_without_secret(monkeypatch):
    monkeypatch.delenv("INTERNAL_API_SECRET", raising=False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/crm/purchase-completed",
            json={
                "email": "buyer@example.com",
                "amount_cents": 9700,
            },
            headers={"Authorization": "Bearer anything"},
        )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_crm_purchase_hook_invokes_crm_without_delivery(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_SECRET", "s3cret")
    hook = AsyncMock()
    monkeypatch.setattr("platform_api.routes.crm.purchase_completed", hook)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/crm/purchase-completed",
            json={
                "email": "buyer@example.com",
                "amount_cents": 9700,
                "product_type": "fix_pack",
                "stripe_payment_intent_id": "pi_test",
                "audit_id": "123e4567-e89b-12d3-a456-426614174000",
                "audit_url": "https://example.com/landing",
            },
            headers={"Authorization": "Bearer s3cret"},
        )

    assert response.status_code == 200
    hook.assert_awaited_once()
    kwargs = hook.await_args.kwargs
    assert kwargs["email"] == "buyer@example.com"
    assert kwargs["amount_cents"] == 9700
    assert kwargs.get("trigger_delivery") is False
