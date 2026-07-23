#!/usr/bin/env python3
"""Batch 2 - cold outreach for Nebula Components"""
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
    {"email": "releaselogofficial@gmail.com", "name": "there", "context": "launching ReleaseLog on Product Hunt tomorrow"},
    {"email": "rkotcher@gmail.com", "name": "there", "context": "helping SaaS founders find first customers"},
    {"email": "gupta.shivani7896@gmail.com", "name": "Shivani", "context": "a frontend developer looking for SaaS projects"},
    {"email": "kevin.chisumdev@gmail.com", "name": "Kevin", "context": "a senior dev looking to work with founders"},
    {"email": "vemtraclabs@gmail.com", "name": "there", "context": "built a web accessibility SaaS at 15"},
    {"email": "career4lucas@gmail.com", "name": "there", "context": "building micro-SaaS products"}
]

sent_count = 0
for t in targets:
    site_url = "https://nebulacomponents.shop"
    
    text = f"""Hi {t['name']},

I saw you {t['context']} - that's awesome!

I wanted to share something that might help: Nebula Components. It's a pack of 7 dark-themed HTML/CSS landing page sections for SaaS products. Hero, features, pricing, testimonials, FAQ, CTA, footer - all with a unified design system.

Zero dependencies. No build tools. Just copy, paste, deploy.

Demo: {site_url}/demo.html
$29 one-time, commercial license: {site_url}

Let me know if you have any questions!

Best,
Nebula Components"""

    html = f"""<p>Hi {t['name']},</p>
<p>I saw you {t['context']} - that's awesome!</p>
<p>I wanted to share something that might help: <strong>Nebula Components</strong>. It's a pack of 7 dark-themed HTML/CSS landing page sections for SaaS products. Hero, features, pricing, testimonials, FAQ, CTA, footer - all with a unified design system.</p>
<p>Zero dependencies. No build tools. Just copy, paste, deploy.</p>
<p><a href="{site_url}/demo.html">View the demo</a></p>
<p><strong>$29 one-time</strong>, commercial license.</p>
<p><a href="{site_url}">&rarr; Get Nebula Components</a></p>"""

    success, msg = send_email(t["email"], "Your next landing page - 30 seconds to ship", text, html)
    
    if success:
        print(f"[SENT] {t['email']}")
        sent_count += 1
    else:
        print(f"[FAIL] {t['email']}: {msg[:100]}")

print(f"\n=== Results: {sent_count}/{len(targets)} sent ===")