"""Acquisition Longitudinal Learning Store Module.

Manages deterministic synthesis of historical controlled experiments into
versioned learning records, evidence states, and cross-cohort boundaries.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

from acquisition.models import (
    DEFAULT_DB_URI,
    LearningStoreRecord,
    LEARNING_EVIDENCE_STATES,
)


def evaluate_learning_evidence_state(
    supported_count: int,
    contradicting_count: int,
    confounded_count: int,
) -> str:
    """Deterministically assign a learning evidence state based on experiment counts."""
    clean_count = supported_count + contradicting_count
    if clean_count == 0:
        return "INSUFFICIENT_EVIDENCE"
    if clean_count == 1:
        return "ONE_OBSERVATION"
    if supported_count >= 1 and contradicting_count >= 1:
        return "CONFLICTING_EVIDENCE"
    if supported_count >= 3 and contradicting_count == 0:
        return "SUPPORTED_PATTERN"
    if supported_count >= 2 and contradicting_count == 0:
        return "REPEATED_SIGNAL"
    return "INSUFFICIENT_EVIDENCE"


def sync_learning_store_from_experiments(
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> List[LearningStoreRecord]:
    """Aggregate historical experiment outcomes and update the acquisition learning store."""
    results: List[LearningStoreRecord] = []
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ae.id as experiment_id, ac.change_type, ac.affected_cohorts,
                       ee.outcome, ee.confidence_level, ee.delta_value, ae.started_at
                FROM acquisition_experiments ae
                JOIN acquisition_changes ac ON ae.change_id = ac.id
                LEFT JOIN experiment_evaluations ee ON ee.experiment_id = ae.id
                WHERE ae.environment = %s
                ORDER BY ae.started_at ASC;
                """,
                (environment,),
            )
            rows = cur.fetchall()

            # Group by (cohort, change_type)
            grouped: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
            for r in rows:
                cohorts = r["affected_cohorts"] or ["sitewide"]
                for cohort in cohorts:
                    ctype = r["change_type"]
                    key = f"{cohort}::{ctype}"
                    if key not in grouped:
                        grouped[key] = {"cohort": cohort, "change_type": ctype, "records": []}
                    grouped[key]["records"].append(r)

            now = datetime.now(timezone.utc)
            for key, group in grouped.items():
                cohort = group["cohort"]
                ctype = group["change_type"]
                recs = group["records"]

                supp_eids = [r["experiment_id"] for r in recs if r["outcome"] == "SUPPORTED"]
                contra_eids = [r["experiment_id"] for r in recs if r["outcome"] in ["REGRESSED", "NOT_SUPPORTED"]]
                conf_eids = [r["experiment_id"] for r in recs if r["outcome"] == "CONFOUNDED"]

                ev_state = evaluate_learning_evidence_state(
                    len(supp_eids), len(contra_eids), len(conf_eids)
                )

                statement = (
                    f"Intervention '{ctype}' in scope '{cohort}' evaluated across {len(recs)} experiment(s). "
                    f"Outcomes: {len(supp_eids)} supported, {len(contra_eids)} regressed/unsupported, {len(conf_eids)} confounded. "
                    f"Evidence state: {ev_state}."
                )

                learn_id = f"learn_{cohort}_{ctype.lower()}"
                metadata = {
                    "total_experiments": len(recs),
                    "supported_count": len(supp_eids),
                    "contradicting_count": len(contra_eids),
                    "confounded_count": len(conf_eids),
                }

                cur.execute(
                    """
                    INSERT INTO acquisition_learning_store (
                        id, scope_type, scope_id, intervention_type, pattern_statement,
                        evidence_state, supporting_experiment_ids, contradicting_experiment_ids,
                        confounded_experiment_ids, environment, first_observed_at, last_updated_at, metadata
                    ) VALUES (
                        %s, 'COHORT', %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        pattern_statement = EXCLUDED.pattern_statement,
                        evidence_state = EXCLUDED.evidence_state,
                        supporting_experiment_ids = EXCLUDED.supporting_experiment_ids,
                        contradicting_experiment_ids = EXCLUDED.contradicting_experiment_ids,
                        confounded_experiment_ids = EXCLUDED.confounded_experiment_ids,
                        last_updated_at = EXCLUDED.last_updated_at,
                        metadata = EXCLUDED.metadata
                    RETURNING *;
                    """,
                    (
                        learn_id,
                        cohort,
                        ctype,
                        statement,
                        ev_state,
                        supp_eids,
                        contra_eids,
                        conf_eids,
                        environment,
                        recs[0]["started_at"] or now,
                        now,
                        psycopg.types.json.Jsonb(metadata),
                    ),
                )
                upserted = cur.fetchone()
                results.append(
                    LearningStoreRecord(
                        id=upserted["id"],
                        scope_type=upserted["scope_type"],
                        scope_id=upserted["scope_id"],
                        intervention_type=upserted["intervention_type"],
                        pattern_statement=upserted["pattern_statement"],
                        evidence_state=upserted["evidence_state"],
                        supporting_experiment_ids=upserted["supporting_experiment_ids"],
                        contradicting_experiment_ids=upserted["contradicting_experiment_ids"],
                        confounded_experiment_ids=upserted["confounded_experiment_ids"],
                        environment=upserted["environment"],
                        metadata=upserted["metadata"],
                        first_observed_at=upserted["first_observed_at"],
                        last_updated_at=upserted["last_updated_at"],
                    )
                )
            conn.commit()
    return results


def list_learning_records(
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> List[LearningStoreRecord]:
    """List all records in the acquisition learning store for an environment."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM acquisition_learning_store
                WHERE environment = %s
                ORDER BY scope_id, intervention_type;
                """,
                (environment,),
            )
            rows = cur.fetchall()
            return [
                LearningStoreRecord(
                    id=r["id"],
                    scope_type=r["scope_type"],
                    scope_id=r["scope_id"],
                    intervention_type=r["intervention_type"],
                    pattern_statement=r["pattern_statement"],
                    evidence_state=r["evidence_state"],
                    supporting_experiment_ids=r["supporting_experiment_ids"],
                    contradicting_experiment_ids=r["contradicting_experiment_ids"],
                    confounded_experiment_ids=r["confounded_experiment_ids"],
                    environment=r["environment"],
                    metadata=r["metadata"],
                    first_observed_at=r["first_observed_at"],
                    last_updated_at=r["last_updated_at"],
                )
                for r in rows
            ]
