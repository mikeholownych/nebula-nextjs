"""In-process audit queue: SKIP LOCKED workers, cap=2, heartbeat, sweeper."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional
from uuid import UUID

from platform_api.services.audit_db import audit_db
from platform_api.services.audit_engine import score_job

logger = logging.getLogger(__name__)

MAX_IN_FLIGHT = 2
HEARTBEAT_SECONDS = 15
WAIT_POLL_SECONDS = 0.25
RUN_WAIT_TIMEOUT = 120.0
SCORE_TIMEOUT = 120.0

_semaphore = asyncio.Semaphore(MAX_IN_FLIGHT)
_wakeup = asyncio.Event()
_tasks: list[asyncio.Task] = []
_started = False


async def kick() -> None:
    _wakeup.set()


def runner_started() -> bool:
    return _started


async def start_runner() -> None:
    global _started
    if _tasks:
        _started = True
        return
    for _ in range(MAX_IN_FLIGHT):
        _tasks.append(asyncio.create_task(_worker_loop(), name="audit-worker"))
    _tasks.append(asyncio.create_task(_sweeper_loop(), name="audit-sweeper"))
    _tasks.append(asyncio.create_task(_outbox_loop(), name="outbox-drain"))
    _started = True


async def stop_runner() -> None:
    global _started
    tasks = list(_tasks)
    _tasks.clear()
    _started = False
    for task in tasks:
        task.cancel()
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


async def wait_for_result(audit_id: UUID, timeout: float = RUN_WAIT_TIMEOUT) -> dict:
    deadline = time.monotonic() + timeout
    last: Optional[dict] = None
    while time.monotonic() < deadline:
        last = await audit_db.get_audit(audit_id)
        if last and last.get("status") in ("completed", "failed"):
            return last
        await asyncio.sleep(WAIT_POLL_SECONDS)
    raise TimeoutError("audit wait exceeded")


def _job_from_row(row: dict) -> dict:
    engine_input = row.get("engine_input") or {}
    if not isinstance(engine_input, dict):
        engine_input = {}
    return {
        "id": row["id"],
        "url": row["url"],
        "email": row.get("email"),
        "name": row.get("name"),
        "engine_input": engine_input,
        "monthly_ad_spend": engine_input.get("monthly_ad_spend"),
        "historical_data": engine_input.get("historical_data"),
        "analytics_consent": engine_input.get("analytics_consent"),
        "analytics_distinct_id": engine_input.get("analytics_distinct_id"),
        "analytics_attempt_id": engine_input.get("analytics_attempt_id"),
        "analytics_journey_id": engine_input.get("analytics_journey_id"),
        "source": row.get("source") or engine_input.get("source"),
    }


async def process_one() -> Optional[dict]:
    async with _semaphore:
        row = await audit_db.claim_pending_audit()
        if not row:
            return None
        job = _job_from_row(row)
        heartbeat_task = asyncio.create_task(_heartbeat_loop(row["id"]))
        try:
            await _load_historical(job)
            data = await asyncio.wait_for(
                asyncio.to_thread(score_job, job),
                timeout=SCORE_TIMEOUT,
            )
            await _complete(job, data)
        except Exception as exc:
            reason = "timeout" if isinstance(exc, TimeoutError) or "TimeoutExpired" in type(exc).__name__ else "script_error"
            logger.exception("audit worker failed for %s", row["id"])
            await audit_db.mark_audit_failed(row["id"], reason=reason)
            await _track_failed(job, reason)
        finally:
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except (asyncio.CancelledError, Exception):
                pass
        return row


async def _load_historical(job: dict) -> None:
    email = job.get("email") or ""
    if not email or "@invalid" in email:
        return
    if job.get("historical_data"):
        return
    try:
        history = await audit_db.get_audit_history(email, job["url"], limit=5)
        score_trend = await audit_db.get_score_trend(email, job["url"], limit=5)
        recurring_issues = await audit_db.get_recurring_issues(email, limit=3)
        effective_fixes = await audit_db.get_effective_fixes(email, limit=3)
        job["historical_data"] = {
            "history": history,
            "score_trend": score_trend,
            "recurring_issues": recurring_issues,
            "effective_fixes": effective_fixes,
        }
    except Exception as exc:
        logger.info("historical data skipped for %s: %s", job.get("id"), exc)


async def _complete(job: dict, data: dict) -> None:
    audit_id = job["id"]
    await audit_db.update_audit(
        audit_id=audit_id,
        score=data.get("score", 0),
        grade=data.get("grade", "N/A"),
        composite=data.get("composite"),
        composite_anchor=data.get("composite_anchor"),
        findings=data.get("findings", []) or [],
        status="completed",
        engine_version=data.get("engine_version"),
        guided_implementation=data.get("guided_implementation"),
        strategic_finding=data.get("strategic_finding"),
        engine_output=data,
    )
    await _finalize_completed(job, data)


async def _finalize_completed(job: dict, data: dict) -> None:
    """Best-effort post-success work. Must not un-complete the audit."""
    from platform_api.routes.audit_api import finalize_completed_audit
    try:
        await finalize_completed_audit(job, data)
    except Exception:
        logger.exception("finalize failed for %s", job.get("id"))


async def _track_failed(job: dict, reason: str) -> None:
    try:
        from platform_api.services.analytics import analytics
        await analytics.track_audit_failed(
            reason=reason,
            audit_id=str(job.get("id")),
            audit_attempt_id=job.get("analytics_attempt_id"),
        )
    except Exception:
        pass


async def _heartbeat_loop(audit_id) -> None:
    while True:
        await asyncio.sleep(HEARTBEAT_SECONDS)
        try:
            await audit_db.heartbeat_audit(audit_id)
        except Exception:
            logger.debug("heartbeat failed for %s", audit_id)


async def _worker_loop() -> None:
    while True:
        try:
            claimed = await process_one()
            if claimed is None:
                try:
                    await asyncio.wait_for(_wakeup.wait(), timeout=1.0)
                except asyncio.TimeoutError:
                    pass
                _wakeup.clear()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("audit worker loop error")
            await asyncio.sleep(1)


async def _sweeper_loop() -> None:
    while True:
        try:
            await audit_db.sweep_stale_audits()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("audit sweeper error")
        await asyncio.sleep(30)


async def _outbox_loop() -> None:
    from platform_api.infra.outbox import outbox
    while True:
        try:
            processed = await outbox.drain()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("outbox drain error")
            processed = 0
        await asyncio.sleep(2 if processed else 5)
