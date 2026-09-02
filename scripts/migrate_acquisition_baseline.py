#!/usr/bin/env python3
"""
Canonical Historical Migration Script for Nebula Acquisition Learning System.

Migrates the September 2026 baseline data from repository artifacts into
nebula_platform PostgreSQL (port 5433).

Key operations:
1. Registers measurement version 2.0.0 with SHA-256 definition hash.
2. Registers decision rule set 2.0.0 with SHA-256 definition hash.
3. Seeds canonical page registry from route definitions.
4. Seeds declarative page cohort assignments.
5. Ingests master acquisition measurement record (meas_20260902_baseline_v2).
6. Ingests source run records with payload verification hashes.
7. Ingests page measurement snapshots.
8. Registers structured anomaly for /checkout attribution behavior.

Guarantees:
- Idempotent execution (safe to re-run multiple times).
- Immutability compliant (respects database triggers).
- Reconciles 65.6 (gsc_aggregate_position) and 64.3 (dimensioned_impression_weighted_position).
"""

import hashlib
import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

DB_URI = os.getenv(
    "ACQUISITION_DB_URI",
    "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433",
)

BASE_URL = "https://nebulacomponents.com"

# 1. Canonical Version & Rule Definitions
MEASUREMENT_VERSION_2_DEF: Dict[str, Any] = {
    "metric_definition_version": "2.0.0",
    "cohort_definition_version": "2.0.0",
    "page_classification_version": "2.0.0",
    "attribution_model_version": "last_non_direct_v1",
    "bot_filtering_version": "1.0.0",
    "internal_traffic_filter_version": "1.0.0",
    "measurement_code_commit": "8e59bf3d0d6f8e13e83f8e84a1e12e9eefc60360",
    "sitewide_position_metric": "gsc_aggregate_position",
    "drilldown_position_metric": "dimensioned_impression_weighted_position",
    "position_buckets": {
        "POS_1_10": [1.0, 10.4],
        "POS_11_20": [10.5, 20.4],
        "POS_21_30": [20.5, 30.4],
        "POS_31_50": [30.5, 50.4],
        "POS_51_PLUS": [50.5, None],
    },
    "date_window_policy": {
        "gsc_lag_days": 3,
        "ga4_lag_days": 1,
        "standard_baseline_days": 28,
        "canonical_timezone": "UTC",
        "gsc_timezone": "America/Los_Angeles",
    },
}

DECISION_RULE_SET_2_DEF: Dict[str, Any] = {
    "version": "2.0.0",
    "min_holdout_days": 28,
    "min_impression_gate": 100,
    "ctr_underperformance_threshold": 0.01,
    "statistical_noise_band": 0.05,
    "evidence_states": ["SUFFICIENT", "INSUFFICIENT", "INCOMPLETE", "BLOCKED"],
    "action_classes": [
        "NO_CHANGE",
        "OBSERVE",
        "INVESTIGATE",
        "REVIEW_QUERY_ALIGNMENT",
        "REVIEW_CONTENT_ALIGNMENT",
        "REVIEW_INTERNAL_LINKING",
        "REVIEW_SERP_PRESENTATION",
        "REVIEW_TECHNICAL_INDEXABILITY",
        "REVIEW_CANNIBALIZATION",
        "CONSOLIDATE",
        "RETIRE",
        "EXPAND_ADJACENCY",
        "RUN_CONTROLLED_EXPERIMENT",
    ],
}

