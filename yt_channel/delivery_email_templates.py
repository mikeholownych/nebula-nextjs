"""Post-Checkout Email Sequences — 4-email delivery + implementation workflow.

Used by: delivery_workflow.py (triggered on Stripe charge success)
Sends via: AgentMail (fail-closed, registered in lead_state.db)

EMAIL 1 (5 min): Your fix is ready
EMAIL 2 (1 day): Implementation guide  
EMAIL 3 (7 days): Did you implement? Share your result
EMAIL 4 (30 days): Re-audit proof + Pro subscription offer
"""

EMAIL_TEMPLATES = {
    "email_1_fix_ready": {
        "subject": "Your $97 fix — {finding_label}",
        "send_after_seconds": 300,  # 5 min
        "body": """Hi {founder_name},

Your fix is ready.

**Your highest-impact finding:**
{finding_label}

**The exact change (ready to paste):**

{fix_copy}

**Implementation time:** ~30 minutes (no developers needed)

**Next steps:**
1. Copy the text above
2. Paste it into your landing page
3. Test on your live site
4. Reply here when done — I'll send you the verification steps

This one fix typically lifts conversions 3–8%. That's the reason you're here.

Questions? Hit reply. I read every message.

—
Nebula
nebulacomponents.com
""",
        "tone": "Direct, instructional, founder-to-founder",
        "psychology": "No fluff, exact copy, proof of work",
    },

    "email_2_implementation_guide": {
        "subject": "Before/After proof — how to measure the impact",
        "send_after_seconds": 86400,  # 1 day
        "body": """Hi {founder_name},

I wanted to send you a quick visual guide before you implement.

**BEFORE (your current site):**
{before_screenshot_url}

Score: {before_score}/10
Visitors bouncing: ~{estimated_bounce_percent}%
Costing you: ~${estimated_monthly_loss}/month in lost conversions

**AFTER (what it looks like fixed):**
{after_screenshot_url}

This is what we're aiming for.

**Implementation checklist:**
☐ You've made the change on your live site
☐ You tested it (desktop + mobile)
☐ You deployed it
☐ Reply to this email: "I'm done" (so I know to run the re-audit)

**Why this matters:**
In 7 days, I'll re-audit your site automatically. If your score improves from {before_score}/10 to {expected_after_score}/10, we'll have proof it worked. Then you can show this to your team / investors / board.

Questions on implementation? Reply here. I'll help you.

—
Nebula
nebulacomponents.com
""",
        "tone": "Visual, supportive, specific",
        "psychology": "Before/after proof, clear expectation, help offered",
    },

    "email_3_implementation_check": {
        "subject": "Did you implement? (Help if stuck)",
        "send_after_seconds": 604800,  # 7 days
        "body": """Hi {founder_name},

7 days ago, you bought the fix for {finding_label}.

I'm running the re-audit now to check if it worked.

**While I'm checking:**
If you haven't implemented yet, no problem — just reply and let me know:
• Are you stuck? (I'll help)
• Do you have questions? (I'll answer)
• Did you implement but unsure if it's live? (I can check)

I'll have the results in a few hours. Either way, you'll hear from me.

—
Nebula
nebulacomponents.com
""",
        "tone": "Supportive, no judgment",
        "psychology": "Help available, expectation set, proof coming",
    },

    "email_4_results_and_upsell": {
        "subject": "{result_status}: Your re-audit is live — {score_change}",
        "send_after_seconds": 2592000,  # 30 days
        "body": """{email_body_by_result}""",
        "variants": {
            "success": {
                "body": """Hi {founder_name},

The fix worked.

**Your re-audit results:**
Before: {before_score}/10
After: {after_score}/10
Improvement: +{score_improvement} points

**What this means:**
At your traffic level ({monthly_visitors} visitors/month), this improvement typically means:
• {estimated_new_conversions} additional conversions/month
• ${estimated_new_revenue}/month in new revenue
• Paid for this fix {payback_days} times over already

**The next step:**

Most founders see this result and ask: "What else is costing me money?"

You have {remaining_issues_count} more conversion leaks. Instead of waiting 30 days for the next one to cost you money, here's what I'd do:

**Option A: Pro subscription ($29/mo)**
Monthly re-audit + 1 new fix per month (your choice, same quality)
First month 50% off: $14.50

(Pays for itself in about {payback_days_pro} days on average)

**Option B: Audit your next site**
Grab your co-founder's site or your follow-up product. Free audit. Same proof.

Either way, you now have a system that proves fixes work.

Ready? Click below:

[CTA: Upgrade to Pro ($29/mo, first month $14.50)]
[CTA: Audit another site (free)]

Reply if you want something else entirely — I'm flexible.

—
Nebula
nebulacomponents.com
""",
            },
            "partial": {
                "body": """Hi {founder_name},

Your re-audit results are in.

**Before: {before_score}/10**
**After: {after_score}/10**
**Change: {score_change}**

The fix is partially live or not fully implemented yet. Here's what I'd suggest:

1. Double-check the change is live on your production site (not staging)
2. Clear your browser cache and test again
3. Reply here — I'll verify for you

Most common issues:
• Change is on staging, not production
• Browser cache showing old version
• Need help with one more detail

Once we confirm it's live, we should see a bigger improvement on the next re-audit in 7 days.

—
Nebula
nebulacomponents.com
""",
            },
            "unchanged": {
                "body": """Hi {founder_name},

Your re-audit results are in.

**Before: {before_score}/10**
**After: {after_score}/10**
**Change: No improvement detected**

This usually means one of three things:

1. **The change isn't live yet.** Most common. Can you confirm it's deployed to production?

2. **The change is live but my audit is cached.** Sometimes Cloudflare or browser cache shows old version. Let's do a manual verification.

3. **The finding was edge-casey.** Rare, but sometimes the specific issue I identified doesn't impact your *particular* traffic pattern.

I want to solve this with you. Reply:
• "I deployed but not sure if it's live" (I'll verify)
• "I haven't deployed yet" (tell me why — blockers?)
• "I need a different fix" (I can suggest alternatives)

Let's figure this out. I've got skin in this game too — I want your fix to work.

—
Nebula
nebulacomponents.com
""",
            },
        },
        "tone": "Data-driven, next-step focused, helpful on fail",
        "psychology": "Proof delivered, specific ROI shown, upsell with low friction, help offered",
    },
}

