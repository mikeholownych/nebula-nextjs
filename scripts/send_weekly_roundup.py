#!/usr/bin/env python3
"""
Weekly Roundup Email — Daniel Bustamante's "Easier Version" pattern

Sends a 200-300 word email curating the week's best content to all leads
who've completed the 5-day email course but haven't purchased.

Daniel's rule: "Re-package what you're already doing. Zero pressure to create
original content."
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional

# Add parent to path for imports
BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))

import httpx

# ─── CONFIG ──────────────────────────────────────────────

INBOX = "nebulashop@agentmail.to"
API_BASE = "https://api.agentmail.to"
CONTENT_QUEUE = BASE / "content_queue"

# ─── AUTH ────────────────────────────────────────────────

def get_auth_header() -> dict:
    secret = Path.home() / ".hermes" / "secrets" / "agentmail.key"
    token = secret.read_text().strip() if secret.exists() else ""
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ─── EMAIL CONTENT ───────────────────────────────────────

def build_roundup_email(lead: dict, content_items: list) -> dict:
    """Build the weekly roundup email.
    
    Structure (Daniel's pattern):
    1. Greeting with first name
    2. 3 bullet points summarizing week's best content
    3. One soft CTA
    4. Sign-off
    """
    name = lead.get("name", "there")
    email = lead.get("email")
    
    # Build bullet points from content items
    bullets = []
    for item in content_items[:3]:
        title = item.get("title", "This week's insight")
        link = item.get("link", "https://nebulacomponents.shop")
        bullets.append(f"• **{title}** — [Read →]({link})")
    
    bullets_text = "\n".join(bullets)
    
    subject = f"This week in conversion: {len(content_items)} fixes you missed"
    
    text_body = f"""Hi {name},

Quick roundup of this week's conversion insights:

{bullets_text.replace('**', '').replace('[Read →](', '').replace(')', '')}

Want these delivered to your page? The Fix Pack is $147:
https://nebulacomponents.shop/checkout.html?utm_source=weekly_roundup&utm_medium=email&utm_campaign=conversion_newsletter

Best,
Mike from Nebula Components

--
You're receiving this because you ran a landing page audit.
Unsubscribe: Reply UNSUBSCRIBE
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1a1a2e;max-width:600px;margin:0 auto;padding:20px;">

<p>Hi {name},</p>

<p>Quick roundup of this week's conversion insights:</p>

<ul style="list-style: none; padding: 0;">
"""
    
    for b in bullets:
        # Convert markdown-style bullets to HTML
        bullet_html = b.replace("[", "<a href=\"").replace("→](", "\" style=\"color:#667eea;\">Read →</a>")
        html_body += f"<li style=\"margin: 0.5rem 0;\">{bullet_html}</li>\n"
    
    html_body += f"""</ul>

<p style="margin-top: 1.5rem;">
Want these delivered to your page? The Fix Pack is $147:<br>
<a href="https://nebulacomponents.shop/checkout.html?utm_source=weekly_roundup&utm_medium=email&utm_campaign=conversion_newsletter" style="color:#667eea;">Get the Fix Pack →</a>
</p>

<p>Best,<br>Mike from Nebula Components</p>

<hr style="border:none;border-top:1px solid #eee;margin:2rem 0;">
<p style="color:#999;font-size:0.85rem;">
You're receiving this because you ran a landing page audit.<br>
<a href="mailto:nebulashop@agentmail.to?subject=UNSUBSCRIBE" style="color:#999;">Unsubscribe</a>
</p>

</body>
</html>
"""

    return {
        "to": email,
        "subject": subject,
        "text": text_body,
        "html": html_body,
    }

# ─── SEND ─────────────────────────────────────────────────

async def send_email(email_data: dict) -> tuple[bool, str]:
    """Send via AgentMail API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_BASE}/inboxes/{INBOX}/messages/send",
            headers=get_auth_header(),
            json=email_data,
            timeout=30.0,
        )
        
        if response.status_code == 200:
            return True, response.json().get("id", "sent")
        else:
            return False, f"{response.status_code}: {response.text[:200]}"

# ─── RECIPIENTS ───────────────────────────────────────────

