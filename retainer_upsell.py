#!/usr/bin/env python3
"""
Retainer Upsell Sender — Nebula Components
Sends the canonical $1,497/mo AI Ops Retainer offer to qualified audit recipients.

Run via cron every 6h. Each eligible lead gets ONE upsell, then marked done.

Eligibility:
  - stage = audit_delivered
  - audit_delivered_at is 24–72h ago
  - paid_at IS NULL
  - bounced_at IS NULL
  - upsell_sent_at IS NULL (custom column, added on first run)
"""

import json
import sqlite3
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH   = Path("/home/mike/nebula/lead_state.db")
LOG_FILE  = Path("/home/mike/nebula/logs/retainer_upsell.log")
INBOX = "nebulashop@agentmail.to"
STRIPE_RETAINER_URL = "https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()]
)
log = logging.getLogger(__name__)


SUBJECT = "One more thing about {domain}"

BODY = """\
Hey,

I sent your audit for {domain} a day ago.

Quick follow-up: most founders I work with hit the same wall after the fix pack — \
they make the changes, see an initial lift, then conversion starts drifting again \
because new traffic brings new friction points.

That's why I built the AI Ops Retainer: $1,497/month, I run your landing page through \
the full 5-dimension audit every month, push an updated fix pack, and flag any \
new drop-off before it costs you real money.

No contract. Cancel any time.

If you want ongoing coverage: {retainer_url}

If you're all set — no worries, just ignore this.

— Mike
Nebula Components
"""


def ensure_upsell_column(conn):
    """Add upsell_sent_at column if it doesn't exist yet."""
    cols = [r[1] for r in conn.execute("PRAGMA table_info(leads)").fetchall()]
    if "upsell_sent_at" not in cols:
        conn.execute("ALTER TABLE leads ADD COLUMN upsell_sent_at TEXT")
        conn.commit()
        log.info("Added upsell_sent_at column to leads table")


def get_eligible_leads(conn) -> list[dict]:
    now = datetime.now(timezone.utc)
    cutoff_min = (now - timedelta(hours=72)).isoformat()
    cutoff_max = (now - timedelta(hours=24)).isoformat()

    rows = conn.execute("""
        SELECT email, url, audit_delivered_at
        FROM leads
        WHERE stage = 'audit_delivered'
          AND audit_delivered_at >= ?
          AND audit_delivered_at <= ?
          AND paid_at IS NULL
          AND bounced_at IS NULL
          AND upsell_sent_at IS NULL
    """, (cutoff_min, cutoff_max)).fetchall()

    return [{"email": r[0], "url": r[1], "audit_delivered_at": r[2]} for r in rows]


def send_upsell(to: str, domain: str) -> bool:
    subject = SUBJECT.format(domain=domain)
    body    = BODY.format(domain=domain, retainer_url=STRIPE_RETAINER_URL)

    try:
        import sys
        sys.path.insert(0, str(Path(__file__).parent))
        from agentmail_client import AgentMailClient
        result = AgentMailClient(inbox=INBOX).send(
            to=[to],
            subject=subject,
            text=body,
            client_id=f"retainer:{to.lower()}:initial",
        )
        if not result.get("_error"):
            log.info(f"Upsell sent via gated AgentMail → {to} ({domain})")
            return True
        else:
            log.warning(
                f"Upsell blocked/failed {to}: "
                f"{result.get('_reason') or result.get('_error')}"
            )
            return False
    except Exception as e:
        log.error(f"Send failed {to}: {e}")
        return False


def main():
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    ensure_upsell_column(conn)

    leads = get_eligible_leads(conn)
    log.info(f"Eligible for upsell: {len(leads)}")

    sent = 0
    for lead in leads:
        email  = lead["email"]
        domain = (lead["url"] or "").replace("https://","").replace("http://","").split("/")[0] or "your page"

        ok = send_upsell(email, domain)
        now_iso = datetime.now(timezone.utc).isoformat()

        if ok:
            conn.execute(
                "UPDATE leads SET upsell_sent_at = ?, updated_at = ? WHERE email = ?",
                (now_iso, now_iso, email)
            )
            conn.commit()
            sent += 1

    conn.close()
    log.info(f"Upsell run complete — sent: {sent}/{len(leads)}")
    print(json.dumps({"sent": sent, "eligible": len(leads),
                      "run_at": datetime.now(timezone.utc).isoformat()}))


if __name__ == "__main__":
    main()
