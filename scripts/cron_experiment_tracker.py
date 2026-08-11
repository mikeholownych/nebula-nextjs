#!/usr/bin/env python3
"""Cron script for experiment tracking (Feature 7).

For each experiment with status='running', refreshes:
- current_score: latest completed audit for (user email, url) in nebula_audit
- current_position / current_ctr: last-28-day GSC searchAnalytics for the
  page, when the user has a GSC connection (token refreshed when expired)

Usage:
    python scripts/cron_experiment_tracker.py

Designed to run daily:
    15 6 * * * /home/mike/nebula/venv/bin/python /home/mike/nebula/scripts/cron_experiment_tracker.py >> /var/log/nebula/cron_experiment_tracker.log 2>&1
"""

import asyncio
import logging
import sys
import urllib.parse
from datetime import datetime, timedelta, timezone

import httpx
import psycopg

# Configuration (same pattern as scripts/cron_reaudit.py)
PLATFORM_DB_CONNINFO = (
    "host=/var/run/postgresql port=5433 dbname=nebula_platform user=postgres"
)
AUDIT_DB_CONNINFO = (
    "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [cron_experiment_tracker] %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def _refresh_gsc_token(refresh_token: str) -> dict | None:
    """Refresh a GSC access token via the platform oauth helper."""
    try:
        from platform_api.gsc.oauth import refresh_gsc_token

        return refresh_gsc_token(refresh_token)
    except Exception as e:
        logger.warning(f"GSC token refresh failed: {e}")
        return None


async def _gsc_page_metrics(
    client: httpx.AsyncClient,
    access_token: str,
    site_url: str,
    page_url: str,
) -> tuple[float | None, float | None]:
    """Last-28-day (position, ctr) for one page, or (None, None)."""
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=27)
    encoded_site = urllib.parse.quote(site_url, safe="")
    api_url = (
        "https://www.googleapis.com/webmasters/v3/sites/"
        f"{encoded_site}/searchAnalytics/query"
    )
    payload = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": [],
        "dimensionFilterGroups": [
            {
                "filters": [
                    {
                        "dimension": "page",
                        "operator": "equals",
                        "expression": page_url,
                    }
                ]
            }
        ],
        "rowLimit": 1,
    }
    try:
        resp = await client.post(
            api_url,
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )
        if resp.status_code != 200:
            logger.warning(
                f"  GSC query for {page_url} returned HTTP {resp.status_code}"
            )
            return None, None
        rows = resp.json().get("rows", [])
        if not rows:
            return None, None
        r = rows[0]
        return round(float(r.get("position", 0.0)), 1), round(
            float(r.get("ctr", 0.0)), 4
        )
    except Exception as e:
        logger.warning(f"  GSC query failed for {page_url}: {e}")
        return None, None


async def main():
    """Refresh current metrics for all running experiments."""
    logger.info("Starting experiment tracker cron run")
    processed = 0
    errors = 0

    async with await psycopg.AsyncConnection.connect(
        PLATFORM_DB_CONNINFO
    ) as platform_conn, await psycopg.AsyncConnection.connect(
        AUDIT_DB_CONNINFO
    ) as audit_conn:

        # Fetch running experiments + owner email + GSC connection (if any)
        async with platform_conn.cursor() as cur:
            await cur.execute(
                """
                SELECT e.id, e.url, u.email,
                       g.access_token, g.refresh_token, g.token_expiry,
                       g.gsc_site_url, g.user_id
                FROM experiments e
                JOIN users u ON u.id = e.user_id
                LEFT JOIN gsc_connections g ON g.user_id = e.user_id
                WHERE e.status = 'running'
                ORDER BY e.created_at ASC
                LIMIT 500
                """
            )
            experiments = await cur.fetchall()

        if not experiments:
            logger.info("No running experiments found. Exiting.")
            return

        logger.info(f"Found {len(experiments)} running experiment(s)")

        async with httpx.AsyncClient(timeout=20.0) as client:
            for (
                exp_id,
                url,
                email,
                access_token,
                refresh_token,
                token_expiry,
                gsc_site_url,
                gsc_user_id,
            ) in experiments:
                try:
                    # 1. Latest audit score (0-100 scale) from nebula_audit
                    score = None
                    if email:
                        async with audit_conn.cursor() as cur:
                            await cur.execute(
                                """
                                SELECT score FROM audits
                                WHERE email = %s AND url = %s
                                  AND status = 'completed'
                                ORDER BY created_at DESC
                                LIMIT 1
                                """,
                                (email.strip().lower(), url),
                            )
                            row = await cur.fetchone()
                            if row and row[0] is not None:
                                score = round(float(row[0]), 1)

                    # 2. GSC page metrics (if connected)
                    position = None
                    ctr = None
                    if gsc_site_url:
                        now = datetime.now(timezone.utc)
                        if (
                            not access_token
                            or (
                                token_expiry is not None
                                and token_expiry.replace(tzinfo=timezone.utc)
                                <= now + timedelta(minutes=5)
                            )
                        ):
                            if refresh_token:
                                refreshed = await asyncio.to_thread(
                                    _refresh_gsc_token, refresh_token
                                )
                                if refreshed:
                                    access_token = refreshed["access_token"]
                                    async with platform_conn.cursor() as cur:
                                        await cur.execute(
                                            """
                                            UPDATE gsc_connections
                                            SET access_token = %s,
                                                token_expiry = %s
                                            WHERE user_id = %s
                                            """,
                                            (
                                                access_token,
                                                refreshed.get("expiry"),
                                                gsc_user_id,
                                            ),
                                        )
                                    await platform_conn.commit()
                        if access_token:
                            position, ctr = await _gsc_page_metrics(
                                client, access_token, gsc_site_url, url
                            )

                    # 3. Persist
                    async with platform_conn.cursor() as cur:
                        await cur.execute(
                            """
                            UPDATE experiments
                            SET current_score = %s,
                                current_position = %s,
                                current_ctr = %s
                            WHERE id = %s
                            """,
                            (score, position, ctr, exp_id),
                        )
                    await platform_conn.commit()
                    processed += 1
                    logger.info(
                        f"  ✓ {url} - score={score} position={position} ctr={ctr}"
                    )

                except Exception as e:
                    logger.error(f"  ✗ Error processing experiment {exp_id}: {e}")
                    errors += 1

    logger.info(
        f"Experiment tracker cron complete: {processed} processed, {errors} errors"
    )


if __name__ == "__main__":
    asyncio.run(main())
