import re

import audit_evidence
from audit_evidence import enrich_findings_with_evidence


def _finding(key):
    return {"key": key, "issue": "test issue", "score": 0}


def test_cta_contrast_parsing_is_independent_of_css_property_order():
    html = """
    <html><body>
      <a href="/get-started" style="background-color:#3D9970; color:#4CAF50">Get started</a>
    </body></html>
    """
    result = enrich_findings_with_evidence([_finding("cta")], html)
    evidence = result[0]["evidence"]
    assert "fg: #4CAF50" in evidence["measured"]
    assert "bg: #3D9970" in evidence["measured"]
    assert "1.26:1" in evidence["measured"]
    assert evidence["confidence"] == "high"
    assert "source-level inline styles" in evidence["required"].lower()


def test_large_inline_cta_uses_three_to_one_source_threshold():
    html = '<button style="font-size:24px;background-color:#777;color:#fff">Buy</button>'
    evidence = enrich_findings_with_evidence([_finding("cta")], html)[0]["evidence"]
    assert "3.0:1" in evidence["required"]
    assert "passes source-level" in evidence["delta"].lower()


def test_cta_href_matching_is_case_insensitive():
    html = '<a href="/Get-Started">Start now</a>'
    evidence = enrich_findings_with_evidence([_finding("cta")], html)[0]["evidence"]
    assert 'CTA source text: "Start now"' in evidence["measured"]


def test_above_fold_evidence_is_labelled_as_unrendered_proxy():
    html = "<html><body><p>Intro only</p></body></html>"
    evidence = enrich_findings_with_evidence([_finding("above_fold")], html)[0]["evidence"]
    assert "early html proxy" in evidence["measured"].lower()
    assert "not a rendered viewport measurement" in evidence["required"]
    assert evidence["confidence"] == "contextual"


def test_ad_signal_detection_uses_normalized_lowercase_terms():
    html = "<script>fbq('track', 'Purchase'); gtag('event', 'conversion')</script>"
    evidence = enrich_findings_with_evidence([_finding("ad_signals")], html)[0]["evidence"]
    assert "Facebook Pixel" in evidence["measured"]
    assert "explicit conversion call" in evidence["measured"]


def test_generic_lead_copy_is_not_reported_as_conversion_tracking():
    html = "<html><body><p>We help lead teams succeed.</p></body></html>"
    evidence = enrich_findings_with_evidence([_finding("ad_signals")], html)[0]["evidence"]

    assert "explicit conversion call" in evidence["measured"]
    assert "not observed: Facebook Pixel initializer, GA4 initializer or measurement ID, UTM-bearing link, explicit conversion call" in evidence["measured"]
    assert evidence["confidence"] == "contextual"


def test_enrichment_does_not_mutate_input_and_timestamp_is_utc_iso():
    original = _finding("headline")
    result = enrich_findings_with_evidence([original], "<h1>Short</h1>")
    assert "evidence" not in original
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", result[0]["evidence"]["timestamp"])


def test_builder_failure_is_explicit_and_non_fatal(monkeypatch):
    def fail(*_args):
        raise RuntimeError("boom")

    monkeypatch.setitem(audit_evidence.EVIDENCE_BUILDERS, "headline", fail)
    result = enrich_findings_with_evidence([_finding("headline")], "<h1>A real headline here</h1>")
    assert result[0]["evidence"]["confidence"] == "unavailable"
    assert result[0]["evidence"]["measured"] == "Evidence unavailable for this finding"
    assert "boom" not in str(result[0]["evidence"])


def test_evidence_fields_are_bounded_and_selectors_do_not_embed_raw_href():
    hostile = "x" * 20_000
    html = f'<a href="/{hostile}\" ] body {{ display:none }}" style="color:#fff;background:#fff">{hostile}</a>'
    evidence = enrich_findings_with_evidence([_finding("cta")], html)[0]["evidence"]
    assert all(len(str(evidence[key])) <= 500 for key in ("measured", "required", "delta", "selector"))
    assert hostile[:1000] not in evidence["selector"]


def test_meta_description_over_155_is_reported_and_is_contextual():
    html = f'<title>{"T" * 40}</title><meta name="description" content="{"D" * 300}"><h1>One headline</h1>'
    evidence = enrich_findings_with_evidence([_finding("seo_foundations")], html)[0]["evidence"]
    assert "300 chars" in evidence["delta"]
    assert evidence["confidence"] == "contextual"


def test_ai_readiness_validates_jsonld_and_nonempty_metadata():
    html = '''
      <script type="application/ld+json">not json</script>
      <meta property="og:title" content="">
      <link rel="canonical" href="">
    '''
    evidence = enrich_findings_with_evidence([_finding("ai_readiness")], html)[0]["evidence"]
    assert "valid JSON-LD: 0" in evidence["measured"]
    assert "OpenGraph: 0/5" in evidence["measured"]
    assert "Canonical: absent" in evidence["measured"]
    assert evidence["confidence"] == "contextual"


def test_enrichment_adds_contrast_finding_even_when_cta_copy_score_passed():
    html = '<a href="/buy" style="background-color:#3D9970;color:#4CAF50">Buy now</a>'
    findings = enrich_findings_with_evidence([], html)
    cta = next(finding for finding in findings if finding["key"] == "cta")
    assert "1.26:1" in cta["evidence"]["measured"]
    assert cta["issue"].lower().startswith("cta source-level contrast")
