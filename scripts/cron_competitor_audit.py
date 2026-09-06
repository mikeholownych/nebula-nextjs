#!/usr/bin/env python3
"""Cron script for competitor benchmark audits.

Reads competitor_tracking rows where last_audited_at is stale (> 30 days)
or NULL, triggers a fresh audit for each via the platform audit pipeline,
and updates last_score + last_audited_at.

/audit/run is synchronous (it blocks until the audit completes, up to ~120s)
and returns the score in the response, so no status polling is needed.

Usage:
    python scripts/cron_competitor_audit.py

Designed to run on a cron schedule (e.g. daily):
    30 4 * * * /home/mike/nebula/venv/bin/python /home/mike/nebula/scripts/cron_competitor_audit.py >> /var/log/nebula/cron_competitor_audit.log 2>&1
"""

import argparse
import asyncio
import logging
import sys
from datetime import datetime, timezone

import httpx
import psycopg

# Configuration
DB_CONNINFO = "host=/var/run/postgresql port=5433 dbname=nebula_platform user=postgres"
AUDIT_API_URL = "http://localhost:8001/audit/run"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [cron_competitor_audit] %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Re-audit stale competitor URLs")
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='List stale competitor candidates without submitting audits or updating the database',
    )
    return parser.parse_args(argv)


def should_submit_audit(*, dry_run: bool) -> bool:
    return not dry_run


async def main(*, dry_run: bool = False):
    """Re-audit stale competitor URLs."""
    logger.info("Starting competitor audit cron run")
    processed = 0
    errors = 0

    # Connect to nebula_platform DB to read competitor_tracking
    async with await psycopg.AsyncConnection.connect(DB_CONNINFO) as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT id, user_id, competitor_url
                FROM competitor_tracking
                WHERE last_audited_at IS NULL
                   OR last_audited_at < NOW() - INTERVAL '30 days'
                ORDER BY last_audited_at ASC NULLS FIRST
                LIMIT 50
            """)
            rows = await cur.fetchall()

        if not rows:
            logger.info("No stale competitors found. Exiting.")
            return

        logger.info(f"Found {len(rows)} competitor(s) due for audit")

        if dry_run:
            for tracking_id, user_id, url in rows:
                logger.info(
                    f"DRY RUN candidate: tracking={tracking_id} user={user_id} url={url}"
                )
            logger.info(
                f"Competitor audit dry run complete: {len(rows)} candidate(s), 0 submitted, 0 updated"
            )
            return

        async with httpx.AsyncClient(timeout=150.0) as client:
            for tracking_id, user_id, url in rows:
                try:
                    logger.info(f"Triggering competitor audit for {url} (tracking {tracking_id})")

                    # Synthetic identity keeps competitor audits out of the
                    # user's workspace audit list
                    response = await client.post(
                        AUDIT_API_URL,
                        json={
                            "url": url,
                            "email": f"competitor+{user_id}@internal.nebulacomponents.com",
                            "source": "competitor_cron",
                        },
                    )

                    score = None
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("status") == "completed" and data.get("score") is not None:
                            # /audit/run returns the 0-10 score; store on 0-100 display scale
                            score = round(float(data["score"]) * 10, 1)
                            logger.info(f"  ✓ Audit completed for {url}: score={score}")
                        else:
                            logger.warning(
                                f"  ✗ Audit not completed for {url}: status={data.get('status')}"
                            )
                            errors += 1
                    else:
                        logger.warning(
                            f"  ✗ Audit trigger failed for {url}: "
                            f"HTTP {response.status_code} - {response.text[:200]}"
                        )
                        errors += 1

                    # Stamp last_audited_at regardless of success (prevents
                    # infinite retries on persistent failures); only write
                    # last_score when the audit actually completed
                    now = datetime.now(timezone.utc)
                    async with conn.cursor() as cur:
                        if score is not None:
                            await cur.execute(
                                """
                                UPDATE competitor_tracking
                                SET last_score = %s, last_audited_at = %s
                                WHERE id = %s
                                """,
                                (score, now, tracking_id),
                            )
                        else:
                            await cur.execute(
                                """
                                UPDATE competitor_tracking
                                SET last_audited_at = %s
                                WHERE id = %s
                                """,
                                (now, tracking_id),
                            )
                    await conn.commit()
                    processed += 1

                except Exception as e:
                    logger.error(f"  ✗ Error processing competitor {tracking_id}: {e}")
                    errors += 1

    logger.info(
        f"Competitor audit cron complete: {processed} processed, {errors} errors"
    )


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(dry_run=args.dry_run))
