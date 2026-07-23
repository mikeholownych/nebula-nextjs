#!/usr/bin/env python3
"""LAST CHANCE follow-up - flash sale ending soon. Send to all previous targets."""
import json, urllib.request

with open("/tmp/am_key") as f:
    raw = f.read().strip()

HEADERS = {"Authorization": f"Bearer {raw}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email):
    data = {
        "to": [to_email],
        "subject": "Last chance: Nebula at $7 (price going up)",
        "text": f"""Hi there,

Just a heads up - the Nebula Components flash sale is still running but won't last long.

$7 for 7 premium dark-themed SaaS landing page components. Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer. Zero dependencies. Copy, paste, deploy.

The "Ship or I Pay You" guarantee: Buy it. Build your landing page. If you haven't shipped in 30 days, I refund you AND pay you $29.

https://nebulacomponents.shop

Plus 2 free tools to try right now (no signup):
- Hero Generator: https://nebulacomponents.shop/generator.html
- Pricing Generator: https://nebulacomponents.shop/pricing-generator.html

Price goes up after the flash sale ends. Grab it now.

Best,
Nebula Components""",
        "html": f"""<p>Hi there,</p>
<p>Just a heads up - the <strong>Nebula Components</strong> flash sale is still running but won't last long.</p>
<p><strong style="color:#fbbf24;font-size:1.25em">$7</strong> for 7 premium dark-themed SaaS landing page components. Zero dependencies. Copy, paste, deploy.</p>
<p><strong>The "Ship or I Pay You" guarantee:</strong> Buy it. Build your landing page. If you haven't shipped in 30 days, I refund you AND pay you $29.</p>
<p><a href="https://nebulacomponents.shop" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#ec4899);color:#0a0a0f;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1rem">&rarr; Buy Nebula for $7</a></p>
<p>Free tools (no signup):<br/>
&middot; <a href="https://nebulacomponents.shop/generator.html">Hero Generator</a><br/>
&middot; <a href="https://nebulacomponents.shop/pricing-generator.html">Pricing Generator</a></p>
<p>Price goes up after the flash sale ends. Grab it now.</p>""",
        "labels": ["last-chance-followup"]
    }
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return True, "sent"
    except urllib.error.HTTPError as e:
        return False, f"{e.code}: {e.read().decode()[:80]}"
    except Exception as e:
        return False, str(e)

# All previous targets combined
all_emails = [
    "tianyajinhui@gmail.com", "quietpulse.social@gmail.com", "voder.ai.agent@gmail.com",
    "quratulaincreatives@gmail.com", "releaselogofficial@gmail.com", "rkotcher@gmail.com",
    "gupta.shivani7896@gmail.com", "kevin.chisumdev@gmail.com", "career4lucas@gmail.com",
    "shawnxu0208@gmail.com", "scalewords.agency@gmail.com", "zyvara.group@gmail.com",
    "dinirangapremanayake@gmail.com", "beniciocardozomdp@gmail.com",
    "algor.tago@gmail.com", "jerryatbusiness@gmail.com", "stellytips@gmail.com",
    "lholmes274@gmail.com", "rcschupp@gmail.com", "davidwang913526@gmail.com",
    "muhammadabusufyangoraya@gmail.com", "nedco80@gmail.com", "vsl.and@gmail.com",
    "bjoroen.eirik@gmail.com"
]

sent = 0
failed = 0
for email in all_emails:
    ok, msg = send(email)
    if ok:
        sent += 1
        print(f"[SENT] {email}")
    else:
        failed += 1
        print(f"[FAIL] {email}: {msg}")

print(f"\n=== RESULTS: {sent} sent, {failed} failed ===")