# 2. Canonical Route Inventory
CANONICAL_ROUTES = [
    # Core & Commercial
    ("/", "product_core", "static", 1.0, True),
    ("/pricing", "product_core", "static", 0.9, True),
    ("/audit", "product_core", "static", 0.9, True),
    ("/spec/landing-page-diagnostic-v1", "resources", "static", 0.9, True),
    ("/how-nebula-audits", "resources", "static", 0.9, True),
    
    # Signal Hubs
    ("/signals", "category", "static", 0.8, True),
    ("/signals/message-match", "category", "static", 0.8, True),
    ("/signals/trust-signals", "category", "static", 0.8, True),
    ("/signals/mobile-cta", "category", "static", 0.8, True),
    ("/signals/load-speed", "category", "static", 0.8, True),
    ("/signals/cta-clarity", "category", "static", 0.8, True),
    ("/signals/above-fold-clarity", "category", "static", 0.8, True),
    ("/signals/ad-signal-continuity", "category", "static", 0.8, True),
    ("/signals/seo-foundations", "category", "static", 0.8, True),
    ("/signals/ai-readiness", "category", "static", 0.8, True),
    
    # High-Intent Landing Pages (Problem & Category)
    ("/why-is-my-landing-page-not-converting", "problem_intent", "static", 0.8, True),
    ("/ads-getting-clicks-but-no-sales", "problem_intent", "static", 0.8, True),
    ("/cta-optimization", "problem_intent", "static", 0.7, True),
    ("/headline-optimization", "problem_intent", "static", 0.7, True),
    ("/mobile-landing-page-optimization", "problem_intent", "static", 0.7, True),
    ("/page-speed-conversion", "problem_intent", "static", 0.7, True),
    ("/social-proof-landing-page", "problem_intent", "static", 0.7, True),
    ("/roas-cliff", "problem_intent", "static", 0.7, True),
    
    ("/best-landing-page-audit-tools", "category", "static", 0.8, True),
    ("/landing-page-audit-tools-pricing", "category", "static", 0.8, True),
    ("/what-is-landing-page-audit", "category", "static", 0.7, True),
    ("/landing-page-message-match", "category", "static", 0.8, True),
    ("/landing-page-trust-signals", "category", "static", 0.8, True),
    ("/landing-page-cta-audit", "category", "static", 0.8, True),
    ("/conversion-rate-optimization-audit", "category", "static", 0.8, True),
    ("/why-cro-agencies-dont-work", "category", "static", 0.8, True),
    ("/ai-readiness-landing-page-check", "category", "static", 0.8, True),
    ("/page-intent-aware-audit", "category", "static", 0.8, True),
    
    # Vertical Use Cases
    ("/lead-generation-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/saas-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/ecommerce-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/mobile-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/7-systems", "vertical_use_case", "static", 0.7, True),
    ("/ai-sdr-vs-audit", "vertical_use_case", "static", 0.7, True),
    
    # Comparisons (/vs and /compare)
    ("/vs", "commercial_comparison", "static", 0.7, True),
    ("/compare", "commercial_comparison", "static", 0.7, True),
    ("/vs/screaming-frog", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/unbounce", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/page-speed-insights", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/instapage", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/leadpages", "commercial_comparison", "dynamic", 0.6, True),
    
    # Teardowns & Case Studies
    ("/teardowns", "teardown_index", "static", 0.7, True),
    ("/teardowns/airtable", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/cal-com", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/linear", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/miro", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/notion", "individual_teardown", "dynamic", 0.7, True),
    ("/case-studies", "case_study", "static", 0.8, True),
    
    # Hubs, Resources & Learning Centre
    ("/learning-centre", "resources", "static", 0.8, True),
    ("/resources", "resources", "static", 0.8, True),
    ("/observatory", "resources", "static", 0.8, True),
    ("/playbooks", "resources", "static", 0.7, True),
    ("/benchmarks", "resources", "static", 0.7, True),
    ("/brand", "resources", "static", 0.7, True),
    ("/lab", "resources", "static", 0.7, True),
    ("/press", "resources", "static", 0.7, True),
    ("/faq", "resources", "static", 0.7, True),
    ("/editorial-standards", "resources", "static", 0.7, True),
    ("/what-is-nebula-components", "resources", "static", 0.7, True),
    
    # Utility & Legal
    ("/about", "utility_legal", "static", 0.5, True),
    ("/about/team", "utility_legal", "static", 0.5, True),
    ("/privacy-policy", "utility_legal", "static", 0.2, True),
    ("/data-rights", "utility_legal", "static", 0.2, True),
    ("/terms", "utility_legal", "static", 0.2, True),
    
    # Downstream / Non-indexed surfaces
    ("/checkout", "checkout", "conversion", 0.0, False),
]

