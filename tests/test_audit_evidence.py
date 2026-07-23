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
    assert evidence["confidence"] == "definitive"


def test_cta_href_matching_is_case_insensitive():
    html = '<a href="/Get-Started">Start now</a>'
    evidence = enrich_findings_with_evidence([_finding("cta")], html)[0]["evidence"]
    assert evidence["measured"] == 'CTA present: "Start now"'


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
    assert "Conversion event" in evidence["measured"]


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
    assert result[0]["evidence"]["confidence"] == "error"
    assert "boom" in result[0]["evidence"]["measured"]
