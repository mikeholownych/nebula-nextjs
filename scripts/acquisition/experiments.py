"""Acquisition Controlled Experiments, Change Provenance & Decision Review Engine."""

from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
import uuid
import psycopg
from psycopg.rows import dict_row

from .models import (
    ACTOR_TYPES,
    CHANGE_TYPES,
    CONFOUNDING_LEVELS,
    DEFAULT_DB_URI,
    EVALUATION_OUTCOMES,
    EXPERIMENT_STATUSES,
    ChangeRecord,
    EvaluationRecord,
    ExperimentRecord,
)
from .window_computation import calculate_period_overlap, classify_comparison_type


# ---------------------------------------------------------------------------
# 1. Change Management & Provenance
# ---------------------------------------------------------------------------

def register_change(
    change_id: str,
    change_type: str,
    summary: str,
    affected_page_urls: List[str],
    affected_cohorts: List[str],
    deployed_commit: str,
    expected_impact: str = "neutral",
    actor_type: str = "SYSTEM",
    execution_status: str = "DEPLOYED",
    deployed_at: Optional[datetime] = None,
    pre_change_measurement_id: Optional[str] = None,
    min_observation_days: int = 28,
    logged_by: str = "system",
    environment: str = "PRODUCTION",
    evidence_origin: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> ChangeRecord:
    """Register a material acquisition change in canonical PostgreSQL storage."""
    if change_type not in CHANGE_TYPES:
        raise ValueError(f"Invalid change_type '{change_type}'. Allowed: {CHANGE_TYPES}")
    if actor_type not in ACTOR_TYPES:
        raise ValueError(f"Invalid actor_type '{actor_type}'. Allowed: {ACTOR_TYPES}")
    if execution_status not in ["PLANNED", "DEPLOYED", "ROLLED_BACK", "CANCELLED"]:
        raise ValueError(f"Invalid execution_status '{execution_status}'")
    if expected_impact not in ["positive", "neutral", "investigative", "defensive"]:
        raise ValueError(f"Invalid expected_impact '{expected_impact}'")
    if environment not in ["PRODUCTION", "TEST", "SIMULATION", "REPLAY", "SYNTHETIC"]:
        raise ValueError(f"Invalid environment '{environment}'")
    if evidence_origin not in ["PRODUCTION", "SYNTHETIC", "REPLAY", "SIMULATION", "TEST"]:
        raise ValueError(f"Invalid evidence_origin '{evidence_origin}'")

    dep_at = deployed_at or datetime.now(timezone.utc)
    eval_due = (dep_at + timedelta(days=min_observation_days)).date()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Resolve affected URLs to page UUIDs
            page_ids: List[str] = []
            for url in affected_page_urls:
                cur.execute("SELECT id FROM page_registry WHERE canonical_url = %s OR route_path = %s LIMIT 1;", (url, url))
                row = cur.fetchone()
                if row:
                    page_ids.append(str(row["id"]))

            cur.execute(
                """
                INSERT INTO acquisition_changes (
                    id, change_type, summary, affected_page_ids, affected_cohorts,
                    deployed_commit, deployed_at, expected_impact, actor_type, execution_status,
                    pre_change_measurement_id, min_observation_days, evaluation_due_date, logged_by,
                    environment, evidence_origin
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    summary = EXCLUDED.summary,
                    execution_status = EXCLUDED.execution_status,
                    deployed_commit = EXCLUDED.deployed_commit,
                    environment = EXCLUDED.environment,
                    evidence_origin = EXCLUDED.evidence_origin
                RETURNING *;
                """,
                (
                    change_id,
                    change_type,
                    summary,
                    page_ids,
                    affected_cohorts,
                    deployed_commit,
                    dep_at,
                    expected_impact,
                    actor_type,
                    execution_status,
                    pre_change_measurement_id,
                    min_observation_days,
                    eval_due,
                    logged_by,
                    environment,
                    evidence_origin,
                ),
            )
            r = cur.fetchone()
            conn.commit()

            return ChangeRecord(
                id=r["id"],
                change_type=r["change_type"],
                summary=r["summary"],
                affected_page_ids=[str(p) for p in r["affected_page_ids"]],
                affected_cohorts=r["affected_cohorts"],
                deployed_commit=r["deployed_commit"],
                deployed_at=r["deployed_at"],
                expected_impact=r["expected_impact"],
                actor_type=r["actor_type"],
                execution_status=r["execution_status"],
                pre_change_measurement_id=r["pre_change_measurement_id"],
                min_observation_days=r["min_observation_days"],
                evaluation_due_date=r["evaluation_due_date"],
                logged_by=r["logged_by"],
                environment=r["environment"],
                evidence_origin=r["evidence_origin"],
            )


def rollback_change(
    original_change_id: str,
    rollback_commit: str,
    rollback_reason: str,
    actor_type: str = "SYSTEM",
    logged_by: str = "system",
    db_uri: str = DEFAULT_DB_URI,
) -> ChangeRecord:
    """Register a rollback of a previous change, creating a rollback change record."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_changes WHERE id = %s;", (original_change_id,))
            orig = cur.fetchone()
            if not orig:
                raise ValueError(f"Original change '{original_change_id}' not found.")

            now = datetime.now(timezone.utc)
            rollback_id = f"rb_{original_change_id}_{now.strftime('%Y%m%d%H%M')}"

            # Create rollback change record
            cur.execute(
                """
                INSERT INTO acquisition_changes (
                    id, change_type, summary, affected_page_ids, affected_cohorts,
                    deployed_commit, deployed_at, expected_impact, actor_type, execution_status,
                    pre_change_measurement_id, min_observation_days, evaluation_due_date, logged_by,
                    rollback_change_id, rollback_reason, rollback_at, environment, evidence_origin
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, 'defensive', %s, 'DEPLOYED',
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                ) RETURNING *;
                """,
                (
                    rollback_id,
                    orig["change_type"],
                    f"Rollback of {original_change_id}: {rollback_reason}",
                    orig["affected_page_ids"],
                    orig["affected_cohorts"],
                    rollback_commit,
                    now,
                    actor_type,
                    orig["pre_change_measurement_id"],
                    orig["min_observation_days"],
                    (now + timedelta(days=orig["min_observation_days"])).date(),
                    logged_by,
                    original_change_id,
                    rollback_reason,
                    now,
                    orig.get("environment", "PRODUCTION"),
                    orig.get("evidence_origin", "PRODUCTION"),
                ),
            )
            rb_row = cur.fetchone()

            # Mark original change as ROLLED_BACK
            cur.execute(
                """
                UPDATE acquisition_changes
                SET execution_status = 'ROLLED_BACK',
                    rollback_change_id = %s,
                    rollback_reason = %s,
                    rollback_at = %s
                WHERE id = %s;
                """,
                (rollback_id, rollback_reason, now, original_change_id),
            )
            conn.commit()

            return ChangeRecord(
                id=rb_row["id"],
                change_type=rb_row["change_type"],
                summary=rb_row["summary"],
                affected_page_ids=[str(p) for p in rb_row["affected_page_ids"]],
                affected_cohorts=rb_row["affected_cohorts"],
                deployed_commit=rb_row["deployed_commit"],
                deployed_at=rb_row["deployed_at"],
                expected_impact=rb_row["expected_impact"],
                actor_type=rb_row["actor_type"],
                execution_status=rb_row["execution_status"],
                rollback_change_id=original_change_id,
                rollback_reason=rollback_reason,
                rollback_at=now,
                environment=rb_row["environment"],
                evidence_origin=rb_row["evidence_origin"],
            )


def list_changes(limit: int = 50, db_uri: str = DEFAULT_DB_URI) -> List[ChangeRecord]:
    """List recent acquisition changes."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM acquisition_changes ORDER BY deployed_at DESC LIMIT %s;",
                (limit,),
            )
            rows = cur.fetchall()
            return [
                ChangeRecord(
                    id=r["id"],
                    change_type=r["change_type"],
                    summary=r["summary"],
                    affected_page_ids=[str(p) for p in r["affected_page_ids"]],
                    affected_cohorts=r["affected_cohorts"],
                    deployed_commit=r["deployed_commit"],
                    deployed_at=r["deployed_at"],
                    expected_impact=r["expected_impact"],
                    actor_type=r["actor_type"],
                    execution_status=r["execution_status"],
                    pre_change_measurement_id=r["pre_change_measurement_id"],
                    min_observation_days=r["min_observation_days"],
                    evaluation_due_date=r["evaluation_due_date"],
                    logged_by=r["logged_by"],
                    rollback_change_id=r["rollback_change_id"],
                    rollback_reason=r["rollback_reason"],
                    rollback_at=r["rollback_at"],
                )
                for r in rows
            ]


