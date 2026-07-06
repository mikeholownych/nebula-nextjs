"""
Email sequence v2 — FREE AUDIT FIRST funnel
Retrospective finding: charging cold ($7/$97) without trust = 0% conversion
New sequence: Free audit → deliver real value → upsell $97 done-for-you

Template A: For founders actively asking for landing page help (IH/HN posts)
Template B: For founders with live products (cold, no prior contact)
Template C: Follow-up after audit delivered — upsell to $97
"""

SEQUENCE = {
    "cold_v2": {
        "subject": "Your landing page — one thing I'd fix first",
        "body": """Hey {name},

Saw your product {url} and noticed one specific thing that's likely costing you signups.

{specific_observation}

Happy to do a full teardown — no charge. I do these for founders who are actively shipping because the feedback is worth more to me than a fee at this stage.

Run the self-serve audit: https://nebulacomponents.shop/audit.html

— Mike
nebulacomponents.shop
""",
    },

    "warm_followup": {
        "subject": "Re: {original_subject}",
        "body": """Hey {name},

Following up on the audit I sent.

Did the {specific_fix} change make sense? Happy to mock it up if it's easier to see than describe.

Also — if you want me to implement the fixes rather than just explain them, that's something I offer as a $97 done-for-you service. You get:
→ Rewritten hero + CTA section
→ Trust signal placement
→ Mobile check
→ Delivered in 24 hours, revision included

No pressure either way. Just let me know if you want the mockup.

— Mike
""",
    },

    "inbound_reply_audit_interest": {
        "subject": "Re: {original_subject}",
        "body": """Hey {name},

Thanks for replying — send me your URL and I'll get the audit back to you within 24 hours.

While I'm at it: if after seeing the audit you want me to implement the fixes, I offer a $97 done-for-you service (rewritten copy, CTA placement, trust signals, mobile check, 24h turnaround). No obligation — the audit is free regardless.

— Mike
nebulacomponents.shop
""",
    },

    "inbound_reply_yes": {
        "subject": "Re: {original_subject}",
        "body": """Hey {name},

Perfect. Send me:
1. Your landing page URL
2. What your product does in one sentence
3. Who your ideal customer is

I'll have the audit back to you within 24 hours.

— Mike
""",
    },
}
