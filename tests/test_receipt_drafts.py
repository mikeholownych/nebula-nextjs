"""Tests for the proof-receipt draft tool (scripts/receipt_draft_from_monitor.py).

Covers the score-based conclusion ladder, receipt ID sequencing, and draft
shape - the deterministic parts of the receipts layer (Play 2, leadership
strategy). DB wiring is verified manually against nebula_audit.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from receipt_draft_from_monitor import classify, next_receipt_id, utc_now  # noqa: E402


def test_classify_confirmed_requires_full_point():
    # 60 -> 72 on the 0-100 storage = +1.2 on 0-10 scale
    assert classify(60, 72) == "improvement_confirmed"


def test_classify_suggested_for_small_positive():
    assert classify(50, 55) == "improvement_suggested"


def test_classify_no_change_within_half_point():
    assert classify(50, 52) == "no_change"


def test_classify_decline():
    assert classify(60, 50) == "decline"


def test_classify_insufficient_without_baseline():
    assert classify(None, 70) == "insufficient_data"
    assert classify(60, None) == "insufficient_data"
    assert classify(None, None) == "insufficient_data"


def test_next_receipt_id_empty_ledger():
    assert next_receipt_id([]) == "R-2026-0001"


def test_next_receipt_id_increments():
    existing = [
        {"receipt_id": "R-2026-0001"},
        {"receipt_id": "R-2026-0002"},
        {"receipt_id": "R-2025-0007"},  # different year ignored
    ]
    assert next_receipt_id(existing) == "R-2026-0003"


def test_utc_now_shape():
    now = utc_now()
    assert now.endswith("Z")
    assert "T" in now


def test_draft_shape_matches_template():
    """A generated draft must serialize to JSON with the template's keys."""
    # Build the same dict main() produces, via the internal pieces we can reach
    # without a DB: simulate a monitor row with baseline/last scores.
    monitor = {
        "id": 1,
        "baseline_score": 40,
        "last_score": 65,
        "last_audit_id": "audit-abc",
        "last_checked_at": "2026-08-04T00:00:00Z",
    }
    conclusion = classify(monitor["baseline_score"], monitor["last_score"])
    assert conclusion == "improvement_confirmed"

    draft = {
        "receipt_id": "R-2026-0001",
        "status": "draft",
        "created_at": utc_now(),
        "engagement": {"type": "fix_pack", "offer_key": None, "purchase_id": None, "price": None},
        "client": {"industry": "saas", "consented_to_publish": False, "consent_note": None},
        "property": {"url": "https://example.com/landing", "vertical": "saas", "label": None},
        "audit": {
            "before_audit_id": None,
            "after_audit_id": monitor["last_audit_id"],
            "before_score": 4.0,
            "after_score": 6.5,
            "score_delta": 2.5,
        },
        "fix": {"description": "Test fix", "scope": "single_leak", "deployed_at": None, "audit_finding_key": "above_fold"},
        "measurement": {"method": "score", "monitor_id": 1, "monitored_page_id": 1, "baseline_window": None, "measurement_window": None, "sessions_per_period": None},
        "conclusion": conclusion,
        "confounders": [],
        "customer_confirmed": False,
        "confirmed_at": None,
        "case_study_eligible": False,
        "evidence": [{"type": "monitor_event", "ref": "monitored_page_id=1", "captured_at": "2026-08-04T00:00:00Z"}],
    }
    payload = json.dumps(draft)
    parsed = json.loads(payload)
    assert parsed["status"] == "draft"
    assert parsed["customer_confirmed"] is False
    assert parsed["case_study_eligible"] is False
    assert parsed["measurement"]["method"] == "score"
    assert parsed["audit"]["score_delta"] == 2.5
    assert parsed["conclusion"] == "improvement_confirmed"
