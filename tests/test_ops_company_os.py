import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

from ops_company_os import (
    append_jsonl,
    build_company_brain,
    build_handoff_queues,
    build_heartbeat_checklists,
    detect_deadlocks,
    generate_ceo_directive,
    score_agents,
    sync_ops_state,
)


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def write_jsonl(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")


def make_nebula_fixture(tmp_path: Path) -> Path:
    base = tmp_path / "nebula"
    (base / "ledgers").mkdir(parents=True)
    now = datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc)
    write_json(base / "stats.json", {
        "revenue": 0,
        "emails_sent": 30,
        "replies": 0,
        "warm_leads": 1,
        "audits_delivered": 3,
        "real_revenue": 0,
        "real_payments": 0,
        "trigger_based_sends": 30,
        "trigger_warm_replies": 0,
        "trigger_reply_rate": 0.0,
        "hot_lead_pitches_sent": 0,
    })
    write_json(base / "HOT_LEAD.json", [
        {
            "email": "a@example.com",
            "stage": "audit_delivered",
            "status": "pending",
            "audit_score": 7.2,
            "pitch_due_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "email": "b@example.com",
            "stage": "closed",
            "status": "completed",
        },
    ])
    write_jsonl(base / "outreach_evidence.jsonl", [
        {"timestamp": now.isoformat(), "event_type": "email_sent", "agent": "growth"}
        for _ in range(30)
    ])
    write_jsonl(base / "ledgers/customer-ledger.jsonl", [
        {"timestamp": now.isoformat(), "event_type": "audit_delivered", "email": "a@example.com"},
        {"timestamp": now.isoformat(), "event_type": "audit_delivered", "email": "c@example.com"},
        {"timestamp": now.isoformat(), "event_type": "audit_delivered", "email": "d@example.com"},
    ])
    write_jsonl(base / "followup_state.jsonl", [])
    return base


def test_build_company_brain_extracts_revenue_funnel_and_bottleneck(tmp_path):
    base = make_nebula_fixture(tmp_path)

    brain = build_company_brain(base, now=datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc))

    assert brain["company"] == "Nebula Components"
    assert brain["funnel"]["emails_sent"] == 30
    assert brain["funnel"]["audits_delivered"] == 3
    assert brain["revenue"]["real_revenue"] == 0
    assert brain["pipeline"]["hot_leads_pending"] == 1
    assert brain["current_bottleneck"] == "audit_to_payment_conversion"
    assert brain["kill_criteria"]["outreach"] == "30 sends and 0 warm replies"
    assert brain["specialist_agent_architecture"]["principle"].startswith("one agent, one role")
    assert set(brain["specialist_agent_architecture"]["agents"]) == {"market", "growth", "support", "ops-finance", "ceo"}
    assert brain["specialist_agent_architecture"]["agents"]["market"]["role"] == "Signal Detector + Market Mapper"


def test_score_agents_rewards_outcomes_not_activity(tmp_path):
    base = make_nebula_fixture(tmp_path)
    brain = build_company_brain(base, now=datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc))

    scores = score_agents(brain)

    assert scores["growth"]["score"] < 50
    assert "30 trigger sends with 0 warm replies" in scores["growth"]["risks"]
    assert scores["support"]["score"] < 70
    assert "1 pitch-due hot leads still pending" in scores["support"]["risks"]
    assert scores["ops-finance"]["signals"]["real_revenue"] == 0


def test_detect_deadlocks_flags_kill_conditions_and_stale_hot_leads(tmp_path):
    base = make_nebula_fixture(tmp_path)
    brain = build_company_brain(base, now=datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc))

    alerts = detect_deadlocks(brain)

    codes = {a["code"] for a in alerts}
    assert "OUTREACH_KILL_CRITERIA_MET" in codes
    assert "AUDIT_TO_PAYMENT_KILL_CRITERIA_MET" in codes
    assert "HOT_LEAD_PITCH_OVERDUE" in codes
    assert all(a["severity"] in {"HIGH", "MEDIUM", "LOW"} for a in alerts)


