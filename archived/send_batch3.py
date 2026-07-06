#!/usr/bin/env python3
"""Batch 3 - cold outreach"""
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
    {"email": "shawnxu0208@gmail.com", "name": "Shawn", "context": "building a tool that makes email chains readable"},
    {"email": "scalewords.agency@gmail.com", "name": "there", "context": "running the ScaleWords $0 to $5K challenge"},
    {"email": "zyvara.group@gmail.com", "name": "there", "context": "building a SaaS and looking for paying users"},
    {"email": "dinirangapremanayake@gmail.com", "name": "there", "context": "just launched an MVP"},
    {"email": "beniciocardozomdp@gmail.com", "name": "there", "context": "launching a SaaS at 17"}
]

sent_count = 0
for t in targets:
    site_url = "https://nebulacomponents.shop"
    
    text = f"""Hi {t['name']},

I saw you {t['context']} - great stuff!

Quick share: Nebula Components. 7 dark-themed HTML/CSS landing page sections for SaaS. Hero, features, pricing, testimonials, FAQ, CTA, footer - one design system, zero frameworks.

Copy, paste, deploy. Works everywhere.

Demo: {site_url}/demo.html
$29 one-time, commercial license: {site_url}

Let me know if any questions!

Best,
Nebula Components"""

    html = f"""<p>Hi {t['name']},</p>
<p>I saw you {t['context']} - great stuff!</p>
<p>Quick share: <strong>Nebula Components</strong>. 7 dark-themed HTML/CSS landing page sections for SaaS. Hero, features, pricing, testimonials, FAQ, CTA, footer - one design system, zero frameworks.</p>
<p>Copy, paste, deploy. Works everywhere.</p>
<p><a href="{site_url}/demo.html">View the demo</a></p>
<p><strong>$29 one-time</strong>, commercial license.</p>
<p><a href="{site_url}">&rarr; Get Nebula Components</a></p>"""

    success, msg = send_email(t["email"], "Your next landing page - ship in minutes", text, html)
    
    if success:
        print(f"[SENT] {t['email']}")
        sent_count += 1
    else:
        print(f"[FAIL] {t['email']}: {msg[:100]}")

print(f"\n=== Results: {sent_count}/{len(targets)} sent ===")