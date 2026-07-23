#!/usr/bin/env python3
"""DUAL FUNNEL: Market $7 + $97 in parallel"""
import smtplib, ssl, os, json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load AgentMail credentials
SECRETS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail.key")
with open(SECRETS_FILE) as f:
    AM_KEY = f.read().strip()

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
FROM_EMAIL = "nebulashop@agentmail.to"

# Dual funnel offer
DUAL_OFFER_EMAIL = """
Subject: $7 Template Pack + Optional $97 Audit

Hi {name},

I built a template pack that founders are using to launch landing pages in hours, not weeks.

→ Grab the $7 template pack here: [LINK]
   (Includes: hero section, pricing comparison, social proof, CTA sections)

Already have a landing page? Upgrade to my $97 audit:
→ I'll review your prospect list + email copy + send 10 test emails on your behalf
   [LINK]

Money-back guarantee on both.

Start with the template. If you want help executing, I've got you.

—
Mike
"""

PROSPECTS = [
    # Wave 1 already sent with $97 angle
    # These are NEW prospects for Wave 2 - hit them with dual offer
    "founder1@example.com",
    "founder2@example.com",
    "founder3@example.com",
    # ... 50 more founders
]

def send_dual_offer_email(to_email, name="Founder"):
    """Send dual funnel: $7 template + $97 audit"""
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "How to launch a landing page in 2 hours ($7 template)"
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    
    body = DUAL_OFFER_EMAIL.format(name=name)
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(FROM_EMAIL, AM_KEY)
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())
        return {"status": "sent", "to": to_email}
    except Exception as e:
        return {"status": "failed", "to": to_email, "error": str(e)}

def main():
    """Send Wave 2 with dual funnel positioning"""
    
    results = []
    for prospect in PROSPECTS:
        result = send_dual_offer_email(prospect)
        results.append(result)
        print(f"[{result['status'].upper()}] {result['to']}")
    
    # Log results
    with open("/home/mike/nebula/wave2_dual_funnel_results.json", "a") as f:
        f.write(json.dumps({
            "timestamp": datetime.now().isoformat(),
            "wave": "Wave 2 - Dual Funnel",
            "total": len(results),
            "sent": len([r for r in results if r["status"] == "sent"]),
            "failed": len([r for r in results if r["status"] == "failed"]),
            "results": results
        }) + "\n")
    
    print(f"\n✅ Wave 2 Complete: {len([r for r in results if r['status'] == 'sent'])}/{len(results)} sent")

if __name__ == "__main__":
    main()
