#!/usr/bin/env python3
"""
Canonical Acquisition Learning System CLI.

Supports:
- Pipeline execution (run)
- Route synchronization (sync-routes)
- Source validation (validate-sources)
- Baseline and Weekly report rendering
- Change registration, deployment, and rollback (change-*)
- Controlled experiment lifecycle and holdout checks (exp-*)
- Confounding detection (confound-check)
- Change log regeneration (changelog-sync)
"""

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys

from acquisition.experiments import (
    activate_experiment,
    approve_experiment,
    cancel_experiment,
    check_experiment_eligibility,
    create_experiment,
    detect_confounds,
    evaluate_experiment,
    generate_change_log_markdown,
    generate_experiment_report,
    list_changes,
    register_change,
    rollback_change,
)
from acquisition.ingestion import (
    calculate_canonical_window,
    fetch_ga4_data,
    fetch_gsc_data,
    fetch_internal_ledger_totals,
    normalize_measurement_envelope,
    persist_measurement,
    validate_source_health,
)
from acquisition.models import ACTOR_TYPES, CHANGE_TYPES, DEFAULT_DB_URI
from acquisition.reporting import render_baseline_report, render_weekly_observation_report
from acquisition.route_sync import sync_routes_to_db
from acquisition.state_engine import evaluate_and_persist_state_transitions


def cmd_sync_routes(args):
    print("=== Synchronizing Route Registry & Cohort Assignments ===")
    stats = sync_routes_to_db(db_uri=args.db_uri)
    print(f"Registry Synchronized: {stats['active_routes_synced']} routes mapped.")
    print(f"Cohort Assignments: {stats['cohorts_assigned']} active.")


def cmd_validate_sources(args):
    print("=== Validating External Ingestion Sources & Database ===")
    health = validate_source_health(db_uri=args.db_uri)
    print(json.dumps(health, indent=2))
    all_ok = all(v["status"] == "OK" for v in health.values())
    if not all_ok:
        sys.exit(1)