def test_generate_ceo_directive_prioritizes_revenue_path(tmp_path):
    base = make_nebula_fixture(tmp_path)
    brain = build_company_brain(base, now=datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc))
    scores = score_agents(brain)
    alerts = detect_deadlocks(brain)

    directive = generate_ceo_directive(brain, scores, alerts)

    assert directive["bottleneck"] == "audit_to_payment_conversion"
    assert directive["directive"]
    assert directive["agent_orders"]["support"].startswith("Pitch")
    assert directive["agent_orders"]["growth"].startswith("Stop generic volume")
    assert directive["evidence"]["real_revenue"] == 0
    assert directive["operating_model"]["stage_order"] == ["market", "growth", "support", "ops-finance", "ceo"]
    assert "manual review" in directive["operating_model"]["forbidden_gates"]
    assert directive["operating_model"]["specialist_rule"].startswith("one agent owns one mission")
    assert directive["specialist_agent_setup"]["growth"]["trigger"]
    assert len(directive["specialist_agent_setup"]["support"]["prompts"]) == 3
    assert any(row["agent"] == "support" and row["handoff_to"] == "ops-finance" for row in directive["handoff_queue"])


def test_build_handoff_queues_turns_alerts_into_stage_specific_work(tmp_path):
    base = make_nebula_fixture(tmp_path)
    brain = build_company_brain(base, now=datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc))
    scores = score_agents(brain)
    alerts = detect_deadlocks(brain)

    handoffs = build_handoff_queues(brain, scores, alerts)

    agents = [row["agent"] for row in handoffs["queues"]]
    assert agents[0] == "support"  # overdue pitch is highest priority
    assert {"market", "growth", "support", "ops-finance", "ceo"}.issubset(set(agents))
    assert handoffs["stage_agents"]["market"]["stage"] == "scout"
    assert all(row["acceptance"] for row in handoffs["queues"])


def test_build_heartbeat_checklists_encodes_no_theater_checks(tmp_path):
    base = make_nebula_fixture(tmp_path)
    brain = build_company_brain(base, now=datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc))

    heartbeats = build_heartbeat_checklists(brain)

    assert "support" in heartbeats["checklists"]
    assert any("stay inside" in item for item in heartbeats["checklists"]["ceo"])
    assert any("self-serve" in item for item in heartbeats["checklists"]["growth"])
    assert any("real revenue" in item for item in heartbeats["checklists"]["ops-finance"])


def test_sync_ops_state_writes_operating_files_and_jsonl_reports(tmp_path):
    base = make_nebula_fixture(tmp_path)

    result = sync_ops_state(base, now=datetime(2026, 7, 4, 12, 0, tzinfo=timezone.utc))

    ops = base / "ops"
    assert (ops / "company_brain.json").exists()
    assert (ops / "agent_scores.json").exists()
    assert (ops / "handoff_queues.json").exists()
    assert (ops / "agent_heartbeat_checklists.json").exists()
    assert (ops / "deadlock_alerts.jsonl").exists()
    assert (ops / "ceo_directives.jsonl").exists()
    assert result["directive"]["bottleneck"] == "audit_to_payment_conversion"
    rows = [json.loads(line) for line in (ops / "ceo_directives.jsonl").read_text().splitlines()]
    assert rows[-1]["agent_orders"]["support"].startswith("Pitch")


def test_append_jsonl_creates_parent_and_appends_valid_json(tmp_path):
    target = tmp_path / "ops" / "task_log.jsonl"
    append_jsonl(target, {"task_id": "growth-001", "status": "completed"})
    append_jsonl(target, {"task_id": "support-001", "status": "pending"})

    rows = [json.loads(line) for line in target.read_text().splitlines()]
    assert [r["task_id"] for r in rows] == ["growth-001", "support-001"]
