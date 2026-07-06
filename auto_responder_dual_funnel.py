#!/usr/bin/env python3
"""Auto-respond to BOTH $7 template and $97 audit interest"""
import os, imaplib, ssl, email, smtplib, json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load credentials
SECRETS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail_org.key")
with open(SECRETS_FILE) as f:
    AM_KEY = f.read().strip()

IMAP_HOST = "imap.agentmail.to"
IMAP_PORT = 993
SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
FROM_EMAIL = "ops@launchcrate.io"

def check_inbox_and_respond():
    """Check for replies to $7 or $97 offers, respond accordingly"""
    
    context = ssl.create_default_context()
    
    try:
        # Connect to inbox
        with imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=context) as imap:
            imap.login(FROM_EMAIL, AM_KEY)
            imap.select("INBOX")
            
            # Find unread messages
            _, message_ids = imap.search(None, "UNSEEN")
            
            if not message_ids[0]:
                return {"status": "no_new_messages"}
            
            responses = []
            
            for msg_id in message_ids[0].split():
                _, msg_data = imap.fetch(msg_id, "(RFC822)")
                msg = email.message_from_bytes(msg_data[0][1])
                
                subject = msg.get("Subject", "")
                from_addr = msg.get("From", "")
                body = ""
                
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode()
                            break
                else:
                    body = msg.get_payload(decode=True).decode()
                
                # Determine which offer they're interested in
                is_7_template = any(kw in subject.lower() or kw in body.lower() 
                                   for kw in ["$7", "template", "landing page"])
                is_97_audit = any(kw in subject.lower() or kw in body.lower() 
                                 for kw in ["$97", "audit", "cold email"])
                
                # Route to appropriate response
                if is_7_template or is_97_audit:
                    response_body = create_response(is_7_template, is_97_audit, from_addr)
                    send_response(from_addr, response_body)
                    responses.append({
                        "from": from_addr,
                        "subject": subject,
                        "type": "template" if is_7_template else "audit",
                        "responded": True
                    })
                    
                    # Mark as read
                    imap.store(msg_id, "+FLAGS", "\\Seen")
            
            return {"status": "processed", "responses": responses}
    
    except Exception as e:
        return {"status": "error", "error": str(e)}

def create_response(is_template, is_audit, to_email):
    """Create response for template or audit interest"""
    
    if is_template and is_audit:
        # Interested in both
        body = f"""Thanks for reaching out!

Here's how it works:

$7 TEMPLATE PACK
→ Landing page sections (hero, pricing, social proof, CTA)
→ Instant download
→ Ready to use

$97 AUDIT (next level)
→ I review your prospect list
→ Review your current email copy
→ Send 10 test emails on your behalf
→ Share reply analysis

Money-back guarantee on both. Start with the template, or jump straight to the audit if you want help executing.

Which interests you more?

—
Mike"""
    elif is_audit:
        # Audit only
        body = f"""Perfect, you want the audit.

Here's what you'll get:
• Review of your prospect list (targeting quality)
• Feedback on your email subject line + copy
• 10 test emails sent on your behalf
• Reply analysis + next steps

$97, money-back guarantee.

Ready to go?

—
Mike"""
    else:
        # Template only
        body = f"""Great! The $7 template pack is yours.

Includes:
• Hero section (high-converting hooks)
• Pricing comparison layout
• Social proof section
• CTA variants

Download link: [TEMPLATE_LINK]

If you want help executing cold email to promote this, I also offer a $97 audit.

—
Mike"""
    
    return body

def send_response(to_email, body):
    """Send auto-response"""
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Re: Your Interest"
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(FROM_EMAIL, AM_KEY)
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"Failed to send to {to_email}: {e}")
        return False

def main():
    """Run auto-responder"""
    result = check_inbox_and_respond()
    
    # Log
    with open("/home/mike/nebula/auto_responder_dual_funnel.log", "a") as f:
        f.write(json.dumps({
            "timestamp": datetime.now().isoformat(),
            "result": result
        }) + "\n")
    
    print(f"[AUTO-RESPONDER] {result['status']}")

if __name__ == "__main__":
    main()
