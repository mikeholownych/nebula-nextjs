#!/usr/bin/env python3
"""Gojiberry-style outreach: Question first, pitch never (in the first message).
80% reply rate on a simple question. THEN offer help."""
import json, urllib.request, time

with open("/tmp/am_key") as f:
    key = f.read().strip()

HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email, subject, text, html):
    data = {"to": [to_email], "subject": subject, "text": text, "html": html, "labels": ["question-first"]}
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        urllib.request.urlopen(req, timeout=15)
        return True
    except:
        return False

# Gojiberry method: Just a question. No pitch. No link. No offer.
# 23 words max.

targets = [
    ("tianyajinhui@gmail.com", "there"),
    ("quietpulse.social@gmail.com", "there"),
    ("voder.ai.agent@gmail.com", "there"),
    ("quratulaincreatives@gmail.com", "there"),
    ("releaselogofficial@gmail.com", "there"),
    ("rkotcher@gmail.com", "there"),
    ("gupta.shivani7896@gmail.com", "there"),
    ("kevin.chisumdev@gmail.com", "Kevin"),
    ("career4lucas@gmail.com", "there"),
    ("shawnxu0208@gmail.com", "there"),
    ("scalewords.agency@gmail.com", "there"),
    ("zyvara.group@gmail.com", "there"),
    ("dinirangapremanayake@gmail.com", "there"),
    ("beniciocardozomdp@gmail.com", "there"),
    ("algor.tago@gmail.com", "there"),
    ("jerryatbusiness@gmail.com", "there"),
    ("stellytips@gmail.com", "there"),
    ("lholmes274@gmail.com", "there"),
    ("rcschupp@gmail.com", "there"),
    ("davidwang913526@gmail.com", "there"),
    ("muhammadabusufyangoraya@gmail.com", "there"),
    ("nedco80@gmail.com", "there"),
    ("vsl.and@gmail.com", "there"),
    ("bjoroen.eirik@gmail.com", "there"),
    ("matze.schedel@gmail.com", "Matze"),
    ("ainikaautomation@gmail.com", "there"),
    ("shadowroot47@outlook.com", "there"),
]

# Gojiberry style: 23 words. Just a question. No pitch.
SUBJECT = "Quick question"
TEXT = """Quick question — what's your biggest challenge with getting your first customers right now?"""
HTML = """<p><strong>Quick question</strong> — what's your biggest challenge with getting your first customers right now?</p>"""

sent = 0
for email, _ in targets:
    if send(email, "Quick question", TEXT, HTML):
        sent += 1
        print(f"[{sent}] {email}")

print(f"\n=== Sent {sent}/{len(targets)} question-first emails ===")
