import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import newsletter_autopilot as autopilot


def test_draft_is_valid_and_has_repair_structure():
    research = {
        "source_file": "/tmp/source.json",
        "source_url": "https://example.com/source",
        "finding": "Visitors cannot connect the headline to the promised outcome.",
        "track": "headline-clarity",
        "headline": "The headline leak",
        "created_at": "2026-08-12T08:00:00+00:00",
    }
    issue = autopilot.edit(autopilot.draft(research))
    assert autopilot.validate(issue) == []
    assert "The page condition is worth looking at" in issue["text"]
    assert "decide what success means" in issue["text"]
    assert "See what Nebula finds" in issue["text"]
    assert "Unsubscribe" in issue["text"]


def test_unsupported_outcome_claim_blocks_publication():
    research = {
        "source_file": "/tmp/source.json",
        "source_url": "https://example.com/source",
        "finding": "Visitors cannot connect the headline to the promised outcome.",
        "track": "headline-clarity",
        "headline": "The headline leak",
    }
    issue = autopilot.draft(research)
    issue["text"] += " Found in 23% of audits this week."
    assert any("unsupported outcome claim" in error for error in autopilot.validate(issue))


def test_stale_content_queue_does_not_publish(tmp_path, monkeypatch):
    queue = tmp_path / "content_queue"
    queue.mkdir()
    (queue / "old.json").write_text(json.dumps({
        "created_at": "2020-01-01T00:00:00+00:00",
        "finding": "Old finding",
    }))
    monkeypatch.setattr(autopilot, "QUEUE", queue)
    monkeypatch.setattr(autopilot, "BASE", tmp_path)
    with pytest.raises(RuntimeError, match="No fresh research artifact"):
        autopilot.load_research()


def test_research_inbox_is_source_fallback(tmp_path, monkeypatch):
    from datetime import datetime, timezone, timedelta
    queue = tmp_path / "content_queue"
    queue.mkdir()
    inbox = tmp_path / "ops" / "research" / "inbox.jsonl"
    inbox.parent.mkdir(parents=True)
    fresh_time = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    inbox.write_text(json.dumps({
        "created_at": fresh_time,
        "source_url": "https://example.com/source",
        "source_type": "prospect_evidence",
        "observed_problem": "Paid traffic reaches the page but does not convert.",
        "title": "Observed conversion problem",
        "evidence_excerpt": "A founder reports paid traffic with no conversions.",
    }) + "\n")
    monkeypatch.setattr(autopilot, "QUEUE", queue)
    monkeypatch.setattr(autopilot, "BASE", tmp_path)
    result = autopilot.load_research()
    assert result["source_url"] == "https://example.com/source"
    assert result["finding"].startswith("Paid traffic")


def test_production_fallback_keeps_weekly_content_available(monkeypatch):
    monkeypatch.setattr(autopilot, "QUEUE", Path("/tmp/nebula-no-content-queue"))
    monkeypatch.setattr(autopilot, "BASE", Path(autopilot.__file__).resolve().parent)
    monkeypatch.setattr(autopilot, "PRODUCTION_FALLBACK_ENABLED", True)
    result = autopilot.load_research()
    assert result["evidence_class"] in {"production_self_audit", "public_teardown"}
    assert autopilot.validate(autopilot.edit(autopilot.draft(result))) == []


def test_html_render_contains_preheader_and_linked_urls():
    research = {
        "source_file": "/tmp/source.json",
        "source_url": "https://example.com/source",
        "finding": "Paid traffic reaches the landing page but visitors cannot find the next action.",
        "track": "cta-clarity",
        "headline": "The next action is hard to find",
    }
    issue = autopilot.edit(autopilot.draft(research))
    rendered = autopilot.render_html(issue)
    assert issue["preheader"] in rendered
    assert "<a href='https://nebulacomponents.com/audit" in rendered


def test_compliance_footer_has_identity_address_and_unsubscribe():
    text = autopilot.compliance_text("reader@example.com")
    rendered = autopilot.render_html({"text": "A useful issue.", "preheader": "Preview"}, "reader@example.com")
    assert "confirmed a Nebula Components newsletter subscription" in text
    assert autopilot.BUSINESS_ADDRESS in text
    assert "https://nebulacomponents.com/unsubscribe?email=reader%40example.com" in text
    assert "List-Unsubscribe" not in rendered


def test_agentmail_marketing_send_accepts_compliance_headers():
    from agentmail_client import AgentMailClient
    from outbound_release_gate import DeliveryPurpose, GateDecision

    captured = {}
    def transport(method, path, data):
        captured.update(data)
        return {"message_id": "msg-1"}

    class Gate:
        def reserve(self, recipient, client_id, *, purpose):
            return GateDecision(True, "reserved", client_id)
        def validate(self, client_id):
            return GateDecision(True, "validated", client_id)
        def complete(self, client_id, *, sent, reason="", provider_message_id=""):
            return None
        def sent_receipt(self, client_id):
            return None

    client = AgentMailClient(
        inbox="hello@nebulacomponents.com",
        key="test-key",
        gate=Gate(),
        transport=transport,
    )
    result = client.send(
        ["reader@example.com"],
        "Subject",
        text="Body",
        client_id="auto:test-header",
        headers={"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"},
    )
    assert result.get("message_id") == "msg-1"
    assert captured["headers"]["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"


def test_release_metadata_records_source_freshness_and_rights():
    research = {
        "source_file": "https://nebulacomponents.com/teardowns/basecamp",
        "source_url": "https://nebulacomponents.com/teardowns/basecamp",
        "finding": "The first viewport hides the primary CTA.",
        "track": "above-fold-clarity",
        "headline": "Can visitors find the next action?",
        "content_source": "production_teardown_fallback",
        "rights_status": "publicly_observable_generalized_finding",
        "researched_at": "2026-08-12T00:00:00+00:00",
    }
    issue = autopilot.edit(autopilot.draft(research))
    metadata = autopilot.release_metadata(issue, [])
    assert metadata["content_source"] == "production_teardown_fallback"
    assert metadata["freshness_validation"]["passed"] is True
    assert metadata["rights_validation_passed"] is True
    assert metadata["release_status"] == "APPROVED_FOR_SEND"


def test_semantic_duplicate_is_high_risk():
    issue = {"issue_key": "new", "finding": "CTA clarity for visitors", "track": "cta-clarity", "text": "one"}
    prior = {"issue_key": "old", "finding": "CTA clarity for visitors", "track": "cta-clarity", "text": "one", "content_fingerprint": autopilot.content_fingerprint(issue)}
    risk, similar = autopilot.duplicate_risk(issue, [prior])
    assert risk == "high"
    assert similar == ["old"]


def test_human_editor_review_rejects_boilerplate_and_filler():
    issue = {"text": "Why it matters\n\nHere's the thing.\n\nThe bottom line?\n\nUnlock growth."}
    review = autopilot.human_editor_review(issue)
    assert review["passed"] is False
    assert review["issues"]


def test_editorial_review_iterates_weak_copy_until_it_passes():
    research = {
        "source_file": "/tmp/source.json",
        "source_url": "https://example.com/source",
        "finding": "Visitors cannot connect the headline to the promised outcome.",
        "track": "headline-clarity",
        "headline": "The headline leak",
    }
    issue = autopilot.draft(research)
    issue["text"] = "Here's the thing.\n\nWhy it matters\n\nUnlock growth.\n\n" + issue["text"]
    issue, review = autopilot.iterate_editorial_review(issue)
    assert review["passed"] is True
    assert issue["editorial_revision_count"] >= 1
    assert "Here's the thing" not in issue["text"]
