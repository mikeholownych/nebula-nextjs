#!/usr/bin/env python3
"""
Wave 4 confirmed sends — personalized per lead context.
"""
import json, ssl, smtplib, datetime, re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"
SMTP_PASS = Path("/home/mike/.hermes/secrets/agentmail.key").read_text().strip()
FROM_ADDR = "nebulashop@agentmail.to"
FROM_NAME = "Mike at Nebula"

CONTACTED_PATH = Path("/home/mike/nebula/contacted.json")

def load_contacted():
    if CONTACTED_PATH.exists():
        return json.loads(CONTACTED_PATH.read_text())
    return {}

def save_contacted(d):
    CONTACTED_PATH.write_text(json.dumps(d, indent=2))

def send_email(to_email, subject, body_html, body_text):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_ADDR}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))
    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx) as s:
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(FROM_ADDR, [to_email], msg.as_string())

# ── LEADS ──────────────────────────────────────────────────────────────────────
LEADS = [
    {
        "email": "meetsoto.app@gmail.com",
        "name": "Sabb",
        "site": "meetsoto.com",
        "trigger": "65 visitors, 6 completed your form, zero paid — you know the page is leaking, you just need someone to find where.",
        "subject": "meetsoto.com — I found the drop-off (free audit)",
        "lede": "I saw your IH post. 83% bounce before question 1 even after you rewrote the hero. That's not a copy problem — it's a trust-signal problem above the fold.",
    },
    {
        "email": "contact@smartwatermark.app",
        "name": "the SmartWatermark team",
        "site": "smartwatermark.app",
        "trigger": "84 visitors, 79% bounce rate, zero sales in 3 weeks — the IH thread nailed that it's a positioning miss, not a product miss.",
        "subject": "smartwatermark.app — your bounce problem (free audit)",
        "lede": "I pulled up your page after reading your IH post. The 79% bounce is a headline problem: 'stop uploading photos to strangers' is burying the lead. Real estate agents need to hear GPS-stripping before they hear privacy.",
    },
    {
        "email": "support@mirowl.com",
        "name": "the Mirowl team",
        "site": "mirowl.com",
        "trigger": "97 PH upvotes, 45 downloads, 1 paid user — that gap is a page problem, not a product problem.",
        "subject": "mirowl.com — the PH→paid gap (free audit)",
        "lede": "Saw your IH post. 97 upvotes to 1 paid user isn't a conversion rate problem — it's a landing page framing problem. The page talks about what it is, not about the moment someone desperately needs it.",
    },
]

def make_email(lead):
    subject = lead["subject"]
    text = f"""Hi {lead['name']},

{lead['lede']}

The useful bit: {lead['trigger']}

I made the self-serve audit for exactly this pattern so you can see the first conversion leak without getting dragged into a sales process.

No ask attached. If it helps, run it here and keep the output either way:
https://nebulacomponents.shop/audit.html

— Nebula Audit Agent
nebulacomponents.shop
"""
    html = f"""<p>Hi {lead['name']},</p>

<p>{lead['lede']}</p>

<p>The useful bit: {lead['trigger']}</p>

<p>I made the self-serve audit for exactly this pattern so you can see the first conversion leak without getting dragged into a sales process.</p>

<p>No ask attached. If it helps, run it here and keep the output either way:<br><a href="https://nebulacomponents.shop/audit.html">https://nebulacomponents.shop/audit.html</a></p>

<p>— Nebula Audit Agent<br>
<a href="https://nebulacomponents.shop">nebulacomponents.shop</a></p>
"""
    return subject, html, text

if __name__ == "__main__":
    contacted = load_contacted()
    sent = 0
    skipped = 0

    for lead in LEADS:
        email = lead["email"]
        if email in contacted:
            print(f"SKIP {email} (already contacted)")
            skipped += 1
            continue

        subject, html, text = make_email(lead)
        try:
            send_email(email, subject, html, text)
            contacted[email] = {
                "sent_at": datetime.datetime.utcnow().isoformat(),
                "site": lead["site"],
                "wave": 4,
                "trigger": lead["trigger"][:80],
            }
            save_contacted(contacted)
            print(f"SENT → {email} ({lead['site']})")
            sent += 1
        except Exception as e:
            print(f"ERROR {email}: {e}")

    print(f"\n=== Done: {sent} sent, {skipped} skipped ===")
    print(f"Total contacted: {len(contacted)}")
