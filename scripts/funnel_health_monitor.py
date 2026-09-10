#!/usr/bin/env python3
"""Read-only daily, weekly, and monthly commercial health monitor.

The internal analytics_event_ledger is authoritative for operational and
commercial events. PostHog is queried only as a reconciliation source for
historical and consent-gated client signals.

Usage:
  python scripts/funnel_health_monitor.py [--json]

The default run writes one dated JSON/Markdown snapshot and updates latest
copies under reports/funnel_health/. It never writes to PostHog or databases.
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

import psycopg

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "reports" / "funnel_health"
DB_CONNINFO = "host=/var/run/postgresql port=5433 dbname=nebula_platform user=postgres"

EVENTS = (
    "audit_started",
    "audit_completed",
    "audit_results_unlocked",
    "audit_result_viewed",
    "checkout_creation_failed",
    "checkout_started",
    "purchase_completed",
)


@dataclass(frozen=True)
class Period:
    name: str
    start: date
    end: date  # exclusive
    previous_start: date
    previous_end: date


def previous_calendar_month(day: date) -> tuple[date, date]:
    first = day.replace(day=1)
    previous_end = first
    previous_start = (first - timedelta(days=1)).replace(day=1)
    return previous_start, previous_end


def build_periods(today: date) -> dict[str, Period]:
    yesterday = today - timedelta(days=1)
    daily_start = yesterday
    weekly_end = today - timedelta(days=today.weekday())
    weekly_start = weekly_end - timedelta(days=7)
    monthly_start, monthly_end = previous_calendar_month(today)
    month_length = (monthly_end - monthly_start).days
    prior_month_end = monthly_start
    prior_month_start = prior_month_end - timedelta(days=month_length)
    return {
        "daily": Period("daily", daily_start, today, daily_start - timedelta(days=1), daily_start),
        "weekly": Period("weekly", weekly_start, weekly_end, weekly_start - timedelta(days=7), weekly_start),
        "monthly": Period("monthly", monthly_start, monthly_end, prior_month_start, prior_month_end),
    }


PROBE_AUDIT_IDS = ("123e4567-e89b-12d3-a456-426614174000",)


def _empty_counts() -> dict[str, int]:
    return {event: 0 for event in EVENTS}


# Mutually exclusive, ordered classifications. Never update the source ledger.
# Unknown traffic remains customer-eligible unless explicit exclusion evidence
# exists; missing environment/payment mode is unverified, not proven live.
LEDGER_CLASSIFICATION_SQL = """
    SELECT event_name,
           CASE
             WHEN e.audit_id = ANY(%s)
               OR e.properties->>'audit_id' = ANY(%s)
               THEN 'known_monitor_probe'
             WHEN e.is_synthetic IS TRUE
               OR e.properties->>'is_synthetic' = 'true'
               THEN 'synthetic'
             WHEN e.environment IS DISTINCT FROM 'production'
               THEN 'non_production_or_unknown'
             WHEN e.payment_mode IS DISTINCT FROM 'live'
               OR starts_with(COALESCE(e.checkout_session_id, ''), 'cs_test_')
               OR starts_with(COALESCE(e.transaction_id, ''), 'cs_test_')
               OR starts_with(COALESCE(e.properties->>'checkout_session_id', ''), 'cs_test_')
               OR starts_with(COALESCE(e.properties->>'transaction_id', ''), 'cs_test_')
               OR e.properties->>'livemode' = 'false'
               OR e.properties->>'payment_mode' = 'test'
               OR EXISTS (
                   SELECT 1 FROM purchases p
                   WHERE p.livemode IS FALSE
                     AND p.stripe_session_id IN (
                         e.checkout_session_id, e.transaction_id,
                         e.properties->>'checkout_session_id',
                         e.properties->>'transaction_id'
                     )
               ) THEN 'test_payment_or_unverified_mode'
             ELSE 'customer_eligible'
           END AS traffic_class,
           COUNT(*)
    FROM analytics_event_ledger e
    WHERE occurred_at >= %s::date::timestamp AT TIME ZONE 'UTC'
      AND occurred_at < %s::date::timestamp AT TIME ZONE 'UTC'
      AND event_name = ANY(%s)
    GROUP BY event_name, traffic_class
