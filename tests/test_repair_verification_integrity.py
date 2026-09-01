"""
Repair verification integrity tests.

These tests enforce the measurement contracts for reaudit transitions:
  - Only FAIL→PASS on the same condition_id AND condition_version is REMEDIATED
  - Condition version drift between observations is INCOMPARABLE, not REMEDIATED
  - PASS→FAIL is REGRESSION
  - FAIL→FAIL is PERSISTED_FAIL
  - Missing baseline is ineligible
  - Duplicate observation is ineligible
  - INDETERMINATE on either side is INDETERMINATE, not a repair credit

The specific failure mode being prevented:
  - seo_foundations@v1 FAIL + seo_foundations@v2 PASS counted as remediation
    when the rule changed, not the page.
"""
import pytest
import sys
import os

# Add the nebula root to path so we can import the epistemic module directly.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from platform_api.services.epistemic import (
    diff_determinations,
    classify_reaudit_transition,
    validate_reaudit_pair,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def finding(cid: str, ver: int, determination: str) -> dict:
    return {
        "condition_id": cid,
        "condition_version": ver,
        "determination": determination,
    }


def audit(audit_id: str, findings: list) -> dict:
    return {"id": audit_id, "findings": findings}


# ---------------------------------------------------------------------------
# diff_determinations: core transition logic
# ---------------------------------------------------------------------------

class TestDiffDeterminations:

    def test_fail_to_pass_is_verified_change(self):
        before = [finding("PRIMARY_CTA_CLARITY", 1, "FAIL")]
        after  = [finding("PRIMARY_CTA_CLARITY", 1, "PASS")]
        transitions = diff_determinations(before, after)
        assert len(transitions) == 1
        t = transitions[0]
        assert t["condition_id"] == "PRIMARY_CTA_CLARITY"
        assert t["from"] == "FAIL"
        assert t["to"] == "PASS"
        assert t["verified_condition_change"] is True
        assert "incomparable" not in t

    def test_pass_to_fail_is_not_suppressed(self):
        """Regressions must be visible, not silently dropped."""
        before = [finding("TRUST_PROOF_PROXIMITY", 1, "PASS")]
        after  = [finding("TRUST_PROOF_PROXIMITY", 1, "FAIL")]
        transitions = diff_determinations(before, after)
        assert len(transitions) == 1
        t = transitions[0]
        assert t["from"] == "PASS"
        assert t["to"] == "FAIL"
        assert t["verified_condition_change"] is True

    def test_fail_to_fail_produces_no_transition(self):
        """Unchanged failure must not appear as a transition."""
        before = [finding("HEADLINE_CLARITY", 1, "FAIL")]
        after  = [finding("HEADLINE_CLARITY", 1, "FAIL")]
        transitions = diff_determinations(before, after)
        assert transitions == [], "FAIL→FAIL must produce no transition"

    def test_pass_to_pass_produces_no_transition(self):
        before = [finding("HEADLINE_CLARITY", 1, "PASS")]
        after  = [finding("HEADLINE_CLARITY", 1, "PASS")]
        transitions = diff_determinations(before, after)
        assert transitions == [], "PASS→PASS must produce no transition"

    def test_condition_version_changed_is_incomparable(self):
        """FAIL@v1 → PASS@v2 on the same condition_id must be INCOMPARABLE.
        The rule definition may have changed; this is not a repair credit."""
        before = [finding("SEO_FOUNDATIONS", 1, "FAIL")]
        after  = [finding("SEO_FOUNDATIONS", 2, "PASS")]
        transitions = diff_determinations(before, after)
        assert len(transitions) == 1
        t = transitions[0]
        assert t.get("incomparable") is True, (
            "Version change between observations must be flagged INCOMPARABLE, "
            "not credited as remediation."
        )
        assert t["verified_condition_change"] is False
        assert t.get("incomparable_reason") == "CONDITION_VERSION_CHANGED"

    def test_indeterminate_before_is_not_repair_credit(self):
        """INDETERMINATE→PASS cannot be called a repair. The baseline observation
        was unreliable; we cannot establish the FAIL state."""
        before = [finding("MOBILE_CTA_VISIBILITY", 1, "INDETERMINATE")]
        after  = [finding("MOBILE_CTA_VISIBILITY", 1, "PASS")]
        transitions = diff_determinations(before, after)
        assert len(transitions) == 1
        t = transitions[0]
        # This is a state change, but verified_condition_change must be False
        # because INDETERMINATE is not a deterministic FAIL.
        assert t["verified_condition_change"] is False, (
            "INDETERMINATE→PASS is not a repair credit: baseline was unreliable."
        )

    def test_multiple_conditions_independent(self):
        before = [
            finding("PRIMARY_CTA_CLARITY", 1, "FAIL"),
            finding("TRUST_PROOF_PROXIMITY", 1, "PASS"),
            finding("HEADLINE_CLARITY", 1, "FAIL"),
        ]
        after = [
            finding("PRIMARY_CTA_CLARITY", 1, "PASS"),
            finding("TRUST_PROOF_PROXIMITY", 1, "FAIL"),
            finding("HEADLINE_CLARITY", 1, "FAIL"),
        ]
        transitions = diff_determinations(before, after)
        by_cid = {t["condition_id"]: t for t in transitions}
        assert "PRIMARY_CTA_CLARITY" in by_cid
        assert "TRUST_PROOF_PROXIMITY" in by_cid
        assert "HEADLINE_CLARITY" not in by_cid  # FAIL→FAIL, no transition


# ---------------------------------------------------------------------------
# classify_reaudit_transition
# ---------------------------------------------------------------------------

