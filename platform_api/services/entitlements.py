"""Single authority for what a workspace email may do.

Fail rules (spec 2026-08-23): resolution errors degrade free reads OPEN;
premium mutations must hold positive entitlement evidence so they fail closed.
"""

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

# Teaser funnel cap surfaced to the public audit page (Task 6 consumes).
TEASER_FUNNEL_URLS = 3

_FIXTURE = json.loads(
    (Path(__file__).resolve().parents[2]
     / "tests/billing_fixtures/plan_limits.json").read_text())


@dataclass
class Entitlements:
    plan: str
    status: str
    audits_per_month: int | None   # None = unlimited
    monitored_urls: int | None     # None = unlimited, 0 = none
    min_interval_hours: int | None
    competitor_slots: int = 0
    funnel_runs_per_month: int | None = 0
    funnel_urls_per_run: int = 0
    analytics_depth: str = "none"


def _limits_for(plan: str) -> tuple[
    int | None, int | None, int | None,
    int, int | None, int, str,
]:
    f = _FIXTURE.get(plan) or _FIXTURE["free"]
    return (f["auditsPerMonth"], f["monitoredUrls"], f["minIntervalHours"],
            f["competitorSlots"], f["funnelRunsPerMonth"],
            f["funnelUrlsPerRun"], f["analyticsDepth"])


def _grants(row) -> bool:
    status = getattr(row, "status", None)
    if status in ("active", "trialing"):
        return True
    # Paid grace applies only to canceled/deleted subs. past_due/unpaid with a
    # future period_end must degrade to free, not ride the paid window.
    if status in ("canceled", "deleted"):
        end = getattr(row, "current_period_end", None)
        return end is not None and end > datetime.now(timezone.utc)
    return False


def _rank(plan: str) -> int:
    return {"free": 0, "pro": 1, "growth": 2, "agency": 3}.get(plan, 0)


def _entitlements_from_rows(subscription_rows) -> Entitlements:
    best = None
    best_plan = "free"
    for row in subscription_rows:
        if not _grants(row):
            continue
        if _rank(row.plan) > _rank(best_plan):
            best, best_plan = row, row.plan
    audits, urls, hours, slots, runs, run_urls, depth = _limits_for(best_plan)
    status = getattr(best, "status", "none") if best is not None else "none"
    return Entitlements(plan=best_plan, status=status,
                        audits_per_month=audits, monitored_urls=urls,
                        min_interval_hours=hours,
                        competitor_slots=slots,
                        funnel_runs_per_month=runs,
                        funnel_urls_per_run=run_urls,
                        analytics_depth=depth)


def resolve_sync(email: str, db) -> Entitlements:
    """Resolve for a route already holding a SQLAlchemy session."""
    from sqlalchemy import or_

    from platform_api.db.models import (
        Membership,
        Organization,
        Subscription,
        User,
    )
    norm = (email or "").strip().lower()
    try:
        rows = (
            db.query(Subscription)
            .join(Organization, Subscription.organization_id == Organization.id)
            .join(Membership, Membership.organization_id == Organization.id)
            .join(User, Membership.user_id == User.id)
            .filter(
                User.email == norm,
                Membership.status == "active",
                or_(
                    Subscription.status.in_(["active", "trialing"]),
                    Subscription.current_period_end.isnot(None),
                ),
            )
            .all()
        )
        return _entitlements_from_rows(rows)
    except Exception:  # noqa: BLE001 - fail open to free per spec
        return _free_error_entitlements()


def _free_error_entitlements() -> Entitlements:
    f = _FIXTURE["free"]
    return Entitlements(plan="free", status="error",
                        audits_per_month=f["auditsPerMonth"],
                        monitored_urls=0, min_interval_hours=None,
                        competitor_slots=f["competitorSlots"],
                        funnel_runs_per_month=f["funnelRunsPerMonth"],
                        funnel_urls_per_run=f["funnelUrlsPerRun"],
                        analytics_depth=f["analyticsDepth"])


async def resolve(email: str) -> Entitlements:
    """Thread-offloaded sync resolution; safe for FastAPI handlers."""
    import asyncio

    from platform_api.db import session as db_session

    def _run() -> Entitlements:
        try:
            with db_session.session_scope() as db:
                return resolve_sync(email, db)
        except Exception:  # noqa: BLE001 - fail open to free per spec
            return _free_error_entitlements()

    return await asyncio.to_thread(_run)
