from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from platform_api.routes import audit_api
from platform_api.services import audit_engine, audit_runner


def test_score_via_cli_passes_hostile_url_as_literal_argv(monkeypatch):
    calls = []

    def fake_run(cmd, **kwargs):
        calls.append((cmd, kwargs))
        return SimpleNamespace(
            returncode=0,
            stdout='{"score": 5, "grade": "C", "findings": []}\n',
            stderr="",
        )

    monkeypatch.setattr(audit_engine.subprocess, "run", fake_run)
    hostile = 'https://example.com/"; touch /tmp/nebula-pwned; #'
    job = {"url": hostile, "email": "anon@invalid.nebulacomponents.com"}

    result = audit_engine.score_via_cli(job)

    cmd, kwargs = calls[0]
    assert cmd[2] == hostile
    assert kwargs.get("shell") is not True
    assert result["score"] == 5


@pytest.mark.asyncio
async def test_blocked_email_is_not_marked_sent(monkeypatch):
    mark_sent = AsyncMock()
    monkeypatch.setattr(
        audit_api.email_service,
        "send_audit_results",
        AsyncMock(return_value={"status": "failed", "error": "outreach_disabled"}),
    )
    monkeypatch.setattr(audit_api.audit_db, "mark_email_sent", mark_sent)
    monkeypatch.setattr(audit_api.analytics, "track_audit_completed", AsyncMock())
    monkeypatch.setattr(audit_api, "get_posthog", lambda: None)
    monkeypatch.setattr(audit_api, "_crm_audit_completed", AsyncMock())
    monkeypatch.setattr(audit_api, "trigger_track_assignment", lambda **kw: None)

    job = {
        "id": uuid4(),
        "email": "customer@company.com",
        "url": "https://company.com",
        "name": "Customer",
    }
    data = {"score": 5, "grade": "C", "findings": [{"key": "f1"}]}

    await audit_api.finalize_completed_audit(job, data)

    # Let fire-and-forget task execute
    import asyncio
    await asyncio.sleep(0.01)
    mark_sent.assert_not_awaited()


@pytest.mark.asyncio
async def test_successful_email_is_marked_sent(monkeypatch):
    audit_id = uuid4()
    mark_sent = AsyncMock(return_value=True)
    monkeypatch.setattr(
        audit_api.email_service,
        "send_audit_results",
        AsyncMock(return_value={"status": "sent", "message_id": "msg-1"}),
    )
    monkeypatch.setattr(audit_api.audit_db, "mark_email_sent", mark_sent)
    monkeypatch.setattr(audit_api.analytics, "track_audit_completed", AsyncMock())
    monkeypatch.setattr(audit_api, "get_posthog", lambda: None)
    monkeypatch.setattr(audit_api, "_crm_audit_completed", AsyncMock())
    monkeypatch.setattr(audit_api, "trigger_track_assignment", lambda **kw: None)

    job = {
        "id": audit_id,
        "email": "customer@company.com",
        "url": "https://company.com",
        "name": "Customer",
    }
    data = {"score": 5, "grade": "C", "findings": [{"key": "f1"}]}

    await audit_api.finalize_completed_audit(job, data)

    # Let fire-and-forget task execute
    import asyncio
    await asyncio.sleep(0.01)
    mark_sent.assert_awaited_once_with(audit_id)


def test_script_failure_does_not_expose_stderr(monkeypatch):
    secret = "/internal/path provider-secret attacker-controlled"
    monkeypatch.setattr(
        audit_engine.subprocess,
        "run",
        lambda *args, **kwargs: SimpleNamespace(returncode=1, stdout="", stderr=secret),
    )

    with pytest.raises(RuntimeError) as excinfo:
        audit_engine.score_via_cli({"url": "https://example.com", "email": "anon@invalid.example.com"})

    assert str(excinfo.value) == "script_error"
    assert secret not in str(excinfo.value)


@pytest.mark.asyncio
async def test_unexpected_audit_exception_has_stable_public_error(monkeypatch):
    secret = "/internal/database provider-secret"
    monkeypatch.setattr(audit_runner, "runner_started", lambda: True)
    monkeypatch.setattr(
        audit_api.audit_db,
        "create_audit",
        AsyncMock(side_effect=RuntimeError(secret)),
    )

    with pytest.raises(HTTPException) as excinfo:
        await audit_api.accept_audit(audit_api.AuditRequest(url="https://example.com"))

    assert excinfo.value.status_code == 500
    assert excinfo.value.detail == "Audit processing unavailable"
    assert secret not in str(excinfo.value.detail)

