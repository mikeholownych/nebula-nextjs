#!/usr/bin/env python3
"""Cron script: weekly workspace digest (email + optional Slack).

Runs daily (e.g. 9am); each user is processed only on their digest_day
(default monday). Idempotent per ISO week via a JSON state file - a
double-run never double-sends.

Usage:
    python scripts/cron_weekly_digest.py [--dry-run]

Cron:
    0 9 * * * /home/mike/nebula/venv/bin/python /home/mike/nebula/scripts/cron_weekly_digest.py >> /var/log/nebula/cron_weekly_digest.log 2>&1
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone

import psycopg

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from platform_api.digest.builder import build_digest_for_user
from platform_api.digest.sender import send_email_digest, send_slack_digest

DB_CONNINFO = "host=/var/run/postgresql port=5433 dbname=nebula_platform user=postgres"
STATE_FILE = "/home/mike/nebula/.digest_state.json"

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [cron_weekly_digest] %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def week_key(now: datetime) -> str:
    iso = now.isocalendar()
    return f"{iso.year}W{iso.week:02d}"


def load_state() -> dict:
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def save_state(state: dict) -> None:
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, STATE_FILE)


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    now = datetime.now(timezone.utc)
    today = DAYS[now.weekday()]
    wk = week_key(now)
    logger.info("Starting weekly digest run (week=%s, day=%s, dry_run=%s)", wk, today, dry_run)

    state = load_state()
    sent_this_week = set(state.get(wk, []))

    with psycopg.connect(DB_CONNINFO) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.email,
                       COALESCE(wp.preferences->>'digest_enabled', 'true') AS digest_enabled,
                       COALESCE(wp.preferences->>'digest_day', 'monday') AS digest_day,
                       wp.preferences->>'slack_webhook_url' AS slack_webhook_url
                FROM users u
                LEFT JOIN workspace_preferences wp ON wp.email = u.email
                WHERE u.status = 'active' AND u.email IS NOT NULL
                """
            )
            users = cur.fetchall()

    sent = skipped = failed = 0

    for email, digest_enabled, digest_day, slack_webhook_url in users:
        email = email.strip().lower()
        if digest_enabled == "false":
            skipped += 1
            continue
        if digest_day not in DAYS:
            digest_day = "monday"
        if digest_day != today:
            skipped += 1
            continue
        if email in sent_this_week:
            logger.info("Already sent this week, skipping %s", email)
            skipped += 1
            continue

        try:
            digest = build_digest_for_user(email)
        except Exception as e:
            logger.error("Digest build failed for %s: %s", email, e)
            failed += 1
            continue

        if digest is None:
            logger.info("No audits for %s - skipping (never send empty digests)", email)
            skipped += 1
            continue

        email_result = send_email_digest(digest, dry_run=dry_run)
        if email_result.get("status") not in ("sent", "dry-run"):
            logger.error("Email send failed for %s: %s", email, email_result.get("error"))
            failed += 1
            continue

        if slack_webhook_url:
            slack_result = send_slack_digest(slack_webhook_url, digest, dry_run=dry_run)
            if slack_result.get("status") not in ("sent", "dry-run"):
                logger.error("Slack send failed for %s: %s", email, slack_result.get("error"))

        sent += 1
        sent_this_week.add(email)
        logger.info("Digest sent to %s (%d pages tracked)", email, len(digest["score_changes"]))

    if not dry_run:
        # Keep only the last 4 weeks of state.
        state = {k: v for k, v in state.items() if k >= wk[:4] and k != wk or k == wk}
        state[wk] = sorted(sent_this_week)
        save_state(state)

    logger.info("Done. sent=%d skipped=%d failed=%d", sent, skipped, failed)


if __name__ == "__main__":
    main()
