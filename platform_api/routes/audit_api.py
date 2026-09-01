"""
Nebula Audit API
FastAPI routes for audit processing (called by n8n workflows)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from uuid import UUID, uuid4
import json
import hmac
import sys
import os
import asyncio
import logging
import httpx
from asyncpg.exceptions import UniqueViolationError

logger = logging.getLogger(__name__)

from posthog import identify_context, new_context  # type: ignore[import-untyped]

from platform_api.posthog_client import get_posthog
from platform_api.services.email_service import email_service, AuditEmailData
from platform_api.auth.routes import get_current_user
from platform_api.services.audit_db import audit_db
from platform_api.services import benchmark_rollups
from platform_api.services import programs
from platform_api.services.signal_extract import extract_signal_map
from platform_api.services.teardown_db import get_teardown_db
from platform_api.services.analytics import analytics
from platform_api.infra.circuit_breaker import CircuitBreaker, CircuitOpenError
from platform_api.services.findings_sync import sync_findings_for_audit

# Import track assignment trigger
import sys
from pathlib import Path
sys.path.insert(0, "/home/mike/nebula")
from audit_track_trigger import trigger_track_assignment

from platform_api.auth.principal import (
    Principal,
    bind_email,
    require_internal_service,
    internal_service_dependency,
    require_principal,
    SCOPE_AGENT_EXECUTE,
    SCOPE_AUDIT_CREATE,
    SCOPE_AUDIT_READ,
    SCOPE_FIXES_READ,
    SCOPE_WORKSPACE_READ,
    SCOPE_WORKSPACE_WRITE,
)

router = APIRouter(prefix="/audit", tags=["audit"])

# Path to deliver_audit.py
AUDIT_SCRIPT = "/home/mike/nebula/deliver_audit.py"


# ── Plan entitlements (monitor gates) ────────────────────────────────────────

async def resolve_for_email(email: str):
    """Resolve plan entitlements for an email, thread-offloaded.

    Module-level symbol so tests patch a single seam. Resolution failure
    degrades to free with zero monitored urls: premium mutations fail closed.

    For system-managed client emails (*@clients.nebulacomponents.com), the
    owning agency's entitlements are resolved instead by looking up the
    agency_clients table to find the owning organization's owner email.
    """
    import asyncio

    from platform_api.db.session import session_scope
    from platform_api.services.entitlements import Entitlements, resolve_sync

    norm = (email or "").strip().lower()

    # Client email bypass: resolve as the owning agency org's subscription.
    if norm.endswith("@clients.nebulacomponents.com"):
        try:
            import asyncpg as _pg
            DSN = "host=/var/run/postgresql port=5433 dbname=nebula_platform user=postgres"
            conn = await _pg.connect(DSN)
            try:
                row = await conn.fetchrow(
                    """SELECT u.email FROM agency_clients ac
                       JOIN memberships m ON m.organization_id = ac.organization_id
                       JOIN users u ON u.id = m.user_id
                       WHERE ac.client_email = $1 AND m.role = 'owner' AND m.status = 'active'
                       LIMIT 1""",
                    norm,
                )
                if row:
                    agency_email = row["email"]
                    def _q2():
                        with session_scope() as session:
                            return resolve_sync(agency_email, session)
                    return await asyncio.to_thread(_q2)
            finally:
                await conn.close()
        except Exception:  # noqa: BLE001
            logger.warning("client email entitlement bypass failed for %s; gating free", norm)
        return Entitlements(plan="free", status="error", audits_per_month=None,
                            monitored_urls=0, min_interval_hours=None)

    def _query():
        with session_scope() as session:
            return resolve_sync(norm, session)

    try:
        return await asyncio.to_thread(_query)
    except Exception:  # noqa: BLE001 - gated to free on resolution failure
        logger.warning("entitlement resolution failed for %s; gating free", norm)
        return Entitlements(plan="free", status="error", audits_per_month=None,
                            monitored_urls=0, min_interval_hours=None)


def _require_premium_monitor(ent) -> None:
    """Free plans (or error-degraded resolution) get no monitors at all."""
    if ent.status == "error" or ent.plan == "free" or (
            ent.monitored_urls is not None and ent.monitored_urls <= 0):
        raise HTTPException(status_code=403, detail={
            "message": "Monitoring is a paid feature",
            "upgrade_url": "/pricing"})


def _reject_plan_cadence(ent, cadence: str) -> None:
    """Explicit rejection beats silent clamping."""
    cadence_hours = {"weekly": 168, "monthly": 720}[cadence]
    if ent.min_interval_hours is not None and cadence_hours < ent.min_interval_hours:
        raise HTTPException(status_code=400, detail={
            "message": "Cadence not available on your plan"})


class AuditRequest(BaseModel):
    url: str
    email: Optional[str] = None
    name: Optional[str] = None
    audit_id: Optional[str] = None
    analytics_consent: bool = False
    analytics_distinct_id: Optional[str] = None
    # Correlation key minted in the browser at form submit and shared by every
    # event in the audit chain, so the funnel can be built on the audit itself
    # rather than on a person identity that is still anonymous at this point.
    analytics_attempt_id: Optional[str] = None
    analytics_journey_id: Optional[str] = None
    source: Optional[str] = None
    partner_id: Optional[str] = None
    monthly_ad_spend: Optional[float] = None


class AuditResponse(BaseModel):
    audit_id: Optional[str]
    url: str
    status: str
    score: Optional[float] = None
    grade: Optional[str] = None
    composite: Optional[float] = None
    composite_anchor: Optional[float] = None
    findings: Optional[list] = None
    dimensions: Optional[dict] = None
    page_title: Optional[str] = None
    page_h1: Optional[str] = None
    error: Optional[str] = None
    # Historical tracking and personalization fields
    historical_data: Optional[dict] = None
    score_trend: Optional[list] = None
    recurring_issues: Optional[list] = None
    effective_fixes: Optional[list] = None
    historical_insights: Optional[dict] = None
    guided_implementation: Optional[dict] = None
    strategic_finding: Optional[str] = None


async def _persist_audit_failed(audit_id) -> None:
    if not audit_id:
        return
    try:
        await audit_db.mark_audit_failed(audit_id)
    except Exception as exc:
        print(f"[audit_api] failed to persist failed status for {audit_id}: {exc}")


async def _crm_audit_completed(email: str, score: int, utm_source: Optional[str] = None) -> None:
    """Non-blocking CRM update after audit completes. Fire-and-forget via asyncio.create_task."""
    try:
        from platform_api.services.crm_hooks import audit_created, audit_completed
        await audit_created(email=email, url="", utm_source=utm_source)
        await audit_completed(email=email, score=score)
    except Exception:
        pass  # never block audit response


@router.post("/accept", response_model=AuditResponse)
async def accept_audit(request: AuditRequest):
    """Persist pending and return immediately. Scoring runs on the worker."""
    from platform_api.services.audit_runner import kick, runner_started

    if not runner_started():
        raise HTTPException(status_code=503, detail="Audit runner unavailable")

    # DATA-6: queue admission control. Rate limiting bounds request rate;
    # admission bounds QUEUED WORK so accepted audits cannot age into silent
    # failure behind a saturated pipeline.
    allowed, reason = await audit_db.check_admission()
    if not allowed:
        retry_after = 60 if reason.startswith("queue_full") else 30
        return JSONResponse(
            status_code=429,
            content={"detail": f"Audit queue {reason} - please retry shortly"},
            headers={"Retry-After": str(retry_after)},
        )

    audit_email = request.email or f"anonymous+{uuid4()}@invalid.nebulacomponents.com"
    attempt_id = (request.analytics_attempt_id or "").strip() or None
    engine_input = {
        "monthly_ad_spend": request.monthly_ad_spend,
        "analytics_consent": request.analytics_consent,
        "analytics_distinct_id": request.analytics_distinct_id,
        "analytics_attempt_id": attempt_id or request.analytics_attempt_id,
        "analytics_journey_id": request.analytics_journey_id,
        "source": request.source,
        "name": request.name,
    }
    if attempt_id:
        existing = await audit_db.find_open_by_attempt_id(attempt_id)
        if existing:
            await kick()
            return AuditResponse(
                audit_id=str(existing.get("id") or existing.get("audit_id")),
                url=existing.get("url") or request.url,
                status=existing.get("status") or "pending",
            )
    try:
        audit_id = await audit_db.create_audit(
            url=request.url,
            email=audit_email,
            name=request.name,
            source=request.source,
            partner_id=request.partner_id,
            engine_input=engine_input,
        )
    except HTTPException:
        raise
    except UniqueViolationError:
        if attempt_id:
            existing = await audit_db.find_open_by_attempt_id(attempt_id)
            if existing:
                await kick()
                return AuditResponse(
                    audit_id=str(existing.get("id") or existing.get("audit_id")),
                    url=existing.get("url") or request.url,
                    status=existing.get("status") or "pending",
                )
        raise HTTPException(status_code=500, detail="Audit processing unavailable")
    except Exception as _exc:
        import logging as _log
        _log.exception("[audit/accept] persist failed: %s", _exc)
        raise HTTPException(status_code=500, detail="Audit processing unavailable")

    await kick()
    return AuditResponse(audit_id=str(audit_id), url=request.url, status="pending")


@router.post("/run", response_model=AuditResponse)
async def run_audit(request: AuditRequest):
    """Compatibility wait path for widget/lab/monitors. Does not block the event loop with subprocess."""
    from platform_api.services.audit_runner import wait_for_result

    accepted = await accept_audit(request)
    try:
        row = await wait_for_result(UUID(accepted.audit_id))
    except TimeoutError:
        raise HTTPException(status_code=504, detail="Audit timed out (120s limit)")
    except HTTPException:
        raise
    except Exception as _exc:
        import logging as _log
        _log.exception("[audit/run] wait failed: %s", _exc)
        raise HTTPException(status_code=500, detail="Audit processing unavailable")

    if row.get("status") == "failed":
        reason = None
        engine_input = row.get("engine_input") or {}
        if isinstance(engine_input, dict):
            reason = engine_input.get("failure_reason")
        if reason == "timeout":
            raise HTTPException(status_code=504, detail="Audit timed out (120s limit)")
        raise HTTPException(status_code=500, detail="Audit processing failed")

    output = row.get("engine_output") if isinstance(row.get("engine_output"), dict) else {}
    return _response_from_row(request, row, output)


def _response_from_row(request: AuditRequest, row: dict, data: dict) -> AuditResponse:
    return AuditResponse(
        audit_id=str(row.get("audit_id") or ""),
        url=row.get("url") or request.url,
        status="completed",
        score=row.get("score") if row.get("score") is not None else data.get("score"),
        grade=row.get("grade") or data.get("grade"),
        composite=row.get("composite") if row.get("composite") is not None else data.get("composite"),
        composite_anchor=(
            row.get("composite_anchor")
            if row.get("composite_anchor") is not None
            else data.get("composite_anchor")
        ),
        findings=row.get("findings") or data.get("findings", []),
        dimensions=data.get("dimensions", {}),
        page_title=data.get("page_title", ""),
        page_h1=data.get("page_h1", ""),
        historical_data=data.get("historical_data"),
        score_trend=(
            data.get("historical_insights", {}).get("score_trend")
            if data.get("historical_insights")
            else None
        ),
        recurring_issues=(
            data.get("historical_data", {}).get("recurring_issues")
            if data.get("historical_data")
            else None
        ),
        effective_fixes=(
            data.get("historical_data", {}).get("effective_fixes")
            if data.get("historical_data")
            else None
        ),
        historical_insights=data.get("historical_insights"),
        guided_implementation=row.get("guided_implementation") or data.get("guided_implementation"),
        strategic_finding=row.get("strategic_finding") or data.get("strategic_finding"),
    )


async def finalize_completed_audit(job: dict, data: dict) -> None:
    """Post-success CRM/email/analytics. Worker-only; never un-completes the row."""
    audit_id = job.get("id")
    audit_email = job.get("email") or ""
    request_url = job.get("url") or ""
    attempt_id = job.get("analytics_attempt_id")
    distinct_id = job.get("analytics_distinct_id") or str(audit_id)
    consent = bool(job.get("analytics_consent") and job.get("analytics_distinct_id"))
    ph = get_posthog()

    asyncio.create_task(_crm_audit_completed(
        email=audit_email,
        score=data.get("score", 0) or 0,
        utm_source=job.get("source"),
    ))

    async def _fire_content_pipeline():
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    "https://n8n.mikeholownych.com/webhook/content-extract",
                    json={
                        "audit_id": str(audit_id),
                        "url": request_url,
                        "findings": data.get("findings", []),
                    },
                )
        except Exception:
            pass

    asyncio.create_task(_fire_content_pipeline())

    # Durable findings sync (workspace overhaul). Additive side effect: a sync
    # failure must never break audit completion, so it is fully guarded.
    try:
        from platform_api.services.findings_sync import sync_findings_for_audit

        sync_dsn = (
            f"host=/var/run/postgresql port=5433 dbname=nebula_audit "
            f"user=postgres"
        )
        sync_result = await asyncio.to_thread(
            sync_findings_for_audit, str(audit_id), sync_dsn
        )
        print(f"[audit_api] findings sync {audit_id}: {sync_result}")
    except Exception as exc:
        print(f"[audit_api] findings sync failed for {audit_id}: {exc}")

    await analytics.track_audit_completed(
        email=distinct_id,
        score=data.get("score", 0),
        grade=data.get("grade", "N/A"),
        audit_id=str(audit_id),
        audit_attempt_id=attempt_id,
        journey_id=job.get("analytics_journey_id"),
        findings_count=len(data.get("findings", []) or []),
    )

    if consent and ph:
        with new_context(client=ph):
            identify_context(distinct_id)
            ph.capture(
                "audit_completed",
                properties={
                    "audit_id": str(audit_id),
                    "audit_attempt_id": attempt_id,
                    "score": data.get("score"),
                    "grade": data.get("grade"),
                    "findings_count": len(data.get("findings", []) or []),
                },
            )

    real_email = (
        audit_email
        and "@invalid" not in audit_email
        and audit_email.strip()
        and audit_email.strip().lower() not in {
            "mike.holownych@gmail.com",
            "mcp-agent@nebula.internal",
            "test@example.com",
            "e2e-crawler-test@example.com",
            "qa-workspace-20260803-001@example.invalid",
        }
    )
    if real_email and data.get("findings"):
        try:
            trigger_track_assignment(
                email=audit_email,
                audit_id=str(audit_id),
                findings=data.get("findings", []),
                url=request_url,
            )
        except Exception as exc:
            print(f"[audit_api] Track assignment failed: {exc}")

    if real_email:
        # RES-5: the result email is a durable side effect, not fire-and-forget.
        # It rides the transactional outbox (channel 'audit_result') so a crash
        # between audit completion and send is retried with backoff instead of
        # silently lost. Delivery marks email_sent_at (drain handler).
        from platform_api.infra.outbox import outbox

        try:
            await outbox.enqueue(
                channel="audit_result",
                recipient=str(audit_email),
                payload={
                    "audit_id": str(audit_id),
                    "url": request_url,
                    "name": job.get("name"),
                    "score": data.get("score", 0),
                    "grade": data.get("grade", "N/A"),
                    "findings": data.get("findings", []),
                    "guided_implementation": data.get("guided_implementation"),
                },
            )
            asyncio.create_task(outbox.drain())
        except Exception as exc:
            print(f"[audit_api] result-email enqueue failed for {audit_id}: {exc}")


class AuditClaimRequest(BaseModel):
    audit_id: str
    email: str


@router.post("/claim", dependencies=[Depends(internal_service_dependency)])
async def claim_audit(body: AuditClaimRequest, request: Request):
    """Link an anonymous/unclaimed audit to an email - INTERNAL_SERVICE.

    Only the Next.js BFF may call this, and only after proving the caller
    controls the email via the HMAC-signed audit-unlock cookie. Anonymous
    public access would let anyone seize or re-bind audit records.

    Returns 200 {"claimed": true, ...} on success.
    Returns 400 if the audit is already owned by a *different* email.
    Returns 404 if audit_id is not found.
    """
    require_internal_service(request)
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")

    try:
        audit_uuid = UUID(body.audit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit_id (must be a UUID)")

    try:
        result = await audit_db.claim_audit(audit_uuid, email)
    except Exception:
        raise HTTPException(status_code=503, detail="Claim unavailable - please try again")

    if result is None:
        raise HTTPException(status_code=404, detail="Audit not found")

    if not result["claimed"]:
        raise HTTPException(
            status_code=400,
            detail="Audit is already claimed by a different email address",
        )

    return result


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "audit-api"}


@router.get("/stats/aggregate")
async def get_aggregate_stats():
    """Real, unfabricated audit volume + average score for the homepage's
    aggregate-proof strip. Must be defined before /{audit_id} - otherwise
    that catch-all route would try (and fail) to parse "stats" as a UUID."""
    try:
        return await audit_db.get_aggregate_stats()
    except Exception:
        raise HTTPException(status_code=503, detail="Stats unavailable")


@router.get("/stats/benchmarks")
async def get_benchmarks():
    """Per-component failure benchmarks from real completed audits.
    Privacy-safe aggregate: component labels, failure counts, avg impact,
    score distribution. Must be defined before /{audit_id}."""
    try:
        return await audit_db.get_benchmarks()
    except Exception:
        raise HTTPException(status_code=503, detail="Benchmarks unavailable")


@router.get("/stats/observatory")
async def get_observatory_stats():
    """Reference statistics for the public /observatory page: score
    percentiles + histogram, condition failure base rates, co-occurrence
    pairs, quadrant mix. Cells below min_cell_n are suppressed server-side.
    Must be defined before /{audit_id}."""
    try:
        return await audit_db.get_observatory_stats()
    except Exception:
        raise HTTPException(status_code=503, detail="Observatory stats unavailable")


# ── Paid analytics: rollups + personal positioning (Phase 3 Task 4) ─────────


def _require_analytics_depth(ent) -> str:
    """analytics_depth 'none' (or error-degraded resolution) gets nothing."""
    depth = getattr(ent, "analytics_depth", None)
    if ent.status == "error" or not depth or depth == "none":
        raise HTTPException(status_code=403, detail={
            "message": "Analytics benchmarks are a paid feature",
            "upgrade_url": "/pricing"})
    return depth


@router.post("/analytics/rollups/refresh",
             dependencies=[Depends(internal_service_dependency)])
async def refresh_benchmark_rollups(request: Request,
                                    days: int = Query(90, ge=1, le=365)):
    """Internal: compute and persist one global benchmark rollup.

    Called hourly by scripts/analytics_cron.sh after the monitors runner."""
    require_internal_service(request)
    try:
        summary = await benchmark_rollups.refresh_rollups(days=days)
    except Exception as e:
        logger.error("benchmark rollup refresh failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Rollup refresh failed")
    return {"status": "ok", **summary}


@router.get("/analytics/benchmarks/me")
async def my_benchmark_position(
        domain: str = Query(..., min_length=4, max_length=255),
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ))):
    """Personal percentile position against the corpus for one of my domains.

    Composite percentile interpolates my latest completed audit's score
    against the stored p25/p50/p75/p90; each signal is a pass/fail marker
    against the corpus pass rate. Gated by plan analytics_depth."""
    email = bind_email(principal, None)
    ent = await resolve_for_email(email)
    depth = _require_analytics_depth(ent)

    from platform_api.services.domains import registered_domain
    dom = registered_domain(domain)
    if dom is None:
        raise HTTPException(status_code=400, detail="Bad domain")

    mine = await benchmark_rollups.latest_completed_audit_for_domain(email, dom)
    if mine is None:
        raise HTTPException(status_code=404,
                            detail="No completed audit for this domain")

    rollup = await benchmark_rollups.latest_rollup()
    if rollup is None:
        raise HTTPException(status_code=503,
                            detail="No benchmark rollup available yet")

    overall = benchmark_rollups.interpolate_percentile(
        rollup["composite"], mine.get("score"))
    corpus_signals = rollup["signals"]
    yours = extract_signal_map(mine.get("engine_output"))
    signals = {
        key: {
            "you_pass": bool(passed),
            "corpus_ok_rate": (corpus_signals.get(key) or {}).get("ok_rate"),
        }
        for key, passed in sorted(yours.items())
    }
    computed_at = rollup.get("computed_at")
    return {
        "overall_percentile": overall,
        "computed_at": computed_at.isoformat() if computed_at else None,
        "signals": signals,
        "depth": depth,
    }


# ── Paid analytics: sequenced remediation programs (Phase 3 Task 5) ─────────


def _require_paid_plan(ent) -> None:
    """Programs are a paid surface: free plans (or error-degraded
    resolution, which counts as free) get nothing."""
    if ent.status == "error" or ent.plan == "free":
        raise HTTPException(status_code=403, detail={
            "message": "Remediation programs are a paid feature",
            "upgrade_url": "/pricing"})


@router.get("/analytics/program")
async def get_remediation_program(
        domain: str = Query(..., min_length=4, max_length=255),
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ))):
    """Two-stage remediation roadmap for one of my domains.

    Returns-or-creates the active program; completion is derived live from
    recommendation states and implemented fixes, and the open steps are
    regenerated from the current backlog while done/verified/dismissed
    history is preserved."""
    email = bind_email(principal, None)
    ent = await resolve_for_email(email)
    _require_paid_plan(ent)

    from platform_api.services.domains import registered_domain
    dom = registered_domain(domain)
    if dom is None:
        raise HTTPException(status_code=400, detail="Bad domain")

    try:
        await audit_db.connect()
        return await programs.get_or_create_program(email, dom,
                                                    audit_db.pool)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("program fetch failed for %s/%s: %s", email, dom, e,
                     exc_info=True)
        raise HTTPException(status_code=503, detail="Program unavailable")


@router.post("/analytics/program/steps/{step_id}/dismiss")
async def dismiss_program_step(step_id: str,
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE))):
    """Dismiss a program step. Owner-gated: the step's program must belong
    to the principal's workspace email."""
    own = (principal.workspace_email or principal.email or "").strip().lower()
    try:
        UUID(step_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid step ID")
    try:
        await audit_db.connect()
        async with audit_db.pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT ps.id AS step_id, p.email AS owner_email
                   FROM program_steps ps JOIN programs p ON p.id = ps.program_id
                   WHERE ps.id=$1""", UUID(step_id))
            if not row or (row["owner_email"] or "").strip().lower() != own:
                raise HTTPException(status_code=404, detail="Step not found")
            await conn.execute(
                "UPDATE program_steps SET status='dismissed',"
                " updated_at=now() WHERE id=$1", UUID(step_id))
        return {"id": step_id, "status": "dismissed"}
    except HTTPException:
        raise
    except Exception:
        logger.error("step dismiss failed for %s", step_id, exc_info=True)
        raise HTTPException(status_code=503, detail="Dismiss failed")


# ── Paid analytics: funnel orchestrator (Phase 3 Task 6) ────────────────────


class FunnelRunRequest(BaseModel):
    domain: str


def _iso(value) -> Optional[str]:
    """Serialize datetime-or-string timestamps without assuming a type."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


@router.post("/funnel/runs")
async def create_funnel_run(body: FunnelRunRequest,
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE))):
    """Start a funnel run for one of my domains (session-gated).

    Free plans get exactly one lifetime teaser run capped at
    TEASER_FUNNEL_URLS; paid plans are bounded per calendar month by
    funnel_runs_per_month with fan-out capped at funnel_urls_per_run.
    Discovery failure persists a failed run with the reason in
    scorecard.error and still answers 200."""
    email = bind_email(principal, None)
    from platform_api.services import funnel
    dom = funnel.normalize_domain(body.domain)
    if dom is None:
        raise HTTPException(status_code=400, detail="Bad domain")
    ent = await resolve_for_email(email)
    try:
        await audit_db.connect()
        return await funnel.create_run(email, dom, ent, audit_db.pool)
    except HTTPException:
        raise
    except UniqueViolationError:
        raise HTTPException(status_code=409, detail={
            "message": "A run is already active for this domain"})
    except Exception as e:
        logger.error("funnel run create failed for %s/%s: %s", email, dom, e,
                     exc_info=True)
        raise HTTPException(status_code=503, detail="Funnel unavailable")


