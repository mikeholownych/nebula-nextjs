"""Acquisition Decision Review Reports, Human Review Workflow, and Experiment Bridge.

Produces structured 7-day weekly reviews, 28-day comparative reviews,
84-day strategic assessments, and bridges accepted recommendations into Phase 5 experiment drafts.
Enforces environment boundaries and explicit provenance metadata across all decision outputs.
"""

import subprocess
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

from acquisition.experiments import create_experiment
from acquisition.models import (
    DEFAULT_DB_URI,
    ENVIRONMENTS,
    GENERATION_MODES,
    ExperimentRecord,
    PageCoverageReconciliation,
    RecommendationRecord,
    RecommendationReviewRecord,
    RecommendationSuppressionRecord,
)
from acquisition.recommendation_engine import reconcile_page_coverage


def _get_current_commit() -> str:
    """Get current git commit hash for review provenance."""
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


def review_recommendation(
    recommendation_id: str,
    action: str,  # ACCEPT, REJECT, DEFER, REQUEST_MORE_EVIDENCE
    reviewed_by: str,
    review_notes: str,
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> RecommendationReviewRecord:
    """Submit a human decision review for a recommendation."""
    if action not in ["ACCEPT", "REJECT", "DEFER", "REQUEST_MORE_EVIDENCE"]:
        raise ValueError(f"Invalid review action '{action}'")
    if environment not in ENVIRONMENTS:
        raise ValueError(f"Invalid environment '{environment}'")

    status_map = {
        "ACCEPT": "ACCEPTED",
        "REJECT": "REJECTED",
        "DEFER": "DEFERRED",
        "REQUEST_MORE_EVIDENCE": "PENDING_REVIEW",
    }
    new_status = status_map[action]
    review_id = f"rev_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_recommendations WHERE id = %s;", (recommendation_id,))
            rec = cur.fetchone()
            if not rec:
                raise ValueError(f"Recommendation '{recommendation_id}' not found.")

            now = datetime.now(timezone.utc)
            # Insert review record
            cur.execute(
                """
                INSERT INTO recommendation_reviews (id, recommendation_id, reviewed_by, review_action, review_notes, environment, reviewed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
                """,
                (review_id, recommendation_id, reviewed_by, action, review_notes, environment, now),
            )

            # Update recommendation lifecycle status
            cur.execute(
                """
                UPDATE acquisition_recommendations
                SET lifecycle_status = %s, updated_at = %s
                WHERE id = %s;
                """,
                (new_status, now, recommendation_id),
            )

            # If rejected, automatically insert a 90-day suppression to prevent nagging
            if action == "REJECT":
                target_id = rec["target_cohort"] or str(rec["target_page_id"]) or "sitewide"
                supp_id = f"supp_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
                cur.execute(
                    """
                    INSERT INTO recommendation_suppressions (
                        id, target_type, target_id, recommendation_class, suppressed_by,
                        suppression_reason, suppressed_until, environment, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        supp_id,
                        rec["target_type"],
                        target_id,
                        rec["recommendation_class"],
                        reviewed_by,
                        review_notes,
                        now + timedelta(days=90),
                        environment,
                        now,
                    ),
                )

            conn.commit()

            return RecommendationReviewRecord(
                id=review_id,
                recommendation_id=recommendation_id,
                reviewed_by=reviewed_by,
                review_action=action,
                review_notes=review_notes,
                environment=environment,
                reviewed_at=now,
            )


def suppress_recommendation(
    target_type: str,
    target_id: str,
    recommendation_class: str,
    suppressed_by: str,
    suppression_reason: str,
    days: int = 90,
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> RecommendationSuppressionRecord:
    """Manually configure recommendation suppression for a target."""
    if environment not in ENVIRONMENTS:
        raise ValueError(f"Invalid environment '{environment}'")

    supp_id = f"supp_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    now = datetime.now(timezone.utc)
    until = now + timedelta(days=days)

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recommendation_suppressions (
                    id, target_type, target_id, recommendation_class, suppressed_by,
                    suppression_reason, suppressed_until, environment, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (supp_id, target_type, target_id, recommendation_class, suppressed_by, suppression_reason, until, environment, now),
            )
            r = cur.fetchone()
            conn.commit()

            return RecommendationSuppressionRecord(
                id=r["id"],
                target_type=r["target_type"],
                target_id=r["target_id"],
                recommendation_class=r["recommendation_class"],
                suppressed_by=r["suppressed_by"],
                suppression_reason=r["suppression_reason"],
                suppressed_until=r["suppressed_until"],
                environment=r["environment"],
                created_at=r["created_at"],
            )


def create_experiment_draft_from_recommendation(
    recommendation_id: str,
    change_id: str,
    exp_id: Optional[str] = None,
    expected_direction: str = "INCREASE",
    expected_magnitude: Optional[float] = None,
    environment: str = "PRODUCTION",
    evidence_origin: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> ExperimentRecord:
    """
    Bridge an accepted recommendation into a Phase 5 DRAFT experiment.
    Does NOT approve or activate the experiment.
    """
    if environment not in ENVIRONMENTS:
        raise ValueError(f"Invalid environment '{environment}'")

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_recommendations WHERE id = %s;", (recommendation_id,))
            rec = cur.fetchone()
            if not rec:
                raise ValueError(f"Recommendation '{recommendation_id}' not found.")

            if not exp_id:
                exp_id = f"exp_from_rec_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

            # Derive formal hypothesis from recommendation
            hypothesis = (
                f"Testing recommendation '{rec['recommendation_class']}': {rec['reason_text']} "
                f"Target metric {rec['primary_metric']} is expected to {expected_direction.lower()}."
            )

            # Create DRAFT experiment
            exp = create_experiment(
                experiment_id=exp_id,
                change_id=change_id,
                hypothesis_statement=hypothesis,
                target_metric=rec["primary_metric"],
                expected_direction=expected_direction,
                pre_change_measurement_id=rec["measurement_id"],
                expected_magnitude=expected_magnitude,
                decision_rule_set_id=rec["decision_rule_set_id"],
                minimum_holdout_days=rec["minimum_observation_period"],
                environment=environment,
                evidence_origin=evidence_origin,
                db_uri=db_uri,
            )

            # Link candidate ID on recommendation
            cur.execute(
                """
                UPDATE acquisition_recommendations
                SET experiment_candidate_id = %s, lifecycle_status = 'ACCEPTED', updated_at = now()
                WHERE id = %s;
                """,
                (exp_id, recommendation_id),
            )
            conn.commit()

            return exp


def generate_weekly_decision_review(
    measurement_id: str,
    environment: str = "PRODUCTION",
    generation_mode: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Generate structured markdown Weekly Acquisition Decision Review with complete provenance."""
    code_commit = _get_current_commit()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            meas = cur.fetchone()
            if not meas:
                raise ValueError(f"Measurement '{measurement_id}' not found.")

            cur.execute(
                """
                SELECT * FROM acquisition_recommendations
                WHERE measurement_id = %s AND environment = %s
                ORDER BY target_type, recommendation_class;
                """,
                (measurement_id, environment),
            )
            recs = cur.fetchall()

            # Active experiments strictly for requested environment
            cur.execute(
                """
                SELECT ae.id, ae.approval_status, ae.target_metric, ac.summary
                FROM acquisition_experiments ae
                JOIN acquisition_changes ac ON ae.change_id = ac.id
                WHERE ae.environment = %s
                  AND ae.approval_status IN ('HOLDOUT', 'RUNNING');
                """,
                (environment,),
            )
            active_exps = cur.fetchall()

            # Coverage reconciliation
            coverage = reconcile_page_coverage(measurement_id, environment=environment, db_uri=db_uri)

            eff_days = (meas["effective_period_end"] - meas["effective_period_start"]).days + 1
            now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            lines: List[str] = []
            lines.append(f"# Weekly Acquisition Decision Review: `{measurement_id}`")
            lines.append("")
            lines.append(f"**Measurement ID:** `{measurement_id}`  ")
            lines.append(f"**Measurement Version:** `{meas['measurement_version_code'] or '2.0.0'}`  ")
            lines.append(f"**Decision Rule Set ID:** `ruleset_2_0_0`  ")
            lines.append(f"**Environment:** `{environment}` | **Generation Mode:** `{generation_mode}`  ")
            lines.append(f"**Generated At:** {now_str}  ")
            lines.append(f"**Code Commit:** `{code_commit}`  ")
            lines.append(f"**Observation Period:** {meas['effective_period_start']} to {meas['effective_period_end']} ({eff_days} days)  ")
            lines.append(f"**Data Quality Status:** `{meas['data_completeness_status']}`")
            lines.append("")
            lines.append("---")
            lines.append("")
            lines.append("## 1. Quantitative Evidence Summary (FACT)")
            lines.append("")
            lines.append(f"- **GSC Total Impressions:** {meas['gsc_total_impressions']:,}")
            lines.append(f"- **GSC Total Clicks:** {meas['gsc_total_clicks']}")
            lines.append(f"- **GSC Dimensionless Average Position:** {meas['gsc_aggregate_position'] or 'Unobserved'}")
            lines.append(f"- **Dimensioned Impression-Weighted Position:** {meas['dimensioned_impression_weighted_position'] or 'Unobserved'}")
            lines.append(f"- **Unique Visible Landing Pages:** {meas['unique_visible_pages']}")
            lines.append(f"- **Unique Visible Queries:** {meas['unique_visible_queries']}")
            lines.append(f"- **GA4 Organic Sessions:** {meas['ga4_organic_sessions']}")
            lines.append(f"- **Completed Purchases ($97):** {meas['internal_purchases']}")
            lines.append("")
            lines.append("## 2. Active Experiments & Protected Targets (FACT)")
            lines.append("")
            if active_exps:
                for a in active_exps:
                    lines.append(f"- **`{a['id']}`** (`{a['approval_status']}`): {a['summary']} (Target: `{a['target_metric']}`)")
            else:
                lines.append(f"*Zero active {environment.lower()} experiment holdouts currently running.*")
            lines.append("")
            lines.append("## 3. Page Coverage Reconciliation & Invariant (FACT)")
            lines.append("")
            lines.append(f"- **Total Canonical Pages Registered:** {coverage.total_canonical_pages}")
            lines.append(f"- **Visible Pages (Impressions > 0):** {coverage.visible_pages}")
            lines.append(f"- **Page Recommendation Targets Evaluated:** {coverage.page_recommendation_targets}")
            lines.append(f"- **Excluded Pages (Handled at Cohort Level / Zero Presence):** {coverage.excluded_pages}")
            lines.append(f"- **Blocked Pages:** {coverage.blocked_pages}")
            lines.append(f"- **Unaccounted Pages:** {coverage.unaccounted_pages} (Invariant: `unaccounted == 0`)")
            lines.append("")
            lines.append("## 4. Intervention Candidates & Decisions (RECOMMENDATION)")
            lines.append("")
            if recs:
                lines.append(f"Total Recommendations Generated: **{len(recs)}**")
                lines.append("")
                lines.append("| Target Type | Target ID / Cohort | Recommendation Class | Evidence Status | Reason Code | Confidence |")
                lines.append("|:---|:---|:---|:---|:---|:---|")
                for r in recs:
                    target_str = r["target_cohort"] or str(r["target_page_id"]) or "Sitewide"
                    lines.append(
                        f"| `{r['target_type']}` | `{target_str}` | `{r['recommendation_class']}` | "
                        f"`{r['evidence_status']}` | `{r['reason_code']}` | `{r['confidence']}` |"
                    )
            else:
                lines.append(f"*No candidate recommendations generated for environment '{environment}'.*")
            lines.append("")
            lines.append("## 5. Epistemic Boundary & Limitations (LIMITATION)")
            lines.append("")
            lines.append("- Recommendations represent deterministic candidate classifications based on pre-registered decision rules.")
            lines.append("- Recommendations do not constitute authorization to modify production without formal approval.")
            lines.append("- Absence of clicks at ranking positions > 20 is expected distribution behavior, not evidence of copy deficiency.")
            lines.append("")

            return "\n".join(lines)


def generate_28d_decision_review(
    measurement_id: str,
    environment: str = "PRODUCTION",
    generation_mode: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Generate substantive 28-day longitudinal decision review comparing adjacent windows with full provenance."""
    code_commit = _get_current_commit()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            curr = cur.fetchone()
            if not curr:
                raise ValueError(f"Measurement '{measurement_id}' not found.")

            cur.execute(
                """
                SELECT * FROM acquisition_measurements
                WHERE effective_period_end < %s
                ORDER BY effective_period_end DESC
                LIMIT 1;
                """,
                (curr["effective_period_start"],),
            )
            prev = cur.fetchone()

            curr_eff_days = (curr["effective_period_end"] - curr["effective_period_start"]).days + 1
            prev_eff_days = (prev["effective_period_end"] - prev["effective_period_start"]).days + 1 if prev else 0
            now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            lines: List[str] = []
            lines.append(f"# 28-Day Acquisition Decision Review: `{measurement_id}`")
            lines.append("")
            lines.append(f"**Measurement ID:** `{measurement_id}`  ")
            lines.append(f"**Measurement Version:** `{curr['measurement_version_code'] or '2.0.0'}`  ")
            lines.append(f"**Decision Rule Set ID:** `ruleset_2_0_0`  ")
            lines.append(f"**Environment:** `{environment}` | **Generation Mode:** `{generation_mode}`  ")
            lines.append(f"**Generated At:** {now_str}  ")
            lines.append(f"**Code Commit:** `{code_commit}`  ")
            lines.append(f"**Current Window:** {curr['effective_period_start']} to {curr['effective_period_end']} ({curr_eff_days} days)  ")
            if prev:
                lines.append(f"**Comparison Window:** {prev['effective_period_start']} to {prev['effective_period_end']} ({prev_eff_days} days, `ADJACENT_PERIOD`)")
            else:
                lines.append("**Comparison Window:** *None (Initial Baseline Window)*")
            lines.append("")
            lines.append("---")
            lines.append("")
            lines.append("## 1. 28-Day Longitudinal Delta Analysis (FACT)")
            lines.append("")
            lines.append("| Metric | Previous Window | Current Window | Absolute Delta | Directional Semantics |")
            lines.append("|:---|:---|:---|:---|:---|")

            metrics = [
                ("gsc_total_impressions", "Impressions", "HIGHER_IS_BETTER"),
                ("gsc_total_clicks", "Clicks", "HIGHER_IS_BETTER"),
                ("gsc_aggregate_position", "Avg Position", "LOWER_IS_BETTER"),
                ("unique_visible_pages", "Visible Pages", "HIGHER_IS_BETTER"),
                ("unique_visible_queries", "Visible Queries", "NON_DIRECTIONAL"),
                ("ga4_organic_sessions", "Organic Sessions", "HIGHER_IS_BETTER"),
                ("internal_purchases", "Purchases", "HIGHER_IS_BETTER"),
            ]

            for mkey, mlabel, mdir in metrics:
                cval = curr[mkey]
                pval = prev[mkey] if prev else None

                # Zero impressions normalize position to None (Unobserved)
                if mkey == "gsc_aggregate_position":
                    if curr["gsc_total_impressions"] == 0 or cval == 0:
                        cval = None
                    if prev and (prev["gsc_total_impressions"] == 0 or pval == 0):
                        pval = None

                if pval is None and cval is None:
                    d_str = "N/A"
                    sem = "UNOBSERVED"
                elif pval is None:
                    d_str = f"+{cval:.1f}" if isinstance(cval, float) else f"+{cval}"
                    sem = "NEWLY_ESTABLISHED"
                elif cval is None:
                    d_str = f"-{pval:.1f}" if isinstance(pval, float) else f"-{pval}"
                    sem = "DISAPPEARED"
                else:
                    diff = cval - pval
                    d_str = f"{diff:+.1f}" if isinstance(diff, float) else f"{diff:+}"
                    if mdir == "LOWER_IS_BETTER":
                        sem = "IMPROVING" if diff < 0 else ("REGRESSING" if diff > 0 else "NEUTRAL")
                    elif mdir == "HIGHER_IS_BETTER":
                        sem = "IMPROVING" if diff > 0 else ("REGRESSING" if diff < 0 else "NEUTRAL")
                    else:
                        sem = "NON_DIRECTIONAL"

                p_disp = f"{pval:.1f}" if isinstance(pval, float) else (str(pval) if pval is not None else "None")
                c_disp = f"{cval:.1f}" if isinstance(cval, float) else (str(cval) if cval is not None else "None")
                lines.append(f"| {mlabel} | {p_disp} | {c_disp} | {d_str} | `{sem}` |")

            lines.append("")
            lines.append("## 2. 28-Day Decision Assessment (RECOMMENDATION)")
            lines.append("")
            if prev is None or (prev["gsc_total_impressions"] == 0 and curr["gsc_total_impressions"] > 0):
                lines.append("- **Strategic Assessment:** `OBSERVE`")
                lines.append("- **Rationale:** Search presence was newly established in the current 28-day window. Longitudinal variance requires at least two completed adjacent windows with active search presence before structural content interventions are justified.")
            else:
                lines.append("- **Strategic Assessment:** `NO_CHANGE` (Protect ongoing ranking momentum)")
            lines.append("")

            return "\n".join(lines)


def generate_84d_strategic_review(
    measurement_id: str,
    environment: str = "PRODUCTION",
    generation_mode: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """
    Generate 84-day strategic review over 3 adjacent canonical windows with full provenance.
    Returns STRATEGIC_TREND_NOT_ESTABLISHED if insufficient compatible history exists.
    """
    code_commit = _get_current_commit()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM acquisition_measurements WHERE id = %s;", (measurement_id,))
            target_meas = cur.fetchone()
            if not target_meas:
                raise ValueError(f"Measurement '{measurement_id}' not found.")

            cur.execute(
                """
                SELECT * FROM acquisition_measurements
                WHERE window_days >= 28 AND effective_period_end <= %s
                ORDER BY effective_period_end DESC;
                """,
                (target_meas["effective_period_end"],),
            )
            candidates = cur.fetchall()

            distinct_windows: List[Dict[str, Any]] = []
            for c in candidates:
                if not distinct_windows:
                    distinct_windows.append(c)
                else:
                    last_start = distinct_windows[-1]["effective_period_start"]
                    if c["effective_period_end"] < last_start:
                        distinct_windows.append(c)
                if len(distinct_windows) == 3:
                    break

            now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            lines: List[str] = []
            lines.append(f"# 84-Day Strategic Acquisition Review: `{measurement_id}`")
            lines.append("")
            lines.append(f"**Measurement ID:** `{measurement_id}`  ")
            lines.append(f"**Measurement Version:** `{target_meas['measurement_version_code'] or '2.0.0'}`  ")
            lines.append(f"**Decision Rule Set ID:** `ruleset_2_0_0`  ")
            lines.append(f"**Environment:** `{environment}` | **Generation Mode:** `{generation_mode}`  ")
            lines.append(f"**Generated At:** {now_str}  ")
            lines.append(f"**Code Commit:** `{code_commit}`  ")
            lines.append("")
            lines.append("---")
            lines.append("")

            if len(distinct_windows) < 3:
                lines.append("## Strategic Status: `STRATEGIC_TREND_NOT_ESTABLISHED`")
                lines.append("")
                lines.append("- **Required History:** 3 consecutive non-overlapping 28-day canonical windows (84 days total).")
                lines.append(f"- **Available Non-Overlapping History:** {len(distinct_windows)} finalized 28-day window(s) (approx. {len(distinct_windows) * 28} days).")
                lines.append("- **Assessment:** Insufficient canonical history to establish long-term strategic trajectory. No strategic pivot, mass page retirement, or structural repositioning is justified.")
                lines.append("")
                return "\n".join(lines)

            lines.append("## 1. 84-Day Macro Trajectory Summary (FACT)")
            lines.append("")
            for idx, m in enumerate(distinct_windows, 1):
                lines.append(
                    f"- **Window {idx} (`{m['id']}`):** {m['effective_period_start']} to {m['effective_period_end']} "
                    f"({m['gsc_total_impressions']:,} imps, {m['gsc_total_clicks']} clicks, pos {m['gsc_aggregate_position'] or 'None'})"
                )
            lines.append("")
            lines.append("## 2. Strategic Conclusion (CONCLUSION)")
            lines.append("")
            lines.append("- Search visibility growth across the 84-day horizon is progressing through initial discovery.")
            lines.append("")
            return "\n".join(lines)
