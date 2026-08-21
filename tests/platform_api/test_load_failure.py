"""Phase 7 load / failure validation.

Simulated only: no production ledger, no live Postgres stop, no live Stripe,
no real audits. Cap=2, healthz non-blocking, timeout → failed + ledger,
no duplicate kits.
"""

from __future__ import annotations

import asyncio
import inspect
import subprocess
import threading
import time
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from platform_api.infra.outbox import Outbox, outbox
from platform_api.main import app, health_check
from platform_api.routes import audit_api
from platform_api.services import analytics as analytics_mod
from platform_api.services import audit_runner
from platform_api.services.audit_db import AuditDB, audit_db as audit_db_singleton


def _pending_job(email: str = "anon@invalid.example.com"):
    return {
        "id": uuid4(),
        "url": "https://example.com",
        "email": email,
        "name": None,
        "engine_input": {},
        "status": "running",
    }


def _score_ok(_job):
    return {"score": 7, "grade": "B", "findings": [{"key": "cta"}]}


def _patch_runner(monkeypatch, *, claim, score):
    monkeypatch.setattr(audit_runner.audit_db, "claim_pending_audit", claim)
    monkeypatch.setattr(audit_runner.audit_db, "heartbeat_audit", AsyncMock())
    update = AsyncMock(return_value=True)
    mark_failed = AsyncMock(return_value=True)
    monkeypatch.setattr(audit_runner.audit_db, "update_audit", update)
    monkeypatch.setattr(audit_runner.audit_db, "mark_audit_failed", mark_failed)
    monkeypatch.setattr(audit_runner, "_finalize_completed", AsyncMock())
    monkeypatch.setattr(audit_runner, "score_job", score)
    track = AsyncMock(return_value=True)
    monkeypatch.setattr(analytics_mod.analytics, "track_audit_failed", track)
    return update, mark_failed, track


@pytest.mark.asyncio
async def test_process_one_happy_path_marks_completed(monkeypatch):
    job = _pending_job()

    async def fake_claim():
        return job

    update, mark_failed, track = _patch_runner(
        monkeypatch, claim=fake_claim, score=_score_ok
    )

    row = await audit_runner.process_one()

    assert row["id"] == job["id"]
    update.assert_awaited()
    assert update.await_args.kwargs["status"] == "completed"
    assert update.await_args.kwargs["audit_id"] == job["id"]
    mark_failed.assert_not_awaited()
    track.assert_not_awaited()


@pytest.mark.asyncio
async def test_ten_concurrent_process_one_peak_in_flight_at_most_two(monkeypatch):
    jobs = [_pending_job(email=f"anon+{i}@invalid.example.com") for i in range(10)]
    idx = {"n": 0}
    lock = threading.Lock()
    in_flight = {"n": 0, "peak": 0}
    scored = []
    pair = threading.Barrier(2, timeout=2)

    async def fake_claim():
        i = idx["n"]
        if i >= len(jobs):
            return None
        idx["n"] = i + 1
        return jobs[i]

    def fake_score(job):
        with lock:
            in_flight["n"] += 1
            in_flight["peak"] = max(in_flight["peak"], in_flight["n"])
            scored.append(job["id"])
        try:
            pair.wait()
        except threading.BrokenBarrierError as exc:
            raise AssertionError("in-flight cap prevented a pair of workers from overlapping") from exc
        time.sleep(0.02)
        with lock:
            in_flight["n"] -= 1
        return _score_ok(job)

    update, mark_failed, _track = _patch_runner(
        monkeypatch, claim=fake_claim, score=fake_score
    )

    results = await asyncio.wait_for(
        asyncio.gather(*[audit_runner.process_one() for _ in range(10)]),
        timeout=10,
    )

    assert audit_runner.MAX_IN_FLIGHT == 2
    assert len(results) == 10
    assert all(row is not None for row in results)
    assert len(scored) == 10
    assert in_flight["peak"] <= 2
    assert in_flight["peak"] == 2
    assert update.await_count == 10
    mark_failed.assert_not_awaited()


@pytest.mark.asyncio
async def test_ten_concurrent_accepts_do_not_await_score(monkeypatch):
    ids = [uuid4() for _ in range(10)]
    id_iter = iter(ids)
    score = MagicMock(side_effect=AssertionError("accept must not call score_job"))

    async def fake_create(**_kwargs):
        return next(id_iter)

    async def slow_wait(*_args, **_kwargs):
        await asyncio.sleep(10)
        raise AssertionError("accept must not wait for score")

    monkeypatch.setattr(audit_api.audit_db, "create_audit", fake_create)
    monkeypatch.setattr("platform_api.services.audit_runner.kick", AsyncMock())
    monkeypatch.setattr("platform_api.services.audit_runner.wait_for_result", slow_wait)
    monkeypatch.setattr("platform_api.services.audit_runner.score_job", score)
    monkeypatch.setattr("platform_api.services.audit_engine.score_job", score)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        started = time.perf_counter()
        responses = await asyncio.wait_for(
            asyncio.gather(*[
                client.post(
                    "/audit/accept",
                    json={"url": "https://example.com", "email": f"founder{i}@example.com"},
                    headers={
                        "X-Forwarded-For": f"10.8.0.{i + 1}",
                        "X-Audit-Email": f"founder{i}@example.com",
                    },
                )
                for i in range(10)
            ]),
            timeout=2,
        )
        elapsed = time.perf_counter() - started

    assert elapsed < 1.0
    assert [response.status_code for response in responses] == [200] * 10
    bodies = [response.json() for response in responses]
    assert {body["audit_id"] for body in bodies} == {str(audit_id) for audit_id in ids}
    assert all(body["status"] == "pending" for body in bodies)
    score.assert_not_called()


