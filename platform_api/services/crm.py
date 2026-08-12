"""CRM service - PostgreSQL-backed marketing machine.

Covers:
  • prospect / customer lifecycle tracking (UTM, crm_status, LTV)
  • feedback / objection logging
  • newsletter subscriber management
  • weekly review snapshots

All writes are idempotent or upsert-safe.
"""
from __future__ import annotations

import os
import hashlib
import secrets
from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

import asyncpg

# ── Connection ───────────────────────────────────────────────────────────────

_AUDIT_DB_URL = os.getenv(
    "AUDIT_DATABASE_URL",
    "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
)

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(_AUDIT_DB_URL, min_size=1, max_size=5)
    return _pool


# ── Newsletter ────────────────────────────────────────────────────────────────


async def newsletter_subscribe(
    email: str,
    *,
    name: str | None = None,
    role: str | None = None,
    utm_source: str | None = None,
    utm_medium: str | None = None,
    utm_campaign: str | None = None,
) -> dict:
    """Upsert a pending newsletter subscriber and return a one-time token.

    Every signup starts unconfirmed. The raw token is returned only to the
    caller that sends the confirmation email; only its SHA-256 hash is stored.
    """
    confirmation_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(confirmation_token.encode()).hexdigest()
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO newsletter_subscribers
                (email, name, role, utm_source, utm_medium, utm_campaign,
                 confirmation_token_hash, is_confirmed)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO UPDATE SET
                name          = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
                role          = COALESCE(EXCLUDED.role, newsletter_subscribers.role),
                utm_source    = COALESCE(newsletter_subscribers.utm_source, EXCLUDED.utm_source),
                utm_medium    = COALESCE(newsletter_subscribers.utm_medium, EXCLUDED.utm_medium),
                utm_campaign  = COALESCE(newsletter_subscribers.utm_campaign, EXCLUDED.utm_campaign),
                unsubscribed_at = NULL,
                confirmation_token_hash = EXCLUDED.confirmation_token_hash,
                confirmation_sent_at = NULL,
                is_confirmed = FALSE
            RETURNING *
            """,
            email, name, role, utm_source, utm_medium, utm_campaign,
            token_hash, False,
        )
    result = dict(row)
    result["confirmation_token"] = confirmation_token
    return result


async def newsletter_mark_confirmation_sent(email: str) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE newsletter_subscribers SET confirmation_sent_at = now() WHERE email = $1",
            email,
        )


async def newsletter_confirm(token: str) -> bool:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            """
            UPDATE newsletter_subscribers
               SET is_confirmed = TRUE,
                   confirmation_token_hash = NULL
             WHERE confirmation_token_hash = $1
               AND unsubscribed_at IS NULL
            """,
            token_hash,
        )
    return result == "UPDATE 1"


async def newsletter_unsubscribe(email: str) -> bool:
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE newsletter_subscribers SET unsubscribed_at = now() WHERE email = $1",
            email,
        )
    return result == "UPDATE 1"


async def newsletter_record_open(email: str) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE newsletter_subscribers
            SET last_opened_at = now(), open_count = open_count + 1
            WHERE email = $1
            """,
            email,
        )


