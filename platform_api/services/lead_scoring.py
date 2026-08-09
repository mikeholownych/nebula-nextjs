"""Rule-based lead scoring with time decay.

Score = sum of trigger weights, decayed exponentially over time.
Updated on every new audit, page visit, email open, or purchase.

Score tiers:
  0-24:  Cold     → newsletter nurture only
  25-49: Warm     → newsletter + lead magnet follow-up
  50-74: Hot      → direct outreach (AgentMail sequence)
  75-99: Buying   → priority outreach + same-day follow-up
  100:   Customer → purchased, move to delivery + upsell track

Decay: score × 0.85 per day of inactivity (half-life ~4 days)
"""
from __future__ import annotations

import asyncio
import math
import os
from datetime import datetime, timezone, timedelta

import asyncpg

_DB_URL = os.getenv(
    "AUDIT_DATABASE_URL",
    "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
)

# ── Scoring weights ───────────────────────────────────────────────────────────

TRIGGERS = {
    # Intent signals — what they did
    "ran_audit":              20,  # ran the free audit
    "viewed_results":         15,  # viewed results page (>30s)
    "clicked_fix_pack_cta":   25,  # clicked the $97 CTA
    "started_checkout":       35,  # opened Stripe checkout
    "purchased":             100,  # purchased fix pack (overrides all)
    # Engagement signals
    "opened_email":            5,
    "clicked_email_link":     10,
    "returned_to_site":       15,  # second visit to audit page
    "subscribed_newsletter":  10,
    "downloaded_magnet":      10,
    # Intent amplifiers — what we know about them
    "high_audit_score_delta": 15,  # low score + ad spend context = more pain
    "objection_price":        -5,  # price objection = lower near-term score
    "replied_to_email":       20,  # any reply = high intent
}

DECAY_RATE = 0.85      # per day of inactivity
DECAY_FLOOR = 5        # don't decay below this (keeps them warm)
HOT_THRESHOLD = 50
BUYING_THRESHOLD = 75


# ── Score computation ─────────────────────────────────────────────────────────

def apply_decay(score: float, last_activity_at: datetime) -> float:
    """Exponential decay: score × 0.85^days_inactive"""
    if score <= DECAY_FLOOR:
        return DECAY_FLOOR
    days_inactive = max(0, (datetime.now(timezone.utc) - last_activity_at).days)
    decayed = score * (DECAY_RATE ** days_inactive)
    return max(DECAY_FLOOR, round(decayed, 1))


def score_to_tier(score: float) -> str:
    if score >= 100:
        return "customer"
    if score >= BUYING_THRESHOLD:
        return "buying"
    if score >= HOT_THRESHOLD:
        return "hot"
    if score >= 25:
        return "warm"
    return "cold"


def tier_to_action(tier: str) -> str:
    return {
        "customer": "delivery_track: send fix pack + schedule 30-day re-audit",
        "buying":   "priority_outreach: AgentMail same-day, offer 15-min call",
        "hot":      "direct_outreach: AgentMail sequence within 24h",
        "warm":     "nurture: newsletter + lead magnet follow-up",
        "cold":     "passive: newsletter only, no outbound",
    }[tier]


# ── Database operations ────────────────────────────────────────────────────────

async def get_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(_DB_URL, min_size=1, max_size=3)


