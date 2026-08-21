from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from platform_api.routes import audit_api


def _patch_accept(monkeypatch, audit_id):
    monkeypatch.setattr(audit_api.audit_db, "create_audit", AsyncMock(return_value=audit_id))
    monkeypatch.setattr(audit_api.audit_db, "mark_audit_failed", AsyncMock(return_value=True))
    monkeypatch.setattr("platform_api.services.audit_runner.kick", AsyncMock())


@pytest.mark.asyncio
async def test_run_audit_timeout_is_not_http_200(monkeypatch):
    audit_id = uuid4()
    _patch_accept(monkeypatch, audit_id)
    monkeypatch.setattr(
        "platform_api.services.audit_runner.wait_for_result",
        AsyncMock(side_effect=TimeoutError("audit wait exceeded")),
    )

    with pytest.raises(HTTPException) as excinfo:
        await audit_api.run_audit(audit_api.AuditRequest(url="https://example.com"))

    assert excinfo.value.status_code == 504


@pytest.mark.asyncio
async def test_run_audit_script_error_is_not_http_200(monkeypatch):
    audit_id = uuid4()
    _patch_accept(monkeypatch, audit_id)
    monkeypatch.setattr(
        "platform_api.services.audit_runner.wait_for_result",
        AsyncMock(return_value={
            "audit_id": str(audit_id),
            "url": "https://example.com",
            "status": "failed",
            "engine_input": {"failure_reason": "script_error"},
        }),
    )

    with pytest.raises(HTTPException) as excinfo:
        await audit_api.run_audit(audit_api.AuditRequest(url="https://example.com"))

    assert excinfo.value.status_code in (500, 504)


@pytest.mark.asyncio
async def test_post_success_exception_does_not_mark_completed_audit_failed(monkeypatch):
    audit_id = uuid4()
    _patch_accept(monkeypatch, audit_id)
    monkeypatch.setattr(
        "platform_api.services.audit_runner.wait_for_result",
        AsyncMock(return_value={
            "audit_id": str(audit_id),
            "url": "https://example.com",
            "status": "completed",
            "score": 8.0,
            "grade": "B",
            "findings": [{"key": "cta"}],
        }),
    )

    result = await audit_api.run_audit(audit_api.AuditRequest(url="https://example.com"))

    assert result.status == "completed"
    assert result.score == 8
    audit_api.audit_db.mark_audit_failed.assert_not_awaited()


@pytest.mark.asyncio
async def test_mark_audit_failed_sql_refuses_to_clobber_completed():
    from unittest.mock import MagicMock

    from platform_api.services.audit_db import AuditDB

    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    conn.execute.return_value = "UPDATE 0"
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    result = await db.mark_audit_failed(uuid4())
    sql = conn.execute.call_args.args[0].lower()
    assert "status = 'failed'" in sql
    assert "status <> 'completed'" in sql
    assert result is False