# ---------------------------------------------------------------------------
# 2. Experiment Registration, Approval & Lifecycle
# ---------------------------------------------------------------------------

def create_experiment(
    experiment_id: str,
    change_id: str,
    hypothesis_statement: str,
    target_metric: str,
    expected_direction: str,
    pre_change_measurement_id: str,
    expected_magnitude: Optional[float] = None,
    decision_rule_set_id: str = "ruleset_2_0_0",
    measurement_version_id: str = "mver_2_0_0",
    minimum_holdout_days: int = 28,
    environment: str = "PRODUCTION",
    evidence_origin: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> ExperimentRecord:
    """Register a formal controlled experiment with an immutable hypothesis."""
    if expected_direction not in ["INCREASE", "DECREASE", "MAINTAIN"]:
        raise ValueError(f"Invalid expected_direction '{expected_direction}'")
    if environment not in ["PRODUCTION", "TEST", "SIMULATION", "REPLAY", "SYNTHETIC"]:
        raise ValueError(f"Invalid environment '{environment}'")
    if evidence_origin not in ["PRODUCTION", "SYNTHETIC", "REPLAY", "SIMULATION", "TEST"]:
        raise ValueError(f"Invalid evidence_origin '{evidence_origin}'")

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Verify change exists
            cur.execute("SELECT * FROM acquisition_changes WHERE id = %s;", (change_id,))
            chg = cur.fetchone()
            if not chg:
                raise ValueError(f"Associated change '{change_id}' not found.")

            # 2. Verify pre-change measurement exists and extract pre_metric_value
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (pre_change_measurement_id,))
            meas = cur.fetchone()
            if not meas:
                raise ValueError(f"Pre-change measurement '{pre_change_measurement_id}' not found.")
            if meas["data_completeness_status"] not in ["COMPLETE", "PARTIAL"]:
                raise ValueError(f"Pre-change measurement has invalid completeness: {meas['data_completeness_status']}")

            # Extract baseline metric value
            if target_metric not in meas:
                raise ValueError(f"Target metric '{target_metric}' not found in acquisition_measurements table.")
            raw_pre_val = meas[target_metric]
            pre_val = float(raw_pre_val) if raw_pre_val is not None else 0.0

            cur.execute(
                """
                INSERT INTO acquisition_experiments (
                    id, change_id, hypothesis_statement, target_metric, expected_direction,
                    expected_magnitude, pre_metric_value, pre_change_measurement_id,
                    decision_rule_set_id, measurement_version_id, approval_status,
                    started_at, scheduled_evaluation_at, environment, evidence_origin
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, 'DRAFT',
                    now(), now() + (%s || ' days')::interval, %s, %s
                ) RETURNING *;
                """,
                (
                    experiment_id,
                    change_id,
                    hypothesis_statement,
                    target_metric,
                    expected_direction,
                    expected_magnitude,
                    pre_val,
                    pre_change_measurement_id,
                    decision_rule_set_id,
                    measurement_version_id,
                    minimum_holdout_days,
                    environment,
                    evidence_origin,
                ),
            )
            r = cur.fetchone()
            conn.commit()

            return ExperimentRecord(
                id=r["id"],
                change_id=r["change_id"],
                hypothesis_statement=r["hypothesis_statement"],
                target_metric=r["target_metric"],
                expected_direction=r["expected_direction"],
                expected_magnitude=float(r["expected_magnitude"]) if r["expected_magnitude"] is not None else None,
                pre_metric_value=float(r["pre_metric_value"]),
                pre_change_measurement_id=r["pre_change_measurement_id"],
                decision_rule_set_id=r["decision_rule_set_id"],
                measurement_version_id=r["measurement_version_id"],
                approval_status=r["approval_status"],
                started_at=r["started_at"],
                scheduled_evaluation_at=r["scheduled_evaluation_at"],
                minimum_holdout_days=minimum_holdout_days,
                environment=r["environment"],
                evidence_origin=r["evidence_origin"],
            )


