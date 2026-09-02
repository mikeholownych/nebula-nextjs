"""Metric Semantics Registry and Materiality Evaluation Engine.

Provides metric-specific directionality, comparison methods, materiality rules,
and low-volume denominator protection.
"""

from typing import Any, Dict, Optional
import psycopg
from psycopg.rows import dict_row

from acquisition.models import DEFAULT_DB_URI, MetricSemantics


FALLBACK_METRIC_SEMANTICS: Dict[str, MetricSemantics] = {
    "gsc_total_impressions": MetricSemantics(
        metric_name="gsc_total_impressions",
        metric_family="GSC",
        preferred_direction="HIGHER_IS_BETTER",
        comparison_method="PERCENTAGE_DELTA",
        materiality_rule={"pct_threshold": 0.10, "abs_min": 50},
        low_volume_rule="NONE",
        low_volume_threshold=10,
        null_semantics="ZERO_PRESENCE_NULL",
        eligibility_requirements={"min_days": 28},
        description="Total sitewide Google Search Console impressions.",
    ),
    "gsc_total_clicks": MetricSemantics(
        metric_name="gsc_total_clicks",
        metric_family="GSC",
        preferred_direction="HIGHER_IS_BETTER",
        comparison_method="PERCENTAGE_DELTA",
        materiality_rule={"pct_threshold": 0.15, "abs_min": 5},
        low_volume_rule="ABSOLUTE_FIRST",
        low_volume_threshold=5,
        null_semantics="ZERO_PRESENCE_NULL",
        eligibility_requirements={"min_days": 28},
        description="Total sitewide Google Search Console organic clicks.",
    ),
    "gsc_aggregate_position": MetricSemantics(
        metric_name="gsc_aggregate_position",
        metric_family="GSC",
        preferred_direction="LOWER_IS_BETTER",
        comparison_method="POSITION_AWARE",
        materiality_rule={"abs_threshold": 3.0, "rank_step": 5.0},
        low_volume_rule="NONE",
        low_volume_threshold=100,
        null_semantics="ZERO_PRESENCE_NULL",
        eligibility_requirements={"min_days": 28, "min_impressions": 100},
        description="Dimensionless aggregate average position across all search queries.",
    ),
    "dimensioned_impression_weighted_position": MetricSemantics(
        metric_name="dimensioned_impression_weighted_position",
        metric_family="GSC",
        preferred_direction="LOWER_IS_BETTER",
        comparison_method="POSITION_AWARE",
        materiality_rule={"abs_threshold": 2.5, "rank_step": 5.0},
        low_volume_rule="NONE",
        low_volume_threshold=100,
        null_semantics="ZERO_PRESENCE_NULL",
        eligibility_requirements={"min_days": 28, "min_impressions": 100},
        description="Impression-weighted average position computed over dimensioned rows.",
    ),
    "gsc_average_ctr": MetricSemantics(
        metric_name="gsc_average_ctr",
        metric_family="GSC",
        preferred_direction="HIGHER_IS_BETTER",
        comparison_method="PERCENTAGE_DELTA",
        materiality_rule={"abs_threshold": 0.005, "pct_threshold": 0.20},
        low_volume_rule="NONE",
        low_volume_threshold=100,
        null_semantics="ZERO_PRESENCE_NULL",
        eligibility_requirements={"min_days": 28, "min_impressions": 100, "max_avg_position": 20.0},
        description="Click-through rate from GSC impressions to clicks.",
    ),
    "unique_visible_pages": MetricSemantics(
        metric_name="unique_visible_pages",
        metric_family="GSC",
        preferred_direction="HIGHER_IS_BETTER",
        comparison_method="ABSOLUTE_DELTA",
        materiality_rule={"abs_threshold": 3},
        low_volume_rule="NONE",
        low_volume_threshold=5,
        null_semantics="DEFAULT_ZERO",
        eligibility_requirements={"min_days": 28},
        description="Count of distinct canonical landing pages receiving at least 1 impression.",
    ),
    "unique_visible_queries": MetricSemantics(
        metric_name="unique_visible_queries",
        metric_family="GSC",
        preferred_direction="NON_DIRECTIONAL",
        comparison_method="PERCENTAGE_DELTA",
        materiality_rule={"pct_threshold": 0.15, "abs_min": 10},
        low_volume_rule="NONE",
        low_volume_threshold=10,
        null_semantics="DEFAULT_ZERO",
        eligibility_requirements={"min_days": 28},
        description="Count of distinct search queries returning search impressions.",
    ),
    "ga4_organic_sessions": MetricSemantics(
        metric_name="ga4_organic_sessions",
        metric_family="GA4",
        preferred_direction="HIGHER_IS_BETTER",
        comparison_method="PERCENTAGE_DELTA",
        materiality_rule={"pct_threshold": 0.10, "abs_min": 20},
        low_volume_rule="NONE",
        low_volume_threshold=10,
        null_semantics="DEFAULT_ZERO",
        eligibility_requirements={"min_days": 28},
        description="Total organic search landing sessions from GA4.",
    ),
    "internal_audit_started": MetricSemantics(
        metric_name="internal_audit_started",
        metric_family="INTERNAL",
        preferred_direction="HIGHER_IS_BETTER",
        comparison_method="ABSOLUTE_DELTA",
        materiality_rule={"abs_threshold": 2},
        low_volume_rule="ABSOLUTE_FIRST",
        low_volume_threshold=5,
        null_semantics="DEFAULT_ZERO",
        eligibility_requirements={"min_days": 28},
        description="Internal audit workflow initiation events.",
    ),
    "internal_purchases": MetricSemantics(
        metric_name="internal_purchases",
        metric_family="INTERNAL",
        preferred_direction="HIGHER_IS_BETTER",
        comparison_method="ABSOLUTE_DELTA",
        materiality_rule={"abs_threshold": 1},
        low_volume_rule="ABSOLUTE_FIRST",
        low_volume_threshold=5,
        null_semantics="DEFAULT_ZERO",
        eligibility_requirements={"min_days": 28},
        description="Completed $97 audit purchase transactions from platform ledger.",
    ),
}


