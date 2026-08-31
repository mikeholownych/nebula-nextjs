from platform_api.services.epistemic import (
    attach_epistemic,
    collect_invariants,
    condition_id_for,
    condition_ref,
    determination_confidence_for,
    determination_from_evidence,
    diff_determinations,
    gated_signal_keys,
    not_established_for,
    observation_integrity,
    stamp_finding,
)


def test_empty_html_is_unusable_and_indeterminate():
    integrity, reason = observation_integrity(html="")
    assert integrity == "unusable"
    assert reason == "CAPTURE_INCOMPLETE"
    determination, code = determination_from_evidence(
        passed=False,
        evidence={"confidence": "high"},
        integrity=integrity,
        integrity_reason=reason,
    )
    assert determination == "INDETERMINATE"
    assert code == "CAPTURE_INCOMPLETE"


def test_unavailable_evidence_does_not_become_fail():
    determination, code = determination_from_evidence(
        passed=False,
        evidence={"confidence": "unavailable", "selector": "#cta"},
        integrity="usable",
    )
    assert determination == "INDETERMINATE"
    assert code == "INSUFFICIENT_EVIDENCE"


def test_unresolved_selector_uses_element_unresolved():
    determination, code = determination_from_evidence(
        passed=False,
        evidence={"confidence": "unavailable", "selector": "N/A"},
        integrity="usable",
    )
    assert determination == "INDETERMINATE"
    assert code == "ELEMENT_UNRESOLVED"


def test_inapplicable_signal_is_not_applicable():
    determination, code = determination_from_evidence(
        passed=False,
        evidence={"confidence": "high"},
        applicable=False,
    )
    assert determination == "NOT_APPLICABLE"
    assert code == "INTENT_NOT_APPLICABLE"


def test_fail_carries_not_established_boundary():
    assert not_established_for("FAIL")
    assert "conversion" in (not_established_for("FAIL") or "").lower()
    assert not_established_for("PASS") is None
    assert not_established_for("INDETERMINATE") is None


def test_legacy_keys_map_to_versioned_condition_ids():
    ref = condition_ref("cta")
    assert ref["condition_id"] == "PRIMARY_CTA_CLARITY"
    assert ref["condition_version"] == 1
    assert condition_id_for("above_fold") == "ABOVE_FOLD_CLARITY"
    assert condition_id_for("unknown_signal").startswith("UNREGISTERED_")


def test_integrity_and_determination_confidence_are_separate():
    assert (
        determination_confidence_for(
            determination="REVIEW",
            integrity="usable",
            evidence={"confidence": "high"},
        )
        == "high"
    )
    assert (
        determination_confidence_for(
            determination="INDETERMINATE",
            integrity="unusable",
            evidence={"confidence": "high"},
        )
        == "none"
    )


def test_stamp_finding_does_not_change_score_or_issue():
    finding = {
        "key": "cta",
        "score": 3.0,
        "issue": "original issue",
        "fix": "original fix",
        "evidence": {"confidence": "unavailable", "selector": "N/A"},
    }
    stamped = stamp_finding(
        finding,
        integrity="usable",
        integrity_reason=None,
        passed=False,
    )
    assert finding["score"] == 3.0
    assert finding["issue"] == "original issue"
    assert stamped["score"] == 3.0
    assert stamped["issue"] == "original issue"
    assert stamped["fix"] == "original fix"
    assert stamped["determination"] == "INDETERMINATE"
    assert stamped["evidence"]["confidence"] == "unavailable"


def test_faq_cta_is_not_applicable():
    assert "cta" in gated_signal_keys(["cta", "mobile"], "faq_support")
    assert "mobile" not in gated_signal_keys(["cta", "mobile"], "faq_support")
    assert gated_signal_keys(["cta"], "unknown") == set()


def test_attach_epistemic_preserves_public_scores():
    result = {
        "overall": 6.2,
        "overall_grade": "C",
        "composite": 6.4,
        "engine_version": "2.1.0",
        "dimensions": {
            "cta": {"score": 3.0, "weight": "high", "issue": "weak", "fix": "x"},
            "mobile": {"score": 9.0, "weight": "medium", "issue": "ok", "fix": "x"},
        },
        "opp_matrix": [
            {
                "key": "cta",
                "score": 3.0,
                "issue": "weak",
                "fix": "x",
                "evidence": {"confidence": "high"},
            }
        ],
    }
    attach_epistemic(result, html="<html><body><h1>Hello world landing page copy here</h1></body></html>" * 5)
    assert result["overall"] == 6.2
    assert result["composite"] == 6.4
    assert result["observation"]["integrity"] == "usable"
    assert result["case_file"]["determinations"]
    counts = result["case_file"]["determination_counts"]
    assert counts.get("FAIL") == 1
    assert counts.get("PASS") == 1
    assert result["opp_matrix"][0]["condition_id"] == "PRIMARY_CTA_CLARITY"


def test_bot_challenge_is_indeterminate_not_fail():
    html = "<title>Just a moment...</title><p>cloudflare</p>"
    result = {
        "overall": 4.0,
        "composite": 4.0,
        "engine_version": "2.1.0",
        "dimensions": {"cta": {"score": 2.0, "weight": "high"}},
        "opp_matrix": [{"key": "cta", "score": 2.0, "evidence": {"confidence": "high"}}],
    }
    attach_epistemic(result, html=html, title="Just a moment...")
    assert result["observation"]["integrity"] == "unusable"
    assert result["observation"]["reason_code"] == "BOT_CHALLENGE"
    assert result["opp_matrix"][0]["determination"] == "INDETERMINATE"
    assert result["overall"] == 4.0


def test_condition_transition_is_verified_only_for_pass_fail():
    before = [{"condition_id": "PRIMARY_CTA_CLARITY", "condition_version": 1, "determination": "FAIL"}]
    after = [{"condition_id": "PRIMARY_CTA_CLARITY", "condition_version": 1, "determination": "PASS"}]
    diff = diff_determinations(before, after)
    assert len(diff) == 1
    assert diff[0]["verified_condition_change"] is True
    assert "conversion" in diff[0]["not_established"].lower()


def test_unusable_integrity_cannot_pass():
    violations = collect_invariants(
        {
            "observation": {"integrity": "unusable"},
            "case_file": {
                "determinations": [
                    {"condition_id": "PRIMARY_CTA_CLARITY", "determination": "PASS"}
                ]
            },
        }
    )
    assert any(v.startswith("unusable_integrity_pass:") for v in violations)


def test_stamp_does_not_mutate_score_invariant():
    result = {
        "overall": 5.0,
        "composite": 5.1,
        "engine_version": "2.1.0",
        "dimensions": {"cta": {"score": 3.0, "weight": "high"}},
        "opp_matrix": [{"key": "cta", "score": 3.0, "evidence": {"confidence": "high"}}],
    }
    attach_epistemic(result, html="<html><body>" + ("landing page copy " * 40) + "</body></html>")
    assert collect_invariants(result, {"overall": 5.0, "composite": 5.1}) == []
    assert result["overall"] == 5.0
    assert result["composite"] == 5.1
