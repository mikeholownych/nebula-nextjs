import json
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).parents[1]
SCHEMA = ROOT / 'docs/research/backlink-placement.schema.json'
REGISTER = ROOT / 'docs/research/backlink-acquisition-register-2026-09-06.md'


def valid_record():
    return {
        'placement_id': 'placement-001',
        'status': 'candidate',
        'target_domain': 'example.org',
        'placement_url': 'https://example.org/tools/nebula',
        'canonical_destination': 'https://nebulacomponents.com/ai-info',
        'acquisition_method': 'editorial_submission',
        'source_tag': 'editorial-example-org',
        'utm': {'source': 'example-org', 'medium': 'referral', 'campaign': 'directory-test'},
        'outcomes': {'referral_sessions': 0, 'qualified_sessions': 0, 'audit_starts': 0, 'payments': 0},
        'review_window': {'placement_count': 3, 'qualified_session_threshold': 1}
    }


def validator():
    return Draft202012Validator(json.loads(SCHEMA.read_text()))


def test_register_preserves_sofrankings_exclusion_and_measurement_chain():
    text = REGISTER.read_text().lower()
    assert 'softrankings' in text
    assert 'excluded' in text
    for phrase in ('referring page', 'qualified visit', 'audit start', 'attributable payment', 'three comparable placements'):
        assert phrase in text
    assert list(validator().iter_errors(valid_record())) == []


def test_invalid_status_and_noncanonical_destination_are_rejected():
    record = valid_record()
    record['status'] = 'submitted'
    record['canonical_destination'] = 'https://nebulacomponents.shop/'
    assert list(validator().iter_errors(record))


def test_review_window_requires_three_placements_and_qualified_threshold():
    record = valid_record()
    record['review_window']['placement_count'] = 2
    record['review_window']['qualified_session_threshold'] = 0
    assert list(validator().iter_errors(record))
