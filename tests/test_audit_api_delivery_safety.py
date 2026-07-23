from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from platform_api.routes import audit_api


@pytest.mark.asyncio
async def test_run_audit_passes_hostile_url_as_literal_argv(monkeypatch):
    audit_id = uuid4()
    monkeypatch.setattr(audit_api.audit_db, "create_audit", AsyncMock(return_value=audit_id))
    monkeypatch.setattr(audit_api.audit_db, "update_audit", AsyncMock(return_value=True))
    monkeypatch.setattr(audit_api.analytics, "track_audit_started", AsyncMock())
    monkeypatch.setattr(audit_api.analytics, "track_audit_completed", AsyncMock())
    monkeypatch.setattr(audit_api, "get_posthog", lambda: None)

    calls = []

    def fake_run(argv, **kwargs):
        calls.append((argv, kwargs))
        return SimpleNamespace(
            returncode=0,
            stdout='{"score": 5, "grade": "C", "findings": []}\n',
            stderr="",
        )

    monkeypatch.setattr(audit_api.subprocess, "run", fake_run)
    hostile = 'https://example.com/"; touch /tmp/nebula-pwned; #'

    result = await audit_api.run_audit(audit_api.AuditRequest(url=hostile))

    argv, kwargs = calls[0]
    assert argv[0].endswith("/venv/bin/python3")
    assert argv[2] == hostile
    assert kwargs.get("shell") is not True
    assert result.status == "completed"


@pytest.mark.asyncio
async def test_blocked_email_is_not_marked_sent(monkeypatch):
    mark_sent = AsyncMock()
    monkeypatch.setattr(
        audit_api.email_service,
        "send_audit_results",
        AsyncMock(return_value={"status": "failed", "error": "outreach_disabled"}),
    )
    monkeypatch.setattr(
        audit_api.audit_db,
        "get_audits_by_email",
        AsyncMock(return_value=[{"id": uuid4()}]),
    )
    monkeypatch.setattr(audit_api.audit_db, "mark_email_sent", mark_sent)

    result = await audit_api.send_audit_email(
        audit_api.EmailRequest(
            url="https://example.com",
            email="lead@example.com",
            score=5,
            grade="C",
            findings=[],
        )
    )

    assert result.status == "failed"
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
    monkeypatch.setattr(
        audit_api.audit_db,
        "get_audits_by_email",
        AsyncMock(return_value=[{"id": audit_id}]),
    )
    monkeypatch.setattr(audit_api.audit_db, "mark_email_sent", mark_sent)
    monkeypatch.setattr(audit_api.analytics, "track_email_sent", AsyncMock())
    monkeypatch.setattr(audit_api, "get_posthog", lambda: None)

    result = await audit_api.send_audit_email(
        audit_api.EmailRequest(
            url="https://example.com",
            email="lead@example.com",
            score=5,
            grade="C",
            findings=[],
        )
    )

    assert result.status == "sent"
    mark_sent.assert_awaited_once_with(audit_id)


@pytest.mark.asyncio
async def test_script_failure_does_not_expose_stderr(monkeypatch):
    audit_id = uuid4()
    monkeypatch.setattr(audit_api.audit_db, "create_audit", AsyncMock(return_value=audit_id))
    monkeypatch.setattr(audit_api.analytics, "track_audit_started", AsyncMock())
    monkeypatch.setattr(audit_api, "get_posthog", lambda: None)
    secret = "/internal/path provider-secret attacker-controlled"
    monkeypatch.setattr(
        audit_api.subprocess,
        "run",
        lambda *args, **kwargs: SimpleNamespace(returncode=1, stdout="", stderr=secret),
    )

    result = await audit_api.run_audit(audit_api.AuditRequest(url="https://example.com"))

    assert result.status == "error"
    assert result.error == "Audit processing failed"
    assert secret not in result.error


@pytest.mark.asyncio
async def test_unexpected_audit_exception_has_stable_public_error(monkeypatch):
    secret = "/internal/database provider-secret"
    monkeypatch.setattr(
        audit_api.audit_db,
        "create_audit",
        AsyncMock(side_effect=RuntimeError(secret)),
    )

    result = await audit_api.run_audit(audit_api.AuditRequest(url="https://example.com"))

    assert result.status == "error"
    assert result.error == "Audit processing unavailable"
    assert secret not in result.error


@pytest.mark.asyncio
async def test_email_exception_has_stable_public_error(monkeypatch):
    secret = "/internal/provider token=secret"
    monkeypatch.setattr(
        audit_api.email_service,
        "send_audit_results",
        AsyncMock(side_effect=RuntimeError(secret)),
    )

    result = await audit_api.send_audit_email(
        audit_api.EmailRequest(
            url="https://example.com",
            email="lead@example.com",
            score=5,
            grade="C",
            findings=[],
        )
    )

    assert result.status == "error"
    assert result.error == "Email delivery unavailable"
    assert secret not in result.error
