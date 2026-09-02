"""Rolling Window Computation, Concentration Metrics, Overlap & Comparison Analysis."""

from dataclasses import dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional, Set, Tuple
import psycopg
from psycopg.rows import dict_row

from .models import DEFAULT_DB_URI


@dataclass
class ConcentrationMetrics:
    top_1_page_share: float = 0.0
    top_5_page_share: float = 0.0
    top_10_page_share: float = 0.0
    top_1_query_share: float = 0.0
    top_5_query_share: float = 0.0
    top_10_query_share: float = 0.0
    cohort_shares: Dict[str, float] = field(default_factory=dict)


@dataclass
class QueryIntelligence:
    new_queries: List[str] = field(default_factory=list)
    lost_queries: List[str] = field(default_factory=list)
    growing_queries: List[Tuple[str, int, int]] = field(default_factory=list)  # (query, old_imps, new_imps)
    declining_queries: List[Tuple[str, int, int]] = field(default_factory=list)
    improving_queries: List[Tuple[str, float, float]] = field(default_factory=list)  # (query, old_pos, new_pos)
    regressing_queries: List[Tuple[str, float, float]] = field(default_factory=list)
    cannibalization_candidates: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ComparisonVector:
    current_meas_id: str
    comparison_meas_id: str
    current_effective_start: date
    current_effective_end: date
    comparison_effective_start: date
    comparison_effective_end: date
    current_effective_days: int
    comparison_effective_days: int
    window_days: int  # Canonical alias for current_effective_days
    
    # Comparison Typology & Overlap
    comparison_class: str  # ADJACENT_PERIOD, OVERLAPPING_PERIOD, BASELINE_ANCHORED, SAME_PERIOD_REMEASUREMENT, etc.
    overlap_start: Optional[date]
    overlap_end: Optional[date]
    overlap_days: int
    overlap_ratio: float
    is_comparable_for_trend: bool
    
    # Deltas
    delta_impressions: int
    delta_impressions_pct: Optional[float]
    delta_clicks: int
    delta_macro_position: float
    delta_dimensioned_position: float
    delta_unique_pages: int
    delta_unique_queries: int
    delta_organic_sessions: int
    
    concentration: ConcentrationMetrics
    query_intel: QueryIntelligence


def calculate_period_overlap(
    start_a: date,
    end_a: date,
    start_b: date,
    end_b: date,
) -> Dict[str, Any]:
    """
    Calculate exact date overlap between two observation periods.
    
    Returns:
    - overlap_start: date or None
    - overlap_end: date or None
    - overlap_days: int (inclusive count)
    - overlap_ratio_a: overlap_days / len_a
    - overlap_ratio_b: overlap_days / len_b
    """
    len_a = (end_a - start_a).days + 1
    len_b = (end_b - start_b).days + 1
    
    overlap_start = max(start_a, start_b)
    overlap_end = min(end_a, end_b)
    
    if overlap_start <= overlap_end:
        overlap_days = (overlap_end - overlap_start).days + 1
        return {
            "overlap_start": overlap_start,
            "overlap_end": overlap_end,
            "overlap_days": overlap_days,
            "overlap_ratio_a": overlap_days / len_a,
            "overlap_ratio_b": overlap_days / len_b,
        }
    return {
        "overlap_start": None,
        "overlap_end": None,
        "overlap_days": 0,
        "overlap_ratio_a": 0.0,
        "overlap_ratio_b": 0.0,
    }


