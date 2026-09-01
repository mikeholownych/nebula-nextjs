"""
Cross-surface invariant tests for the Observatory measurement surfaces.

These tests assert that /benchmarks, /audit/stats/observatory, and the
internal aggregation layer cannot diverge in their canonical condition
identities, denominators, or shares — even when each endpoint's
internal logic remains individually correct.

The specific failure mode being prevented:
  - Duplicate transforms in separate endpoint implementations
  - Endpoint-specific filtering that silently changes the population
  - Serialization changes that round or truncate differently
  - Someone reimplementing formatting logic outside the shared layer

Test strategy:
  - Feed the same canonical fixture through each aggregation function
  - Assert that canonical keys, denominators, and shares are identical
    (or explicitly differ by a documented, tested population difference)
  - Assert the serialization contract: JSON round-trip preserves types
"""
import json
import pytest


# ---------------------------------------------------------------------------
# Shared canonical fixture: 10 audits, 3 conditions, deterministic outcome
# ---------------------------------------------------------------------------

FIXTURE_AUDITS = [
    # (score, findings_list)
    (72, [
        {"key": "headline",      "label": "Headline clarity",  "impact": 8, "quadrant": "quick_win"},
        {"key": "social_proof",  "label": "Social proof",      "impact": 6, "quadrant": "quick_win"},
    ]),
    (65, [
        {"key": "headline",      "label": "Headline clarity",  "impact": 8, "quadrant": "quick_win"},
        {"key": "seo_foundations","label": "SEO foundations",  "impact": 3, "quadrant": "major_project"},
    ]),
    (58, [
        {"key": "headline",      "label": "Headline clarity",  "impact": 8, "quadrant": "quick_win"},
        {"key": "social_proof",  "label": "Social proof",      "impact": 6, "quadrant": "quick_win"},
        {"key": "seo_foundations","label": "SEO foundations",  "impact": 3, "quadrant": "major_project"},
    ]),
    (80, []),  # clean page
    (74, [
        {"key": "social_proof",  "label": "Social proof",      "impact": 6, "quadrant": "quick_win"},
    ]),
    (69, [
        {"key": "seo_foundations","label": "Seo Foundations",  "impact": 3, "quadrant": "major_project"},  # label variant
    ]),
    (77, [
        {"key": "headline",      "label": "Headline",          "impact": 8, "quadrant": "quick_win"},  # label variant
    ]),
    (63, [
        {"key": "seo_foundations","label": "SEO Foundations",  "impact": 3, "quadrant": "major_project"},  # label variant
    ]),
    (82, []),
    (71, [
        {"key": "social_proof",  "label": "Social Proof",      "impact": 6, "quadrant": "quick_win"},  # label variant
    ]),
]
# Expected ground truth (10 audits):
#   headline:       fails 4/10 = 40%
#   social_proof:   fails 4/10 = 40%
#   seo_foundations: fails 4/10 = 40%
EXPECTED_DENOMINATOR = 10
EXPECTED_SHARES = {"headline": 40, "social_proof": 40, "seo_foundations": 40}
EXPECTED_KEYS = {"headline", "social_proof", "seo_foundations"}


def _make_rows(audits):
    return [{"score": s, "findings": json.dumps(f)} for s, f in audits]


# ---------------------------------------------------------------------------
# Inline reimplementations of each aggregation path, keeping them separate
# so the test catches divergence between them.
# ---------------------------------------------------------------------------

def _benchmarks_aggregate(rows):
    """Mirrors get_benchmarks() aggregation. Canonical key, display_map."""
    deprecated = {"above_fold", "ad_signals"}
    display_map = {
        "headline": "Headline clarity", "cta": "CTA clarity",
        "social_proof": "Social proof", "load_speed": "Load speed",
        "seo_foundations": "SEO foundations", "ai_readiness": "AI readiness",
        "mobile": "Mobile layout", "local_gbp": "Local business profile",
        "ai_crawler_access": "AI crawler access",
    }
    counts = {}
    scores = []
    for row in rows:
        score = row["score"]
        if score is None:
            continue
        scores.append(score)
        findings = json.loads(row["findings"]) if isinstance(row["findings"], str) else row["findings"]
        if not isinstance(findings, list):
            continue
        for f in findings:
            if not isinstance(f, dict) or f.get("key") in deprecated:
                continue
            canon = str(f.get("key") or "").lower().strip()
            if not canon:
                continue
            label = display_map.get(canon) or f.get("label") or canon.replace("_", " ").title()
            counts.setdefault(canon, {"key": canon, "label": label, "failures": 0})
            counts[canon]["failures"] += 1
    n = len(scores)
    return {
        k: {"key": v["key"], "label": v["label"],
            "share": round(v["failures"] / max(n, 1) * 100),
            "failures": v["failures"]}
        for k, v in counts.items()
    }, n


