#!/usr/bin/env python3
"""Deterministic health monitor for Nebula's audit-delivery pipeline.

Sources of truth:
- HOT_LEAD.json for currently actionable legacy pipeline state.
- ledgers/customer-ledger.jsonl for immutable audit-delivery/payment evidence.
- systemd + local/public HTTP checks for delivery-surface availability.

By default the process exits 0 after emitting a complete report; this keeps the
Hermes scheduler status about monitor execution rather than pipeline health.
Use --strict-exit for CI/manual checks (0 healthy, 1 warning, 2 critical).
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

BASE_DEFAULT = Path("/home/mike/nebula")
PUBLIC_URL_DEFAULT = "https://nebulacomponents.shop"
LOCAL_URL_DEFAULT = "http://127.0.0.1:3000"
SERVICE_DEFAULT = "nebula-site"

TERMINAL_STAGES = frozenset({"paid", "closed", "dead", "bounced", "max_retries_exceeded", "recircle_60d"})
TERMINAL_STATUSES = frozenset({"completed", "closed", "bounced", "stop_reply", "test_email", "max_retries_exceeded"})
WARM_STAGES = frozenset({"warm_reply", "warm_replied", "audit_requested"})
TEST_EMAILS = frozenset({
    "mike.holownych@aisyndicate.io",
    "mike.holownych@gmail.com",
    "test@example.com",
    "restart-test@example.com",
    "stripe@example.com",
    "founder@testco.com",
    "nebulashop@agentmail.to",
})


class MonitorDataError(RuntimeError):
    """Required monitoring evidence is missing or malformed."""


def parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def load_hot_leads(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise MonitorDataError(f"required file missing: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise MonitorDataError(f"cannot parse {path.name}: {error}") from error
    if not isinstance(data, list) or not all(isinstance(row, dict) for row in data):
        raise MonitorDataError(f"{path.name} must contain a JSON array of objects")
    return data


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise MonitorDataError(f"required file missing: {path}")
    rows: list[dict[str, Any]] = []
    for line_number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        try:
            row = json.loads(raw)
        except json.JSONDecodeError as error:
            raise MonitorDataError(f"{path.name}:{line_number}: invalid JSON: {error.msg}") from error
        if not isinstance(row, dict):
            raise MonitorDataError(f"{path.name}:{line_number}: expected JSON object")
        rows.append(row)
    return rows


def is_test_record(row: dict[str, Any]) -> bool:
    return str(row.get("email", "")).strip().lower() in TEST_EMAILS


def is_terminal(row: dict[str, Any]) -> bool:
    return str(row.get("stage", "")).lower() in TERMINAL_STAGES or str(row.get("status", "")).lower() in TERMINAL_STATUSES


def collect_pipeline_state(base: Path, now: datetime) -> dict[str, Any]:
    hot_rows_all = load_hot_leads(base / "HOT_LEAD.json")
    ledger_rows_all = load_jsonl(base / "ledgers" / "customer-ledger.jsonl")

    hot_rows = [row for row in hot_rows_all if not is_test_record(row)]
    ledger_rows = [row for row in ledger_rows_all if not is_test_record(row)]
    stage_counts = Counter(str(row.get("stage") or "unknown") for row in hot_rows)

    pending_audit_requests = 0
    unrouted_warm_replies = 0
    overdue_pitches = 0
    missing_action_timestamps = 0

    for row in hot_rows:
        if is_terminal(row):
            continue
        stage = str(row.get("stage", "")).lower()
        action = str(row.get("action", "")).lower()
        status = str(row.get("status", "")).lower()

        if action == "deliver_audit":
            pending_audit_requests += 1
            if not parse_timestamp(row.get("updated_at") or row.get("created_at")):
                missing_action_timestamps += 1
        elif stage in WARM_STAGES and not action and status not in TERMINAL_STATUSES:
            unrouted_warm_replies += 1

        if action == "send_97_pitch" and stage in {"audit_delivered", "pitch_queued"} and status in {"", "pending", "queued"}:
            due = parse_timestamp(row.get("pitch_due_at"))
            if due is None:
                missing_action_timestamps += 1
            elif due <= now:
                overdue_pitches += 1

    delivery_events = [row for row in ledger_rows if row.get("event_type") == "audit_delivered"]
    payment_events = [row for row in ledger_rows if row.get("event_type") == "payment"]
    delivery_times = [ts for row in delivery_events if (ts := parse_timestamp(row.get("timestamp")))]
    recent_24h = sum(ts >= now - timedelta(hours=24) for ts in delivery_times)
    recent_7d = sum(ts >= now - timedelta(days=7) for ts in delivery_times)

    return {
        "hot_leads_total": len(hot_rows),
        "test_hot_leads_excluded": len(hot_rows_all) - len(hot_rows),
        "stage_counts": dict(sorted(stage_counts.items())),
        "pending_audit_requests": pending_audit_requests,
        "unrouted_warm_replies": unrouted_warm_replies,
        "overdue_pitches": overdue_pitches,
        "missing_action_timestamps": missing_action_timestamps,
        "delivery_events_total": len(delivery_events),
        "delivery_events_24h": recent_24h,
        "delivery_events_7d": recent_7d,
        "last_delivery_at": max(delivery_times).isoformat() if delivery_times else None,
        "payment_events_total": len(payment_events),
        "test_ledger_rows_excluded": len(ledger_rows_all) - len(ledger_rows),
    }


def check_http(url: str, timeout: float = 15.0) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 NebulaAuditDeliveryMonitor/2.0",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = int(response.status)
        return {"ok": 200 <= status < 400, "status": status, "error": None}
    except urllib.error.HTTPError as error:
        return {"ok": False, "status": int(error.code), "error": f"HTTP {error.code}"}
    except Exception as error:  # network failures must be surfaced, not hidden
        return {"ok": False, "status": None, "error": f"{type(error).__name__}: {error}"}


def check_service(service: str) -> dict[str, Any]:
    try:
        result = subprocess.run(
            ["systemctl", "is-active", service],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except Exception as error:
        return {"ok": False, "state": "unknown", "error": f"{type(error).__name__}: {error}"}
    state = result.stdout.strip() or result.stderr.strip() or "unknown"
    return {"ok": result.returncode == 0 and state == "active", "state": state, "error": None if result.returncode == 0 else state}


def build_report(base: Path, now: datetime, public_url: str, local_url: str, service: str) -> dict[str, Any]:
    issues: list[dict[str, str]] = []
    try:
        pipeline = collect_pipeline_state(base, now)
    except MonitorDataError as error:
        pipeline = None
        issues.append({"severity": "critical", "code": "monitor_data_invalid", "detail": str(error)})

    dependencies = {
        "deliver_audit_script": {"ok": (base / "deliver_audit.py").is_file()},
        "agentmail_key": {"ok": (Path.home() / ".hermes" / "secrets" / "agentmail.key").is_file()},
        "nebula_site_service": check_service(service),
        "local_origin": check_http(local_url),
        "public_site": check_http(public_url),
    }
    for name, result in dependencies.items():
        if not result.get("ok"):
            issues.append({"severity": "critical", "code": f"dependency_{name}", "detail": json.dumps(result, sort_keys=True)})

    if pipeline:
        if pipeline["pending_audit_requests"]:
            issues.append({"severity": "critical", "code": "pending_audit_requests", "detail": f"{pipeline['pending_audit_requests']} non-terminal lead(s) awaiting audit delivery"})
        if pipeline["unrouted_warm_replies"]:
            issues.append({"severity": "critical", "code": "unrouted_warm_replies", "detail": f"{pipeline['unrouted_warm_replies']} warm reply/replies have no next action"})
        if pipeline["overdue_pitches"]:
            issues.append({"severity": "warning", "code": "overdue_pitches", "detail": f"{pipeline['overdue_pitches']} delivered audit(s) passed pitch_due_at"})
        if pipeline["missing_action_timestamps"]:
            issues.append({"severity": "warning", "code": "missing_action_timestamps", "detail": f"{pipeline['missing_action_timestamps']} actionable record(s) lack required timestamps"})

    status = "critical" if any(i["severity"] == "critical" for i in issues) else "warning" if issues else "healthy"
    return {
        "monitor": "audit-delivery-monitor",
        "version": 2,
        "as_of": now.isoformat(),
        "status": status,
        "pipeline": pipeline,
        "dependencies": dependencies,
        "issues": issues,
    }


def format_report(report: dict[str, Any]) -> str:
    icon = {"healthy": "✅", "warning": "⚠️", "critical": "❌"}[report["status"]]
    lines = [f"{icon} AUDIT DELIVERY MONITOR — {report['status'].upper()}", f"As of: {report['as_of']}"]
    pipeline = report.get("pipeline")
    if pipeline:
        lines.extend([
            "",
            "Delivery evidence:",
            f"- Delivered: {pipeline['delivery_events_total']} total | {pipeline['delivery_events_24h']} last 24h | {pipeline['delivery_events_7d']} last 7d",
            f"- Last delivery: {pipeline['last_delivery_at'] or 'none recorded'}",
            f"- Payments recorded: {pipeline['payment_events_total']}",
            "",
            "Action queues:",
            f"- Pending audit delivery: {pipeline['pending_audit_requests']}",
            f"- Unrouted warm replies: {pipeline['unrouted_warm_replies']}",
            f"- Overdue post-audit pitches: {pipeline['overdue_pitches']}",
            f"- Production HOT_LEAD records: {pipeline['hot_leads_total']} ({pipeline['test_hot_leads_excluded']} test records excluded)",
            f"- Current stages: {json.dumps(pipeline['stage_counts'], sort_keys=True)}",
        ])
    deps = report["dependencies"]
    lines.extend([
        "",
        "Availability:",
        f"- nebula-site: {deps['nebula_site_service'].get('state', 'unknown')}",
        f"- Local origin: {deps['local_origin'].get('status') or deps['local_origin'].get('error')}",
        f"- Public site: {deps['public_site'].get('status') or deps['public_site'].get('error')}",
        f"- Delivery script: {'present' if deps['deliver_audit_script']['ok'] else 'missing'}",
        f"- AgentMail key: {'present' if deps['agentmail_key']['ok'] else 'missing'}",
    ])
    if report["issues"]:
        lines.append("")
        lines.append("Issues:")
        for issue in report["issues"]:
            lines.append(f"- [{issue['severity'].upper()}] {issue['code']}: {issue['detail']}")
    return "\n".join(lines)


def parse_as_of(value: str | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    parsed = parse_timestamp(value)
    if parsed is None:
        raise SystemExit("--as-of must be a valid ISO-8601 timestamp")
    return parsed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path, default=BASE_DEFAULT)
    parser.add_argument("--public-url", default=PUBLIC_URL_DEFAULT)
    parser.add_argument("--local-url", default=LOCAL_URL_DEFAULT)
    parser.add_argument("--service", default=SERVICE_DEFAULT)
    parser.add_argument("--as-of")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--strict-exit", action="store_true")
    args = parser.parse_args(argv)

    report = build_report(args.base, parse_as_of(args.as_of), args.public_url, args.local_url, args.service)
    print(json.dumps(report, indent=2, sort_keys=True) if args.json else format_report(report))
    if args.strict_exit:
        return {"healthy": 0, "warning": 1, "critical": 2}[report["status"]]
    return 0


if __name__ == "__main__":
    sys.exit(main())
