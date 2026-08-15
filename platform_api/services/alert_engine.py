"""Marketing machine alert engine.

Runs every 15 minutes via cron. Compares today's metrics against the
7-day rolling baseline and fires Telegram alerts on anomalies.

Alerts defined:
  • CVR drop  - audit→checkout conversion rate falls 20%+ below baseline
  • CPL spike - cost-per-audit-start implied by source mix changes (proxy)
  • Audit drought - zero audits in 6h during business hours
  • Newsletter churn - unsubscribes spike (>5 in a day)
  • Feedback flood - 3+ open objections of the same type in 24h

Delivered to: Telegram (via Hermes cron deliver channel)
Silence rules: no repeat alert for same metric within 4h
"""
from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import asyncpg

# ── Config ────────────────────────────────────────────────────────────────────

_DB_URL = os.getenv(
    "AUDIT_DATABASE_URL",
    "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
)

ALERT_THRESHOLDS = {
    "cvr_drop_pct": 20,       # alert if CVR drops more than 20% below 7-day avg
    "audit_drought_hours": 6, # alert if no audits in N hours (8am-10pm ET only)
    "newsletter_churn_day": 5,# alert if >5 unsubs in last 24h
    "objection_flood_count": 3,# alert if same objection type 3+ times in 24h
}

# Silence file - prevents repeat alerts for same metric within 4h
SILENCE_FILE = Path("/tmp/nebula_alert_silences.json")


def load_silences() -> dict:
    if SILENCE_FILE.exists():
        try:
            return json.loads(SILENCE_FILE.read_text())
        except Exception:
            return {}
    return {}


def save_silences(silences: dict) -> None:
    SILENCE_FILE.write_text(json.dumps(silences))


def is_silenced(key: str) -> bool:
    silences = load_silences()
    if key not in silences:
        return False
    silenced_until = datetime.fromisoformat(silences[key])
    return datetime.now(timezone.utc) < silenced_until


def silence(key: str, hours: int = 4) -> None:
    silences = load_silences()
    silences[key] = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
    save_silences(silences)


# ── Database queries ──────────────────────────────────────────────────────────

async def get_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(_DB_URL, min_size=1, max_size=3)


async def check_cvr(pool: asyncpg.Pool) -> list[str]:
    """Compare today's CVR vs 7-day rolling average. Alert if drop > threshold."""
    alerts = []
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            WITH daily AS (
                SELECT
                    DATE(a.created_at) AS day,
                    COUNT(DISTINCT a.id)    AS audits,
                    COUNT(DISTINCT p.id)    AS purchases
                FROM audits a
                LEFT JOIN customers c ON c.email = a.email
                LEFT JOIN purchases p ON p.customer_id = c.id
                    AND p.status = 'completed'
                    AND DATE(p.created_at) = DATE(a.created_at)
                WHERE a.created_at >= now() - INTERVAL '8 days'
                GROUP BY DATE(a.created_at)
            )
            SELECT
                -- Today
                SUM(CASE WHEN day = CURRENT_DATE THEN audits ELSE 0 END)    AS today_audits,
                SUM(CASE WHEN day = CURRENT_DATE THEN purchases ELSE 0 END) AS today_purchases,
                -- 7-day avg (exclude today)
                ROUND(AVG(CASE WHEN day < CURRENT_DATE THEN
                    CASE WHEN audits > 0 THEN 100.0 * purchases / audits ELSE 0 END
                END), 2) AS baseline_cvr_pct
            FROM daily
        """)

    if not row or row["today_audits"] is None or row["today_audits"] < 5:
        return alerts  # not enough data today

    today_cvr = (
        100.0 * float(row["today_purchases"]) / float(row["today_audits"])
        if row["today_audits"] > 0 else 0
    )
    baseline = float(row["baseline_cvr_pct"] or 0)

    if baseline > 0:
        drop_pct = 100 * (baseline - today_cvr) / baseline
        if drop_pct >= ALERT_THRESHOLDS["cvr_drop_pct"] and not is_silenced("cvr_drop"):
            alerts.append(
                f"⚠️ *CVR DROP ALERT*\n"
                f"Today: {today_cvr:.1f}% ({row['today_purchases']} purchases / {row['today_audits']} audits)\n"
                f"7-day baseline: {baseline:.1f}%\n"
                f"Drop: {drop_pct:.0f}% - exceeds {ALERT_THRESHOLDS['cvr_drop_pct']}% threshold\n"
                f"_Check: results page, checkout flow, Stripe_"
            )
            silence("cvr_drop")

    return alerts


async def check_audit_drought(pool: asyncpg.Pool) -> list[str]:
    """Alert if no audits in last N hours during business hours (8am-10pm ET)."""
    alerts = []
    now_et_hour = (datetime.now(timezone.utc) - timedelta(hours=4)).hour
    if not (8 <= now_et_hour <= 22):
        return alerts  # outside business hours, don't alert

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT COUNT(*) AS cnt
            FROM audits
            WHERE created_at >= now() - ($1 || ' hours')::INTERVAL
        """, str(ALERT_THRESHOLDS["audit_drought_hours"]))

    if row["cnt"] == 0 and not is_silenced("audit_drought"):
        alerts.append(
            f"🚨 *AUDIT DROUGHT*\n"
            f"Zero audits in the last {ALERT_THRESHOLDS['audit_drought_hours']} hours.\n"
            f"_Check: site uptime, audit form, Cloudflare_"
        )
        silence("audit_drought", hours=6)

    return alerts


