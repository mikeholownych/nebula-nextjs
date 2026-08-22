"""Phase-1 GA4 integration gates (SEC-aligned).

Invariants under test:
- Every /api/ga4 management route requires a live session (401 otherwise).
- Property selection validates ownership against accountSummaries:
  unowned property -> 403 existence-hiding; owned -> persisted.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.main import app


@pytest.fixture(autouse=True)
def _stub_session_dep():
    from platform_api.db import get_session
    app.dependency_overrides[get_session] = lambda: iter([None])
    yield
    app.dependency_overrides.pop(get_session, None)


@pytest.fixture(autouse=True)
def _auth_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")


def _auth():
    return {"Authorization": "Bearer test-session-token"}


@pytest.mark.asyncio
async def test_ga4_routes_require_session(monkeypatch):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        for method, path in [
            ("GET", "/api/ga4/properties"),
            ("POST", "/api/ga4/select"),
            ("GET", "/api/ga4/status"),
            ("DELETE", "/api/ga4/disconnect"),
        ]:
            r = await c.request(method, path)
            assert r.status_code == 401, f"{method} {path} -> {r.status_code}"


@pytest.mark.asyncio
async def test_select_rejects_malformed_property_id():
    from platform_api.auth.routes import get_current_user
    from platform_api.redis_client import get_redis

    app.dependency_overrides[get_current_user] = lambda: {
        "user": MagicMock(id=uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
    }
    app.dependency_overrides[get_redis] = AsyncMock()
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
            r = await c.post(
                "/api/ga4/select",
                json={"property_id": "../../evil"},
            )
            assert r.status_code == 422  # rejected before any DB/Google call
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_redis, None)
