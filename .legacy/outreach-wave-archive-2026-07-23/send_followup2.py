#!/usr/bin/env python3
"""Reconnect on each send to avoid timeout"""
import smtplib, ssl, time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

with open("/tmp/am_key") as f:
    pw = f.read().strip()

SMTP = ("smtp.agentmail.to", 465)
USER = "nebulashop@agentmail.to"

targets = [
    "tianyajinhui@gmail.com", "quietpulse.social@gmail.com", "voder.ai.agent@gmail.com",
    "quratulaincreatives@gmail.com", "releaselogofficial@gmail.com", "rkotcher@gmail.com",
    "gupta.shivani7896@gmail.com", "kevin.chisumdev@gmail.com", "career4lucas@gmail.com",
    "shawnxu0208@gmail.com", "scalewords.agency@gmail.com", "zyvara.group@gmail.com",
    "dinirangapremanayake@gmail.com", "beniciocardozomdp@gmail.com",
    "algor.tago@gmail.com", "jerryatbusiness@gmail.com", "stellytips@gmail.com",
    "lholmes274@gmail.com", "rcschupp@gmail.com", "davidwang913526@gmail.com",
    "muhammadabusufyangoraya@gmail.com", "nedco80@gmail.com", "vsl.and@gmail.com",
    "bjoroen.eirik@gmail.com", "matze.schedel@gmail.com", "ainikaautomation@gmail.com",
    "shadowroot47@outlook.com"
]

sent = 0
ctx = ssl.create_default_context()

for i, email in enumerate(targets):
    msg = MIMEMultipart("alternative")
    msg["From"] = USER
    msg["To"] = email
    msg["Subject"] = "24h follow-up: still working on your landing page?"
    msg.attach(MIMEText(f"Quick follow-up:\n\nDIY ($7): https://nebulacomponents.shop\nDFY ($197): https://launchcrate.io\n\nShip or It's Free guarantee.", "plain"))
    msg.attach(MIMEText(f"<p>Quick follow-up:</p><p><a href='https://nebulacomponents.shop'>Nebula Components</a> — $7 DIY</p><p><a href='https://launchcrate.io'>LaunchCrate</a> — $197 DFY</p><p><strong style='color:#34d399'>Ship or It's Free.</strong></p>", "html"))
    
    try:
        with smtplib.SMTP_SSL(SMTP[0], SMTP[1], context=ctx) as s:
            s.login(USER, pw)
            s.sendmail(USER, [email], msg.as_string())
        sent += 1
        print(f"[{sent}/{len(targets)}] {email}")
    except Exception as e:
        print(f"[FAIL] {email}: {str(e)[:60]}")
    
    if i > 0 and i % 5 == 0:
        time.sleep(2)

print(f"\n=== Sent {sent}/{len(targets)} ===")