def classify_comparison_type(
    curr_start: date,
    curr_end: date,
    comp_start: date,
    comp_end: date,
    curr_meas_id: str,
    comp_meas_id: str,
    curr_version: int = 2,
    comp_version: int = 2,
) -> Tuple[str, bool]:
    """
    Classify comparison type and determine if suitable for longitudinal trend evaluation.
    
    Rules:
    - ADJACENT_PERIOD: overlap == 0 and periods touch or align (eligible for trend).
    - OVERLAPPING_PERIOD: overlap > 0 and not exact match (not eligible for longitudinal trend).
    - BASELINE_ANCHORED: comparing against fixed baseline (eligible with caveats).
    - SAME_PERIOD_REMEASUREMENT: exact same dates, same version (re-check).
    - METHODOLOGY_RECONCILIATION: exact or near dates, different versions/models.
    - NON_COMPARABLE: disjoint or missing data.
    """
    overlap_info = calculate_period_overlap(curr_start, curr_end, comp_start, comp_end)
    overlap_days = overlap_info["overlap_days"]

    if curr_start == comp_start and curr_end == comp_end:
        if curr_version != comp_version:
            return "METHODOLOGY_RECONCILIATION", False
        return "SAME_PERIOD_REMEASUREMENT", False

    if "baseline" in comp_meas_id.lower() or comp_meas_id == "meas_20260902_baseline_v2":
        if overlap_days > 0:
            return "METHODOLOGY_RECONCILIATION", False
        return "BASELINE_ANCHORED", False

    if overlap_days == 0:
        # Check if adjacent (one period ends right before the other starts)
        gap_days = (curr_start - comp_end).days if curr_start > comp_end else (comp_start - curr_end).days
        if gap_days == 1:
            return "ADJACENT_PERIOD", True
        return "DISJOINT_PERIOD", False

    return "OVERLAPPING_PERIOD", False


def compute_concentration_metrics(measurement_id: str, db_uri: str = DEFAULT_DB_URI) -> ConcentrationMetrics:
    """Calculate impression concentration across top pages, queries, and cohorts."""
    metrics = ConcentrationMetrics()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT gsc_total_impressions FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            meas_row = cur.fetchone()
            if not meas_row or meas_row["gsc_total_impressions"] <= 0:
                return metrics
            total_imps = meas_row["gsc_total_impressions"]

            cur.execute(
                """
                SELECT impressions, cohort_name
                FROM page_measurements
                WHERE measurement_id = %s
                ORDER BY impressions DESC;
                """,
                (measurement_id,),
            )
            page_rows = cur.fetchall()
            page_imps = [r["impressions"] for r in page_rows]

            if page_imps:
                metrics.top_1_page_share = page_imps[0] / total_imps
                metrics.top_5_page_share = sum(page_imps[:5]) / total_imps
                metrics.top_10_page_share = sum(page_imps[:10]) / total_imps

            cohort_totals: Dict[str, int] = {}
            for r in page_rows:
                c = r["cohort_name"]
                cohort_totals[c] = cohort_totals.get(c, 0) + r["impressions"]
            metrics.cohort_shares = {c: val / total_imps for c, val in cohort_totals.items()}

            cur.execute(
                """
                SELECT impressions
                FROM query_measurements
                WHERE measurement_id = %s
                ORDER BY impressions DESC;
                """,
                (measurement_id,),
            )
            query_rows = cur.fetchall()
            query_imps = [r["impressions"] for r in query_rows]
            if query_imps:
                metrics.top_1_query_share = query_imps[0] / total_imps
                metrics.top_5_query_share = sum(query_imps[:5]) / total_imps
                metrics.top_10_query_share = sum(query_imps[:10]) / total_imps

    return metrics