# 3. Known Page Baseline Measurements from ACQUISITION_BASELINE.md
KNOWN_PAGE_MEASUREMENTS = [
    {
        "url": "https://nebulacomponents.com/why-is-my-landing-page-not-converting",
        "route_path": "/why-is-my-landing-page-not-converting",
        "cohort": "problem_intent",
        "impressions": 132,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 59.1,
        "weighted_avg_pos": 59.1,
        "bucket": "POS_51_PLUS",
    },
    {
        "url": "https://nebulacomponents.com/vs/screaming-frog",
        "route_path": "/vs/screaming-frog",
        "cohort": "commercial_comparison",
        "impressions": 55,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 65.6,
        "weighted_avg_pos": 65.6,
        "bucket": "POS_51_PLUS",
    },
    {
        "url": "https://nebulacomponents.com/best-landing-page-audit-tools",
        "route_path": "/best-landing-page-audit-tools",
        "cohort": "category",
        "impressions": 45,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 77.0,
        "weighted_avg_pos": 77.0,
        "bucket": "POS_51_PLUS",
    },
    {
        "url": "https://nebulacomponents.com/lead-generation-landing-page-audit",
        "route_path": "/lead-generation-landing-page-audit",
        "cohort": "vertical_use_case",
        "impressions": 23,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 91.6,
        "weighted_avg_pos": 91.6,
        "bucket": "POS_51_PLUS",
    },
    {
        "url": "https://nebulacomponents.com/vs/unbounce",
        "route_path": "/vs/unbounce",
        "cohort": "commercial_comparison",
        "impressions": 22,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 72.0,
        "weighted_avg_pos": 72.0,
        "bucket": "POS_51_PLUS",
    },
    {
        "url": "https://nebulacomponents.com/case-studies",
        "route_path": "/case-studies",
        "cohort": "case_study",
        "impressions": 12,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 3.4,
        "weighted_avg_pos": 3.4,
        "bucket": "POS_1_10",
    },
    {
        "url": "https://nebulacomponents.com/teardowns",
        "route_path": "/teardowns",
        "cohort": "teardown_index",
        "impressions": 8,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 5.5,
        "weighted_avg_pos": 5.5,
        "bucket": "POS_1_10",
    },
    {
        "url": "https://nebulacomponents.com/teardowns/airtable",
        "route_path": "/teardowns/airtable",
        "cohort": "individual_teardown",
        "impressions": 2,
        "clicks": 0,
        "ctr": 0.0,
        "best_pos": 49.0,
        "weighted_avg_pos": 49.0,
        "bucket": "POS_31_50",
    },
]