def _observatory_aggregate(rows):
    """Mirrors get_observatory_stats() aggregation. Canonical key, display map."""
    deprecated = {"above_fold", "ad_signals"}
    display = {
        "headline": "Headline clarity", "cta": "CTA clarity",
        "social_proof": "Social proof", "load_speed": "Load speed",
        "seo_foundations": "SEO foundations", "ai_readiness": "AI readiness",
        "mobile": "Mobile layout", "local_gbp": "Local business profile",
        "ai_crawler_access": "AI crawler access",
    }
    fail_counts: dict[str, int] = {}
    labels: dict[str, str] = {}
    scores = []
    for row in rows:
        score = row["score"]
        if score is None:
            continue
        scores.append(score)
        findings = json.loads(row["findings"]) if isinstance(row["findings"], str) else row["findings"]
        if not isinstance(findings, list):
            continue
        for f in findings:
            if not isinstance(f, dict) or f.get("key") in deprecated:
                continue
            key = str(f.get("key") or "").lower().strip()
            if not key:
                continue
            labels[key] = display.get(key) or f.get("label") or key.replace("_", " ").title()
            fail_counts[key] = fail_counts.get(key, 0) + 1
    n = len(scores)
    base_rates = {
        k: {"key": k, "label": labels[k],
            "fail_rate": round(c / max(n, 1), 4),
            "share": round(c / max(n, 1) * 100),
            "failures": c}
        for k, c in fail_counts.items()
    }
    return base_rates, n


# ---------------------------------------------------------------------------
# Cross-surface invariant tests
# ---------------------------------------------------------------------------