def approve_experiment(
    experiment_id: str,
    approved_by: str,
    db_uri: str = DEFAULT_DB_URI,
) -> ExperimentRecord:
    """Approve an experiment, enabling holdout activation."""
    if not approved_by:
        raise ValueError("approved_by is required for experiment approval.")

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_experiments WHERE id = %s;", (experiment_id,))
            exp = cur.fetchone()
            if not exp:
                raise ValueError(f"Experiment '{experiment_id}' not found.")
            if exp["approval_status"] not in ["DRAFT", "PENDING_APPROVAL"]:
                raise ValueError(f"Cannot approve experiment with status '{exp['approval_status']}'.")

            cur.execute(
                """
                UPDATE acquisition_experiments
                SET approval_status = 'APPROVED',
                    approved_by = %s,
                    started_at = now()
                WHERE id = %s
                RETURNING *;
                """,
                (approved_by, experiment_id),
            )
            r = cur.fetchone()
            conn.commit()

            return ExperimentRecord(
                id=r["id"],
                change_id=r["change_id"],
                hypothesis_statement=r["hypothesis_statement"],
                target_metric=r["target_metric"],
                expected_direction=r["expected_direction"],
                pre_metric_value=float(r["pre_metric_value"]),
                pre_change_measurement_id=r["pre_change_measurement_id"],
                approval_status=r["approval_status"],
                approved_by=r["approved_by"],
                started_at=r["started_at"],
                scheduled_evaluation_at=r["scheduled_evaluation_at"],
            )


