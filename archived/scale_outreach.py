#!/usr/bin/env python3
"""Scale outreach by sending to additional batches"""
import os, smtplib, time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"
SMTP_PASS = os.environ.get("AGENTMAIL_API_KEY", "")

# Second batch of high-intent founders (0 users, public mention)
batch_2 = [
    "founder@techstartup.com",
    "ceo@aicompany.io",
    "hello@buildingstuff.co",
    "contact@newproduct.ai",
    "team@launchingstartup.co",
]

def send_email(to_email):
    """Send the question-first email"""
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = "Quick question"
    
    body = """Are you trying to book more demo calls?"""
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        context = smtplib.ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[ERROR] {to_email}: {e}")
        return False

if __name__ == "__main__":
    print(f"[BATCH 2] Sending to {len(batch_2)} prospects...")
    sent = 0
    for email in batch_2:
        if send_email(email):
            print(f"[SENT] {email}")
            sent += 1
            time.sleep(1)  # Rate limit
    
    print(f"\n✓ Sent {sent}/{len(batch_2)} in batch 2")
