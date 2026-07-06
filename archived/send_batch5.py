#!/usr/bin/env python3
"""Batch 5 - $7 FLASH SALE emails. Hormozi energy."""
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
        "labels": ["outreach-flash-sale"]
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

# Previous targets who haven't bought yet + new ones
targets = [
    # New targets from recent indie hacker posts
    {"email": "tianyajinhui@gmail.com", "name": "there", "context": "launched a SaaS"},
    {"email": "quietpulse.social@gmail.com", "name": "there", "context": "building QuietPulse cron monitoring"},
    {"email": "releaselogofficial@gmail.com", "name": "there", "context": "launching ReleaseLog"},
    {"email": "shawnxu0208@gmail.com", "name": "Shawn", "context": "building an email readability tool"},
    {"email": "scalewords.agency@gmail.com", "name": "there", "context": "running ScaleWords challenge"},
    {"email": "zyvara.group@gmail.com", "name": "there", "context": "building a SaaS"},
    {"email": "dinirangapremanayake@gmail.com", "name": "there", "context": "just launched MVP"},
    {"email": "beniciocardozomdp@gmail.com", "name": "there", "context": "launching a SaaS"},
    {"email": "algor.tago@gmail.com", "name": "there", "context": "built LumigoApp logistics SaaS"},
    {"email": "jerryatbusiness@gmail.com", "name": "Jerry", "context": "building B2B sales SaaS"},
    {"email": "lholmes274@gmail.com", "name": "there", "context": "building booking SaaS"},
    {"email": "rcschupp@gmail.com", "name": "there", "context": "building civil SaaS"},
    {"email": "davidwang913526@gmail.com", "name": "David", "context": "helping startups"},
]

site_url = "https://nebulacomponents.shop"

sent_count = 0
for t in targets:
    text = f"""Hi {t['name']},

Earlier today I emailed you about Nebula Components — the dark SaaS landing page pack.

I just launched a flash sale. Here's the new deal:

PRICE: $7 (was $29)
TIME: 24 hours or 10 sales — whichever hits first
RISK: If you don't ship a landing page in 30 days, I refund you AND pay you $29

7 components. Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer. One dark design system. Zero dependencies. Copy, paste, deploy.

{site_url}

This price won't show up again. If you need a landing page, grab it now.

Best,
Nebula Components"""

    html = f"""<p>Hi {t['name']},</p>
<p>Earlier today I emailed you about Nebula Components. I just launched a <strong>flash sale</strong>.</p>
<p><strong style="color:#fbbf24;font-size:1.25em">$7</strong> <s style="color:#64748b">$29</s> &middot; 24 hours only &middot; 10 spots max</p>
<p><strong>The "Ship or I Pay You" Guarantee:</strong> Buy it. Build your landing page. If you don't ship in 30 days, I refund you AND pay you $29.</p>
<p>7 components. Zero dependencies. Copy, paste, deploy.</p>
<p><a href="{site_url}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#ec4899);color:#0a0a0f;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1rem">&rarr; Buy Nebula for $7</a></p>
<p><a href="{site_url}/demo.html">Preview the demo first</a></p>"""

    success, msg = send_email(t["email"], "Flash sale: $7 (was $29) — 24 hours only", text, html)
    
    if success:
        print(f"[SENT] {t['email']}")
        sent_count += 1
    else:
        print(f"[FAIL] {t['email']}: {msg[:100]}")

print(f"\n=== Results: {sent_count}/{len(targets)} sent ===")