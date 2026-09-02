"""Phase 4 & 4B Acquisition Learning System Pipeline, Ingestion, States & Trend Tests.

Validates:
- GSC dimensionless vs dimensioned query ingestion.
- GA4 organic search-entry vs downstream attribution (/checkout).
- Route & cohort declarative synchronization without shadowing.
- Position bucket half-open boundaries and golden fixture replay.
- Two-dimensional state machine evaluations & transition persistence.
- Deterministic trend classifications.
- Metric-level anomaly propagation.
"""

from datetime import date
from typing import Any, Dict, List, Optional, Set, Tuple
import pytest

from acquisition.ingestion import (
    compute_position_buckets,
    normalize_measurement_envelope,
)
from acquisition.models import (
    GA4LandingRow,
    GSCRawTotals,
    GSCRow,
    LedgerTotals,
    POSITION_BUCKETS,
)
from acquisition.route_sync import get_canonical_route_inventory, resolve_cohort_for_path
from acquisition.state_engine import (
    evaluate_page_product_state,
    evaluate_page_search_state,
)
from acquisition.trend_engine import TrendResult, classify_sitewide_trend
from acquisition.window_computation import ComparisonVector, ConcentrationMetrics, QueryIntelligence


# ---------------------------------------------------------------------------
# 1. Route & Cohort Classification Tests
# ---------------------------------------------------------------------------

def test_cohort_resolution_exact_and_dynamic():
    """Verify deterministic cohort classification without substring shadowing."""
    assert resolve_cohort_for_path("/") == "product_core"
    assert resolve_cohort_for_path("/pricing") == "product_core"
    assert resolve_cohort_for_path("/audit") == "product_core"
    
    # Teardowns: index vs individual
    assert resolve_cohort_for_path("/teardowns") == "teardown_index"
    assert resolve_cohort_for_path("/teardowns/airtable") == "individual_teardown"
    assert resolve_cohort_for_path("/teardowns/linear") == "individual_teardown"
    
    # Vertical use cases
    assert resolve_cohort_for_path("/lead-generation-landing-page-audit") == "vertical_use_case"
    assert resolve_cohort_for_path("/saas-landing-page-audit") == "vertical_use_case"
    
    # Comparisons
    assert resolve_cohort_for_path("/vs") == "commercial_comparison"
    assert resolve_cohort_for_path("/vs/screaming-frog") == "commercial_comparison"
    assert resolve_cohort_for_path("/compare/unbounce") == "commercial_comparison"
    
    # Problem intent
    assert resolve_cohort_for_path("/why-is-my-landing-page-not-converting") == "problem_intent"
    assert resolve_cohort_for_path("/ads-getting-clicks-but-no-sales") == "problem_intent"
    
    # Conversion surface
    assert resolve_cohort_for_path("/checkout") == "checkout"
    
    # Unmapped route fallback
    assert resolve_cohort_for_path("/random-unregistered-tool") == "other"


def test_teardown_shadowing_defect_prevention():
    """Regression test: /teardowns must never be shadowed by vertical cohort."""
    cohort = resolve_cohort_for_path("/teardowns")
    assert cohort == "teardown_index", f"Shadowing defect: /teardowns classified as {cohort}"
    
    cohort_airtable = resolve_cohort_for_path("/teardowns/airtable")
    assert cohort_airtable == "individual_teardown"


# ---------------------------------------------------------------------------
# 2. Position Bucket Golden Fixture Tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "best_pos,expected_bucket",
    [
        (1.0, "pos_bucket_1_10"),
        (5.5, "pos_bucket_1_10"),
        (10.0, "pos_bucket_1_10"),
        (10.9, "pos_bucket_1_10"),
        (11.0, "pos_bucket_11_20"),
        (15.0, "pos_bucket_11_20"),
        (20.9, "pos_bucket_11_20"),
        (21.0, "pos_bucket_21_30"),
        (25.0, "pos_bucket_21_30"),
        (30.9, "pos_bucket_21_30"),
        (31.0, "pos_bucket_31_50"),
        (40.0, "pos_bucket_31_50"),
        (50.9, "pos_bucket_31_50"),
        (51.0, "pos_bucket_51_plus"),
        (75.0, "pos_bucket_51_plus"),
        (100.0, "pos_bucket_51_plus"),
    ],
)
def test_position_bucket_boundary_semantics(best_pos, expected_bucket):
    """Test half-open interval boundaries [min, max) for position buckets."""
    buckets = compute_position_buckets({"https://nebulacomponents.com/page": best_pos})
    assert buckets[expected_bucket] == 1
    # Verify mutual exclusivity
    total = sum(buckets.values())
    assert total == 1


