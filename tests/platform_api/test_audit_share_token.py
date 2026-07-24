"""Test the audit share-token generation and validation endpoints.

These were missing entirely — the share_token column existed in the
nebula_audit schema, and the frontend "Share this report" button called
GET /audit/{id}/share-token, but no such route (or AuditDB method) was
ever implemented, so the button always failed with a 404.
"""
from uuid import UUID, uuid4
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport

from platform_api.main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_share_token_endpoint_generates_and_returns_a_token(client):
    audit_id = str(uuid4())
    with patch(
        "platform_api.routes.audit_api.audit_db.get_or_create_share_token",
        new=AsyncMock(return_value="abc123token"),
    ) as mock_get_or_create:
        response = await client.get(f"/audit/{audit_id}/share-token")

    assert response.status_code == 200
    assert response.json() == {"share_token": "abc123token"}
    mock_get_or_create.assert_awaited_once()
    assert mock_get_or_create.call_args[0][0] == UUID(audit_id)


@pytest.mark.asyncio
async def test_share_token_endpoint_404s_for_unknown_audit(client):
    audit_id = str(uuid4())
    with patch(
        "platform_api.routes.audit_api.audit_db.get_or_create_share_token",
        new=AsyncMock(return_value=None),
    ):
        response = await client.get(f"/audit/{audit_id}/share-token")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_share_token_endpoint_rejects_malformed_id(client):
    response = await client.get("/audit/not-a-uuid/share-token")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_audit_with_valid_share_token_returns_the_audit(client):
    audit_id = str(uuid4())
    audit_payload = {
        "audit_id": audit_id, "url": "https://example.com", "status": "completed",
        "score": 7.4, "grade": "B", "findings": [],
    }
    with patch(
        "platform_api.routes.audit_api.audit_db.get_audit_by_share_token",
        new=AsyncMock(return_value=audit_payload),
    ) as mock_lookup:
        response = await client.get(f"/audit/{audit_id}?share=real-token-value")

    assert response.status_code == 200
    assert response.json()["audit_id"] == audit_id
    mock_lookup.assert_awaited_once_with("real-token-value")


@pytest.mark.asyncio
async def test_get_audit_with_wrong_share_token_returns_404(client):
    audit_id = str(uuid4())
    with patch(
        "platform_api.routes.audit_api.audit_db.get_audit_by_share_token",
        new=AsyncMock(return_value=None),
    ):
        response = await client.get(f"/audit/{audit_id}?share=wrong-token")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_audit_with_share_token_for_a_different_audit_id_returns_404(client):
    """A real, valid share token — but for a *different* audit than the one
    in the URL path — must not unlock this audit_id."""
    audit_id = str(uuid4())
    other_audit_id = str(uuid4())
    audit_payload = {"audit_id": other_audit_id, "url": "https://other.example"}
    with patch(
        "platform_api.routes.audit_api.audit_db.get_audit_by_share_token",
        new=AsyncMock(return_value=audit_payload),
    ):
        response = await client.get(f"/audit/{audit_id}?share=valid-but-mismatched")

    assert response.status_code == 404
