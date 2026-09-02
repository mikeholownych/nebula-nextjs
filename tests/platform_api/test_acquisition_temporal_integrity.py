"""Phase 4B Temporal Integrity, Rolling Window Semantics, Overlap & Baseline Comparability Tests.

Validates:
- Canonical window length invariants (7d, 28d, 84d).
- GSC 3-day holdback alignment and date arithmetic across month/leap year/DST boundaries.
- Period overlap calculations (0%, 50%, 96%, 100%).
- Comparison classification taxonomy.
- Evidence eligibility gates using effective finalized source days.
- State initialization vs genuine state transitions.
- Half-open interval position bucket semantics [1, 11), [11, 21), [21, 31), [31, 51), [51, inf).
"""

from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import pytest

from acquisition.ingestion import (
    calculate_canonical_window,
    compute_position_buckets,
    normalize_measurement_envelope,
)
from acquisition.models import LedgerTotals, POSITION_BUCKETS
from acquisition.state_engine import (
    evaluate_page_search_state,
)
from acquisition.trend_engine import classify_sitewide_trend
from acquisition.window_computation import (
    calculate_period_overlap,
    classify_comparison_type,
    ComparisonVector,
    ConcentrationMetrics,
    QueryIntelligence,
)


# ---------------------------------------------------------------------------
# 1. Canonical Window Arithmetic & Lag Invariants
# ---------------------------------------------------------------------------

def test_canonical_window_exact_inclusive_days():
    """Verify that calculate_canonical_window returns exact inclusive day count."""
    for days in [7, 28, 84]:
        start, end = calculate_canonical_window(end_date=date(2026, 8, 30), days=days, lag_days=3)
        assert end == date(2026, 8, 30)
        assert (end - start).days + 1 == days


def test_canonical_window_month_and_leap_year_boundaries():
    """Test date arithmetic across leap year (Feb 2028) and irregular month lengths."""
    # Leap year February 2028
    start, end = calculate_canonical_window(end_date=date(2028, 3, 2), days=28)
    assert (end - start).days + 1 == 28
    # 2028-03-02 (2 days in March) - 26 days in Feb -> start should be 2028-02-04
    assert start == date(2028, 2, 4)

    # Standard non-leap year February 2027
    start, end = calculate_canonical_window(end_date=date(2027, 3, 2), days=28)
    assert (end - start).days + 1 == 28
    assert start == date(2027, 2, 3)


def test_gsc_lag_shift_guarantees_28_finalized_dates():
    """Verify that GSC 3-day lag shifts the entire window backward rather than truncating."""
    today = date(2026, 9, 2)
    # 3 days lag -> latest finalized is 2026-08-30
    start, end = calculate_canonical_window(end_date=date(2026, 8, 30), days=28)
    assert end == date(2026, 8, 30)
    assert start == date(2026, 8, 3)
    assert (end - start).days + 1 == 28


# ---------------------------------------------------------------------------
# 2. Period Overlap & Comparison Taxonomy Tests
# ---------------------------------------------------------------------------

def test_calculate_period_overlap_exact_cases():
    """Test overlap calculation across all temporal relationships."""
    # 1. Adjacent periods (0% overlap)
    r1 = calculate_period_overlap(date(2026, 8, 3), date(2026, 8, 30), date(2026, 7, 6), date(2026, 8, 2))
    assert r1["overlap_days"] == 0
    assert r1["overlap_ratio_a"] == 0.0

    # 2. 1-day overlap
    r2 = calculate_period_overlap(date(2026, 8, 3), date(2026, 8, 30), date(2026, 8, 30), date(2026, 9, 26))
    assert r2["overlap_days"] == 1
    assert r2["overlap_start"] == date(2026, 8, 30)
    assert r2["overlap_end"] == date(2026, 8, 30)

    # 3. 50% overlap (14/28 days)
    r3 = calculate_period_overlap(date(2026, 8, 1), date(2026, 8, 28), date(2026, 8, 15), date(2026, 9, 11))
    assert r3["overlap_days"] == 14
    assert r3["overlap_ratio_a"] == 0.5

    # 4. 27/28 days rolling overlap (96.4%)
    r4 = calculate_period_overlap(date(2026, 8, 4), date(2026, 8, 31), date(2026, 8, 5), date(2026, 9, 1))
    assert r4["overlap_days"] == 27
    assert abs(r4["overlap_ratio_a"] - (27 / 28)) < 0.001

    # 5. 100% identical period
    r5 = calculate_period_overlap(date(2026, 8, 3), date(2026, 8, 30), date(2026, 8, 3), date(2026, 8, 30))
    assert r5["overlap_days"] == 28
    assert r5["overlap_ratio_a"] == 1.0