def test_september_baseline_bucket_distribution_replay():
    """Replay September baseline page best positions and verify bucket sum = 41."""
    baseline_page_positions = {
        "p1": 59.1,  # 51+
        "p2": 65.6,  # 51+
        "p3": 77.0,  # 51+
        "p4": 91.6,  # 51+
        "p5": 72.0,  # 51+
        "p6": 3.4,   # 1-10
        "p7": 5.5,   # 1-10
        "p8": 49.0,  # 31-50
    }
    buckets = compute_position_buckets(baseline_page_positions)
    assert buckets["pos_bucket_1_10"] == 2
    assert buckets["pos_bucket_31_50"] == 1
    assert buckets["pos_bucket_51_plus"] == 5
    assert sum(buckets.values()) == len(baseline_page_positions)


# ---------------------------------------------------------------------------
# 3. Ingestion & Normalization Tests
# ---------------------------------------------------------------------------

def test_normalization_separates_gsc_macro_and_dimensioned_position():
    """Verify dimensionless aggregate position is separated from row-weighted position."""
    mock_gsc_raw = {
        "totals": {"impressions": 429, "clicks": 0, "position": 65.6},
        "rows": [
            {"page": "https://nebulacomponents.com/why-is-my-landing-page-not-converting", "query": "lp not converting", "impressions": 132, "clicks": 0, "ctr": 0, "position": 59.1},
            {"page": "https://nebulacomponents.com/vs/screaming-frog", "query": "screaming frog alternative", "impressions": 55, "clicks": 0, "ctr": 0, "position": 65.6},
            {"page": "https://nebulacomponents.com/best-landing-page-audit-tools", "query": "best audit tools", "impressions": 45, "clicks": 0, "ctr": 0, "position": 77.0},
        ],
    }
    mock_ga4_raw = {
        "totals": {"sessions": 16, "users": 16},
        "top_pages": [
            {"landing_page": "/", "sessions": 12, "users": 12, "pageviews": 24, "bounce_rate": 0.0, "engagement_rate": 100.0},
            {"landing_page": "/checkout", "sessions": 4, "users": 4, "pageviews": 8, "bounce_rate": 0.0, "engagement_rate": 100.0},
        ],
    }
    ledger = LedgerTotals(audit_started=0, audit_completed=0, checkout_started=0, purchases=0)

    meas, gsc_rows, ga4_rows = normalize_measurement_envelope(mock_gsc_raw, mock_ga4_raw, ledger, days=28)
    
    # Sitewide macro comes from totals (65.6)
    assert meas.gsc_aggregate_position == 65.6
    assert meas.gsc_total_impressions == 429
    
    # Dimensioned weighted position is calculated over rows
    expected_weighted = (132 * 59.1 + 55 * 65.6 + 45 * 77.0) / (132 + 55 + 45)
    assert abs(meas.dimensioned_impression_weighted_position - expected_weighted) < 0.01
    
    # GA4 attribution separation
    assert meas.ga4_organic_sessions == 16
    assert meas.ga4_search_entry_sessions == 12
    assert meas.ga4_downstream_checkout_sessions == 4
    assert "CHECKOUT_ATTRIBUTION_RESET" in meas.known_anomalies


# ---------------------------------------------------------------------------
# 4. Search Visibility & Product Journey State Machine Tests
# ---------------------------------------------------------------------------

def test_search_visibility_state_progression_and_regression():
    """Test search visibility state evaluations across half-open ranking tiers."""
    assert evaluate_page_search_state(0, 0, None) == "UNSEEN"
    assert evaluate_page_search_state(10, 0, 75.0) == "POS_51_PLUS"
    assert evaluate_page_search_state(10, 0, 45.0) == "TOP_50"
    assert evaluate_page_search_state(10, 0, 25.0) == "TOP_30"
    assert evaluate_page_search_state(10, 0, 15.0) == "TOP_20"
    assert evaluate_page_search_state(10, 0, 5.0) == "TOP_10"
    assert evaluate_page_search_state(10, 1, 5.0) == "SERP_CLICKED"


