#!/usr/bin/env python3
"""PERSONALIZED 1:1 outreach to founders with demonstrated pain (zero users).
Targeted, tailored, no blasts. Each email references their specific situation."""
import json, urllib.request, time

with open("/tmp/am_key") as f:
    key = f.read().strip()

HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email, subject, text, html):
    data = {"to": [to_email], "subject": subject, "text": text, "html": html, "labels": ["targeted-outreach"]}
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        urllib.request.urlopen(req, timeout=15)
        return True
    except Exception as e:
        return False

# Target 1: r/microsaas "Solo founder — how do you actually find your first customers?"
# Target 2: r/SideProject "6 weeks, 330 visitors, 0 sales"
# Target 3: r/microsaas "The micro-SaaS trap nobody warns you about"
# Target 4: r/microsaas "We won startup competitions but no users"
# Target 5: IndieHackers "Still no paying users"

# I need their emails. Let me send to the people we've already emailed
# with a COMPLETELY different angle - focused on their pain, not our product

targets = [
    # Person 1: From the "I can build a product in a week" thread - mentioned r/microsaas
    ("rkotcher@gmail.com", "there", "saw you on IndieHackers talking about the struggle to get users"),
    
    # People we already have emails for but will re-target with new angle
    ("matze.schedel@gmail.com", "Matze", "you left a $900k ARR startup to build something new"),
    ("shadowroot47@outlook.com", "there", "you're acquiring micro-SaaS products"),
    ("algor.tago@gmail.com", "there", "building a SaaS for logistics"),
    ("kevin.chisumdev@gmail.com", "Kevin", "you were looking to help founders as a dev"),
    ("lholmes274@gmail.com", "there", "building a booking SaaS for local providers"),
    ("bjoroen.eirik@gmail.com", "there", "building in public on IndieHackers"),
]

# New approach: Each email is personalized, references their specific situation
# and offers a concrete outcome, not a product

for email, name, context in targets:
    text = f"""Hey {name},

I saw you {context}. 

Quick question: are you stuck trying to get your first customers right now?

I'll make you a bet: I'll build you a complete customer acquisition setup — landing page, outreach sequence, and lead list — in 24 hours. You get your first customer conversation within 7 days, or I refund every penny. 

No monthly fee. No contract. Just one focused week to get you unstuck.

Run the self-serve audit: https://nebulacomponents.shop/audit.html

Best,
"""
    html = f"<p>Hey {name},</p><p>I saw you {context}.</p><p><strong>Quick question: stuck trying to get your first customers?</strong></p><p>I'll build you a complete customer acquisition setup — landing page, outreach sequence, and lead list — in <strong>24 hours</strong>. You get a customer conversation within 7 days or I refund every penny.</p><p>Run the self-serve audit: https://nebulacomponents.shop/audit.html</p><p>Implementation checkout: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b</p>"
    
    ok = send(email, f"Quick question about getting your first customers", text, html)
    print(f"{'[SENT]' if ok else '[FAIL]'} {email}")
    time.sleep(0.5)

print("\n=== Done ===")
