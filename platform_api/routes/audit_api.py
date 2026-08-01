"""
Nebula Audit API
FastAPI routes for audit processing (called by n8n workflows)
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from typing import Optional
from uuid import UUID
import subprocess
import json
import sys
import os
import asyncio
import httpx

from posthog import identify_context, new_context

from platform_api.posthog_client import get_posthog
from platform_api.services.email_service import email_service, AuditEmailData
from platform_api.services.audit_db import audit_db
from platform_api.services.analytics import analytics

# Import track assignment trigger
import sys
from pathlib import Path
sys.path.insert(0, "/home/mike/nebula")
from audit_track_trigger import trigger_track_assignment

router = APIRouter(prefix="/audit", tags=["audit"])

# Path to deliver_audit.py
AUDIT_SCRIPT = "/home/mike/nebula/deliver_audit.py"


class AuditRequest(BaseModel):
    url: str
    email: Optional[str] = None
    name: Optional[str] = None
    audit_id: Optional[str] = None


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


@router.post("/run", response_model=AuditResponse)
async def run_audit(request: AuditRequest):
    """Run deliver_audit.py and return JSON results. Persist to DB."""
    try:
        # Create audit record in DB
        audit_id = await audit_db.create_audit(
            url=request.url,
            email=request.email or 'anonymous@example.com',
            name=request.name
        )
        
        # Track audit started
        await analytics.track_audit_started(
            url=request.url,
            email=request.email or 'anonymous'
        )
        ph = get_posthog()
        distinct_id = request.email or str(audit_id)
        if ph:
            with new_context(client=ph):
                identify_context(distinct_id)
                ph.capture("audit_started", properties={"audit_id": str(audit_id)})
        
        # Build command
        cmd = [
            "/home/mike/nebula/venv/bin/python3",
            AUDIT_SCRIPT,
            request.url,
            request.email or "placeholder@example.com",
            "--json",
            "--dry-run",
        ]
        
        # Execute
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            cwd="/home/mike/nebula"
        )
        
        if result.returncode != 0:
            if ph:
                with new_context(client=ph):
                    identify_context(distinct_id)
                    ph.capture("audit_failed", properties={"audit_id": str(audit_id), "reason": "script_error"})
            return AuditResponse(
                audit_id=str(audit_id),
                url=request.url,
                status="error",
                error="Audit processing failed"
            )
        
        # Parse JSON output
        lines = result.stdout.strip().split('\n')
        json_line = None
        for line in reversed(lines):
            if line.strip().startswith('{'):
                json_line = line
                break
        
        if not json_line:
            if ph:
                with new_context(client=ph):
                    identify_context(distinct_id)
                    ph.capture("audit_failed", properties={"audit_id": str(audit_id), "reason": "no_json_output"})
            return AuditResponse(
                audit_id=str(audit_id),
                url=request.url,
                status="error",
                error="No JSON output found"
            )
        
        data = json.loads(json_line)
        
        # Update database
        await audit_db.update_audit(
            audit_id=audit_id,
            score=data.get('score', 0),
            grade=data.get('grade', 'N/A'),
            composite=data.get('composite'),
            composite_anchor=data.get('composite_anchor'),
            findings=data.get('findings', []),
            status='completed'
        )

        # Fire content extraction pipeline (non-blocking, best-effort)
        async def _fire_content_pipeline():
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.post(
                        "https://n8n.mikeholownych.com/webhook/content-extract",
                        json={
                            "audit_id": str(audit_id),
                            "url": request.url,
                            "findings": data.get('findings', []),
                        }
                    )
            except Exception:
                pass  # Non-fatal — never block audit response

        asyncio.create_task(_fire_content_pipeline())

        # Track audit completed
        await analytics.track_audit_completed(
            email=request.email or 'anonymous',
            score=data.get('score', 0),
            grade=data.get('grade', 'N/A')
        )
        if ph:
            with new_context(client=ph):
                identify_context(distinct_id)
                ph.capture(
                    "audit_completed",
                    properties={
                        "audit_id": str(audit_id),
                        "score": data.get("score"),
                        "grade": data.get("grade"),
                        "findings_count": len(data.get("findings", [])),
                    },
                )
        
        # Assign nurture track based on findings
        if request.email and data.get('findings'):
            try:
                track_id = trigger_track_assignment(
                    email=request.email,
                    audit_id=str(audit_id),
                    findings=data.get('findings', []),
                    url=request.url
                )
                # Add track_id to response
                data['nurture_track'] = track_id
            except Exception as e:
                # Don't fail audit on track assignment error
                print(f"[audit_api] Track assignment failed: {e}")
        
        return AuditResponse(
            audit_id=str(audit_id),
            url=request.url,
            status="completed",
            score=data.get("score"),
            grade=data.get("grade"),
            composite=data.get("composite"),
            composite_anchor=data.get("composite_anchor"),
            findings=data.get("findings", []),
            dimensions=data.get("dimensions", {}),
            page_title=data.get("page_title", ""),
            page_h1=data.get("page_h1", ""),
        )
        
    except subprocess.TimeoutExpired:
        ph = get_posthog()
        if ph:
            distinct_id = request.email or str(request.audit_id or "unknown")
            with new_context(client=ph):
                identify_context(distinct_id)
                ph.capture("audit_failed", properties={"reason": "timeout"})
        return AuditResponse(
            audit_id=request.audit_id,
            url=request.url,
            status="error",
            error="Audit timed out (120s limit)"
        )
    except json.JSONDecodeError:
        ph = get_posthog()
        if ph:
            distinct_id = request.email or str(request.audit_id or "unknown")
            with new_context(client=ph):
                identify_context(distinct_id)
                ph.capture("audit_failed", properties={"reason": "json_parse_error"})
        return AuditResponse(
            audit_id=request.audit_id,
            url=request.url,
            status="error",
            error="Audit response was invalid"
        )
    except Exception:
        return AuditResponse(
            audit_id=request.audit_id,
            url=request.url,
            status="error",
            error="Audit processing unavailable"
        )


class AuditClaimRequest(BaseModel):
    audit_id: str
    email: str


@router.post("/claim")
async def claim_audit(body: AuditClaimRequest):
    """Link an anonymous/unclaimed audit to a real email address.

    No auth required — email is the identity for now.

    Returns 200 {"claimed": true, ...} on success.
    Returns 400 if the audit is already owned by a *different* email.
    Returns 404 if audit_id is not found.
    """
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
        raise HTTPException(status_code=503, detail="Claim unavailable — please try again")

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
    aggregate-proof strip. Must be defined before /{audit_id} — otherwise
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


@router.get("/stats/recent-finding")
async def get_recent_finding():
    """Return the highest-impact finding from the most recent completed audit.
    Used for the homepage's 'recent finding' strip. No URL is exposed — only
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