@router.get("/funnel/runs")
async def get_latest_funnel_run(
        domain: str = Query(..., min_length=4, max_length=255),
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ))):
    """Latest funnel run for my domain with scorecard + pages summary."""
    email = bind_email(principal, None)
    from platform_api.services import funnel
    dom = funnel.normalize_domain(domain)
    if dom is None:
        raise HTTPException(status_code=400, detail="Bad domain")
    try:
        await audit_db.connect()
        async with audit_db.pool.acquire() as conn:
            run = await conn.fetchrow(
                """SELECT id, domain, status, requested_count,
                          discovered_count, plan_snapshot, scorecard,
                          coverage_pct, created_at, completed_at
                   FROM funnel_runs WHERE email=$1 AND domain=$2
                   ORDER BY created_at DESC LIMIT 1""", email, dom)
            if run is None:
                raise HTTPException(status_code=404,
                                    detail="No funnel run for this domain")
            pages = await conn.fetch(
                """SELECT fp.url AS url,
                          CASE WHEN fp.status IN ('done','failed')
                               THEN fp.status
                               WHEN a.status='completed' THEN 'done'
                               WHEN a.status='failed' THEN 'failed'
                               ELSE fp.status END AS status,
                          COALESCE(a.score, fp.score) AS score
                   FROM funnel_pages fp
                   LEFT JOIN audits a ON a.id = fp.audit_id
                   WHERE fp.run_id=$1 ORDER BY fp.created_at""", run["id"])
        scorecard = run["scorecard"]
        if isinstance(scorecard, str):
            try:
                scorecard = json.loads(scorecard)
            except json.JSONDecodeError:
                scorecard = None
        return {
            "run": {
                "id": str(run["id"]),
                "domain": run["domain"],
                "status": run["status"],
                "requested_count": run["requested_count"],
                "discovered_count": run["discovered_count"],
                "plan": run["plan_snapshot"],
                "scorecard": scorecard,
                "coverage_pct": (
                    float(run["coverage_pct"])
                    if run["coverage_pct"] is not None else None),
                "created_at": _iso(run["created_at"]),
                "completed_at": _iso(run["completed_at"]),
            },
            "pages": [
                {"url": p["url"], "status": p["status"],
                 "score": float(p["score"]) if p["score"] is not None else None}
                for p in pages
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("funnel run lookup failed for %s/%s: %s", email, dom, e,
                     exc_info=True)
        raise HTTPException(status_code=503, detail="Funnel unavailable")


@router.post("/funnel/sweep",
             dependencies=[Depends(internal_service_dependency)])
async def funnel_sweep(request: Request):
    """Internal: reconcile funnel page states from their audits and finalize
    every fully-terminal running run. Called hourly by analytics_cron.sh
    after the rollups refresh."""
    require_internal_service(request)
    try:
        from platform_api.services import funnel
        await audit_db.connect()
        processed = await funnel.sweep_completed(audit_db.pool)
    except Exception as e:
        logger.error("funnel sweep failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Funnel sweep failed")
    return {"status": "ok", "processed": processed}


@router.get("/stats/recent-finding")
async def get_recent_finding():
    """Return the highest-impact finding from the most recent completed audit.
    Used for the homepage's 'recent finding' strip. No URL is exposed - only
    label, issue summary, impact score, and relative time. Must be defined
    before /{audit_id} so the router doesn't parse 'stats' as a UUID."""
    try:
        result = await audit_db.get_recent_finding()
        if result is None:
            raise HTTPException(status_code=404, detail="No recent findings available")
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Recent finding unavailable")


# ── Fix Implementation Library ─────────────────────────────────────────────────────

@router.get("/fix-library")
async def get_fix_library(limit: int = Query(10, ge=1, le=50)):
    """Get the fix implementation library showing effectiveness of different fixes.
    Returns top fixes ordered by success rate and average score improvement.
    Used for social proof in audit emails and the browseable fix library."""
    try:
        fixes = await audit_db.get_fix_effectiveness(limit=limit)
        return {"fixes": fixes}
    except Exception as e:
        err = str(e)
        # Table not yet created — return empty gracefully
        if "does not exist" in err or "UndefinedTable" in type(e).__name__:
            return {"fixes": []}
        raise HTTPException(status_code=503, detail="Fix library unavailable")


@router.get("/fix-effectiveness")
async def get_fix_effectiveness(finding_key: str = Query(..., min_length=1, max_length=100)):
    """Get effectiveness statistics for a specific fix.
    Returns detailed data about how well a particular fix performs."""
    try:
        effectiveness = await audit_db.get_fix_effectiveness(finding_key=finding_key)
        if not effectiveness:
            # Return empty result with zero values if no data yet
            return {
                "finding_key": finding_key,
                "label": finding_key.replace('_', ' ').title(),
                "total_attempts": 0,
                "successful_implementations": 0,
                "avg_score_improvement": 0.0,
                "positive_outcomes": 0,
                "success_rate_percentage": 0.0
            }
        return effectiveness[0]  # Return the first (and only) item
    except Exception:
        raise HTTPException(status_code=503, detail="Fix effectiveness unavailable")


@router.get("/fix-history")
async def get_fix_history(email: str = Query(..., min_length=3, max_length=320),
                         limit: int = Query(10, ge=1, le=100),
                         principal: Principal = Depends(require_principal(SCOPE_FIXES_READ))):
    """Get fix implementation history for a specific user.
    Shows what fixes the user has attempted and their outcomes."""
    email = bind_email(principal, email)
    try:
        # Validate email format
        import re
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        history = await audit_db.get_user_fix_history(email=email, limit=limit)
        return {"email": email, "history": history}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Fix history unavailable")


@router.get("/quota")
async def get_audit_quota(email: str = Query(..., min_length=3, max_length=320),
                          request: Request = None):
    """Completed-audit count this UTC month from nebula_audit.

    INTERNAL_SERVICE: consumed by the portal's server-side quota gate.
    Must be defined before /{audit_id}.
    """
    require_internal_service(request)
    import re
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    try:
        completed = await audit_db.count_completed_this_month(email)
        return {
            "email": email.strip().lower(),
            "completed_this_month": completed,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Quota lookup unavailable")


@router.get("/by-email")
async def get_audits_by_email(email: str = Query(..., min_length=3, max_length=320),
    principal: Principal = Depends(require_principal(SCOPE_AUDIT_READ)),):
    """List all audits for a workspace email - powers the Customer Workspace
    (dashboard, projects, immutable audit history). Each row is a version of
    that URL at a point in time. Must be defined before /{audit_id}."""
    email = bind_email(principal, email)
    import re
    # Reject malformed emails early - must contain @ with a dot after it
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    try:
        audits = await audit_db.get_audits_by_email(email, limit=200)
        # findings payloads are heavy; lighten the list for the workspace
        for a in audits:
            a.pop("findings", None)
            if a.get("score") is not None:
                a["score"] = a["score"] / 10.0
        return {"email": email, "audits": audits}
    except Exception:
        raise HTTPException(status_code=503, detail="Workspace audit list unavailable")


def get_audit_db():
    """Accessor indirection for the AuditDB singleton (patchable in tests)."""
    return audit_db


@router.get("/by-domain", dependencies=[Depends(internal_service_dependency)])
async def audits_by_domain(domain: str, email: str):
    """Whole-domain audit attach for claimed teardowns.

    Returns audits across every URL of the registered domain, but only for
    the active claimant of that domain's teardown (or a founder). Row shape
    matches /audit/by-email (score normalized to 0-10)."""
    from platform_api.services.domains import registered_domain
    from platform_api.routes.teardown_claim_routes import FOUNDER_EMAILS
    dom = registered_domain(domain)
    if dom is None:
        raise HTTPException(status_code=400, detail="Bad domain")
    claim = await get_teardown_db().get_active_claim_by_domain(dom)
    allowed = claim and (
        claim["claimed_by_email"] == email.strip().lower()
        or email.strip().lower() in FOUNDER_EMAILS)
    if not allowed:
        raise HTTPException(status_code=403, detail="Not the verified owner")
    rows = await get_audit_db().list_audits_by_domain(dom)
    for a in rows:
        if a.get("score") is not None:
            a["score"] = a["score"] / 10.0
    return {"audits": rows}


class MarkImplementedBody(BaseModel):
    audit_id: UUID
    finding_key: str


@router.post("/fixes/mark-implemented")
async def mark_implemented(body: MarkImplementedBody,
                           current_user: dict = Depends(get_current_user)):
    """Session-authenticated write path into fix_implementations.

    Authorization: caller owns the audit's registered domain via an active
    teardown claim, or owns the audit row itself (audits.email match)."""
    from platform_api.services.domains import registered_domain
    email = (current_user["user"].email or "").strip().lower()
    rec = await get_audit_db().get_audit(body.audit_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    aud_dom = registered_domain(rec["url"])
    claim = await get_teardown_db().get_active_claim_by_domain(aud_dom) if aud_dom else None
    audit_email = (rec.get("email") or "").strip().lower()
    owns = (audit_email == email) or bool(
        claim and claim["claimed_by_email"] == email)
    if not owns:
        raise HTTPException(status_code=403, detail="Not your audit or domain")
    try:
        row = await get_audit_db().mark_finding_implemented(
            body.audit_id, email, body.finding_key)
    except ValueError:
        # Service raises this only when the audit exists but has no score
        # (pending/failed run). The 404 branch above already handled missing.
        raise HTTPException(status_code=409, detail="Audit not scored yet")
    return row


class RecommendationUpdate(BaseModel):
    status: str


@router.get("/recommendations")
async def list_recommendations(email: str = Query(..., min_length=3, max_length=320),
    principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ)),):
    """Sync + return the recommendation kanban for a workspace email.
    Derives cards from completed audits (upsert preserving statuses) and
    auto-verifies items a newer audit no longer flags. Must be defined
    before /{audit_id}."""
    email = bind_email(principal, email)
    try:
        recs = await audit_db.sync_recommendations(email)
        return {"email": email, "recommendations": recs}
    except Exception as e:
        logger.error(f"Failed to sync recommendations for {email}: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Recommendations unavailable")


@router.patch("/recommendations/{rec_id}")
async def update_recommendation(rec_id: str, body: RecommendationUpdate,
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE))):
    """Move a recommendation between kanban columns (to_fix / doing / done).
    Ownership: the recommendation must belong to an audit owned by the principal."""
    if body.status not in ("to_fix", "doing", "done"):
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        from uuid import UUID

        UUID(rec_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation ID")
    try:
        own = (principal.workspace_email or principal.email or "").strip().lower()
        rec = await audit_db.update_recommendation_status(rec_id, body.status, email=own)
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        return rec
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update recommendation {rec_id}: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Recommendation update failed")


class LabExperimentCreate(BaseModel):
    email: str
    url: str
    label: str
    score: float
    grade: Optional[str] = None
    components: Optional[dict] = None
    adCopy: Optional[str] = None


class LabExperimentUpdate(BaseModel):
    status: str


async def lab_experiment_auth(
    request: Request,
) -> Principal:
    """Accept either INTERNAL_SERVICE or workspace principal for lab experiments."""
    try:
        require_internal_service(request)
        email = request.query_params.get("email")
        return Principal(
            principal_type="internal",
            principal_id="internal-service",
            workspace_email=email.strip().lower() if email else None,
            scopes=frozenset({
                SCOPE_WORKSPACE_READ,
                SCOPE_WORKSPACE_WRITE,
            }),
        )
    except HTTPException:
        pass
    return await require_principal(SCOPE_WORKSPACE_READ)(request)


async def timeline_auth(
    request: Request,
) -> Principal:
    """Accept either INTERNAL_SERVICE or workspace principal for activity timeline."""
    try:
        require_internal_service(request)
        email = request.query_params.get("email")
        return Principal(
            principal_type="internal",
            principal_id="internal-service",
            workspace_email=email.strip().lower() if email else None,
            scopes=frozenset({SCOPE_WORKSPACE_READ}),
        )
    except HTTPException:
        pass
    return await require_principal(SCOPE_WORKSPACE_READ)(request)


@router.get("/lab-experiments")
async def list_lab_experiments(email: str = Query(..., min_length=3, max_length=320),
    principal: Principal = Depends(lab_experiment_auth),):
    """List saved Component Lab experiments for a workspace email (newest first)."""
    email = bind_email(principal, email)
    try:
        exps = await audit_db.list_lab_experiments(email)
        return {"email": email, "experiments": exps}
    except Exception:
        raise HTTPException(status_code=503, detail="Experiments unavailable")


@router.post("/lab-experiments")
async def create_lab_experiment(body: LabExperimentCreate,
        principal: Principal = Depends(lab_experiment_auth)):
    """Save a lab run as an experiment in the workspace (tenant-bound)."""
    body.email = bind_email(principal, body.email)
    email = body.email.strip().lower()
    if len(email) < 3 or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    label = body.label.strip()[:200]
    if not label:
        raise HTTPException(status_code=400, detail="Label required")
    url = body.url.strip()[:2048]
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Valid URL required")
    if not (0 <= body.score <= 10):
        raise HTTPException(status_code=400, detail="Score must be 0-10")
    try:
        exp = await audit_db.create_lab_experiment(
            email, url, label, body.score, body.grade,
            body.components or {}, body.adCopy,
        )
        return exp
    except Exception:
        raise HTTPException(status_code=503, detail="Experiment save failed")


@router.patch("/lab-experiments/{exp_id}")
async def update_lab_experiment(exp_id: str, body: LabExperimentUpdate,
        principal: Principal = Depends(lab_experiment_auth)):
    """Mark an experiment as production (or back to saved). Tenant-owned only."""
    if body.status not in ("saved", "production"):
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        from uuid import UUID

        UUID(exp_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid experiment ID")
    try:
        exp = await audit_db.update_lab_experiment_status(exp_id, body.status)
        if not exp:
            raise HTTPException(status_code=404, detail="Experiment not found")
        owner = (exp.get("email") or "").strip().lower() if isinstance(exp, dict) else ""
        own = (principal.workspace_email or principal.email or "").strip().lower()
        if not owner or owner != own:
            raise HTTPException(status_code=404, detail="Experiment not found")
        return exp
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Experiment update failed")


@router.get("/timeline")
async def get_activity_timeline(email: str = Query(..., min_length=3, max_length=320),
    principal: Principal = Depends(timeline_auth),):
    """Aggregate activity timeline for a workspace email.
    Combines audit completions, recommendation status changes, and monitor run events,
    sorted by created_at DESC, limited to 100 events."""
    email = bind_email(principal, email)
    try:
        events: list[dict] = []

        # 1. Audit completions
        audits = await audit_db.get_audits_by_email(email, limit=100)
        for a in audits:
            if a.get("status") != "completed":
                continue
            score = a.get("score")
            if score is not None:
                score = score / 10.0  # normalise to 0-10
            events.append({
                "type": "audit_completed",
                "created_at": a.get("completed_at") or a.get("created_at"),
                "url": a.get("url"),
                "score": score,
                "grade": a.get("grade"),
                "audit_id": a.get("id"),
            })

        # 2. Recommendation status changes (dedupe by id, skip default 'to_fix' state)
        try:
            await audit_db.connect()
            async with audit_db.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, audit_id, url, label, status, updated_at
                    FROM recommendations
                    WHERE email = $1
                      AND updated_at IS DISTINCT FROM created_at
                    ORDER BY updated_at DESC
                    LIMIT 200
                    """,
                    email,
                )
                seen_rec_ids: set[str] = set()
                for r in rows:
                    rid = str(r["id"])
                    if rid in seen_rec_ids:
                        continue
                    seen_rec_ids.add(rid)
                    events.append({
                        "type": "recommendation_updated",
                        "created_at": r["updated_at"].isoformat() if r.get("updated_at") else None,
                        "url": r.get("url"),
                        "label": r.get("label"),
                        "status": r.get("status"),
                        "audit_id": str(r["audit_id"]) if r.get("audit_id") else None,
                    })
        except Exception:
            pass  # recommendations are best-effort

        # 3. Monitor run events
        monitors = await audit_db.list_monitors(email)
        for m in monitors:
            monitor_events = await audit_db.list_monitor_events(m["id"], limit=50)
            for e in monitor_events:
                events.append({
                    "type": "monitor_run",
                    "created_at": e.get("created_at"),
                    "url": m.get("url"),
                    "status": e.get("status"),
                    "prev_score": e.get("prev_score"),
                    "new_score": e.get("new_score"),
                    "summary": e.get("summary"),
                })

        # Sort by created_at DESC, put None last
        def _sort_key(ev: dict):
            ca = ev.get("created_at")
            if ca is None:
                return (1, "")  # Put None at the end
            if isinstance(ca, str):
                return (0, ca)  # Strings sort before (1, "")
            return (0, ca.isoformat())  # Convert datetime to comparable string

        events.sort(key=_sort_key, reverse=True)
        events = events[:100]

        return {"email": email, "events": events}
    except Exception:
        raise HTTPException(status_code=503, detail="Timeline unavailable")


@router.delete("/lab-experiments/{exp_id}")
async def delete_lab_experiment(exp_id: str,
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE))):
    """Delete a saved experiment. Tenant-owned only."""
    own = (principal.workspace_email or principal.email or "").strip().lower()
    await audit_db.connect()
    async with audit_db.pool.acquire() as conn:
        row = await conn.fetchrow("SELECT email FROM lab_experiments WHERE id=$1", __import__('uuid').UUID(exp_id))
    if not row or (row["email"] or "").strip().lower() != own:
        raise HTTPException(status_code=404, detail="Experiment not found")
    try:
        from uuid import UUID

        UUID(exp_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid experiment ID")
    try:
        deleted = await audit_db.delete_lab_experiment(exp_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Experiment not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Experiment delete failed")


# ── Monitoring ────────────────────────────────────────────────────────

class MonitorCreate(BaseModel):
    email: str
    url: str
    cadence: Optional[str] = "weekly"


class MonitorUpdate(BaseModel):
    cadence: Optional[str] = None
    active: Optional[bool] = None


@router.get("/monitors")
async def list_monitors(email: str = Query(..., min_length=3, max_length=320),
    principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ)),):
    """List monitoring watches for a workspace email."""
    email = bind_email(principal, email)
    try:
        monitors = await audit_db.list_monitors(email)
        # Attach recent events per monitor
        for m in monitors:
            m["events"] = await audit_db.list_monitor_events(m["id"], limit=10)
        return {"monitors": monitors}
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor list failed")


@router.post("/monitors")
async def create_monitor(body: MonitorCreate,
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE))):
    """Create a monitoring watch (weekly by default). Idempotent per (email, url)."""
    body.email = bind_email(principal, body.email)
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    url = body.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Valid URL required")
    cadence = body.cadence or "weekly"
    if cadence not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="Cadence must be weekly or monthly")
    try:
        ent = await resolve_for_email(email)
        _require_premium_monitor(ent)
        if ent.monitored_urls is not None:
            current = await audit_db.count_monitors(email)
            already = await audit_db.list_monitors(email)
            has_this = any(m.get("url") == url for m in already)
            if not has_this and current >= ent.monitored_urls:
                raise HTTPException(status_code=429, detail={
                    "message": "Plan limit reached",
                    "limit": ent.monitored_urls})
        _reject_plan_cadence(ent, cadence)
        monitor = await audit_db.create_monitor(email, url, cadence)
        if not monitor:
            raise HTTPException(status_code=500, detail="Monitor create failed")
        return monitor
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor create failed")


@router.patch("/monitors/{monitor_id}")
async def update_monitor(monitor_id: str, body: MonitorUpdate,
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE))):
    """Update cadence or pause/resume a monitor. Tenant-owned only."""
    own = (principal.workspace_email or principal.email or "").strip().lower()
    existing = await audit_db.get_monitor(monitor_id) if hasattr(audit_db, "get_monitor") else None
    if existing is not None:
        mown = (existing.get("email") or "").strip().lower() if isinstance(existing, dict) else ""
        if not mown or mown != own:
            raise HTTPException(status_code=404, detail="Monitor not found")
    if body.cadence is not None and body.cadence not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="Cadence must be weekly or monthly")
    ent = await resolve_for_email(own)
    _require_premium_monitor(ent)
    if body.cadence is not None:
        _reject_plan_cadence(ent, body.cadence)
    try:
        monitor = await audit_db.update_monitor(monitor_id, body.cadence, body.active)
        if not monitor:
            raise HTTPException(status_code=404, detail="Monitor not found")
        mown = (monitor.get("email") or "").strip().lower() if isinstance(monitor, dict) else ""
        if not mown or mown != own:
            raise HTTPException(status_code=404, detail="Monitor not found")
        return monitor
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor update failed")


@router.delete("/monitors/{monitor_id}")
async def delete_monitor(monitor_id: str,
        principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE))):
    """Remove a monitoring watch. Tenant-owned only."""
    own = (principal.workspace_email or principal.email or "").strip().lower()
    await audit_db.connect()
    async with audit_db.pool.acquire() as conn:
        row = await conn.fetchrow("SELECT email FROM monitors WHERE id=$1", __import__('uuid').UUID(monitor_id))
    if not row or (row["email"] or "").strip().lower() != own:
        raise HTTPException(status_code=404, detail="Monitor not found")
    try:
        deleted = await audit_db.delete_monitor(monitor_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Monitor not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor delete failed")


@router.post("/monitors/run-due", dependencies=[Depends(internal_service_dependency)])
async def run_due_monitors(request: Request):
    """Internal runner: audit every due monitor, record events, return alerts.

    Called by the Hermes cron watchdog. Alerts are produced only for
    meaningful movement (>= 4 points /100) or new critical findings; the
    cron prints them only when non-empty (silent otherwise).
    """
    require_internal_service(request)
    try:
        due = await audit_db.get_due_monitors()
    except Exception:
        raise HTTPException(status_code=503, detail="Due monitor lookup failed")

    alerts: list[str] = []
    for monitor in due:
        monitor_id = monitor["id"]
        email = monitor["email"]
        url = monitor["url"]
        try:
            prev = await audit_db.get_latest_completed_audit(email, url)
            prev_score = prev["score"] if prev else None
            prev_id = prev["id"] if prev else None

            result = await run_audit(AuditRequest(url=url, email=email))
            if result.status != "completed" or result.score is None:
                raise RuntimeError(result.error or "audit did not complete")

            # Engine returns score on 0–10; the audits table stores 0–100
            # (update_audit persists int(score * 10)). Normalize to 0–100
            # here so events and monitor.last_score stay on the UI scale.
            new_score = result.score * 10
            new_audit_id = str(result.audit_id) if result.audit_id else None

            # New critical finding detection: compare finding keys with
            # impact >= 8 against the previous completed audit.
            new_critical = False
            if prev_id:
                prev_detail = await audit_db.get_audit(UUID(prev_id))
                prev_keys = set()
                if prev_detail and prev_detail.get("findings"):
                    prev_keys = {
                        f.get("key") for f in prev_detail["findings"]
                        if f.get("impact", 0) >= 8
                    }
                new_keys = set()
                if result.findings:
                    new_keys = {
                        f.get("key") for f in result.findings
                        if f.get("impact", 0) >= 8
                    }
                new_critical = bool(new_keys - prev_keys)

            delta = (new_score - prev_score) if prev_score is not None else None
            prev_disp = prev_score if prev_score is not None else 0.0
            if prev_score is None:
                status = "no_change"
                summary = f"Baseline audit complete - score {new_score:.0f}/100"
            elif new_critical and (delta is None or delta < 4):
                status = "new_fail"
                summary = f"New critical finding - score {prev_score:.0f} → {new_score:.0f}"
            elif delta is not None and delta <= -4:
                status = "regressed"
                summary = f"Score dropped {prev_score:.0f} → {new_score:.0f} ({delta:+.0f} pts)"
            elif delta is not None and delta >= 4:
                status = "improved"
                summary = f"Score improved {prev_score:.0f} → {new_score:.0f} ({delta:+.0f} pts)"
            else:
                status = "no_change"
                summary = f"No material change - {new_score:.0f}/100"

            await audit_db.create_monitor_event(
                monitor_id, UUID(new_audit_id) if new_audit_id else None,
                status, prev_score, new_score, summary,
            )
            await audit_db.mark_monitor_ran(monitor_id, new_score)

            points = new_score - prev_disp
            if status == "regressed":
                alerts.append(
                    f"📉 Nebula Monitor - {url}\n"
                    f"{round(prev_disp)} → {round(new_score)} ({points:+.0f} pts) · {email}"
                )
                asyncio.create_task(_send_monitor_alert_email(
                    email, url, status, prev_score, new_score, summary))
            elif status == "new_fail":
                alerts.append(
                    f"🚨 Nebula Monitor - {url}\n"
                    f"New critical finding · {round(new_score)}/100 · {email}"
                )
                asyncio.create_task(_send_monitor_alert_email(
                    email, url, status, prev_score, new_score, summary))
            elif status == "improved":
                alerts.append(
                    f"📈 Nebula Monitor - {url}\n"
                    f"{round(prev_disp)} → {round(new_score)} ({points:+.0f} pts) · {email}"
                )
        except Exception as exc:
            await audit_db.create_monitor_event(
                monitor_id, None, "error", None, None,
                f"Run failed: {str(exc)[:200]}",
            )
            # Push next run out a day so a transient failure doesn't retry
            # every cron tick; still alert once so it is visible.
            await audit_db.mark_monitor_ran(monitor_id, None)
            alerts.append(
                f"⚠️ Nebula Monitor - {url}\nRun failed: {str(exc)[:120]} · {email}"
            )

    return {"checked": len(due), "alerts": alerts}


async def _send_monitor_alert_email(email: str, url: str, status: str,
                                    prev_score: float, new_score: float, summary: str) -> None:
    """Fire-and-forget email notification for monitor regression/new_fail events."""
    try:
        if status == "new_fail":
            subject = f"Nebula alert: new critical issue on {url}"
        else:
            subject = f"Nebula alert: {url} score dropped"
        body = (
            f"Your Nebula monitor detected a change on {url}.\n\n"
            f"{summary}\n\n"
            f"Score: {round(prev_score)}/100 → {round(new_score)}/100\n\n"
            f"View your workspace: https://nebulacomponents.com/workspace\n\n"
            f"- Nebula Components"
        )
        from agentmail_client import AgentMailClient
        client = AgentMailClient()
        client.send(
            to=[email],
            subject=subject,
            text=body,
        )
    except Exception:
        pass  # Never let email failures break the monitor run


@router.get("/by-share-token")
async def get_audit_by_share_token_endpoint(token: str):
    """Return full audit data for a valid share token. Used by the shareable client portal."""
    if not token or len(token) > 200:
        raise HTTPException(status_code=400, detail="Invalid token")
    try:
        data = await audit_db.get_audit_by_share_token(token)
    except Exception:
        raise HTTPException(status_code=503, detail="Service unavailable")
    if data is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return data


@router.get("/badges")
async def get_badges_by_email(email: str,
                              principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ))):
    """Return all earned badges for a given email address (tenant-bound)."""
    email = bind_email(principal, email)
    try:
        await audit_db.connect()
        async with audit_db.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT b.*, a.url
                FROM badges b
                JOIN audits a ON b.after_audit_id = a.id
                WHERE a.email = $1
                ORDER BY b.earned_at DESC
                """,
                email,
            )

        badges = [dict(row) for row in rows]
        # Serialize UUIDs and datetimes
        for badge in badges:
            for k, v in list(badge.items()):
                if hasattr(v, 'isoformat'):
                    badge[k] = v.isoformat()
                elif type(v).__name__ == 'UUID':
                    badge[k] = str(v)
        return {"badges": badges}
    except Exception:
        raise HTTPException(status_code=500, detail="Badge lookup unavailable")


# ── AI Assistant endpoint ─────────────────────────────────────────────────────

from datetime import datetime, timezone


class AssistantRequest(BaseModel):
    email: str
    question: str
    audit_context: str = ""
    has_audits: bool = False


@router.post("/assistant")
async def workspace_assistant(body: AssistantRequest,
        principal: Principal = Depends(require_principal(SCOPE_AGENT_EXECUTE))):
    """Answer workspace questions grounded in the user's audit data.
    Uses OpenRouter (Claude Sonnet) for cost-effective, fast responses."""
    if getattr(body, "email", None):
        body.email = bind_email(principal, body.email)
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not openrouter_key:
        # Fallback: read from ~/.hermes/.env
        hermes_env = Path.home() / ".hermes" / ".env"
        if hermes_env.exists():
            for line in hermes_env.read_text().splitlines():
                if line.startswith("OPENROUTER_API_KEY=") and not line.startswith("#"):
                    openrouter_key = line.split("=", 1)[1].strip()
                    break
    if not openrouter_key:
        raise HTTPException(status_code=503, detail="LLM unavailable")

    system_prompt = (
        "You are the Nebula workspace assistant. You answer questions about "
        "landing page conversion audits. You are concise, specific, and actionable. "
        "Every answer must reference the user's actual audit data provided below. "
        "Never invent findings that aren't in the data. If the data doesn't contain "
        "enough information to answer, say so clearly.\n\n"
        "Format: Use markdown. Bold key recommendations. Keep answers under 200 words "
        "unless the user asks for detail."
    )

    user_message = body.question
    if body.has_audits and body.audit_context:
        user_message = (
            f"My audit data:\n\n{body.audit_context}\n\n"
            f"Question: {body.question}"
        )
    elif not body.has_audits:
        user_message = (
            f"I haven't run any audits yet. Question: {body.question}\n\n"
            "If the answer requires audit data, tell me to run an audit first."
        )

    llm_breaker = CircuitBreaker("openrouter_assistant", failure_threshold=5, recovery_timeout_seconds=30)

    async def call_llm():
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "anthropic/claude-sonnet-4-6",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 600,
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    try:
        answer = await llm_breaker(call_llm)()
        return {"answer": answer}
    except CircuitOpenError:
        raise HTTPException(status_code=503, detail="LLM temporarily unavailable - circuit open")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM timeout")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")


