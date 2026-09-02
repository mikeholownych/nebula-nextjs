"""Reporting and Markdown Artifact Generation for Acquisition Learning System."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

from .models import DEFAULT_DB_URI
from .state_engine import evaluate_and_persist_state_transitions
from .trend_engine import classify_sitewide_trend
from .window_computation import compare_measurements


def render_baseline_report(
    measurement_id: str = "meas_20260902_baseline_v2",
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Render canonical ACQUISITION_BASELINE.md from PostgreSQL records."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            meas = cur.fetchone()
            if not meas:
                raise ValueError(f"Measurement '{measurement_id}' not found.")

            cur.execute(
                """
                SELECT pr.canonical_url, pm.cohort_name, pm.impressions, pm.clicks,
                       pm.best_position, pm.weighted_avg_position
                FROM page_measurements pm
                JOIN page_registry pr ON pm.page_id = pr.id
                WHERE pm.measurement_id = %s
                ORDER BY pm.impressions DESC;
                """,
                (measurement_id,),
            )
            pages = cur.fetchall()

            cur.execute("SELECT anomaly_type, description, status FROM acquisition_anomalies;")
            anomalies = cur.fetchall()

    effective_days = (meas["effective_period_end"] - meas["effective_period_start"]).days + 1

    md = []
    md.append("# Acquisition Baseline (Canonical PostgreSQL Render)")
    md.append("")
    md.append(f"**Period:** {meas['requested_period_start']} to {meas['requested_period_end']}")
    md.append(f"**Effective Finalized Window:** {meas['effective_period_start']} to {meas['effective_period_end']} ({effective_days} finalized source days)")
    md.append(f"**Generated:** {meas['generated_at'].strftime('%Y-%m-%d %H:%M:%S')}")
    md.append(f"**Measurement ID:** `{meas['id']}`")
    md.append(f"**Measurement Version:** {meas['measurement_version']}")
    md.append(f"**Git Commit:** {meas['measurement_code_commit']}")
    md.append("")
    md.append("## Search Visibility (GSC)")
    md.append("")
    md.append("| Metric | Value | Definition / Source |")
    md.append("|--------|-------|---------------------|")
    md.append(f"| Unique pages | {meas['unique_visible_pages']} | Unique indexable URLs with impressions |")
    md.append(f"| Total impressions | {meas['gsc_total_impressions']} | GSC dimensionless aggregate |")
    md.append(f"| Total clicks | {meas['gsc_total_clicks']} | GSC dimensionless aggregate |")
    md.append(f"| Sitewide macro avg position (`gsc_aggregate_position`) | {meas['gsc_aggregate_position']:.1f} | Dimensionless aggregate (incl. anonymized data) |")
    md.append(f"| Drill-down weighted avg position (`dimensioned_impression_weighted_position`) | {meas['dimensioned_impression_weighted_position']:.1f} | Impressions-weighted sum over visible rows |")
    md.append("")
    md.append("### Position Distribution (Best Observed Page Position)")
    md.append("")
    md.append("| Bucket | Range | Count | Share |")
    md.append("|--------|-------|-------|-------|")
    tot_p = max(meas['unique_visible_pages'], 1)
    md.append(f"| Positions 1-10 | [1.0, 11.0) | {meas['pos_bucket_1_10']} | {meas['pos_bucket_1_10'] / tot_p * 100:.1f}% |")
    md.append(f"| Positions 11-20 | [11.0, 21.0) | {meas['pos_bucket_11_20']} | {meas['pos_bucket_11_20'] / tot_p * 100:.1f}% |")
    md.append(f"| Positions 21-30 | [21.0, 31.0) | {meas['pos_bucket_21_30']} | {meas['pos_bucket_21_30'] / tot_p * 100:.1f}% |")
    md.append(f"| Positions 31-50 | [31.0, 51.0) | {meas['pos_bucket_31_50']} | {meas['pos_bucket_31_50'] / tot_p * 100:.1f}% |")
    md.append(f"| Positions 51+ | [51.0, inf) | {meas['pos_bucket_51_plus']} | {meas['pos_bucket_51_plus'] / tot_p * 100:.1f}% |")
    md.append("")
    md.append("### Top Pages by Impressions")
    md.append("")
    md.append("| Page | Cohort | Impressions | Best Position |")
    md.append("|------|--------|-------------|---------------|")
    for p in pages:
        bp_str = f"{p['best_position']:.1f}" if p['best_position'] is not None else "N/A"
        md.append(f"| {p['canonical_url']} | {p['cohort_name']} | {p['impressions']} | {bp_str} |")
    md.append("")
    md.append("## Organic Traffic (GA4)")
    md.append("")
    md.append("| Metric | Value |")
    md.append("|--------|-------|")
    md.append(f"| Total organic sessions | {meas['ga4_organic_sessions']} |")
    md.append(f"| Search entry landing sessions | {meas['ga4_search_entry_sessions']} |")
    md.append(f"| Downstream checkout sessions (`KNOWN_ATTRIBUTION_BEHAVIOR`) | {meas['ga4_downstream_checkout_sessions']} |")
    md.append(f"| Avg daily sessions | {meas['ga4_organic_sessions'] / effective_days:.2f} |")
    md.append("")
    if anomalies:
        md.append("## Active Known Anomalies & Attribution Behaviors")
        md.append("")
        for a in anomalies:
            md.append(f"- **[{a['status']}] {a['anomaly_type']}:** {a['description']}")
        md.append("")

    return "\n".join(md)


def render_weekly_observation_report(
    current_meas_id: str,
    prev_meas_id: Optional[str] = None,
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Render factual Weekly Acquisition Observation Report with temporal integrity."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (current_meas_id,))
            curr = cur.fetchone()
            if not curr:
                raise ValueError(f"Current measurement '{current_meas_id}' not found.")

            cur.execute("SELECT * FROM acquisition_source_runs WHERE measurement_id = %s;", (current_meas_id,))
            source_runs = cur.fetchall()

    curr_eff_days = (curr["effective_period_end"] - curr["effective_period_start"]).days + 1

    # Compare vector if previous measurement exists
    vector: Optional[Any] = None
    trend: Optional[Any] = None
    if prev_meas_id and prev_meas_id != current_meas_id:
        try:
            vector = compare_measurements(current_meas_id, prev_meas_id, db_uri)
            trend = classify_sitewide_trend(vector, curr["data_completeness_status"], curr["source_finalization_status"])
        except Exception:
            pass

    transitions = evaluate_and_persist_state_transitions(current_meas_id, prev_meas_id, db_uri, dry_run=True)

    md = []
    md.append("# Weekly Acquisition Observation Report")
    md.append("")
    md.append(f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    md.append(f"**Measurement ID:** `{current_meas_id}`")
    md.append(f"**Effective Period:** {curr['effective_period_start']} to {curr['effective_period_end']} ({curr_eff_days} finalized source days)")
    md.append(f"**Data Completeness:** `{curr['data_completeness_status']}` | **Finalization:** `{curr['source_finalization_status']}`")
    md.append("")
    
    # 1. Source Health & Provenance
    md.append("## 1. Source Health & Ingestion Audit")
    md.append("")
    md.append("| Source System | Property | Status | Rows Received | Latency (ms) |")
    md.append("|---------------|----------|--------|---------------|--------------|")
    for sr in source_runs:
        md.append(f"| {sr['source_system']} | {sr['source_property']} | {sr['status']} | {sr['records_received']} | {sr['execution_duration_ms']} |")
    md.append("")

    # 2. Comparison Context
    if vector:
        md.append("## 2. Comparison & Temporal Context")
        md.append("")
        md.append(f"- **Comparator Measurement ID:** `{vector.comparison_meas_id}`")
        md.append(f"- **Comparator Effective Period:** {vector.comparison_effective_start} to {vector.comparison_effective_end} ({vector.comparison_effective_days} days)")
        md.append(f"- **Comparison Class:** `{vector.comparison_class}`")
        md.append(f"- **Overlap:** {vector.overlap_days} days ({vector.overlap_ratio * 100:.1f}%)")
        md.append(f"- **Eligible for Longitudinal Trend:** `{vector.is_comparable_for_trend}`")
        md.append("")

    # 3. Key Metrics & Comparison
    md.append("## 3. Quantitative Search Visibility & Traffic Observations")
    md.append("")
    md.append("| Metric | Current Value | Comparator Delta | Description |")
    md.append("|--------|---------------|------------------|-------------|")
    d_imp_str = f"{vector.delta_impressions:+d} ({vector.delta_impressions_pct:+.1f}%)" if vector and vector.delta_impressions_pct is not None else "N/A"
    d_clk_str = f"{vector.delta_clicks:+d}" if vector else "N/A"
    d_pos_str = f"{vector.delta_macro_position:+.1f}" if vector else "N/A"
    d_sess_str = f"{vector.delta_organic_sessions:+d}" if vector else "N/A"
    
    md.append(f"| GSC Total Impressions | {curr['gsc_total_impressions']} | {d_imp_str} | Sitewide aggregate query |")
    md.append(f"| GSC Total Clicks | {curr['gsc_total_clicks']} | {d_clk_str} | Sitewide aggregate query |")
    md.append(f"| Sitewide Macro Position (`gsc_aggregate_position`) | {curr['gsc_aggregate_position']:.1f} | {d_pos_str} | Aggregate rank across all searches |")
    md.append(f"| Drill-Down Weighted Position | {curr['dimensioned_impression_weighted_position']:.1f} | N/A | Weighted across visible dimensioned rows |")
    md.append(f"| GA4 Organic Sessions | {curr['ga4_organic_sessions']} | {d_sess_str} | Total organic search traffic |")
    md.append(f"| GA4 Search Entry Sessions | {curr['ga4_search_entry_sessions']} | N/A | Landing on indexable content routes |")
    md.append(f"| Internal Audit Starts | {curr['internal_audit_started']} | N/A | Authoritative platform ledger |")
    md.append(f"| Internal Purchases | {curr['internal_purchases']} | N/A | Authoritative platform ledger |")
    md.append("")

    # 4. Trend Classification
    if trend:
        md.append("## 4. Deterministic Trend Evaluation")
        md.append("")
        md.append(f"- **Classification:** `{trend.classification}`")
        md.append(f"- **Primary Reason:** {trend.primary_reason}")
        md.append(f"- **Evidence Gate Passed:** `{trend.evidence_gate_passed}`")
        md.append("")

    # 5. Search Visibility State Initializations & Transitions
    init_obs = [t for t in transitions if t["transition_type"] == "INITIAL"]
    prog_trans = [t for t in transitions if t["transition_type"] == "PROGRESSION"]
    reg_trans = [t for t in transitions if t["transition_type"] == "REGRESSION"]
    
    md.append("## 5. Search Visibility State Initializations & Transitions")
    md.append("")
    if init_obs:
        md.append(f"### Initial State Observations ({len(init_obs)} pages)")
        for t in init_obs:
            md.append(f"- **{t['canonical_url']}:** `{t['to_state']}` ({t['transition_reason']})")
        md.append("")
    if prog_trans:
        md.append(f"### Genuine Progressions ({len(prog_trans)} pages)")
        for t in prog_trans:
            md.append(f"- **{t['canonical_url']}:** `{t['from_state']}` -> `{t['to_state']}` ({t['transition_reason']})")
        md.append("")
    if reg_trans:
        md.append(f"### Genuine Regressions ({len(reg_trans)} pages)")
        for t in reg_trans:
            md.append(f"- **{t['canonical_url']}:** `{t['from_state']}` -> `{t['to_state']}` ({t['transition_reason']})")
        md.append("")
    if not init_obs and not prog_trans and not reg_trans:
        md.append("No state initializations, progressions, or regressions detected in this period.")
        md.append("")

    # 6. Active Anomalies
    if curr["known_anomalies"]:
        md.append("## 6. Active Known Anomalies & Attribution Notes")
        md.append("")
        for a in curr["known_anomalies"]:
            md.append(f"- `{a}`")
        md.append("")

    md.append("---")
    md.append("*Phase 4B Factual Observation Report. Recommendations intentionally deferred to Phase 5/6.*")
    return "\n".join(md)
