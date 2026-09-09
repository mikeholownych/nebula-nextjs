#!/usr/bin/env python3
"""Nebula Business Observability Model.

Correlates existing search, visit, funnel, and technical-health evidence into
the four commercial states. Does not invent dashboards or treat missing
telemetry as zero.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "reports" / "business_observability"

CHAIN = [
    "search_visibility",
    "acquisition",
    "landing_experience",
    "audit_journey",
    "determination",
    "repair_intent",
    "checkout",
    "revenue",
    "reobservation",
]

PRIMARY_ORDER = [
    "system_prevents_conversion",
    "visits_no_conversion",
    "discovered_no_visits",
    "not_discovered",
]

LAYER_COVERAGE: list[dict[str, Any]] = [
    {
        "id": 1,
        "name": "external_availability",
        "status": "partial",
        "evidence": "scripts/health-check.sh, scripts/notify_production_health.py, /api/readyz",
        "gap": "HTTP 200 is not a synthetic landing-to-checkout journey",
    },
    {
        "id": 2,
        "name": "real_user_monitoring",
        "status": "partial",
        "evidence": "PostHog, scripts/cwv_monitor.py, analytics_event_ledger device_class",
        "gap": "no p95 segmentation by browser/geo on checkout",
    },
    {
        "id": 3,
        "name": "application_performance",
        "status": "partial",
        "evidence": "journalctl nebula-nextjs/platform-api, error enricher, ops logs",
        "gap": "RED histograms not first-class for every service",
    },
    {
        "id": 4,
        "name": "distributed_tracing",
        "status": "partial",
        "evidence": "journey_id, request_id, build_revision on analytics_event_ledger",
        "gap": "no OpenTelemetry span graph across CDN, API, Stripe, email",
    },
    {
        "id": 5,
        "name": "logging",
        "status": "partial",
        "evidence": "structured ops logs, systemd journals, cloudflared logs/",
        "gap": "not every worker/CDN/WAF stream is joined on trace_id",
    },
    {
        "id": 6,
        "name": "metrics",
        "status": "partial",
        "evidence": "pipeline_health.json, funnel_health_monitor.py, ledger counts",
        "gap": "latency uses averages/counts more than histograms",
    },
    {
        "id": 7,
        "name": "network_and_edge",
        "status": "partial",
        "evidence": "logs/cloudflared/, Cloudflare cache purge on deploy",
        "gap": "no regional IPv4/IPv6 synthetic split",
    },
    {
        "id": 8,
        "name": "dependency_observability",
        "status": "partial",
        "evidence": "checkout_creation_failed failure_reason, MailCheck evidence, Stripe webhook",
        "gap": "provider vs own-failure not complete for email/SMS/model APIs",
    },
    {
        "id": 9,
        "name": "deployment_and_change",
        "status": "partial",
        "evidence": "CHANGE_LOG.md, ledger.build_revision, deploy scripts",
        "gap": "error-rate overlays on deploy SHA are not automatic",
    },
    {
        "id": 10,
        "name": "product_analytics",
        "status": "in_place",
        "evidence": "customer-portal/config/analytics-registry.json, analytics_event_ledger",
        "gap": "",
    },
    {
        "id": 11,
        "name": "acquisition_observability",
        "status": "partial",
        "evidence": "ACQUISITION_BASELINE.md, GSC/GA4 scripts, utm_* on ledger",
        "gap": "no persistent GSC/GA4 time-series table; browser attribution incomplete",
    },
    {
        "id": 12,
        "name": "search_observability",
        "status": "partial",
        "evidence": "GSC baselines, query_registry.json, nebula_citation_tracker.py",
        "gap": "keep OBSERVED GSC/GA4 separate from ESTIMATED AEO/GEO scores",
    },
    {
        "id": 13,
        "name": "conversion_observability",
        "status": "in_place",
        "evidence": "scripts/funnel_health_monitor.py, scripts/funnel_diagnostics.py, scripts/business_observability.py",
        "gap": "classifier is period-aggregate; per-journey didn't vs couldn't still lives in funnel_diagnostics",
    },
    {
        "id": 14,
        "name": "revenue_and_financial",
        "status": "partial",
        "evidence": "purchase_completed on ledger, Stripe live mode, ops/company_brain.json",
        "gap": "company_brain can go stale vs ledger; no Stripe vs ledger auto-reconcile job",
    },
    {
        "id": 15,
        "name": "customer_lifecycle_and_support",
        "status": "partial",
        "evidence": "scripts/post_purchase_drip.py, inbox triage, lead_store stages",
        "gap": "no post-purchase health score joined to journey_id",
    },
    {
        "id": 16,
        "name": "security_observability",
        "status": "partial",
        "evidence": "WAF/Cloudflare, failed auth logs, secret-scan in review",
        "gap": "no dedicated SIEM; security events not joined to journey_id",
    },
    {
        "id": 17,
        "name": "privacy_and_consent",
        "status": "partial",
        "evidence": "consent-gated analytics, prohibited_properties in event registry",
        "gap": "unknown jurisdiction must not silently become consent; not yet a first-class signal",
    },
    {
        "id": 18,
        "name": "data_pipeline_observability",
        "status": "partial",
        "evidence": "funnel health unlock reconciliation ledger vs PostHog",
        "gap": "ingestion lag/duplicates/schema violations are not SLI'd",
    },
    {
        "id": 19,
        "name": "data_quality_and_provenance",
        "status": "in_place",
        "evidence": "OBSERVED/INFERRED/UNKNOWN in acquisition docs; classify_metric here",
        "gap": "",
    },
    {
        "id": 20,
        "name": "slos_slis_error_budgets",
        "status": "partial",
        "evidence": "docs/operations/slos/error-budget.md, 99.9% uptime notes",
        "gap": "Grafana tracking not implemented; no payment-success SLO on live data",
    },
    {
        "id": 21,
        "name": "alerting_and_anomaly_detection",
        "status": "partial",
        "evidence": "sre_responder.py 3-strike, funnel_health attention flags, Telegram",
        "gap": "not every alert has owner+runbook; funnel flags are reports not incidents",
    },
    {
        "id": 22,
        "name": "incident_problem_change_correlation",
        "status": "partial",
        "evidence": "governance/INCIDENTS/, CHANGE_LOG.md, alert-to-incident receipts",
        "gap": "deploy SHA is not auto-joined to checkout_creation_failed spikes",
    },
    {
        "id": 23,
        "name": "cost_and_capacity",
        "status": "missing",
        "evidence": "",
        "gap": "no cost-per-audit or token/API spend attribution",
    },
    {
        "id": 24,
        "name": "business_kpi",
        "status": "partial",
        "evidence": "ops/company_brain.json, funnel_health latest.json",
        "gap": "executive numbers must derive from this correlator, not a separate dashboard",
    },
]


def classify_metric(*, source: str, value: Any) -> dict[str, Any]:
    if value is None:
        classification = "UNKNOWN"
    elif source in {"derived_ctr", "derived_cvr", "derived_rate"}:
        classification = "DERIVED"
    elif source in {"aeo_estimate", "geo_estimate", "modeled_visibility"}:
        classification = "ESTIMATED"
    else:
        classification = "OBSERVED"
    return {"value": value, "source": source, "classification": classification}


def parse_acquisition_baseline(text: str) -> dict[str, int | None]:
    def grab(label: str) -> int | None:
        match = re.search(rf"\|\s*{re.escape(label)}\s*\|\s*([0-9]+)\s*\|", text, re.IGNORECASE)
        if not match:
            return None
        return int(match.group(1))

    return {
        "impressions": grab("Total impressions"),
        "clicks": grab("Total clicks"),
        "sessions": grab("Total organic sessions"),
    }


def _positive(value: int | None) -> bool:
    return value is not None and value > 0


def _zero(value: int | None) -> bool:
    return value == 0


def classify_commercial_states(evidence: dict[str, Any]) -> dict[str, Any]:
    search = evidence.get("search") or {}
    visits = evidence.get("visits") or {}
    funnel = evidence.get("funnel") or {}

    impressions = search.get("impressions")
    clicks = search.get("clicks")
    sessions = visits.get("sessions")
    landing_views = visits.get("landing_page_views")
    audit_completed = int(funnel.get("audit_completed") or 0)
    checkout_started = int(funnel.get("checkout_started") or 0)
    checkout_failed = int(funnel.get("checkout_creation_failed") or 0)
    purchases = int(funnel.get("purchase_completed") or 0)

    search_status = "UNKNOWN" if impressions is None else "OBSERVED"
    visit_count = 0
    for candidate in (sessions, landing_views):
        if candidate:
            visit_count += int(candidate)

    active: list[str] = []
    if impressions == 0 and visit_count == 0 and audit_completed == 0:
        active.append("not_discovered")
    if (
        _positive(impressions)
        and _zero(clicks)
        and not _positive(sessions)
        and not _positive(landing_views)
        and audit_completed == 0
    ):
        active.append("discovered_no_visits")
    if checkout_failed > 0 and checkout_started == 0 and purchases == 0:
        active.append("system_prevents_conversion")
    elif (
        purchases == 0
        and checkout_started == 0
        and checkout_failed == 0
        and (visit_count > 0 or audit_completed > 0)
    ):
        active.append("visits_no_conversion")
    elif purchases == 0 and checkout_started > 0 and checkout_failed == 0:
        active.append("visits_no_conversion")

    return {
        "active_states": active,
        "search_status": search_status,
        "counts": {
            "impressions": impressions,
            "clicks": clicks,
            "sessions": sessions,
            "landing_page_views": landing_views,
            "audit_completed": audit_completed,
            "checkout_started": checkout_started,
            "checkout_creation_failed": checkout_failed,
            "purchase_completed": purchases,
        },
    }


def conversion_failure_class(result: dict[str, Any]) -> str | None:
    counts = result["counts"]
    if counts["purchase_completed"]:
        return None
    if counts["checkout_creation_failed"] > 0 and counts["checkout_started"] == 0:
        return "couldnt_convert"
    if (
        (counts.get("sessions") or 0) > 0
        or (counts.get("landing_page_views") or 0) > 0
        or counts["audit_completed"] > 0
        or counts["checkout_started"] > 0
    ):
        return "didnt_convert"
    return None


def primary_state(result: dict[str, Any]) -> str:
    active = result["active_states"]
    if not active:
        if result["counts"]["purchase_completed"]:
            return "conversion_path_working"
        if result["search_status"] == "UNKNOWN":
            return "unknown"
        return "unknown"
    for state in PRIMARY_ORDER:
        if state in active:
            return state
    return active[0]


def compile_snapshot(
    *,
    funnel_health: dict[str, Any],
    acquisition_baseline_text: str,
    technical_health: dict[str, Any] | None = None,
    period: str = "daily",
    generated_at: str | None = None,
) -> dict[str, Any]:
    baseline = parse_acquisition_baseline(acquisition_baseline_text)
    period_data = funnel_health["periods"][period]
    ledger = period_data["ledger"]
    evidence = {
        "search": {"impressions": baseline.get("impressions"), "clicks": baseline.get("clicks")},
        "visits": {
            "sessions": baseline.get("sessions"),
            "landing_page_views": ledger.get("audit_result_viewed"),
        },
        "funnel": {
            "audit_completed": ledger.get("audit_completed", 0),
            "checkout_started": ledger.get("checkout_started", 0),
            "checkout_creation_failed": ledger.get("checkout_creation_failed", 0),
            "purchase_completed": ledger.get("purchase_completed", 0),
        },
    }
    classified = classify_commercial_states(evidence)
    impressions = classify_metric(source="gsc", value=baseline.get("impressions"))
    clicks = classify_metric(source="gsc", value=baseline.get("clicks"))
    sessions = classify_metric(source="ga4", value=baseline.get("sessions"))
    ctr = None
    if impressions["value"] not in (None, 0) and clicks["value"] is not None:
        ctr = classify_metric(
            source="derived_ctr",
            value=round(clicks["value"] / impressions["value"], 6),
        )
    else:
        ctr = classify_metric(source="derived_ctr", value=None)

    snapshot = {
        "generated_at": generated_at or datetime.now(timezone.utc).isoformat(),
        "period": period,
        "period_window": {
            "start": period_data.get("start"),
            "end_exclusive": period_data.get("end_exclusive"),
        },
        "chain": list(CHAIN),
        "classification": {
            "active_states": classified["active_states"],
            "primary_state": primary_state(classified),
            "conversion_failure_class": conversion_failure_class(classified),
            "search_status": classified["search_status"],
        },
        "metrics": {
            "impressions": impressions,
            "clicks": clicks,
            "organic_sessions": sessions,
            "ctr": ctr,
            "audit_completed": classify_metric(source="analytics_event_ledger", value=ledger.get("audit_completed", 0)),
            "audit_result_viewed": classify_metric(
                source="analytics_event_ledger", value=ledger.get("audit_result_viewed", 0)
            ),
            "checkout_started": classify_metric(source="analytics_event_ledger", value=ledger.get("checkout_started", 0)),
            "checkout_creation_failed": classify_metric(
                source="analytics_event_ledger", value=ledger.get("checkout_creation_failed", 0)
            ),
            "purchase_completed": classify_metric(
                source="analytics_event_ledger", value=ledger.get("purchase_completed", 0)
            ),
        },
        "funnel_attention": funnel_health.get("attention", {}).get(period, []),
        "attachments": {
            "technical_health": technical_health or {},
            "consent_state": "consent_gated_analytics_undercounts",
            "evidence_provenance": "OBSERVED ledger and GSC/GA4 baseline; ESTIMATED AEO excluded",
        },
        "layer_coverage": LAYER_COVERAGE,
        "interventions": _interventions(primary_state(classified)),
        "sources": {
            "funnel_health_generated_at": funnel_health.get("generated_at"),
            "acquisition_baseline": "ACQUISITION_BASELINE.md",
        },
    }
    return snapshot


def _interventions(state: str) -> dict[str, str]:
    mapping = {
        "not_discovered": "Do not spend on conversion copy. Fix indexation, query coverage, and crawl access.",
        "discovered_no_visits": "Impressions exist. Improve title/snippet/position. Do not rebuild checkout.",
        "visits_no_conversion": "Traffic arrives. Proposition or offer is failing. Do not treat as an outage.",
        "system_prevents_conversion": "Buyers attempted checkout and the system blocked them. Fix the pay path before more traffic.",
        "conversion_path_working": "Keep measuring. Scale only the channel that produced the purchase.",
        "unknown": "Do not infer. Restore the missing evidence source first.",
    }
    return {"primary_state": state, "action": mapping[state]}


def render_markdown(snapshot: dict[str, Any]) -> str:
    classification = snapshot["classification"]
    metrics = snapshot["metrics"]
    lines = [
        "# Nebula Business Observability",
        "",
        f"Generated: `{snapshot['generated_at']}`",
        f"Period: `{snapshot['period']}` {snapshot['period_window'].get('start')} to {snapshot['period_window'].get('end_exclusive')}",
        "",
        f"**Primary state:** `{classification['primary_state']}`",
        f"**Conversion class:** `{classification['conversion_failure_class']}`",
        f"**Active states:** {', '.join(classification['active_states']) or 'none'}",
        f"**Search status:** `{classification['search_status']}`",
        "",
        f"**Intervention:** {snapshot['interventions']['action']}",
        "",
        "## Chain",
        "",
        " -> ".join(snapshot["chain"]),
        "",
        "## Metrics",
        "",
        "| Metric | Value | Classification | Source |",
        "|---|---:|---|---|",
    ]
    for name, payload in metrics.items():
        lines.append(
            f"| {name} | {payload['value']} | {payload['classification']} | {payload['source']} |"
        )
    lines.extend(["", "## Funnel attention", ""])
    attention = snapshot.get("funnel_attention") or []
    if attention:
        for item in attention:
            lines.append(f"- `{item}`")
    else:
        lines.append("- none")
    lines.extend(["", "## Layer coverage", ""])
    in_place = sum(1 for layer in snapshot["layer_coverage"] if layer["status"] == "in_place")
    partial = sum(1 for layer in snapshot["layer_coverage"] if layer["status"] == "partial")
    missing = sum(1 for layer in snapshot["layer_coverage"] if layer["status"] == "missing")
    lines.append(f"in_place={in_place} partial={partial} missing={missing} of 24")
    lines.extend(["", "| ID | Layer | Status | Gap |", "|---:|---|---|---|"])
    for layer in snapshot["layer_coverage"]:
        gap = layer.get("gap") or ""
        lines.append(f"| {layer['id']} | {layer['name']} | {layer['status']} | {gap} |")
    lines.append("")
    return "\n".join(lines)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_live_snapshot(root: Path = ROOT) -> dict[str, Any]:
    funnel_path = root / "reports" / "funnel_health" / "latest.json"
    baseline_path = root / "ACQUISITION_BASELINE.md"
    health_path = root / "pipeline_health.json"
    funnel = load_json(funnel_path)
    baseline_text = baseline_path.read_text(encoding="utf-8") if baseline_path.exists() else ""
    technical = load_json(health_path) if health_path.exists() else {}
    compact_health = {
        "healthy": technical.get("healthy"),
        "failed": technical.get("failed"),
        "passed": technical.get("passed"),
        "timestamp": technical.get("timestamp"),
    }
    return compile_snapshot(
        funnel_health=funnel,
        acquisition_baseline_text=baseline_text,
        technical_health=compact_health,
        period="daily",
    )


def write_snapshot(snapshot: dict[str, Any], report_dir: Path = REPORT_DIR) -> dict[str, Path]:
    report_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    json_path = report_dir / f"business-observability-{stamp}.json"
    md_path = report_dir / f"business-observability-{stamp}.md"
    latest_json = report_dir / "latest.json"
    latest_md = report_dir / "latest.md"
    payload = json.dumps(snapshot, indent=2) + "\n"
    markdown = render_markdown(snapshot)
    json_path.write_text(payload, encoding="utf-8")
    md_path.write_text(markdown, encoding="utf-8")
    latest_json.write_text(payload, encoding="utf-8")
    latest_md.write_text(markdown, encoding="utf-8")
    return {"json": json_path, "md": md_path, "latest_json": latest_json, "latest_md": latest_md}


def compact_line(snapshot: dict[str, Any]) -> str:
    classification = snapshot["classification"]
    metrics = snapshot["metrics"]
    return (
        f"{snapshot['generated_at']} "
        f"primary={classification['primary_state']} "
        f"class={classification['conversion_failure_class']} "
        f"checkout_failed={metrics['checkout_creation_failed']['value']} "
        f"checkout_started={metrics['checkout_started']['value']} "
        f"purchases={metrics['purchase_completed']['value']}"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--quiet", action="store_true", help="one-line heartbeat for cron")
    args = parser.parse_args()
    snapshot = build_live_snapshot()
    write_snapshot(snapshot)
    if args.json:
        print(json.dumps(snapshot, indent=2))
    elif args.quiet:
        print(compact_line(snapshot))
    else:
        print(render_markdown(snapshot))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
