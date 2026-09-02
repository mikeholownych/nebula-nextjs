"""Deterministic Recommendation Engine for the Acquisition Learning System.

Implements evidence sufficiency gating, metric-specific directionality,
environment/provenance isolation, and deterministic intervention recommendation classes without AI speculation.
"""

import hashlib
import json
import subprocess
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
import psycopg
from psycopg.rows import dict_row

from acquisition.metric_semantics import evaluate_metric_materiality, get_metric_semantics
from acquisition.models import (
    COHORTS,
    DEFAULT_DB_URI,
    ENVIRONMENTS,
    EVIDENCE_ORIGINS,
    GENERATION_MODES,
    MetricSemantics,
    PageCoverageReconciliation,
    RecommendationRecord,
)


def _get_current_commit() -> str:
    """Get current git commit hash for recommendation provenance."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except Exception:
        return "unknown"


def _compute_rec_id(
    measurement_id: str,
    decision_rule_set_id: str,
    target_type: str,
    target_id: str,
    recommendation_class: str,
) -> str:
    """Generate deterministic primary key for recommendation to ensure idempotency."""
    key = f"{measurement_id}:{decision_rule_set_id}:{target_type}:{target_id}:{recommendation_class}"
    h = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
    return f"rec_{measurement_id}_{target_type.lower()}_{h}"


def list_recommendations(
    lifecycle_status: Optional[str] = None,
    target_type: Optional[str] = None,
    environment: str = "PRODUCTION",
    limit: int = 50,
    db_uri: str = DEFAULT_DB_URI,
) -> List[RecommendationRecord]:
    """Retrieve persisted recommendations from database with environment filtering."""
    if environment not in ENVIRONMENTS:
        raise ValueError(f"Invalid environment '{environment}'")

    query = "SELECT * FROM acquisition_recommendations WHERE environment = %s"
    params: List[Any] = [environment]

    if lifecycle_status:
        query += " AND lifecycle_status = %s"
        params.append(lifecycle_status)
    if target_type:
        query += " AND target_type = %s"
        params.append(target_type)

    query += " ORDER BY created_at DESC LIMIT %s;"
    params.append(limit)

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [
                RecommendationRecord(
                    id=r["id"],
                    measurement_id=r["measurement_id"],
                    comparison_measurement_id=r["comparison_measurement_id"],
                    decision_rule_set_id=r["decision_rule_set_id"],
                    target_type=r["target_type"],
                    target_page_id=str(r["target_page_id"]) if r["target_page_id"] else None,
                    target_cohort=r["target_cohort"],
                    detected_condition=r["detected_condition"],
                    trend_classification=r["trend_classification"],
                    search_state=r["search_state"],
                    product_state=r["product_state"],
                    evidence_status=r["evidence_status"],
                    recommendation_class=r["recommendation_class"],
                    reason_code=r["reason_code"],
                    reason_text=r["reason_text"],
                    primary_metric=r["primary_metric"],
                    supporting_metrics=r["supporting_metrics"] or {},
                    confidence=r["confidence"],
                    uncertainties=r["uncertainties"] or [],
                    minimum_observation_period=r["minimum_observation_period"],
                    do_not_change_conditions=r["do_not_change_conditions"] or [],
                    lifecycle_status=r["lifecycle_status"],
                    experiment_candidate_id=r["experiment_candidate_id"],
                    environment=r.get("environment", "PRODUCTION"),
                    evidence_origin=r.get("evidence_origin", "PRODUCTION"),
                    generation_mode=r.get("generation_mode", "PRODUCTION"),
                    measurement_code_commit=r.get("measurement_code_commit"),
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                )
                for r in rows
            ]


def generate_recommendations(
    measurement_id: str,
    comparison_measurement_id: Optional[str] = None,
    decision_rule_set_id: str = "ruleset_2_0_0",
    environment: str = "PRODUCTION",
    evidence_origin: str = "PRODUCTION",
    generation_mode: str = "PRODUCTION",
    dry_run: bool = False,
    db_uri: str = DEFAULT_DB_URI,
) -> List[RecommendationRecord]:
    """
    Deterministically generate acquisition recommendations across sitewide, cohort,
    page, and query targets with strict environment and provenance boundaries.
    """
    if environment not in ENVIRONMENTS:
        raise ValueError(f"Invalid environment '{environment}'")
    if evidence_origin not in EVIDENCE_ORIGINS:
        raise ValueError(f"Invalid evidence_origin '{evidence_origin}'")
    if generation_mode not in GENERATION_MODES:
        raise ValueError(f"Invalid generation_mode '{generation_mode}'")

    code_commit = _get_current_commit()
    recommendations: List[RecommendationRecord] = []

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Fetch Measurement
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            curr_meas = cur.fetchone()
            if not curr_meas:
                raise ValueError(f"Measurement '{measurement_id}' not found.")

            # 2. Fetch or Resolve Comparison Measurement
            comp_meas = None
            if comparison_measurement_id:
                cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (comparison_measurement_id,))
                comp_meas = cur.fetchone()
            else:
                # Find most recent preceding measurement with no overlap
                cur.execute(
                    """
                    SELECT * FROM acquisition_measurements
                    WHERE effective_period_end < %s
                    ORDER BY effective_period_end DESC
                    LIMIT 1;
                    """,
                    (curr_meas["effective_period_start"],),
                )
                comp_meas = cur.fetchone()

            # 3. Check Active Experiments / Holdouts (Strictly filtered by environment!)
            cur.execute(
                """
                SELECT ae.id, ae.change_id, ae.approval_status, ae.do_not_change_until,
                       ac.affected_page_ids, ac.affected_cohorts
                FROM acquisition_experiments ae
                JOIN acquisition_changes ac ON ae.change_id = ac.id
                WHERE ae.environment = %s
                  AND ae.approval_status IN ('HOLDOUT', 'RUNNING')
                  AND (ae.do_not_change_until IS NULL OR ae.do_not_change_until > now());
                """,
                (environment,),
            )
            active_experiments = cur.fetchall()
            protected_page_ids: Set[str] = set()
            protected_cohorts: Set[str] = set()
            for exp in active_experiments:
                for pid in exp["affected_page_ids"]:
                    protected_page_ids.add(str(pid))
                for c in exp["affected_cohorts"]:
                    protected_cohorts.add(c)

            # 4. Check Active Suppressions (Strictly filtered by environment!)
            cur.execute(
                "SELECT * FROM recommendation_suppressions WHERE environment = %s AND suppressed_until > now();",
                (environment,),
            )
            suppressions = cur.fetchall()
            suppressed_targets: Set[Tuple[str, str, str]] = {
                (s["target_type"], s["target_id"], s["recommendation_class"]) for s in suppressions
            }

            # 5. Pipeline & Data Quality Validation
            completeness = curr_meas["data_completeness_status"]
            if completeness == "BLOCKED":
                rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "SITEWIDE", "sitewide", "INVESTIGATE")
                rec = RecommendationRecord(
                    id=rec_id,
                    measurement_id=measurement_id,
                    comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                    decision_rule_set_id=decision_rule_set_id,
                    target_type="SITEWIDE",
                    detected_condition="DATA_PIPELINE_BLOCKED",
                    trend_classification="TREND_BLOCKED",
                    evidence_status="BLOCKED",
                    recommendation_class="INVESTIGATE",
                    reason_code="DATA_BLOCKED",
                    reason_text="Source ingestion failed or critical measurement anomaly active. All substantive interventions blocked pending pipeline repair.",
                    primary_metric="gsc_total_impressions",
                    supporting_metrics={"data_completeness_status": completeness},
                    confidence="NONE",
                    uncertainties=["Pipeline telemetry unverified"],
                    minimum_observation_period=28,
                    lifecycle_status="GENERATED",
                    environment=environment,
                    evidence_origin=evidence_origin,
                    generation_mode=generation_mode,
                    measurement_code_commit=code_commit,
                )
                recommendations.append(rec)
                if not dry_run:
                    _persist_recommendations(conn, [rec])
                return recommendations

            # 6. Sitewide Recommendation
            curr_imps = curr_meas["gsc_total_impressions"]
            curr_pos = curr_meas["gsc_aggregate_position"]
            comp_imps = comp_meas["gsc_total_impressions"] if comp_meas else None
            comp_pos = comp_meas["gsc_aggregate_position"] if comp_meas else None

            # Check if search visibility was newly established
            if comp_meas and (comp_imps is None or comp_imps == 0) and (curr_imps and curr_imps > 0):
                rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "SITEWIDE", "sitewide", "OBSERVE")
                recommendations.append(
                    RecommendationRecord(
                        id=rec_id,
                        measurement_id=measurement_id,
                        comparison_measurement_id=comp_meas["id"],
                        decision_rule_set_id=decision_rule_set_id,
                        target_type="SITEWIDE",
                        detected_condition="SEARCH_VISIBILITY_NEWLY_ESTABLISHED",
                        trend_classification="TREND_NOT_ESTABLISHED",
                        evidence_status="INSUFFICIENT",
                        recommendation_class="OBSERVE",
                        reason_code="INSUFFICIENT_OBSERVATION",
                        reason_text=(
                            f"Sitewide search visibility was newly established in current window "
                            f"(0 -> {curr_imps} impressions). Prior ranking baseline is unobserved. "
                            f"Maintain passive observation until longitudinal baseline stabilizes."
                        ),
                        primary_metric="gsc_total_impressions",
                        supporting_metrics={
                            "current_impressions": curr_imps,
                            "current_position": curr_pos,
                            "comparison_impressions": comp_imps,
                        },
                        confidence="MEDIUM",
                        uncertainties=["Initial search indexing trajectory unestablished"],
                        minimum_observation_period=28,
                        do_not_change_conditions=["Maintain stable route structure during initial indexing"],
                        environment=environment,
                        evidence_origin=evidence_origin,
                        generation_mode=generation_mode,
                        measurement_code_commit=code_commit,
                    )
                )
            elif comp_meas and comp_imps and comp_imps > 0:
                imp_mat = evaluate_metric_materiality("gsc_total_impressions", comp_imps, curr_imps, db_uri=db_uri)
                pos_mat = evaluate_metric_materiality("gsc_aggregate_position", comp_pos, curr_pos, db_uri=db_uri)

                if imp_mat["direction"] == "IMPROVING" and pos_mat["direction"] in ["IMPROVING", "NEUTRAL"]:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "SITEWIDE", "sitewide", "NO_CHANGE")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"],
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="SITEWIDE",
                            detected_condition="POSITIVE_SITEWIDE_MOMENTUM",
                            trend_classification="IMPROVING",
                            evidence_status="SUFFICIENT",
                            recommendation_class="NO_CHANGE",
                            reason_code="POSITIVE_TRAJECTORY",
                            reason_text=(
                                f"Sitewide search presence is progressing positively (impressions {comp_imps} -> {curr_imps}). "
                                f"Intervention would disrupt current ranking momentum and obscure causal interpretability."
                            ),
                            primary_metric="gsc_total_impressions",
                            supporting_metrics={
                                "delta_impressions": imp_mat["delta_value"],
                                "delta_impressions_pct": imp_mat["delta_pct"],
                                "current_position": curr_pos,
                            },
                            confidence="HIGH",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )

            # 7. Cohort-Level Evaluation
            cur.execute(
                """
                SELECT 
                    pca.cohort_name,
                    COUNT(DISTINCT pm.page_id) as total_pages,
                    COUNT(DISTINCT CASE WHEN pm.impressions > 0 THEN pm.page_id END) as visible_pages,
                    COALESCE(SUM(pm.impressions), 0) as total_impressions,
                    COALESCE(SUM(pm.clicks), 0) as total_clicks,
                    AVG(pm.weighted_avg_position) as avg_position
                FROM page_cohort_assignments pca
                JOIN page_measurements pm ON pca.page_id = pm.page_id AND pm.measurement_id = %s
                GROUP BY pca.cohort_name;
                """,
                (measurement_id,),
            )
            cohort_rows = cur.fetchall()

            for crow in cohort_rows:
                cname = crow["cohort_name"]
                c_imps = crow["total_impressions"]
                c_pos = crow["avg_position"]

                if cname in protected_cohorts:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "COHORT", cname, "OBSERVE")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="COHORT",
                            target_cohort=cname,
                            detected_condition="ACTIVE_EXPERIMENT_HOLDOUT",
                            trend_classification="TREND_CONTROLLED",
                            evidence_status="SUFFICIENT",
                            recommendation_class="OBSERVE",
                            reason_code="ACTIVE_EXPERIMENT",
                            reason_text=f"Cohort '{cname}' contains an active controlled experiment holdout. Protected from external intervention.",
                            primary_metric="gsc_total_impressions",
                            supporting_metrics={"total_impressions": c_imps, "total_pages": crow["total_pages"]},
                            confidence="HIGH",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )
                    continue

                if ("COHORT", cname, "OBSERVE") in suppressed_targets:
                    continue

                if c_imps == 0:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "COHORT", cname, "OBSERVE")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="COHORT",
                            target_cohort=cname,
                            detected_condition="ZERO_COHORT_SEARCH_PRESENCE",
                            trend_classification="TREND_NOT_ESTABLISHED",
                            evidence_status="INSUFFICIENT",
                            recommendation_class="OBSERVE",
                            reason_code="INSUFFICIENT_OBSERVATION",
                            reason_text=f"Cohort '{cname}' currently receives zero search impressions. Insufficient empirical evidence to justify content modification.",
                            primary_metric="gsc_total_impressions",
                            supporting_metrics={"total_impressions": 0, "total_pages": crow["total_pages"]},
                            confidence="LOW",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )
                elif c_imps >= 100 and c_pos and 21.0 <= c_pos <= 50.0:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "COHORT", cname, "REVIEW_CONTENT_ALIGNMENT")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="COHORT",
                            target_cohort=cname,
                            detected_condition="COHORT_RANKING_STAGNATION_PAGE_2_5",
                            trend_classification="STABLE",
                            evidence_status="SUFFICIENT",
                            recommendation_class="REVIEW_CONTENT_ALIGNMENT",
                            reason_code="PERSISTENT_RANKING_STALL",
                            reason_text=(
                                f"Cohort '{cname}' generates persistent impressions ({c_imps}) but average rank is stalled "
                                f"at position {c_pos:.1f}. Review editorial depth and proof structure."
                            ),
                            primary_metric="dimensioned_impression_weighted_position",
                            supporting_metrics={"total_impressions": c_imps, "avg_position": c_pos},
                            confidence="MEDIUM",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )
                else:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "COHORT", cname, "OBSERVE")
                    pos_disp = f"{c_pos:.1f}" if c_pos is not None else "N/A"
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="COHORT",
                            target_cohort=cname,
                            detected_condition="ACTIVE_COHORT_OBSERVATION",
                            trend_classification="STABLE",
                            evidence_status="SUFFICIENT" if c_imps >= 100 else "INSUFFICIENT",
                            recommendation_class="OBSERVE",
                            reason_code="INSUFFICIENT_OBSERVATION",
                            reason_text=f"Cohort '{cname}' search metrics ({c_imps} imps, avg pos {pos_disp}) do not meet threshold for structural intervention.",
                            primary_metric="gsc_total_impressions",
                            supporting_metrics={"total_impressions": c_imps, "avg_position": c_pos},
                            confidence="MEDIUM",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )

            # 8. Page-Level Evaluation (Every visible page receives an explicit disposition)
            cur.execute(
                """
                SELECT 
                    pm.page_id,
                    pr.canonical_url,
                    pr.route_path,
                    pr.first_seen_at,
                    pm.impressions,
                    pm.clicks,
                    pm.weighted_avg_position,
                    pm.ctr,
                    pm.position_bucket
                FROM page_measurements pm
                JOIN page_registry pr ON pm.page_id = pr.id
                WHERE pm.measurement_id = %s;
                """,
                (measurement_id,),
            )
            page_rows = cur.fetchall()

            for prow in page_rows:
                pid_str = str(prow["page_id"])
                p_url = prow["canonical_url"]
                p_route = prow["route_path"]
                p_imps = prow["impressions"]
                p_clicks = prow["clicks"]
                p_pos = float(prow["weighted_avg_position"]) if prow["weighted_avg_position"] is not None else None
                p_ctr = float(prow["ctr"]) if prow["ctr"] is not None else None
                p_bucket = prow["position_bucket"]

                if pid_str in protected_page_ids:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "PAGE", pid_str, "OBSERVE")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="PAGE",
                            target_page_id=pid_str,
                            detected_condition="ACTIVE_EXPERIMENT_TARGET",
                            trend_classification="TREND_CONTROLLED",
                            search_state=p_bucket,
                            evidence_status="SUFFICIENT",
                            recommendation_class="OBSERVE",
                            reason_code="ACTIVE_EXPERIMENT",
                            reason_text=f"Page '{p_route}' is actively participating in a controlled experiment holdout. Modifications prohibited.",
                            primary_metric="gsc_total_impressions",
                            supporting_metrics={"impressions": p_imps, "clicks": p_clicks, "position": p_pos},
                            confidence="HIGH",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )
                    continue

                # Hard Rule 1: Low Rank Zero Click (Position > 20 or clicks = 0 at low rank)
                if p_pos and p_pos > 20.0 and p_clicks == 0:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "PAGE", pid_str, "OBSERVE")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="PAGE",
                            target_page_id=pid_str,
                            detected_condition="LOW_RANKING_EXPOSURE_ZERO_CLICKS",
                            trend_classification="STABLE",
                            search_state=p_bucket,
                            evidence_status="SUFFICIENT" if p_imps >= 50 else "INSUFFICIENT",
                            recommendation_class="OBSERVE",
                            reason_code="LOW_RANKING_EXPOSURE",
                            reason_text=(
                                f"Page '{p_route}' has average position {p_pos:.1f} and 0 clicks. "
                                f"Zero clicks at position > 20 is expected user behavior, not evidence of SERP copy failure. "
                                f"SERP title/snippet optimization is NOT justified."
                            ),
                            primary_metric="gsc_aggregate_position",
                            supporting_metrics={"impressions": p_imps, "clicks": p_clicks, "position": p_pos, "ctr": p_ctr},
                            confidence="HIGH",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )
                    continue

                # Hard Rule 2: Top-10 / Top-20 High Exposure Low CTR (Position <= 20 and impressions >= 100)
                elif p_pos and p_pos <= 20.0 and p_imps >= 100 and (p_ctr is None or p_ctr < 0.01):
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "PAGE", pid_str, "REVIEW_SERP_PRESENTATION")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="PAGE",
                            target_page_id=pid_str,
                            detected_condition="TOP_RANKING_EXPOSURE_CTR_UNDERPERFORMANCE",
                            trend_classification="STABLE",
                            search_state=p_bucket,
                            evidence_status="SUFFICIENT",
                            recommendation_class="REVIEW_SERP_PRESENTATION",
                            reason_code="CTR_UNDERPERFORMANCE_WITH_VALID_EXPOSURE",
                            reason_text=(
                                f"Page '{p_route}' achieved ranking exposure (position {p_pos:.1f}, {p_imps} impressions), "
                                f"but recorded weak CTR ({p_ctr:.2% if p_ctr else '0.0%'}). Review Title tag and meta description hook."
                            ),
                            primary_metric="gsc_average_ctr",
                            supporting_metrics={"impressions": p_imps, "clicks": p_clicks, "position": p_pos, "ctr": p_ctr},
                            confidence="HIGH",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )
                    continue

                # Hard Rule 3: Top-10 / Top-20 with Low Observation Volume (< 100 impressions)
                elif p_pos and p_pos <= 20.0 and p_imps < 100:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "PAGE", pid_str, "OBSERVE")
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="PAGE",
                            target_page_id=pid_str,
                            detected_condition="TOP_RANKING_LOW_EXPOSURE_VOLUME",
                            trend_classification="STABLE",
                            search_state=p_bucket,
                            evidence_status="INSUFFICIENT",
                            recommendation_class="OBSERVE",
                            reason_code="INSUFFICIENT_OBSERVATION",
                            reason_text=(
                                f"Page '{p_route}' achieved ranking exposure (position {p_pos:.1f}) but has low observation volume "
                                f"({p_imps} impressions). Maintain passive observation until statistical sample threshold (>= 100 impressions) is reached."
                            ),
                            primary_metric="gsc_aggregate_position",
                            supporting_metrics={"impressions": p_imps, "clicks": p_clicks, "position": p_pos, "ctr": p_ctr},
                            confidence="MEDIUM",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )
                    continue

                # Fallback for any other visible pages
                else:
                    rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "PAGE", pid_str, "OBSERVE")
                    pos_disp = f"{p_pos:.1f}" if p_pos is not None else "N/A"
                    recommendations.append(
                        RecommendationRecord(
                            id=rec_id,
                            measurement_id=measurement_id,
                            comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                            decision_rule_set_id=decision_rule_set_id,
                            target_type="PAGE",
                            target_page_id=pid_str,
                            detected_condition="GENERAL_PAGE_OBSERVATION",
                            trend_classification="STABLE",
                            search_state=p_bucket,
                            evidence_status="INSUFFICIENT",
                            recommendation_class="OBSERVE",
                            reason_code="INSUFFICIENT_OBSERVATION",
                            reason_text=f"Page '{p_route}' recorded {p_imps} impressions (avg pos {pos_disp}). Maintain passive observation.",
                            primary_metric="gsc_total_impressions",
                            supporting_metrics={"impressions": p_imps, "clicks": p_clicks, "position": p_pos, "ctr": p_ctr},
                            confidence="MEDIUM",
                            minimum_observation_period=28,
                            environment=environment,
                            evidence_origin=evidence_origin,
                            generation_mode=generation_mode,
                            measurement_code_commit=code_commit,
                        )
                    )

            # 9. Query-Level Cannibalization Detection
            cur.execute(
                """
                SELECT 
                    query_text,
                    COUNT(DISTINCT page_id) as competing_page_count,
                    SUM(impressions) as total_query_impressions,
                    AVG(position) as avg_query_position,
                    array_agg(DISTINCT page_id) as competing_page_ids
                FROM query_measurements
                WHERE measurement_id = %s
                GROUP BY query_text
                HAVING COUNT(DISTINCT page_id) > 1 AND SUM(impressions) >= 50;
                """,
                (measurement_id,),
            )
            cannibal_rows = cur.fetchall()

            for qrow in cannibal_rows:
                qtext = qrow["query_text"]
                p_count = qrow["competing_page_count"]
                q_imps = qrow["total_query_impressions"]
                q_pos = float(qrow["avg_query_position"])

                rec_id = _compute_rec_id(measurement_id, decision_rule_set_id, "QUERY", qtext, "REVIEW_CANNIBALIZATION")
                recommendations.append(
                    RecommendationRecord(
                        id=rec_id,
                        measurement_id=measurement_id,
                        comparison_measurement_id=comp_meas["id"] if comp_meas else None,
                        decision_rule_set_id=decision_rule_set_id,
                        target_type="QUERY",
                        detected_condition="MULTI_PAGE_QUERY_COMPETITION",
                        trend_classification="STABLE",
                        evidence_status="SUFFICIENT",
                        recommendation_class="REVIEW_CANNIBALIZATION",
                        reason_code="POTENTIAL_CANNIBALIZATION",
                        reason_text=(
                            f"Query '{qtext}' splits {q_imps} search impressions across {p_count} internal URLs "
                            f"(average position {q_pos:.1f}). Review canonicalization and target keyword differentiation."
                        ),
                        primary_metric="gsc_total_impressions",
                        supporting_metrics={
                            "query": qtext,
                            "competing_pages": p_count,
                            "impressions": q_imps,
                            "avg_position": q_pos,
                        },
                        confidence="MEDIUM",
                        minimum_observation_period=28,
                        environment=environment,
                        evidence_origin=evidence_origin,
                        generation_mode=generation_mode,
                        measurement_code_commit=code_commit,
                    )
                )

            # 10. Persist if not dry run
            if not dry_run:
                _persist_recommendations(conn, recommendations)

    return recommendations


def reconcile_page_coverage(
    measurement_id: str,
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> PageCoverageReconciliation:
    """
    Computes exact coverage reconciliation across all canonical pages.
    Invariant: total_canonical_pages = page_recommendation_targets + excluded_pages + blocked_pages
    unaccounted_pages MUST equal 0.
    """
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Total canonical pages in registry
            cur.execute("SELECT id, route_path, canonical_url, is_indexable, is_active, retired_at FROM page_registry;")
            all_pages = cur.fetchall()
            total_pages = len(all_pages)

            # 2. Visible pages for this measurement
            cur.execute(
                """
                SELECT page_id, impressions, clicks, weighted_avg_position
                FROM page_measurements
                WHERE measurement_id = %s;
                """,
                (measurement_id,),
            )
            meas_pages = cur.fetchall()
            visible_page_ids = {str(p["page_id"]) for p in meas_pages if p["impressions"] > 0}
            visible_count = len(visible_page_ids)

            # 3. Recommendations generated for pages in this measurement
            cur.execute(
                """
                SELECT target_page_id, recommendation_class, reason_code
                FROM acquisition_recommendations
                WHERE measurement_id = %s AND target_type = 'PAGE' AND environment = %s;
                """,
                (measurement_id, environment),
            )
            rec_rows = cur.fetchall()
            rec_page_ids = {str(r["target_page_id"]) for r in rec_rows if r["target_page_id"]}
            rec_count = len(rec_page_ids)

            # 4. Categorize all non-recommendation pages
            excluded_details: Dict[str, List[str]] = {
                "EXCLUDED_ZERO_SEARCH_PRESENCE": [],
                "EXCLUDED_NON_INDEXABLE": [],
                "BLOCKED": [],
            }

            for page in all_pages:
                pid = str(page["id"])
                if pid in rec_page_ids:
                    continue

                if not page["is_indexable"] or not page["is_active"] or page["retired_at"] is not None:
                    excluded_details["EXCLUDED_NON_INDEXABLE"].append(page["route_path"])
                elif pid not in visible_page_ids:
                    excluded_details["EXCLUDED_ZERO_SEARCH_PRESENCE"].append(page["route_path"])
                else:
                    excluded_details["BLOCKED"].append(page["route_path"])

            excluded_count = len(excluded_details["EXCLUDED_ZERO_SEARCH_PRESENCE"]) + len(excluded_details["EXCLUDED_NON_INDEXABLE"])
            blocked_count = len(excluded_details["BLOCKED"])
            unaccounted = total_pages - (rec_count + excluded_count + blocked_count)

            if unaccounted != 0:
                raise ValueError(f"Page coverage invariant violated! Unaccounted pages: {unaccounted}")

            return PageCoverageReconciliation(
                measurement_id=measurement_id,
                total_canonical_pages=total_pages,
                visible_pages=visible_count,
                eligible_pages=visible_count,
                page_recommendation_targets=rec_count,
                excluded_pages=excluded_count,
                blocked_pages=blocked_count,
                unaccounted_pages=unaccounted,
                excluded_details=excluded_details,
            )


def _persist_recommendations(conn: psycopg.Connection, recommendations: List[RecommendationRecord]) -> None:
    """Save recommendations idempotently to PostgreSQL."""
    with conn.cursor() as cur:
        for r in recommendations:
            cur.execute(
                """
                INSERT INTO acquisition_recommendations (
                    id, measurement_id, comparison_measurement_id, decision_rule_set_id,
                    target_type, target_page_id, target_cohort, detected_condition,
                    trend_classification, search_state, product_state, evidence_status,
                    recommendation_class, reason_code, reason_text, primary_metric,
                    supporting_metrics, confidence, uncertainties, minimum_observation_period,
                    do_not_change_conditions, lifecycle_status, experiment_candidate_id,
                    environment, evidence_origin, generation_mode, measurement_code_commit,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    comparison_measurement_id = EXCLUDED.comparison_measurement_id,
                    detected_condition = EXCLUDED.detected_condition,
                    trend_classification = EXCLUDED.trend_classification,
                    search_state = EXCLUDED.search_state,
                    product_state = EXCLUDED.product_state,
                    evidence_status = EXCLUDED.evidence_status,
                    recommendation_class = EXCLUDED.recommendation_class,
                    reason_code = EXCLUDED.reason_code,
                    reason_text = EXCLUDED.reason_text,
                    primary_metric = EXCLUDED.primary_metric,
                    supporting_metrics = EXCLUDED.supporting_metrics,
                    confidence = EXCLUDED.confidence,
                    uncertainties = EXCLUDED.uncertainties,
                    minimum_observation_period = EXCLUDED.minimum_observation_period,
                    do_not_change_conditions = EXCLUDED.do_not_change_conditions,
                    environment = EXCLUDED.environment,
                    evidence_origin = EXCLUDED.evidence_origin,
                    generation_mode = EXCLUDED.generation_mode,
                    measurement_code_commit = EXCLUDED.measurement_code_commit,
                    updated_at = now();
                """,
                (
                    r.id,
                    r.measurement_id,
                    r.comparison_measurement_id,
                    r.decision_rule_set_id,
                    r.target_type,
                    r.target_page_id,
                    r.target_cohort,
                    r.detected_condition,
                    r.trend_classification,
                    r.search_state,
                    r.product_state,
                    r.evidence_status,
                    r.recommendation_class,
                    r.reason_code,
                    r.reason_text,
                    r.primary_metric,
                    json.dumps(r.supporting_metrics, default=str),
                    r.confidence,
                    r.uncertainties,
                    r.minimum_observation_period,
                    r.do_not_change_conditions,
                    r.lifecycle_status,
                    r.experiment_candidate_id,
                    r.environment,
                    r.evidence_origin,
                    r.generation_mode,
                    r.measurement_code_commit,
                    r.created_at,
                    r.updated_at,
                ),
            )
        conn.commit()