async def newsletter_record_send(email: str) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE newsletter_subscribers
            SET last_email_sent_at = now(), emails_sent_count = emails_sent_count + 1
            WHERE email = $1
            """,
            email,
        )


async def newsletter_active_subscribers() -> list[dict]:
    """Return all confirmed, unsubscribed=NULL subscribers."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT * FROM newsletter_subscribers
            WHERE unsubscribed_at IS NULL AND is_confirmed = TRUE
            ORDER BY subscribed_at DESC
            """
        )
    return [dict(r) for r in rows]


async def newsletter_subscriber_count() -> int:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT COUNT(*) FROM newsletter_subscribers WHERE unsubscribed_at IS NULL"
        )
    return row["count"]


# ── Prospects / Customers ─────────────────────────────────────────────────────


async def upsert_prospect(
    email: str,
    *,
    utm_source: str | None = None,
    utm_medium: str | None = None,
    utm_campaign: str | None = None,
    audit_score: int | None = None,
) -> dict:
    """Create or update a customer row with CRM marketing fields.

    Preserves original UTM (first-touch attribution) - only fills if blank.
    Updates last_score and increments audit_count on each audit.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Ensure the customer exists (may already exist from platform auth)
        await conn.execute(
            """
            INSERT INTO customers (email, utm_source, utm_medium, utm_campaign)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE SET
                utm_source   = COALESCE(customers.utm_source, EXCLUDED.utm_source),
                utm_medium   = COALESCE(customers.utm_medium, EXCLUDED.utm_medium),
                utm_campaign = COALESCE(customers.utm_campaign, EXCLUDED.utm_campaign),
                updated_at   = now()
            """,
            email, utm_source, utm_medium, utm_campaign,
        )
        # If we have a new score, bump audit_count + last_score
        if audit_score is not None:
            await conn.execute(
                """
                UPDATE customers
                SET audit_count = audit_count + 1,
                    last_score  = $2,
                    updated_at  = now()
                WHERE email = $1
                """,
                email, audit_score,
            )
        row = await conn.fetchrow("SELECT * FROM customers WHERE email = $1", email)
    return dict(row)


async def update_crm_status(email: str, status: str, notes: str | None = None) -> None:
    """Set crm_status: cold | interested | purchased | pro_subscriber | churned."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE customers
            SET crm_status      = $2,
                crm_notes       = COALESCE($3, crm_notes),
                last_contact_at = now(),
                updated_at      = now()
            WHERE email = $1
            """,
            email, status, notes,
        )


async def update_lifetime_value(email: str) -> int:
    """Recalculate and store LTV from purchases table. Returns new LTV cents."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT COALESCE(SUM(p.amount_cents), 0) AS ltv
            FROM purchases p
            JOIN customers c ON c.id = p.customer_id
            WHERE c.email = $1 AND p.status = 'completed'
            """,
            email,
        )
        ltv = row["ltv"]
        await conn.execute(
            "UPDATE customers SET lifetime_value_cents = $2, updated_at = now() WHERE email = $1",
            email, ltv,
        )
    return ltv


async def get_prospects_by_source() -> list[dict]:
    """Attribution breakdown: audits + revenue grouped by UTM source."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                COALESCE(c.utm_source, 'direct') AS utm_source,
                COUNT(DISTINCT c.id)              AS unique_customers,
                COUNT(a.id)                       AS audits,
                COUNT(p.id)                       AS purchases,
                COALESCE(SUM(p.amount_cents), 0)  AS revenue_cents,
                ROUND(
                    100.0 * COUNT(p.id) / NULLIF(COUNT(DISTINCT c.id), 0),
                    2
                )                                 AS conversion_rate_pct
            FROM customers c
            LEFT JOIN audits    a ON a.email = c.email
            LEFT JOIN purchases p ON p.customer_id = c.id AND p.status = 'completed'
            GROUP BY COALESCE(c.utm_source, 'direct')
            ORDER BY revenue_cents DESC
            """
        )
    return [dict(r) for r in rows]


async def get_daily_funnel(days: int = 30) -> list[dict]:
    """Daily conversion funnel for the last N days."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                DATE(a.created_at)                      AS day,
                COUNT(DISTINCT a.id)                    AS audits_started,
                COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) AS audits_completed,
                COUNT(DISTINCT CASE WHEN a.score IS NOT NULL THEN a.email END) AS results_viewed,
                COUNT(DISTINCT p.id)                    AS checkouts,
                COALESCE(SUM(p.amount_cents), 0)        AS revenue_cents
            FROM audits a
            LEFT JOIN customers c ON c.email = a.email
            LEFT JOIN purchases p ON p.customer_id = c.id
                AND DATE(p.created_at) = DATE(a.created_at)
                AND p.status = 'completed'
            WHERE a.created_at >= now() - ($1 || ' days')::INTERVAL
            GROUP BY DATE(a.created_at)
            ORDER BY day DESC
            """,
            str(days),
        )
    return [dict(r) for r in rows]