# ── Team endpoint ────────────────────────────────────────────────────────────


@router.get("/team")
async def get_team(email: str = Query(..., description="User email"),
                   principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ))):
    """Return team members for a given workspace email.
    Must be defined before /{audit_id} so the router does not parse 'team' as a UUID."""
    email = bind_email(principal, email)
    if not email:
        raise HTTPException(status_code=400, detail="email is required")

    await audit_db.connect()
    try:
        async with audit_db.pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT member_email, role, invitation_status, invited_at, joined_at
                   FROM workspace_members
                   WHERE workspace_email = $1
                   ORDER BY invited_at ASC""",
                email.strip().lower(),
            )
    except Exception:
        rows = []

    members = [
        {
            "email": email,
            "role": "owner",
            "joinedAt": datetime.now(timezone.utc).isoformat(),
        }
    ]
    for row in rows:
        members.append({
            "email": row["member_email"],
            "role": row["role"],
            "invitationStatus": row["invitation_status"],
            "invitedAt": row["invited_at"].isoformat() if row["invited_at"] else None,
            "joinedAt": row["joined_at"].isoformat() if row["joined_at"] else None,
        })

    return {"email": email, "members": members}


# ── Widget partners (Play 4: agencies as distribution layer) ────────────────
# Declared BEFORE the /{audit_id} catch-all - same 422-as-UUID rule as /stats/*.

class CreatePartnerRequest(BaseModel):
    partner_id: str
    name: str
    email: Optional[str] = None
    domains: List[str] = []
    plan: str = "agency"
    status: str = "active"


@router.post("/partners", dependencies=[Depends(internal_service_dependency)])
async def create_partner_route(req: CreatePartnerRequest, request: Request):
    require_internal_service(request)
    """Create a widget partner (called by Stripe webhook on $497 purchase).

    Internal only - not exposed to the public internet (Next.js calls this
    server-side from the webhook handler via PLATFORM_API_URL).
    """
    created = await audit_db.create_partner(
        partner_id=req.partner_id,
        name=req.name,
        domains=req.domains,
        email=req.email,
        plan=req.plan,
        status=req.status,
    )
    if not created:
        # Partner already exists - idempotent
        return {"created": False, "partner_id": req.partner_id, "note": "already_exists"}
    return {"created": True, "partner_id": req.partner_id}


@router.get("/partners/{partner_id}")
async def get_partner(partner_id: str):
    """Validate a widget partner id and return its CORS allowlist.

    Used by the embeddable widget route (customer-portal /api/widget/audit)
    to (a) reject unknown partner ids and (b) enforce per-domain CORS.
    """
    try:
        partner = await audit_db.get_partner(partner_id)
    except Exception:
        return {"valid": False, "error": "partner_lookup_failed"}
    if not partner:
        return {"valid": False, "error": "not_found"}
    return {
        "valid": partner["status"] == "active",
        "id": partner["id"],
        "name": partner["name"],
        "plan": partner["plan"],
        "status": partner["status"],
        "domains": partner["domains"],
    }


@router.get("/{audit_id}")
async def get_audit(audit_id: str, share: Optional[str] = Query(default=None), email: Optional[str] = Query(default=None)):
    """Fetch audit by ID from database.

    If `share` is provided, it must be that audit's actual share_token -
    this is the third-party share-link path (customer-portal's results
    page.tsx passes ?share=<token> when a visitor isn't the original
    requester and doesn't have the unlock cookie). A share token that
    doesn't match returns 404, same as a nonexistent audit, so this can't
    be used to probe which tokens are valid.

    If `email` is provided, revenue_impact is computed per finding using
    the user's avg_cpc from workspace_preferences.
    """
    try:
        from uuid import UUID
        audit_uuid = UUID(audit_id)

        if share is not None:
            audit = await audit_db.get_audit_by_share_token(share)
            if not audit or audit.get("audit_id") != audit_id:
                raise HTTPException(status_code=404, detail="Audit not found")
            return audit

        audit = await audit_db.get_audit(audit_uuid)

        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")

        # Enrich findings with revenue_impact if user has CPC configured
        if email and audit.get("findings"):
            try:
                from platform_api.audit.revenue_estimator import enrich_findings_with_revenue
                await audit_db.connect()
                async with audit_db.pool.acquire() as conn:
                    row = await conn.fetchrow(
                        "SELECT preferences FROM workspace_preferences WHERE email = $1",
                        email.strip().lower(),
                    )
                if row and row["preferences"]:
                    import json as _json
                    prefs = row["preferences"] if isinstance(row["preferences"], dict) else _json.loads(row["preferences"])
                    avg_cpc = prefs.get("avg_cpc")
                    if avg_cpc and float(avg_cpc) > 0:
                        # Estimate monthly visitors from GSC clicks if available, else default 100
                        monthly_visitors = 100
                        try:
                            gsc_row = await conn.fetchrow(
                                """SELECT SUM(clicks) as total_clicks
                                   FROM gsc_connections
                                   WHERE email = $1""",
                                email.strip().lower(),
                            )
                            if gsc_row and gsc_row["total_clicks"]:
                                monthly_visitors = int(gsc_row["total_clicks"] / 28 * 30)
                        except Exception:
                            pass
                        enrich_findings_with_revenue(
                            audit["findings"], monthly_visitors, float(avg_cpc)
                        )
            except Exception:
                pass  # Revenue enrichment is best-effort

        return audit

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit ID format")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Audit lookup unavailable")


@router.get("/badge/{badge_id}")
async def get_badge(badge_id: str):
    """Real before/after data for the embeddable badge SVG. Domain-locking
    and image rendering happen in the Next.js proxy (which can read the
    incoming Referer header) - this route is pure data."""
    try:
        from uuid import UUID
        badge_uuid = UUID(badge_id)

        badge = await audit_db.get_badge(badge_uuid)

        if badge is None:
            raise HTTPException(status_code=404, detail="Badge not found")

        return badge

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid badge ID format")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Badge lookup unavailable")


@router.get("/{audit_id}/share-token")
async def get_share_token(audit_id: str):
    """Return this audit's share token, generating one on first request.
    Used by the results page's "Share this report" button."""
    try:
        from uuid import UUID
        audit_uuid = UUID(audit_id)

        share_token = await audit_db.get_or_create_share_token(audit_uuid)

        if share_token is None:
            raise HTTPException(status_code=404, detail="Audit not found")

        return {"share_token": share_token}

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit ID format")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Share token unavailable")


