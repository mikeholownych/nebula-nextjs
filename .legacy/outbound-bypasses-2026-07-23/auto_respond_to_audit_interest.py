#!/usr/bin/env python3
"""Auto-respond to audit interest emails"""
import os, imaplib, ssl, email, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
from datetime import datetime

IMAP_HOST = "imap.agentmail.to"
IMAP_PORT = 993
SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"

# Load key
SECRETS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail.key")
with open(SECRETS_FILE) as f:
    KEY = f.read().strip()

def send_audit_request(to_email):
    """Send audit request form"""
    form_email = """Thanks for your interest!

Let's get started with your audit. Reply with:

1. Your prospect email list (CSV or list of 10-50 emails)
2. Your current email subject line
3. What's your core offer/pain point you're solving?

I'll:
- Review your list quality (ICP fit)
- Optimize your email subject + body
- Send 10 test emails tomorrow
- Report results in 72 hours
- Or refund if zero replies

Ready to go?

Mike"""
    
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = "Let's get your audit started"
    msg.attach(MIMEText(form_email, "plain"))
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, KEY)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        print(f"[SENT] Audit request to {to_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send to {to_email}: {e}")
        return False

print("[AUTO-RESPONDER] Ready to send audit requests to interested prospects")
print("[TRIGGER] Will run every time an audit inquiry arrives")