async def compute_score_from_events(pool: asyncpg.Pool, email: str) -> dict:
    """Derive a fresh score from raw event tables."""
    async with pool.acquire() as conn:
        # Audit events
        audit_row = await conn.fetchrow("""
            SELECT
                COUNT(*)                                     AS audit_count,
                MAX(score)                                   AS best_score,
                MAX(created_at)                              AS last_audit_at,
                BOOL_OR(paid_at IS NOT NULL)                 AS has_purchased
            FROM audits
            WHERE email = $1
        """, email)

        # Purchase events
        purchase_row = await conn.fetchrow("""
            SELECT COUNT(*) AS purchases
            FROM purchases p
            JOIN customers c ON c.id = p.customer_id
            WHERE c.email = $1 AND p.status = 'completed'
        """, email)

        # Email engagement
        email_row = await conn.fetchrow("""
            SELECT open_count, click_count, last_opened_at
            FROM newsletter_subscribers
            WHERE email = $1
        """, email)

        # Feedback/objections
        obj_row = await conn.fetchrow("""
            SELECT COUNT(*) FILTER (WHERE objection_reason = 'too_expensive') AS price_obj
            FROM crm_feedback
            WHERE customer_email = $1 AND interaction_type = 'objection'
        """, email)

    # Short-circuit: purchased
    if purchase_row and purchase_row["purchases"] > 0:
        return {
            "email": email,
            "score": 100,
            "tier": "customer",
            "action": tier_to_action("customer"),
            "triggers": ["purchased"],
            "last_activity_at": datetime.now(timezone.utc).isoformat(),
        }

    score = 0.0
    triggers = []
    last_activity_at = datetime.now(timezone.utc) - timedelta(days=30)

    if audit_row and audit_row["audit_count"]:
        score += TRIGGERS["ran_audit"]
        triggers.append("ran_audit")
        if audit_row["last_audit_at"]:
            last_activity_at = max(last_activity_at, audit_row["last_audit_at"].replace(tzinfo=timezone.utc))

        # Low score = more pain = higher intent
        if audit_row["best_score"] is not None and audit_row["best_score"] <= 5:
            score += TRIGGERS["high_audit_score_delta"]
            triggers.append("high_audit_score_delta")

    if email_row:
        if email_row["open_count"]:
            opens = min(email_row["open_count"], 3)  # cap at 3× weight
            score += TRIGGERS["opened_email"] * opens
            triggers.append(f"opened_email×{opens}")
        if email_row["click_count"]:
            score += TRIGGERS["clicked_email_link"]
            triggers.append("clicked_email_link")
        if email_row["last_opened_at"]:
            last_activity_at = max(last_activity_at, email_row["last_opened_at"].replace(tzinfo=timezone.utc))

    if obj_row and obj_row["price_obj"]:
        score += TRIGGERS["objection_price"]
        triggers.append("objection_price")

    # Apply decay
    score = apply_decay(score, last_activity_at)
    tier = score_to_tier(score)

    return {
        "email": email,
        "score": round(score, 1),
        "tier": tier,
        "action": tier_to_action(tier),
        "triggers": triggers,
        "last_activity_at": last_activity_at.isoformat(),
    }


async def update_crm_score(pool: asyncpg.Pool, email: str) -> dict:
    """Compute + persist score back to customers table."""
    result = await compute_score_from_events(pool, email)
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE customers
            SET crm_status = $2, updated_at = now()
            WHERE email = $1
        """, email, result["tier"])
    return result


async def decay_all_scores(pool: asyncpg.Pool) -> int:
    """Run daily: decay scores for all inactive prospects. Returns rows updated."""
    async with pool.acquire() as conn:
        # Find prospects with stale last_contact or no recent audit
        rows = await conn.fetch("""
            SELECT c.email,
                   GREATEST(
                       COALESCE(c.last_contact_at, c.created_at),
                       COALESCE((SELECT MAX(a.created_at) FROM audits a WHERE a.email = c.email), c.created_at)
                   ) AS last_active_at
            FROM customers c
            WHERE c.crm_status NOT IN ('customer', 'churned')
              AND GREATEST(
                  COALESCE(c.last_contact_at, c.created_at),
                  COALESCE((SELECT MAX(a.created_at) FROM audits a WHERE a.email = c.email), c.created_at)
              ) < now() - INTERVAL '2 days'
        """)

    updated = 0
    for row in rows:
        result = await compute_score_from_events(pool, row["email"])
        async with pool.acquire() as conn:
            res = await conn.execute("""
                UPDATE customers SET crm_status = $2, updated_at = now()
                WHERE email = $1 AND crm_status != $2
            """, row["email"], result["tier"])
        if res == "UPDATE 1":
            updated += 1
    return updated


if __name__ == "__main__":
    async def test():
        pool = await get_pool()
        # Score a test email
        result = await compute_score_from_events(pool, "test@nebulacrm.dev")
        print(f"Score:  {result['score']}")
        print(f"Tier:   {result['tier']}")
        print(f"Action: {result['action']}")
        print(f"Triggers: {result['triggers']}")
        await pool.close()

    asyncio.run(test())