class PageIntentOverride(BaseModel):
    page_intent: str
    reason: Optional[str] = None  # optional note from the user


_VALID_INTENTS = frozenset({
    "paid_landing", "seo_content", "faq_support", "product_explainer",
    "comparison", "category", "about_trust", "checkout", "unknown",
})

_INTENT_OVERRIDE_DSN = "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"


@router.patch("/{audit_id}/page-intent")
async def override_page_intent(
    audit_id: str,
    body: PageIntentOverride,
    principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_WRITE)),
):
    """Manual override for the classifier's page intent on a completed audit.

    The user can correct misclassified pages from the workspace. The override
    writes page_intent with confidence=1.0 (manual) to ALL audits for the same
    URL and owner, then triggers a findings re-sync for each affected audit so
    the signal gate reflects the new intent.
    """
    if body.page_intent not in _VALID_INTENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid intent. Valid values: {sorted(_VALID_INTENTS)}",
        )
    try:
        from uuid import UUID
        audit_uuid = UUID(audit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit ID")

    # Ownership: only the audit's email owner may override.
    own = (principal.workspace_email or principal.email or "").strip().lower()
    row = await audit_db.get_audit(audit_uuid)
    if not row:
        raise HTTPException(status_code=404, detail="Audit not found")
    if (row.get("email") or "").strip().lower() != own:
        raise HTTPException(status_code=403, detail="Not your audit")
    if row.get("status") != "completed":
        raise HTTPException(status_code=409, detail="Audit not yet completed")

    # Update ALL audits for the same URL + owner, not just this one.
    # Both statements run in one transaction so affected_ids reflects exactly
    # the rows written -- no concurrent-insert window between UPDATE and SELECT.
    try:
        await audit_db.connect()
        async with audit_db.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    """UPDATE audits
                          SET page_intent       = $1,
                              intent_confidence = 1.0,
                              intent_signals    = COALESCE(intent_signals, '{}'::jsonb)
                                                 || '{"override": true}'::jsonb
                        WHERE url   = $2
                          AND email = $3""",
                    body.page_intent,
                    row.get("url"),
                    own,
                )
                affected_rows = await conn.fetch(
                    "SELECT id FROM audits WHERE url = $1 AND email = $2",
                    row.get("url"),
                    own,
                )
        affected_ids = [str(r["id"]) for r in affected_rows]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("intent override failed for %s: %s", audit_id, e, exc_info=True)
        raise HTTPException(status_code=503, detail="Override failed")

    # Re-sync findings for each affected audit (guarded: sync failure never blocks).
    async def _resync(aid: str) -> None:
        try:
            await asyncio.to_thread(sync_findings_for_audit, aid, _INTENT_OVERRIDE_DSN)
        except Exception:
            logger.exception("intent override resync failed for %s", aid)

    for _aid in affected_ids:
        asyncio.create_task(_resync(_aid))

    return {
        "audit_id": str(audit_uuid),
        "page_intent": body.page_intent,
        "intent_confidence": 1.0,
        "overridden": True,
        "affected_audits": len(affected_ids),
    }


