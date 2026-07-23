#!/usr/bin/env python3
"""Gojiberry method: Question-first. 23 words. No pitch."""
import json, urllib.request, time

with open("/tmp/am_key") as f:
    key = f.read().strip()

HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"

def send(to_email):
    data = {
        "to": [to_email],
        "subject": "Quick question",
        "text": "Quick question — what's your biggest challenge with getting your first customers right now?",
        "html": "<p><strong>Quick question</strong> — what's your biggest challenge with getting your first customers right now?</p>",
        "labels": ["question-first"]
    }
    req = urllib.request.Request(f"https://api.agentmail.to/inboxes/{INBOX}/messages/send", data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    try:
        urllib.request.urlopen(req, timeout=15)
        return True
    except urllib.error.HTTPError as e:
        return False

targets = [
    "tianyajinhui@gmail.com", "quietpulse.social@gmail.com", "voder.ai.agent@gmail.com",
    "quratulaincreatives@gmail.com", "releaselogofficial@gmail.com", "rkotcher@gmail.com",
    "gupta.shivani7896@gmail.com", "kevin.chisumdev@gmail.com", "career4lucas@gmail.com",
    "shawnxu0208@gmail.com", "scalewords.agency@gmail.com", "zyvara.group@gmail.com",
    "dinirangapremanayake@gmail.com", "beniciocardozomdp@gmail.com",
    "algor.tago@gmail.com", "jerryatbusiness@gmail.com", "stellytips@gmail.com",
    "lholmes274@gmail.com", "rcschupp@gmail.com", "davidwang913526@gmail.com",
    "muhammadabusufyangoraya@gmail.com", "nedco80@gmail.com", "vsl.and@gmail.com",
    "bjoroen.eirik@gmail.com", "matze.schedel@gmail.com", "ainikaautomation@gmail.com",
    "shadowroot47@outlook.com"
]

sent = 0
for email in targets:
    if send(email):
        sent += 1
        print(f"[{sent}] {email}")

print(f"\n=== Sent {sent}/{len(targets)} question-first (Gojiberry style) ===")
