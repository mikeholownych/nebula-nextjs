#!/usr/bin/env python3
"""Monitor for incoming replies in real-time"""
import smtplib, time, json, os
from email.mime.text import MIMEText

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"
# Load from permanent secure storage
SECRETS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail.key")
if os.path.exists(SECRETS_FILE):
    with open(SECRETS_FILE) as f:
        SMTP_PASS = f.read().strip()
else:
    SMTP_PASS = os.environ.get("AGENTMAIL_API_KEY", "")
IMAP_HOST = "imap.agentmail.to"
IMAP_PORT = 993

import ssl, imaplib

def check_inbox():
    """Poll IMAP for new replies"""
    try:
        context = ssl.create_default_context()
        with imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=context) as mail:
            mail.login(SMTP_USER, SMTP_PASS)
            mail.select("INBOX")
            
            # Get recent emails
            status, messages = mail.search(None, "RECENT")
            if messages[0]:
                email_ids = messages[0].split()
                for email_id in email_ids[-10:]:  # Last 10
                    status, msg_data = mail.fetch(email_id, "(RFC822)")
                    msg = msg_data[0][1]
                    # Parse and log
                    print(f"[REPLY] {msg.decode('utf-8', errors='ignore')[:200]}")
                    
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    print("[MONITOR] Checking for replies every 30 seconds...")
    while True:
        check_inbox()
        time.sleep(30)