"""


def classified_ledger_counts(
    conn: psycopg.Connection[Any], period: Period,
) -> dict[str, dict[str, int]]:
    result = {name: _empty_counts() for name in (
        'customer_eligible', 'known_monitor_probe', 'synthetic',
        'non_production_or_unknown', 'test_payment_or_unverified_mode',
    )}
    with conn.cursor() as cur:
        cur.execute(LEDGER_CLASSIFICATION_SQL, [
            list(PROBE_AUDIT_IDS), list(PROBE_AUDIT_IDS),
            period.start, period.end, list(EVENTS),
        ])
        for event_name, traffic_class, count in cur.fetchall():
            result[traffic_class][event_name] = int(count)
    return result


def ledger_counts(
    conn: psycopg.Connection[Any], period: Period,
) -> dict[str, int]:
    """Customer-eligible metrics, never the monitor's own probe or test payment."""
    return classified_ledger_counts(conn, period)['customer_eligible']


def raw_counts(classes: dict[str, dict[str, int]]) -> dict[str, int]:
    return {event: sum(counts[event] for counts in classes.values()) for event in EVENTS}


def posthog_query(sql: str) -> list[list[Any]] | None:
    key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    host = os.environ.get("POSTHOG_HOST", "https://us.posthog.com")
    project = os.environ.get("POSTHOG_CLI_PROJECT_ID", "525183")
    if not key:
        return None
    payload = json.dumps({"query": {"kind": "HogQLQuery", "query": sql}}).encode()
    request = urllib.request.Request(
        f"{host}/api/projects/{project}/query/",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read())
        return data.get("results", [])
    except Exception:
        return None


def posthog_event_count(event: str, period: Period) -> int | None:
    rows = posthog_query(
        f"""
        SELECT count()
        FROM events
        WHERE event = '{event}'
          AND timestamp >= toDateTime('{period.start.isoformat()}')
          AND timestamp < toDateTime('{period.end.isoformat()}')
          AND distinct_id != 'cs_test_bound'
        """
    )
    if not rows or not rows[0]:
        return None
    return int(rows[0][0])


def period_snapshot(conn: psycopg.Connection[Any], period: Period) -> dict[str, Any]:
    current_classes = classified_ledger_counts(conn, period)
    current = current_classes["customer_eligible"]
    previous_period = Period(
        f"{period.name}_previous",
        period.previous_start,
        period.previous_end,
        period.previous_start,
        period.previous_end,
    )
    previous_classes = classified_ledger_counts(conn, previous_period)
    previous = previous_classes["customer_eligible"]
    unlocks = current["audit_results_unlocked"]
    previous_unlocks = previous["audit_results_unlocked"]
    posthog_unlocks = posthog_event_count("audit_results_unlocked", period)
    previous_posthog_unlocks = posthog_event_count("audit_results_unlocked", previous_period)
    return {
        "start": period.start.isoformat(),
        "end_exclusive": period.end.isoformat(),
        "previous_start": period.previous_start.isoformat(),
        "previous_end_exclusive": period.previous_end.isoformat(),
        "ledger": current,
        "commercial_ledger": current,
        "raw_ledger": raw_counts(current_classes),
        "previous_raw_ledger": raw_counts(previous_classes),
        "excluded_ledger_by_class": {k: v for k, v in current_classes.items() if k != "customer_eligible"},
        "previous_excluded_ledger_by_class": {k: v for k, v in previous_classes.items() if k != "customer_eligible"},
        "previous_ledger": previous,
        "unlock_reconciliation": {
            "ledger": unlocks,
            "previous_ledger": previous_unlocks,
            "posthog": posthog_unlocks,
            "previous_posthog": previous_posthog_unlocks,
        },
    }


def delta(current: int | None, previous: int | None) -> int | None:
    if current is None or previous is None:
        return None
    return current - previous


