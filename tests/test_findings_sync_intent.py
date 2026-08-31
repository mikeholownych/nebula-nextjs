from platform_api.services.epistemic import gated_signal_keys
from platform_api.services.findings_sync import _provenance
from platform_api.services.signal_intent_map import is_relevant


def test_faq_does_not_treat_cta_absence_as_pass():
    existing = ["cta", "mobile"]
    na = gated_signal_keys(existing, "faq_support")
    assert "cta" in na
    assert "mobile" not in na


def test_unknown_intent_gates_nothing():
    assert gated_signal_keys(["cta", "headline"], "unknown") == set()


def test_is_relevant_unknown_keeps_conversion_signals():
    assert is_relevant("cta", "unknown") is True
    assert is_relevant("cta", "faq_support") is False


def test_provenance_copies_condition_identity_and_not_established():
    finding = {
        "condition_id": "PRIMARY_CTA_CLARITY",
        "condition_version": 1,
        "registry_version": "2026.08.31",
        "determination": "FAIL",
        "scoring_provenance": {"rule": "cta"},
    }
    prov = _provenance(finding, "paid_landing")
    assert prov["condition_id"] == "PRIMARY_CTA_CLARITY"
    assert prov["condition_version"] == 1
    assert prov["determination"] == "FAIL"
    assert prov["not_established"]
    assert prov["page_intent"] == "paid_landing"
