#!/usr/bin/env python3
"""FINAL BLAST - Name Your Price. 24 hours. Maximum urgency."""
import json, urllib.request

with open("/tmp/am_key") as f:
    raw = f.read().strip()

HEADERS = {"Authorization": f"Bearer {raw}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email):
    text = f"""I'm doing something crazy.

For the next 24 hours, you can name your own price for Nebula Components.

7 premium dark-themed SaaS landing page sections. Commercial license. Unlimited projects. Zero dependencies.

Pay what you want. $1. $5. $29. $100. Your call.

Why? Because I'd rather have 100 people using it at $1 than 0 people at $7.

And I know once you see the quality, you'll tell other founders about it.

Name your price: https://nebulacomponents.shop
See the demo: https://nebulacomponents.shop/demo.html
Try the free tools: https://nebulacomponents.shop/generator.html

24 hours. Then it's gone.

Best,
Nebula Components"""

    html = f"""<p>I'm doing something crazy.</p>
<p>For the next <strong>24 hours</strong>, you can name your own price for <strong>Nebula Components</strong>.</p>
<p>7 premium dark-themed SaaS landing page sections. Commercial license. Unlimited projects. Zero dependencies.</p>
<p><strong style="color:#fbbf24;font-size:1.5em">Name Your Price</strong><br/>$1. $5. $29. $100. Your call.</p>
<p>Why? Because I'd rather have 100 people using it at $1 than 0 people at $7.</p>
<p><a href="https://nebulacomponents.shop" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#ec4899);color:#0a0a0f;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1rem">Name Your Price →</a></p>
<p><a href="https://nebulacomponents.shop/demo.html">See the demo</a> | <a href="https://nebulacomponents.shop/generator.html">Free tools</a></p>
<p><strong style="color:#ec4899">24 hours only.</strong></p>"""
    
    data = {"to": [to_email], "subject": "Name your price. 24 hours. Go.", "text": text, "html": html, "labels": ["name-your-price"]}
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return True
    except:
        return False

all_emails = [
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
for e in all_emails:
    if send(e):
        sent += 1
print(f"Sent {sent}/{len(all_emails)}")

# Also save the offer as a note
print("Nebula: Name Your Price (24h)")
print("LaunchCrate: $197 (4 spots)")
print("Email total: 92 + 27 = 119")