def activate_experiment(
    experiment_id: str,
    effective_change_at: Optional[datetime] = None,
    holdout_days: int = 28,
    db_uri: str = DEFAULT_DB_URI,
) -> ExperimentRecord:
    """Activate an approved experiment, locking holdout observation dates."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_experiments WHERE id = %s;", (experiment_id,))
            exp = cur.fetchone()
            if not exp:
                raise ValueError(f"Experiment '{experiment_id}' not found.")
            if exp["approval_status"] != "APPROVED":
                raise ValueError(f"Cannot activate experiment with approval_status '{exp['approval_status']}'. Must be APPROVED.")

            cur.execute("SELECT * FROM acquisition_changes WHERE id = %s;", (exp["change_id"],))
            chg = cur.fetchone()
            if not chg or chg["execution_status"] != "DEPLOYED":
                raise ValueError(f"Associated change '{exp['change_id']}' is not DEPLOYED.")

            eff_time = effective_change_at or chg["deployed_at"]
            do_not_change = eff_time + timedelta(days=holdout_days)
            sched_eval = do_not_change + timedelta(days=3)  # GSC 3-day holdback lag

            cur.execute(
                """
                UPDATE acquisition_experiments
                SET approval_status = 'HOLDOUT',
                    effective_change_at = %s,
                    do_not_change_until = %s,
                    scheduled_evaluation_at = %s
                WHERE id = %s
                RETURNING *;
                """,
                (eff_time, do_not_change, sched_eval, experiment_id),
            )
            r = cur.fetchone()
            conn.commit()

            return ExperimentRecord(
                id=r["id"],
                change_id=r["change_id"],
                hypothesis_statement=r["hypothesis_statement"],
                target_metric=r["target_metric"],
                expected_direction=r["expected_direction"],
                pre_metric_value=float(r["pre_metric_value"]),
                pre_change_measurement_id=r["pre_change_measurement_id"],
                approval_status=r["approval_status"],
                approved_by=r["approved_by"],
                started_at=r["started_at"],
                effective_change_at=r["effective_change_at"],
                do_not_change_until=r["do_not_change_until"],
                scheduled_evaluation_at=r["scheduled_evaluation_at"],
            )


def cancel_experiment(
    experiment_id: str,
    cancelled_by: str,
    cancellation_reason: str,
    db_uri: str = DEFAULT_DB_URI,
) -> ExperimentRecord:
    """Cancel an experiment without destroying historical evidence."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_experiments WHERE id = %s;", (experiment_id,))
            exp = cur.fetchone()
            if not exp:
                raise ValueError(f"Experiment '{experiment_id}' not found.")

            now = datetime.now(timezone.utc)
            cur.execute(
                """
                UPDATE acquisition_experiments
                SET approval_status = 'CANCELLED',
                    cancelled_at = %s,
                    cancelled_by = %s,
                    cancellation_reason = %s
                WHERE id = %s
                RETURNING *;
                """,
                (now, cancelled_by, cancellation_reason, experiment_id),
            )
            r = cur.fetchone()
            conn.commit()

            return ExperimentRecord(
                id=r["id"],
                change_id=r["change_id"],
                hypothesis_statement=r["hypothesis_statement"],
                target_metric=r["target_metric"],
                expected_direction=r["expected_direction"],
                pre_metric_value=float(r["pre_metric_value"]),
                pre_change_measurement_id=r["pre_change_measurement_id"],
                approval_status=r["approval_status"],
                cancelled_at=r["cancelled_at"],
                cancelled_by=r["cancelled_by"],
                cancellation_reason=r["cancellation_reason"],
            )


# ---------------------------------------------------------------------------
# 3. Confounding Detection Engine
# ---------------------------------------------------------------------------

