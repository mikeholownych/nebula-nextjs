"""
AgentMail Email Service
Sends audit results and follow-up emails
"""

import os
import httpx
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
        self.api_key = os.popen("cat ~/.hermes/secrets/agentmail.key").read().strip()
        self.inbox_id = os.getenv("AGENTMAIL_INBOX_ID", "nebulashop@agentmail.to")
        self.base_url = "https://api.agentmail.to/v0"
    
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
                <ul style="list-style: none; padding: 0;">
                    <li style="margin: 0.5rem 0;">✅ <strong>$7</strong> — Top 3 fixes you can do today</li>
                    <li style="margin: 0.5rem 0;">✅ <strong>$147</strong> — Full audit + rewritten copy + guide</li>
                    <li style="margin: 0.5rem 0;">✅ <strong>$1,497</strong> — Complete rebuild + 30-day monitoring</li>
                </ul>
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
- $7 — Top 3 fixes you can do today
- $147 — Full audit + rewritten copy + guide  
- $1,497 — Complete rebuild + 30-day monitoring

Get started: https://nebulacomponents.shop/audit

--
Nebula Components — Conversion optimization for founders
        """.strip()
        
        # Send via AgentMail API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/inboxes/{self.inbox_id}/messages/send",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "to": data.email,
                    "subject": f"Your Audit Results: {data.url} scored {data.score:.1f}/10",
                    "text": text_body,
                    "html": html_body,
                },
                timeout=30.0,
            )
            
            return {
                "status": "sent" if response.status_code == 200 else "failed",
                "message_id": response.json().get("message_id") if response.status_code == 200 else None,
                "error": response.text if response.status_code != 200 else None,
            }


# Singleton instance
email_service = EmailService()
