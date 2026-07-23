from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import sqlite3
from typing import cast

from outbound_release_gate import DeliveryPurpose, OutboundReleaseGate


def _lead_db(path: Path, *, email: str, stage: str = "discovered", bounce_type: str = "") -> Path:
    with sqlite3.connect(path) as conn:
        conn.execute(
            "CREATE TABLE leads (email TEXT PRIMARY KEY COLLATE NOCASE, stage TEXT NOT NULL, bounce_type TEXT NOT NULL DEFAULT '')"
        )
        conn.execute(
            "INSERT INTO leads(email, stage, bounce_type) VALUES (?, ?, ?)",
            (email, stage, bounce_type),
        )
    return path


def _gate(tmp_path: Path, *, email="lead@example.com", stage="discovered", clock=lambda: 1_000.0):
    replied = tmp_path / "replied.jsonl"
    replied.touch(exist_ok=True)
    return OutboundReleaseGate(
        state_db=tmp_path / "outbound.db",
        lead_db=_lead_db(tmp_path / "leads.db", email=email, stage=stage),
        replied_path=replied,
        disable_marker=tmp_path / "OUTREACH_DISABLED",
        clock=clock,
    )


def test_bounced_lead_is_blocked(tmp_path: Path):
    gate = _gate(tmp_path, email="bounced@example.com", stage="bounced")
    decision = gate.reserve(
        "bounced@example.com", "campaign:bounced:step1", purpose=DeliveryPurpose.MARKETING
    )
    assert decision.allowed is False
    assert decision.reason == "lead_bounced"


def test_global_disable_marker_blocks_all_delivery(tmp_path: Path):
    gate = _gate(tmp_path)
    gate.disable_marker.write_text("maintenance")
    decision = gate.reserve(
        "lead@example.com", "audit:lead:delivery", purpose=DeliveryPurpose.AUDIT_DELIVERY
    )
    assert decision.allowed is False
    assert decision.reason == "outreach_disabled"


def test_missing_reply_ledger_fails_closed(tmp_path: Path):
    gate = _gate(tmp_path)
    gate.replied_path.unlink()
    decision = gate.reserve(
        "lead@example.com", "campaign:lead:step1", purpose=DeliveryPurpose.MARKETING
    )
    assert decision.reason == "reply_store_unavailable"


def test_human_reply_blocks_marketing(tmp_path: Path):
    gate = _gate(tmp_path)
    gate.replied_path.write_text(json.dumps({"email": "lead@example.com", "classification": "warm"}) + "\n")
    decision = gate.reserve(
        "lead@example.com", "campaign:lead:step1", purpose=DeliveryPurpose.MARKETING
    )
    assert decision.reason == "lead_replied"


def test_replied_stage_blocks_marketing_but_allows_requested_audit(tmp_path: Path):
    gate = _gate(tmp_path, stage="replied")
    marketing = gate.reserve(
        "lead@example.com", "campaign:lead:step1", purpose=DeliveryPurpose.MARKETING
    )
    audit = gate.reserve(
        "lead@example.com", "audit:lead:delivery", purpose=DeliveryPurpose.AUDIT_DELIVERY
    )
    assert marketing.reason == "lead_replied"
    assert audit.allowed is True


def test_unsubscribe_variants_block_requested_audit(tmp_path: Path):
    for classification in ("unsubscribe", "unsubscribed", "do_not_contact"):
        case = tmp_path / classification
        case.mkdir()
        gate = _gate(case)
        gate.replied_path.write_text(
            json.dumps({"email": "lead@example.com", "classification": classification}) + "\n"
        )
        decision = gate.reserve(
            "lead@example.com", "audit:lead:delivery", purpose=DeliveryPurpose.AUDIT_DELIVERY
        )
        assert decision.reason == "lead_unsubscribed"


def test_unknown_lead_is_blocked_for_every_buyer_scope(tmp_path: Path):
    gate = _gate(tmp_path, email="other@example.com")
    marketing = gate.reserve(
        "unknown@example.com", "campaign:unknown:step1", purpose=DeliveryPurpose.MARKETING
    )
    audit = gate.reserve(
        "unknown@example.com", "audit:unknown:delivery", purpose=DeliveryPurpose.AUDIT_DELIVERY
    )
    conversation = gate.reserve(
        "unknown@example.com", "conversation:unknown:reply", purpose=DeliveryPurpose.CONVERSATION_REPLY
    )
    assert {marketing.reason, audit.reason, conversation.reason} == {"unknown_lead"}


def test_string_purpose_and_wrong_client_scope_are_rejected(tmp_path: Path):
    gate = _gate(tmp_path)
    string_scope = gate.reserve(
        "lead@example.com",
        "audit:lead:delivery",
        purpose=cast(DeliveryPurpose, "audit_delivery"),
    )
    wrong_prefix = gate.reserve(
        "lead@example.com", "campaign:lead:step1", purpose=DeliveryPurpose.AUDIT_DELIVERY
    )
    assert string_scope.reason == "invalid_request"
    assert wrong_prefix.reason == "invalid_client_id_scope"


