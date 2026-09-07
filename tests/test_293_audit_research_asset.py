from pathlib import Path


SPEC = Path(__file__).parents[1] / 'docs/superpowers/specs/2026-09-06-293-audit-research-asset.md'


def test_293_asset_is_gated_when_authoritative_registry_has_no_293_record():
    text = SPEC.read_text()

    assert 'OPEN_VALIDATION' in text
    assert '293' in text
    assert '131' in text
    assert 'not publish' in text.lower()
    assert 'DatasetRecord' in text
    assert 'non-causality' in text.lower()


def test_research_asset_requires_denominator_and_provenance_for_every_number():
    text = SPEC.read_text().lower()

    for requirement in ('scope', 'collection window', 'provenance', 'source path', 'sample size'):
        assert requirement in text
    assert 'conversion lift' in text
    assert 'revenue' in text
    assert 'case stud' in text


def test_illustrative_walkthrough_cannot_contain_fabricated_outcomes():
    text = SPEC.read_text().lower()

    assert 'illustrative walkthrough' in text
    assert 'no invented' in text
    assert 'payment' in text
    assert 're-audit outcome' in text