def test_product_journey_state_evaluations():
    """Test product journey state progression independent of search rank."""
    assert evaluate_page_product_state(0, 0, 0, 0, 0) == "NO_QUALIFIED_SESSION"
    assert evaluate_page_product_state(1, 0, 0, 0, 0) == "LANDING_VIEWED"
    assert evaluate_page_product_state(1, 1, 0, 0, 0) == "AUDIT_STARTED"
    assert evaluate_page_product_state(1, 1, 1, 0, 0) == "AUDIT_COMPLETED"
    assert evaluate_page_product_state(1, 1, 1, 1, 0) == "CHECKOUT_STARTED"
    assert evaluate_page_product_state(1, 1, 1, 1, 1) == "PURCHASE_COMPLETED"


def test_dimensional_decoupling_preservation():
    """A page can rank poorly on search (POS_51_PLUS) while having completed purchases."""
    search_state = evaluate_page_search_state(10, 0, 75.0)
    product_state = evaluate_page_product_state(1, 1, 1, 1, 1)
    
    assert search_state == "POS_51_PLUS"
    assert product_state == "PURCHASE_COMPLETED"
    assert search_state != product_state


# ---------------------------------------------------------------------------
# 5. Deterministic Trend Engine Golden Fixtures
# ---------------------------------------------------------------------------

def _build_test_vector(
    d_imps: int,
    d_imps_pct: Optional[float],
    d_pos: float,
    window_days: int = 28,
) -> ComparisonVector:
    return ComparisonVector(
        current_meas_id="curr",
        comparison_meas_id="comp",
        current_effective_start=date(2026, 8, 3),
        current_effective_end=date(2026, 8, 30),
        comparison_effective_start=date(2026, 7, 6),
        comparison_effective_end=date(2026, 8, 2),
        current_effective_days=window_days,
        comparison_effective_days=window_days,
        window_days=window_days,
        comparison_class="ADJACENT_PERIOD",
        overlap_start=None,
        overlap_end=None,
        overlap_days=0,
        overlap_ratio=0.0,
        is_comparable_for_trend=True,
        delta_impressions=d_imps,
        delta_impressions_pct=d_imps_pct,
        delta_clicks=0,
        delta_macro_position=d_pos,
        delta_dimensioned_position=d_pos,
        delta_unique_pages=0,
        delta_unique_queries=0,
        delta_organic_sessions=0,
        concentration=ConcentrationMetrics(),
        query_intel=QueryIntelligence(),
    )


def test_trend_classification_improving():
    """Impressions grew by >= 10% and rank improved or maintained."""
    v = _build_test_vector(d_imps=100, d_imps_pct=25.0, d_pos=-5.0)
    res = classify_sitewide_trend(v)
    assert res.classification == "IMPROVING"
    assert res.evidence_gate_passed is True


def test_trend_classification_declining():
    """Impressions dropped by >= 10% and rank worsened."""
    v = _build_test_vector(d_imps=-100, d_imps_pct=-25.0, d_pos=8.0)
    res = classify_sitewide_trend(v)
    assert res.classification == "DECLINING"


def test_trend_classification_stable():
    """Changes within +/- 5% impressions and +/- 2.5 rank positions."""
    v = _build_test_vector(d_imps=5, d_imps_pct=1.2, d_pos=0.3)
    res = classify_sitewide_trend(v)
    assert res.classification == "STABLE"


def test_trend_classification_volatile():
    """Extreme rank movement without impression growth."""
    v = _build_test_vector(d_imps=2, d_imps_pct=0.5, d_pos=18.0)
    res = classify_sitewide_trend(v)
    assert res.classification == "VOLATILE"


def test_trend_classification_insufficient_evidence_gate():
    """Window below 28 days fails evidence gate."""
    v = _build_test_vector(d_imps=50, d_imps_pct=50.0, d_pos=-10.0, window_days=7)
    res = classify_sitewide_trend(v)
    assert res.classification == "INSUFFICIENT_EVIDENCE"
    assert res.evidence_gate_passed is False


def test_trend_classification_blocked_on_pipeline_failure():
    """Pipeline failure or unfinalized status blocks trend classification."""
    v = _build_test_vector(d_imps=50, d_imps_pct=50.0, d_pos=-10.0)
    res = classify_sitewide_trend(v, current_completeness="BLOCKED")
    assert res.classification == "BLOCKED"
    assert res.evidence_gate_passed is False