@router.get("/by-email")
async def get_audits_by_email(email: str = Query(..., min_length=3, max_length=320)):
    """List all audits for a workspace email — powers the Customer Workspace
    (dashboard, projects, immutable audit history). Each row is a version of
    that URL at a point in time. Must be defined before /{audit_id}."""
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


class RecommendationUpdate(BaseModel):
    status: str


@router.get("/recommendations")
async def list_recommendations(email: str = Query(..., min_length=3, max_length=320)):
    """Sync + return the recommendation kanban for a workspace email.
    Derives cards from completed audits (upsert preserving statuses) and
    auto-verifies items a newer audit no longer flags. Must be defined
    before /{audit_id}."""
    try:
        recs = await audit_db.sync_recommendations(email)
        return {"email": email, "recommendations": recs}
    except Exception:
        raise HTTPException(status_code=503, detail="Recommendations unavailable")


@router.patch("/recommendations/{rec_id}")
async def update_recommendation(rec_id: str, body: RecommendationUpdate):
    """Move a recommendation between kanban columns (to_fix / doing / done)."""
    if body.status not in ("to_fix", "doing", "done"):
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        from uuid import UUID

        UUID(rec_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation ID")
    try:
        rec = await audit_db.update_recommendation_status(rec_id, body.status)
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        return rec
    except HTTPException:
        raise
    except Exception:
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


@router.get("/lab-experiments")
async def list_lab_experiments(email: str = Query(..., min_length=3, max_length=320)):
    """List saved Component Lab experiments for a workspace email (newest first)."""
    try:
        exps = await audit_db.list_lab_experiments(email)
        return {"email": email, "experiments": exps}
    except Exception:
        raise HTTPException(status_code=503, detail="Experiments unavailable")


@router.post("/lab-experiments")
async def create_lab_experiment(body: LabExperimentCreate):
    """Save a lab run as an experiment in the workspace."""
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
async def update_lab_experiment(exp_id: str, body: LabExperimentUpdate):
    """Mark an experiment as production (or back to saved)."""
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
        return exp
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Experiment update failed")


@router.get("/timeline")
async def get_activity_timeline(email: str = Query(..., min_length=3, max_length=320)):
    """Aggregate activity timeline for a workspace email.
    Combines audit completions, recommendation status changes, and monitor run events,
    sorted by created_at DESC, limited to 100 events."""
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
            return ca if ca is not None else ""

        events.sort(key=_sort_key, reverse=True)
        events = events[:100]

        return {"email": email, "events": events}
    except Exception:
        raise HTTPException(status_code=503, detail="Timeline unavailable")


@router.delete("/lab-experiments/{exp_id}")
async def delete_lab_experiment(exp_id: str):
    """Delete a saved experiment."""
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
async def list_monitors(email: str = Query(..., min_length=3, max_length=320)):
    """List monitoring watches for a workspace email."""
    try:
        monitors = await audit_db.list_monitors(email)
        # Attach recent events per monitor
        for m in monitors:
            m["events"] = await audit_db.list_monitor_events(m["id"], limit=10)
        return {"monitors": monitors}
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor list failed")


@router.post("/monitors")
async def create_monitor(body: MonitorCreate):
    """Create a monitoring watch (weekly by default). Idempotent per (email, url)."""
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
        monitor = await audit_db.create_monitor(email, url, cadence)
        if not monitor:
            raise HTTPException(status_code=500, detail="Monitor create failed")
        return monitor
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor create failed")


@router.patch("/monitors/{monitor_id}")
async def update_monitor(monitor_id: str, body: MonitorUpdate):
    """Update cadence or pause/resume a monitor."""
    if body.cadence is not None and body.cadence not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="Cadence must be weekly or monthly")
    try:
        monitor = await audit_db.update_monitor(monitor_id, body.cadence, body.active)
        if not monitor:
            raise HTTPException(status_code=404, detail="Monitor not found")
        return monitor
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor update failed")


