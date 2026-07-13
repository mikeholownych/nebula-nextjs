#!/usr/bin/env python3
"""Midnight UTC AgentMail Blast — Fresh personalized outreach only.
Only sends to verified high-pain founders who haven't been contacted before."""
import json, urllib.request, time, os

with open("/tmp/am_key") as f:
    key = f.read().strip()

HEADERS = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
INBOX = "nebulashop@agentmail.to"
SITE = "https://nebulacomponents.shop"
LC = "https://launchcrate.io"

def send(to_email, subject, text_body, html_body):
    data = {
        "to": [to_email],
        "subject": subject,
        "text": text_body,
        "html": html_body,
        "labels": ["midnight-blast"]
    }
    req = urllib.request.Request(
        f"https://api.agentmail.to/inboxes/{INBOX}/messages/send",
        data=json.dumps(data).encode(), headers=HEADERS, method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return True, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:120]
        return False, f"{e.code}: {body}"

targets = [
    {"email": "hassan.cheema.edu@gmail.com", "name": "Hassan", "context": "45 days building SubKitt (subkitt.com), 0 users connected"},
    {"email": "hello@owelet.app", "name": "Owelet", "context": "2 months building Owelet, 0 paying users despite strong signals"},
    {"email": "support@oricards.com", "name": "OriCards", "context": "2 weeks building AI trading card generator, 0 users"},
]

print(f"=== MIDNIGHT BLAST ===")
print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
print(f"Targets: {len(targets)}\n")

sent = 0
for t in targets:
    text = (
        f"Hi {t['name']},\n\n"
        f"I read your IndieHackers post about {t['context']}. "
        f"That's exactly the kind of situation I've been working on.\n\n"
        f"I built LaunchCrate — I create professional landing pages + email setup + "
        f"outreach sequences for founders who need to ship fast. Delivered in 24 hours. "
        f"Early adopter price: $97 (normally $750).\n\n"
        f"{LC}\n\n"
        f"Also have a DIY option (7 component sections, $7): {SITE}\n\n"
        f"'Ship or It's Free' guarantee on both.\n\n"
        f"Run the self-serve audit here: https://nebulacomponents.shop/audit.html\nImplementation checkout: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b\n\n"
        f"Best,\nLaunchCrate"
    )
    html = (
        f"<p>Hi {t['name']},</p>"
        f"<p>I read your IH post about <strong>{t['context']}</strong>.</p>"
        f"<p><strong>LaunchCrate ($97):</strong> I build your landing page, set up email, "
        f"write outreach. 24h delivery. <a href='{LC}'>{LC}</a></p>"
        f"<p><strong>Nebula ($7):</strong> DIY components. <a href='{SITE}'>{SITE}</a></p>"
        f"<p><strong style='color:#34d399'>Ship or It's Free guarantee.</strong></p>"
        f"<p>Reply if you want a quick audit.</p>"
    )
    
    ok, msg = send(t["email"], f"Saw your IH post — {t['context'][:55]}", text, html)
    if ok:
        sent += 1
        print(f"[SENT] {t['email']}")
    else:
        print(f"[FAIL] {t['email']}: {msg}")
    time.sleep(1.5)

print(f"\n=== SENT {sent}/{len(targets)} ===")

# Log
log = {"time": time.strftime("%Y-%m-%d %H:%M:%S UTC"), "wave": "midnight-blast", "sent": sent, "total": len(targets)}
os.makedirs("/home/mike/nebula/orders", exist_ok=True)
with open("/home/mike/nebula/outreach_log.json", "a") as f:
    f.write(json.dumps(log) + "\n")
print(json.dumps(log))
