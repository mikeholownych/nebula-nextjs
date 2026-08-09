"""Post-Checkout Delivery Workflow — Email + Re-audit Automation

Triggered by: Stripe charge.succeeded webhook
Manages: 4-email sequence + 30-day auto re-audit + result classification
Data: Stored in platform_api/lead_state.db (purchases table)

Flow:
  [Stripe webhook] → Email 1 (5 min) → Email 2 (1 day) → Email 3 (7 days)
                   → [Auto re-audit at 30 days]
                   → Email 4 [success|partial|unchanged]
                   → [Trigger P3: testimonial capture if success]
                   → [Trigger P4: Pro upsell if success]
"""

import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from platform_api.db.purchases import PurchaseRecord
from lead_gen.outbound import send_email_agentmail
from deliver_audit import scrape_page, score_audit


class DeliveryWorkflow:
    """Manage post-checkout delivery workflow."""
    
    def __init__(self, db_path="/home/mike/nebula/platform_api/lead_state.db"):
        self.db_path = db_path
    
    async def handle_stripe_charge_success(self, event: dict):
        """Stripe webhook: charge.succeeded
        
        Event schema:
        {
          "type": "charge.succeeded",
          "data": {
            "object": {
              "id": "ch_1234",
              "amount": 9700,  # $97
              "metadata": {
                "audit_id": "abc123",
                "email": "founder@example.com",
                "name": "John",
              }
            }
          }
        }
        """
        charge = event.get("data", {}).get("object", {})
        metadata = charge.get("metadata", {})
        
        audit_id = metadata.get("audit_id")
        email = metadata.get("email")
        founder_name = metadata.get("name", "there").split()[0]
        
        if not all([audit_id, email]):
            print(f"[ERROR] Missing audit_id or email in Stripe metadata")
            return False
        
        # Load audit data for template variables
        audit_data = await self._load_audit(audit_id)
        if not audit_data:
            return False
        
        # Create purchase record
        purchase = PurchaseRecord(
            audit_id=audit_id,
            email=email,
            founder_name=founder_name,
            stripe_charge_id=charge.get("id"),
            amount_cents=charge.get("amount", 9700),
            purchased_at=datetime.utcnow().isoformat(),
            emails_sent={},
            re_audit_scheduled_at=None,
            re_audit_completed_at=None,
            re_audit_score_after=None,
            testimonial_captured=False,
        )
        
        # Store purchase
        await self._save_purchase(purchase)
        
        # Send Email 1 immediately
        finding = audit_data["findings"][0]  # Worst finding
        template_vars = {
            "founder_name": founder_name,
            "finding_label": finding.get("label", "Conversion leak"),
            "fix_copy": finding.get("fix", ""),
        }
        
        sent = await send_email_agentmail(
            to=email,
            subject=f"Your $97 fix — {template_vars['finding_label']}",
            body=self._render_template("email_1_fix_ready", template_vars),
        )
        
        if sent:
            purchase.emails_sent["email_1"] = datetime.utcnow().isoformat()
            await self._save_purchase(purchase)
            
            # Schedule remaining emails
            await self._schedule_email_2(purchase, template_vars, audit_data)
            await self._schedule_email_3(purchase)
            await self._schedule_re_audit_30days(purchase, audit_id)
            
            return True
        
        return False
    
    async def _schedule_email_2(self, purchase, template_vars, audit_data):
        """Schedule Email 2 for 1 day later."""
        # In production, use Celery/APScheduler for delayed sends
        # For now, store scheduled time in DB
        scheduled_for = datetime.utcnow() + timedelta(days=1)
        purchase.emails_sent["email_2_scheduled_for"] = scheduled_for.isoformat()
        await self._save_purchase(purchase)
    
    async def _schedule_email_3(self, purchase):
        """Schedule Email 3 for 7 days later."""
        scheduled_for = datetime.utcnow() + timedelta(days=7)
        purchase.emails_sent["email_3_scheduled_for"] = scheduled_for.isoformat()
        await self._save_purchase(purchase)
    
    async def _schedule_re_audit_30days(self, purchase, audit_id):
        """Schedule automatic re-audit for 30 days later."""
        scheduled_for = datetime.utcnow() + timedelta(days=30)
        purchase.re_audit_scheduled_at = scheduled_for.isoformat()
        await self._save_purchase(purchase)
    
    async def process_scheduled_emails(self):
        """Cron job: Check for scheduled emails, send them.
        
        Run this every 15 minutes (or more frequently).
        """
        purchases = await self._load_all_purchases()
        now = datetime.utcnow()
        
        for purchase in purchases:
            # Email 2 (1 day)
            email_2_scheduled = purchase.emails_sent.get("email_2_scheduled_for")
            if email_2_scheduled and not purchase.emails_sent.get("email_2"):
                if datetime.fromisoformat(email_2_scheduled) <= now:
                    await self._send_email_2(purchase)
            
            # Email 3 (7 days)
            email_3_scheduled = purchase.emails_sent.get("email_3_scheduled_for")
            if email_3_scheduled and not purchase.emails_sent.get("email_3"):
                if datetime.fromisoformat(email_3_scheduled) <= now:
                    await self._send_email_3(purchase)
    
    async def process_re_audits(self):
        """Cron job: Check for scheduled re-audits, run them.
        
        Run this every 30 minutes.
        """
        purchases = await self._load_all_purchases()
        now = datetime.utcnow()
        
        for purchase in purchases:
            if not purchase.re_audit_scheduled_at:
                continue
            
            scheduled_for = datetime.fromisoformat(purchase.re_audit_scheduled_at)
            if scheduled_for <= now and not purchase.re_audit_completed_at:
                # Run re-audit
                audit_before = await self._load_audit(purchase.audit_id)
                url = audit_before.get("url")
                
                # Scrape + score
                html = await scrape_page(url)
                audit_after = await score_audit(html, url)
                
                score_after = audit_after.get("composite", audit_after.get("score", 0))
                score_before = audit_before.get("composite", audit_before.get("score", 0))
                
                # Store results
                purchase.re_audit_completed_at = datetime.utcnow().isoformat()
                purchase.re_audit_score_after = score_after
                await self._save_purchase(purchase)
                
                # Send Email 4 (results + upsell)
                await self._send_email_4(purchase, score_before, score_after)
                
                # If successful, trigger P3 (testimonial capture)
                if score_after > score_before:
                    await self._trigger_testimonial_capture(purchase)
    
    async def _send_email_2(self, purchase):
        """Send Email 2: Implementation guide."""
        audit_data = await self._load_audit(purchase.audit_id)
        finding = audit_data["findings"][0]
        template_vars = {
            "founder_name": purchase.founder_name,
            "before_score": audit_data.get("composite", 0),
            "expected_after_score": audit_data.get("composite", 0) + 1,
            "estimated_bounce_percent": 45,
            "estimated_monthly_loss": 500,
            "before_screenshot_url": f"/api/screenshot/{purchase.audit_id}/before",
            "after_screenshot_url": f"/api/screenshot/{purchase.audit_id}/after",
        }
        
        sent = await send_email_agentmail(
            to=purchase.email,
            subject="Before/After proof — how to measure the impact",
            body=self._render_template("email_2_implementation_guide", template_vars),
        )
        
        if sent:
            purchase.emails_sent["email_2"] = datetime.utcnow().isoformat()
            await self._save_purchase(purchase)
    
    async def _send_email_3(self, purchase):
        """Send Email 3: 7-day check-in."""
        audit_data = await self._load_audit(purchase.audit_id)
        finding = audit_data["findings"][0]
        template_vars = {
            "founder_name": purchase.founder_name,
            "finding_label": finding.get("label", "conversion leak"),
        }
        
        sent = await send_email_agentmail(
            to=purchase.email,
            subject="Did you implement? (Help if stuck)",
            body=self._render_template("email_3_implementation_check", template_vars),
        )
        
        if sent:
            purchase.emails_sent["email_3"] = datetime.utcnow().isoformat()
            await self._save_purchase(purchase)
    
    async def _send_email_4(self, purchase, score_before, score_after):
        """Send Email 4: Re-audit results + Pro upsell."""
        score_change = score_after - score_before
        
        if score_change > 0.5:
            variant = "success"
        elif score_change > 0:
            variant = "partial"
        else:
            variant = "unchanged"
        
        template_vars = {
            "founder_name": purchase.founder_name,
            "before_score": round(score_before, 1),
            "after_score": round(score_after, 1),
            "score_change": f"+{score_change:.1f}" if score_change > 0 else f"{score_change:.1f}",
            "score_improvement": int(score_change),
            "result_status": variant.capitalize(),
            "monthly_visitors": 2500,
            "estimated_new_conversions": int(score_change * 5),
            "estimated_new_revenue": int(score_change * 5 * 150),
            "payback_days": max(1, int(97 / (score_change * 5 * 150 / 30))),
            "remaining_issues_count": 4,
            "payback_days_pro": 8,
        }
        
        body = self._render_template(f"email_4_results_and_upsell_{variant}", template_vars)
        
        sent = await send_email_agentmail(
            to=purchase.email,
            subject=f"{variant.capitalize()}: Your re-audit is live — {template_vars['score_change']}",
            body=body,
        )
        
        if sent:
            purchase.emails_sent["email_4"] = datetime.utcnow().isoformat()
            await self._save_purchase(purchase)
    
    async def _trigger_testimonial_capture(self, purchase):
        """Send testimonial capture request after successful re-audit."""
        # TODO: Wire to P3 (testimonial capture)
        print(f"[TODO] Trigger testimonial capture for {purchase.email}")
    
    async def _load_audit(self, audit_id):
        """Load audit data from DB."""
        # TODO: Wire to actual audit DB
        return {"findings": [], "url": "", "composite": 4}
    
    async def _load_all_purchases(self):
        """Load all purchases from DB."""
        # TODO: Wire to actual purchase DB
        return []
    
    async def _save_purchase(self, purchase):
        """Save purchase record to DB."""
        # TODO: Wire to actual purchase DB
        pass
    
    def _render_template(self, template_name, vars):
        """Render email template with variables."""
        # TODO: Load from delivery_email_templates.py, render
        return f"[Email: {template_name}]"


if __name__ == "__main__":
    print("Delivery workflow ready")
    print("Integrate with:")
    print("  • Stripe webhook handler (POST /webhook/stripe)")
    print("  • Cron job: process_scheduled_emails() every 15 min")
    print("  • Cron job: process_re_audits() every 30 min")
