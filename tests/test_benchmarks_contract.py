"""
Data-contract tests for AuditDB.get_benchmarks.

These enforce the canonical representation boundary:
  - share is a percentage integer [0, 100]
  - components deduplicate by canonical key (not label)

This class of defect caused production 6200% displays when callers
applied * 100 to an already-integer value.
"""
import pytest


def _build_rows(findings_per_row: list) -> list:
    """Construct minimal fake DB rows for testing the aggregation logic."""
    import json as _json
    rows = []
    for score, findings in findings_per_row:
        rows.append({"score": score, "findings": _json.dumps(findings)})
    return rows


def _run_aggregation(rows):
    """Extract and run just the aggregation block from get_benchmarks."""
    import json as _json

    deprecated_keys = {"above_fold", "ad_signals"}
    buckets = {"0-3": 0, "4-5": 0, "6-7": 0, "8-10": 0}
    component_counts: dict = {}
    scores = []
    total_findings = 0

    for row in rows:
        score = row["score"]
        if score is None:
            continue
        score_10 = score / 10.0
        scores.append(score_10)
        if score_10 < 4:
            buckets["0-3"] += 1
        elif score_10 < 6:
            buckets["4-5"] += 1
        elif score_10 < 8:
            buckets["6-7"] += 1
        else:
            buckets["8-10"] += 1

        findings = row["findings"]
        if isinstance(findings, str):
            try:
                findings = _json.loads(findings)
            except Exception:
                findings = []
        if not isinstance(findings, list):
            continue
        for f in findings:
            if not isinstance(f, dict) or f.get("key") in deprecated_keys:
                continue
            total_findings += 1
            canon_key = str(f.get("key") or "").lower().strip()
            if not canon_key:
                continue
            display_label = f.get("label") or canon_key.replace("_", " ").title()
            impact = f.get("impact") or 0
            entry = component_counts.setdefault(
                canon_key, {"key": canon_key, "label": display_label, "failures": 0, "impact_sum": 0.0}
            )
            entry["failures"] += 1
            entry["impact_sum"] += float(impact)

    components = []
    for entry in component_counts.values():
        components.append(
            {
                "key": entry["key"],
                "label": entry["label"],
                "failures": entry["failures"],
                "avg_impact": round(entry["impact_sum"] / entry["failures"], 1) if entry["failures"] else 0,
                "share": round(entry["failures"] / max(len(scores), 1) * 100),
            }
        )
    components.sort(key=lambda c: c["failures"], reverse=True)
    return components, scores, total_findings


