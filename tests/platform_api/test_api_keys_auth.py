from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from platform_api.auth.routes import get_current_user
from platform_api.db import get_session
from platform_api.redis_client import get_redis
from platform_api.routes.api_key_routes import router as api_key_router


@pytest.fixture
def app():
    app = FastAPI()
    app.include_router(api_key_router)
    app.dependency_overrides[get_redis] = lambda: AsyncMock()
    app.dependency_overrides[get_session] = lambda: MagicMock()
    return app


@pytest.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_list_api_keys_rejects_query_email_without_jwt(client):
    response = await client.get("/workspace/api-keys?email=victim@example.com")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_api_key_ignores_body_email_without_jwt(client):
    response = await client.post(
        "/workspace/api-keys",
        json={"email": "victim@example.com", "label": "stolen"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_api_keys_uses_jwt_email_not_query_email(app, client):
    user = MagicMock()
    user.email = "owner@example.com"
    app.dependency_overrides[get_current_user] = lambda: {
        "user": user,
        "user_id": "u1",
        "org_id": None,
        "session_id": "s1",
    }

    from unittest.mock import patch

    with patch(
        "platform_api.routes.api_key_routes.api_key_service.list_keys",
        new=AsyncMock(return_value=[]),
    ) as list_keys, patch(
        "platform_api.routes.api_key_routes._resolve_plan",
        new=AsyncMock(return_value="free"),
    ):
        response = await client.get("/workspace/api-keys?email=victim@example.com")

    assert response.status_code == 200
    list_keys.assert_awaited_once_with("owner@example.com")


def test_resolve_plan_uses_platform_db_not_audit_subscriptions():
    import inspect

    from platform_api.routes import api_key_routes

    source = inspect.getsource(api_key_routes._resolve_plan)
    assert "audit_db" not in source
    assert "session_scope" in source
    assert "nebula_audit" not in source
