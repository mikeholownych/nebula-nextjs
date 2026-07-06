#!/usr/bin/env python3
"""Batch 6 - send more outreach"""
import json, urllib.request

with open("/tmp/am_key") as f:
    raw = f.read().strip()

HEADERS = {"Authorization": f"Bearer {raw}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email, subject, text_body, html_body):
    data = {"to": [to_email], "subject": subject, "text": text_body, "html": html_body, "labels": ["outreach-wave2"]}
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return True, "sent"
    except urllib.error.HTTPError as e:
        return False, f"{e.code}: {e.read().decode()[:100]}"
    except Exception as e:
        return False, str(e)

targets = [
    {"email": "nedco80@gmail.com", "name": "there", "context": "seeking co-founder for a supply chain SaaS"},
    {"email": "vsl.and@gmail.com", "name": "there", "context": "looking for a micro-SaaS partner"},
    {"email": "bjoroen.eirik@gmail.com", "name": "Eirik", "context": "looking to co-found a SaaS product"},
]

SITE = "https://nebulacomponents.shop"
sent = 0
for t in targets:
    text = f"""Hi {t['name']},

I saw you {t['context']} - exciting stuff!

Quick share: Nebula Components. 7 dark-themed SaaS landing page sections. Hero, features, pricing, testimonials, FAQ, CTA, footer. One design system. Zero frameworks. Copy, paste, deploy.

I just launched a flash sale - $7 (normally $29) for the next 24 hours. And a "Ship or I Pay You" guarantee - if you dont ship a landing page in 30 days, I refund you AND pay you $29.

Free tool to try it out: {SITE}/generator.html
Buy: {SITE}

Best,
Nebula Components"""

    html = f"""<p>Hi {t['name']},</p>
<p>I saw you {t['context']} - exciting stuff!</p>
<p><strong>Nebula Components</strong> - 7 dark-themed SaaS landing page sections. Hero, features, pricing, testimonials, FAQ, CTA, footer. Zero frameworks.</p>
<p><strong style="color:#fbbf24">$7 flash sale</strong> (was $29) - 24 hours - "Ship or I Pay You" guarantee</p>
<p><a href="{SITE}/generator.html">Try the free hero generator</a> - <a href="{SITE}">Buy the full pack</a></p>"""

    ok, msg = send(t["email"], "Your SaaS landing page - ship tonight for $7", text, html)
    print(f"{'[SENT]' if ok else '[FAIL]'} {t['email']}: {msg[:50]}")
    if ok: sent += 1

print(f"\n=== Sent {sent}/{len(targets)} ===")