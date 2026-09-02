"""Rolling Window Computation, Concentration Metrics & Query Intelligence."""

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
    window_days: int
    
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


def compute_concentration_metrics(measurement_id: str, db_uri: str = DEFAULT_DB_URI) -> ConcentrationMetrics:
    """Calculate impression concentration across top pages, queries, and cohorts."""
    metrics = ConcentrationMetrics()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Fetch total impressions
            cur.execute("SELECT gsc_total_impressions FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            meas_row = cur.fetchone()
            if not meas_row or meas_row["gsc_total_impressions"] <= 0:
                return metrics
            total_imps = meas_row["gsc_total_impressions"]

            # 2. Page concentration
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

            # Cohort shares
            cohort_totals: Dict[str, int] = {}
            for r in page_rows:
                c = r["cohort_name"]
                cohort_totals[c] = cohort_totals.get(c, 0) + r["impressions"]
            metrics.cohort_shares = {c: val / total_imps for c, val in cohort_totals.items()}

            # 3. Query concentration
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
            # Detect cannibalization candidates (queries appearing across multiple pages in current window)
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

            # Fetch current and previous query maps
            cur.execute(
                "SELECT query_text, SUM(impressions) as imps, AVG(position) as pos FROM query_measurements WHERE measurement_id = %s GROUP BY query_text;",
                (current_meas_id,),
            )
            curr_queries = {r["query_text"]: {"imps": r["imps"], "pos": float(r["pos"])} for r in cur.fetchall()}

            cur.execute(
                "SELECT query_text, SUM(impressions) as imps, AVG(position) as pos FROM query_measurements WHERE measurement_id = %s GROUP BY query_text;",
                (prev_meas_id,),
            )
            prev_queries = {r["query_text"]: {"imps": r["imps"], "pos": float(r["pos"])} for r in cur.fetchall()}

            # New and lost queries
            intel.new_queries = [q for q in curr_queries if q not in prev_queries]
            intel.lost_queries = [q for q in prev_queries if q not in curr_queries]

            # Growth, decline, position movement
            for q, c_data in curr_queries.items():
                if q in prev_queries:
                    p_data = prev_queries[q]
                    if c_data["imps"] > p_data["imps"]:
                        intel.growing_queries.append((q, p_data["imps"], c_data["imps"]))
                    elif c_data["imps"] < p_data["imps"]:
                        intel.declining_queries.append((q, p_data["imps"], c_data["imps"]))

                    # Position improvement (lower number is higher on SERP)
                    if c_data["pos"] < p_data["pos"] - 1.0:
                        intel.improving_queries.append((q, p_data["pos"], c_data["pos"]))
                    elif c_data["pos"] > p_data["pos"] + 1.0:
                        intel.regressing_queries.append((q, p_data["pos"], c_data["pos"]))

    return intel


def compare_measurements(
    current_meas_id: str,
    comparison_meas_id: str,
    db_uri: str = DEFAULT_DB_URI,
) -> ComparisonVector:
    """Compute deterministic comparison vector between two finalized measurement envelopes."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (current_meas_id,))
            curr = cur.fetchone()
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (comparison_meas_id,))
            comp = cur.fetchone()

    if not curr or not comp:
        raise ValueError(f"Measurement not found: current={current_meas_id}, comp={comparison_meas_id}")

    d_imps = curr["gsc_total_impressions"] - comp["gsc_total_impressions"]
    d_imps_pct = (d_imps / comp["gsc_total_impressions"] * 100.0) if comp["gsc_total_impressions"] > 0 else None
    d_clks = curr["gsc_total_clicks"] - comp["gsc_total_clicks"]
    d_macro_pos = float(curr["gsc_aggregate_position"]) - float(comp["gsc_aggregate_position"])
    d_dim_pos = float(curr["dimensioned_impression_weighted_position"]) - float(comp["dimensioned_impression_weighted_position"])
    d_pages = curr["unique_visible_pages"] - comp["unique_visible_pages"]
    d_queries = curr["unique_visible_queries"] - comp["unique_visible_queries"]
    d_sessions = curr["ga4_organic_sessions"] - comp["ga4_organic_sessions"]

    conc = compute_concentration_metrics(current_meas_id, db_uri)
    intel = compute_query_intelligence(current_meas_id, comparison_meas_id, db_uri)

    return ComparisonVector(
        current_meas_id=current_meas_id,
        comparison_meas_id=comparison_meas_id,
        window_days=curr["window_days"],
        delta_impressions=d_imps,
        delta_impressions_pct=d_imps_pct,
        delta_clicks=d_clks,
        delta_macro_position=d_macro_pos,
        delta_dimensioned_position=d_dim_pos,
        delta_unique_pages=d_pages,
        delta_unique_queries=d_queries,
        delta_organic_sessions=d_sessions,
        concentration=conc,
        query_intel=intel,
    )