@pytest.mark.asyncio
async def test_process_one_timeout_marks_failed_and_records_ledger(monkeypatch):
    job = _pending_job()

    async def fake_claim():
        return job

    def fake_score(_job):
        raise subprocess.TimeoutExpired(cmd="deliver_audit.py", timeout=120)

    update, mark_failed, track = _patch_runner(
        monkeypatch, claim=fake_claim, score=fake_score
    )

    row = await audit_runner.process_one()

    assert row["id"] == job["id"]
    mark_failed.assert_awaited_once()
    assert mark_failed.await_args.args[0] == job["id"]
    assert mark_failed.await_args.kwargs["reason"] == "timeout"
    update.assert_not_awaited()
    track.assert_awaited()
    assert track.await_args.kwargs["reason"] == "timeout"
    assert track.await_args.kwargs["audit_id"] == str(job["id"])


def test_healthz_source_does_not_query_postgres():
    source = inspect.getsource(health_check)
    assert "audit_db" not in source
    assert "SELECT" not in source
    assert "pg_sleep" not in source
    assert "pool" not in source


@pytest.mark.asyncio
async def test_healthz_returns_200_quickly_while_score_sleeps(client, monkeypatch):
    job = _pending_job()
    entered = threading.Event()
    release = threading.Event()

    async def fake_claim():
        return job

    def fake_score(_job):
        entered.set()
        if not release.wait(timeout=5):
            raise AssertionError("score was not released")
        return _score_ok(_job)

    _patch_runner(monkeypatch, claim=fake_claim, score=fake_score)

    worker = asyncio.create_task(audit_runner.process_one())
    assert await asyncio.to_thread(entered.wait, 2)

    started = time.perf_counter()
    response = await client.get("/healthz")
    elapsed = time.perf_counter() - started

    release.set()
    await asyncio.wait_for(worker, timeout=2)

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert elapsed < 0.2


@pytest.mark.asyncio
async def test_sweep_stale_running_marks_failed_and_skips_completed():
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    # DATA-6 semantics: stale running rows are REQUEUED once (requeue_attempts<1),
    # terminal on a second offense; abandoned pending still age to failure.
    conn.execute.side_effect = ["UPDATE 1", "UPDATE 0", "UPDATE 2"]
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    count = await db.sweep_stale_audits()

    assert count == 3
    requeue_sql, terminal_sql, pending_sql = [
        call.args[0] for call in conn.execute.call_args_list
    ]
    assert "status = 'pending'" in requeue_sql
    assert "requeue_attempts < 1" in requeue_sql
    assert "requeue_attempts + 1" in requeue_sql
    assert "status = 'failed'" in terminal_sql
    assert "requeue_attempts >= 1" in terminal_sql
    assert "status = 'completed'" not in requeue_sql
    assert "status = 'completed'" not in pending_sql
    assert "status = 'pending'" in pending_sql
    assert "status = 'failed'" in pending_sql


class _Txn:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_exc):
        return False


class _ConnCM:
    def __init__(self, conn):
        self._conn = conn

    async def __aenter__(self):
        return self._conn

    async def __aexit__(self, *_exc):
        return False


def _fake_pool(conn):
    pool = MagicMock()
    pool.acquire.side_effect = lambda: _ConnCM(conn)
    return pool


@pytest.mark.asyncio
async def test_concurrent_drain_claims_one_kit_send(monkeypatch):
    claimed = {"id": None}
    lock = asyncio.Lock()
    send_calls = []
    msg_id = uuid4()
    row = {
        "id": msg_id,
        "channel": "kit_send",
        "recipient": "buyer@example.com",
        "payload": {
            "email": "buyer@example.com",
            "stripe_session_id": "cs_test_1",
            "audit_id": str(uuid4()),
        },
        "attempts": 0,
    }

    class Conn:
        def transaction(self):
            return _Txn()

        async def fetchrow(self, sql, *_args):
            assert "SKIP LOCKED" in sql
            async with lock:
                if claimed["id"] is not None:
                    return None
                claimed["id"] = row["id"]
                return row

        async def execute(self, *_args, **_kwargs):
            return "UPDATE 1"

    conn = Conn()
    monkeypatch.setattr(outbox, "_ensure_connected", AsyncMock())
    monkeypatch.setattr(audit_db_singleton, "pool", _fake_pool(conn))

    async def fake_send(payload):
        send_calls.append(payload)
        await asyncio.sleep(0.05)
        return True

    monkeypatch.setattr(outbox, "_send_kit", fake_send)
    monkeypatch.setattr(outbox, "_mark_purchase_delivered", AsyncMock())

    processed = await asyncio.gather(outbox.drain(), outbox.drain())

    assert sum(processed) == 1
    assert len(send_calls) == 1
    assert send_calls[0]["stripe_session_id"] == "cs_test_1"