def get_metric_semantics(
    metric_name: str, db_uri: str = DEFAULT_DB_URI
) -> MetricSemantics:
    """Retrieve metric semantics from database registry with fallback."""
    try:
        with psycopg.connect(db_uri, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM metric_semantics_registry WHERE metric_name = %s;",
                    (metric_name,),
                )
                row = cur.fetchone()
                if row:
                    return MetricSemantics(
                        metric_name=row["metric_name"],
                        metric_family=row["metric_family"],
                        preferred_direction=row["preferred_direction"],
                        comparison_method=row["comparison_method"],
                        materiality_rule=row["materiality_rule"],
                        low_volume_rule=row["low_volume_rule"],
                        low_volume_threshold=row["low_volume_threshold"],
                        null_semantics=row["null_semantics"],
                        eligibility_requirements=row["eligibility_requirements"],
                        description=row["description"],
                    )
    except Exception:
        pass

    return FALLBACK_METRIC_SEMANTICS.get(
        metric_name,
        MetricSemantics(
            metric_name=metric_name,
            metric_family="OTHER",
            preferred_direction="HIGHER_IS_BETTER",
            comparison_method="PERCENTAGE_DELTA",
            materiality_rule={"pct_threshold": 0.10},
            low_volume_rule="NONE",
            low_volume_threshold=5,
            null_semantics="DEFAULT_ZERO",
            description=f"Generic semantics for {metric_name}",
        ),
    )


