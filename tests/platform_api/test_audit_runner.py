import asyncio
import inspect
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from platform_api.services import audit_runner
from platform_api.services.audit_db import AuditDB


def test_max_in_flight_is_two():
    assert audit_runner.MAX_IN_FLIGHT == 2


def test_claim_sql_uses_skip_locked_and_running():
    source = inspect.getsource(AuditDB.claim_pending_audit)
    assert "FOR UPDATE SKIP LOCKED" in source
    assert "running" in source
    assert "heartbeat" in source


def test_sweep_fails_stale_running_and_pending():
    source = inspect.getsource(AuditDB.sweep_stale_audits)
    assert "running" in source
    assert "pending" in source
    assert "failed" in source
    assert "heartbeat" in source


@pytest.mark.asyncio
async def test_claim_pending_marks_running_with_heartbeat():
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    audit_id = uuid4()
    conn.fetchrow.return_value = {
        "id": audit_id,
        "url": "https://example.com",
        "email": "a@example.com",
        "name": None,
        "engine_input": {},
        "status": "running",
    }
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    row = await db.claim_pending_audit()

    assert row["id"] == audit_id
    sql = conn.fetchrow.call_args.args[0]
    assert "FOR UPDATE SKIP LOCKED" in sql
    assert "running" in sql
    assert "heartbeat" in sql


@pytest.mark.asyncio
async def test_process_one_respects_in_flight_cap(monkeypatch):
    in_flight = []
    peak = {"n": 0}

    async def fake_claim():
        if len(in_flight) >= audit_runner.MAX_IN_FLIGHT:
            return None
        job = {"id": uuid4(), "url": "https://example.com", "email": "a@b.com", "engine_input": {}}
        in_flight.append(job)
        peak["n"] = max(peak["n"], len(in_flight))
        return job

    async def fake_score(_job):
        await asyncio.sleep(0)
        in_flight.pop()
        return {"score": 5, "grade": "C", "findings": []}

    monkeypatch.setattr(audit_runner.audit_db, "claim_pending_audit", fake_claim)
    monkeypatch.setattr(audit_runner.audit_db, "heartbeat_audit", AsyncMock())
    monkeypatch.setattr(audit_runner.audit_db, "update_audit", AsyncMock(return_value=True))
    monkeypatch.setattr(audit_runner.audit_db, "mark_audit_failed", AsyncMock(return_value=True))
    monkeypatch.setattr(audit_runner, "_complete", AsyncMock())
    monkeypatch.setattr(audit_runner, "_track_failed", AsyncMock())

    async def call_in_place(fn, *args):
        result = fn(*args)
        if hasattr(result, "__await__"):
            return await result
        return result

    monkeypatch.setattr(asyncio, "to_thread", call_in_place)
    monkeypatch.setattr(audit_runner, "score_job", fake_score)

    await asyncio.gather(*[audit_runner.process_one() for _ in range(5)])
    assert peak["n"] <= 2


@pytest.mark.asyncio
async def test_process_one_wall_clock_timeout_marks_failed_and_ledgers(monkeypatch):
    """Hung in-process score must fail closed and free the slot."""
    import time

    job = {
        "id": uuid4(),
        "url": "https://example.com",
        "email": "anon@invalid.example.com",
        "engine_input": {},
        "status": "running",
    }

    async def fake_claim():
        return job

    def hung_score(_job):
        time.sleep(0.2)
        return {"score": 5, "grade": "C", "findings": []}

    mark_failed = AsyncMock(return_value=True)
    track = AsyncMock()
    monkeypatch.setattr(audit_runner.audit_db, "claim_pending_audit", fake_claim)
    monkeypatch.setattr(audit_runner.audit_db, "heartbeat_audit", AsyncMock())
    monkeypatch.setattr(audit_runner.audit_db, "update_audit", AsyncMock(return_value=True))
    monkeypatch.setattr(audit_runner.audit_db, "mark_audit_failed", mark_failed)
    monkeypatch.setattr(audit_runner, "_complete", AsyncMock())
    monkeypatch.setattr(audit_runner, "_track_failed", track)
    monkeypatch.setattr(audit_runner, "score_job", hung_score)
    monkeypatch.setattr(audit_runner, "SCORE_TIMEOUT", 0.01)

    started = time.perf_counter()
    row = await asyncio.wait_for(audit_runner.process_one(), timeout=2)
    elapsed = time.perf_counter() - started

    assert row["id"] == job["id"]
    assert elapsed < 0.15
    mark_failed.assert_awaited_once()
    assert mark_failed.await_args.args[0] == job["id"]
    assert mark_failed.await_args.kwargs["reason"] == "timeout"
    track.assert_awaited()
    assert track.await_args.args[1] == "timeout" or track.await_args.kwargs.get("reason") == "timeout"