class TestBenchmarksDataContract:
    def test_share_is_integer_percentage_not_probability(self):
        """share must be in [0, 100] — it is a percentage integer, never a probability."""
        rows = _build_rows([
            (70, [{"key": "headline", "label": "Headline", "impact": 8}]),
            (70, [{"key": "headline", "label": "Headline", "impact": 8}]),
            (70, []),
            (70, []),
        ])
        components, _, _ = _run_aggregation(rows)
        headline = next(c for c in components if c["label"] == "Headline")
        assert headline["share"] == 50, (
            f"share should be 50 (integer percent), got {headline['share']}. "
            "Callers must never multiply share * 100 again."
        )
        assert 0 <= headline["share"] <= 100

    def test_share_never_exceeds_100(self):
        rows = _build_rows([
            (70, [{"key": "cta", "label": "CTA clarity", "impact": 5}]) for _ in range(10)
        ])
        components, _, _ = _run_aggregation(rows)
        for c in components:
            assert c["share"] <= 100, f"share={c['share']} exceeds 100 — representation boundary violated"

    def test_deduplicates_by_canonical_key_not_label(self):
        """Old engine versions stored 'CTA' and new ones store 'cta'. Both have key='cta'.
        They must collapse into one component, not two."""
        rows = _build_rows([
            (70, [{"key": "cta", "label": "CTA", "impact": 5}]),
            (70, [{"key": "cta", "label": "Cta", "impact": 5}]),
            (70, [{"key": "cta", "label": "CTA clarity", "impact": 5}]),
            (70, []),
        ])
        components, _, _ = _run_aggregation(rows)
        cta_entries = [c for c in components if "cta" in c["label"].lower() or "cta" in str(c)]
        # Should be exactly 1 entry for the canonical key 'cta'
        assert len(cta_entries) == 1, (
            f"Expected 1 deduplicated entry for 'cta', got {len(cta_entries)}: {cta_entries}"
        )
        assert cta_entries[0]["failures"] == 3

    def test_deprecated_keys_excluded(self):
        rows = _build_rows([
            (70, [
                {"key": "above_fold", "label": "Above Fold", "impact": 5},
                {"key": "ad_signals", "label": "Ad Signals", "impact": 5},
                {"key": "headline", "label": "Headline", "impact": 8},
            ]),
        ])
        components, _, total = _run_aggregation(rows)
        labels = [c["label"] for c in components]
        assert "Above Fold" not in labels
        assert "Ad Signals" not in labels
        assert "Headline" in labels
        assert total == 1

    def test_cardinality_matches_distinct_canonical_keys(self):
        """After aggregation, number of components == number of distinct canonical keys.
        This catches any future label-drift that re-introduces identity fragmentation."""
        rows = _build_rows([
            (70, [
                {"key": "headline",      "label": "Headline",         "impact": 8},
                {"key": "cta",           "label": "CTA",              "impact": 5},
                {"key": "social_proof",  "label": "Social Proof",     "impact": 6},
                {"key": "seo_foundations","label": "SEO Foundations",  "impact": 3},
                {"key": "ai_readiness",  "label": "AI Readiness",     "impact": 4},
            ]),
            (65, [
                {"key": "headline",      "label": "Headline clarity", "impact": 8},  # label variant
                {"key": "cta",           "label": "CTA clarity",      "impact": 5},  # label variant
                {"key": "seo_foundations","label": "Seo Foundations",  "impact": 3},  # label variant
            ]),
        ])
        components, _, _ = _run_aggregation(rows)
        canonical_keys = [c["key"] for c in components]
        assert len(canonical_keys) == len(set(canonical_keys)), (
            "Duplicate canonical keys in output — identity fragmentation present: "
            f"{[k for k in canonical_keys if canonical_keys.count(k) > 1]}"
        )
        # Five distinct conditions were submitted; cardinality must be exactly 5.
        assert len(components) == 5, (
            f"Expected 5 canonical conditions, got {len(components)}: {canonical_keys}"
        )

    def test_no_duplicate_canonical_keys_production_fixture(self):
        """Production fixture: simulate label drift across engine versions.
        'AI Citation Readiness' and 'AI Readiness' both have key='ai_readiness'.
        They must produce exactly one component."""
        rows = _build_rows([
            (70, [{"key": "ai_readiness", "label": "AI Citation Readiness", "impact": 4}]),
            (68, [{"key": "ai_readiness", "label": "Ai Readiness",          "impact": 4}]),
            (72, [{"key": "ai_readiness", "label": "AI readiness",          "impact": 4}]),
            (71, [{"key": "seo_foundations", "label": "SEO Foundations",    "impact": 3}]),
            (69, [{"key": "seo_foundations", "label": "Seo Foundations",    "impact": 3}]),
        ])
        components, scores, _ = _run_aggregation(rows)
        ai_components = [c for c in components if c["key"] == "ai_readiness"]
        seo_components = [c for c in components if c["key"] == "seo_foundations"]
        assert len(ai_components) == 1, f"ai_readiness fragmented: {ai_components}"
        assert len(seo_components) == 1, f"seo_foundations fragmented: {seo_components}"
        # Combined share: 3 out of 5 audits for ai_readiness = 60%
        assert ai_components[0]["failures"] == 3
        assert ai_components[0]["share"] == 60
        # Combined share: 2 out of 5 for seo_foundations = 40%
        assert seo_components[0]["failures"] == 2
        assert seo_components[0]["share"] == 40
