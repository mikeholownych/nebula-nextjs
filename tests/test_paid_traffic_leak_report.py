import json
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from paid_traffic_leak_report import ReportValidationError, build_report, write_report


BASE = {
    "report_id": "ptr-001",
    "created_at": "2026-08-13T12:00:00Z",
    "prospect_id": "lead-001",
    "landing_page_url": "https://example.com/landing",
    "campaign_copy": "Stop wasting paid traffic on a page that does not convert.",
    "conversion_goal": "demo request",
    "audit_id": "audit-001",
    "message_match_finding": "The ad promises a conversion diagnosis, but the page opens with a generic agency headline.",
    "evidence": [
        {"source": "campaign_copy", "observed": "conversion diagnosis"},
        {"source": "page:h1", "observed": "Full-service growth partner"},
    ],
    "priority_leak": "The first viewport does not repeat the paid-traffic problem the visitor clicked to solve.",
    "confidence": "high",
    "replacement_headline": "Find the landing-page leak wasting your paid traffic",
    "replacement_subheadline": "See the specific mismatch and the first fix before you spend more on clicks.",
    "replacement_cta": "Show me the leak",
    "implementation_notes": ["Replace the current hero headline", "Place the diagnosis CTA above the fold"],
    "experiment_brief": {
        "hypothesis": "Repeating the paid-traffic problem in the hero will increase qualified audit starts.",
        "primary_metric": "completed audit starts",
        "traffic_note": "Traffic volume is insufficient for a valid A/B test; run a concierge comparison first.",
        "stop_rule": "Stop after 10 qualified prospects or one attributable purchase.",
        "rollback_rule": "Restore the current hero if the revised message creates a qualified-prospect complaint.",
    },
}


def test_build_report_returns_hash_and_canonical_checkout():
    report = build_report(BASE)
    assert report["checkout_url"] == "https://buy.stripe.com/9B63cvc2o7YMcid2Nk43S0j"
    assert len(report["content_hash"]) == 64
    assert report["evidence"] == BASE["evidence"]


def test_build_report_rejects_missing_evidence():
    payload = {**BASE, "evidence": []}
    with pytest.raises(ReportValidationError, match="evidence"):
        build_report(payload)


def test_build_report_rejects_multiple_primary_leaks():
    payload = {**BASE, "priority_leak": ["first leak", "second leak"]}
    with pytest.raises(ReportValidationError, match="one primary leak"):
        build_report(payload)


def test_build_report_rejects_invalid_landing_url():
    payload = {**BASE, "landing_page_url": "not-a-url"}
    with pytest.raises(ReportValidationError, match="landing_page_url"):
        build_report(payload)


def test_build_report_rejects_raw_email_and_secret_material():
    for field, value in [
        ("campaign_copy", "Contact mike@example.com"),
        ("implementation_notes", ["token=secret-value"]),
        ("message_match_finding", "sk_live_123456789"),
    ]:
        payload = {**BASE, field: value}
        with pytest.raises(ReportValidationError, match="sensitive"):
            build_report(payload)


def test_write_report_rejects_duplicate_report_id(tmp_path):
    write_report(BASE, root=tmp_path)
    with pytest.raises(ReportValidationError, match="already exists"):
        write_report(BASE, root=tmp_path)


def test_report_keeps_insufficient_traffic_guidance():
    report = build_report(BASE)
    assert "insufficient" in report["experiment_brief"]["traffic_note"].lower()


def test_cli_writes_artifact_without_echoing_sensitive_input(tmp_path):
    payload = {**BASE, "prospect_id": "lead-cli-001"}
    input_path = tmp_path / "input.json"
    input_path.write_text(json.dumps(payload), encoding="utf-8")
    root = tmp_path / "reports"
    result = subprocess.run(
        [sys.executable, "scripts/create_paid_traffic_leak_report.py", str(input_path), "--root", str(root)],
        cwd=Path(__file__).resolve().parents[1],
        text=True,
        capture_output=True,
    )
    assert result.returncode == 0
    artifact = Path(result.stdout.strip().splitlines()[0])
    assert artifact.exists()
    assert "content_hash=" in result.stdout
    assert "@" not in result.stdout


def test_cli_invalid_payload_exits_without_artifact(tmp_path):
    input_path = tmp_path / "input.json"
    input_path.write_text(json.dumps({"report_id": "invalid"}), encoding="utf-8")
    root = tmp_path / "reports"
    result = subprocess.run(
        [sys.executable, "scripts/create_paid_traffic_leak_report.py", str(input_path), "--root", str(root)],
        cwd=Path(__file__).resolve().parents[1],
        text=True,
        capture_output=True,
    )
    assert result.returncode == 2
    assert not root.exists()