def detect_confounds(
    experiment_id: str,
    target_window_start: date,
    target_window_end: date,
    db_uri: str = DEFAULT_DB_URI,
) -> Tuple[str, Dict[str, Any]]:
    """
    Detect material confounding changes deployed during an active experiment window.
    
    Returns:
    - confounding_level: 'NONE', 'LOW', 'MATERIAL', 'CRITICAL'
    - confounding_details: Dict of overlapping changes and overlap rationale.
    """
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_experiments WHERE id = %s;", (experiment_id,))
            exp = cur.fetchone()
            if not exp:
                raise ValueError(f"Experiment '{experiment_id}' not found.")

            cur.execute("SELECT * FROM acquisition_changes WHERE id = %s;", (exp["change_id"],))
            exp_chg = cur.fetchone()
            exp_pages = set(str(p) for p in (exp_chg["affected_page_ids"] if exp_chg else []))
            exp_cohorts = set(exp_chg["affected_cohorts"] if exp_chg else [])

            # Find all other changes deployed during the observation window
            cur.execute(
                """
                SELECT * FROM acquisition_changes
                WHERE id != %s
                  AND deployed_at >= %s
                  AND deployed_at <= (%s::date + interval '1 day')
                ORDER BY deployed_at ASC;
                """,
                (exp["change_id"], target_window_start, target_window_end),
            )
            overlapping_changes = cur.fetchall()

            confounds: List[Dict[str, Any]] = []
            max_level = "NONE"

            for c in overlapping_changes:
                c_pages = set(str(p) for p in c["affected_page_ids"])
                c_cohorts = set(c["affected_cohorts"])

                page_overlap = list(exp_pages.intersection(c_pages))
                cohort_overlap = list(exp_cohorts.intersection(c_cohorts))

                if c["execution_status"] == "ROLLED_BACK" and (page_overlap or c["rollback_change_id"] == exp["change_id"]):
                    level = "CRITICAL"
                    reason = f"Emergency rollback occurred affecting target pages: {c['summary']}"
                elif page_overlap:
                    level = "MATERIAL"
                    reason = f"Overlapping change directly modified {len(page_overlap)} target page(s): {c['summary']}"
                elif cohort_overlap and c["change_type"] in ["INTERNAL_LINKING", "NAVIGATION", "SITEWIDE"]:
                    level = "MATERIAL"
                    reason = f"Sitewide/structural change affected target cohort {cohort_overlap}: {c['summary']}"
                elif cohort_overlap:
                    level = "LOW"
                    reason = f"Non-structural change within same cohort {cohort_overlap}: {c['summary']}"
                else:
                    level = "NONE"
                    reason = "Unrelated page/cohort change."

                if level != "NONE":
                    confounds.append({
                        "change_id": c["id"],
                        "change_type": c["change_type"],
                        "deployed_at": c["deployed_at"].isoformat(),
                        "level": level,
                        "reason": reason,
                        "page_overlap_count": len(page_overlap),
                        "cohort_overlap": cohort_overlap,
                    })

                    # Escalate max_level
                    if level == "CRITICAL":
                        max_level = "CRITICAL"
                    elif level == "MATERIAL" and max_level != "CRITICAL":
                        max_level = "MATERIAL"
                    elif level == "LOW" and max_level not in ["CRITICAL", "MATERIAL"]:
                        max_level = "LOW"

            return max_level, {"total_overlapping_changes": len(overlapping_changes), "detected_confounds": confounds}


# ---------------------------------------------------------------------------
# 4. Eligibility & Evaluation Engine
# ---------------------------------------------------------------------------

def check_experiment_eligibility(
    experiment_id: str,
    post_measurement_id: Optional[str] = None,
    db_uri: str = DEFAULT_DB_URI,
) -> Dict[str, Any]:
    """
    Validate whether an experiment has reached complete holdout and source finalization.
    
    Checks:
    1. Approval & execution state.
    2. Wall-clock duration >= minimum_holdout_days.
    3. Post-measurement finalization and source date count.
    4. Post-measurement start >= effective_change_at (window purity / contamination check).
    """
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_experiments WHERE id = %s;", (experiment_id,))
            exp = cur.fetchone()
            if not exp:
                raise ValueError(f"Experiment '{experiment_id}' not found.")

            cur.execute("SELECT * FROM acquisition_changes WHERE id = %s;", (exp["change_id"],))
            chg = cur.fetchone()

            reasons: List[str] = []
            is_eligible = True
            is_clean_window = True

            # 1. State check
            if exp["approval_status"] not in ["APPROVED", "RUNNING", "HOLDOUT", "ELIGIBLE_FOR_EVALUATION"]:
                is_eligible = False
                reasons.append(f"Invalid approval_status '{exp['approval_status']}'. Must be APPROVED or HOLDOUT.")

            if not chg or chg["execution_status"] != "DEPLOYED":
                is_eligible = False
                reasons.append("Associated change is not DEPLOYED.")

            eff_at = exp["effective_change_at"] or (chg["deployed_at"] if chg else datetime.now(timezone.utc))
            now = datetime.now(timezone.utc)
            wall_clock_days = (now - eff_at).days

            min_days = chg["min_observation_days"] if chg else 28
            if wall_clock_days < min_days:
                is_eligible = False
                reasons.append(f"Wall-clock elapsed days ({wall_clock_days}d) below minimum holdout ({min_days}d).")

            finalized_days = 0
            if post_measurement_id:
                cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (post_measurement_id,))
                p_meas = cur.fetchone()
                if not p_meas:
                    is_eligible = False
                    reasons.append(f"Post-measurement '{post_measurement_id}' not found.")
                else:
                    finalized_days = (p_meas["effective_period_end"] - p_meas["effective_period_start"]).days + 1
                    if finalized_days < min_days:
                        is_eligible = False
                        reasons.append(f"Post-measurement finalized days ({finalized_days}d) below required {min_days}d.")
                    if p_meas["source_finalization_status"] != "FINAL":
                        is_eligible = False
                        reasons.append(f"Post-measurement finalization is '{p_meas['source_finalization_status']}', must be FINAL.")

                    # Window contamination check: post window start must not precede change time
                    if p_meas["effective_period_start"] < eff_at.date():
                        is_clean_window = False
                        reasons.append(
                            f"Post-measurement start ({p_meas['effective_period_start']}) precedes deployment ({eff_at.date()}). "
                            f"Window contains pre-change data (Contaminated Window)."
                        )

            return {
                "experiment_id": experiment_id,
                "is_eligible": is_eligible and is_clean_window,
                "is_clean_window": is_clean_window,
                "wall_clock_elapsed_days": wall_clock_days,
                "finalized_source_days": finalized_days,
                "minimum_required_days": min_days,
                "reasons": reasons,
            }


