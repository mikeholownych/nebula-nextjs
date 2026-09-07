import json
from pathlib import Path

ROOT = Path(__file__).parents[1]
STATUS = ROOT / 'docs/research/2026-09-06-commercialization-gate-status.md'


def test_current_gate_is_open_validation_with_explicit_missing_evidence():
    text = STATUS.read_text()
    assert 'OPEN_VALIDATION' in text
    assert 'Revenue: `$0`' in text
    assert 'five-paying-customer threshold: unmet' in text
    assert 'no attributable paid-client case study' in text
    assert '500 stamped audits' in text
    assert '14-day' in text


def test_gate_forbids_signal_and_icp_expansion_until_evidence_exists():
    text = STATUS.read_text().lower()
    assert 'signal expansion' in text
    assert 'prohibited' in text
    assert 'icp expansion' in text
    assert 'five paying customers' in text


def test_ready_for_review_requires_nonzero_payments():
    text = STATUS.read_text()
    assert 'READY_FOR_REVIEW' in text
    assert 'payment_count > 0' in text
    assert 'payment_count == 0' in text
