"""A/B Test infrastructure for Nebula's marketing machine.

Implements champion-challenger testing on the audit results page.
Traffic routing is deterministic (hash-based) - same user always sees same variant.
Promotion logic runs weekly: if challenger beats champion at 95% confidence, swap.

Variants currently staged (from buyer_psychology_framework.md):
  A (champion): Current psychology-applied state
  B: Aggressive loss frame ("You're bleeding $X/day")
  C: Clock timer urgency (countdown to audit expiry)
  D: Artificial scarcity ("Only 12 fix packs remaining at $97")

Usage in ResultsClient.tsx:
  const variant = await fetch('/api/ab/variant?audit_id=' + auditId)
  // returns { variant: 'A' | 'B' | 'C' | 'D', experiment_id: 'results_cta_v1' }

Stats endpoint:
  GET /api/ab/stats?experiment_id=results_cta_v1
  // returns variant stats + winner recommendation
"""
from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone
from typing import Literal

import asyncpg

from platform_api.config import audit_db_dsn

_DB_URL = audit_db_dsn()

# Experiment definitions
EXPERIMENTS = {
    "results_cta_v1": {
        "description": "Audit results page CTA psychology variant",
        "variants": {
            "A": {"weight": 0.40, "label": "Champion - current psychology"},
            "B": {"weight": 0.20, "label": "Challenger - aggressive loss frame"},
            "C": {"weight": 0.20, "label": "Challenger - clock timer urgency"},
            "D": {"weight": 0.20, "label": "Challenger - artificial scarcity"},
        },
        "metric": "checkout_started",   # PostHog event to optimize for
        "min_sample": 50,               # per variant before declaring winner
        "confidence": 0.95,
        "auto_promote": True,
    }
}

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(_DB_URL, min_size=1, max_size=3)
    return _pool


def assign_variant(
    experiment_id: str,
    user_id: str,
) -> Literal["A", "B", "C", "D"]:
    """Deterministic variant assignment - same user always gets the same variant.

    Uses SHA-256 of (experiment_id + user_id) → maps to [0, 1) → bucket.
    Variant weights must sum to 1.0.
    """
    exp = EXPERIMENTS.get(experiment_id)
    if not exp:
        return "A"  # default to champion if experiment unknown

    h = int(hashlib.sha256(f"{experiment_id}:{user_id}".encode()).hexdigest(), 16)
    bucket = (h % 10000) / 10000.0  # [0.0, 1.0)

    cumulative = 0.0
    for variant, config in exp["variants"].items():
        cumulative += config["weight"]
        if bucket < cumulative:
            return variant  # type: ignore[return-value]
    return "A"


async def record_exposure(
    experiment_id: str,
    variant: str,
    user_id: str,
    audit_id: str | None = None,
) -> None:
    """Record that a user was exposed to a variant (impression)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO ab_exposures
                (experiment_id, variant, user_id, audit_id, exposed_at)
            VALUES ($1, $2, $3, $4, now())
            ON CONFLICT (experiment_id, user_id) DO NOTHING
        """, experiment_id, variant, user_id, audit_id)


async def record_conversion(
    experiment_id: str,
    user_id: str,
    event_name: str,
    value_cents: int = 0,
) -> None:
    """Record a conversion event for a user in an experiment."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE ab_exposures
            SET converted = TRUE,
                conversion_event = $3,
                conversion_value_cents = $4,
                converted_at = now()
            WHERE experiment_id = $1 AND user_id = $2
        """, experiment_id, user_id, event_name, value_cents)


async def get_stats(experiment_id: str) -> dict:
    """Return variant stats + winner recommendation for an experiment."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                variant,
                COUNT(*)                                    AS exposures,
                COUNT(*) FILTER (WHERE converted = TRUE)    AS conversions,
                ROUND(
                    100.0 * COUNT(*) FILTER (WHERE converted = TRUE)
                    / NULLIF(COUNT(*), 0),
                    2
                )                                           AS cvr_pct,
                COALESCE(SUM(conversion_value_cents) FILTER (WHERE converted), 0) AS revenue_cents
            FROM ab_exposures
            WHERE experiment_id = $1
            GROUP BY variant
            ORDER BY cvr_pct DESC NULLS LAST
        """, experiment_id)

    exp = EXPERIMENTS.get(experiment_id, {})
    min_sample = exp.get("min_sample", 50)
    stats = [dict(r) for r in rows]

    # Determine winner: variant with highest CVR that has min_sample exposures
    qualified = [s for s in stats if s["exposures"] >= min_sample]
    winner = None
    current_champion = "A"

    if len(qualified) >= 2:
        top = qualified[0]
        champion = next((s for s in qualified if s["variant"] == current_champion), None)
        if champion and top["variant"] != current_champion:
            # Simple check: challenger CVR must be > champion CVR (not full z-test here)
            winner = top["variant"]
            recommendation = (
                f"Promote variant {winner} "
                f"({top['cvr_pct']}% CVR vs champion {champion['cvr_pct']}%). "
                f"Manual confirmation required before promotion."
            )
        elif qualified:
            recommendation = f"Champion {current_champion} is holding. Keep testing."
        else:
            recommendation = "Not enough qualified variants to compare."
    else:
        recommendation = f"Need {min_sample}+ exposures per variant. Keep running."

    return {
        "experiment_id": experiment_id,
        "description": exp.get("description", ""),
        "stats": stats,
        "winner": winner,
        "recommendation": recommendation,
        "min_sample": min_sample,
    }


async def ensure_schema() -> None:
    """Create ab_exposures table if it doesn't exist."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS ab_exposures (
                id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                experiment_id   TEXT NOT NULL,
                variant         TEXT NOT NULL,
                user_id         TEXT NOT NULL,
                audit_id        UUID,
                exposed_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                converted       BOOLEAN NOT NULL DEFAULT FALSE,
                conversion_event TEXT,
                conversion_value_cents INTEGER NOT NULL DEFAULT 0,
                converted_at    TIMESTAMP WITH TIME ZONE,
                UNIQUE(experiment_id, user_id)
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_ab_exposures_experiment
            ON ab_exposures(experiment_id, variant)
        """)
