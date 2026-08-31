from platform_api.services.epistemic import (
    condition_id_for,
    determination_from_evidence,
    not_established_for,
    observation_integrity,
)


def test_empty_html_is_unusable_and_indeterminate():
    integrity, reason = observation_integrity(html="")
    assert integrity == "unusable"
    assert reason == "empty_html"
    assert (
        determination_from_evidence(
            passed=False,
            evidence={"confidence": "high"},
            integrity=integrity,
        )
        == "INDETERMINATE"
    )


def test_unavailable_evidence_does_not_become_fail():
    assert (
        determination_from_evidence(
            passed=False,
            evidence={"confidence": "unavailable"},
            integrity="usable",
        )
        == "INDETERMINATE"
    )


def test_inapplicable_signal_is_not_applicable():
    assert (
        determination_from_evidence(
            passed=False,
            evidence={"confidence": "high"},
            applicable=False,
        )
        == "NOT_APPLICABLE"
    )


def test_fail_carries_not_established_boundary():
    assert not_established_for("FAIL")
    assert "conversion" in (not_established_for("FAIL") or "").lower()
    assert not_established_for("PASS") is None
    assert not_established_for("INDETERMINATE") is None


def test_legacy_keys_map_to_versioned_condition_ids():
    assert condition_id_for("cta") == "PRIMARY_CTA_CLARITY_V1"
    assert condition_id_for("above_fold") == "ABOVE_FOLD_CLARITY_V1"
    assert condition_id_for("unknown_signal").startswith("UNREGISTERED_")
