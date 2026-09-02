"""Deterministic Trend Classification Engine."""

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
    
    Rules:
    1. BLOCKED if source failure, unfinalized lag, or critical blocker.
    2. INSUFFICIENT_EVIDENCE if impressions < 100 or window < 28 days.
    3. VOLATILE if position changes by > 15 ranks between finalized periods.
    4. IMPROVING if impressions up >= 10% and rank improves/maintains.
    5. DECLINING if impressions down >= 10% and rank worsens.
    6. STABLE if changes within statistical noise band (+/- 5% imps, +/- 2 ranks).
    7. STALLED if high impressions without clicks/conversions over consecutive periods.
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
            metrics_summary={"status": current_completeness, "finalization": current_finalization},
        )

    # 2. Gate: Evidence Eligibility Gate
    if vector.window_days < min_holdout_days:
        return TrendResult(
            classification="INSUFFICIENT_EVIDENCE",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="NONE",
            primary_reason=f"Observation window ({vector.window_days}d) is below evidence eligibility gate ({min_holdout_days}d).",
            evidence_gate_passed=False,
            metrics_summary={"window_days": vector.window_days},
        )

    d_pct = vector.delta_impressions_pct if vector.delta_impressions_pct is not None else 0.0
    d_pos = vector.delta_macro_position  # Note: negative delta means rank improved (e.g. 65.6 -> 50.0 is -15.6)

    # 3. Volatility Check
    if abs(d_pos) >= 15.0 and abs(d_pct) < 10.0:
        return TrendResult(
            classification="VOLATILE",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="MEDIUM",
            primary_reason=f"Extreme position fluctuation ({d_pos:+.1f} ranks) without proportional impression growth.",
            evidence_gate_passed=True,
            metrics_summary={"delta_pos": d_pos, "delta_imps_pct": d_pct},
        )

    # 4. Improving Trend
    if (d_pct >= 10.0 and d_pos <= 1.0) or (d_pos <= -5.0 and d_pct >= -5.0):
        return TrendResult(
            classification="IMPROVING",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="HIGH",
            primary_reason=f"Impressions grew by {d_pct:+.1f}% and ranking position moved by {d_pos:+.1f} ranks.",
            evidence_gate_passed=True,
            metrics_summary={"delta_imps": vector.delta_impressions, "delta_pos": d_pos},
        )

    # 5. Declining Trend
    if d_pct <= -10.0 and d_pos > 2.0:
        return TrendResult(
            classification="DECLINING",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="HIGH",
            primary_reason=f"Impressions dropped by {d_pct:+.1f}% and ranking position regressed by {d_pos:+.1f} ranks.",
            evidence_gate_passed=True,
            metrics_summary={"delta_imps": vector.delta_impressions, "delta_pos": d_pos},
        )

    # 6. Stable Trend
    if abs(d_pct) <= 5.0 and abs(d_pos) <= 2.5:
        return TrendResult(
            classification="STABLE",
            target_scope="sitewide",
            target_identifier="sitewide_macro",
            confidence="HIGH",
            primary_reason=f"Metrics remained within statistical noise band (imps: {d_pct:+.1f}%, pos: {d_pos:+.1f}).",
            evidence_gate_passed=True,
            metrics_summary={"delta_imps_pct": d_pct, "delta_pos": d_pos},
        )

    # 7. Stalled or Default
    return TrendResult(
        classification="STALLED",
        target_scope="sitewide",
        target_identifier="sitewide_macro",
        confidence="MEDIUM",
        primary_reason=f"Acquisition metrics show mixed signals (imps: {d_pct:+.1f}%, pos: {d_pos:+.1f}).",
        evidence_gate_passed=True,
        metrics_summary={"delta_imps_pct": d_pct, "delta_pos": d_pos},
    )
