#!/usr/bin/env python3
"""Agency pilot batch 2 -- corrected addresses + 2 new targets."""
import sys, os, time
sys.path.insert(0, "/home/mike/nebula")
os.chdir("/home/mike/nebula")

for line in open(".env"):
    k, _, v = line.strip().partition("=")
    if k and not k.startswith("#"):
        os.environ.setdefault(k, v)

from lead_store import LeadStore
from agentmail_client import AgentMailClient

store = LeadStore()
am = AgentMailClient()

TARGETS = [
    {
        "name": "Corey",
        "email": "corey@adsnord.com",
        "url": "https://adsnord.com",
        "audit_id": "c85f3f3c-2e50-4347-ad7d-520dab8d6134",
        "score": 7.0, "grade": "B",
        "worst_label": "Above Fold",
        "worst_finding": "First 3,000 source characters contain no H1, no primary CTA, and no offer signal -- above-fold clarity unverified.",
        "opener": '"We do Google Ads management. Landing page optimization is extra." -- you posted that. Wrong order. The page diagnosis should happen before the first ad dollar moves.',
    },
    {
        "name": "Vlad",
        "email": "vlad@lilikoiagency.com",
        "url": "https://lilikoiagency.com",
        "audit_id": "411906c0-62e1-4670-8852-66ad618e240c",
        "score": 6.0, "grade": "C",
        "worst_label": "Headline",
        "worst_finding": "H1 tag is present but empty (0 characters) -- no value proposition visible to search engines or screen readers.",
        "opener": "You described building a monthly strategy cycle with a landing page conversion review built in. Right instinct. The part most agencies still do manually.",
    },
    {
        "name": "Sean",
        "email": "sean.grabowski@keepersdigital.com",
        "url": "https://keepersdigital.com",
        "audit_id": "4c4a14db-744a-4d27-a547-2f10c8ed5efb",
        "score": 6.9, "grade": "B",
        "worst_label": "Ad Signals",
        "worst_finding": "No analytics artifact in source HTML -- a CRO agency homepage with no visible GA4 tag is the exact finding your clients would pay to fix on their pages.",
        "opener": "You run conversion audits for 7-8 figure businesses. Your own homepage doesn't show a GA4 tag in the source -- which is exactly the finding you'd lead with for a client.",
    },
    {
        "name": "Rutger",
        "email": "rutger@sqauras.com",
        "url": "https://sqauras.com",
        "audit_id": "9a8a9521-bc66-47c2-9122-6390df5f22fb",
        "score": 6.6, "grade": "B",
        "worst_label": "Above Fold",
        "worst_finding": "First 3,000 source characters contain no H1, no primary CTA, and no offer signal -- above-fold clarity unverified from static analysis.",
        "opener": 'You posted: "They were hemorrhaging money on Google Ads." The leak was the page, not the campaign -- and that\'s the diagnosis you had to do manually.',
    },
]


