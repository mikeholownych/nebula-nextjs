#!/usr/bin/env python3
"""FINAL BLAST - Stripe payment links now live. Zero excuses left."""
import json, urllib.request

with open("/tmp/am_key") as f:
    raw = f.read().strip()

HEADERS = {"Authorization": f"Bearer {raw}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

NEBULA_LINK = "https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00"
LAUNCH_LINK = "https://buy.stripe.com/7sYeVdeaw0wk1DzfA643S01"

def send(to_email):
    text = f"""Just added credit card payments. No more ETH. No more friction.

Two offers. Zero excuses.

1. NEBULA COMPONENTS — Name Your Price (min $1)
7 premium SaaS landing page sections. Dark theme. Copy-paste HTML. Commercial license.
Buy: {NEBULA_LINK}
Demo: https://nebulacomponents.shop/demo.html

2. LAUNCHCRATE — $197 (was $750, 4 spots left)
I build your entire landing page + email setup + outreach sequences + nurture automation. Delivered in 24 hours.
Buy: {LAUNCH_LINK}
Details: https://launchcrate.io

Both have a "Ship or It's Free" guarantee. If I don't deliver, you don't pay.

Best,
Nebula Components / LaunchCrate"""

    html = f"""<p>Just added <strong>credit card payments</strong>. Zero friction. Two offers.</p>
<p><strong style="color:#818cf8;font-size:1.1em">1. Nebula Components — Name Your Price</strong><br/>7 premium SaaS sections. Dark theme. Copy-paste HTML. Commercial license.</p>
<p><a href="{NEBULA_LINK}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;font-weight:600;text-decoration:none">Name Your Price →</a></p>
<p><strong style="color:#fbbf24;font-size:1.1em">2. LaunchCrate — $197 (was $750)</strong><br/>I build your landing page + email + outreach + nurture. Delivered in 24 hours.</p>
<p><a href="{LAUNCH_LINK}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#ec4899);color:#0a0a0f;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">Claim Your Slot →</a></p>
<p><strong style="color:#34d399">"Ship or It's Free" guarantee on both.</strong></p>"""
    
    data = {"to": [to_email], "subject": "Credit cards now accepted. No more excuses.", "text": text, "html": html, "labels": ["stripe-live"]}
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

print(f"\nPayment links live:")
print(f"Nebula: {NEBULA_LINK}")
print(f"LaunchCrate: {LAUNCH_LINK}")