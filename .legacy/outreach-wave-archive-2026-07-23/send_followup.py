#!/usr/bin/env python3
"""Send 24h follow-up emails via SMTP"""
import smtplib, ssl, time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

with open("/tmp/am_key") as f:
    pw = f.read().strip()

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"

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

ctx = ssl.create_default_context()
sent = 0

with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx) as server:
    server.login(SMTP_USER, pw)
    print("SMTP login OK")
    
    for email in targets:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_USER
        msg["To"] = email
        msg["Subject"] = "24h follow-up: still working on your landing page?"
        
        text = "Quick follow-up:\n\n1. DIY ($7): https://nebulacomponents.shop\n2. DFY ($197): https://launchcrate.io\n\nShip or It's Free.\n\nBest,\nNebula"
        html = "<p>Quick follow-up:</p><p><a href='https://nebulacomponents.shop'>Nebula Components</a> $7</p><p><a href='https://launchcrate.io'>LaunchCrate</a> $197 DFY</p><p>Ship or It's Free.</p>"
        
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))
        
        server.sendmail(SMTP_USER, [email], msg.as_string())
        sent += 1
        print(f"[{sent}] {email}")
        
        if sent % 10 == 0:
            time.sleep(1)

print(f"\n=== Sent {sent}/{len(targets)} ===")