def get_eligible_leads() -> list:
    """Get leads who should receive the weekly roundup.
    
    Criteria:
    - Completed 5-day email course (stage >= lead_warm)
    - Not yet purchased (not in customer_97, customer_997, etc.)
    - Not opted out
    - Not bounced
    """
    import lead_manager
    
    leads_db = lead_manager._load()
    eligible = []
    
    terminal_stages = {"customer_97", "customer_997", "subscriber_197", "customer_sdr", "dead", "bounced"}
    
    for email, lead in leads_db.items():
        if lead.get("opted_out"):
            continue
        
        stage = lead.get("current_stage", "")
        
        # Skip terminal stages
        if stage in terminal_stages:
            continue
        
        # Must have completed the email course (stage >= lead_warm)
        sequences = lead.get("email_sequences", {})
        post_audit = sequences.get("post_audit", {})
        
        if not post_audit.get("completed"):
            # Haven't finished the 5-day course yet
            continue
        
        eligible.append(lead)
    
    return eligible

# ─── CONTENT ──────────────────────────────────────────────

def get_weekly_content() -> list:
    """Pull this week's content items from content_queue.
    
    Looks for:
    - LinkedIn briefs
    - Medium outlines
    - Any findings.md updates
    """
    content_items = []
    
    if not CONTENT_QUEUE.exists():
        return content_items
    
    # Find content from the past 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    for filepath in CONTENT_QUEUE.glob("*.json"):
        try:
            data = json.loads(filepath.read_text())
            created_at = data.get("created_at", data.get("generated_at", ""))
            
            if created_at:
                created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                if created_dt >= week_ago:
                    # Extract title
                    if "linkedin_brief" in data:
                        finding = data.get("finding", "")
                        title = finding[:60] + "..." if len(finding) > 60 else finding
                        content_items.append({
                            "title": title,
                            "link": "https://nebulacomponents.shop/audit",
                            "type": "linkedin",
                        })
                    elif "medium_outline" in data:
                        outline = data["medium_outline"].get("outline", {})
                        title = outline.get("headline", "Conversion insight")
                        content_items.append({
                            "title": title,
                            "link": "https://nebulacomponents.shop/audit",
                            "type": "medium",
                        })
        except Exception:
            continue
    
    return content_items

# ─── MAIN ────────────────────────────────────────────────

async def main(dry_run: bool = True):
    print(f"[ROUNDUP] Weekly roundup email ({'DRY RUN' if dry_run else 'LIVE'})")
    print()
    
    # Get content
    content_items = get_weekly_content()
    
    if not content_items:
        print("[ROUNDUP] No content items found for this week.")
        print("[ROUNDUP] Creating default content from fallback topics...")
        
        # Fallback: use Daniel's email types
        content_items = [
            {"title": "Day 2: The Message Match Fix", "link": "https://nebulacomponents.shop/audit", "type": "course"},
            {"title": "Day 4: Proof Before Pitch", "link": "https://nebulacomponents.shop/audit", "type": "course"},
            {"title": "Day 5: Fix Before More Spend", "link": "https://nebulacomponents.shop/checkout.html", "type": "offer"},
        ]
    
    print(f"[ROUNDUP] Found {len(content_items)} content items")
    
    # Get eligible leads
    eligible_leads = get_eligible_leads()
    print(f"[ROUNDUP] Eligible leads: {len(eligible_leads)}")
    
    if not eligible_leads:
        print("[ROUNDUP] No eligible leads. Exiting.")
        return {"sent": 0, "skipped": 0}
    
    sent = 0
    skipped = 0
    
    for lead in eligible_leads:
        email_data = build_roundup_email(lead, content_items)
        
        if dry_run:
            print(f"[WOULD SEND] {lead['email']}")
            print(f"  Subject: {email_data['subject']}")
            sent += 1
            continue
        
        # Check opt-out again
        import lead_manager
        if lead_manager.is_opted_out(lead["email"]):
            print(f"[SKIP] {lead['email']} — opted out")
            skipped += 1
            continue
        
        # Send
        ok, msg = await send_email(email_data)
        if ok:
            print(f"[SENT] {lead['email']}")
            sent += 1
        else:
            print(f"[FAIL] {lead['email']}: {msg}")
            skipped += 1
    
    print()
    print(f"[ROUNDUP] Summary: {sent} sent, {skipped} skipped")
    
    return {"sent": sent, "skipped": skipped}


if __name__ == "__main__":
    import asyncio
    
    dry_run = "--dry-run" in sys.argv or "--send" not in sys.argv
    
    result = asyncio.run(main(dry_run=dry_run))
    print(f"\n---SUMMARY---\n{json.dumps(result)}")