def flags(snapshot: dict[str, Any]) -> list[str]:
    ledger = snapshot["ledger"]
    commercial = snapshot.get("commercial_ledger") or ledger
    unlocks = ledger["audit_results_unlocked"]
    previous_unlocks = snapshot["previous_ledger"]["audit_results_unlocked"]
    reconciliation = snapshot["unlock_reconciliation"]
    alerts: list[str] = []
    if commercial["checkout_creation_failed"] > 0 and commercial["checkout_started"] == 0:
        alerts.append("CHECKOUT_FAILURES_WITH_ZERO_SUCCESSFUL_CHECKOUTS")
    if ledger["audit_started"] > ledger["audit_completed"]:
        alerts.append("AUDIT_STARTS_EXCEED_COMPLETIONS")
    if unlocks == 0 and previous_unlocks not in (None, 0):
        alerts.append("RESULT_UNLOCKS_DROPPED_TO_ZERO")
    if reconciliation["ledger"] == 0 and reconciliation["posthog"] not in (None, 0):
        alerts.append("UNLOCK_LEDGER_BACKFILL_PENDING")
    if ledger["purchase_completed"] == 0:
        alerts.append("NO_PURCHASE_SIGNAL")
    return alerts


def build_report(today: date | None = None, connection_factory: Callable[[], psycopg.Connection[Any]] | None = None) -> dict[str, Any]:
    today = today or datetime.now(timezone.utc).date()
    periods = build_periods(today)
    factory = connection_factory or (lambda: psycopg.connect(
        DB_CONNINFO,
        options='-c default_transaction_read_only=on -c timezone=UTC -c statement_timeout=30000',
    ))
    with factory() as conn:
        snapshots = {name: period_snapshot(conn, period) for name, period in periods.items()}
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "timezone": "UTC",
        "source": "analytics_event_ledger with PostHog unlock reconciliation",
        "periods": snapshots,
        "attention": {name: flags(snapshot) for name, snapshot in snapshots.items()},
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines = ["# Funnel health monitor", "", f"Generated: `{report['generated_at']}`", ""]
    for name, snapshot in report["periods"].items():
        ledger = snapshot["ledger"]
        previous = snapshot["previous_ledger"]
        unlocks = snapshot["ledger"]["audit_results_unlocked"]
        previous_unlocks = snapshot["previous_ledger"]["audit_results_unlocked"]
        lines.extend([
            f"## {name.title()} ({snapshot['start']} to {snapshot['end_exclusive']})",
            "",
            "Customer-eligible events only. Exclusions are classifications, not deleted evidence.",
            "",
            "| Signal | Current | Previous | Delta |",
            "|---|---:|---:|---:|",
        ])
        rows = [
            ("Audit started", ledger["audit_started"], previous["audit_started"]),
            ("Audit completed", ledger["audit_completed"], previous["audit_completed"]),
            ("Results unlocked (ledger)", unlocks, previous_unlocks),
            ("Checkout creation failed", ledger["checkout_creation_failed"], previous["checkout_creation_failed"]),
            ("Checkout started", ledger["checkout_started"], previous["checkout_started"]),
            ("Purchases", ledger["purchase_completed"], previous["purchase_completed"]),
        ]
        for label, current, prior in rows:
            d = delta(current if isinstance(current, int) else None, prior if isinstance(prior, int) else None)
            lines.append(f"| {label} | {current} | {prior} | {d if d is not None else 'N/A'} |")
        if "raw_ledger" in snapshot:
            lines.extend(["", "### Raw ledger and excluded evidence", "",
                          "| Classification | Signal | Current | Previous |",
                          "|---|---|---:|---:|"])
            for event in EVENTS:
                lines.append(f"| Raw ledger | {event} | {snapshot['raw_ledger'][event]} | {snapshot['previous_raw_ledger'][event]} |")
            for classification, counts in snapshot["excluded_ledger_by_class"].items():
                for event in EVENTS:
                    prior = snapshot["previous_excluded_ledger_by_class"][classification][event]
                    if counts[event] or prior:
                        lines.append(f"| {classification} | {event} | {counts[event]} | {prior} |")
        alerts = report["attention"][name]
        lines.extend(["", "**Attention:** " + (", ".join(alerts) if alerts else "none"), ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    report = build_report()
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    (REPORT_DIR / f"funnel-health-{stamp}.json").write_text(json.dumps(report, indent=2) + "\n")
    (REPORT_DIR / f"funnel-health-{stamp}.md").write_text(render_markdown(report))
    (REPORT_DIR / "latest.json").write_text(json.dumps(report, indent=2) + "\n")
    (REPORT_DIR / "latest.md").write_text(render_markdown(report))
    print(json.dumps(report, indent=2) if args.json else render_markdown(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
