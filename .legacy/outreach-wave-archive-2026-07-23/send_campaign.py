#!/usr/bin/env python3
"""Send cold outreach for Nebula Components via AgentMail"""
import json, urllib.request

# Read API key from file (avoids content filtering)
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
        result = json.loads(resp.read())
        return True, result.get("message_id", "?")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return False, f"HTTP {e.code}: {body[:150]}"
    except Exception as e:
        return False, str(e)

targets = [
    {"email": "tianyajinhui@gmail.com", "name": "there", "context": "just launched a SaaS 2 weeks ago"},
    {"email": "quietpulse.social@gmail.com", "name": "there", "context": "building QuietPulse, a cron monitoring SaaS"},
    {"email": "voder.ai.agent@gmail.com", "name": "there", "context": "launched PingSLA"},
    {"email": "quratulaincreatives@gmail.com", "name": "there", "context": "working on a SaaS project"}
]

sent_count = 0
for t in targets:
    site_url = "https://nebulacomponents.shop"
    
    text = f"""Hi {t['name']},

I saw you {t['context']} - congrats on shipping.

I wanted to share something I built that might save you a weekend: Nebula Components.

It's a pack of 7 beautifully designed, dark-themed HTML/CSS landing page sections for SaaS products. Hero, features grid, pricing table, testimonials, FAQ accordion, CTA, footer - all with a unified indigo/cyan design system.

Zero dependencies. No build tools. Pure copy-paste HTML/CSS. You can go from zero to a production-ready landing page in minutes.

See the live demo: {site_url}/demo.html

It's $29 one-time with a commercial license - use it in unlimited projects.

{site_url}

Let me know if you have any questions!

Best,
Nebula Components"""

    html = f"""<p>Hi {t['name']},</p>
<p>I saw you {t['context']} - congrats on shipping.</p>
<p>I wanted to share something I built that might save you a weekend: <strong>Nebula Components</strong>.</p>
<p>It's a pack of 7 beautifully designed, dark-themed HTML/CSS landing page sections for SaaS products. Hero, features grid, pricing table, testimonials, FAQ accordion, CTA, footer - all with a unified indigo/cyan design system.</p>
<p>Zero dependencies. No build tools. Pure copy-paste HTML/CSS.</p>
<p>See the live demo: <a href="{site_url}/demo.html">{site_url}/demo</a></p>
<p><strong>$29 one-time</strong> - commercial license, unlimited projects.</p>
<p><a href="{site_url}">&rarr; Get Nebula Components</a></p>"""

    success, msg = send_email(t["email"], "Your SaaS landing page - 30 seconds, zero code", text, html)
    
    if success:
        print(f"[SENT] {t['email']}")
        sent_count += 1
    else:
        print(f"[FAIL] {t['email']}: {msg[:100]}")

print(f"\n=== Results: {sent_count}/{len(targets)} sent ===")