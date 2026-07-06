#!/usr/bin/env python3
"""Wave 2: Dual sender test - templates@ vs audits@"""
import smtplib, ssl, os, json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Master API key
MASTER_KEY = os.environ.get("AGENTMAIL_MASTER_KEY", "am_us_e982d74943bcb2159fb3379b014ff8929b19cbc141ac49eca49b44c393006d4a")

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465

# Test senders
SENDER_A = "templates@agentmail.to"  # Lead with $7 template
SENDER_B = "audits@agentmail.to"      # Lead with $97 audit

# Test prospects (split 50/50)
PROSPECTS_A = [
    "founder1@example.com",
    "founder2@example.com",
    # ... 25 founders (odd-numbered)
]

PROSPECTS_B = [
    "founder2@example.com",
    "founder3@example.com",
    # ... 25 founders (even-numbered)
]

def send_sender_a_template_angle(to_email):
    """SENDER A: templates@ - Lead with $7 template"""
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "How to launch a landing page in 2 hours ($7 template)"  # Template-focused
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
        return {"sender": "templates@", "status": "sent", "to": to_email}
    except Exception as e:
        return {"sender": "templates@", "status": "failed", "to": to_email, "error": str(e)}

def send_sender_b_audit_angle(to_email):
    """SENDER B: audits@ - Lead with $97 audit"""
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Want more cold email replies? ($97 done-for-you audit)"  # Audit-focused
    msg["From"] = SENDER_B
    msg["To"] = to_email
    
    body = """Hi there,

I help founders get replies from cold email through targeted audits.

→ Get a $97 audit: https://buy.stripe.com/price_1TlZlbEINR1kU9chWMfqc1jc
   I'll review your prospect list, email copy, and send 10 test emails on your behalf

Want to start smaller? I also have a $7 landing page template pack.

→ Get templates ($7): https://buy.stripe.com/price_1TlsuhEINR1kU9chh3GfbJPt

Money-back guarantee on both.

—
Mike"""
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_B, MASTER_KEY)
            server.sendmail(SENDER_B, [to_email], msg.as_string())
        return {"sender": "audits@", "status": "sent", "to": to_email}
    except Exception as e:
        return {"sender": "audits@", "status": "failed", "to": to_email, "error": str(e)}

def main():
    """Wave 2: Split test between two senders"""
    
    results_a = [send_sender_a_template_angle(p) for p in PROSPECTS_A]
    results_b = [send_sender_b_audit_angle(p) for p in PROSPECTS_B]
    
    all_results = results_a + results_b
    
    # Log results
    with open("/home/mike/nebula/wave2_dual_sender_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "wave": "Wave 2 - Dual Sender A/B Test",
            "sender_a": {
                "email": SENDER_A,
                "subject": "How to launch a landing page in 2 hours",
                "total": len(results_a),
                "sent": len([r for r in results_a if r["status"] == "sent"]),
                "failed": len([r for r in results_a if r["status"] == "failed"])
            },
            "sender_b": {
                "email": SENDER_B,
                "subject": "Want more cold email replies?",
                "total": len(results_b),
                "sent": len([r for r in results_b if r["status"] == "sent"]),
                "failed": len([r for r in results_b if r["status"] == "failed"])
            },
            "combined": {
                "total_sent": len([r for r in all_results if r["status"] == "sent"]),
                "total_failed": len([r for r in all_results if r["status"] == "failed"])
            }
        }, f, indent=2)
    
    sent_a = len([r for r in results_a if r["status"] == "sent"])
    sent_b = len([r for r in results_b if r["status"] == "sent"])
    
    print(f"\n✅ Wave 2 Complete: Dual Sender Test")
    print(f"   Sender A (templates@): {sent_a}/{len(results_a)} sent")
    print(f"   Sender B (audits@): {sent_b}/{len(results_b)} sent")
    print(f"   Total: {sent_a + sent_b}/{len(all_results)}")

if __name__ == "__main__":
    main()