def evaluate_metric_materiality(
    metric_name: str,
    pre_val: Optional[float],
    post_val: Optional[float],
    semantics: Optional[MetricSemantics] = None,
    db_uri: str = DEFAULT_DB_URI,
) -> Dict[str, Any]:
    """
    Evaluate movement between pre_val and post_val according to metric-specific semantics.
    
    Returns:
        is_material (bool): Whether movement is statistically and substantively material.
        direction (str): 'IMPROVING', 'REGRESSING', 'NEUTRAL', 'UNESTABLISHED'
        delta_value (Optional[float]): Absolute difference (post_val - pre_val)
        delta_pct (Optional[float]): Percentage difference
        is_low_volume (bool): Whether sample size requires low volume protection
        rationale (str): Human-readable explanation of materiality decision
    """
    if semantics is None:
        semantics = get_metric_semantics(metric_name, db_uri=db_uri)

    # 1. Null / Unobserved Presence Cases
    if pre_val is None and post_val is None:
        return {
            "is_material": False,
            "direction": "NEUTRAL",
            "delta_value": None,
            "delta_pct": None,
            "is_low_volume": True,
            "rationale": f"{metric_name} was unobserved in both observation windows.",
        }

    if pre_val is None and post_val is not None:
        return {
            "is_material": True if post_val > 0 else False,
            "direction": "UNESTABLISHED",
            "delta_value": post_val,
            "delta_pct": None,
            "is_low_volume": post_val < semantics.low_volume_threshold,
            "rationale": f"{metric_name} was newly established ({post_val:.1f}). No prior baseline existed.",
        }

    if pre_val is not None and post_val is None:
        return {
            "is_material": True,
            "direction": "REGRESSING" if semantics.preferred_direction == "HIGHER_IS_BETTER" else "IMPROVING",
            "delta_value": -pre_val,
            "delta_pct": -1.0,
            "is_low_volume": pre_val < semantics.low_volume_threshold,
            "rationale": f"{metric_name} presence disappeared entirely ({pre_val:.1f} -> unobserved).",
        }

    delta_val = post_val - pre_val
    delta_pct = (delta_val / pre_val) if pre_val != 0 else (1.0 if post_val > 0 else 0.0)

    # 2. Check Low-Volume Protection (ABSOLUTE_FIRST)
    is_low_volume = (
        pre_val < semantics.low_volume_threshold
        and post_val < semantics.low_volume_threshold
    )

    if semantics.low_volume_rule == "ABSOLUTE_FIRST" and is_low_volume:
        abs_threshold = semantics.materiality_rule.get("abs_threshold", 1.0)
        is_material = abs(delta_val) >= abs_threshold

        if delta_val > 0:
            dir_str = "IMPROVING" if semantics.preferred_direction == "HIGHER_IS_BETTER" else "REGRESSING"
        elif delta_val < 0:
            dir_str = "REGRESSING" if semantics.preferred_direction == "HIGHER_IS_BETTER" else "IMPROVING"
        else:
            dir_str = "NEUTRAL"

        return {
            "is_material": is_material,
            "direction": dir_str,
            "delta_value": delta_val,
            "delta_pct": delta_pct if pre_val > 0 else None,
            "is_low_volume": True,
            "rationale": f"Low volume count moved from {pre_val:.0f} to {post_val:.0f} (delta={delta_val:+.0f}). Small sample warning.",
        }

    # 3. Position-Aware Materiality (LOWER_IS_BETTER)
    if semantics.comparison_method == "POSITION_AWARE":
        abs_threshold = semantics.materiality_rule.get("abs_threshold", 3.0)
        is_material = abs(delta_val) >= abs_threshold

        # In search rankings: delta_val < 0 means rank improved (e.g. 64.3 -> 44.4 = -19.9)
        if delta_val <= -abs_threshold:
            dir_str = "IMPROVING"
        elif delta_val >= abs_threshold:
            dir_str = "REGRESSING"
        else:
            dir_str = "NEUTRAL"

        return {
            "is_material": is_material,
            "direction": dir_str,
            "delta_value": delta_val,
            "delta_pct": delta_pct,
            "is_low_volume": is_low_volume,
            "rationale": f"Average position moved from {pre_val:.1f} to {post_val:.1f} ({delta_val:+.1f} ranks, threshold={abs_threshold:.1f}).",
        }

    # 4. Absolute Delta Materiality
    if semantics.comparison_method == "ABSOLUTE_DELTA":
        abs_threshold = semantics.materiality_rule.get("abs_threshold", 1.0)
        is_material = abs(delta_val) >= abs_threshold

        if delta_val >= abs_threshold:
            dir_str = "IMPROVING" if semantics.preferred_direction == "HIGHER_IS_BETTER" else "REGRESSING"
        elif delta_val <= -abs_threshold:
            dir_str = "REGRESSING" if semantics.preferred_direction == "HIGHER_IS_BETTER" else "IMPROVING"
        else:
            dir_str = "NEUTRAL"

        return {
            "is_material": is_material,
            "direction": dir_str,
            "delta_value": delta_val,
            "delta_pct": delta_pct,
            "is_low_volume": is_low_volume,
            "rationale": f"Count changed from {pre_val:.0f} to {post_val:.0f} (delta={delta_val:+.0f}, threshold={abs_threshold:.0f}).",
        }

    # 5. Non-Directional Metric (e.g. unique_visible_queries)
    if semantics.preferred_direction == "NON_DIRECTIONAL":
        pct_threshold = semantics.materiality_rule.get("pct_threshold", 0.15)
        abs_min = semantics.materiality_rule.get("abs_min", 10)
        is_material = abs(delta_pct) >= pct_threshold and abs(delta_val) >= abs_min

        return {
            "is_material": is_material,
            "direction": "NEUTRAL",
            "delta_value": delta_val,
            "delta_pct": delta_pct,
            "is_low_volume": is_low_volume,
            "rationale": f"Non-directional metric shifted by {delta_pct:+.1%} ({pre_val:.0f} -> {post_val:.0f}).",
        }

    # 6. Standard Percentage Delta Materiality (HIGHER_IS_BETTER)
    pct_threshold = semantics.materiality_rule.get("pct_threshold", 0.10)
    abs_min = semantics.materiality_rule.get("abs_min", 0)
    is_material = abs(delta_pct) >= pct_threshold and abs(delta_val) >= abs_min

    if delta_pct >= pct_threshold and delta_val >= abs_min:
        dir_str = "IMPROVING"
    elif delta_pct <= -pct_threshold and abs(delta_val) >= abs_min:
        dir_str = "REGRESSING"
    else:
        dir_str = "NEUTRAL"

    return {
        "is_material": is_material,
        "direction": dir_str,
        "delta_value": delta_val,
        "delta_pct": delta_pct,
        "is_low_volume": is_low_volume,
        "rationale": f"Metric shifted by {delta_pct:+.1%} ({pre_val:.0f} -> {post_val:.0f}, delta={delta_val:+.0f}).",
    }
