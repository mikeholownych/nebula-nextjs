#!/usr/bin/env python3
"""BLAST: Send $97 audit offer to 100+ high-intent prospects"""
import smtplib, ssl, os, time, json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"

# Load key
SECRETS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail.key")
with open(SECRETS_FILE) as f:
    SMTP_PASS = f.read().strip()

# HIGH-INTENT FOUNDER LIST
prospects = [
    # Original Wave 1 (re-engage with new offer)
    "tianyajinhui@gmail.com",
    "quietpulse.social@gmail.com", 
    "voder.ai.agent@gmail.com",
    "quratulaincreatives@gmail.com",
    "releaselogofficial@gmail.com",
    "rkotcher@gmail.com",
    "gupta.shivani7896@gmail.com",
    "kevin.chisumdev@gmail.com",
    "career4lucas@gmail.com",
    "shawnxu0208@gmail.com",
    "scalewords.agency@gmail.com",
    "zyvara.group@gmail.com",
    "dinirangapremanayake@gmail.com",
    "beniciocardozomdp@gmail.com",
    "algor.tago@gmail.com",
    "jerryatbusiness@gmail.com",
    "stellytips@gmail.com",
    "lholmes274@gmail.com",
    "rcschupp@gmail.com",
    "davidwang913526@gmail.com",
    "muhammadabusufyangoraya@gmail.com",
    "nedco80@gmail.com",
    "vsl.and@gmail.com",
    "bjoroen.eirik@gmail.com",
    "matze.schedel@gmail.com",
    "ainikaautomation@gmail.com",
    "shadowroot47@outlook.com",
    # Expanded batch
    "founder@shipyard.build",
    "hello@buildingstuff.io",
    "team@launchingai.co",
]

email_body = """$97 → Get replies from your cold emails (or money back)

Hi there,

I'm testing something: What if you paid $97 to get REAL REPLIES from your prospect list instead of paying thousands for an "SDR service"?

Here's what happens:
1. You send me your prospect list (even rough)
2. I optimize your email template
3. I send 10 test emails on your behalf
4. You get the results (replies + analysis)
5. Or you get your money back

72-hour turnaround. 30-day refund guarantee.

Interested? Reply to this email.

Mike"""

sent_count = 0
failed_count = 0

print(f"[BLAST] Sending $97 audit offer to {len(prospects)} prospects...")
print(f"[TIME] {datetime.now().isoformat()}")
print()

for prospect_email in prospects:
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_USER
        msg["To"] = prospect_email
        msg["Subject"] = "$97 → Get replies from cold emails (or money back)"
        msg.attach(MIMEText(email_body, "plain"))
        
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, prospect_email, msg.as_string())
        
        print(f"✓ {prospect_email}")
        sent_count += 1
        time.sleep(0.5)  # Rate limit
        
    except Exception as e:
        print(f"✗ {prospect_email}: {str(e)[:50]}")
        failed_count += 1

print()
print(f"=== AUDIT BLAST COMPLETE ===")
print(f"Sent: {sent_count}/{len(prospects)}")
print(f"Failed: {failed_count}")
print(f"Success rate: {sent_count/len(prospects)*100:.1f}%")

# Log results
with open("audit_blast_results.json", "w") as f:
    json.dump({
        "timestamp": datetime.now().isoformat(),
        "campaign": "audit_blast_v1",
        "sent": sent_count,
        "failed": failed_count,
        "total": len(prospects),
        "prospects": prospects
    }, f, indent=2)