class EmailRequest(BaseModel):
    url: str
    email: str
    name: Optional[str] = None
    score: float
    grade: str
    findings: list
    audit_id: Optional[str] = None


class EmailResponse(BaseModel):
    status: str
    message_id: Optional[str] = None
    error: Optional[str] = None


@router.post("/email", response_model=EmailResponse, dependencies=[Depends(internal_service_dependency)])
async def send_audit_email(request: EmailRequest, raw_request: Request):
    """Send audit results via email and mark as sent in DB.

    INTERNAL_SERVICE: message content is server-constructed from caller
    input, so this must never be anonymously reachable (email spoofing).
    Only the Next.js BFF calls this after proving unlock ownership."""
    require_internal_service(raw_request)
    try:
        # Resolve the exact audit being delivered. Prefer the caller-supplied
        # id (BFF knows it); fall back to the newest audit for this email.
        target_id: Optional[str] = None
        if request.audit_id:
            try:
                row = await audit_db.get_audit(UUID(request.audit_id))
                target_id = str(row["id"]) if row else None
            except ValueError:
                target_id = None
        if not target_id:
            audits = await audit_db.get_audits_by_email(request.email, limit=1)
            target_id = audits[0]["id"] if audits else None

        result = await email_service.send_audit_results(
            AuditEmailData(
                url=request.url,
                email=request.email,
                name=request.name,
                score=request.score,
                grade=request.grade,
                findings=request.findings,
                audit_id=target_id,
            )
        )

        # Advance delivery state only after confirmed provider success.
        if result.get("status") == "sent" and target_id:
            await audit_db.mark_email_sent(UUID(target_id), result.get("message_id"))
            # Track email sent
            await analytics.track_email_sent(
                email=request.email,
                audit_id=target_id
            )
            ph = get_posthog()
            if ph:
                with new_context(client=ph):
                    identify_context(request.email)
                    ph.capture(
                        "audit_email_sent",
                        properties={
                            "audit_id": target_id,
                            "grade": request.grade,
                            "score": request.score,
                        },
                    )

        return EmailResponse(
            status=result.get("status", "unknown"),
            message_id=result.get("message_id"),
            error=None if result.get("status") == "sent" else "Email delivery failed",
        )
    except Exception:
        return EmailResponse(
            status="error",
            error="Email delivery unavailable",
        )


