"""
AgentMail Email Service
Sends audit results and follow-up emails
"""

import asyncio
from typing import Optional, List
from pydantic import BaseModel


class AuditEmailData(BaseModel):
    url: str
    score: float
    grade: str
    findings: List[dict]
    email: str
    name: Optional[str] = None


class EmailService:
    """AgentMail email sending service"""
    
    def __init__(self):
        self.inbox_id = "nebulashop@agentmail.to"
    
    async def send_audit_results(self, data: AuditEmailData) -> dict:
        """Send audit results email"""
        
        # Build findings list
        findings_html = "<ul>"
        for f in data.findings[:3]:  # Show top 3
            findings_html += f"""
            <li>
                <strong>{f.get('label', f.get('key'))}</strong> 
                ({f.get('quadrant', '').replace('_', ' ').title()})
                <br><em>{f.get('issue', '')}</em>
            </li>
            """
        findings_html += "</ul>"
        
        # Build email body
        html_body = f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Your Landing Page Audit Results</h1>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; margin: 1rem 0;">
                <h2 style="margin: 0;">{data.url}</h2>
                <div style="font-size: 3rem; font-weight: bold; margin: 1rem 0;">
                    {data.score:.1f}/10
                    <span style="font-size: 1.5rem; opacity: 0.9;">Grade: {data.grade}</span>
                </div>
            </div>
            
            <h2 style="color: #333;">Top Prioritized Fixes</h2>
            {findings_html}
            
            <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <h3 style="margin-top: 0;">Ready to fix these issues?</h3>
                <p><strong>$97 Fix Pack</strong> — implementation of the highest-impact conversion fixes.</p>
                <p style="margin-bottom: 0;">
                    <a href="https://nebulacomponents.shop/audit" style="color: #667eea;">Get started →</a>
                </p>
            </div>
            
            <p style="color: #666; font-size: 0.9rem;">
                Want the full report with all {len(data.findings)} findings? 
                <a href="https://nebulacomponents.shop/audit" style="color: #667eea;">Run another audit</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
            <p style="color: #999; font-size: 0.85rem;">
                Nebula Components — Conversion optimization for founders wasting money on ads.<br>
                <a href="https://nebulacomponents.shop" style="color: #999;">nebulacomponents.shop</a>
            </p>
        </body>
        </html>
        """
        
        text_body = f"""
Your Landing Page Audit Results

{data.url}
Score: {data.score:.1f}/10 (Grade: {data.grade})

Top Prioritized Fixes:
{chr(10).join([f"- {f.get('label', f.get('key'))}: {f.get('issue', '')}" for f in data.findings[:3]])}

Ready to fix these?
- $97 Fix Pack — implementation of the highest-impact conversion fixes

Get started: https://nebulacomponents.shop/audit

--
Nebula Components — Conversion optimization for founders
        """.strip()
        
        # Register the inbound audit request before the fail-closed gate checks identity.
        from agentmail_client import AgentMailClient
        from lead_store import LeadStore

        store = LeadStore()
        await asyncio.to_thread(
            store.upsert_lead,
            email=data.email,
            url=data.url,
            stage="discovered",
            source="audit_request",
            trigger_context="requested_platform_audit",
        )
        result = await asyncio.to_thread(
            AgentMailClient(inbox=self.inbox_id).send_audit,
            to=[data.email],
            subject=f"Your Audit Results: {data.url} scored {data.score:.1f}/10",
            text=text_body,
            html=html_body,
        )
        if not result.get("_error"):
            await asyncio.to_thread(
                store.upsert_lead,
                email=data.email,
                url=data.url,
                stage="audit_delivered",
                source="audit_request",
                audit_score=data.score,
                audit_grade=data.grade,
            )
        return {
            "status": "failed" if result.get("_error") else "sent",
            "message_id": result.get("message_id") or result.get("id"),
            "error": result.get("_reason") or result.get("_error"),
        }


# Singleton instance
email_service = EmailService()
