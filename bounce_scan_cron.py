#!/usr/bin/env python3
"""
bounce_scan_cron.py - Periodic inbox scan for NDR/bounce messages.
Runs every 30m via cron. Supplements inline SMTP bounce detection.
"""
import sys, json
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA))

from bounce_detector import scan_inbox_for_bounces, log_bounce_event, report_bounce_stats


def _report_delivered_outcomes() -> int:
    """
    For any 'sent' outcome recorded in mailcheck_beta.db with no bounce
    after 48h, report 'delivered' back to MailCheck. This is the positive-
    signal feedback loop for ACCEPT_ALL domains where Hunter said valid
    but MailCheck was uncertain — delivery without bounce proves the address
    was real and helps calibrate the classification boundary.
    """
    import sqlite3, time
    from pathlib import Path
    try:
        from mailcheck_adapter import MailCheckAdapter
    except Exception:
        return 0

    db_path = NEBULA / "mailcheck_beta.db"
    if not db_path.exists():
        return 0

    mc = MailCheckAdapter(db_path=db_path)
    cutoff = time.time() - 48 * 3600  # 48h ago

    db = sqlite3.connect(str(db_path))
    db.row_factory = sqlite3.Row

    # Find verifications that were SENT and classified ACCEPT_ALL,
    # older than 48h, where we haven't yet recorded a delivered or bounce outcome
    rows = db.execute("""
        SELECT v.verification_id, v.lead_id, v.classification
        FROM verifications v
        JOIN outcomes o ON o.verification_id = v.verification_id
        WHERE v.classification IN ('ACCEPT_ALL', 'CATCH_ALL', 'PROBABLE_VALID')
          AND o.payload_json LIKE '%"SENT"%'
          AND v.updated_at < datetime(?, 'unixepoch')
          AND v.verification_id NOT IN (
              SELECT verification_id FROM outcomes
              WHERE payload_json LIKE '%"DELIVERED"%'
                 OR payload_json LIKE '%"HARD_BOUNCE"%'
                 OR payload_json LIKE '%"SOFT_BOUNCE"%'
          )
    """, (cutoff,)).fetchall()
    db.close()

    reported = 0
    for row in rows:
        try:
            mc.record_outcome(
                row["verification_id"],
                email=row["lead_id"].replace("sequence:", ""),
                outcome="delivered",
                source_system="nebula-bounce-scan-48h",
                provider="agentmail",
            )
            reported += 1
        except Exception:
            pass

    return reported


def load_agentmail_client():
    """Import and instantiate the AgentMail client."""
    from agentmail_client import AgentMailClient
    return AgentMailClient()


def main():
    try:
        am = load_agentmail_client()
    except Exception as e:
        print(f"bounce-scan ERROR: Cannot init AgentMail client: {e}")
        sys.exit(1)

    bounces = scan_inbox_for_bounces(am, max_messages=50)

    if bounces:
        # Only emit output (= Telegram/origin notification) when there are new bounces
        print(f"⚠️ Bounce scan - {len(bounces)} new bounce(s):")
        for b in bounces:
            print(f"  • {b['target_email']} - {b['subject'][:60]}")
            log_bounce_event(b)
        stats = report_bounce_stats()
        print(f"  Total: {stats['hard_bounces']} hard / {stats['soft_bounces']} soft")

    # Feed 48h no-bounce deliveries back to MailCheck for ACCEPT_ALL calibration
    delivered = _report_delivered_outcomes()
    if delivered:
        print(f"[mailcheck] Reported {delivered} 48h delivered outcome(s) for ACCEPT_ALL domains", file=__import__('sys').stderr)
    # Else: silent - empty stdout = no notification


if __name__ == "__main__":
    main()
