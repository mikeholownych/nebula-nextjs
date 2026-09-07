from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
import asyncio

import pytest
import pytest_asyncio
from fastapi import HTTPException

from platform_api.routes import audit_api


@pytest_asyncio.fixture(autouse=True)
async def hermetic_admission(monkeypatch):
    """DATA-6: queue admission must never touch a real DB from unit tests."""
    from platform_api.infra.outbox import outbox
    from platform_api.services import findings_sync

    content_client = AsyncMock()
    content_client.__aenter__.return_value.post = AsyncMock()

    monkeypatch.setattr(
        "platform_api.routes.audit_api.audit_db.check_admission",
        AsyncMock(return_value=(True, "test-open")),
    )
    monkeypatch.setattr(outbox, "enqueue", AsyncMock(return_value="outbox-id"))
    monkeypatch.setattr(outbox, "drain", AsyncMock(return_value=0))
    monkeypatch.setattr(findings_sync, "sync_findings_for_audit", MagicMock(return_value={}))
    monkeypatch.setattr(
        audit_api.httpx, "AsyncClient", MagicMock(return_value=content_client)
    )
    monkeypatch.setattr(audit_api, "_crm_audit_completed", AsyncMock())
    yield
    await asyncio.sleep(0)
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
async def test_result_email_is_enqueued_to_durable_outbox(monkeypatch):
    """RES-5: completion enqueues channel 'audit_result' (durable) instead of
    spawning an unguarded asyncio task. Delivery + mark_email_sent now happen
    in the outbox drain handler."""
    import importlib
    outbox_module = importlib.import_module("platform_api.infra.outbox")
    audit_id = uuid4()
    enqueue = AsyncMock(return_value="outbox-id")
    monkeypatch.setattr(outbox_module.outbox, "enqueue", enqueue)
    monkeypatch.setattr(
        outbox_module.outbox, "drain", AsyncMock(return_value=0)
    )  # keep the scheduled drain hermetic

    job = {
        "id": audit_id,
        "email": "customer@company.com",
        "url": "https://company.com",
        "name": "Customer",
    }
    data = {"score": 5, "grade": "C", "findings": [{"key": "f1"}]}

    await audit_api.finalize_completed_audit(job, data)

    enqueue.assert_awaited_once()
    call = enqueue.await_args
    channel = call.kwargs.get("channel") or (call.args[0] if call.args else None)
    assert channel == "audit_result", f"unexpected enqueue call: {call}"


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
