from pathlib import Path

PROTOCOL = Path(__file__).parents[1] / 'docs/research/2026-09-06-agency-pilot-protocol.md'


def test_agency_pilot_is_bounded_and_attribution_ready():
    text = PROTOCOL.read_text().lower()
    for phrase in ('one pilot package', 'one referral path', 'client consent', 'audit receipt', 'repair artifact', 'stop', 'three qualified partner conversations', 'attributable payment'):
        assert phrase in text
    assert 'recurring pricing' in text
    assert 'no broad agency program' in text


def test_pilot_does_not_overclaim_unverified_white_label_capabilities():
    text = PROTOCOL.read_text().lower()
    assert 'white-label' in text
    assert 'verified in the running product' in text
    assert 'do not publish partner logos' in text
    assert 'do not promise' in text


def test_pilot_requires_consent_before_client_data_processing_or_publication():
    text = PROTOCOL.read_text().lower()
    assert 'consent before processing' in text
    assert 'publication permission' in text
    assert 'client audit data' in text
