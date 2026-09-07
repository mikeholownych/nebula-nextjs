import json
from pathlib import Path

import pytest

from scripts.render_finding_annotation import render_annotation


def finding(determination='FAIL', selector='h1', timestamp='2026-09-06T00:00:00Z'):
    return {
        'audit_id': 'audit-public-001',
        'condition_id': 'headline_message_match',
        'determination': determination,
        'selector': selector,
        'measured': 'Observed headline text differs from the declared ad promise',
        'required': 'Headline should preserve the primary promise',
        'delta': 'Message continuity is not established',
        'threshold': 'same primary promise',
        'timestamp': timestamp,
        'capture_path': 'capture.png',
    }


def test_renders_standalone_public_annotation_for_fail(tmp_path):
    capture = tmp_path / 'capture.png'
    capture.write_bytes(b'not-a-real-png-but-a-verified-fixture')
    output = tmp_path / 'annotation.svg'

    render_annotation(finding(), capture, output, now='2026-09-06T12:00:00Z')

    text = output.read_text()
    assert 'PUBLIC AUDIT / NOT A CUSTOMER' in text
    assert 'audit-public-001' in text
    assert 'headline_message_match' in text
    assert 'FAIL' in text
    assert 'h1' in text
    assert 'Observed headline text differs' in text
    assert 'data:image/png;base64,' in text


def test_renders_pass_annotation_without_inventing_failure(tmp_path):
    capture = tmp_path / 'capture.png'
    capture.write_bytes(b'fixture')
    output = tmp_path / 'annotation.svg'

    render_annotation(finding(determination='PASS'), capture, output, now='2026-09-06T12:00:00Z')

    text = output.read_text()
    assert '>PASS<' in text
    assert 'FAIL' not in text


@pytest.mark.parametrize('bad_finding', [
    finding(selector='N/A'),
    finding(selector=''),
    finding(determination='INDETERMINATE'),
    finding(determination='NOT_APPLICABLE'),
    finding(timestamp='2020-01-01T00:00:00Z'),
])
def test_fails_closed_when_evidence_is_insufficient(tmp_path, bad_finding):
    capture = tmp_path / 'capture.png'
    capture.write_bytes(b'fixture')
    output = tmp_path / 'annotation.svg'

    with pytest.raises(ValueError):
        render_annotation(bad_finding, capture, output, now='2026-09-06T12:00:00Z')
    assert not output.exists()


def test_fails_closed_when_capture_is_missing(tmp_path):
    with pytest.raises(ValueError):
        render_annotation(finding(), tmp_path / 'missing.png', tmp_path / 'annotation.svg')
