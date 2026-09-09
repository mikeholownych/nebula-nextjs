"""
Follow-up email sequences
Sends 24h, 3d, 7d follow-ups after audit
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import asyncio
import logging
import os
import httpx

from platform_api.services.email_service import email_service, AuditEmailData
from platform_api.services.audit_db import audit_db
from platform_api.services.offer import TIMING_CLAIM_EMAIL, offer_price_display


class FollowUpSequence:
    """Manages follow-up email sequences for audits"""
    
    SEQUENCE = [
        {
            "delay_hours": 24,
            "subject": "You already ran the audit",
            "template": "audit_followup_24h"
        },
        {
            "delay_hours": 72,  # 3 days
            "subject": "Quick win from your landing page audit",
            "template": "audit_followup_3d"
        },
        {
            "delay_hours": 168,  # 7 days
            "subject": "Still thinking about your conversion rate?",
            "template": "audit_followup_7d"
        }
    ]
    
    async def get_pending_followups(self) -> List[dict]:
        """Get audits that need follow-up emails"""
        pending = []
        
        for seq in self.SEQUENCE:
            threshold = datetime.now(timezone.utc) - timedelta(hours=seq["delay_hours"])
            
            await audit_db.connect()
            async with audit_db.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, email, name, url, score, grade, findings, email_sent_at
                    FROM audits
                    WHERE email_sent_at < $1
                      AND email_sent_at >= NOW() - INTERVAL '30 days'
                      AND email_sent_at IS NOT NULL
                      AND paid_at IS NULL
                      AND (
                        SELECT COUNT(*) FROM email_events 
                        WHERE audit_id = audits.id AND event_type = 'followup'
                      ) < 3
                    ORDER BY created_at DESC
                    LIMIT 100
                    """,
                    threshold
                )
                
                for row in rows:
                    pending.append({
                        **dict(row),
                        "sequence": seq
                    })
        
        return pending
    
    async def send_followup(self, audit: dict, sequence: dict) -> bool:
        """Send follow-up email"""
        try:
            # Get first quick win finding. `findings` arrives from the audits
            # table as a JSON string - parse before touching structure.
            raw_findings = audit.get("findings", [])
            if isinstance(raw_findings, str):
                try:
                    import json as _json
                    raw_findings = _json.loads(raw_findings)
                except Exception:
                    raw_findings = []
            if not isinstance(raw_findings, list):
                raw_findings = []
            quick_win = next(
                (f for f in raw_findings
                 if isinstance(f, dict) and f.get("priority") == "Quick Win"),
                raw_findings[0] if raw_findings else None
            )

            subject = sequence["subject"]
            body = self._build_followup_body(audit, quick_win, sequence["template"])

            # Send email
            result = await email_service.send_audit_results(
                AuditEmailData(
                    url=audit["url"],
                    email=audit["email"],
                    name=audit.get("name"),
                    score=audit["score"] / 10,
                    grade=audit["grade"],
                    findings=[quick_win] if quick_win else [],
                    custom_subject=subject,
                    custom_body=body,
                    audit_id=str(audit.get("id")) if audit.get("id") else None,
                )
            )

            sent = result.get("status") == "sent"

            # Log follow-up sent ONLY on confirmed delivery - otherwise the
            # <3 cap permanently suppresses retries after transient failures.
            if sent and audit_db.pool:
                async with audit_db.pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO email_events (audit_id, event_type, created_at)
                        VALUES ($1, 'followup', NOW())
                        """,
                        audit["id"]
                    )

            return sent
            
        except Exception as e:
            print(f"Follow-up send error: {e}")
            return False
    
    def _build_followup_body(self, audit: dict, quick_win: Optional[dict], template: str) -> str:
        """Build follow-up email body"""
        audit_id = audit.get('id', '')
        checkout_url = f"https://nebulacomponents.com/checkout?audit_id={audit_id}" if audit_id else "https://nebulacomponents.com/audit"

        if template == "audit_followup_24h":
            finding = self._format_finding(quick_win) if quick_win else ""
            finding_block = f"\n{finding}\n" if finding.strip() else ""
            return f"""