@pytest.mark.asyncio
async def test_terminal_kit_send_failure_marks_purchase_failed(monkeypatch):
    from platform_api.infra.outbox import MAX_ATTEMPTS, outbox

    msg_id = uuid4()
    payload = {
        "email": "buyer@example.com",
        "stripe_session_id": "cs_fail_1",
        "audit_id": str(uuid4()),
    }
    row = {
        "id": msg_id,
        "channel": "kit_send",
        "recipient": "buyer@example.com",
        "payload": payload,
        "attempts": MAX_ATTEMPTS - 1,
    }
    claimed = {"n": 0}
    sqls = []

    class Conn:
        def transaction(self):
            return _Txn()

        async def fetchrow(self, sql, *_args):
            claimed["n"] += 1
            return row if claimed["n"] == 1 else None

        async def execute(self, sql, *_args, **_kwargs):
            sqls.append(sql)
            return "UPDATE 1"

    monkeypatch.setattr(outbox, "_ensure_connected", AsyncMock())
    monkeypatch.setattr(audit_db_singleton, "pool", _fake_pool(Conn()))
    monkeypatch.setattr(outbox, "_send_kit", AsyncMock(return_value=False))
    mark_failed = AsyncMock()
    monkeypatch.setattr(outbox, "_mark_purchase_failed", mark_failed)
    monkeypatch.setattr(outbox, "_mark_purchase_delivered", AsyncMock())

    processed = await outbox.drain()

    assert processed == 1
    assert any("status = 'failed'" in sql for sql in sqls)
    mark_failed.assert_awaited_once()
    assert mark_failed.await_args.args[0]["stripe_session_id"] == "cs_fail_1"


@pytest.mark.asyncio
async def test_drain_does_not_dispatch_when_no_pending_kit(monkeypatch):
    class Conn:
        def transaction(self):
            return _Txn()

        async def fetchrow(self, sql, *_args):
            assert "SKIP LOCKED" in sql
            return None

        async def execute(self, *_args, **_kwargs):
            return "UPDATE 0"

    monkeypatch.setattr(outbox, "_ensure_connected", AsyncMock())
    monkeypatch.setattr(audit_db_singleton, "pool", _fake_pool(Conn()))
    send = AsyncMock(return_value=True)
    monkeypatch.setattr(outbox, "_send_kit", send)

    processed = await outbox.drain()

    assert processed == 0
    send.assert_not_awaited()


@pytest.mark.asyncio
async def test_already_sent_kit_enqueue_is_deduped_without_second_subprocess(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_SECRET", "phase7-internal")
    existing = str(uuid4())
    monkeypatch.setattr(outbox, "find_open", AsyncMock(return_value=existing))
    enqueue = AsyncMock()
    drain = AsyncMock(return_value=0)
    send = AsyncMock()
    monkeypatch.setattr(outbox, "enqueue", enqueue)
    monkeypatch.setattr(outbox, "drain", drain)
    monkeypatch.setattr(outbox, "_send_kit", send)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/outbox/enqueue",
            json={
                "channel": "kit_send",
                "recipient": "buyer@example.com",
                "payload": {"email": "buyer@example.com", "stripe_session_id": "cs_dup"},
            },
            headers={"Authorization": "Bearer phase7-internal"},
        )

    await asyncio.sleep(0)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == existing
    assert body["deduped"] is True
    enqueue.assert_not_awaited()
    send.assert_not_awaited()


def test_find_open_treats_sent_kit_as_duplicate():
    source = inspect.getsource(Outbox.find_open)
    assert "'sent'" in source or '"sent"' in source
    assert "pending" in source
    assert "sending" in source


@pytest.mark.asyncio
async def test_accept_returns_429_when_queue_full(monkeypatch):
    """DATA-6 regression: bounded admission returns 429 + Retry-After."""
    from unittest.mock import AsyncMock
    from platform_api.routes import audit_api

    monkeypatch.setattr(
        audit_api.audit_db, "check_admission",
        AsyncMock(return_value=(False, "queue_full: 8/8 pending")),
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/audit/accept",
                              json={"url": "https://example.com", "email": "q@example.com"})
    assert r.status_code == 429
    assert r.headers.get("Retry-After") == "60"