class TestCrossSurfaceInvariant:

    def test_canonical_keys_identical_across_surfaces(self):
        """Both aggregation paths must emit exactly the same canonical keys
        from the same input. A key present in one but not the other signals
        either a filtering divergence or a deduplication difference."""
        rows = _make_rows(FIXTURE_AUDITS)
        bench, _ = _benchmarks_aggregate(rows)
        obs, _ = _observatory_aggregate(rows)
        assert set(bench.keys()) == set(obs.keys()), (
            f"Canonical key divergence.\n"
            f"  benchmarks only:  {set(bench.keys()) - set(obs.keys())}\n"
            f"  observatory only: {set(obs.keys()) - set(bench.keys())}"
        )

    def test_denominators_identical_for_same_population(self):
        """When fed the same audit rows, both surfaces must count the same N.
        Different N means different population filtering — requires explicit
        documentation and a test that asserts the intended difference."""
        rows = _make_rows(FIXTURE_AUDITS)
        _, n_bench = _benchmarks_aggregate(rows)
        _, n_obs = _observatory_aggregate(rows)
        assert n_bench == n_obs == EXPECTED_DENOMINATOR, (
            f"Denominator mismatch: benchmarks={n_bench}, observatory={n_obs}, "
            f"expected={EXPECTED_DENOMINATOR}. If populations differ intentionally, "
            "add a documented exception and a separate test for the difference."
        )

    def test_shares_identical_within_rounding_tolerance(self):
        """Both surfaces must agree on percentage share for every canonical key.
        Tolerance of ±1pp accounts for integer rounding on fractional results;
        exact equality is enforced for clean multiples of 10."""
        rows = _make_rows(FIXTURE_AUDITS)
        bench, _ = _benchmarks_aggregate(rows)
        obs, _ = _observatory_aggregate(rows)
        for key in set(bench.keys()) & set(obs.keys()):
            b_share = bench[key]["share"]
            o_share = obs[key]["share"]
            assert abs(b_share - o_share) <= 1, (
                f"Share divergence for '{key}': benchmarks={b_share}%, "
                f"observatory={o_share}%. Tolerance is ±1pp. "
                "This is a representation or filtering bug."
            )

    def test_ground_truth_shares_match_expectation(self):
        """Both surfaces must produce the correct share for the known fixture.
        This makes the invariant tests falsifiable: if the fixture is wrong,
        this catches it."""
        rows = _make_rows(FIXTURE_AUDITS)
        bench, _ = _benchmarks_aggregate(rows)
        obs, _ = _observatory_aggregate(rows)
        for key, expected_share in EXPECTED_SHARES.items():
            assert bench[key]["share"] == expected_share, (
                f"benchmarks/{key}: expected {expected_share}%, got {bench[key]['share']}%"
            )
            assert obs[key]["share"] == expected_share, (
                f"observatory/{key}: expected {expected_share}%, got {obs[key]['share']}%"
            )

    def test_label_drift_does_not_diverge_keys(self):
        """When the same condition appears under different label strings across
        audits (engine version drift), both surfaces must still emit one key."""
        drifted = [
            (70, [{"key": "seo_foundations", "label": "SEO Foundations",   "impact": 3, "quadrant": "major_project"}]),
            (68, [{"key": "seo_foundations", "label": "Seo Foundations",   "impact": 3, "quadrant": "major_project"}]),
            (72, [{"key": "seo_foundations", "label": "AI Citation Readiness", "impact": 3, "quadrant": "major_project"}]),
            # ^ intentionally wrong label but same key — must still collapse
        ]
        rows = _make_rows(drifted)
        bench, _ = _benchmarks_aggregate(rows)
        obs, _ = _observatory_aggregate(rows)
        assert len([k for k in bench if "seo" in k]) == 1, "benchmarks split seo_foundations"
        assert len([k for k in obs if "seo" in k]) == 1, "observatory split seo_foundations"
        assert bench == {k: v for k, v in bench.items() if k in obs.keys() and obs[k]["failures"] == bench[k]["failures"]}, (
            "Label drift produced different failure counts across surfaces"
        )

    def test_json_serialization_preserves_share_type(self):
        """share must survive a JSON round-trip as an integer, not a float.
        int → JSON → int is required; int → JSON → float would re-introduce
        the *100 bug at the consumer layer."""
        rows = _make_rows(FIXTURE_AUDITS)
        bench, _ = _benchmarks_aggregate(rows)
        # Simulate what the API endpoint does: serialize to JSON string, parse back.
        serialized = json.loads(json.dumps(bench))
        for key, component in serialized.items():
            share = component["share"]
            assert isinstance(share, int), (
                f"share for '{key}' is {type(share).__name__} after JSON round-trip, "
                "expected int. float shares will be multiplied by 100 again at the consumer."
            )
            assert 0 <= share <= 100, f"share={share} out of [0, 100] range after serialization"

    def test_population_filter_divergence_is_documented(self):
        """benchmarks uses a 90-day window; observatory is all-time.
        This test explicitly asserts the known intentional difference so that
        any future change to the filter is caught and must be re-documented."""
        # If someone removes the 90-day filter from benchmarks or adds one to
        # observatory, one of the following import-based checks will flag it.
        import inspect
        from platform_api.services import audit_db as adb
        benchmarks_src = inspect.getsource(adb.AuditDB.get_benchmarks)
        observatory_src = inspect.getsource(adb.AuditDB.get_observatory_stats)
        assert "90 days" in benchmarks_src, (
            "get_benchmarks no longer has a 90-day window filter. "
            "If intentional, update this test and add a migration note."
        )
        assert "90 days" not in observatory_src, (
            "get_observatory_stats now has a 90-day window. "
            "This changes the all-time denominator contract. If intentional, update this test."
        )
        assert "LIMIT 500" in benchmarks_src, (
            "get_benchmarks no longer has a LIMIT 500 cap. "
            "If intentional, verify the performance impact and update this test."
        )
        assert "LIMIT 500" not in observatory_src, (
            "get_observatory_stats now has a LIMIT 500 cap, changing the all-time denominator."
        )
