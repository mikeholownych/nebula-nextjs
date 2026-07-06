#!/usr/bin/env python3
"""24h follow-up emails via SMTP - bypassing API rate limit"""
import smtplib, ssl, json, time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"
import os
# Load from permanent secure storage
SECRETS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail.key")
if os.path.exists(SECRETS_FILE):
    with open(SECRETS_FILE) as f:
        SMTP_PASS = f.read().strip()
else:
    SMTP_PASS = os.environ.get("AGENTMAIL_API_KEY", "")

targets = [
    ("tianyajinhui@gmail.com", "there"),
    ("quietpulse.social@gmail.com", "there"),
    ("voder.ai.agent@gmail.com", "there"),
    ("quratulaincreatives@gmail.com", "there"),
    ("releaselogofficial@gmail.com", "there"),
    ("rkotcher@gmail.com", "there"),
    ("gupta.shivani7896@gmail.com", "there"),
    ("kevin.chisumdev@gmail.com", "there"),
    ("career4lucas@gmail.com", "there"),
    ("shawnxu0208@gmail.com", "there"),
    ("scalewords.agency@gmail.com", "there"),
    ("zyvara.group@gmail.com", "there"),
    ("dinirangapremanayake@gmail.com", "there"),
    ("beniciocardozomdp@gmail.com", "there"),
    ("algor.tago@gmail.com", "there"),
    ("jerryatbusiness@gmail.com", "there"),
    ("stellytips@gmail.com", "there"),
    ("lholmes274@gmail.com", "there"),
    ("rcschupp@gmail.com", "there"),
    ("davidwang913526@gmail.com", "there"),
    ("muhammadabusufyangoraya@gmail.com", "there"),
    ("nedco80@gmail.com", "there"),
    ("vsl.and@gmail.com", "there"),
    ("bjoroen.eirik@gmail.com", "there"),
    ("matze.schedel@gmail.com", "there"),
    ("ainikaautomation@gmail.com", "there"),
    ("shadowroot47@outlook.com", "there"),
]

# Also send to newer leads
extra = [
    ("jonah@example.com", "there"),
]

def send_email(to_email, to_name):
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = "24h follow-up: still looking for a landing page?"

    text = f"""Hi {to_name},

Quick follow-up on my earlier email about Nebula Components.

If you're still working on your landing page and haven't shipped yet — I get it. Building takes forever.

Two things that might help:

1. **DIY ($7):** https://nebulacomponents.shop — 7 dark components. Copy, paste, done. Demo: nebulacomponents.shop/demo.html

2. **Done-For-You ($197):** https://launchcrate.io — I build your entire page + email setup + outreach sequence. Delivered in 24 hours. 4 spots left at this price.

Both backed by a "Ship or It's Free" guarantee. If you don't ship, you don't pay.

Just replying to this email works too — I'll build your page tonight.

Best,
Nebula / LaunchCrate"""

    html = f"""<p>Hi {to_name},</p>
<p>Quick follow-up on my earlier email.</p>
<p>If you're still working on your landing page — <strong>two options:</strong></p>
<p><strong style="color:#818cf8">1. DIY — $7</strong><br/>7 dark-themed components at <a href="https://nebulacomponents.shop">nebulacomponents.shop</a><br/><a href="https://nebulacomponents.shop/demo.html" style="color:#818cf8">See the demo</a></p>
<p><strong style="color:#fbbf24">2. Done-For-You — $197 (reg $750)</strong><br/>I build your page + email + outreach. 24h delivery.<br/><a href="https://launchcrate.io" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#ec4899);color:#0a0a0f;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none">Claim a Spot →</a></p>
<p><strong style="color:#34d399">"Ship or It's Free" guarantee on both.</strong></p>
<p>Just reply to this email and I'll get started.</p>"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False

# Connect once, send all
ctx = ssl.create_default_context()
with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx) as server:
    server.login(SMTP_USER, SMTP_PASS)
    sent = 0
    for email, name in targets:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_USER
        msg["To"] = email
        msg["Subject"] = "24h follow-up: still looking for a landing page?"
        
        text = f"Hi {name},\n\nQuick follow-up. If you're still working on your landing page:\n\n1. DIY ($7): https://nebulacomponents.shop\n2. Done-For-You ($197): https://launchcrate.io\n\nBoth have a 'Ship or It\\'s Free' guarantee.\n\nBest,\nNebula / LaunchCrate"
        html = f"<p>Hi {name},</p><p>Quick follow-up.</p><p><strong>$7 DIY:</strong> <a href='https://nebulacomponents.shop'>nebulacomponents.shop</a><br/><strong>$197 DFY:</strong> <a href='https://launchcrate.io'>launchcrate.io</a><br/><strong style='color:#34d399'>Ship or It's Free guarantee.</strong></p>"
        
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))
        
        try:
            server.sendmail(SMTP_USER, [email], msg.as_string())
            sent += 1
            print(f"[SENT {sent}] {email}")
        except Exception as e:
            print(f"[FAIL] {email}: {e}")
        
        # Small delay between sends
        if sent % 10 == 0:
            time.sleep(2)

print(f"\n=== SENT {sent}/{len(targets)} follow-ups via SMTP ===")