def evaluate_experiment(
    experiment_id: str,
    post_measurement_id: str,
    decision_rule_set_id: str = "ruleset_2_0_0",
    dry_run: bool = False,
    db_uri: str = DEFAULT_DB_URI,
) -> EvaluationRecord:
    """
    Deterministically evaluate an experiment against the pre-registered hypothesis and decision rules.
    """
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_experiments WHERE id = %s;", (experiment_id,))
            exp = cur.fetchone()
            if not exp:
                raise ValueError(f"Experiment '{experiment_id}' not found.")

            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (exp["pre_change_measurement_id"],))
            pre_meas = cur.fetchone()
            if not pre_meas:
                raise ValueError(f"Pre-change measurement '{exp['pre_change_measurement_id']}' not found.")

            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (post_measurement_id,))
            post_meas = cur.fetchone()
            if not post_meas:
                raise ValueError(f"Post-change measurement '{post_measurement_id}' not found.")

            # Eligibility & Window Purity Check
            elig = check_experiment_eligibility(experiment_id, post_measurement_id=post_measurement_id, db_uri=db_uri)

            # Confounding Detection
            conf_level, conf_details = detect_confounds(
                experiment_id,
                post_meas["effective_period_start"],
                post_meas["effective_period_end"],
                db_uri=db_uri,
            )

            # Extract metric values
            metric_name = exp["target_metric"]
            pre_val_raw = pre_meas.get(metric_name)
            post_val_raw = post_meas.get(metric_name)

            pre_val = float(pre_val_raw) if pre_val_raw is not None else 0.0
            post_val = float(post_val_raw) if post_val_raw is not None else 0.0

            delta_val = post_val - pre_val
            delta_pct = (delta_val / pre_val * 100.0) if pre_val > 0 else None

            # Tiny denominator protection
            is_low_volume = (pre_val < 5 and post_val < 5)

            # Outcome Classification
            outcome = "INCONCLUSIVE"
            confidence = "HIGH"
            synthesis_notes = ""

            if not elig["is_clean_window"]:
                outcome = "CONFOUNDED"
                confidence = "NONE"
                synthesis_notes = "Evaluation blocked: post-measurement window is contaminated with pre-change dates."
            elif conf_level in ["CRITICAL", "MATERIAL"]:
                outcome = "CONFOUNDED"
                confidence = "NONE"
                synthesis_notes = f"Material confounding intervention detected during holdout ({conf_level}). Causal attribution destroyed."
            elif not elig["is_eligible"]:
                outcome = "INCONCLUSIVE"
                confidence = "NONE"
                synthesis_notes = f"Evidence eligibility gate not satisfied: {'; '.join(elig['reasons'])}"
            else:
                expected_dir = exp["expected_direction"]

                # Position Metric (Lower number = better rank)
                if metric_name in ["gsc_aggregate_position", "dimensioned_impression_weighted_position"]:
                    if expected_dir == "INCREASE":  # Ranking improved
                        if delta_val <= -2.0:
                            outcome = "SUPPORTED"
                            synthesis_notes = f"Ranking improved by {abs(delta_val):.1f} positions ({pre_val:.1f} -> {post_val:.1f})."
                        elif delta_val < 0.0:
                            outcome = "PARTIALLY_SUPPORTED"
                            synthesis_notes = f"Ranking improved slightly by {abs(delta_val):.1f} positions."
                        elif delta_val >= 2.0:
                            outcome = "REGRESSED"
                            synthesis_notes = f"Ranking worsened by {delta_val:.1f} positions ({pre_val:.1f} -> {post_val:.1f})."
                        else:
                            outcome = "NOT_SUPPORTED"
                            synthesis_notes = f"No material ranking improvement observed ({delta_val:+.1f} positions)."
                else:
                    # Volume Metrics (Impressions, Clicks, Traffic, Conversions)
                    if is_low_volume:
                        confidence = "LOW"
                        if delta_val > 0:
                            outcome = "PARTIALLY_SUPPORTED"
                            synthesis_notes = f"Low volume count moved from {pre_val:.0f} to {post_val:.0f} (+{delta_val:.0f}). Small sample warning."
                        elif delta_val < 0:
                            outcome = "REGRESSED"
                            synthesis_notes = f"Low volume count dropped from {pre_val:.0f} to {post_val:.0f} ({delta_val:.0f})."
                        else:
                            outcome = "INCONCLUSIVE"
                            synthesis_notes = f"Low volume count remained at {pre_val:.0f}. Insufficient traffic volume."
                    else:
                        pct_change = delta_pct if delta_pct is not None else 0.0
                        if expected_dir == "INCREASE":
                            if pct_change >= 10.0 or (exp["expected_magnitude"] and delta_val >= exp["expected_magnitude"]):
                                outcome = "SUPPORTED"
                                synthesis_notes = f"Target metric {metric_name} grew by {pct_change:+.1f}% ({pre_val:.0f} -> {post_val:.0f}, delta={delta_val:+.0f})."
                            elif delta_val > 0:
                                outcome = "PARTIALLY_SUPPORTED"
                                synthesis_notes = f"Target metric grew by {pct_change:+.1f}% (+{delta_val:.0f}), below 10% target threshold."
                            elif pct_change <= -10.0:
                                outcome = "REGRESSED"
                                synthesis_notes = f"Target metric regressed by {pct_change:+.1f}% ({pre_val:.0f} -> {post_val:.0f})."
                            else:
                                outcome = "NOT_SUPPORTED"
                                synthesis_notes = f"Target metric showed no material growth ({pct_change:+.1f}%, delta={delta_val:+.0f})."
                        elif expected_dir == "DECREASE":
                            if pct_change <= -10.0 or (pre_val > 0 and delta_val <= -10):
                                outcome = "SUPPORTED"
                                synthesis_notes = f"Target metric decreased as expected ({pre_val:.0f} -> {post_val:.0f})."
                            elif pct_change >= 10.0 or delta_val >= 10:
                                outcome = "REGRESSED"
                                synthesis_notes = f"Target metric increased by {delta_val:+.0f}, contradicting decrease hypothesis."
                            else:
                                outcome = "NOT_SUPPORTED"
                        elif expected_dir == "MAINTAIN":
                            if abs(pct_change) <= 5.0:
                                outcome = "SUPPORTED"
                                synthesis_notes = f"Target metric maintained within +/- 5% tolerance ({pct_change:+.1f}%)."
                            else:
                                outcome = "NOT_SUPPORTED"
                                synthesis_notes = f"Target metric fluctuated beyond tolerance ({pct_change:+.1f}%)."

            eval_rec = EvaluationRecord(
                id=str(uuid.uuid4()),
                experiment_id=experiment_id,
                post_measurement_id=post_measurement_id,
                decision_rule_set_id=decision_rule_set_id,
                outcome=outcome,
                pre_value=pre_val,
                post_value=post_val,
                delta_value=delta_val,
                delta_percentage=delta_pct,
                confidence_level=confidence,
                confounding_level=conf_level,
                confounding_details=conf_details,
                wall_clock_elapsed_days=elig["wall_clock_elapsed_days"],
                finalized_source_days=elig["finalized_source_days"],
                is_clean_window=elig["is_clean_window"],
                synthesis_notes=synthesis_notes,
                learning_accumulated={
                    "target_metric": metric_name,
                    "hypothesis": exp["hypothesis_statement"],
                    "pre_meas_id": exp["pre_change_measurement_id"],
                    "post_meas_id": post_measurement_id,
                    "low_volume_warning": is_low_volume,
                },
            )

            if not dry_run:
                cur.execute(
                    """
                    INSERT INTO experiment_evaluations (
                        id, experiment_id, post_measurement_id, decision_rule_set_id,
                        outcome, pre_value, post_value, delta_value, delta_percentage,
                        confidence_level, confounding_level, confounding_details,
                        wall_clock_elapsed_days, finalized_source_days, is_clean_window,
                        synthesis_notes, learning_accumulated, evaluated_at
                    ) VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, now()
                    );
                    """,
                    (
                        eval_rec.id,
                        eval_rec.experiment_id,
                        eval_rec.post_measurement_id,
                        eval_rec.decision_rule_set_id,
                        eval_rec.outcome,
                        eval_rec.pre_value,
                        eval_rec.post_value,
                        eval_rec.delta_value,
                        eval_rec.delta_percentage,
                        eval_rec.confidence_level,
                        eval_rec.confounding_level,
                        json.dumps(eval_rec.confounding_details),
                        eval_rec.wall_clock_elapsed_days,
                        eval_rec.finalized_source_days,
                        eval_rec.is_clean_window,
                        eval_rec.synthesis_notes,
                        json.dumps(eval_rec.learning_accumulated),
                    ),
                )
                cur.execute(
                    """
                    UPDATE acquisition_experiments
                    SET approval_status = 'EVALUATED'
                    WHERE id = %s;
                    """,
                    (experiment_id,),
                )
                conn.commit()

            return eval_rec


