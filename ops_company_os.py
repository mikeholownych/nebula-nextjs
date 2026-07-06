#!/usr/bin/env python3
"""Lightweight Nebula autonomous company operating layer.

No Redis/Supabase/Chroma: reads existing Nebula files, writes JSON/JSONL ops state.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE = Path("/home/mike/nebula")
ISO_FMT = "%Y-%m-%dT%H:%M:%SZ"

STAGE_AGENTS: dict[str, dict[str, Any]] = {
    "market": {
        "stage": "scout",
        "owns": "find public buying-trigger evidence and reject weak/no-trigger leads",
        "handoff_to": "growth",
        "done_when": "lead has URL, contact route, trigger_type, trigger_excerpt, and signal_strength >= 6",
    },
    "growth": {
        "stage": "writer_rep",
        "owns": "turn qualified trigger evidence into value-first audit artifact/outreach",
        "handoff_to": "support",
        "done_when": "audit artifact or outreach row includes exact trigger context and no-call self-serve CTA",
    },
    "support": {
        "stage": "closer_delivery",
        "owns": "audit delivery, inbox classification, checkout handoff, and fulfillment queue",
        "handoff_to": "ops-finance",
        "done_when": "audit/pitch/payment event is written to customer ledger and HOT_LEAD state is advanced",
    },
    "ops-finance": {
        "stage": "mission_control_evidence",
        "owns": "truth ledger, revenue evidence, attribution, incident reports, and kill criteria",
        "handoff_to": "ceo",
        "done_when": "company_brain numbers match ledgers and false revenue is excluded",
    },
    "ceo": {
        "stage": "mission_control_decision",
        "owns": "bottleneck decision, kill/scale orders, and escalation gates",
        "handoff_to": None,
        "done_when": "latest_ceo_directive names one bottleneck, one kill/scale decision, and next agent orders",
    },
}

HEARTBEAT_CHECKLISTS: dict[str, list[str]] = {
    "market": [
        "strong_trigger_count >= 10 or explain blocker",
        "weak/self-owned/no-trigger leads suppressed",
        "every lead has public evidence URL/excerpt",
        "channel kill criteria updated from reply/payment evidence",
    ],
    "growth": [
        "no generic volume without trigger proof",
        "each outreach row has trigger_context and source_url",
        "value-first artifact exists before paid ask",
        "CTA is self-serve audit/tool/checkout, never call/calendar/reply-yes",
    ],
    "support": [
        "inbox checked within SLA",
        "warm replies routed to audit delivery or checkout",
        "HOT_LEAD pitch_due_at honored",
        "payments create fulfillment handoff; no manual review gate",
    ],
    "ops-finance": [
        "real revenue separated from test revenue",
        "customer ledger and stats agree",
        "incidents logged for broken buyer path or checkout",
        "kill criteria evaluated from ledgers, not vibes",
    ],
    "ceo": [
        "one bottleneck named",
        "one kill/scale decision made",
        "next orders assigned by agent",
        "escalate only spend > $50, legal risk, strategic pivot, new agent, or unrecoverable credentials",
    ],
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime | None = None) -> str:
    dt = dt or utc_now()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime(ISO_FMT)


def parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).strip()
    if not text:
        return None
    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        return datetime.fromisoformat(text).astimezone(timezone.utc)
    except ValueError:
        return None


def read_json(path: Path, default: Any) -> Any:
    try:
        if not path.exists():
            return default
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict):
            rows.append(row)
    return rows


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def append_jsonl(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True) + "\n")


def as_int(value: Any) -> int:
    try:
        return int(float(value or 0))
    except Exception:
        return 0


def load_hot_leads(base: Path) -> list[dict[str, Any]]:
    raw = read_json(base / "HOT_LEAD.json", [])
    if isinstance(raw, list):
        return [r for r in raw if isinstance(r, dict)]
    return [raw] if isinstance(raw, dict) else []


def hot_lead_metrics(hot_leads: list[dict[str, Any]], now: datetime) -> dict[str, Any]:
    pending = []
    overdue = []
    pitch_sent = []
    for lead in hot_leads:
        status = str(lead.get("status") or "").lower()
        stage = str(lead.get("stage") or "").lower()
        action = str(lead.get("action") or "").lower()
        if stage == "pitch_sent" or status == "pitch_sent":
            pitch_sent.append(lead)
        if status == "pending" and (stage == "audit_delivered" or action == "send_97_pitch"):
            pending.append(lead)
            due = parse_dt(lead.get("pitch_due_at"))
            if due and due <= now:
                overdue.append(lead)
    return {
        "total": len(hot_leads),
        "hot_leads_pending": len(pending),
        "pitch_overdue": len(overdue),
        "pitch_sent": len(pitch_sent),
        "overdue_emails": [str(l.get("email") or "") for l in overdue if l.get("email")],
    }


def count_customer_events(base: Path) -> dict[str, int]:
    rows = read_jsonl(base / "ledgers" / "customer-ledger.jsonl")
    counts = {"payments": 0, "audit_delivered": 0, "warm_replies": 0, "checkout_attempts": 0}
    for row in rows:
        event = str(row.get("event_type") or row.get("action") or "").lower()
        text = json.dumps(row, sort_keys=True).lower()
        if event == "payment":
            counts["payments"] += 1
        if "audit_delivered" in event or "audit_delivered" in text:
            counts["audit_delivered"] += 1
        if "warm_reply" in event or "inbound_reply" in event or "interested" in text:
            counts["warm_replies"] += 1
        if "checkout" in event or "checkout" in text:
            counts["checkout_attempts"] += 1
    return counts


def determine_bottleneck(stats: dict[str, Any], pipeline: dict[str, Any], events: dict[str, int]) -> str:
    revenue = as_int(stats.get("real_revenue", stats.get("revenue")))
    payments = as_int(stats.get("real_payments", events.get("payments")))
    sends = as_int(stats.get("trigger_based_sends", stats.get("emails_sent")))
    warm = as_int(stats.get("trigger_warm_replies", stats.get("warm_leads", stats.get("replies"))))
    audits = as_int(stats.get("audits_delivered", events.get("audit_delivered")))
    overdue = as_int(pipeline.get("pitch_overdue"))
    if revenue <= 0 and audits >= 3 and payments == 0:
        return "audit_to_payment_conversion"
    if overdue > 0:
        return "hot_lead_followup"
    if sends >= 30 and warm == 0:
        return "trigger_targeting_or_offer_angle"
    if sends == 0:
        return "lead_flow"
    return "scale_working_signal"


def build_company_brain(base: Path = BASE, now: datetime | None = None) -> dict[str, Any]:
    now = now or utc_now()
    stats = read_json(base / "stats.json", {})
    hot_leads = load_hot_leads(base)
    pipeline = hot_lead_metrics(hot_leads, now)
    customer_events = count_customer_events(base)
    real_revenue = as_int(stats.get("real_revenue", stats.get("revenue")))
    real_payments = as_int(stats.get("real_payments", customer_events["payments"]))
    emails_sent = as_int(stats.get("emails_sent"))
    trigger_sends = as_int(stats.get("trigger_based_sends", emails_sent))
    trigger_warm = as_int(stats.get("trigger_warm_replies", stats.get("warm_leads", 0)))
    audits = as_int(stats.get("audits_delivered", customer_events["audit_delivered"]))
    brain = {
        "company": "Nebula Components",
        "generated_at": iso(now),
        "offer": "Free landing page audit -> $97 implementation",
        "trust_ladder": ["$7 impulse", "$97 audit/implementation", "$1.5k-$5k SDR service"],
        "revenue": {
            "real_revenue": real_revenue,
            "real_payments": real_payments,
            "test_revenue_excluded": bool(stats.get("test_revenue_excluded", True)),
        },
        "funnel": {
            "emails_sent": emails_sent,
            "replies": as_int(stats.get("replies")),
            "warm_leads": as_int(stats.get("warm_leads", trigger_warm)),
            "audits_delivered": audits,
            "trigger_based_sends": trigger_sends,
            "trigger_warm_replies": trigger_warm,
            "trigger_reply_rate": float(stats.get("trigger_reply_rate", 0.0) or 0.0),
            "hot_lead_pitches_sent": as_int(stats.get("hot_lead_pitches_sent", pipeline["pitch_sent"])),
        },
        "pipeline": pipeline,
        "customer_events": customer_events,
        "kill_criteria": {
            "outreach": "30 sends and 0 warm replies",
            "audit": "3 audits delivered and 0 payments",
            "checkout": "buyer cannot pay self-serve",
        },
    }
    brain["current_bottleneck"] = determine_bottleneck(stats, pipeline, customer_events)
    return brain


def clamp_score(value: int) -> int:
    return max(0, min(100, int(value)))


def score_agents(brain: dict[str, Any]) -> dict[str, Any]:
    funnel = brain["funnel"]
    revenue = brain["revenue"]
    pipeline = brain["pipeline"]
    scores: dict[str, Any] = {}

    growth_score = 65
    growth_risks: list[str] = []
    sends = as_int(funnel.get("trigger_based_sends"))
    warm = as_int(funnel.get("trigger_warm_replies"))
    if sends >= 30 and warm == 0:
        growth_score -= 35
        growth_risks.append(f"{sends} trigger sends with 0 warm replies")
    if as_int(funnel.get("audits_delivered")) > 0:
        growth_score += 10
    if as_int(revenue.get("real_payments")) > 0:
        growth_score += 25
    scores["growth"] = {
        "score": clamp_score(growth_score),
        "signals": {
            "trigger_based_sends": sends,
            "trigger_warm_replies": warm,
            "trigger_reply_rate": funnel.get("trigger_reply_rate", 0),
        },
        "risks": growth_risks,
    }

    support_score = 75
    support_risks: list[str] = []
    overdue = as_int(pipeline.get("pitch_overdue"))
    if overdue:
        support_score -= min(40, overdue * 12)
        support_risks.append(f"{overdue} pitch-due hot leads still pending")
    if as_int(funnel.get("hot_lead_pitches_sent")) == 0 and as_int(funnel.get("audits_delivered")) >= 3:
        support_score -= 15
        support_risks.append("audits delivered but no hot-lead pitches sent")
    scores["support"] = {
        "score": clamp_score(support_score),
        "signals": {
            "hot_leads_pending": pipeline.get("hot_leads_pending", 0),
            "pitch_overdue": overdue,
            "hot_lead_pitches_sent": funnel.get("hot_lead_pitches_sent", 0),
        },
        "risks": support_risks,
    }

    ops_score = 70
    ops_risks: list[str] = []
    if revenue.get("real_revenue", 0) == 0:
        ops_score -= 10
        ops_risks.append("real revenue remains $0")
    scores["ops-finance"] = {
        "score": clamp_score(ops_score),
        "signals": {
            "real_revenue": revenue.get("real_revenue", 0),
            "real_payments": revenue.get("real_payments", 0),
            "test_revenue_excluded": revenue.get("test_revenue_excluded", True),
        },
        "risks": ops_risks,
    }

    market_score = 65
    market_risks: list[str] = []
    if sends >= 30 and warm == 0:
        market_score -= 20
        market_risks.append("trigger scoring not producing warm replies")
    scores["market"] = {
        "score": clamp_score(market_score),
        "signals": {"current_bottleneck": brain.get("current_bottleneck")},
        "risks": market_risks,
    }

    scores["ceo"] = {
        "score": clamp_score(sum(v["score"] for v in scores.values()) // len(scores)),
        "signals": {"bottleneck": brain.get("current_bottleneck")},
        "risks": sorted({risk for data in scores.values() for risk in data.get("risks", [])}),
    }
    return scores


def detect_deadlocks(brain: dict[str, Any]) -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []
    funnel = brain["funnel"]
    revenue = brain["revenue"]
    pipeline = brain["pipeline"]
    sends = as_int(funnel.get("trigger_based_sends"))
    warm = as_int(funnel.get("trigger_warm_replies"))
    audits = as_int(funnel.get("audits_delivered"))
    payments = as_int(revenue.get("real_payments"))
    overdue = as_int(pipeline.get("pitch_overdue"))

    if sends >= 30 and warm == 0:
        alerts.append({
            "code": "OUTREACH_KILL_CRITERIA_MET",
            "severity": "HIGH",
            "message": f"{sends} trigger sends produced 0 warm replies; change targeting or offer angle.",
        })
    if audits >= 3 and payments == 0:
        alerts.append({
            "code": "AUDIT_TO_PAYMENT_KILL_CRITERIA_MET",
            "severity": "HIGH",
            "message": f"{audits} audits delivered and 0 real payments; reframe or reprice implementation offer.",
        })
    if overdue > 0:
        alerts.append({
            "code": "HOT_LEAD_PITCH_OVERDUE",
            "severity": "MEDIUM",
            "message": f"{overdue} hot leads are past pitch_due_at.",
            "emails": pipeline.get("overdue_emails", []),
        })
    if revenue.get("real_revenue", 0) == 0:
        alerts.append({
            "code": "ZERO_REVENUE",
            "severity": "MEDIUM",
            "message": "Revenue is still $0; prioritize checkout-verifiable paid action.",
        })
    return alerts


def build_handoff_queues(
    brain: dict[str, Any], scores: dict[str, Any], alerts: list[dict[str, Any]]
) -> dict[str, Any]:
    """Create GTM-style explicit handoff queues from live Nebula state."""
    alert_codes = {str(a.get("code")) for a in alerts}
    bottleneck = str(brain.get("current_bottleneck") or "unknown")
    queue: dict[str, Any] = {
        "generated_at": brain.get("generated_at", iso()),
        "bottleneck": bottleneck,
        "stage_agents": STAGE_AGENTS,
        "queues": [],
    }

    def add(agent: str, priority: int, trigger: str, required_artifact: str) -> None:
        meta = STAGE_AGENTS[agent]
        queue["queues"].append({
            "agent": agent,
            "stage": meta["stage"],
            "priority": priority,
            "trigger": trigger,
            "required_artifact": required_artifact,
            "handoff_to": meta["handoff_to"],
            "acceptance": meta["done_when"],
            "score": scores.get(agent, {}).get("score"),
        })

    if "OUTREACH_KILL_CRITERIA_MET" in alert_codes or bottleneck == "trigger_targeting_or_offer_angle":
        add(
            "market",
            90,
            "trigger outreach produced 0 warm replies",
            "10 ranked strong-trigger leads with evidence URL/excerpt and weak-signal exclusions",
        )
        add(
            "growth",
            80,
            "market lead queue needs trigger-specific artifacts",
            "10 value-first audit artifacts/outreach rows with trigger_context and self-serve CTA",
        )

    if "AUDIT_TO_PAYMENT_KILL_CRITERIA_MET" in alert_codes or bottleneck == "audit_to_payment_conversion":
        add(
            "support",
            95,
            "audits delivered but paid conversion is weak",
            "checkout-safe audit-to-$97 pitch flow verified by dry run/test and ledger row",
        )
        add(
            "growth",
            70,
            "paid conversion bottleneck requires stronger value proof before more volume",
            "rewrite audit artifact ending around implementation-ready fix pack, no human-contact CTA",
        )

    if "HOT_LEAD_PITCH_OVERDUE" in alert_codes:
        add(
            "support",
            100,
            "hot lead pitch_due_at passed",
            "pitch sent or incident row explaining why it could not be sent",
        )

    if "ZERO_REVENUE" in alert_codes or brain.get("revenue", {}).get("real_revenue", 0) == 0:
        add(
            "ops-finance",
            85,
            "real revenue remains zero or unverified",
            "revenue-evidence snapshot proving checkout/payment state and excluding tests",
        )

    add(
        "ceo",
        60,
        "daily mission control synthesis",
        "one bottleneck, one kill/scale decision, and next 3 agent orders in latest_ceo_directive",
    )
    queue["queues"].sort(key=lambda row: (-as_int(row["priority"]), str(row["agent"])))
    return queue


def build_heartbeat_checklists(brain: dict[str, Any]) -> dict[str, Any]:
    return {
        "generated_at": brain.get("generated_at", iso()),
        "cadence": {
            "market_growth": "before each outreach wave",
            "support": "every inbox/audit run",
            "ops-finance": "daily before CEO memo",
            "ceo": "daily decision memo",
        },
        "checklists": HEARTBEAT_CHECKLISTS,
    }


def generate_ceo_directive(
    brain: dict[str, Any], scores: dict[str, Any], alerts: list[dict[str, Any]]
) -> dict[str, Any]:
    bottleneck = str(brain.get("current_bottleneck") or "unknown")
    overdue = as_int(brain["pipeline"].get("pitch_overdue"))
    audits = as_int(brain["funnel"].get("audits_delivered"))
    support_order = "Pitch all overdue hot leads now; log each pitch and outcome."
    if overdue == 0:
        support_order = "Monitor inbox and route replies to self-serve audit or checkout within 15 minutes."
    directive_text = "Convert delivered audits into paid $97 implementation before adding more volume."
    if bottleneck == "trigger_targeting_or_offer_angle":
        directive_text = "Stop weak targeting; source only public pain-trigger leads and rewrite the first-line offer."
    handoffs = build_handoff_queues(brain, scores, alerts)
    return {
        "timestamp": brain.get("generated_at", iso()),
        "bottleneck": bottleneck,
        "directive": directive_text,
        "agent_orders": {
            "growth": "Stop generic volume; source 10 trigger-proof leads with public ad/conversion pain evidence.",
            "support": support_order,
            "market": "Rank lead sources by public pain signal strength; kill weak channels after 30 sends and 0 warm replies.",
            "ops-finance": "Verify real revenue, checkout path, and ledger integrity; exclude test payments.",
        },
        "operating_model": {
            "source_pattern": "gtm-skills stage-specific agents + explicit handoffs + heartbeat checklist",
            "stage_order": ["market", "growth", "support", "ops-finance", "ceo"],
            "forbidden_gates": ["calendar", "book a call", "manual review", "reply yes"],
            "default_path": "trigger -> automated audit/tool -> self-serve checkout -> automated delivery/ledger",
        },
        "handoff_queue": handoffs["queues"],
        "heartbeat_checklists": HEARTBEAT_CHECKLISTS,
        "evidence": {
            "real_revenue": brain["revenue"].get("real_revenue", 0),
            "real_payments": brain["revenue"].get("real_payments", 0),
            "audits_delivered": audits,
            "pitch_overdue": overdue,
            "alerts": [a["code"] for a in alerts],
            "scores": {k: v["score"] for k, v in scores.items()},
        },
    }


def sync_ops_state(base: Path = BASE, now: datetime | None = None) -> dict[str, Any]:
    now = now or utc_now()
    ops = base / "ops"
    brain = build_company_brain(base, now)
    scores = score_agents(brain)
    alerts = detect_deadlocks(brain)
    directive = generate_ceo_directive(brain, scores, alerts)
    handoffs = build_handoff_queues(brain, scores, alerts)
    heartbeats = build_heartbeat_checklists(brain)

    write_json(ops / "company_brain.json", brain)
    write_json(ops / "agent_scores.json", scores)
    write_json(ops / "handoff_queues.json", handoffs)
    write_json(ops / "agent_heartbeat_checklists.json", heartbeats)
    write_json(ops / "latest_ceo_directive.json", directive)
    append_jsonl(ops / "ceo_directives.jsonl", directive)
    for alert in alerts:
        alert_row = {"timestamp": brain["generated_at"], **alert}
        append_jsonl(ops / "deadlock_alerts.jsonl", alert_row)
    append_jsonl(ops / "agent_reports.jsonl", {
        "timestamp": brain["generated_at"],
        "agent": "ceo",
        "event_type": "ops_state_synced",
        "bottleneck": brain["current_bottleneck"],
        "alerts": len(alerts),
    })
    append_jsonl(ops / "task_log.jsonl", {
        "timestamp": brain["generated_at"],
        "task_id": f"ceo-sync-{brain['generated_at']}",
        "agent": "ceo",
        "status": "completed",
        "action": "sync_ops_state",
        "result": directive["directive"],
        "score": scores["ceo"]["score"],
    })
    return {
        "brain": brain,
        "scores": scores,
        "alerts": alerts,
        "directive": directive,
        "handoffs": handoffs,
        "heartbeats": heartbeats,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Nebula lightweight company OS state")
    parser.add_argument("--base", default=str(BASE), help="Nebula base directory")
    parser.add_argument("--json", action="store_true", help="Print full JSON result")
    args = parser.parse_args()
    result = sync_ops_state(Path(args.base))
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        directive = result["directive"]
        print(f"Bottleneck: {directive['bottleneck']}")
        print(f"Directive: {directive['directive']}")
        print(f"Alerts: {', '.join(directive['evidence']['alerts']) or 'none'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
