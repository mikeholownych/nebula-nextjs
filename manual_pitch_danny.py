#!/usr/bin/env python3
"""Send manual personalized $147 pitch to Danny — our highest-signal lead."""
import sys, os, json
from pathlib import Path
sys.path.insert(0, '/home/mike/nebula')
os.environ['AGENTMAIL_API_KEY'] = str(Path.home() / ".hermes/secrets/agentmail_org.key")

import requests

ORG_KEY = (Path.home() / ".hermes/secrets/agentmail_org.key").read_text().strip()
FROM    = "ops@launchcrate.io"

body = """Hey Danny,

Saw your post on r/googleads — "Ready to bash my head against a wall, Google Ads clicks but zero conversions."

I ran the free audit on your washing machine repair page. Here's what I found in plain English:

Your page has zero CTA or headline above the fold. Someone clicks your ad, lands on the page, and the first 3000 characters don't tell them what to do, what you offer, or why you. That click costs you real money and walks out the door.

You also don't have Facebook Pixel or proper conversion tracking — so Google Ads is the only thing measuring success. If that goes down (and it will in 2026 with everything changing), you're flying blind.

The $147 Fix Pack addresses both in one shot:

1. Rebuild the above-fold section with a headline, sub-headline + primary CTA
2. Install FB Pixel + conversion tracking so you see the real picture
3. Tested and live within 48 hours

No call. No calendar. No "reply to schedule." You pay, I implement, you see the change.

https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00

If you want to try the $7 self-serve kit first: https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02

— Alex
Nebula Components"""

r = requests.post(
    f"https://api.agentmail.to/inboxes/{FROM}/messages/send",
    headers={"Authorization": f"Bearer {ORG_KEY}", "Content-Type": "application/json"},
    json={
        "to": ["danny@repairandsquare.com"],
        "subject": "repairandsquare — the specific fix for your Google Ads leak",
        "text": body,
    },
    timeout=15
)
print(f"Status: {r.status_code}")
result = r.json()
print(json.dumps(result, indent=2))
if r.status_code in (200, 201):
    print("\n✓ SENT to danny@repairandsquare.com")
else:
    print(f"\n✗ FAILED: {result}")