# ── Feedback / Objections ─────────────────────────────────────────────────────


async def log_feedback(
    customer_email: str,
    interaction_type: str,
    *,
    objection_reason: str | None = None,
    source: str | None = None,
    notes: str | None = None,
    follow_up_at: date | None = None,
) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO crm_feedback
                (customer_email, interaction_type, objection_reason,
                 source, notes, follow_up_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            """,
            customer_email, interaction_type, objection_reason,
            source, notes, follow_up_at,
        )
    return dict(row)


async def resolve_feedback(feedback_id: UUID, resolution_type: str, outcome: str) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE crm_feedback
            SET resolved = TRUE, resolution_type = $2, outcome = $3
            WHERE id = $1
            """,
            feedback_id, resolution_type, outcome,
        )


async def open_objections() -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT * FROM crm_feedback
            WHERE resolved = FALSE AND interaction_type = 'objection'
            ORDER BY logged_at DESC
            """
        )
    return [dict(r) for r in rows]


async def objection_summary() -> list[dict]:
    """Top objection reasons + frequency."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                COALESCE(objection_reason, 'unspecified') AS reason,
                COUNT(*)                                   AS frequency,
                COUNT(*) FILTER (WHERE resolved)           AS resolved_count,
                COUNT(*) FILTER (WHERE outcome = 'closed_won') AS won_count
            FROM crm_feedback
            WHERE interaction_type = 'objection'
            GROUP BY COALESCE(objection_reason, 'unspecified')
            ORDER BY frequency DESC
            """
        )
    return [dict(r) for r in rows]


# ── Weekly Review ─────────────────────────────────────────────────────────────


async def save_weekly_review(
    week_starting: date,
    *,
    one_change_text: str,
    one_change_metric: str,
    notes: str | None = None,
) -> dict:
    """Upsert the current week's review entry."""
    # Compute live metrics
    pool = await get_pool()
    async with pool.acquire() as conn:
        metrics = await conn.fetchrow(
            """
            SELECT
                COUNT(DISTINCT a.id)             AS audits_count,
                COUNT(DISTINCT p.id)             AS checkouts_count,
                COALESCE(SUM(p.amount_cents), 0) AS revenue_cents,
                ROUND(
                    100.0 * COUNT(DISTINCT p.id)
                    / NULLIF(COUNT(DISTINCT a.id), 0), 2
                )                                AS conversion_rate_pct
            FROM audits a
            LEFT JOIN customers c ON c.email = a.email
            LEFT JOIN purchases p ON p.customer_id = c.id AND p.status = 'completed'
            WHERE a.created_at >= $1 AND a.created_at < $1 + INTERVAL '7 days'
            """,
            datetime.combine(week_starting, datetime.min.time()),
        )
        nl_count = await conn.fetchrow(
            "SELECT COUNT(*) FROM newsletter_subscribers WHERE subscribed_at >= $1 AND subscribed_at < $1 + INTERVAL '7 days'",
            datetime.combine(week_starting, datetime.min.time()),
        )
        row = await conn.fetchrow(
            """
            INSERT INTO crm_weekly_reviews
                (week_starting, audits_count, checkouts_count, revenue_cents,
                 newsletter_signups, conversion_rate_pct,
                 one_change_text, one_change_metric, notes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (week_starting) DO UPDATE SET
                audits_count       = EXCLUDED.audits_count,
                checkouts_count    = EXCLUDED.checkouts_count,
                revenue_cents      = EXCLUDED.revenue_cents,
                newsletter_signups = EXCLUDED.newsletter_signups,
                conversion_rate_pct= EXCLUDED.conversion_rate_pct,
                one_change_text    = EXCLUDED.one_change_text,
                one_change_metric  = EXCLUDED.one_change_metric,
                notes              = EXCLUDED.notes
            RETURNING *
            """,
            week_starting,
            metrics["audits_count"],
            metrics["checkouts_count"],
            metrics["revenue_cents"],
            nl_count["count"],
            metrics["conversion_rate_pct"],
            one_change_text,
            one_change_metric,
            notes,
        )
    return dict(row)
