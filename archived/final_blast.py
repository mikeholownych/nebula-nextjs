#!/usr/bin/env python3
"""FINAL BLAST - New offer to everyone. Customer conversations, not landing pages."""
import json, urllib.request, time

with open("/tmp/am_key") as f:
    key = f.read().strip()

HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email):
    text = """Quick question: are you trying to get your first customers right now?

Here's the offer: I'll help you get a customer conversation within 7 days. I'll build your landing page, write your outreach sequence, and set everything up.

Cost: $97.
Guarantee: If you don't get a genuine customer conversation within 7 days, I refund every penny.

Run the self-serve audit: https://nebulacomponents.shop/audit.html

Best,
Nebula / LaunchCrate"""

    html = """<p><strong>Quick question: trying to get your first customers?</strong></p>
<p>I'll help you get a <strong>genuine customer conversation within 7 days</strong>. Landing page + outreach sequence + setup. $97.</p>
<p><strong style="color:#34d399">Guaranteed: conversation or full refund.</strong></p>
<p>Run the self-serve audit: https://nebulacomponents.shop/audit.html</p><p>Implementation checkout: https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02</p>"""
    
    data = {"to": [to_email], "subject": "Customer conversations, not landing pages", "text": text, "html": html, "labels": ["final-blast"]}
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        urllib.request.urlopen(req, timeout=15)
        return True
    except:
        return False

all_targets = [
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
for email in all_targets:
    if send(email):
        sent += 1
        print(f"[{sent}] {email}")

print(f"\n=== Sent {sent}/{len(all_targets)} ===")