def compute_query_intelligence(
    current_meas_id: str,
    prev_meas_id: Optional[str] = None,
    db_uri: str = DEFAULT_DB_URI,
) -> QueryIntelligence:
    """Compute query evolution and detect potential SERP cannibalization."""
    intel = QueryIntelligence()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT qm.query_text, COUNT(DISTINCT qm.page_id) as page_count,
                       SUM(qm.impressions) as total_imps,
                       ARRAY_AGG(pr.canonical_url) as competing_urls
                FROM query_measurements qm
                JOIN page_registry pr ON qm.page_id = pr.id
                WHERE qm.measurement_id = %s
                GROUP BY qm.query_text
                HAVING COUNT(DISTINCT qm.page_id) > 1
                ORDER BY total_imps DESC;
                """,
                (current_meas_id,),
            )
            for r in cur.fetchall():
                intel.cannibalization_candidates.append({
                    "query": r["query_text"],
                    "page_count": r["page_count"],
                    "total_impressions": r["total_imps"],
                    "competing_urls": r["competing_urls"],
                    "classification": "POTENTIAL_CANNIBALIZATION",
                })

            if not prev_meas_id:
                return intel

            cur.execute(
                "SELECT query_text, impressions, position FROM query_measurements WHERE measurement_id = %s;",
                (current_meas_id,),
            )
            curr_q = {r["query_text"]: r for r in cur.fetchall()}

            cur.execute(
                "SELECT query_text, impressions, position FROM query_measurements WHERE measurement_id = %s;",
                (prev_meas_id,),
            )
            prev_q = {r["query_text"]: r for r in cur.fetchall()}

            for q, r in curr_q.items():
                if q not in prev_q:
                    intel.new_queries.append(q)
                else:
                    p_r = prev_q[q]
                    if r["impressions"] > p_r["impressions"]:
                        intel.growing_queries.append((q, p_r["impressions"], r["impressions"]))
                    elif r["impressions"] < p_r["impressions"]:
                        intel.declining_queries.append((q, p_r["impressions"], r["impressions"]))

                    if r["position"] < p_r["position"]:
                        intel.improving_queries.append((q, p_r["position"], r["position"]))
                    elif r["position"] > p_r["position"]:
                        intel.regressing_queries.append((q, p_r["position"], r["position"]))

            for q in prev_q:
                if q not in curr_q:
                    intel.lost_queries.append(q)

    return intel


def compare_measurements(
    current_meas_id: str,
    comparison_meas_id: str,
    db_uri: str = DEFAULT_DB_URI,
) -> ComparisonVector:
    """Compare two acquisition measurements with exact overlap and temporal classification."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (current_meas_id,))
            curr = cur.fetchone()
            if not curr:
                raise ValueError(f"Current measurement '{current_meas_id}' not found.")

            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (comparison_meas_id,))
            comp = cur.fetchone()
            if not comp:
                raise ValueError(f"Comparison measurement '{comparison_meas_id}' not found.")

    curr_start = curr["effective_period_start"]
    curr_end = curr["effective_period_end"]
    comp_start = comp["effective_period_start"]
    comp_end = comp["effective_period_end"]

    curr_days = (curr_end - curr_start).days + 1
    comp_days = (comp_end - comp_start).days + 1

    overlap_info = calculate_period_overlap(curr_start, curr_end, comp_start, comp_end)
    comp_class, is_trend_comparable = classify_comparison_type(
        curr_start,
        curr_end,
        comp_start,
        comp_end,
        current_meas_id,
        comparison_meas_id,
        curr["measurement_version"],
        comp["measurement_version"],
    )

    d_imps = curr["gsc_total_impressions"] - comp["gsc_total_impressions"]
    d_imps_pct = (d_imps / comp["gsc_total_impressions"] * 100.0) if comp["gsc_total_impressions"] > 0 else None
    d_clicks = curr["gsc_total_clicks"] - comp["gsc_total_clicks"]
    d_macro_pos = curr["gsc_aggregate_position"] - comp["gsc_aggregate_position"]
    d_dim_pos = curr["dimensioned_impression_weighted_position"] - comp["dimensioned_impression_weighted_position"]
    d_pages = curr["unique_visible_pages"] - comp["unique_visible_pages"]
    d_queries = curr["unique_visible_queries"] - comp["unique_visible_queries"]
    d_sessions = curr["ga4_organic_sessions"] - comp["ga4_organic_sessions"]

    concentration = compute_concentration_metrics(current_meas_id, db_uri=db_uri)
    query_intel = compute_query_intelligence(current_meas_id, comparison_meas_id, db_uri=db_uri)

    return ComparisonVector(
        current_meas_id=current_meas_id,
        comparison_meas_id=comparison_meas_id,
        current_effective_start=curr_start,
        current_effective_end=curr_end,
        comparison_effective_start=comp_start,
        comparison_effective_end=comp_end,
        current_effective_days=curr_days,
        comparison_effective_days=comp_days,
        window_days=curr_days,
        comparison_class=comp_class,
        overlap_start=overlap_info["overlap_start"],
        overlap_end=overlap_info["overlap_end"],
        overlap_days=overlap_info["overlap_days"],
        overlap_ratio=overlap_info["overlap_ratio_a"],
        is_comparable_for_trend=is_trend_comparable,
        delta_impressions=d_imps,
        delta_impressions_pct=d_imps_pct,
        delta_clicks=d_clicks,
        delta_macro_position=d_macro_pos,
        delta_dimensioned_position=d_dim_pos,
        delta_unique_pages=d_pages,
        delta_unique_queries=d_queries,
        delta_organic_sessions=d_sessions,
        concentration=concentration,
        query_intel=query_intel,
    )
