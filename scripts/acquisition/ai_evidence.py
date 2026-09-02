"""AI Evidence Packaging and Manifest Construction Module.

Builds structured, bounded evidence packages for AI interpretation with
complete provenance and cryptographic manifest hashing.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

from acquisition.models import (
    DEFAULT_DB_URI,
    EvidenceManifest,
    DECISION_RULE_SET_ID,
    MEASUREMENT_VERSION,
    get_current_git_commit,
)


def build_evidence_package(
    measurement_id: str,
    analysis_type: str,
    target_type: str = "SITEWIDE",
    target_id: Optional[str] = None,
    environment: str = "PRODUCTION",
    generation_mode: str = "PRODUCTION",
    max_query_rows: int = 25,
    max_historical_experiments: int = 10,
    db_uri: str = DEFAULT_DB_URI,
) -> Dict[str, Any]:
    """Build a complete, structured evidence package and manifest for an AI interpretation run."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Fetch measurement row
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            meas = cur.fetchone()
            if not meas:
                raise ValueError(f"Measurement '{measurement_id}' not found.")

            # Evidence ID collection sets
            measurement_ids = [measurement_id]
            page_measurement_ids: List[str] = []
            query_measurement_ids: List[str] = []
            recommendation_ids: List[str] = []
            experiment_ids: List[str] = []
            anomaly_ids: List[str] = []

            # 2. Reference comparison measurement if available
            comparison_info: Dict[str, Any] = {
                "comparison_type": "NONE",
                "reference_measurement_id": None,
                "compatibility": "NONE",
                "search_presence_transition": "NEWLY_ESTABLISHED" if meas["gsc_total_impressions"] > 0 else "NONE",
            }
            cur.execute(
                """
                SELECT id, gsc_total_impressions, gsc_aggregate_position
                FROM acquisition_measurements
                WHERE effective_period_end < %s
                ORDER BY effective_period_end DESC
                LIMIT 1;
                """,
                (meas["effective_period_start"],),
            )
            ref_meas = cur.fetchone()
            if ref_meas:
                ref_id = ref_meas["id"]
                measurement_ids.append(ref_id)
                prev_imps = ref_meas["gsc_total_impressions"] or 0
                comparison_info = {
                    "comparison_type": "ADJACENT_28D_CANONICAL",
                    "reference_measurement_id": ref_id,
                    "compatibility": "COMPATIBLE_28D_WINDOW",
                    "previous_impressions": prev_imps,
                    "previous_position": float(ref_meas["gsc_aggregate_position"]) if ref_meas["gsc_aggregate_position"] is not None else None,
                    "previous_search_presence": "NONE" if prev_imps == 0 else "ESTABLISHED",
                    "search_presence_transition": "ESTABLISHED_FROM_NONE" if prev_imps == 0 and meas["gsc_total_impressions"] > 0 else "CONTINUOUS",
                }

            # 3. Recommendations for this measurement
            cur.execute(
                """
                SELECT id, target_type, target_cohort, target_page_id,
                       recommendation_class, reason_code, reason_text, confidence,
                       trend_classification, primary_metric, supporting_metrics
                FROM acquisition_recommendations
                WHERE measurement_id = %s AND environment = %s;
                """,
                (measurement_id, environment),
            )
            recs = cur.fetchall()
            recommendations_summary = []
            for r in recs:
                recommendation_ids.append(r["id"])
                if target_type == "SITEWIDE" or (target_type == "COHORT" and r["target_cohort"] == target_id) or (target_type == "PAGE" and str(r["target_page_id"]) == str(target_id)):
                    recommendations_summary.append({
                        "id": r["id"],
                        "target_type": r["target_type"],
                        "recommendation_class": r["recommendation_class"],
                        "reason_code": r["reason_code"],
                        "reason_text": r["reason_text"],
                        "confidence": r["confidence"],
                        "trend_classification": r["trend_classification"],
                    })

            # 4. Target details & metrics
            target_info: Dict[str, Any] = {
                "type": target_type,
                "id": target_id or "sitewide",
                "canonical_url": None,
                "cohort": None,
            }
            metrics_info: Dict[str, Any] = {}
            deterministic_state: Dict[str, Any] = {}

            if target_type == "SITEWIDE":
                metrics_info = {
                    "total_impressions": meas["gsc_total_impressions"],
                    "total_clicks": meas["gsc_total_clicks"],
                    "macro_position": float(meas["gsc_aggregate_position"]) if meas["gsc_aggregate_position"] is not None else None,
                    "dimensioned_position": float(meas["dimensioned_impression_weighted_position"]) if meas["dimensioned_impression_weighted_position"] is not None else None,
                    "organic_sessions": meas["ga4_organic_sessions"],
                    "visible_pages_count": meas["unique_visible_pages"],
                    "visible_queries_count": meas["unique_visible_queries"],
                    "audits_started": meas["internal_audit_started"],
                    "purchases": meas["internal_purchases"],
                }
                deterministic_state = {
                    "search_state": "POS_31_50" if (meas["gsc_aggregate_position"] or 99) <= 50 else "POS_51_PLUS",
                    "trend_classification": "TREND_NOT_ESTABLISHED",
                    "confidence": "HIGH",
                }
            elif target_type == "COHORT" and target_id:
                target_info["cohort"] = target_id
                cur.execute(
                    """
                    SELECT SUM(impressions) as imps, SUM(clicks) as clicks,
                           AVG(weighted_avg_position) as avg_pos, COUNT(DISTINCT page_id) as page_count
                    FROM page_measurements
                    WHERE measurement_id = %s AND cohort_name = %s;
                    """,
                    (measurement_id, target_id),
                )
                c_row = cur.fetchone()
                c_imps = c_row["imps"] or 0
                metrics_info = {
                    "cohort_impressions": c_imps,
                    "cohort_clicks": c_row["clicks"] or 0,
                    "cohort_average_position": round(float(c_row["avg_pos"]), 2) if c_row["avg_pos"] is not None else None,
                    "cohort_page_count": c_row["page_count"] or 0,
                }
                deterministic_state = {
                    "recommendation": "OBSERVE",
                    "reason_code": "INSUFFICIENT_OBSERVATION" if c_imps < 100 else "EVALUATED",
                }
            elif target_type == "PAGE" and target_id:
                cur.execute("SELECT * FROM page_registry WHERE id::text = %s OR canonical_url = %s;", (str(target_id), str(target_id)))
                page = cur.fetchone()
                if page:
                    target_info["id"] = str(page["id"])
                    target_info["canonical_url"] = page["canonical_url"]
                    cur.execute(
                        "SELECT cohort_name FROM page_cohort_assignments WHERE page_id = %s AND is_current = true LIMIT 1;",
                        (page["id"],),
                    )
                    c_assign = cur.fetchone()
                    target_info["cohort"] = c_assign["cohort_name"] if c_assign else None

                    cur.execute(
                        "SELECT * FROM page_measurements WHERE measurement_id = %s AND page_id = %s;",
                        (measurement_id, page["id"]),
                    )
                    pmo = cur.fetchone()
                    if pmo:
                        page_measurement_ids.append(str(pmo["id"]))
                        metrics_info = {
                            "impressions": pmo["impressions"],
                            "clicks": pmo["clicks"],
                            "position": float(pmo["weighted_avg_position"]) if pmo["weighted_avg_position"] is not None else None,
                            "organic_sessions": pmo["ga4_organic_entry_sessions"],
                            "search_state": pmo["position_bucket"],
                        }
                        deterministic_state = {
                            "search_state": pmo["position_bucket"],
                            "recommendation": "OBSERVE",
                            "reason_code": "LOW_RANKING_EXPOSURE" if (pmo["weighted_avg_position"] or 99.0) > 20.0 else "INSUFFICIENT_OBSERVATION",
                        }

            # 5. Queries for this target (bounded)
            queries_data = []
            if target_type == "PAGE" and target_info.get("id"):
                cur.execute(
                    """
                    SELECT id, query_text, impressions, clicks, position
                    FROM query_measurements
                    WHERE measurement_id = %s AND page_id = %s
                    ORDER BY impressions DESC
                    LIMIT %s;
                    """,
                    (measurement_id, target_info["id"], max_query_rows),
                )
                q_rows = cur.fetchall()
                for qr in q_rows:
                    query_measurement_ids.append(str(qr["id"]))
                    queries_data.append({
                        "id": str(qr["id"]),
                        "query_text": qr["query_text"],
                        "impressions": qr["impressions"],
                        "clicks": qr["clicks"],
                        "position": float(qr["position"]) if qr["position"] is not None else None,
                    })
            elif target_type in ["SITEWIDE", "COHORT"]:
                cur.execute(
                    """
                    SELECT qm.id, qm.query_text, qm.impressions, qm.clicks, qm.position, pca.cohort_name as cohort
                    FROM query_measurements qm
                    JOIN page_cohort_assignments pca ON qm.page_id = pca.page_id AND pca.is_current = true
                    WHERE qm.measurement_id = %s
                    ORDER BY qm.impressions DESC
                    LIMIT %s;
                    """,
                    (measurement_id, max_query_rows),
                )
                q_rows = cur.fetchall()
                for qr in q_rows:
                    if target_type == "SITEWIDE" or qr["cohort"] == target_id:
                        query_measurement_ids.append(str(qr["id"]))
                        queries_data.append({
                            "id": str(qr["id"]),
                            "query_text": qr["query_text"],
                            "impressions": qr["impressions"],
                            "clicks": qr["clicks"],
                            "position": float(qr["position"]) if qr["position"] is not None else None,
                            "cohort": qr["cohort"],
                        })

            # 6. Historical experiments in scope (bounded)
            cur.execute(
                """
                SELECT ae.id, ae.change_id, ae.target_metric, ae.approval_status,
                       ee.outcome, ee.confidence_level, ee.delta_value, ac.change_type, ac.affected_cohorts
                FROM acquisition_experiments ae
                JOIN acquisition_changes ac ON ae.change_id = ac.id
                LEFT JOIN experiment_evaluations ee ON ee.experiment_id = ae.id
                WHERE ae.environment = %s
                ORDER BY ae.started_at DESC
                LIMIT %s;
                """,
                (environment, max_historical_experiments),
            )
            exp_rows = cur.fetchall()
            experiments_data = []
            for er in exp_rows:
                experiment_ids.append(er["id"])
                experiments_data.append({
                    "experiment_id": er["id"],
                    "change_type": er["change_type"],
                    "target_metric": er["target_metric"],
                    "approval_status": er["approval_status"],
                    "outcome": er["outcome"] or "UNEVALUATED",
                    "confidence_level": er["confidence_level"] or "NONE",
                    "delta_value": float(er["delta_value"]) if er["delta_value"] is not None else None,
                })

            # 7. Intended query positioning if page target
            intended_positioning = None
            if target_type == "PAGE" and target_info.get("id"):
                cur.execute(
                    "SELECT * FROM query_intent_registry WHERE page_id = %s ORDER BY version DESC LIMIT 1;",
                    (target_info["id"],),
                )
                qi = cur.fetchone()
                if qi:
                    intended_positioning = {
                        "primary_topic": qi["primary_topic"],
                        "secondary_topics": qi["secondary_topics"],
                        "target_query_patterns": qi["target_query_patterns"],
                        "intended_intent": qi["intended_intent"],
                    }

            # 8. Epistemic Limitations (Hard boundaries)
            limitations = [
                "GSC query rows are privacy-sampled and incomplete (query_sample_is_incomplete: true).",
                "Search presence newly established from NULL is not a ranking trend improvement.",
                "PostHog is observational and subject to client tracking protection.",
                "GA4 organic search entry session is not equal to downstream organic attributed session.",
                "Low impression volume at high rankings does not establish repeatable demand or commercial value.",
                "Strategic 84-day trend requires 3 non-overlapping finalized 28-day windows.",
            ]

            now_iso = datetime.now(timezone.utc).isoformat()
            code_commit = get_current_git_commit()
            analysis_id = f"ai_{analysis_type.lower()}_{measurement_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

            # Construct Evidence Manifest
            manifest_dict = {
                "analysis_id": analysis_id,
                "measurement_ids": sorted(list(set(measurement_ids))),
                "page_measurement_ids": sorted(list(set(page_measurement_ids))),
                "query_measurement_ids": sorted(list(set(query_measurement_ids))),
                "recommendation_ids": sorted(list(set(recommendation_ids))),
                "experiment_ids": sorted(list(set(experiment_ids))),
                "anomaly_ids": sorted(list(set(anomaly_ids))),
                "decision_rule_set_id": DECISION_RULE_SET_ID,
                "measurement_version_id": MEASUREMENT_VERSION,
                "engine_code_commit": code_commit,
                "ai_analysis_code_commit": code_commit,
                "generated_at": now_iso,
                "environment": environment,
                "generation_mode": generation_mode,
            }
            manifest_canonical_json = json.dumps(manifest_dict, sort_keys=True)
            manifest_hash = hashlib.sha256(manifest_canonical_json.encode("utf-8")).hexdigest()
            manifest_dict["manifest_hash"] = manifest_hash

            # Construct Full Evidence Package Envelope
            envelope = {
                "analysis_id": analysis_id,
                "analysis_type": analysis_type,
                "environment": environment,
                "generation_mode": generation_mode,
                "manifest": manifest_dict,
                "measurement": {
                    "measurement_id": measurement_id,
                    "measurement_version": MEASUREMENT_VERSION,
                    "decision_rule_set_id": DECISION_RULE_SET_ID,
                    "start_date": str(meas["effective_period_start"]),
                    "end_date": str(meas["effective_period_end"]),
                    "data_quality": meas["data_completeness_status"],
                    "code_commit": code_commit,
                },
                "target": target_info,
                "deterministic_state": deterministic_state,
                "metrics": metrics_info,
                "comparison": comparison_info,
                "intended_positioning": intended_positioning,
                "queries": queries_data,
                "recommendations": recommendations_summary,
                "experiments": experiments_data,
                "limitations": limitations,
            }

            return envelope
