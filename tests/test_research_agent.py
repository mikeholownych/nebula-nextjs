import json
from pathlib import Path

from research_agent import critic, run


def brain(bottleneck="audit_to_payment_conversion"):
    return {"current_bottleneck": bottleneck}


def valid_item(**overrides):
    item = {
        "id": "r-001",
        "source_url": "https://example.com/evidence",
        "source_type": "prospect_evidence",
        "title": "Founder reports paid traffic with no sales",
        "observed_problem": "Paid traffic reaches a landing page but buyers do not convert.",
        "evidence_excerpt": "I spent $900 on ads and got clicks but no sales from the landing page.",
        "claim": "Specific post-click diagnosis is more useful than generic conversion advice.",
        "why_nebula": "This matches the current audit-to-payment bottleneck and the trigger-aware ICP.",
        "smallest_safe_change": "Record the exact buyer phrase for later outreach review.",
        "expected_metric": "attributable purchases per 10 trigger-based sends",
        "validation_window": "14 days",
        "stop_condition": "Stop if no qualified replies after 20 reviewed sends.",
        "action_type": "record_buyer_language",
        "buyer_language": "clicks but no sales",
        "confidence": "high",
    }
    item.update(overrides)
    return item


def test_critic_accepts_relevant_evidence():
    review = critic(valid_item(), brain(), set())
    assert review["accepted"] is True
    assert review["score"] >= 70
    assert review["reasons"] == []


def test_low_confidence_source_can_create_bounded_purchase_experiment():
    item = valid_item(
        source_type="video",
        action_type="create_experiment_brief",
        expected_metric="attributable purchases from the experiment",
        confidence="low",
    )
    review = critic(item, brain(), set())
    assert review["accepted"] is True
    assert review["score"] < 70
    from research_agent import action_for
    assert action_for(item, review) == "create_experiment_brief"


def test_critic_rejects_non_sales_primary_metric():
    review = critic(valid_item(expected_metric="replies per 10 sends"), brain(), set())
    assert review["accepted"] is False
    assert "expected_metric must include attributable purchases or revenue" in review["reasons"]


def test_critic_rejects_generic_or_unsafe_action():
    review = critic(
        valid_item(
            smallest_safe_change="Send an email campaign and publish the claim.",
            action_type="send_email",
        ),
        brain(),
        set(),
    )
    assert review["accepted"] is False
    assert any("blocked side effect" in reason for reason in review["reasons"])
    assert any("action_type not allowed" in reason for reason in review["reasons"])


def test_critic_rejects_cloning_without_attributable_sales_proof():
    review = critic(
        valid_item(action_type="clone_sales_pattern"),
        brain(),
        set(),
    )
    assert review["accepted"] is False
    assert any("action_type not allowed" in reason for reason in review["reasons"])
    assert any("attributable sales proof" in reason for reason in review["reasons"])


def test_critic_rejects_duplicates():
    item = valid_item()
    fingerprint = critic(item, brain(), set())["fingerprint"]
    review = critic(item, brain(), {fingerprint})
    assert review["accepted"] is False
    assert "duplicate evidence fingerprint" in review["reasons"]


def test_run_applies_only_bounded_local_action(tmp_path: Path):
    (tmp_path / "ops" / "research").mkdir(parents=True)
    (tmp_path / "growth_system").mkdir()
    (tmp_path / "stats.json").write_text(json.dumps({"real_revenue": 0, "real_payments": 0, "audits_delivered": 3, "trigger_based_sends": 0}))
    (tmp_path / "HOT_LEAD.json").write_text("[]")
    (tmp_path / "ledgers").mkdir()
    (tmp_path / "ledgers" / "customer-ledger.jsonl").write_text("")
    (tmp_path / "ops" / "research" / "inbox.jsonl").write_text(json.dumps(valid_item()) + "\n")

    result = run(tmp_path, apply=True)

    assert result["receipt"]["implemented"] == 1
    candidate_file = tmp_path / "ops" / "research" / "buyer_language_candidates.jsonl"
    assert candidate_file.exists()
    row = json.loads(candidate_file.read_text().splitlines()[0])
    assert row["phrase"] == "clicks but no sales"
    assert (tmp_path / "HOT_LEAD.json").read_text() == "[]"


def test_run_writes_rejection_receipt(tmp_path: Path):
    (tmp_path / "ops" / "research").mkdir(parents=True)
    (tmp_path / "stats.json").write_text(json.dumps({"real_revenue": 0, "real_payments": 0, "audits_delivered": 0, "trigger_based_sends": 0}))
    (tmp_path / "HOT_LEAD.json").write_text("[]")
    (tmp_path / "ledgers").mkdir()
    (tmp_path / "ledgers" / "customer-ledger.jsonl").write_text("")
    (tmp_path / "ops" / "research" / "inbox.jsonl").write_text(json.dumps({"id": "bad", "source_url": "not-a-url"}) + "\n")

    result = run(tmp_path, apply=True)

    assert result["receipt"]["accepted"] == 0
    assert result["receipt"]["decisions"]["reject"] == 1
    assert (tmp_path / "ops" / "research" / "receipts.jsonl").exists()