class TestClassifyReauditTransition:

    def test_fail_to_pass_is_remediated(self):
        t = {"from": "FAIL", "to": "PASS", "verified_condition_change": True}
        assert classify_reaudit_transition(t) == "REMEDIATED"

    def test_pass_to_fail_is_regression(self):
        t = {"from": "PASS", "to": "FAIL", "verified_condition_change": True}
        assert classify_reaudit_transition(t) == "REGRESSION"

    def test_fail_to_fail_is_persisted_fail(self):
        t = {"from": "FAIL", "to": "FAIL", "verified_condition_change": False}
        assert classify_reaudit_transition(t) == "PERSISTED_FAIL"

    def test_pass_to_pass_is_persisted_pass(self):
        t = {"from": "PASS", "to": "PASS", "verified_condition_change": False}
        assert classify_reaudit_transition(t) == "PERSISTED_PASS"

    def test_incomparable_flag_takes_priority(self):
        t = {"from": "FAIL", "to": "PASS", "incomparable": True,
             "verified_condition_change": False}
        assert classify_reaudit_transition(t) == "INCOMPARABLE"

    def test_indeterminate_before(self):
        t = {"from": "INDETERMINATE", "to": "PASS", "verified_condition_change": False}
        assert classify_reaudit_transition(t) == "INDETERMINATE"

    def test_not_applicable_is_indeterminate_class(self):
        t = {"from": "NOT_APPLICABLE", "to": "FAIL", "verified_condition_change": False}
        assert classify_reaudit_transition(t) == "INDETERMINATE"


# ---------------------------------------------------------------------------
# validate_reaudit_pair: eligibility + full pipeline
# ---------------------------------------------------------------------------

class TestValidateReauditPair:

    def test_missing_baseline_ineligible(self):
        reaudit = audit("b", [finding("PRIMARY_CTA_CLARITY", 1, "PASS")])
        result = validate_reaudit_pair(None, reaudit)
        assert result["eligible"] is False
        assert result["reason"] == "MISSING_BASELINE"
        assert result["transitions"] == []

    def test_duplicate_observation_ineligible(self):
        """Same audit_id for baseline and reaudit must be rejected."""
        a = audit("same-id", [finding("PRIMARY_CTA_CLARITY", 1, "FAIL")])
        result = validate_reaudit_pair(a, a)
        assert result["eligible"] is False
        assert result["reason"] == "DUPLICATE_OBSERVATION"

    def test_baseline_no_findings_ineligible(self):
        base = audit("base-id", [])
        re   = audit("re-id",   [finding("PRIMARY_CTA_CLARITY", 1, "PASS")])
        result = validate_reaudit_pair(base, re)
        assert result["eligible"] is False
        assert result["reason"] == "BASELINE_NO_FINDINGS"

    def test_remediated_pair_eligible(self):
        base = audit("base-id", [finding("PRIMARY_CTA_CLARITY", 1, "FAIL")])
        re   = audit("re-id",   [finding("PRIMARY_CTA_CLARITY", 1, "PASS")])
        result = validate_reaudit_pair(base, re)
        assert result["eligible"] is True
        assert len(result["remediated"]) == 1
        assert result["remediated"][0]["class"] == "REMEDIATED"
        assert result["regressions"] == []

    def test_regression_detected(self):
        base = audit("base-id", [finding("TRUST_PROOF_PROXIMITY", 1, "PASS")])
        re   = audit("re-id",   [finding("TRUST_PROOF_PROXIMITY", 1, "FAIL")])
        result = validate_reaudit_pair(base, re)
        assert result["eligible"] is True
        assert len(result["regressions"]) == 1
        assert result["remediated"] == []

    def test_version_drift_is_incomparable(self):
        """The critical semantic-version guard: FAIL@v1 + PASS@v2 must not
        count toward the repair verification numerator."""
        base = audit("base-id", [finding("SEO_FOUNDATIONS", 1, "FAIL")])
        re   = audit("re-id",   [finding("SEO_FOUNDATIONS", 2, "PASS")])
        result = validate_reaudit_pair(base, re)
        assert result["eligible"] is True  # eligible pair
        assert result["has_incomparable"] is True
        assert len(result["incomparable"]) == 1
        assert result["remediated"] == [], (
            "Version drift must NOT produce a REMEDIATED credit. "
            "The condition definition changed; this is not a repair."
        )

    def test_mixed_pair_counts_correctly(self):
        """One REMEDIATED + one REGRESSION + one PERSISTED_FAIL in one reaudit."""
        base = audit("base-id", [
            finding("PRIMARY_CTA_CLARITY",  1, "FAIL"),
            finding("TRUST_PROOF_PROXIMITY", 1, "PASS"),
            finding("HEADLINE_CLARITY",      1, "FAIL"),
        ])
        re = audit("re-id", [
            finding("PRIMARY_CTA_CLARITY",  1, "PASS"),  # fixed
            finding("TRUST_PROOF_PROXIMITY", 1, "FAIL"),  # regression
            finding("HEADLINE_CLARITY",      1, "FAIL"),  # unchanged
        ])
        result = validate_reaudit_pair(base, re)
        assert result["eligible"] is True
        assert len(result["remediated"]) == 1
        assert len(result["regressions"]) == 1
        assert len(result["persisted_fail"]) == 0  # FAIL→FAIL not in transitions

    def test_not_established_always_present(self):
        """Every transition must carry not_established. This ensures that
        REMEDIATED can never be silently promoted to a conversion claim."""
        base = audit("base-id", [finding("PRIMARY_CTA_CLARITY", 1, "FAIL")])
        re   = audit("re-id",   [finding("PRIMARY_CTA_CLARITY", 1, "PASS")])
        result = validate_reaudit_pair(base, re)
        for t in result["transitions"]:
            assert "not_established" in t, (
                f"Transition missing not_established field: {t}. "
                "Every transition must explicitly state non-establishment of conversion impact."
            )
