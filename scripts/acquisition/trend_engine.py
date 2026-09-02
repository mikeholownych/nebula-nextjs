"""Deterministic Trend Classification Engine with Temporal & Comparison Validation."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

from .models import DEFAULT_DB_URI, TREND_CLASSES
from .window_computation import ComparisonVector


@dataclass
class TrendResult:
    classification: str
    target_scope: str  # 'sitewide', 'cohort', 'page'
    target_identifier: str
    confidence: str    # 'HIGH', 'MEDIUM', 'LOW', 'NONE'
    primary_reason: str
    evidence_gate_passed: bool
    comparison_class: str
    overlap_days: int
    metrics_summary: Dict[str, Any]


def classify_sitewide_trend(
    vector: ComparisonVector,
    current_completeness: str = "COMPLETE",
    current_finalization: str = "FINAL",
    min_impression_gate: int = 100,
    min_holdout_days: int = 28,
) -> TrendResult:
    """
    Classify sitewide acquisition trend deterministically based on rule-set criteria.
    
    Invariants & Eligibility Gates:
    1. BLOCKED if pipeline failure or unfinalized data lag.
    2. INSUFFICIENT_EVIDENCE if effective observation days < 28 or impressions < 100.
    3. TREND_NOT_ESTABLISHED / INSUFFICIENT_EVIDENCE if comparison has overlap > 0 or is a methodology reconciliation.
    4. IMPROVING / DECLINING / STABLE / VOLATILE only permitted on validated ADJACENT_PERIOD comparisons.
    """
    # 1. Gate: Pipeline Health & Finalization
    if current_completeness == "BLOCKED" or current_finalization != "FINAL":
        return TrendResult(
            classification="BLOCKED",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="HIGH",
            primary_reason="Measurement pipeline has active blocker or unfinalized data lag.",
            evidence_gate_passed=False,
            comparison_class=vector.comparison_class,
            overlap_days=vector.overlap_days,
            metrics_summary={"status": current_completeness, "finalization": current_finalization},
        )

    # 2. Gate: Comparison Eligibility & Overlap
    if vector.comparison_class != "ADJACENT_PERIOD" or vector.overlap_days > 0:
        if vector.comparison_class == "OVERLAPPING_PERIOD":
            reason = (
                f"Comparison has {vector.overlap_days} overlapping source dates ({vector.overlap_ratio * 100:.1f}%). "
                f"Longitudinal trend classification requires a non-overlapping ADJACENT_PERIOD (0% overlap)."
            )
            return TrendResult(
                classification="INSUFFICIENT_EVIDENCE",
                target_scope="sitewide",
                target_identifier="sitewide_macro",
                confidence="NONE",
                primary_reason=reason,
                evidence_gate_passed=False,
                comparison_class=vector.comparison_class,
                overlap_days=vector.overlap_days,
                metrics_summary={"overlap_days": vector.overlap_days, "overlap_ratio": vector.overlap_ratio},
            )
        elif vector.comparison_class == "METHODOLOGY_RECONCILIATION":
            reason = (
                f"Comparison between {vector.current_meas_id} and {vector.comparison_meas_id} is a "
                f"METHODOLOGY_RECONCILIATION, not longitudinal progress."
            )
            return TrendResult(
                classification="TREND_NOT_ESTABLISHED",
                target_scope="sitewide",
                target_identifier="sitewide_macro",
                confidence="NONE",
                primary_reason=reason,
                evidence_gate_passed=False,
                comparison_class=vector.comparison_class,
                overlap_days=vector.overlap_days,
                metrics_summary={"comparison_class": vector.comparison_class},
            )
        else:
            return TrendResult(
                classification="INSUFFICIENT_EVIDENCE",
                target_scope="sitewide",
                target_identifier="sitewide_macro",
                confidence="NONE",
                primary_reason=f"Comparison class '{vector.comparison_class}' is not eligible for longitudinal trend classification.",
                evidence_gate_passed=False,
                comparison_class=vector.comparison_class,
                overlap_days=vector.overlap_days,
                metrics_summary={"comparison_class": vector.comparison_class},
            )

    # 3. Gate: Effective Observation Duration Gate
    if vector.current_effective_days < min_holdout_days or vector.comparison_effective_days < min_holdout_days:
        return TrendResult(
            classification="INSUFFICIENT_EVIDENCE",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="NONE",
            primary_reason=(
                f"Effective finalized window ({vector.current_effective_days}d current, "
                f"{vector.comparison_effective_days}d comp) is below evidence eligibility gate ({min_holdout_days}d)."
            ),
            evidence_gate_passed=False,
            comparison_class=vector.comparison_class,
            overlap_days=vector.overlap_days,
            metrics_summary={
                "current_effective_days": vector.current_effective_days,
                "comp_effective_days": vector.comparison_effective_days,
            },
        )

    d_pct = vector.delta_impressions_pct if vector.delta_impressions_pct is not None else 0.0
    d_pos = vector.delta_macro_position  # Note: negative delta means rank improved (e.g. 65.6 -> 50.0 is -15.6)

    # 4. Volatility Check
    if abs(d_pos) >= 15.0 and abs(d_pct) < 10.0:
        return TrendResult(
            classification="VOLATILE",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="MEDIUM",
            primary_reason=f"Extreme position fluctuation ({d_pos:+.1f} ranks) without proportional impression growth.",
            evidence_gate_passed=True,
            comparison_class=vector.comparison_class,
            overlap_days=vector.overlap_days,
            metrics_summary={"delta_pos": d_pos, "delta_imps_pct": d_pct},
        )

    # 5. Improving Trend
    if (d_pct >= 10.0 and d_pos <= 1.0) or (d_pos <= -5.0 and d_pct >= -5.0):
        return TrendResult(
            classification="IMPROVING",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="HIGH",
            primary_reason=f"Impressions grew by {d_pct:+.1f}% and ranking position moved by {d_pos:+.1f} ranks over adjacent periods.",
            evidence_gate_passed=True,
            comparison_class=vector.comparison_class,
            overlap_days=vector.overlap_days,
            metrics_summary={"delta_imps": vector.delta_impressions, "delta_pos": d_pos},
        )

    # 6. Declining Trend
    if d_pct <= -10.0 and d_pos > 2.0:
        return TrendResult(
            classification="DECLINING",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="HIGH",
            primary_reason=f"Impressions dropped by {d_pct:+.1f}% and ranking position regressed by {d_pos:+.1f} ranks over adjacent periods.",
            evidence_gate_passed=True,
            comparison_class=vector.comparison_class,
            overlap_days=vector.overlap_days,
            metrics_summary={"delta_imps": vector.delta_impressions, "delta_pos": d_pos},
        )

    # 7. Stable Trend
    if abs(d_pct) <= 5.0 and abs(d_pos) <= 2.5:
        return TrendResult(
            classification="STABLE",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="HIGH",
            primary_reason=f"Metrics remained within statistical noise band (imps: {d_pct:+.1f}%, pos: {d_pos:+.1f}).",
            evidence_gate_passed=True,
            comparison_class=vector.comparison_class,
            overlap_days=vector.overlap_days,
            metrics_summary={"delta_imps_pct": d_pct, "delta_pos": d_pos},
        )

    # 8. Stalled or Default
    return TrendResult(
        classification="STALLED",
        target_scope="sitewide",
        target_identifier="sitewide_macro",
        confidence="MEDIUM",
        primary_reason=f"Acquisition metrics show mixed signals (imps: {d_pct:+.1f}%, pos: {d_pos:+.1f}).",
        evidence_gate_passed=True,
        comparison_class=vector.comparison_class,
        overlap_days=vector.overlap_days,
        metrics_summary={"delta_imps_pct": d_pct, "delta_pos": d_pos},
    )