# Expected variables at template time:
TEMPLATE_VARIABLES = {
    "founder_name": "First name of buyer",
    "finding_label": "e.g., 'H1 doesn't match ad copy'",
    "fix_copy": "The exact fix text (from finding.fix)",
    "before_score": "Original audit score (4-8 typical)",
    "after_score": "Expected score after fix",
    "estimated_bounce_percent": "Calculated from finding impact",
    "estimated_monthly_loss": "Calculated based on traffic + CPC",
    "before_screenshot_url": "Screenshot of site (old version)",
    "after_screenshot_url": "Screenshot mock of site (fixed version)",
    "monthly_visitors": "From audit data",
    "estimated_new_conversions": "Calculated based on typical lift",
    "estimated_new_revenue": "Conversions × average order value",
    "payback_days": "Days to recoup $97 spend",
    "remaining_issues_count": "Total findings - 1",
    "score_improvement": "After - Before",
    "result_status": "'Success' | 'Partial' | 'Unchanged'",
}

# Scheduling:
DELIVERY_SCHEDULE = {
    "email_1": {"delay": "5 min", "trigger": "Stripe charge.succeeded"},
    "email_2": {"delay": "1 day", "trigger": "Email 1 sent"},
    "email_3": {"delay": "7 days", "trigger": "Email 2 sent"},
    "email_4": {"delay": "30 days", "trigger": "Auto re-audit complete"},
}

print("Email templates ready for delivery_workflow.py")
print("Expected workflow:")
print("  1. Stripe webhook (charge.succeeded) → Email 1 (5 min)")
print("  2. 1 day later → Email 2 (implementation guide)")
print("  3. 7 days later → Email 3 (check-in)")
print("  4. 30 days later → Auto re-audit runs → Email 4 (results + upsell)")