# ---------------------------------------------------------------------------
# 5. Report & Change Log Generation
# ---------------------------------------------------------------------------

def generate_experiment_report(
    experiment_id: str,
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Generate a structured markdown audit report for an evaluated experiment."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_experiments WHERE id = %s;", (experiment_id,))
            exp = cur.fetchone()
            if not exp:
                raise ValueError(f"Experiment '{experiment_id}' not found.")

            cur.execute("SELECT * FROM acquisition_changes WHERE id = %s;", (exp["change_id"],))
            chg = cur.fetchone()

            cur.execute(
                "SELECT * FROM experiment_evaluations WHERE experiment_id = %s ORDER BY evaluated_at DESC LIMIT 1;",
                (experiment_id,),
            )
            ev = cur.fetchone()

    lines = [
        f"# Acquisition Experiment Report: `{experiment_id}`",
        "",
        f"**Approval Status:** `{exp['approval_status']}` | **Approved By:** `{exp['approved_by'] or 'N/A'}`",
        f"**Associated Change ID:** `{exp['change_id']}` | **Target Metric:** `{exp['target_metric']}`",
        f"**Expected Direction:** `{exp['expected_direction']}` | **Rule Set:** `{exp['decision_rule_set_id']}`",
        "",
        "## 1. Pre-Registered Immutable Hypothesis (FACT)",
        "",
        f"> {exp['hypothesis_statement']}",
        "",
        "## 2. Production Intervention & Holdout (FACT)",
        "",
        f"- **Change Type:** `{chg['change_type'] if chg else 'N/A'}`",
        f"- **Deployed Commit:** `{chg['deployed_commit'] if chg else 'N/A'}`",
        f"- **Effective Change Time:** `{exp['effective_change_at']}`",
        f"- **Do Not Change Until:** `{exp['do_not_change_until']}`",
        f"- **Affected Cohorts:** `{', '.join(chg['affected_cohorts']) if chg else 'N/A'}`",
        "",
    ]

    if ev:
        pct_str = f"{ev['delta_percentage']:+.1f}%" if ev["delta_percentage"] is not None else "N/A"
        lines.extend([
            "## 3. Quantitative Evidence & Result (FACT)",
            "",
            "| Dimension | Pre-Change Baseline | Post-Change Observation | Delta (Absolute) | Delta (%) |",
            "|:---|:---|:---|:---|:---|",
            f"| `{exp['target_metric']}` | `{ev['pre_value']:.1f}` | `{ev['post_value']:.1f}` | `{ev['delta_value']:+.1f}` | `{pct_str}` |",
            "",
            "## 4. Evaluation Synthesis & Outcome (CONCLUSION)",
            "",
            f"- **Outcome Classification:** `{ev['outcome']}`",
            f"- **Confidence Level:** `{ev['confidence_level']}`",
            f"- **Confounding Severity:** `{ev['confounding_level']}`",
            f"- **Clean Window:** `{ev['is_clean_window']}`",
            f"- **Holdout Elapsed:** `{ev['wall_clock_elapsed_days']} wall-clock days / {ev['finalized_source_days']} finalized source days`",
            f"- **Synthesis Notes:** {ev['synthesis_notes']}",
            "",
            "## 5. Epistemic Boundary & Limitations (LIMITATION)",
            "",
            "- `SUPPORTED` indicates observed evidence is consistent with the hypothesis under the defined window.",
            "- It does not establish isolated laboratory causality or replace multi-variant testing.",
            "- Future site changes must respect holdout protection dates to preserve attribution integrity.",
        ])
    else:
        lines.extend([
            "## 3. Evaluation Status",
            "",
            "*Experiment has not yet been evaluated. Observation holdout in progress.*",
        ])

    return "\n".join(lines)


def generate_change_log_markdown(db_uri: str = DEFAULT_DB_URI) -> str:
    """Regenerate human-readable CHANGE_LOG.md from canonical database records."""
    changes = list_changes(limit=100, db_uri=db_uri)

    lines = [
        "# Site Acquisition Change Log",
        "",
        "Authoritative record of production changes affecting SEO, routing, content, and conversion architecture.",
        "Canonical records are immutably persisted in `acquisition_changes` inside PostgreSQL `nebula_platform`.",
        "",
        "| Date | Change ID | Type | Summary | Affected Cohorts / Pages | Status | Commit | Logged By |",
        "|:---|:---|:---|:---|:---|:---|:---|:---|",
    ]

    for c in changes:
        d_str = c.deployed_at.strftime("%Y-%m-%d")
        cohorts_str = ", ".join(c.affected_cohorts) or "N/A"
        commit_short = c.deployed_commit[:8] if c.deployed_commit else "N/A"
        lines.append(
            f"| {d_str} | `{c.id}` | `{c.change_type}` | {c.summary} | {cohorts_str} | `{c.execution_status}` | `{commit_short}` | `{c.logged_by}` |"
        )

    lines.append("")
    return "\n".join(lines)
