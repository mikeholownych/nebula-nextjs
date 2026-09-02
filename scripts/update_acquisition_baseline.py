#!/usr/bin/env python3
"""
Automated Weekly Acquisition Measurement Updater.

Refactored in Phase 4 to operate against PostgreSQL nebula_platform
as the single canonical source of truth.

Pipeline:
1. Synchronizes canonical routes from route manifest to page_registry.
2. Ingests GSC dimensionless aggregate and dimensioned query/page data.
3. Ingests GA4 organic search traffic and classifies /checkout as KNOWN_ATTRIBUTION_BEHAVIOR.
4. Ingests conversion totals from analytics_event_ledger.
5. Normalizes and persists measurement envelope to acquisition_measurements.
6. Evaluates search visibility and product journey state transitions.
7. Generates ACQUISITION_BASELINE.md and reports/weekly_observations.md from PostgreSQL.
"""

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

ROOT_DIR = Path(__file__).resolve().parent.parent
BASELINE_FILE = ROOT_DIR / "ACQUISITION_BASELINE.md"
REPORTS_DIR = ROOT_DIR / "docs" / "acquisition" / "observations"


def main():
    print("=== Running Automated Acquisition Baseline Pipeline ===")
    
    # 1. Sync routes
    print("Step 1/5: Syncing route registry...")
    sync_routes_to_db()

    # 2. Ingest GSC
    print("Step 2/5: Fetching Google Search Console data (28 days)...")
    gsc_raw = fetch_gsc_data(days=28)

    # 3. Ingest GA4
    print("Step 3/5: Fetching GA4 organic traffic report (28 days)...")
    ga4_raw = fetch_ga4_data(days=28)

    # 4. Ingest Ledger
    print("Step 4/5: Querying internal event ledger...")
    today = datetime.now(timezone.utc).date()
    ledger_totals = fetch_internal_ledger_totals(today, today)

    # 5. Normalize & Persist
    print("Step 5/5: Normalizing and persisting measurement...")
    meas, gsc_rows, ga4_rows = normalize_measurement_envelope(gsc_raw, ga4_raw, ledger_totals, days=28)
    stats = persist_measurement(meas, gsc_rows, ga4_rows, gsc_raw, ga4_raw)
    
    print("\nPersistence Summary:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    # 6. Evaluate State Transitions
    transitions = evaluate_and_persist_state_transitions(meas.measurement_id)
    print(f"  State Transitions Evaluated: {len(transitions)}")

    # 7. Render & Update ACQUISITION_BASELINE.md from PostgreSQL
    baseline_content = render_baseline_report(meas.measurement_id)
    BASELINE_FILE.write_text(baseline_content, encoding="utf-8")
    print(f"\nUpdated {BASELINE_FILE} from PostgreSQL canonical record.")

    # 8. Render Weekly Observation Report
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    obs_file = REPORTS_DIR / f"{meas.measurement_id}_observation.md"
    obs_content = render_weekly_observation_report(meas.measurement_id)
    obs_file.write_text(obs_content, encoding="utf-8")
    print(f"Saved weekly observation report to {obs_file}")
    
    print("\nPipeline execution finished successfully.")


if __name__ == "__main__":
    main()
