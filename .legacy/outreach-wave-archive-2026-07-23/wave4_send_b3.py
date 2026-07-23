#!/usr/bin/env python3
"""
Wave 4 Batch 3 — IH Ferguson thread leads
Confirmed emails: hello@boothkeepos.com, hello@theogeo.ai, lakisha@goldenweeks.co, alloceraintelligence@gmail.com
Plus: deepanshu11madan@gmail.com (naxely.com — PH launch this Wed, hot trigger)
"""
import sys, json, datetime, time, smtplib, ssl, importlib.util, re, os
sys.path.insert(0, "/home/mike/nebula")

# Load AgentMail client for sending
from agentmail_client import AgentMailClient
from deliver_audit import scrape_page, score_audit

SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "nebulashop@agentmail.to"
SMTP_PASS_FILE = os.path.expanduser("~/.hermes/secrets/agentmail.key")
with open(SMTP_PASS_FILE) as f:
    SMTP_PASS = f.read().strip()

CONTACTED_FILE = "/home/mike/nebula/contacted.json"
LEDGER_FILE = "/home/mike/nebula/ledgers/customer-ledger.jsonl"
FROM = "Nebula Components <nebulashop@agentmail.to>"

# Load existing contacted list
with open(CONTACTED_FILE) as f:
    contacted = json.load(f)

DIM_NAMES = {"headline":"Headline Clarity","cta":"Call-to-Action","social_proof":"Social Proof","speed":"Load Speed","mobile":"Mobile Readiness"}

def compose(to_email, lead_url, context_hook, ih_handle=None):
    page = scrape_page(lead_url)
    audit = score_audit(page)
    dims = audit["dimensions"]
    overall = audit["overall"]
    grade = audit["overall_grade"]
    sorted_dims = sorted(dims.items(), key=lambda x: x[1]["score"])
    top1 = sorted_dims[0]; top2 = sorted_dims[1]
    t1n = DIM_NAMES.get(top1[0], top1[0]); t1d = top1[1]
    t2n = DIM_NAMES.get(top2[0], top2[0]); t2d = top2[1]
    domain = lead_url.replace("https://","").replace("http://","").split("/")[0]
    
    subject = f"{domain} — free landing page audit (scored {overall}/10)"
    
    text = f"""{context_hook}

Here's your free audit for {lead_url}:

Overall: {overall}/10 ({grade})

#1 issue costing you conversions:
{t1n}: {t1d['score']}/10 — {t1d['issue']}
Fix: {t1d['fix']}

Second priority — {t2n}: {t2d['score']}/10
{t2d['fix']}

Two options to go deeper:
1. Free 20-min call — reply and we'll find a time.
2. Written fix priority list ($97) — every issue ranked by impact vs effort, exact copy rewrites, sequenced order. Reply "fix list" to start.

Audit is yours. No strings.

— Mike
Nebula Components | nebulacomponents.shop"""
    
    return subject, text, overall, grade, top1[0]

def send_one(to_email, subject, text):
    msg = f"From: {FROM}\r\nTo: {to_email}\r\nSubject: {subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n{text}"
    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx) as s:
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(SMTP_USER, [to_email], msg.encode("utf-8"))

LEADS = [
    {
        "email": "hello@boothkeepos.com",
        "url": "https://boothkeepos.polsia.app",
        "context": "Saw your comment on the IH Ferguson thread — you mentioned getting traffic but struggling to convert. That's the exact thing I audit.",
        "handle": "boothkeepos",
    },
    {
        "email": "hello@theogeo.ai",
        "url": "https://theogeo.ai",
        "context": "Saw you drop theogeo.ai in the IH landing page thread. Ran a quick look — a few clear conversion gaps.",
        "handle": "judyalbeige",
    },
    {
        "email": "lakisha@goldenweeks.co",
        "url": "https://goldenweeks.co",
        "context": "Saw Goldenweeks on the IH landing page audit thread. Retreat for founders is a compelling offer — your landing page may be underselling it.",
        "handle": "goldenweeks",
    },
    {
        "email": "alloceraintelligence@gmail.com",
        "url": "https://alloceraintelligence.com",
        "context": "Saw Allocera drop two URLs on the IH thread today. Ran both — the main site has the clearest conversion opportunity.",
        "handle": "AlloceraCDAI",
    },
    {
        "email": "deepanshu11madan@gmail.com",
        "url": "https://naxely.com",
        "context": "Saw you mention naxely.com on IH and you're launching on Product Hunt this Wednesday. Pre-launch is the best time to tighten conversion — ran your page.",
        "handle": "deepanshu0110",
    },
]

sent = 0
errors = 0
for lead in LEADS:
    email = lead["email"]
    
    if email in contacted:
        print(f"  SKIP {email} (already contacted)")
        continue
    
    print(f"\n[{lead['handle']}] Auditing {lead['url']}...")
    try:
        subject, text, overall, grade, top_issue = compose(email, lead["url"], lead["context"])
        print(f"  Score: {overall}/10 ({grade}) | Top: {top_issue}")
        print(f"  Sending to {email}...")
        send_one(email, subject, text)
        
        # Log
        contacted[email] = {
            "email": email,
            "url": lead["url"],
            "handle": lead["handle"],
            "wave": "wave4_b3",
            "sent_at": datetime.datetime.now(datetime.UTC).isoformat(),
            "score": overall,
            "grade": grade,
        }
        entry = {
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "event": "outreach_sent",
            "lead_email": email,
            "url": lead["url"],
            "wave": "wave4_b3",
            "score": overall,
        }
        with open(LEDGER_FILE, "a") as lf:
            lf.write(json.dumps(entry) + "\n")
        
        print(f"  ✓ SENT")
        sent += 1
        time.sleep(2)
        
    except Exception as e:
        print(f"  ✗ ERROR: {e}")
        errors += 1

# Save updated contacted list
with open(CONTACTED_FILE, "w") as f:
    json.dump(contacted, f, indent=2)

total = len(contacted)
print(f"\n{'='*50}")
print(f"Wave 4 Batch 3 complete")
print(f"  Sent: {sent} | Errors: {errors}")
print(f"  contacted.json total: {total}")
print(f"{'='*50}")