@router.delete("/monitors/{monitor_id}")
async def delete_monitor(monitor_id: str):
    """Remove a monitoring watch."""
    try:
        deleted = await audit_db.delete_monitor(monitor_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Monitor not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Monitor delete failed")


@router.post("/monitors/run-due")
async def run_due_monitors():
    """Internal runner: audit every due monitor, record events, return alerts.

    Called by the Hermes cron watchdog. Alerts are produced only for
    meaningful movement (>= 4 points /100) or new critical findings; the
    cron prints them only when non-empty (silent otherwise).
    """
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
                summary = f"Baseline audit complete — score {new_score:.0f}/100"
            elif new_critical and (delta is None or delta < 4):
                status = "new_fail"
                summary = f"New critical finding — score {prev_score:.0f} → {new_score:.0f}"
            elif delta is not None and delta <= -4:
                status = "regressed"
                summary = f"Score dropped {prev_score:.0f} → {new_score:.0f} ({delta:+.0f} pts)"
            elif delta is not None and delta >= 4:
                status = "improved"
                summary = f"Score improved {prev_score:.0f} → {new_score:.0f} ({delta:+.0f} pts)"
            else:
                status = "no_change"
                summary = f"No material change — {new_score:.0f}/100"

            await audit_db.create_monitor_event(
                monitor_id, UUID(new_audit_id) if new_audit_id else None,
                status, prev_score, new_score, summary,
            )
            await audit_db.mark_monitor_ran(monitor_id, new_score)

            points = new_score - prev_disp
            if status == "regressed":
                alerts.append(
                    f"📉 Nebula Monitor — {url}\n"
                    f"{round(prev_disp)} → {round(new_score)} ({points:+.0f} pts) · {email}"
                )
            elif status == "new_fail":
                alerts.append(
                    f"🚨 Nebula Monitor — {url}\n"
                    f"New critical finding · {round(new_score)}/100 · {email}"
                )
            elif status == "improved":
                alerts.append(
                    f"📈 Nebula Monitor — {url}\n"
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
                f"⚠️ Nebula Monitor — {url}\nRun failed: {str(exc)[:120]} · {email}"
            )

    return {"checked": len(due), "alerts": alerts}


@router.get("/badges")
async def get_badges_by_email(email: str):
    """Return all earned badges for a given email address."""
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


@router.get("/{audit_id}")
async def get_audit(audit_id: str, share: Optional[str] = Query(default=None)):
    """Fetch audit by ID from database.

    If `share` is provided, it must be that audit's actual share_token —
    this is the third-party share-link path (customer-portal's results
    page.tsx passes ?share=<token> when a visitor isn't the original
    requester and doesn't have the unlock cookie). A share token that
    doesn't match returns 404, same as a nonexistent audit, so this can't
    be used to probe which tokens are valid.
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
    incoming Referer header) — this route is pure data."""
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


class EmailRequest(BaseModel):
    url: str
    email: str
    name: Optional[str] = None
    score: float
    grade: str
    findings: list


class EmailResponse(BaseModel):
    status: str
    message_id: Optional[str] = None
    error: Optional[str] = None


@router.post("/email", response_model=EmailResponse)
async def send_audit_email(request: EmailRequest):
    """Send audit results via email and mark as sent in DB"""
    try:
        result = await email_service.send_audit_results(
            AuditEmailData(
                url=request.url,
                email=request.email,
                name=request.name,
                score=request.score,
                grade=request.grade,
                findings=request.findings,
            )
        )
        
        # Advance delivery state only after confirmed provider success.
        audits = await audit_db.get_audits_by_email(request.email, limit=1)
        if result.get("status") == "sent" and audits:
            await audit_db.mark_email_sent(audits[0]['id'])
            # Track email sent
            await analytics.track_email_sent(
                email=request.email,
                audit_id=str(audits[0]['id'])
            )
            ph = get_posthog()
            if ph:
                with new_context(client=ph):
                    identify_context(request.email)
                    ph.capture(
                        "audit_email_sent",
                        properties={
                            "audit_id": str(audits[0]['id']),
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
