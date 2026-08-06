#!/usr/bin/env python3
"""Cron script for automated re-audits.

Reads audit_schedules where enabled=true AND next_run_at <= now(),
triggers a new audit for each, and updates next_run_at.

Usage:
    python scripts/cron_reaudit.py

Designed to run on a cron schedule (e.g. every hour):
    0 * * * * /home/mike/nebula/venv/bin/python /home/mike/nebula/scripts/cron_reaudit.py >> /var/log/nebula/cron_reaudit.log 2>&1
"""

import asyncio
import logging
import sys
from datetime import datetime, timedelta, timezone

import httpx
import psycopg

# Configuration
DB_CONNINFO = "host=/var/run/postgresql port=5433 dbname=nebula_platform user=postgres"
AUDIT_API_URL = "http://localhost:8001/audit/run"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [cron_reaudit] %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


async def main():
    """Process due audit schedules."""
    logger.info("Starting re-audit cron run")
    processed = 0
    errors = 0

    # Connect to nebula_platform DB to read schedules
    async with await psycopg.AsyncConnection.connect(DB_CONNINFO) as conn:
        # Fetch all due schedules
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT s.id, s.user_id, s.url, s.interval_days
                FROM audit_schedules s
                JOIN users u ON u.id = s.user_id
                WHERE s.enabled = true
                  AND s.next_run_at <= NOW()
                ORDER BY s.next_run_at ASC
                LIMIT 50
            """)
            schedules = await cur.fetchall()

        if not schedules:
            logger.info("No due schedules found. Exiting.")
            return

        logger.info(f"Found {len(schedules)} due schedule(s)")

        async with httpx.AsyncClient(timeout=130.0) as client:
            for schedule_id, user_id, url, interval_days in schedules:
                try:
                    logger.info(f"Triggering audit for {url} (schedule {schedule_id})")

                    # Trigger audit via platform API
                    response = await client.post(
                        AUDIT_API_URL,
                        json={
                            "url": url,
                            "source": "cron_reaudit",
                        },
                    )

                    if response.status_code == 200:
                        data = response.json()
                        audit_id = data.get("audit_id", "unknown")
                        status = data.get("status", "unknown")
                        logger.info(
                            f"  ✓ Audit {audit_id} status={status} for {url}"
                        )
                    else:
                        logger.warning(
                            f"  ✗ Audit trigger failed for {url}: "
                            f"HTTP {response.status_code} — {response.text[:200]}"
                        )
                        errors += 1

                    # Update next_run_at regardless of audit success
                    # (prevents infinite retries on persistent failures)
                    next_run = datetime.now(timezone.utc) + timedelta(days=interval_days)
                    async with conn.cursor() as cur:
                        await cur.execute(
                            """
                            UPDATE audit_schedules
                            SET next_run_at = %s
                            WHERE id = %s
                            """,
                            (next_run, schedule_id),
                        )
                    await conn.commit()
                    processed += 1

                except Exception as e:
                    logger.error(f"  ✗ Error processing schedule {schedule_id}: {e}")
                    errors += 1

    logger.info(
        f"Re-audit cron complete: {processed} processed, {errors} errors"
    )


if __name__ == "__main__":
    asyncio.run(main())