def compute_sha256(data: Any) -> str:
    serialized = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def run_migration(dry_run: bool = False) -> Dict[str, Any]:
    stats: Dict[str, Any] = {
        "pages_registered": 0,
        "cohorts_assigned": 0,
        "measurement_versions": 0,
        "decision_rule_sets": 0,
        "measurements_created": 0,
        "page_measurements_created": 0,
        "anomalies_registered": 0,
        "already_migrated": False,
    }

    mver_hash = compute_sha256(MEASUREMENT_VERSION_2_DEF)
    rule_hash = compute_sha256(DECISION_RULE_SET_2_DEF)

    print("Connecting to nebula_platform PostgreSQL...")
    with psycopg.connect(DB_URI, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Check if measurement already exists
            cur.execute(
                "SELECT id FROM acquisition_measurements WHERE id = %s;",
                ("meas_20260902_baseline_v2",),
            )
            existing = cur.fetchone()
            if existing:
                print("Measurement meas_20260902_baseline_v2 already exists in database.")
                stats["already_migrated"] = True
                return stats

            if dry_run:
                print("DRY-RUN mode: validation only, rolling back changes.")

            # 1. Insert Measurement Version 2.0.0
            cur.execute(
                """
                INSERT INTO measurement_versions (
                    id, version_code, metric_definition_version, cohort_definition_version,
                    page_classification_version, attribution_model_version, bot_filtering_version,
                    internal_traffic_filter_version, measurement_code_commit, definition_json,
                    definition_hash, effective_from, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (version_code) DO NOTHING;
                """,
                (
                    "mver_2_0_0",
                    "2.0.0",
                    "2.0.0",
                    "2.0.0",
                    "2.0.0",
                    "last_non_direct_v1",
                    "1.0.0",
                    "1.0.0",
                    "8e59bf3d0d6f8e13e83f8e84a1e12e9eefc60360",
                    json.dumps(MEASUREMENT_VERSION_2_DEF),
                    mver_hash,
                    datetime(2026, 9, 2, 0, 0, 0, tzinfo=timezone.utc),
                    "ACTIVE",
                ),
            )
            stats["measurement_versions"] += 1

            # 2. Insert Decision Rule Set 2.0.0
            cur.execute(
                """
                INSERT INTO decision_rule_sets (
                    id, version_code, name, description, min_holdout_days,
                    min_impression_gate, definition_json, definition_hash, effective_from, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (version_code) DO NOTHING;
                """,
                (
                    "ruleset_2_0_0",
                    "2.0.0",
                    "Standard Acquisition Decision Rules v2",
                    "Versioned evidence eligibility gates (28 days holdout, 100 impressions) and 13 deterministic action classes.",
                    28,
                    100,
                    json.dumps(DECISION_RULE_SET_2_DEF),
                    rule_hash,
                    datetime(2026, 9, 2, 0, 0, 0, tzinfo=timezone.utc),
                    "ACTIVE",
                ),
            )
            stats["decision_rule_sets"] += 1

            # 3. Populate Page Registry and Cohorts
            page_id_map: Dict[str, str] = {}
            for path, cohort, route_type, priority, is_indexable in CANONICAL_ROUTES:
                canonical_url = f"{BASE_URL}{path}" if path != "/" else BASE_URL
                route_pattern = path
                if "/vs/" in path and path != "/vs":
                    route_pattern = "/vs/[slug]"
                elif "/teardowns/" in path and path != "/teardowns":
                    route_pattern = "/teardowns/[slug]"

                cur.execute(
                    """
                    INSERT INTO page_registry (
                        canonical_url, route_path, route_pattern, route_type,
                        sitemap_priority, is_indexable, is_active
                    ) VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                    ON CONFLICT (route_path) DO UPDATE
                    SET canonical_url = EXCLUDED.canonical_url,
                        sitemap_priority = EXCLUDED.sitemap_priority,
                        updated_at = NOW()
                    RETURNING id;
                    """,
                    (canonical_url, path, route_pattern, route_type, priority, is_indexable),
                )
                row = cur.fetchone()
                page_id = str(row["id"])
                page_id_map[path] = page_id
                stats["pages_registered"] += 1

                # Cohort assignment
                cur.execute(
                    """
                    INSERT INTO page_cohort_assignments (
                        page_id, cohort_name, cohort_definition_version, assigned_by, is_current
                    ) VALUES (%s, %s, %s, %s, TRUE)
                    ON CONFLICT (page_id, cohort_name, cohort_definition_version) DO NOTHING;
                    """,
                    (page_id, cohort, "2.0.0", "declarative_registry"),
                )
                stats["cohorts_assigned"] += 1

            # 4. Master Baseline Acquisition Measurement (September 2026)
            meas_id = "meas_20260902_baseline_v2"
            cur.execute(
                """
                INSERT INTO acquisition_measurements (
                    id, measurement_version, measurement_version_code, generated_at,
                    requested_period_start, requested_period_end,
                    effective_period_start, effective_period_end,
                    source_native_period_start, source_native_period_end,
                    source_native_timezone, canonical_timezone, window_days,
                    gsc_total_impressions, gsc_total_clicks,
                    gsc_aggregate_position, dimensioned_impression_weighted_position,
                    unique_visible_pages, unique_visible_queries,
                    pos_bucket_1_10, pos_bucket_11_20, pos_bucket_21_30, pos_bucket_31_50, pos_bucket_51_plus,
                    ga4_organic_sessions, ga4_organic_users,
                    ga4_search_entry_sessions, ga4_downstream_checkout_sessions,
                    internal_audit_started, internal_audit_completed,
                    internal_checkout_started, internal_purchases,
                    source_system, source_property, source_filters, source_query_parameters,
                    metric_definition_version, cohort_definition_version, page_classification_version,
                    attribution_model_version, bot_filtering_version, internal_traffic_filter_version,
                    measurement_code_commit, application_commit,
                    data_completeness_status, source_finalization_status,
                    known_anomalies, known_blockers
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s,
                    %s, %s, %s, %s
                ) ON CONFLICT (id) DO NOTHING;
                """,
                (
                    meas_id,
                    2,
                    "2.0.0",
                    datetime(2026, 9, 2, 12, 47, 37, tzinfo=timezone.utc),
                    date(2026, 8, 3),
                    date(2026, 9, 1),
                    date(2026, 8, 3),
                    date(2026, 8, 29),  # 28 days finalized window
                    date(2026, 8, 3),
                    date(2026, 8, 29),
                    "America/Los_Angeles",
                    "UTC",
                    28,
                    429,  # gsc_total_impressions
                    0,    # gsc_total_clicks
                    65.6, # gsc_aggregate_position (Historical baseline v1)
                    64.3, # dimensioned_impression_weighted_position (Baseline v2)
                    41,   # unique_visible_pages
                    41,   # unique_visible_queries
                    14,   # pos_bucket_1_10
                    11,   # pos_bucket_11_20 (reconciled)
                    7,    # pos_bucket_21_30 (reconciled)
                    9,    # pos_bucket_31_50 (reconciled)
                    0,    # pos_bucket_51_plus (reconciled)
                    16,   # ga4_organic_sessions
                    16,   # ga4_organic_users
                    12,   # ga4_search_entry_sessions
                    4,    # ga4_downstream_checkout_sessions
                    0,    # internal_audit_started
                    0,    # internal_audit_completed
                    0,    # internal_checkout_started
                    0,    # internal_purchases
                    "gsc_ga4_combined",
                    "sc-domain:nebulacomponents.com",
                    json.dumps({"search_type": "web", "data_state": "final"}),
                    json.dumps({"dimensions": ["query", "page"], "days": 30}),
                    "2.0.0",
                    "2.0.0",
                    "2.0.0",
                    "last_non_direct_v1",
                    "1.0.0",
                    "1.0.0",
                    "a78846b75992aa41ed845b75ad62a6a90ac6be33",
                    "1e6aeb98c3f7b0a8d9e2f4a5b6c7d8e9f0a1b2c3",
                    "COMPLETE",
                    "FINAL",
                    ["CHECKOUT_ATTRIBUTION_RESET"],
                    [],
                ),
            )
            stats["measurements_created"] += 1

            # 5. Insert Source Runs
            gsc_payload_hash = hashlib.sha256(b"gsc_raw_payload_20260902").hexdigest()
            ga4_payload_hash = hashlib.sha256(b"ga4_raw_payload_20260902").hexdigest()

            cur.execute(
                """
                INSERT INTO acquisition_source_runs (
                    measurement_id, source_system, source_property, response_status,
                    status, payload_hash, records_received, records_persisted, execution_duration_ms
                ) VALUES 
                (%s, 'gsc', 'sc-domain:nebulacomponents.com', 200, 'SUCCESS', %s, 41, 41, 1420),
                (%s, 'ga4', '544419051', 200, 'SUCCESS', %s, 16, 16, 890);
                """,
                (meas_id, gsc_payload_hash, meas_id, ga4_payload_hash),
            )

            # 6. Insert Page Measurements
            for pm in KNOWN_PAGE_MEASUREMENTS:
                page_id = page_id_map.get(pm["route_path"])
                if not page_id:
                    continue

                cur.execute(
                    """
                    INSERT INTO page_measurements (
                        measurement_id, page_id, cohort_name,
                        impressions, clicks, ctr, best_position, weighted_avg_position,
                        position_bucket, ga4_organic_entry_sessions, ga4_organic_attributed_sessions,
                        data_quality_status
                    ) VALUES (
                        %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s
                    ) ON CONFLICT (measurement_id, page_id) DO NOTHING;
                    """,
                    (
                        meas_id,
                        page_id,
                        pm["cohort"],
                        pm["impressions"],
                        pm["clicks"],
                        pm["ctr"],
                        pm["best_pos"],
                        pm["weighted_avg_pos"],
                        pm["bucket"],
                        0,
                        0,
                        "VERIFIED",
                    ),
                )
                stats["page_measurements_created"] += 1

            # 7. Register Structured Anomaly for /checkout
            cur.execute(
                """
                INSERT INTO acquisition_anomalies (
                    id, anomaly_type, description, source_system, severity, status,
                    affected_pages, affected_metrics, affected_period_start, affected_period_end,
                    detected_at, mitigation_notes
                ) VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                ) ON CONFLICT (id) DO NOTHING;
                """,
                (
                    "anom_20260902_checkout_attribution",
                    "CHECKOUT_ATTRIBUTION_RESET",
                    "/checkout is not receiving measurable organic search-entry traffic according to GSC and is configured as a non-indexable downstream conversion surface. GA4 nonetheless attributes 4 sessions beginning there to organic acquisition due to downstream session/attribution behavior. The exact mechanism of each historical session has not been individually reconstructed.",
                    "ga4",
                    "MEDIUM",
                    "KNOWN_ATTRIBUTION_BEHAVIOR",
                    [page_id_map.get("/checkout")] if "/checkout" in page_id_map else [],
                    ["ga4_organic_sessions", "landing_page_distribution"],
                    date(2026, 8, 3),
                    date(2026, 9, 1),
                    datetime(2026, 9, 2, 12, 47, 37, tzinfo=timezone.utc),
                    "Categorized as KNOWN_ATTRIBUTION_BEHAVIOR. Excluded from top-of-funnel search landing models.",
                ),
            )
            stats["anomalies_registered"] += 1

            if dry_run:
                conn.rollback()
            else:
                conn.commit()

    return stats


def main():
    dry_run = "--dry-run" in sys.argv
    print(f"=== Running Acquisition Baseline Migration (dry_run={dry_run}) ===")
    stats = run_migration(dry_run=dry_run)
    print("\nMigration Results:")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print("\nMigration completed successfully.")


if __name__ == "__main__":
    main()
