#!/usr/bin/env python3
"""Batch 7 - fresh indie hacker targets"""
import json, urllib.request, time

with open("/tmp/am_key") as f:
    raw = f.read().strip()

HEADERS = {"Authorization": f"Bearer {raw}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email, subject, text_body, html_body):
    data = {"to": [to_email], "subject": subject, "text": text_body, "html": html_body, "labels": ["outreach-wave3"]}
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return True, "sent"
    except urllib.error.HTTPError as e:
        return False, f"{e.code}: {e.read().decode()[:80]}"
    except:
        return False, "error"

targets = [
    {"email": "matze.schedel@gmail.com", "name": "Matze", "context": "just left a $900K ARR startup to build new things"},
    {"email": "ainikaautomation@gmail.com", "name": "there", "context": "building AI-powered SaaS products"},
    {"email": "shadowroot47@outlook.com", "name": "there", "context": "acquiring micro-SaaS products"}
]

SITE = "https://nebulacomponents.shop"
sent = 0

for t in targets:
    text = f"Hi {t['name']},\n\nI saw you {t['context']} - impressive!\n\nQuick share: Nebula Components. 7 dark-themed SaaS landing page sections. Hero, features, pricing, testimonials, FAQ, CTA, footer. Zero dependencies. Copy, paste, deploy.\n\nFlash sale: $7 (was $29) - limited time.\n\"Ship or I Pay You\" guarantee - if you don't ship in 30 days, I refund you AND pay you $29.\n\nFree tools to try: {SITE}/generator.html\nBuy: {SITE}\n\nBest,\nNebula Components"
    
    html = f"<p>Hi {t['name']},</p><p>I saw you {t['context']} - impressive!</p><p><strong>Nebula Components</strong> - 7 dark-themed SaaS landing page sections. Zero dependencies.</p><p><strong style='color:#fbbf24'>$7 flash sale</strong> (was $29) - limited time.</p><p><a href='{SITE}/generator.html'>Try the free hero generator</a> | <a href='{SITE}'>Buy the full pack</a></p>"
    
    ok, msg = send(t["email"], "Your SaaS landing page - ship tonight", text, html)
    print(f"{'[SENT]' if ok else '[FAIL]'} {t['email']}")
    if ok: sent += 1

print(f"\n=== Sent {sent}/{len(targets)} ===")