#!/usr/bin/env python3
"""
Wave 4 batch 2 — confirmed emails from IH thread extraction.
"""
import json, ssl, smtplib, datetime
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
    return json.loads(CONTACTED_PATH.read_text()) if CONTACTED_PATH.exists() else {}

def save_contacted(d):
    CONTACTED_PATH.write_text(json.dumps(d, indent=2))

def send(to_email, subject, body_text, body_html):
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

LEADS = [
    {
        "email": "flynn@snipprompts.com",
        "name": "Flynn",
        "site": "snipprompts.com",
        "wave": 4,
        "trigger": "PH: 2 upvotes, 0 sales — Product Hunt without distribution amplifies nothing",
        "subject": "snipprompts.com — why PH gave you 0 sales (free audit)",
        "lede": "Saw your IH post on the 2-upvote PH launch. The real issue isn't PH — it's that your landing page doesn't convert the organic SEO traffic you're already getting. 182 free pages generating traffic with no paid funnel bridge is leaking money.",
    },
    {
        "email": "support@melororium.com",
        "name": "Kyrylo",
        "site": "melororium.com",
        "wave": 4,
        "trigger": "Day 4: 0 email subscribers, 0 traffic, 0 sales — page not indexed yet",
        "subject": "melororium.com — before the PH launch (free audit)",
        "lede": "Caught your IH day-4 post. You have 6 days before the Product Hunt launch and a landing page that hasn't been indexed yet. That's the window. I can audit the page now and tell you the 3 things that will kill conversion on launch day — before they kill it.",
    },
    {
        "email": "postclaw.io@gmail.com",  # placeholder — need real
        "name": "Adrien",
        "site": "postclaw.io",
        "wave": 4,
        "trigger": "$100 Reddit ads, 0 conversions — 100 clicks, nobody stayed",
        "subject": "postclaw.io — your ad bounce problem (free audit)",
        "lede": "Read your IH post. 100 ad clicks with zero conversions means traffic hit the page and left. That's a page problem, not an ad problem. 35 organic customers proves the product works — the page just isn't closing paid traffic.",
    },
    {
        "email": "postdew@hey.com",  # placeholder — need real
        "name": "Manish",
        "site": "postdew.com",
        "wave": 4,
        "trigger": "50 visitors, 0 paying customers, 10 cold DMs with 0 signups",
        "subject": "postdew.com — 5 page fixes that'll change your launch (free audit)",
        "lede": "Saw your IH post. You already got the 5 hero fixes from the community — dark headline contrast, two competing value props, the private beta badge. But the deeper issue is positioning: 'strips AI cadence' is a feature. Your page needs to open with the LinkedIn credibility fear, not the mechanism.",
    },
]

def make_body(lead):
    txt = f"""Hi {lead['name']},

{lead['lede']}

I made this as a useful first pass, not a generic agency pitch: a self-serve audit path for {lead['site']} that points to the first visible conversion blockers.

No ask attached. If it helps, run it here and keep the output either way:
https://nebulacomponents.shop/audit.html

— Mike
nebulacomponents.shop
"""
    html = f"""<p>Hi {lead['name']},</p>
<p>{lead['lede']}</p>
<p>I made this as a useful first pass, not a generic agency pitch: a self-serve audit path for <strong>{lead['site']}</strong> that points to the first visible conversion blockers.</p>
<p>No ask attached. If it helps, run it here and keep the output either way:<br><a href="https://nebulacomponents.shop/audit.html">https://nebulacomponents.shop/audit.html</a></p>
<p>— Mike<br><a href="https://nebulacomponents.shop">nebulacomponents.shop</a></p>"""
    return txt, html

if __name__ == "__main__":
    contacted = load_contacted()
    sent = skipped = errors = 0

    for lead in LEADS:
        email = lead["email"]
        # Skip placeholder emails
        if "placeholder" in email or email.endswith("hey.com") or email.endswith("gmail.com") and "postclaw" in email:
            print(f"SKIP {email} (placeholder — need real email)")
            skipped += 1
            continue
        if email in contacted:
            print(f"SKIP {email} (already contacted)")
            skipped += 1
            continue
        txt, html = make_body(lead)
        try:
            send(email, lead["subject"], txt, html)
            contacted[email] = {
                "sent_at": datetime.datetime.now(datetime.UTC).isoformat(),
                "site": lead["site"],
                "wave": lead["wave"],
                "trigger": lead["trigger"][:80],
            }
            save_contacted(contacted)
            print(f"SENT → {email} ({lead['site']})")
            sent += 1
        except Exception as e:
            print(f"ERROR {email}: {e}")
            errors += 1

    print(f"\n=== Done: {sent} sent, {skipped} skipped, {errors} errors ===")
    print(f"Total contacted: {len(contacted)}")
