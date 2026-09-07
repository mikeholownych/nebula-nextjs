import json
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).parents[1]
SCHEMA = ROOT / 'docs/research/five-page-comparative-study.schema.json'
PROTOCOL = ROOT / 'docs/research/2026-09-06-five-page-comparative-study.md'


def valid_study():
    return {
        'study_id': 'study-2026-09-06-001',
        'status': 'draft',
        'engine_version': '1.29.0',
        'audit_conditions': 'same public audit configuration and viewport set',
        'publication_decision': 'blocked_pending_review',
        'pages': [
            {
                'url': f'https://competitor-{i}.example',
                'source_type': 'primary_public_source',
                'traffic_provenance': 'publicly_inspectable',
                'selection_rationale': 'Publicly inspectable comparison target',
                'captured_at': '2026-09-06T00:00:00Z',
                'evidence_package': f'evidence-{i}'
            }
            for i in range(1, 6)
        ],
        'limitations': ['Public inspection does not establish paid traffic or conversion outcomes.']
    }


def validator():
    return Draft202012Validator(json.loads(SCHEMA.read_text()))


def test_protocol_requires_five_sourced_pages_and_same_engine_conditions():
    text = PROTOCOL.read_text().lower()
    for phrase in ('five', 'traffic_provenance', 'verified_paid', 'publicly_inspectable', 'unknown', 'same engine', 'conversion'):
        assert phrase in text
    assert list(validator().iter_errors(valid_study())) == []


def test_unknown_traffic_cannot_be_labeled_paid():
    study = valid_study()
    study['pages'][0]['traffic_provenance'] = 'unknown'
    study['pages'][0]['label'] = 'paid-traffic page'
    assert list(validator().iter_errors(study))


def test_study_rejects_wrong_page_count_and_unsupported_comparative_claim():
    study = valid_study()
    study['pages'] = study['pages'][:4]
    study['comparative_claim'] = 'better conversion'
    assert list(validator().iter_errors(study))