def test_duplicate_client_id_is_blocked(tmp_path: Path):
    gate = _gate(tmp_path)
    first = gate.reserve("lead@example.com", "campaign:lead:step1", purpose=DeliveryPurpose.MARKETING)
    second = gate.reserve("lead@example.com", "campaign:lead:step1", purpose=DeliveryPurpose.MARKETING)
    assert first.allowed is True
    assert second.reason == "duplicate_client_id"


def test_mailbox_cooldown_blocks_second_distinct_send(tmp_path: Path):
    now = [1_000.0]
    gate = _gate(tmp_path, clock=lambda: now[0])
    first = gate.reserve("lead@example.com", "campaign:lead:step1", purpose=DeliveryPurpose.MARKETING)
    now[0] = 1_100.0
    second = gate.reserve("lead@example.com", "campaign:lead:step2", purpose=DeliveryPurpose.MARKETING)
    assert first.allowed is True
    assert second.reason == "mailbox_cooldown"


def test_failed_provider_attempt_requeues_only_after_cooldown(tmp_path: Path):
    now = [1_000.0]
    gate = _gate(tmp_path, clock=lambda: now[0])
    client_id = "audit:lead:delivery"
    assert gate.reserve("lead@example.com", client_id, purpose=DeliveryPurpose.AUDIT_DELIVERY).allowed
    gate.complete(client_id, sent=False, reason="500")
    now[0] = 1_100.0
    assert gate.reserve("lead@example.com", client_id, purpose=DeliveryPurpose.AUDIT_DELIVERY).reason == "mailbox_cooldown"
    now[0] = 1_301.0
    assert gate.reserve("lead@example.com", client_id, purpose=DeliveryPurpose.AUDIT_DELIVERY).allowed


def test_parallel_reservations_admit_exactly_one_slot(tmp_path: Path):
    lead_db = _lead_db(tmp_path / "leads.db", email="one@example.com")
    with sqlite3.connect(lead_db) as conn:
        conn.execute("INSERT INTO leads VALUES (?, ?, ?)", ("two@example.com", "discovered", ""))
    replied = tmp_path / "replied.jsonl"
    replied.touch()
    gates = [
        OutboundReleaseGate(
            state_db=tmp_path / "outbound.db",
            lead_db=lead_db,
            replied_path=replied,
            disable_marker=tmp_path / "OUTREACH_DISABLED",
            clock=lambda: 1_000.0,
        )
        for _ in range(2)
    ]
    with ThreadPoolExecutor(max_workers=2) as pool:
        decisions = list(
            pool.map(
                lambda args: args[0].reserve(args[1], args[2], purpose=DeliveryPurpose.MARKETING),
                [(gates[0], "one@example.com", "campaign:1"), (gates[1], "two@example.com", "campaign:2")],
            )
        )
    assert sum(decision.allowed for decision in decisions) == 1
    assert sorted(decision.reason for decision in decisions) == ["mailbox_cooldown", "reserved"]


def test_simultaneous_first_time_initialization_is_safe(tmp_path: Path):
    lead_db = _lead_db(tmp_path / "leads.db", email="lead@example.com")
    replied = tmp_path / "replied.jsonl"
    replied.touch()

    def build_gate(_):
        return OutboundReleaseGate(
            state_db=tmp_path / "new-outbound.db",
            lead_db=lead_db,
            replied_path=replied,
            disable_marker=tmp_path / "OUTREACH_DISABLED",
        )

    with ThreadPoolExecutor(max_workers=4) as pool:
        gates = list(pool.map(build_gate, range(4)))
    assert len(gates) == 4


def test_stale_crashed_reservation_can_retry_same_id(tmp_path: Path):
    now = [1_000.0]
    gate = _gate(tmp_path, clock=lambda: now[0])
    assert gate.reserve("lead@example.com", "campaign:1", purpose=DeliveryPurpose.MARKETING).allowed
    now[0] += 901
    assert gate.reserve("lead@example.com", "campaign:1", purpose=DeliveryPurpose.MARKETING).allowed


def test_preflight_revalidation_revokes_new_disable_or_reply(tmp_path: Path):
    disabled_case = tmp_path / "disabled"
    disabled_case.mkdir()
    disabled = _gate(disabled_case)
    client_id = "campaign:lead:step1"
    assert disabled.reserve("lead@example.com", client_id, purpose=DeliveryPurpose.MARKETING).allowed
    disabled.disable_marker.write_text("stop")
    assert disabled.validate(client_id).reason == "outreach_disabled"

    reply_case = tmp_path / "reply"
    reply_case.mkdir()
    replied = _gate(reply_case)
    client_id = "campaign:lead:step1"
    assert replied.reserve("lead@example.com", client_id, purpose=DeliveryPurpose.MARKETING).allowed
    replied.replied_path.write_text(json.dumps({"email": "lead@example.com", "classification": "warm"}) + "\n")
    assert replied.validate(client_id).reason == "lead_replied"


def test_blocked_decisions_are_written_to_event_ledger(tmp_path: Path):
    gate = _gate(tmp_path, email="bad@example.com", stage="bounced")
    gate.reserve("bad@example.com", "campaign:1", purpose=DeliveryPurpose.MARKETING)
    with sqlite3.connect(gate.state_db) as conn:
        event = conn.execute(
            "SELECT allowed, reason FROM delivery_events WHERE client_id = ?", ("campaign:1",)
        ).fetchone()
    assert event == (0, "lead_bounced")