def cmd_run_measurement(args):
    print(f"=== Running Acquisition Measurement Pipeline (days={args.days}, dry_run={args.dry_run}) ===")
    
    # 1. Sync routes first
    print("Step 1/5: Synchronizing route registry...")
    sync_routes_to_db(db_uri=args.db_uri)

    # Calculate exact canonical date window
    if args.start_date and args.end_date:
        eff_start = datetime.strptime(args.start_date, "%Y-%m-%d").date()
        eff_end = datetime.strptime(args.end_date, "%Y-%m-%d").date()
    else:
        eff_start, eff_end = calculate_canonical_window(days=args.days)

    print(f"  Effective Finalized Window: {eff_start} to {eff_end} ({(eff_end - eff_start).days + 1} source days)")

    # 2. Ingest GSC
    print("Step 2/5: Fetching Google Search Console data...")
    gsc_raw = fetch_gsc_data(start_date=eff_start, end_date=eff_end, days=args.days)

    # 3. Ingest GA4
    print("Step 3/5: Fetching GA4 organic traffic report...")
    ga4_raw = fetch_ga4_data(start_date=eff_start, end_date=eff_end, days=args.days)

    # 4. Ingest Internal Ledger
    print("Step 4/5: Querying platform analytics_event_ledger...")
    ledger_totals = fetch_internal_ledger_totals(eff_start, eff_end, db_uri=args.db_uri)

    # 5. Normalize & Persist
    print("Step 5/5: Normalizing and persisting measurement envelope...")
    meas, gsc_rows, ga4_rows = normalize_measurement_envelope(
        gsc_raw, ga4_raw, ledger_totals, start_date=eff_start, end_date=eff_end, days=args.days, measurement_id_prefix=args.prefix
    )
    
    stats = persist_measurement(meas, gsc_rows, ga4_rows, gsc_raw, ga4_raw, db_uri=args.db_uri, dry_run=args.dry_run)
    print("\nPersistence Results:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    # 6. Evaluate State Transitions & Report
    if not args.dry_run:
        comparator = args.comparator_id
        transitions = evaluate_and_persist_state_transitions(meas.measurement_id, prev_meas_id=comparator, db_uri=args.db_uri)
        print(f"  State Transitions Evaluated: {len(transitions)}")
        print("\n--- Weekly Observation Summary ---")
        report = render_weekly_observation_report(meas.measurement_id, prev_meas_id=comparator, db_uri=args.db_uri)
        print(report)
    else:
        print("\n[DRY RUN] Measurement normalized successfully. Database state untouched.")
        print(f"  Measurement ID: {meas.measurement_id}")
        print(f"  GSC Total Impressions: {meas.gsc_total_impressions}")
        print(f"  GSC Aggregate Position: {meas.gsc_aggregate_position}")
        print(f"  GA4 Organic Sessions: {meas.ga4_organic_sessions}")


def cmd_render_baseline(args):
    meas_id = args.measurement_id or "meas_20260902_baseline_v2"
    output = render_baseline_report(meas_id, db_uri=args.db_uri)
    print(output)


def cmd_render_weekly(args):
    current_id = args.current_id
    prev_id = args.prev_id
    output = render_weekly_observation_report(current_id, prev_id, db_uri=args.db_uri)
    print(output)


# ---------------------------------------------------------------------------
# Change Management Commands
# ---------------------------------------------------------------------------

def cmd_change_register(args):
    pages = [p.strip() for p in args.pages.split(",") if p.strip()] if args.pages else []
    cohorts = [c.strip() for c in args.cohorts.split(",") if c.strip()] if args.cohorts else []

    chg = register_change(
        change_id=args.change_id,
        change_type=args.change_type,
        summary=args.summary,
        affected_page_urls=pages,
        affected_cohorts=cohorts,
        deployed_commit=args.commit,
        expected_impact=args.expected,
        actor_type=args.actor_type,
        execution_status=args.status,
        min_observation_days=args.min_days,
        logged_by=args.logged_by,
        db_uri=args.db_uri,
    )
    print(f"Change registered: {chg.id} ({chg.change_type}) - Status: {chg.execution_status}")


def cmd_change_rollback(args):
    chg = rollback_change(
        original_change_id=args.change_id,
        rollback_commit=args.commit,
        rollback_reason=args.reason,
        actor_type=args.actor_type,
        logged_by=args.logged_by,
        db_uri=args.db_uri,
    )
    print(f"Rollback registered: {chg.id} for {chg.rollback_change_id}")


def cmd_change_list(args):
    changes = list_changes(limit=args.limit, db_uri=args.db_uri)
    print(f"{'Date':<12} {'Change ID':<25} {'Type':<18} {'Status':<12} {'Summary'}")
    print("-" * 90)
    for c in changes:
        d_str = c.deployed_at.strftime("%Y-%m-%d")
        print(f"{d_str:<12} {c.id:<25} {c.change_type:<18} {c.execution_status:<12} {c.summary[:30]}")


def cmd_changelog_sync(args):
    content = generate_change_log_markdown(db_uri=args.db_uri)
    out_path = Path(args.output_path)
    out_path.write_text(content)
    print(f"Regenerated {out_path} from PostgreSQL acquisition_changes.")


# ---------------------------------------------------------------------------
# Experiment Commands
# ---------------------------------------------------------------------------

def cmd_exp_create(args):
    exp = create_experiment(
        experiment_id=args.exp_id,
        change_id=args.change_id,
        hypothesis_statement=args.hypothesis,
        target_metric=args.metric,
        expected_direction=args.direction,
        pre_change_measurement_id=args.pre_meas_id,
        expected_magnitude=args.magnitude,
        minimum_holdout_days=args.holdout_days,
        db_uri=args.db_uri,
    )
    print(f"Experiment created: {exp.id} (Status: {exp.approval_status})")
    print(f"  Target Metric: {exp.target_metric} ({exp.expected_direction}) | Baseline Value: {exp.pre_metric_value}")


def cmd_exp_approve(args):
    exp = approve_experiment(args.exp_id, approved_by=args.approved_by, db_uri=args.db_uri)
    print(f"Experiment approved: {exp.id} by {exp.approved_by}")


def cmd_exp_activate(args):
    exp = activate_experiment(args.exp_id, holdout_days=args.holdout_days, db_uri=args.db_uri)
    print(f"Experiment activated: {exp.id} (Status: {exp.approval_status})")
    print(f"  Effective Change Time: {exp.effective_change_at}")
    print(f"  Do Not Change Until:   {exp.do_not_change_until}")
    print(f"  Scheduled Evaluation:  {exp.scheduled_evaluation_at}")


def cmd_exp_check(args):
    res = check_experiment_eligibility(args.exp_id, post_measurement_id=args.post_meas_id, db_uri=args.db_uri)
    print(f"Eligibility for Experiment: {args.exp_id}")
    print(f"  Eligible: {res['is_eligible']} | Clean Window: {res['is_clean_window']}")
    print(f"  Wall-Clock Elapsed: {res['wall_clock_elapsed_days']}d / Required: {res['minimum_required_days']}d")
    print(f"  Finalized Days: {res['finalized_source_days']}d")
    if res["reasons"]:
        print("  Notes / Warnings:")
        for r in res["reasons"]:
            print(f"    - {r}")


def cmd_exp_eval(args):
    ev = evaluate_experiment(
        experiment_id=args.exp_id,
        post_measurement_id=args.post_meas_id,
        dry_run=args.dry_run,
        db_uri=args.db_uri,
    )
    pct_str = f"{ev.delta_percentage:+.1f}%" if ev.delta_percentage is not None else "N/A"
    print(f"Experiment Evaluation: {ev.experiment_id}")
    print(f"  Outcome: {ev.outcome} (Confidence: {ev.confidence_level})")
    print(f"  Metric Movement: {ev.pre_value:.1f} -> {ev.post_value:.1f} (Delta: {ev.delta_value:+.1f}, {pct_str})")
    print(f"  Confounding Level: {ev.confounding_level} | Clean Window: {ev.is_clean_window}")
    print(f"  Synthesis Notes: {ev.synthesis_notes}")


def cmd_exp_cancel(args):
    exp = cancel_experiment(args.exp_id, cancelled_by=args.cancelled_by, cancellation_reason=args.reason, db_uri=args.db_uri)
    print(f"Experiment cancelled: {exp.id} (Reason: {exp.cancellation_reason})")


def cmd_exp_report(args):
    report = generate_experiment_report(args.exp_id, db_uri=args.db_uri)
    if args.output_path:
        Path(args.output_path).write_text(report)
        print(f"Saved experiment report to {args.output_path}")
    else:
        print(report)


def cmd_confound_check(args):
    start = datetime.strptime(args.start_date, "%Y-%m-%d").date()
    end = datetime.strptime(args.end_date, "%Y-%m-%d").date()
    level, details = detect_confounds(args.exp_id, start, end, db_uri=args.db_uri)
    print(f"Confounding Level: {level}")
    print(json.dumps(details, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Acquisition Learning System CLI")
    parser.add_argument("--db-uri", default=DEFAULT_DB_URI, help="PostgreSQL connection URI")
    
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 1. Pipeline & Ingestion
    p_run = subparsers.add_parser("run", help="Execute acquisition measurement pipeline")
    p_run.add_argument("--days", type=int, default=28, help="Observation window days (default: 28)")
    p_run.add_argument("--start-date", help="Explicit start date (YYYY-MM-DD)")
    p_run.add_argument("--end-date", help="Explicit end date (YYYY-MM-DD)")
    p_run.add_argument("--prefix", default="canonical", help="Measurement ID prefix (default: canonical)")
    p_run.add_argument("--comparator-id", help="Previous comparison measurement ID")
    p_run.add_argument("--dry-run", action="store_true", help="Dry run without committing to DB")
    p_run.set_defaults(func=cmd_run_measurement)

    p_sync = subparsers.add_parser("sync-routes", help="Synchronize canonical page registry")
    p_sync.set_defaults(func=cmd_sync_routes)

    p_val = subparsers.add_parser("validate-sources", help="Validate external API and DB connectivity")
    p_val.set_defaults(func=cmd_validate_sources)

    p_base = subparsers.add_parser("render-baseline", help="Render baseline markdown from database")
    p_base.add_argument("measurement_id", nargs="?", default="meas_20260902_baseline_v2")
    p_base.set_defaults(func=cmd_render_baseline)

    p_week = subparsers.add_parser("render-weekly", help="Render weekly observation report")
    p_week.add_argument("current_id", help="Current measurement ID")
    p_week.add_argument("prev_id", nargs="?", default=None, help="Comparison measurement ID")
    p_week.set_defaults(func=cmd_render_weekly)

    # 2. Change Management
    p_chg_reg = subparsers.add_parser("change-register", help="Register a canonical site acquisition change")
    p_chg_reg.add_argument("--change-id", required=True, help="Unique change ID (e.g. chg_20260902_001)")
    p_chg_reg.add_argument("--change-type", required=True, choices=list(models.CHANGE_TYPES) if 'models' in globals() else None)
    p_chg_reg.add_argument("--summary", required=True, help="Change description")
    p_chg_reg.add_argument("--pages", default="", help="Comma-separated URLs or paths")
    p_chg_reg.add_argument("--cohorts", default="", help="Comma-separated cohort names")
    p_chg_reg.add_argument("--commit", required=True, help="Git commit SHA")
    p_chg_reg.add_argument("--expected", default="neutral", choices=["positive", "neutral", "investigative", "defensive"])
    p_chg_reg.add_argument("--actor-type", default="SYSTEM", choices=["HUMAN", "TERMINAL_AGENT", "AUTOMATION", "SYSTEM"])
    p_chg_reg.add_argument("--status", default="DEPLOYED", choices=["PLANNED", "DEPLOYED", "ROLLED_BACK", "CANCELLED"])
    p_chg_reg.add_argument("--min-days", type=int, default=28)
    p_chg_reg.add_argument("--logged-by", default="system")
    p_chg_reg.set_defaults(func=cmd_change_register)

    p_chg_rb = subparsers.add_parser("change-rollback", help="Register a rollback for a previous change")
    p_chg_rb.add_argument("--change-id", required=True, help="Original change ID to rollback")
    p_chg_rb.add_argument("--commit", required=True, help="Rollback git commit SHA")
    p_chg_rb.add_argument("--reason", required=True, help="Rollback reason")
    p_chg_rb.add_argument("--actor-type", default="SYSTEM")
    p_chg_rb.add_argument("--logged-by", default="system")
    p_chg_rb.set_defaults(func=cmd_change_rollback)

    p_chg_list = subparsers.add_parser("change-list", help="List recent site changes")
    p_chg_list.add_argument("--limit", type=int, default=30)
    p_chg_list.set_defaults(func=cmd_change_list)

    p_chg_sync = subparsers.add_parser("changelog-sync", help="Regenerate CHANGE_LOG.md from PostgreSQL")
    p_chg_sync.add_argument("--output-path", default="CHANGE_LOG.md")
    p_chg_sync.set_defaults(func=cmd_changelog_sync)

    # 3. Experiment Commands
    p_exp_create = subparsers.add_parser("exp-create", help="Create a controlled acquisition experiment")
    p_exp_create.add_argument("--exp-id", required=True, help="Unique experiment ID (e.g. exp_20260902_teardowns_links)")
    p_exp_create.add_argument("--change-id", required=True, help="Associated change ID")
    p_exp_create.add_argument("--hypothesis", required=True, help="Pre-registered immutable hypothesis statement")
    p_exp_create.add_argument("--metric", required=True, help="Target metric name (e.g. gsc_total_impressions)")
    p_exp_create.add_argument("--direction", required=True, choices=["INCREASE", "DECREASE", "MAINTAIN"])
    p_exp_create.add_argument("--pre-meas-id", required=True, help="Pre-change baseline measurement ID")
    p_exp_create.add_argument("--magnitude", type=float, default=None, help="Expected numerical magnitude if known")
    p_exp_create.add_argument("--holdout-days", type=int, default=28)
    p_exp_create.set_defaults(func=cmd_exp_create)

    p_exp_app = subparsers.add_parser("exp-approve", help="Approve an experiment")
    p_exp_app.add_argument("--exp-id", required=True)
    p_exp_app.add_argument("--approved-by", required=True, help="Reviewer or operator identity")
    p_exp_app.set_defaults(func=cmd_exp_approve)

    p_exp_act = subparsers.add_parser("exp-activate", help="Activate holdout observation for an approved experiment")
    p_exp_act.add_argument("--exp-id", required=True)
    p_exp_act.add_argument("--holdout-days", type=int, default=28)
    p_exp_act.set_defaults(func=cmd_exp_activate)

    p_exp_chk = subparsers.add_parser("exp-check", help="Check experiment holdout & source eligibility")
    p_exp_chk.add_argument("--exp-id", required=True)
    p_exp_chk.add_argument("--post-meas-id", help="Post-change measurement ID to validate")
    p_exp_chk.set_defaults(func=cmd_exp_check)

    p_exp_eval = subparsers.add_parser("exp-eval", help="Evaluate experiment outcomes against pre-registered hypothesis")
    p_exp_eval.add_argument("--exp-id", required=True)
    p_exp_eval.add_argument("--post-meas-id", required=True, help="Post-change measurement ID")
    p_exp_eval.add_argument("--dry-run", action="store_true")
    p_exp_eval.set_defaults(func=cmd_exp_eval)

    p_exp_can = subparsers.add_parser("exp-cancel", help="Cancel an experiment")
    p_exp_can.add_argument("--exp-id", required=True)
    p_exp_can.add_argument("--cancelled-by", required=True)
    p_exp_can.add_argument("--reason", required=True)
    p_exp_can.set_defaults(func=cmd_exp_cancel)

    p_exp_rep = subparsers.add_parser("exp-report", help="Generate experiment audit report")
    p_exp_rep.add_argument("--exp-id", required=True)
    p_exp_rep.add_argument("--output-path", help="Optional markdown output file path")
    p_exp_rep.set_defaults(func=cmd_exp_report)

    p_conf = subparsers.add_parser("confound-check", help="Inspect confounding interventions during a window")
    p_conf.add_argument("--exp-id", required=True)
    p_conf.add_argument("--start-date", required=True, help="YYYY-MM-DD")
    p_conf.add_argument("--end-date", required=True, help="YYYY-MM-DD")
    p_conf.set_defaults(func=cmd_confound_check)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