async def check_newsletter_churn(pool: asyncpg.Pool) -> list[str]:
    """Alert if unusual unsubscribe spike in last 24h."""
    alerts = []
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT COUNT(*) AS cnt
            FROM newsletter_subscribers
            WHERE unsubscribed_at >= now() - INTERVAL '24 hours'
        """)

    if row["cnt"] >= ALERT_THRESHOLDS["newsletter_churn_day"] and not is_silenced("nl_churn"):
        alerts.append(
            f"📉 *NEWSLETTER CHURN SPIKE*\n"
            f"{row['cnt']} unsubscribes in the last 24 hours.\n"
            f"_Review: last email sent, subject line, content quality_"
        )
        silence("nl_churn")

    return alerts


async def check_objection_flood(pool: asyncpg.Pool) -> list[str]:
    """Alert if 3+ objections of the same type in 24h."""
    alerts = []
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                COALESCE(objection_reason, 'unspecified') AS reason,
                COUNT(*) AS cnt
            FROM crm_feedback
            WHERE interaction_type = 'objection'
              AND logged_at >= now() - INTERVAL '24 hours'
            GROUP BY COALESCE(objection_reason, 'unspecified')
            HAVING COUNT(*) >= $1
        """, ALERT_THRESHOLDS["objection_flood_count"])

    for row in rows:
        key = f"objection_flood_{row['reason']}"
        if not is_silenced(key):
            alerts.append(
                f"🔁 *OBJECTION PATTERN DETECTED*\n"
                f"Reason: `{row['reason']}`\n"
                f"Count: {row['cnt']} in last 24h\n"
                f"_Action: update messaging or pricing page to address this objection_"
            )
            silence(key)

    return alerts


async def check_daily_summary(pool: asyncpg.Pool) -> list[str]:
    """Daily 8 AM ET summary - always fires once per day."""
    now_et = datetime.now(timezone.utc) - timedelta(hours=4)
    if now_et.hour != 8 or is_silenced("daily_summary"):
        return []

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT
                COUNT(DISTINCT a.id)    AS audits_today,
                COUNT(DISTINCT p.id)    AS purchases_today,
                COALESCE(SUM(p.amount_cents), 0) AS revenue_today,
                (SELECT COUNT(*) FROM newsletter_subscribers
                 WHERE subscribed_at >= CURRENT_DATE) AS nl_signups_today
            FROM audits a
            LEFT JOIN customers c ON c.email = a.email
            LEFT JOIN purchases p ON p.customer_id = c.id
                AND p.status = 'completed'
                AND DATE(p.created_at) = CURRENT_DATE
            WHERE DATE(a.created_at) = CURRENT_DATE
        """)

    cvr = (
        100.0 * row["purchases_today"] / row["audits_today"]
        if row["audits_today"] > 0 else 0
    )

    summary = [
        f"📊 *Daily Marketing Summary - {now_et.strftime('%b %d')}*\n"
        f"Audits: {row['audits_today']}\n"
        f"Purchases: {row['purchases_today']} (${row['revenue_today'] / 100:.2f})\n"
        f"CVR: {cvr:.1f}%\n"
        f"Newsletter signups: {row['nl_signups_today']}"
    ]
    silence("daily_summary", hours=20)
    return summary


# ── Main ──────────────────────────────────────────────────────────────────────

async def run_alerts() -> list[str]:
    pool = await get_pool()
    try:
        results = await asyncio.gather(
            check_cvr(pool),
            check_audit_drought(pool),
            check_newsletter_churn(pool),
            check_objection_flood(pool),
            check_daily_summary(pool),
        )
        all_alerts = [msg for group in results for msg in group]
        return all_alerts
    finally:
        await pool.close()


if __name__ == "__main__":
    alerts = asyncio.run(run_alerts())
    if alerts:
        for alert in alerts:
            print(alert)
            print()
    else:
        print("✓ No alerts - all metrics within normal range")
