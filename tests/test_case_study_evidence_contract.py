import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

ROOT = Path(__file__).parents[1]
SCHEMA_PATH = ROOT / 'docs/outcomes/case-study-record.schema.json'
CONTRACT_PATH = ROOT / 'docs/outcomes/case-study-evidence-contract.md'


def validator():
    schema = json.loads(SCHEMA_PATH.read_text())
    return Draft202012Validator(schema)


def valid_record():
    return {
        'record_id': 'case-2026-001',
        'publication_status': 'internal_only',
        'payment': {'receipt_id': 'pi_redacted', 'paid_at': '2026-09-06', 'amount_cents': 9700, 'currency': 'USD'},
        'customer': {'customer_id': 'customer-redacted', 'consent': {'granted': False}},
        'pre_intervention_audit': {'audit_id': 'audit-pre', 'completed_at': '2026-09-06', 'condition_id': 'headline_message_match', 'determination': 'FAIL'},
        'intervention': {'artifact_id': 'artifact-001', 'description': 'Exact page-specific replacement', 'applied_at': '2026-09-07'},
        'post_intervention_reaudit': {'audit_id': 'audit-post', 'completed_at': '2026-10-07', 'condition_id': 'headline_message_match', 'determination': 'PASS', 'same_scope': True},
        'outcomes': [],
    }


def test_contract_and_schema_require_provenance_complete_customer_evidence():
    assert 'payment receipt' in CONTRACT_PATH.read_text().lower()
    assert 'customer_reported' in CONTRACT_PATH.read_text()
    assert 'measured' in CONTRACT_PATH.read_text()
    assert 'numerator' in CONTRACT_PATH.read_text().lower()
    assert 'FAIL-to-PASS' in CONTRACT_PATH.read_text()

    errors = list(validator().iter_errors(valid_record()))
    assert errors == []


def test_incomplete_record_is_rejected():
    record = valid_record()
    del record['payment']
    errors = list(validator().iter_errors(record))
    assert any('payment' in error.message for error in errors)


def test_percentage_without_denominator_and_source_is_rejected():
    record = valid_record()
    record['outcomes'] = [{'kind': 'business_outcome', 'source_type': 'customer_reported', 'percentage': 23}]
    errors = list(validator().iter_errors(record))
    assert errors


def test_fail_to_pass_record_cannot_claim_conversion_proof():
    record = valid_record()
    record['outcomes'] = [{
        'kind': 'conversion_lift',
        'source_type': 'measured',
        'claim': 'FAIL to PASS caused conversion lift',
        'numerator': 23,
        'denominator': 100,
        'window': '2026-09-06/2026-10-07',
        'source_reference': 'analytics',
    }]
    errors = list(validator().iter_errors(record))
    assert errors
