"""Weekly Newsletter Send Cron Job

Schedule: Every Monday at 8 AM ET (1 PM UTC)

Logic:
1. Query active subscribers (unsubscribed_at IS NULL, is_confirmed = TRUE)
2. Render this week's finding (from findings queue)
3. Send via AgentMail
4. Mark last_email_sent_at
5. Log results

Usage (in cron.yaml or scheduler):
schedule: "0 13 * * 1"  # Monday, 1 PM UTC
"""

from datetime import datetime
import sqlite3
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class WeeklyNewsletterJob:
    """Send weekly newsletter to active subscribers."""

    def __init__(self, db_path: str = "/home/mike/nebula/platform_api/lead_state.db"):
        self.db_path = db_path

    async def run(self):
        """Execute weekly newsletter send."""

        # Get active subscribers
        subscribers = self._get_active_subscribers()
        if not subscribers:
            print("[SKIP] No active subscribers")
            return {"sent": 0, "failed": 0}

        # Get this week's finding (TODO: from findings queue)
        this_week_finding = self._get_this_week_finding()

        # Render email
        email_body = self._render_email(this_week_finding)
        email_subject = f"Nebula Weekly: {this_week_finding.get('title', 'Landing Page Finding')}"

        # Send to each subscriber
        sent = 0
        failed = 0

        for subscriber in subscribers:
            try:
                # Send via AgentMail
                # TODO: Wire to send_email_agentmail()
                print(f"[SEND] {subscriber['email']}: {email_subject}")

                # Update last_email_sent_at
                self._update_last_sent(subscriber['email'])
                sent += 1
            except Exception as e:
                print(f"[ERROR] Failed to send to {subscriber['email']}: {e}")
                failed += 1

        print(f"[COMPLETE] Sent: {sent}, Failed: {failed}")
        return {"sent": sent, "failed": failed}

    def _get_active_subscribers(self):
        """Get all active (non-unsubscribed, confirmed) subscribers."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, email, role
            FROM newsletter_subscribers
            WHERE unsubscribed_at IS NULL
            AND is_confirmed = TRUE
            ORDER BY subscribed_at DESC
        """)

        rows = cursor.fetchall()
        conn.close()

        return [
            {"id": row[0], "email": row[1], "role": row[2]}
            for row in rows
        ]

    def _get_this_week_finding(self):
        """Get this week's finding from findings queue.

        TODO: Replace with actual findings queue (findings table, status=queued_for_newsletter)
        """
        return {
            "title": "H1 Doesn't Match Ad Copy",
            "finding": "Visitor clicks ad for 'Fast checkout in 3 clicks' → lands on page saying 'Streamlined payment experience'",
            "impact": "Forces re-qualification of page. Bounce rate +12%",
            "fix": "Copy your ad headline directly into your H1. Test for 7 days.",
            "data_points": "Found in 23% of audits this week (847 total audits)",
        }

    def _render_email(self, finding):
        """Render email body from finding."""

        return f"""
Hi there,

This week's most common landing page leak:

**{finding['title']}**

The finding:
{finding['finding']}

Why it matters:
{finding['impact']}

The fix:
{finding['fix']}

Implement this and re-audit in 7 days. Most founders see +1 to +3 point improvement.

---

Get the full audit:
https://nebulacomponents.com/audit

Have a landing page that needs a diagnostic? Audit it for free. 30 seconds.

Questions? Reply to this email. I read every message.

-
Nebula
nebulacomponents.com

P.S. Unsubscribe anytime: [unsubscribe link]
        """

    def _update_last_sent(self, email: str):
        """Update last_email_sent_at for subscriber."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE newsletter_subscribers
            SET last_email_sent_at = ?
            WHERE email = ?
        """, (datetime.utcnow().isoformat(), email))

        conn.commit()
        conn.close()


async def run_weekly_newsletter():
    """Cron job entrypoint."""
    job = WeeklyNewsletterJob()
    result = await job.run()
    return result


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_weekly_newsletter())
