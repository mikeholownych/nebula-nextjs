#!/usr/bin/env python3
"""Batch 4 - more cold outreach"""
import json, urllib.request

with open("/tmp/am_key") as f:
    raw_key = f.read().strip()

HEADERS = {"Authorization": f"Bearer {raw_key}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send_email(to_email, subject, text_body, html_body):
    data = {
        "to": [to_email],
        "subject": subject,
        "text": text_body,
        "html": html_body,
        "labels": ["outreach-campaign"]
    }
    req = urllib.request.Request(
        f"https://api.agentmail.to/inboxes/{INBOX}/messages/send",
        data=json.dumps(data).encode(),
        headers=HEADERS,
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return True, "sent"
    except urllib.error.HTTPError as e:
        return False, f"{e.code}: {e.read().decode()[:150]}"
    except Exception as e:
        return False, str(e)

targets = [
    {"email": "algor.tago@gmail.com", "name": "there", "context": "built LumigoApp for logistics but need help with customer acquisition"},
    {"email": "jerryatbusiness@gmail.com", "name": "Jerry", "context": "building a self-serving SaaS for B2B sales"},
    {"email": "stellytips@gmail.com", "name": "there", "context": "building SaaS and looking for a sales partner"},
    {"email": "lholmes274@gmail.com", "name": "there", "context": "building a simpler booking SaaS for local providers"},
    {"email": "rcschupp@gmail.com", "name": "there", "context": "looking for a technical cofounder for a civil SaaS"},
    {"email": "davidwang913526@gmail.com", "name": "David", "context": "a dev helping startups move forward"},
    {"email": "muhammadabusufyangoraya@gmail.com", "name": "there", "context": "working on a PropTech/SaaS studio"}
]

sent_count = 0
for t in targets:
    site_url = "https://nebulacomponents.shop"
    
    text = f"""Hi {t['name']},

I saw you {t['context']} - sounds like an exciting project!

Quick suggestion: Nebula Components. It's a pack of 7 dark-themed HTML/CSS landing page sections made for SaaS products. Hero, features, pricing, testimonials, FAQ, CTA, footer - unified design system, zero frameworks, works in any browser.

Copy, paste, deploy in minutes. $29 one-time, commercial license.

Demo: {site_url}/demo.html
Buy: {site_url}

Let me know if you have questions!

Best,
Nebula Components"""

    html = f"""<p>Hi {t['name']},</p>
<p>I saw you {t['context']} - sounds like an exciting project!</p>
<p>Quick suggestion: <strong>Nebula Components</strong>. It's a pack of 7 dark-themed HTML/CSS landing page sections made for SaaS products. Hero, features, pricing, testimonials, FAQ, CTA, footer - unified design system, zero frameworks, works in any browser.</p>
<p>Copy, paste, deploy in minutes. <strong>$29 one-time</strong>, commercial license.</p>
<p><a href="{site_url}/demo.html">View the demo</a> &middot; <a href="{site_url}">Buy now</a></p>"""

    success, msg = send_email(t["email"], "Quick tip for your SaaS landing page", text, html)
    
    if success:
        print(f"[SENT] {t['email']}")
        sent_count += 1
    else:
        print(f"[FAIL] {t['email']}: {msg[:100]}")

print(f"\n=== Results: {sent_count}/{len(targets)} sent ===")