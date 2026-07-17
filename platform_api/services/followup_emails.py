"""
Follow-up email sequences
Sends 24h, 3d, 7d follow-ups after audit
"""

from datetime import datetime, timedelta
from typing import Optional, List
import os
import httpx

from platform_api.services.email_service import email_service, AuditEmailData
from platform_api.services.audit_db import audit_db


class FollowUpSequence:
    """Manages follow-up email sequences for audits"""
    
    SEQUENCE = [
        {
            "delay_hours": 24,
            "subject": "Your audit is ready (don't lose this)",
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
            threshold = datetime.utcnow() - timedelta(hours=seq["delay_hours"])
            
            async with audit_db.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, email, name, url, score, grade, findings, email_sent_at
                    FROM audits
                    WHERE email_sent_at < $1
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
            # Get first quick win finding
            findings = audit.get("findings", [])
            quick_win = next(
                (f for f in findings if f.get("priority") == "Quick Win"),
                findings[0] if findings else None
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
                    custom_body=body
                )
            )
            
            # Log follow-up sent
            if audit_db.pool:
                async with audit_db.pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO email_events (audit_id, event_type, created_at)
                        VALUES ($1, 'followup', NOW())
                        """,
                        audit["id"]
                    )
            
            return result.get("status") == "sent"
            
        except Exception as e:
            print(f"Follow-up send error: {e}")
            return False
    
    def _build_followup_body(self, audit: dict, quick_win: Optional[dict], template: str) -> str:
        """Build follow-up email body"""
        if template == "audit_followup_24h":
            return f"""
Hi {audit.get('name', 'there')},

I noticed you ran an audit on {audit['url']} yesterday.

Your score: {audit['score']/10}/10 (Grade: {audit['grade']})

{"Here's your top quick win:" if quick_win else "You have several fixes that could boost conversions."}

{self._format_finding(quick_win) if quick_win else ""}

Want help implementing this? Book a 15-min call:
https://nebulacomponents.shop/audit

Best,
Mike from Nebula Components
"""
        
        elif template == "audit_followup_3d":
            return f"""
Hi {audit.get('name', 'there')},

Quick question: Did you implement any fixes from your landing page audit?

{"The quick win I mentioned:" if quick_win else ""}

{self._format_finding(quick_win) if quick_win else ""}

This fix alone could improve your conversion rate by 10-20%.

If you're stuck, I can help:
- Audit Lite ($7): Top 3 fixes + implementation guide
- Conversion Fix Pack ($147): All fixes + priority support
- Done-For-You ($1,497): I implement everything

https://nebulacomponents.shop/audit

Best,
Mike
"""
        
        elif template == "audit_followup_7d":
            return f"""
Hi {audit.get('name', 'there')},

Still thinking about your landing page conversion rate?

Your audit score was {audit['score']/10}/10 - that's a {100 - audit['score']*10}% improvement opportunity.

Most founders I talk to are leaving 5-10x revenue on the table because their landing pages don't convert.

I can help fix that. Book a call:
https://nebulacomponents.shop/audit

Or reply "FIX IT" and I'll send you the $7 Audit Lite package.

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