_PIXEL_GIF = bytes.fromhex(
    "474946383961010001008000000000000021f90401000000002c00000000"
    "010001000002024401007b"
)


def _pixel_token(audit_id: str) -> str:
    """Unforgeable pixel token: HMAC of the audit id under the internal
    secret. Audit ids leak on public result permalinks and get probed by
    crawlers - a raw id in the URL let bots inflate email_opens within
    seconds of the endpoint existing."""
    import hashlib
    import hmac as _hmac

    secret = (os.getenv("INTERNAL_API_SECRET") or "").encode()
    return _hmac.new(secret, f"px:{audit_id}".encode(), hashlib.sha256).hexdigest()[:32]


@router.get("/px/{audit_id}/{token}/o.gif")
async def audit_open_pixel(audit_id: UUID, token: str):
    """Open-tracking pixel embedded in delivered audit report emails.

    Public by design: mail clients fetch it without cookies. Token must match
    or the gif is served without recording anything - probes learn nothing."""
    try:
        expected = _pixel_token(str(audit_id))
        if hmac.compare_digest(token, expected):
            await audit_db.track_email_open(audit_id)
    except Exception:
        logging.getLogger("uvicorn.error").exception("open pixel tracking failed")
    return Response(content=_PIXEL_GIF, media_type="image/gif")