def build(t):
    audit_url = "https://nebulacomponents.com/audit/" + t["audit_id"]
    domain = t["url"].replace("https://", "").rstrip("/")
    subject = "landing page diagnosis at onboarding -- " + domain

    text = (
        t["opener"] + "\n\n"
        "That's exactly the gap I built something around.\n\n"
        "Ran " + t["url"] + " through the audit engine before writing this. "
        "Score: " + str(t["score"]) + "/10 Grade " + t["grade"] + ". "
        "Highest-impact finding: " + t["worst_label"] + " -- " + t["worst_finding"] + "\n\n"
        "Full report: " + audit_url + "\n\n"
        "The angle for agencies: white-label diagnostic at client onboarding. "
        "Instead of 'here's what we're going to test,' you hand the client a scored, "
        "evidence-backed report of what's broken before you spend a dollar of their budget. "
        "Makes the retainer feel justified on day one.\n\n"
        "Running a pilot with a small group of agencies before I formalise the partner program. "
        "If it's useful, I'd send a sample report on one of your client pages -- "
        "no pitch, just the output -- and hear whether it fits what you're already doing.\n\n"
        "Worth 10 minutes?\n\n"
        "Mike\nnebulacomponents.com"
    )

    score_color = "#22c55e" if t["score"] >= 7 else "#f59e0b" if t["score"] >= 5 else "#ef4444"

    html = (
        "<!DOCTYPE html>\n"
        "<html lang='en'>\n"
        "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>\n"
        "<body style='margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;'>\n"
        "<table width='100%' cellpadding='0' cellspacing='0' style='padding:32px 16px;'>\n"
        "<tr><td align='center'><table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;width:100%;'>\n"
        "  <tr><td style='padding:0 0 24px;'>"
        "<p style='margin:0;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00c2a0;'>Nebula Components</p>"
        "</td></tr>\n"
        "  <tr><td style='padding:0 0 20px;'>"
        "<p style='margin:0;font-size:15px;line-height:1.75;color:#111;'>" + t["opener"] + "</p>"
        "</td></tr>\n"
        "  <tr><td style='padding:0 0 20px;'>"
        "<p style='margin:0;font-size:15px;line-height:1.75;color:#111;'>That's exactly the gap I built something around.</p>"
        "</td></tr>\n"
        "  <tr><td style='background:#f9fafb;border-radius:8px;padding:18px 20px;border-left:3px solid #00c2a0;'>\n"
        "    <p style='margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;'>" + domain + "</p>\n"
        "    <p style='margin:0 0 8px;line-height:1;'>"
        "<span style='font-size:26px;font-weight:800;color:" + score_color + ";'>" + str(t["score"]) + "</span>"
        "<span style='font-size:14px;color:#9ca3af;'>/10 Grade " + t["grade"] + "</span>"
        "</p>\n"
        "    <p style='margin:0;font-size:13px;color:#374151;line-height:1.6;'>"
        "<strong>Highest-impact finding:</strong> " + t["worst_label"] + " -- " + t["worst_finding"] + "</p>\n"
        "  </td></tr>\n"
        "  <tr><td style='height:20px;'></td></tr>\n"
        "  <tr><td style='padding:0 0 16px;'>"
        "<p style='margin:0;font-size:15px;line-height:1.75;color:#111;'>"
        "The angle for agencies: white-label diagnostic at client onboarding. "
        "Instead of 'here's what we're going to test,' you hand the client a scored, "
        "evidence-backed report of what's broken before you spend a dollar of their budget. "
        "Makes the retainer feel justified on day one.</p>"
        "</td></tr>\n"
        "  <tr><td style='padding:0 0 20px;'>"
        "<p style='margin:0;font-size:15px;line-height:1.75;color:#111;'>"
        "Running a pilot with a small group of agencies before I formalise the partner program. "
        "If it's useful, I'd send a sample report on one of your client pages -- "
        "no pitch, just the output -- and hear whether it fits what you're already doing.</p>"
        "</td></tr>\n"
        "  <tr><td style='padding:0 0 24px;'>"
        "<p style='margin:0;font-size:15px;font-weight:600;color:#111;'>Worth 10 minutes?</p>"
        "</td></tr>\n"
        "  <tr><td style='padding:0 0 24px;'>"
        "<a href='" + audit_url + "' style='color:#00c2a0;font-size:13px;'>See full audit report for " + domain + " -&gt;</a>"
        "</td></tr>\n"
        "  <tr><td style='border-top:1px solid #f3f4f6;padding-top:20px;'>"
        "<p style='margin:0;font-size:12px;color:#9ca3af;'>Mike . <a href='https://nebulacomponents.com' style='color:#00c2a0;text-decoration:none;'>nebulacomponents.com</a></p>"
        "</td></tr>\n"
        "</table></td></tr>\n"
        "</table>\n"
        "</body></html>"
    )

    return subject, text, html


from outbound_release_gate import DeliveryPurpose as _DP

sent_log = []
for t in TARGETS:
    store.upsert_lead(
        email=t["email"],
        url=t["url"],
        stage="contacted",
        source="agency_pilot_outreach_b2",
        trigger_context="ppc_agency_lp_diagnosis_gap",
        audit_score=t["score"],
        audit_grade=t["grade"],
    )
    subject, text, html = build(t)
    client_id = "audit:agency-b2-" + t["audit_id"][:16]
    result = am.send_audit(
        to=[t["email"]], subject=subject, text=text, html=html, client_id=client_id,
    )
    ok = not result.get("_error")
    status = "SENT" if ok else ("FAIL:" + str(result.get("_reason", result.get("_error", "?")))[:40])
    msg_id = (result.get("message_id") or result.get("id") or "")[:50]
    print(status + " | " + t["name"] + " <" + t["email"] + ">")
    if msg_id:
        print("  msg_id: " + msg_id)
    if not ok:
        print("  detail: " + str(result))
    sent_log.append({"name": t["name"], "email": t["email"], "ok": ok})
    if len(sent_log) < len(TARGETS):
        time.sleep(35)

print("\n--- SUMMARY ---")
for s in sent_log:
    print("  [" + ("OK" if s["ok"] else "FAIL") + "] " + s["name"] + " <" + s["email"] + ">")
