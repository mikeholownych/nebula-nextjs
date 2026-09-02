#!/usr/bin/env python3
"""
Acquisition Learning System CLI & Operational Tooling.

Usage:
  python scripts/acquisition_cli.py run [--days 28] [--dry-run]
  python scripts/acquisition_cli.py sync-routes
  python scripts/acquisition_cli.py render-baseline [meas_id]
  python scripts/acquisition_cli.py render-weekly [current_id] [prev_id]
  python scripts/acquisition_cli.py validate-sources
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from acquisition.ingestion import (
    fetch_ga4_data,
    fetch_gsc_data,
    fetch_internal_ledger_totals,
    normalize_measurement_envelope,
    persist_measurement,
)
from acquisition.models import DEFAULT_DB_URI
from acquisition.reporting import render_baseline_report, render_weekly_observation_report
from acquisition.route_sync import sync_routes_to_db
from acquisition.state_engine import evaluate_and_persist_state_transitions


def cmd_sync_routes(args):
    print("=== Synchronizing Canonical Routes & Cohorts ===")
    stats = sync_routes_to_db(db_uri=args.db_uri)
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print("Route sync complete.")


def cmd_validate_sources(args):
    print("=== Validating External & Internal Data Sources ===")
    
    # 1. Database
    import psycopg
    try:
        with psycopg.connect(args.db_uri) as conn:
            print("  [OK] PostgreSQL (nebula_platform on port 5433): Connected")
    except Exception as e:
        print(f"  [FAIL] PostgreSQL: {e}")

    # 2. GSC
    try:
        gsc = fetch_gsc_data(days=7)
        imps = gsc.get("totals", {}).get("impressions", 0)
        print(f"  [OK] Google Search Console API: Connected (7d imps: {imps})")
    except Exception as e:
        print(f"  [FAIL] Google Search Console API: {e}")

    # 3. GA4
    try:
        ga4 = fetch_ga4_data(days=7)
        sess = ga4.get("totals", {}).get("sessions", 0)
        print(f"  [OK] GA4 Data API: Connected (7d sessions: {sess})")
    except Exception as e:
        print(f"  [FAIL] GA4 Data API: {e}")


def cmd_run_measurement(args):
    print(f"=== Running Acquisition Measurement Pipeline (days={args.days}, dry_run={args.dry_run}) ===")
    
    # 1. Ensure routes are synchronized
    print("Step 1/5: Synchronizing route registry...")
    sync_routes_to_db(db_uri=args.db_uri)

    # 2. Ingest GSC
    print("Step 2/5: Fetching Google Search Console data...")
    gsc_raw = fetch_gsc_data(days=args.days)

    # 3. Ingest GA4
    print("Step 3/5: Fetching GA4 organic traffic report...")
    ga4_raw = fetch_ga4_data(days=args.days)

    # 4. Ingest Internal Ledger
    print("Step 4/5: Querying platform analytics_event_ledger...")
    today = datetime.now(timezone.utc).date()
    ledger_totals = fetch_internal_ledger_totals(today, today, db_uri=args.db_uri)

    # 5. Normalize & Persist
    print("Step 5/5: Normalizing and persisting measurement envelope...")
    meas, gsc_rows, ga4_rows = normalize_measurement_envelope(gsc_raw, ga4_raw, ledger_totals, days=args.days)
    
    stats = persist_measurement(meas, gsc_rows, ga4_rows, gsc_raw, ga4_raw, db_uri=args.db_uri, dry_run=args.dry_run)
    print("\nPersistence Results:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    # 6. Evaluate State Transitions & Report
    if not args.dry_run:
        transitions = evaluate_and_persist_state_transitions(meas.measurement_id, db_uri=args.db_uri)
        print(f"  State Transitions Evaluated: {len(transitions)}")
        print("\n--- Weekly Observation Summary ---")
        report = render_weekly_observation_report(meas.measurement_id, db_uri=args.db_uri)
        print(report)
    else:
        print("\n[DRY RUN] Measurement normalized successfully. Database state untouched.")
        print(f"  Measurement ID: {meas.measurement_id}")
        print(f"  GSC Total Impressions: {meas.gsc_total_impressions}")
        print(f"  GSC Aggregate Position: {meas.gsc_aggregate_position:.1f}")
        print(f"  Dimensioned Weighted Position: {meas.dimensioned_impression_weighted_position:.1f}")
        print(f"  GA4 Organic Sessions: {meas.ga4_organic_sessions}")
        print(f"  GA4 Downstream Checkout Sessions: {meas.ga4_downstream_checkout_sessions}")


def cmd_render_baseline(args):
    meas_id = args.measurement_id or "meas_20260902_baseline_v2"
    output = render_baseline_report(meas_id, db_uri=args.db_uri)
    print(output)


def cmd_render_weekly(args):
    current_id = args.current_id
    prev_id = args.prev_id
    output = render_weekly_observation_report(current_id, prev_id, db_uri=args.db_uri)
    print(output)


def main():
    parser = argparse.ArgumentParser(description="Acquisition Learning System CLI")
    parser.add_argument("--db-uri", default=DEFAULT_DB_URI, help="PostgreSQL connection URI")
    
    subparsers = parser.add_subparsers(dest="command", required=True)

    # run
    p_run = subparsers.add_parser("run", help="Execute acquisition measurement pipeline")
    p_run.add_argument("--days", type=int, default=28, help="Observation window days (default: 28)")
    p_run.add_argument("--dry-run", action="store_true", help="Dry run without committing to DB")
    p_run.set_defaults(func=cmd_run_measurement)

    # sync-routes
    p_sync = subparsers.add_parser("sync-routes", help="Synchronize canonical page registry")
    p_sync.set_defaults(func=cmd_sync_routes)

    # validate-sources
    p_val = subparsers.add_parser("validate-sources", help="Validate external API and DB connectivity")
    p_val.set_defaults(func=cmd_validate_sources)

    # render-baseline
    p_base = subparsers.add_parser("render-baseline", help="Render baseline markdown from database")
    p_base.add_argument("measurement_id", nargs="?", default="meas_20260902_baseline_v2")
    p_base.set_defaults(func=cmd_render_baseline)

    # render-weekly
    p_week = subparsers.add_parser("render-weekly", help="Render weekly observation report")
    p_week.add_argument("current_id", help="Current measurement ID")
    p_week.add_argument("prev_id", nargs="?", default="meas_20260902_baseline_v2", help="Comparison measurement ID")
    p_week.set_defaults(func=cmd_render_weekly)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
