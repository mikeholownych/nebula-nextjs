import ssl, imaplib, email, json, smtplib, os, re
from email.header import decode_header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

KEY = open('/home/mike/.hermes/secrets/agentmail.key').read().strip()
INBOX = 'nebulashop@agentmail.to'
LOG_FILE = '/home/mike/nebula/dual_funnel_autoresponder_log.jsonl'

TEMPLATE_LINK = '[TEMPLATE DOWNLOAD LINK — fill in before deploying]'
AUDIT_LINK = '[AUDIT PURCHASE LINK — fill in before deploying]'

def decode_str(s):
    if s is None:
        return ''
    parts = decode_header(s)
    result = []
    for part, enc in parts:
        if isinstance(part, bytes):
            result.append(part.decode(enc or 'utf-8', errors='replace'))
        else:
            result.append(part)
    return ''.join(result)

def get_body(msg):
    body = ''
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            cd = str(part.get('Content-Disposition', ''))
            if ct == 'text/plain' and 'attachment' not in cd:
                try:
                    body += part.get_payload(decode=True).decode('utf-8', errors='replace')
                except:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode('utf-8', errors='replace')
        except:
            pass
    return body

def classify(subject, body, from_addr):
    text = (subject + ' ' + body).lower()

    # Reverse cold outreach signals
    reverse_signals = [
        'our services', 'we offer', 'i offer', "i'd love to help you",
        'help you grow', 'boost your', 'increase your', 'improve your',
        'our agency', 'our team', 'free consultation', 'quick call',
        'schedule a call', 'book a call', 'hop on a call',
        'reach out to you', 'reaching out to you',
        'let me know if you\'re interested', 'would you be open',
        'are you looking for', 'are you interested in',
        'seo services', 'marketing services', 'link building',
        'community growth', 'social media management', 'content creation',
        'lead generation for you', 'email marketing for you',
    ]
    reverse_count = sum(1 for sig in reverse_signals if sig in text)

    # Prospect signals
    template_signals = ['template', '$7', 'download', 'quick start', 'component']
    audit_signals = ['audit', '$97', 'review my site', 'full analysis', 'review my', 'analyze my']

    has_template = any(sig in text for sig in template_signals)
    has_audit = any(sig in text for sig in audit_signals)

    if reverse_count >= 2:
        return 'reverse_cold_outreach'

    if has_template and has_audit:
        return 'both'
    elif has_template:
        return 'template'
    elif has_audit:
        return 'audit'
    else:
        return 'general_inquiry'

def build_reply(classification, original_subject, original_from):
    subject = f'Re: {original_subject}' if not original_subject.startswith('Re:') else original_subject

    if classification == 'template':
        body = f"""Thanks for reaching out! Here's the direct download link for the $7 Nebula Component template:

{TEMPLATE_LINK}

You'll get a ready-to-use component pack with everything you need to get started quickly.

If you have questions or want to upgrade to the full $97 audit (personalized review of your specific site), just reply here.

– Nebula Components"""

    elif classification == 'audit':
        body = f"""Great timing — here's what the $97 audit includes:

• Full on-page SEO review
• Conversion funnel analysis
• Specific actionable recommendations (not generic advice)
• Delivered within 48 hours

To get started: {AUDIT_LINK}

If you'd like to see the quality of our work first, the $7 template pack is a great low-risk starting point: {TEMPLATE_LINK}

– Nebula Components"""

    elif classification == 'both':
        body = f"""You asked about both — here's the breakdown:

**$7 Template Pack** → Best if you want a quick win right now. Instant download, use immediately.
{TEMPLATE_LINK}

**$97 Audit** → Best if you want personalized analysis of your specific situation. We review your site/funnel and give you a custom action plan.
{AUDIT_LINK}

**Our recommendation:** Start with the $7 template. If you like the quality and want deeper help, the audit is the natural next step. Many customers do both.

– Nebula Components"""

    else:  # general_inquiry
        body = f"""Thanks for getting back to us! Here's a quick overview of what we offer:

**$7 Template Pack** — Instant download. Great for getting started quickly with proven components.
{TEMPLATE_LINK}

**$97 Site Audit** — Personalized review of your site or funnel. Full on-page SEO + conversion analysis with specific action steps. Delivered in 48 hours.
{AUDIT_LINK}

Let us know which sounds like a better fit, or if you have questions about either.

– Nebula Components"""

    return subject, body