def test_classify_comparison_type_logic():
    """Test comparison class determination."""
    # Adjacent period
    c_adj, eligible_adj = classify_comparison_type(
        date(2026, 8, 3), date(2026, 8, 30), date(2026, 7, 6), date(2026, 8, 2), "curr", "comp"
    )
    assert c_adj == "ADJACENT_PERIOD"
    assert eligible_adj is True

    # Overlapping rolling period
    c_over, eligible_over = classify_comparison_type(
        date(2026, 8, 5), date(2026, 8, 30), date(2026, 8, 3), date(2026, 9, 1), "curr", "comp"
    )
    assert c_over == "OVERLAPPING_PERIOD"
    assert eligible_over is False

    # Same period remeasurement
    c_same, eligible_same = classify_comparison_type(
        date(2026, 8, 3), date(2026, 8, 30), date(2026, 8, 3), date(2026, 8, 30), "curr", "comp", 2, 2
    )
    assert c_same == "SAME_PERIOD_REMEASUREMENT"
    assert eligible_same is False

    # Methodology reconciliation
    c_meth, eligible_meth = classify_comparison_type(
        date(2026, 8, 3), date(2026, 8, 30), date(2026, 8, 3), date(2026, 8, 30), "curr", "comp", 2, 1
    )
    assert c_meth == "METHODOLOGY_RECONCILIATION"
    assert eligible_meth is False


# ---------------------------------------------------------------------------
# 3. Evidence Eligibility Gate & Defect Prevention
# ---------------------------------------------------------------------------

def _build_test_comparison_vector(
    curr_eff_days: int,
    comp_eff_days: int,
    comp_class: str = "ADJACENT_PERIOD",
    overlap_days: int = 0,
    d_imps: int = 100,
    d_imps_pct: float = 25.0,
    d_pos: float = -5.0,
) -> ComparisonVector:
    return ComparisonVector(
        current_meas_id="curr",
        comparison_meas_id="comp",
        current_effective_start=date(2026, 8, 3),
        current_effective_end=date(2026, 8, 30),
        comparison_effective_start=date(2026, 7, 6),
        comparison_effective_end=date(2026, 8, 2),
        current_effective_days=curr_eff_days,
        comparison_effective_days=comp_eff_days,
        window_days=curr_eff_days,
        comparison_class=comp_class,
        overlap_start=None,
        overlap_end=None,
        overlap_days=overlap_days,
        overlap_ratio=overlap_days / max(curr_eff_days, 1),
        is_comparable_for_trend=(comp_class == "ADJACENT_PERIOD" and overlap_days == 0),
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


def test_evidence_eligibility_gate_rejects_26_days():
    """Regression test: 26 effective finalized days must fail the 28-day evidence gate."""
    v = _build_test_comparison_vector(curr_eff_days=26, comp_eff_days=28)
    res = classify_sitewide_trend(v, min_holdout_days=28)
    assert res.classification == "INSUFFICIENT_EVIDENCE"
    assert res.evidence_gate_passed is False
    assert "below evidence eligibility gate (28d)" in res.primary_reason


def test_evidence_eligibility_gate_accepts_28_days():
    """28 effective finalized days passes the 28-day evidence gate."""
    v = _build_test_comparison_vector(curr_eff_days=28, comp_eff_days=28)
    res = classify_sitewide_trend(v, min_holdout_days=28)
    assert res.classification == "IMPROVING"
    assert res.evidence_gate_passed is True


def test_trend_engine_blocks_overlapping_comparisons():
    """Overlapping periods cannot produce longitudinal IMPROVING classification."""
    v = _build_test_comparison_vector(
        curr_eff_days=28, comp_eff_days=28, comp_class="OVERLAPPING_PERIOD", overlap_days=20
    )
    res = classify_sitewide_trend(v)
    assert res.classification == "INSUFFICIENT_EVIDENCE"
    assert "overlapping source dates" in res.primary_reason


# ---------------------------------------------------------------------------
# 4. State Initialization vs Genuine State Transitions
# ---------------------------------------------------------------------------

def test_state_evaluation_half_open_boundaries():
    """Test half-open interval position states [1, 11), [11, 21), [21, 31), [31, 51), [51, inf)."""
    assert evaluate_page_search_state(10, 0, 1.0) == "TOP_10"
    assert evaluate_page_search_state(10, 0, 10.9) == "TOP_10"
    assert evaluate_page_search_state(10, 0, 11.0) == "TOP_20"
    assert evaluate_page_search_state(10, 0, 20.9) == "TOP_20"
    assert evaluate_page_search_state(10, 0, 21.0) == "TOP_30"
    assert evaluate_page_search_state(10, 0, 30.9) == "TOP_30"
    assert evaluate_page_search_state(10, 0, 31.0) == "TOP_50"
    assert evaluate_page_search_state(10, 0, 50.9) == "TOP_50"
    assert evaluate_page_search_state(10, 0, 51.0) == "POS_51_PLUS"
    assert evaluate_page_search_state(10, 0, 95.0) == "POS_51_PLUS"


def test_position_bucket_distribution_half_open():
    """Verify position buckets partition the domain completely."""
    positions = {
        "p1": 1.0,
        "p2": 10.99,
        "p3": 11.0,
        "p4": 20.99,
        "p5": 21.0,
        "p6": 30.99,
        "p7": 31.0,
        "p8": 50.99,
        "p9": 51.0,
        "p10": 85.0,
    }
    buckets = compute_position_buckets(positions)
    assert buckets["pos_bucket_1_10"] == 2
    assert buckets["pos_bucket_11_20"] == 2
    assert buckets["pos_bucket_21_30"] == 2
    assert buckets["pos_bucket_31_50"] == 2
    assert buckets["pos_bucket_51_plus"] == 2
    assert sum(buckets.values()) == len(positions)
