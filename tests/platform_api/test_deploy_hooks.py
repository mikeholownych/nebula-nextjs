"""Deploy webhook gates: token auth, domain scoping, management session gate."""

import hashlib
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.main import app


def _mk_hook(email="owner@example.com", domains=None):
    from platform_api.db.models import DeployHook

    raw = "dhk_" + "A" * 32
    h = DeployHook(
        id=uuid.uuid4(),
        workspace_email=email,
        token_hash=hashlib.sha256(raw.encode()).hexdigest(),
        token_prefix=raw[:8],
        domains=domains or ["example.com"],
    )
    return raw, h


@pytest.fixture(autouse=True)
def _stub_session():
    from platform_api.db import get_session

    app.dependency_overrides[get_session] = lambda: MagicMock()
    yield
    app.dependency_overrides.pop(get_session, None)


def _override_user(email="owner@example.com"):
    from platform_api.auth.routes import get_current_user

    u = MagicMock()
    u.email = email
    ctx = {"user": u, "user_id": str(uuid.uuid4())}
    app.dependency_overrides[get_current_user] = lambda: ctx
    return ctx


@pytest.mark.asyncio
async def test_webhook_unknown_token_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        r = await c.post("/hooks/deploy/dhk_doesnotexist", json={"domain": "example.com"})
        assert r.status_code == 404


@pytest.mark.asyncio
async def test_unregistered_domain_hidden(monkeypatch):
    raw, hook = _mk_hook(domains=["example.com"])
    from platform_api.db import get_session
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = hook
    app.dependency_overrides[get_session] = lambda: mock_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        r = await c.post(f"/hooks/deploy/{raw}", json={"domain": "evil.com"})
        assert r.status_code == 404  # existence-hiding


@pytest.mark.asyncio
async def test_registered_domain_runs_verification(monkeypatch):
    raw, hook = _mk_hook(domains=["example.com"])
    from platform_api.db import get_session
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = hook
    app.dependency_overrides[get_session] = lambda: mock_db
    monkeypatch.setattr(
        "platform_api.routes.verify_api.run_domain_verification",
        AsyncMock(return_value={"domain": "example.com", "checked": 2, "results": []}),
    )
    # route imports run_domain_verification at module import; patch there too
    monkeypatch.setattr(
        "platform_api.routes.deploy_hook_routes.run_domain_verification",
        AsyncMock(return_value={"domain": "example.com", "checked": 2, "results": []}),
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        r = await c.post(f"/hooks/deploy/{raw}", json={"domain": "example.com"})
        assert r.status_code == 200
        assert r.json()["checked"] == 2


@pytest.mark.asyncio
async def test_management_requires_session():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        for method, path in [("GET", "/api/hooks/deploy"), ("POST", "/api/hooks/deploy")]:
            r = await c.request(method, path, json={"domains": ["x.com"]})
            assert r.status_code == 401
