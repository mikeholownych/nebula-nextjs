import ast
import inspect
from pathlib import Path
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.main import app
from platform_api.routes import audit_api


def _async_defs_in(path: Path):
    tree = ast.parse(path.read_text())
    return [
        node
        for node in tree.body
        if isinstance(node, ast.AsyncFunctionDef)
    ] + [
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef)
        for node in node.body
        if isinstance(node, ast.AsyncFunctionDef)
    ]


def test_audit_http_handlers_do_not_subprocess_run():
    path = Path(inspect.getsourcefile(audit_api))
    tree = ast.parse(path.read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef):
            src = ast.get_source_segment(path.read_text(), node) or ""
            assert "subprocess.run" not in src, f"{node.name} calls subprocess.run"


@pytest.mark.asyncio
async def test_accept_503_when_runner_not_started(monkeypatch):
    monkeypatch.setattr("platform_api.services.audit_runner._started", False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/audit/accept",
            json={"url": "https://example.com", "email": "founder@example.com"},
        )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_accept_persists_pending_and_returns_audit_id(monkeypatch):
    audit_id = uuid4()
    monkeypatch.setattr(audit_api.audit_db, "create_audit", AsyncMock(return_value=audit_id))
    kick = AsyncMock()
    monkeypatch.setattr("platform_api.services.audit_runner.kick", kick)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/audit/accept",
            json={"url": "https://example.com", "email": "founder@example.com"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["audit_id"] == str(audit_id)
    assert body["status"] == "pending"
    assert body["url"] == "https://example.com"
    audit_api.audit_db.create_audit.assert_awaited()
    kick.assert_awaited()


@pytest.mark.asyncio
async def test_accept_dedupes_same_analytics_attempt_id(monkeypatch):
    audit_id = uuid4()
    created = {"n": 0}

    async def fake_find(attempt_id):
        if created["n"] == 0:
            return None
        return {
            "id": audit_id,
            "url": "https://example.com",
            "status": "pending",
            "email": "founder@example.com",
        }

    async def fake_create(**_kwargs):
        created["n"] += 1
        return audit_id

    monkeypatch.setattr(audit_api.audit_db, "find_open_by_attempt_id", fake_find)
    monkeypatch.setattr(audit_api.audit_db, "create_audit", fake_create)
    monkeypatch.setattr("platform_api.services.audit_runner.kick", AsyncMock())

    payload = {
        "url": "https://example.com",
        "email": "founder@example.com",
        "analytics_attempt_id": "attempt-retry-1",
    }
    headers = {
        "X-Forwarded-For": "10.9.9.9",
        "X-Audit-Email": "founder@example.com",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        first = await client.post("/audit/accept", json=payload, headers=headers)
        second = await client.post("/audit/accept", json=payload, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["audit_id"] == str(audit_id)
    assert second.json()["audit_id"] == str(audit_id)
    assert first.json()["status"] in ("pending", "running")
    assert second.json()["status"] in ("pending", "running")
    assert created["n"] == 1


def test_find_open_by_attempt_id_sql_scopes_pending_running():
    from platform_api.services.audit_db import AuditDB

    source = inspect.getsource(AuditDB.find_open_by_attempt_id)
    assert "analytics_attempt_id" in source
    assert "pending" in source
    assert "running" in source


def test_deploy_script_refuses_next_restart_without_accept_route():
    source = Path(__file__).resolve().parents[2].joinpath("scripts/deploy_customer_portal.sh").read_text()
    assert "openapi.json" not in source
    assert "/audit/accept" in source
    assert "systemctl restart" in source
    assert "404" in source


@pytest.mark.asyncio
async def test_run_wait_path_does_not_call_subprocess(monkeypatch):
    audit_id = uuid4()
    monkeypatch.setattr(audit_api.audit_db, "create_audit", AsyncMock(return_value=audit_id))
    monkeypatch.setattr("platform_api.services.audit_runner.kick", AsyncMock())
    monkeypatch.setattr(
        "platform_api.services.audit_runner.wait_for_result",
        AsyncMock(return_value={
            "audit_id": str(audit_id),
            "url": "https://example.com",
            "status": "completed",
            "score": 8.0,
            "grade": "B",
            "findings": [],
        }),
    )
    subprocess_run = AsyncMock()
    monkeypatch.setattr(audit_api, "subprocess", type("S", (), {"run": subprocess_run}), raising=False)

    result = await audit_api.run_audit(audit_api.AuditRequest(url="https://example.com"))

    assert result.status == "completed"
    assert result.audit_id == str(audit_id)
    assert not getattr(subprocess_run, "called", False)
