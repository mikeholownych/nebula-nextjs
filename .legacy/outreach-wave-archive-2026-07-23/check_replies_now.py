#!/usr/bin/env python3
"""Quick check for replies - manual trigger"""
import os, imaplib, ssl, email
from email.header import decode_header

IMAP_HOST = "imap.agentmail.to"
IMAP_PORT = 993
SMTP_USER = "nebulashop@agentmail.to"

# Load from permanent secure storage
SECRETS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail.key")
if os.path.exists(SECRETS_FILE):
    with open(SECRETS_FILE) as f:
        SMTP_PASS = f.read().strip()
else:
    SMTP_PASS = os.environ.get("AGENTMAIL_API_KEY", "")

def check_for_replies():
    try:
        context = ssl.create_default_context()
        with imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=context) as mail:
            mail.login(SMTP_USER, SMTP_PASS)
            mail.select("INBOX")
            
            # Search for emails from last 24 hours
            status, messages = mail.search(None, "RECENT")
            email_ids = messages[0].split()
            
            print(f"\n[INBOX] Found {len(email_ids)} recent messages\n")
            
            for email_id in email_ids[-20:]:  # Last 20
                status, msg_data = mail.fetch(email_id, "(RFC822)")
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                from_addr = msg.get("From")
                subject = msg.get("Subject")
                
                print(f"From: {from_addr}")
                print(f"Subject: {subject}")
                print(f"---")
                
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    check_for_replies()