Hi {audit.get('name', 'there')},

You ran an audit on {audit['url']} yesterday.

I built Nebula because I was tired of watching ads do their job while the page quietly killed the sale.

Agencies wanted a retainer. Tools dumped another score. My own landing page didn't convert.

You already have the diagnosis.{finding_block}
If you want me to fix the first leak, reply YES. {offer_price_display()}. {TIMING_CLAIM_EMAIL}. No call.

Your audit: https://nebulacomponents.com/audit

Mike
"""
        
        elif template == "audit_followup_3d":
            return f"""
Hi {audit.get('name', 'there')},

Quick question: Did you implement any fixes from your landing page audit?

{"The quick win I mentioned:" if quick_win else ""}

{self._format_finding(quick_win) if quick_win else ""}

The audit records the observed condition; it does not predict conversion lift.

The {offer_price_display()} repair sprint covers one selected finding with no call or site access required.

→ {checkout_url}
Or open your audit: https://nebulacomponents.com/audit

Best,
Mike
"""
        
        elif template == "audit_followup_7d":
            return f"""
Hi {audit.get('name', 'there')},

Still thinking about your landing page conversion rate?

Your audit score was {audit['score']/10}/10. That score is a diagnostic baseline, not a revenue forecast.

The {offer_price_display()} One-Leak Repair Sprint turns one selected finding into a tailored change you or your developer applies. No call, site access, or conversion-lift guarantee:
→ {checkout_url}
Or view your audit results: https://nebulacomponents.com/audit

Best,
Mike from Nebula Components
"""
        
        return ""
    
    def _format_finding(self, finding: Optional[dict]) -> str:
        """Format finding for email"""
        if not finding:
            return ""
        
        return f"""
**{finding.get('category', 'Issue')}:**
{finding.get('title', 'Optimization needed')}

Fix: {finding.get('fix', 'Review and update')}
"""


# Singleton
followup_sequence = FollowUpSequence()


async def run_followups_once() -> int:
    """Process one batch of due follow-ups. Returns count actually sent.

    Never raises: a failed batch must not kill the scheduler loop (the drip
    was previously dead code - no caller, plus a NameError on `timezone`).
    Daily cap: the sending domain has near-zero reputation; blasting dozens
    of cold emails per day guarantees spam-folder placement regardless of
    SPF/DKIM/DMARC (verified via real .eml headers 2026-08-22). Ramp slowly.
    """
    log = logging.getLogger("uvicorn.error")
    sent = 0
    try:
        cap = int(os.getenv("FOLLOWUP_DAILY_CAP", "15"))
        await audit_db.connect()
        async with audit_db.pool.acquire() as conn:
            already = await conn.fetchval(
                """
                SELECT COUNT(*) FROM email_events
                WHERE event_type = 'followup'
                  AND created_at >= date_trunc('day', LOCALTIMESTAMP)
                """
            )
        if already >= cap:
            log.info("[followup] daily cap reached (%s/%s) - skipping batch", already, cap)
            return 0
        pending = await followup_sequence.get_pending_followups()
        for item in pending:
            if sent + already >= cap:
                log.info("[followup] daily cap hit mid-batch (%s/%s)", sent + already, cap)
                break
            ok = await followup_sequence.send_followup(item, item["sequence"])
            if ok:
                sent += 1
        if pending:
            log.info("[followup] batch done: %s/%s sent", sent, len(pending))
    except Exception:
        log.exception("[followup] batch failed")
    return sent


async def start_followup_scheduler(interval_minutes: int = 30) -> asyncio.Task:
    """Background loop that drains due follow-ups forever."""

    async def _loop():
        log = logging.getLogger("uvicorn.error")
        log.info("[followup] scheduler started (every %sm)", interval_minutes)
        while True:
            try:
                await run_followups_once()
            except asyncio.CancelledError:
                raise
            await asyncio.sleep(interval_minutes * 60)

    return asyncio.create_task(_loop(), name="followup-scheduler")
