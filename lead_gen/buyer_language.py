# Nebula Outreach — Buyer Language Map
# Generated: Aug 9, 2026
# Method: Aryan Mahajan's buyer research approach applied to Nebula's ICP
#
# USE THIS: The outreach agent must use these exact phrases and frames in D1 emails.
# DO NOT USE: Generic CRO language, "conversion rate optimization", "A/B testing", technical audit terms.

BUYER_LANGUAGE_MAP = {

    # How they describe the problem (their words, not ours)
    "pain_phrases": [
        "I'm just burning money",
        "trusting the process but now I need help",
        "my ads are working but I'm not converting",
        "clicks but no sales",
        "clicks but no enquiries",
        "$X in ads, no conversions",
        "getting traffic but nothing is happening",
        "the page looks fine but it's not working",
        "something is wrong but I can't figure out what",
        "I've tried everything",
        "the ads are getting clicks, it must be the page",
        "not even a paying customer, just one form fill",
        "spent $X and I have one conversion to show for it",
        # Neil Gambit ICP framework additions (Aug 11, 2026)
        "nobody will tell me which specific thing is broken",
        "everyone says optimize your funnel but nobody shows me what to change",
        "I keep changing the ads but I haven't touched the page",
        "generic advice — no one tells me what's wrong with MY page",
        "I want to know the exact thing to fix before I spend another dollar",
    ],

    # What they blame (useful for identifying their current theory vs. reality)
    "what_they_blame": [
        "the ads aren't targeting right",
        "my headline isn't good enough",
        "maybe I need a better offer",
        "the landing page design is off",
        "my price is too high",
        "people aren't ready to buy",
        "I need more trust signals",
    ],

    # What actually drives their urgency (use this to anchor timing)
    "urgency_triggers": [
        "monthly ad spend cycling out",
        "deadline to prove the product works",
        "watching competitors get customers",
        "investors or cofounders asking why there's no traction",
        "feel like the window is closing",
        "every day that passes is money out the door",
    ],

    # What success looks like to them (use in the offer frame)
    "success_language": [
        "even one paying customer would prove the model",
        "just need to prove it works before scaling",
        "if the page converted at 2% instead of 0.5% the math works",
        "want to know if it's the page or the offer before changing the offer",
        "one fix that changes everything",
    ],

    # Outreach posture guidance (Aryan's frame)
    "posture_rules": [
        "Position as equal, not supplicant — you have findings, they have a problem you can solve",
        "Frame audit as already done — 'I ran your page through an audit' not 'I'd love to audit your page'",
        "Frame the finding as something they're already experiencing, not as a diagnosis",
        "Never ask for a demo slot — offer findings, let them come to you",
        "The asset (audit) is valuable — you're offering access, not asking for time",
    ],

    # D1 email template (correct posture)
    "d1_template": """Hey {first_name or ''},

Ran {domain} through an audit — you're spending on ads but {specific_finding} is likely pulling your conversion rate under what it should be.

Here's what I found: {one_sentence_finding}

If that matches what you're seeing, the full audit is at nebulacomponents.com/audit — free, no email needed.

The fix pack ($97) implements the specific changes if you want them done.

— Sedrick, Nebula Components""",

    # Hook variants by ICP segment (rotate A/B/C for testing)
    "hook_variants": {
        "A": "Specific finding first — name the exact issue, then the signal",
        "B": "Signal first — reference their IH/X post, then what we found",
        "C": "Outcome frame — 'one thing between you and 2x conversions'",
    }
}

# Domain-specific vocabulary per niche
NICHE_VOCABULARY = {
    "SaaS founders": {
        "use": ["activation rate", "trial-to-paid", "onboarding friction", "feature discovery"],
        "avoid": ["conversion rate optimization", "CRO", "A/B split"],
    },
    "Indie hackers / solo founders": {
        "use": ["getting traction", "proving the model", "making the math work", "first paying customer"],
        "avoid": ["funnel optimization", "demand generation", "lead nurturing"],
    },
    "Agencies running ads for clients": {
        "use": ["client results", "proving ROI", "keeping the account", "ROAS floor"],
        "avoid": ["audit", "assessment", "evaluation"],
    },
    "E-commerce founders": {
        "use": ["bleed rate", "money out the door", "checkout abandonment", "ROAS"],
        "avoid": ["conversion rate", "user experience", "UX"],
    },
}

if __name__ == "__main__":
    print("Buyer Language Map loaded.")
    print(f"Pain phrases: {len(BUYER_LANGUAGE_MAP['pain_phrases'])}")
    print(f"Posture rules: {len(BUYER_LANGUAGE_MAP['posture_rules'])}")
    print(f"Niches covered: {len(NICHE_VOCABULARY)}")
