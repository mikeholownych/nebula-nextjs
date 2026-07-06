#!/usr/bin/env python3
"""
Retainer Upsell Sender — Nebula Components
Sends $197/mo pitch to leads who received an audit 24-72h ago and haven't paid.

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
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH   = Path("/home/mike/nebula/lead_state.db")
LOG_FILE  = Path("/home/mike/nebula/logs/retainer_upsell.log")
FROM_EMAIL = "ops@launchcrate.io"
AGENTMAIL_KEY_FILE = Path.home() / ".hermes/secrets/agentmail_org.key"
STRIPE_RETAINER_URL = "https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00"  # $197/mo — update when live

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

That's why I built a retainer option: $197/month, I run your landing page through \
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


def send_upsell(api_key: str, to: str, domain: str) -> bool:
    subject = SUBJECT.format(domain=domain)
    body    = BODY.format(domain=domain, retainer_url=STRIPE_RETAINER_URL)

    try:
        import sys
        sys.path.insert(0, str(Path(__file__).parent))
        from resend_client import send as resend_send
        result = resend_send(to=[to], subject=subject, text=body)
        if "message_id" in result:
            log.info(f"Upsell sent via Resend → {to} ({domain})")
            return True
        else:
            log.warning(f"Upsell send failed {to}: {result}")
            return False
    except Exception as e:
        log.error(f"Send failed {to}: {e}")
        return False


def main():
    if not AGENTMAIL_KEY_FILE.exists():
        log.error("AgentMail key not found")
        return

    api_key = AGENTMAIL_KEY_FILE.read_text().strip()
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    ensure_upsell_column(conn)

    leads = get_eligible_leads(conn)
    log.info(f"Eligible for upsell: {len(leads)}")

    sent = 0
    for lead in leads:
        email  = lead["email"]
        domain = (lead["url"] or "").replace("https://","").replace("http://","").split("/")[0] or "your page"

        ok = send_upsell(api_key, email, domain)
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