def send_reply(to_addr, subject, body):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = INBOX
    msg['To'] = to_addr
    msg.attach(MIMEText(body, 'plain'))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.agentmail.to', 465, context=context) as server:
        server.login(INBOX, KEY)
        server.sendmail(INBOX, [to_addr], msg.as_string())

def log_entry(entry):
    with open(LOG_FILE, 'a') as f:
        f.write(json.dumps(entry) + '\n')

def main():
    context = ssl.create_default_context()
    mail = imaplib.IMAP4_SSL('imap.agentmail.to', 993, ssl_context=context)
    mail.login(INBOX, KEY)
    mail.select('INBOX')

    status, messages = mail.search(None, 'UNSEEN')
    if status != 'OK' or not messages[0]:
        print('No unseen messages.')
        return

    unseen_ids = messages[0].split()
    print(f'Found {len(unseen_ids)} unseen message(s).')

    results = []

    for msg_id in unseen_ids:
        status, data = mail.fetch(msg_id, '(RFC822)')
        if status != 'OK':
            continue

        raw = data[0][1]
        msg = email.message_from_bytes(raw)

        from_raw = msg.get('From', '')
        subject_raw = msg.get('Subject', '(no subject)')
        date_raw = msg.get('Date', '')

        from_addr = decode_str(from_raw)
        subject = decode_str(subject_raw)
        body = get_body(msg)

        # Extract email address from From field
        match = re.search(r'<(.+?)>', from_addr)
        reply_to = match.group(1) if match else from_addr.strip()

        entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'msg_id': msg_id.decode(),
            'from': from_addr,
            'subject': subject,
            'date': date_raw,
            'classification': None,
            'interest_detected': None,
            'response_sent': False,
            'reason': ''
        }

        # Filter: bounce
        if 'MAILER-DAEMON' in reply_to or 'mailer-daemon' in reply_to.lower():
            entry['classification'] = 'bounce'
            entry['reason'] = 'Bounce/delivery failure notification'
            mail.store(msg_id, '+FLAGS', '\\Seen')
            log_entry(entry)
            results.append(entry)
            print(f'  [{msg_id.decode()}] BOUNCE — skipped')
            continue

        # Filter: self-sent
        if reply_to.lower() == INBOX.lower():
            entry['classification'] = 'self_sent'
            entry['reason'] = 'Self-sent test message — skipped'
            mail.store(msg_id, '+FLAGS', '\\Seen')
            log_entry(entry)
            results.append(entry)
            print(f'  [{msg_id.decode()}] SELF-SENT — skipped')
            continue

        # Classify
        classification = classify(subject, body, reply_to)

        if classification == 'reverse_cold_outreach':
            entry['classification'] = 'reverse_cold_outreach'
            entry['reason'] = 'Sender pitching their own services — not a prospect'
            mail.store(msg_id, '+FLAGS', '\\Seen')
            log_entry(entry)
            results.append(entry)
            print(f'  [{msg_id.decode()}] REVERSE COLD OUTREACH from {reply_to} — skipped')
            continue

        # Genuine prospect
        entry['classification'] = 'genuine_prospect'
        entry['interest_detected'] = classification

        try:
            reply_subject, reply_body = build_reply(classification, subject, from_addr)
            send_reply(reply_to, reply_subject, reply_body)
            entry['response_sent'] = True
            entry['reason'] = f'Auto-responded with {classification} template'
            print(f'  [{msg_id.decode()}] RESPONDED ({classification}) → {reply_to}')
        except Exception as e:
            entry['response_sent'] = False
            entry['reason'] = f'Send failed: {str(e)}'
            print(f'  [{msg_id.decode()}] SEND FAILED: {e}')

        mail.store(msg_id, '+FLAGS', '\\Seen')
        log_entry(entry)
        results.append(entry)

    mail.logout()

    print(f'\nDone. Processed {len(results)} message(s).')
    return results

if __name__ == '__main__':
    main()
