#!/usr/bin/env python3
"""Queue missed subscription welcome emails with durable database state.

The subscription owns an organization, not an email. Recipient identity is
resolved through the active owner membership. Delivery is written directly to
the existing PostgreSQL outbox so this cron does not depend on an HTTP secret.
"""

import json
import logging
import os
import uuid

import psycopg2
import psycopg2.extras

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("subscription-welcome-retry")

PLATFORM_DSN = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433",
)
AUDIT_DSN = os.getenv(
    "AUDIT_DATABASE_URL",
    "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
)
NAMES = {"pro": "Pro", "growth": "Growth", "agency": "Agency"}
MAX_BATCH = 100

CANDIDATES_SQL = """
SELECT DISTINCT ON (s.id)
       s.id, s.stripe_subscription_id, s.plan, u.email
FROM subscriptions s
JOIN memberships m
  ON m.organization_id = s.organization_id
 AND m.status = 'active'
JOIN users u
  ON u.id = m.user_id
 AND u.email IS NOT NULL
WHERE s.livemode = TRUE
  AND s.status IN ('active', 'trialing')
  AND s.welcome_email_enqueued_at IS NULL
  AND s.welcome_email_attempts < 5
ORDER BY s.id, (m.role = 'owner') DESC, m.created_at ASC
LIMIT %s
"""


def _payload(row: dict) -> dict:
    plan_name = NAMES.get(row["plan"], row["plan"].title())
    return {
        "kind": "subscription_welcome",
        "subscription_id": row["stripe_subscription_id"] or str(row["id"]),
        "subject": f"Your Nebula {plan_name} plan is active",
        "body": (
            f"<p>Your Nebula {plan_name} plan is active.</p>"
            '<p><a href="https://nebulacomponents.com/audit">'
            "Run your first audit &rarr;</a></p>"
            "<p>- Mike<br>Nebula Components</p>"
        ),
        "from_email": "audits@nebulacomponents.shop",
        "content_type": "text/html",
    }


def enqueue(row: dict) -> tuple[bool, str]:
    """Idempotently queue one welcome message in the existing audit outbox."""
    subscription_key = row["stripe_subscription_id"] or str(row["id"])
    payload = _payload(row)
    try:
        with psycopg2.connect(AUDIT_DSN) as conn:
            with conn.cursor() as cur:
                # Serialize competing retries for this subscription.
                cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (subscription_key,))
                cur.execute(
                    """
                    SELECT id
                    FROM outbox_messages
                    WHERE channel = 'email'
                      AND payload->>'kind' = 'subscription_welcome'
                      AND payload->>'subscription_id' = %s
                      AND status IN ('pending', 'sending', 'sent')
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (subscription_key,),
                )
                existing = cur.fetchone()
                if existing:
                    return True, "already_enqueued"

                cur.execute(
                    """
                    INSERT INTO outbox_messages
                        (id, channel, recipient, payload, status, attempts,
                         next_retry_at, created_at)
                    VALUES (%s, 'email', %s, %s::jsonb, 'pending', 0, NOW(), NOW())
                    """,
                    (str(uuid.uuid4()), row["email"], json.dumps(payload)),
                )
        return True, "enqueued"
    except Exception as exc:
        log.error("welcome enqueue failed subscription=%s: %s", subscription_key, exc)
        return False, str(exc)[:500]


def main() -> int:
    with psycopg2.connect(
        PLATFORM_DSN, cursor_factory=psycopg2.extras.RealDictCursor
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(CANDIDATES_SQL, (MAX_BATCH,))
            rows = cur.fetchall()

        queued = 0
        for raw_row in rows:
            row = dict(raw_row)
            ok, detail = enqueue(row)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE subscriptions
                    SET welcome_email_attempts = welcome_email_attempts + 1,
                        welcome_email_enqueued_at = CASE
                            WHEN %s THEN NOW()
                            ELSE welcome_email_enqueued_at
                        END,
                        welcome_email_last_error = CASE
                            WHEN %s THEN NULL
                            ELSE %s
                        END,
                        updated_at = NOW()
                    WHERE id = %s
                      AND welcome_email_enqueued_at IS NULL
                      AND welcome_email_attempts < 5
                    """,
                    (ok, ok, detail or "outbox enqueue failed", row["id"]),
                )
            queued += int(ok)

    if rows:
        print(f"Queued {queued}/{len(rows)} subscription welcome emails.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
