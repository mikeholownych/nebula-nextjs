#!/usr/bin/env python3
"""
Send cold outreach emails to real audit subjects.
Uses AgentMail via the Nebula agentmail_client.
"""
import sys
sys.path.insert(0, "/home/mike/nebula")
from agentmail_client import AgentMailClient

client = AgentMailClient()

outreach = [
    {
        "to": "hello@beetler.ai",
        "subject": "Audited beetler.ai — found the conversion issue",
        "text": """Ran beetler.ai through our conversion audit.

Two findings worth knowing about:

1. Social proof (3.5/5 impact): No testimonials, reviews, or proof signals found anywhere on the page. Visitors arrive from ads with zero evidence another human has used your product. Conversion data consistently shows 25-40% lift from adding one real customer message near the first CTA.

2. Above fold (4.0/5 impact): Your headline, CTA, and offer aren't visible in the first 3,000 characters of source HTML. This affects how crawlers read your page and may signal misalignment between your ad and what loads first.

The full audit is at: https://nebulacomponents.com/audit

If you want the exact fix brief — one finding, specific implementation steps, verification test, 30-day re-audit — it's $97:
https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h

The social proof fix takes under an hour.

Mike
Nebula Components"""
    },
    {
        "to": "hello@xbeast.io",
        "subject": "Audited xbeast.io — 803KB page weight + SEO gap",
        "text": """Ran xbeast.io through our conversion audit.

Two findings:

1. Page weight: 803KB HTML payload. Industry heuristic is ≤120KB. This is 6.7x over — affects LCP on mobile, which is where most paid ad traffic lands. First meaningful paint is delayed before a visitor even sees your CTA.

2. SEO gap (3.0/5): Your H1 reads "Grow Your 𝕏 Audience On Autopilot Starting This Week" — your title tag reads "XBeast | AI Agent for X - Create & Schedule High-E". No shared keywords between them. Google treats these as two separate signals. Your SERP description is also 185 chars and truncates mid-sentence at character 155.

Full audit: https://nebulacomponents.com/audit

Fix brief (803KB → under 200KB with implementation steps + verification): $97
https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h

Mike
Nebula Components"""
    },
    {
        "to": "hello@smartwatermark.app",
        "subject": "Audited smartwatermark.app — tracking gap",
        "text": """Ran smartwatermark.app through our conversion audit.

Top finding (4.0/5 impact): No recognized ad-tracking artifacts found in source HTML. No Facebook Pixel initializer, no GA4 measurement ID, no explicit conversion call in the static source. If you're running paid traffic, your campaign is optimizing blind — it can't see what a conversion is.

Note: server-side or tag-manager-loaded tracking could explain the absence. But if it's not there, your ad platform is guessing on audience optimization.

Full audit: https://nebulacomponents.com/audit

If you want us to verify live (DevTools network trace) and write the exact implementation brief: $97
https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h

Mike
Nebula Components"""
    },
    {
        "to": "hello@aisyndicate.io",
        "subject": "Audited aisyndicate.io — meta description is truncating your SERP",
        "text": """Ran aisyndicate.io through our conversion audit.

Top finding (2.5/5): Your meta description is 207 characters. SERP shows ~155. Your description truncates at: "Pre-execution enforcement controls for enterprise AI agents: policy evaluation before action, attributable authority, tamper-evident audit trails, and fail…"

The "and fail…" cut-off is the last thing a high-intent searcher reads before deciding to click. That's the decision moment and it ends on an incomplete thought.

Fix: rewrite to 120-155 chars, ending with a complete value statement.

Full audit: https://nebulacomponents.com/audit

Fix brief (exact rewrite + implementation + 30-day re-audit): $97
https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h

Mike
Nebula Components"""
    },
]

print("Sending outreach emails...\n")
for email in outreach:
    try:
        result = client.send(
            to=[email["to"]],
            subject=email["subject"],
            text=email["text"],
            labels=["cold-outreach", "audit-finding"]
        )
        if result.get("ok") or result.get("id"):
            print(f"✅ Sent: {email['to']} — {email['subject'][:50]}")
            print(f"   ID: {result.get('id', 'unknown')}\n")
        else:
            print(f"❌ Failed: {email['to']}")
            print(f"   Response: {result}\n")
    except Exception as e:
        print(f"❌ Error sending to {email['to']}: {e}\n")

print("Done.")
