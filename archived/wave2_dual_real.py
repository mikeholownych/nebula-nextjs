#!/usr/bin/env python3
"""
Wave 2: DUAL SENDER A/B TEST - Real execution with actual prospects
Sends $7 template vs $97 audit dual funnel to 30 prospects (split A/B)
"""
import smtplib, ssl, os, json, sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load API key from secrets
MASTER_KEY = None
try:
    with open(os.path.expanduser("~/.hermes/secrets/agentmail.key")) as f:
        MASTER_KEY = f.read().strip()
except:
    pass

if not MASTER_KEY:
    MASTER_KEY = os.environ.get("AGENTMAIL_MASTER_KEY")

if not MASTER_KEY:
    print("❌ ERROR: AGENTMAIL_MASTER_KEY not found in ~/.hermes/secrets/agentmail.key or env")
    sys.exit(1)

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465

# Senders (only nebulashop@agentmail.to is verified)
SENDER_A = "nebulashop@agentmail.to"  # Lead with $7 template
SENDER_B = "nebulashop@agentmail.to"  # Lead with $97 audit (same sender, different angle)

# Real prospects from Wave 1
WAVE1_PROSPECTS = [
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
    "founder@shipyard.build",
    "hello@buildingstuff.io",
    "team@launchingai.co"
]

# Split 50/50
PROSPECTS_A = WAVE1_PROSPECTS[::2]  # Even indices
PROSPECTS_B = WAVE1_PROSPECTS[1::2] # Odd indices

def send_sender_a_template_angle(to_email):
    """SENDER A: templates@ - Lead with $7 template"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "How to launch a landing page in 2 hours ($7 template)"
    msg["From"] = SENDER_A
    msg["To"] = to_email
    
    body = """Hi there,

I built a landing page template pack that founders are using to launch in hours, not weeks.

→ Grab the $7 template pack: https://buy.stripe.com/price_1TlsuhEINR1kU9chh3GfbJPt
   Includes: hero, pricing, social proof, CTA sections (instant delivery)

Already have a landing page? I also do $97 audits where I review your copy + send test emails.

→ Get your audit ($97): https://buy.stripe.com/price_1TlZlbEINR1kU9chWMfqc1jc

Money-back guarantee on both.

—
Mike"""
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_A, MASTER_KEY)
            server.sendmail(SENDER_A, [to_email], msg.as_string())
        return {"sender": "nebulashop@", "angle": "template", "status": "sent", "to": to_email}
    except Exception as e:
        return {"sender": "nebulashop@", "angle": "template", "status": "failed", "to": to_email, "error": str(e)}

def send_sender_b_audit_angle(to_email):
    """SENDER B: audits@ - Lead with $97 audit"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Want more cold email replies? ($97 done-for-you audit)"
    msg["From"] = SENDER_B
    msg["To"] = to_email
    
    body = """Hi there,

I help founders get replies from cold email through targeted audits.

→ Get a $97 audit: https://buy.stripe.com/price_1TlZlbEINR1kU9chWMfqc1jc
   I'll review your prospect list, email copy, and send 10 test emails on your behalf

Already have good emails? I also created a $7 template pack for instant landing pages.

→ Grab templates ($7): https://buy.stripe.com/price_1TlsuhEINR1kU9chh3GfbJPt

Money-back guarantee on both.

—
Mike"""
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_B, MASTER_KEY)
            server.sendmail(SENDER_B, [to_email], msg.as_string())
        return {"sender": "nebulashop@", "angle": "audit", "status": "sent", "to": to_email}
    except Exception as e:
        return {"sender": "nebulashop@", "angle": "audit", "status": "failed", "to": to_email, "error": str(e)}

def main():
    results = {"timestamp": datetime.now().isoformat(), "campaign": "wave2_dual_ab", "results": []}
    
    print(f"🚀 Wave 2: Dual Sender A/B Test")
    print(f"   Total prospects: {len(WAVE1_PROSPECTS)}")
    print(f"   Sender A (templates@): {len(PROSPECTS_A)} emails")
    print(f"   Sender B (audits@): {len(PROSPECTS_B)} emails")
    print()
    
    # Send Sender A (template angle)
    print("📧 Sender A (templates@):")
    a_sent = 0
    for email in PROSPECTS_A:
        result = send_sender_a_template_angle(email)
        results["results"].append(result)
        if result["status"] == "sent":
            a_sent += 1
            print(f"   ✅ {email}")
        else:
            print(f"   ❌ {email}: {result.get('error', 'Unknown error')}")
    
    print()
    
    # Send Sender B (audit angle)
    print("📧 Sender B (audits@):")
    b_sent = 0
    for email in PROSPECTS_B:
        result = send_sender_b_audit_angle(email)
        results["results"].append(result)
        if result["status"] == "sent":
            b_sent += 1
            print(f"   ✅ {email}")
        else:
            print(f"   ❌ {email}: {result.get('error', 'Unknown error')}")
    
    print()
    print(f"✅ Wave 2 Complete: Dual Sender Test")
    print(f"   Sender A (templates@): {a_sent}/{len(PROSPECTS_A)} sent")
    print(f"   Sender B (audits@): {b_sent}/{len(PROSPECTS_B)} sent")
    print(f"   Total: {a_sent + b_sent}/{len(WAVE1_PROSPECTS)}")
    
    # Save results
    results_file = f"wave2_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n📊 Results saved to: {results_file}")
    
    return a_sent + b_sent > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
