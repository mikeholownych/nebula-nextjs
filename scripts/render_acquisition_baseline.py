#!/usr/bin/env python3
"""
Render Acquisition Baseline from Canonical PostgreSQL Datastore.

Demonstrates that Markdown baseline artifacts can be dynamically generated
from authoritative database records in nebula_platform PostgreSQL.
"""

import os
import sys
from typing import Optional
import psycopg
from psycopg.rows import dict_row

DB_URI = os.getenv(
    "ACQUISITION_DB_URI",
    "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433",
)


def render_baseline_markdown(measurement_id: str = "meas_20260902_baseline_v2") -> str:
    with psycopg.connect(DB_URI, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Fetch Master Measurement
            cur.execute(
                """
                SELECT * FROM acquisition_measurements WHERE id = %s;
                """,
                (measurement_id,),
            )
            meas = cur.fetchone()
            if not meas:
                raise ValueError(f"Measurement '{measurement_id}' not found in database.")

            # 2. Fetch Top Page Measurements
            cur.execute(
                """
                SELECT pr.canonical_url, pm.impressions, pm.best_position, pm.cohort_name
                FROM page_measurements pm
                JOIN page_registry pr ON pm.page_id = pr.id
                WHERE pm.measurement_id = %s
                ORDER BY pm.impressions DESC;
                """,
                (measurement_id,),
            )
            pages = cur.fetchall()

            # 3. Fetch Anomalies
            cur.execute(
                """
                SELECT anomaly_type, description, status
                FROM acquisition_anomalies
                WHERE %s = ANY(affected_metrics) OR anomaly_type = 'CHECKOUT_ATTRIBUTION_RESET';
                """,
                ("ga4_organic_sessions",),
            )
            anomalies = cur.fetchall()

    # Format Markdown
    md = []
    md.append("# Nebula Acquisition Baseline (PostgreSQL Canonical Render)")
    md.append("")
    md.append(f"**Period:** {meas['requested_period_start']} - {meas['requested_period_end']} ({meas['window_days']} days)")
    md.append(f"**Effective Finalized Window:** {meas['effective_period_start']} - {meas['effective_period_end']}")
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
    md.append("| Bucket | Count | Share |")
    md.append("|--------|-------|-------|")
    total_pages = max(meas['unique_visible_pages'], 1)
    md.append(f"| Positions 1-10 | {meas['pos_bucket_1_10']} | {meas['pos_bucket_1_10'] / total_pages * 100:.1f}% |")
    md.append(f"| Positions 11-20 | {meas['pos_bucket_11_20']} | {meas['pos_bucket_11_20'] / total_pages * 100:.1f}% |")
    md.append(f"| Positions 21-30 | {meas['pos_bucket_21_30']} | {meas['pos_bucket_21_30'] / total_pages * 100:.1f}% |")
    md.append(f"| Positions 31-50 | {meas['pos_bucket_31_50']} | {meas['pos_bucket_31_50'] / total_pages * 100:.1f}% |")
    md.append(f"| Positions 51+ | {meas['pos_bucket_51_plus']} | {meas['pos_bucket_51_plus'] / total_pages * 100:.1f}% |")
    md.append("")
    md.append("### Top Pages by Impressions")
    md.append("")
    md.append("| Page | Cohort | Impressions | Best Position |")
    md.append("|------|--------|-------------|---------------|")
    for p in pages:
        best_pos_str = f"{p['best_position']:.1f}" if p['best_position'] is not None else "N/A"
        md.append(f"| {p['canonical_url']} | {p['cohort_name']} | {p['impressions']} | {best_pos_str} |")
    md.append("")
    md.append("## Organic Traffic (GA4)")
    md.append("")
    md.append("| Metric | Value |")
    md.append("|--------|-------|")
    md.append(f"| Total organic sessions | {meas['ga4_organic_sessions']} |")
    md.append(f"| Search entry landing sessions | {meas['ga4_search_entry_sessions']} |")
    md.append(f"| Downstream checkout sessions (`KNOWN_ATTRIBUTION_BEHAVIOR`) | {meas['ga4_downstream_checkout_sessions']} |")
    md.append(f"| Avg daily sessions | {meas['ga4_organic_sessions'] / meas['window_days']:.2f} |")
    md.append("")
    
    if anomalies:
        md.append("## Active Known Anomalies & Attribution Behaviors")
        md.append("")
        for a in anomalies:
            md.append(f"- **[{a['status']}] {a['anomaly_type']}:** {a['description']}")
        md.append("")

    return "\n".join(md)


def main():
    meas_id = sys.argv[1] if len(sys.argv) > 1 else "meas_20260902_baseline_v2"
    rendered = render_baseline_markdown(meas_id)
    print(rendered)


if __name__ == "__main__":
    main()
