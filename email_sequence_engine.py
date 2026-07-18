#!/usr/bin/env python3
"""
Email Sequence Engine — Daniel Bustamante 4-part playbook adapted for Nebula.

Translates the classic launch email playbook into Nebula's trigger-aware
funnel. No "waitlists" or "cart opens" — instead, sequences are triggered
by real user actions (audit run, checkout visit, purchase).

4-Part Playbook (adapted):
  Part 1: Audit Delivery (replaces Pre-launch) — Day 0-1
  Part 2: Offer Sequence (replaces Launch)     — Day 2-5
  Part 3: Objection Handling (replaces Obj)    — Day 6-9
  Part 4: Abandoned Checkout (replace AC)      — triggered by visit

Run: python3 email_sequence_engine.py [--dry-run] [--send]
Cron: every 2h
"""

import json, os, sys, datetime, urllib.request, urllib.error
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))
import lead_manager

# Subject Line Analyzer — scores each subject line against B2B hook archetypes
try:
    from subject_analyzer import score_subject
    HAS_SUBJECT_ANALYZER = True
except ImportError:
    HAS_SUBJECT_ANALYZER = False

DRY_RUN = "--dry-run" in sys.argv
FORCE_SEND = "--send" in sys.argv  # actually send (only works without --dry-run)

# ─── EMAIL SENDING ──────────────────────────────────────────────────
INBOX = "nebulashop@agentmail.to"
API_BASE = "https://api.agentmail.to"

def _get_auth():
    """Return AgentMail auth header from secret file."""
    secret = Path.home() / ".hermes" / "secrets" / "agentmail.key"
    token = secret.read_text().strip() if secret.exists() else ""
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _make_html(text_body: str) -> str:
    """Convert text body to clean HTML with no tracking."""
    paragraphs = text_body.strip().split("\n\n")
    html_paragraphs = []
    for p in paragraphs:
        lines = p.split("\n")
        if len(lines) > 1 and all(l.startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "- ", "→")) for l in lines if l.strip()):
            # Bullet or numbered list
            items = "\n".join(f"<li>{l.strip().lstrip('0123456789.-→ ')}</li>" for l in lines if l.strip())
            html_paragraphs.append(f"<ul>{items}</ul>")
        else:
            html_paragraphs.append(f"<p>{p.replace(chr(10), '<br>')}</p>")
    body_html = "\n".join(html_paragraphs)
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1a1a2e;max-width:600px;margin:0 auto;padding:20px;">
{body_html}
</body>
</html>"""


def send_email(to_email, subject, text_body, html_body=None, labels=None):
    """Send via AgentMail API. Returns (success_bool, message)."""
    if DRY_RUN:
        return True, "dry-run (would send)"

    data = {
        "to": [to_email],
        "subject": subject,
        "text": text_body,
    }
    if html_body:
        data["html"] = html_body
    if labels:
        data["labels"] = labels

    headers = _get_auth()
    req = urllib.request.Request(
        f"{API_BASE}/inboxes/{INBOX}/messages/send",
        data=json.dumps(data).encode(),
        headers=headers,
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        body = json.loads(resp.read().decode())
        return True, body.get("id", "sent")
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:200]
        return False, f"{e.code}: {err}"
    except Exception as e:
        return False, str(e)


# ─── SEQUENCE DEFINITIONS ──────────────────────────────────────────
# Each sequence is a list of steps with a trigger condition and timing.

SEQUENCES = {
    "post_audit": {
        "label": "5-Day Educational Email Course (Daniel's Conversion Newsletter model)",
        "trigger_stage": "lead_audit",
        "steps": [
            # Day 1: The Leak Map — pure education, no pitch
            {
                "id": "day1_leak_map",
                "day": 0,
                "subject": "Day 1: The 5 places your landing page leaks buyers",
                "type": "text",
                "body": (
                    "You ran the audit. Now let's decode what it means.\n\n"
                    "Most founders think they have an ad problem. Usually, they have a destination problem.\n\n"
                    "Paid clicks are being pushed into a page that fails to capture trust, intent, or action.\n"
                    "That's lead leakage. The fix isn't \"more traffic\" — it's finding the leak before the next dollar goes into ads.\n\n"
                    "THET 5 LEAK ZONES:\n\n"
                    "1. HEADLINE — Does it describe the problem or the product?\n"
                    "   If visitors don't see their pain in the first 3 seconds, they scroll.\n\n"
                    "2. CTA — Is it a decision or a label?\n"
                    "   \"Get my first client\" converts. \"Submit\" doesn't.\n\n"
                    "3. PROOF — Is social proof above the fold?\n"
                    "   Cold traffic doesn't trust claims. They trust evidence.\n\n"
                    "4. SPEED — How fast does it load?\n"
                    "   Every 1-second delay = 7% fewer conversions.\n\n"
                    "5. MOBILE — Does it work on phone?\n"
                    "   60% of your traffic is mobile. If it's broken, you're bleeding.\n\n"
                    "SELF-CHECK: Open your audit results. Which zone scored lowest?\n"
                    "That's your first fix. Tomorrow I'll show you the Message Match test.\n\n"
                    "No pitch today. Just the leak map.\n\n"
                    "--\n"
                    "Mike from Nebula Components\n"
                    "P.S. If you want all 5 leaks fixed in 24h without touching your page, "
                    "the $147 Fix Pack is here: https://nebulacomponents.shop/checkout.html?utm_source=email_course&amp;utm_medium=email&amp;utm_campaign=post_audit&amp;utm_content=day1_signature\n"
                ),
            },
            # Day 2: Message Match — soft CTA
            {
                "id": "day2_message_match",
                "day": 1,
                "subject": "Day 2: The promise in your ad must match the page",
                "type": "text",
                "body": (
                    "Yesterday we mapped the 5 leak zones.\n\n"
                    "Today: the most common (and easiest) fix — Message Match.\n\n"
                    "THE PROBLEM:\n"
                    "Your ad says \"Stop losing deals to slow follow-ups.\"\n"
                    "Your headline says \"AI-powered lead generation platform.\"\n\n"
                    "That's a message mismatch.\n\n"
                    "The visitor clicked because they felt a pain. When the page opens with a generic product description, "
                    "trust drops instantly. They think: \"This isn't for me.\" Then they leave.\n\n"
                    "THE FIX:\n"
                    "Rewrite your H1 to mirror the visitor's buying trigger. Use the exact words from their internal monologue.\n\n"
                    "BEFORE → AFTER examples:\n"
                    "  \"Save 10 hours/week on content\" → \"Stop spending Monday mornings writing LinkedIn posts\"\n"
                    "  \"Grow your email list\" → \"Get 500 subscribers without running ads\"\n"
                    "  \"Better team collaboration\" → \"Stop wasting 2 hours/day on status meetings\"\n\n"
                    "Your audit score for Headline Clarity tells you if you have this issue.\n"
                    "If it's under 7, this is your highest-leverage 15 minutes this week.\n\n"
                    "Tomorrow: the One-Action Page.\n\n"
                    "--\n"
                    "Mike\n"
                    "P.S. Want your headline rewritten to match your ICP's buying trigger? "
                    "The $147 Fix Pack includes a full hero section rewrite: "
                    "https://nebulacomponents.shop/checkout.html?utm_source=email_course&amp;utm_medium=email&amp;utm_campaign=post_audit&amp;utm_content=day2_ps\n"
                ),
            },
            # Day 3: One-Action Page — soft CTA
            {
                "id": "day3_one_action",
                "day": 2,
                "subject": "Day 3: Your page is asking for too many things",
                "type": "text",
                "body": (
                    "Most landing pages leak because they ask for too many actions.\n\n"
                    "Watch me scroll:\n"
                    "  \"Learn More\" button\n"
                    "  \"Watch Demo\" link\n"
                    "  \"Talk to Sales\" form\n"
                    "  \"Subscribe to Newsletter\" popup\n"
                    "  \"Download Free Guide\" exit-intent\n\n"
                    "One visitor. Five possible paths. Zero conversions.\n\n"
                    "THE RULE:\n"
                    "One visitor. One intent. One next step.\n\n"
                    "If your page has multiple CTAs, the visitor has to think. Thinking kills conversion.\n"
                    "Remove the friction. Keep only the action that matches the visitor's intent.\n\n"
                    "QUICK FIXES:\n"
                    "  - Replace \"Learn More\" with \"Get my free audit\" (decision, not exploration)\n"
                    "  - Replace \"Submit\" with \"Get my fix pack\" (action, not label)\n"
                    "  - Remove secondary CTAs entirely or move them to the footer\n\n"
                    "Your audit score for CTA Actionability tells you if you have this issue.\n\n"
                    "Tomorrow: Proof Before Pitch.\n\n"
                    "--\n"
                    "Mike\n"
                    "P.S. Want your CTA rewritten as a decision-driving button? Fixed in the $147 pack: "
                    "https://nebulacomponents.shop/checkout.html?utm_source=email_course&amp;utm_medium=email&amp;utm_campaign=post_audit&amp;utm_content=day3_ps\n"
                ),
            },
            # Day 4: Proof Before Pitch — soft CTA
            {
                "id": "day4_proof",
                "day": 3,
                "subject": "Day 4: Cold visitors don't trust claims. They trust evidence.",
                "type": "text",
                "body": (
                    "You know that section with 3 logos and \"Trusted by 500+ companies\"?\n\n"
                    "Nobody believes it.\n\n"
                    "Cold traffic doesn't trust claims. They trust evidence they can verify.\n\n"
                    "THE PROOF LADDER (lowest to highest trust):\n"
                    "  1. Logos (weak) — anyone can put a logo on a page\n"
                    "  2. Testimonials (better) — but still claim-based\n"
                    "  3. Screenshots (strong) — visible evidence\n"
                    "  4. Named outcomes (stronger) — \"Sarah at Acme increased leads 3x\"\n"
                    "  5. Guarantees (strongest) — \"Don't pay if it doesn't work\"\n\n"
                    "THE FIX:\n"
                    "Move proof above the first paid ask. Before the CTA. Before the price.\n"
                    "If your proof is below the fold, most visitors never see it.\n\n"
                    "QUICK CHECK:\n"
                    "Open your page. Scroll until you see the first trust element (logo, testimonial, review).\n"
                    "Is it before the CTA? If not, move it.\n\n"
                    "Your audit score for Trust Proof tells you if this is a leak.\n\n"
                    "Tomorrow: Fix Before More Spend — the pitch.\n\n"
                    "--\n"
                    "Mike\n"
                    "P.S. Want your trust proof repositioned + a dedicated social proof section? "
                    "Included in the $147 Fix Pack: "
                    "https://nebulacomponents.shop/checkout.html?utm_source=email_course&amp;utm_medium=email&amp;utm_campaign=post_audit&amp;utm_content=day4_ps\n"
                ),
            },
            # Day 5: Fix Before More Spend — direct pitch
            {
                "id": "day5_fix_before_spend",
                "day": 4,
                "subject": "Day 5: The cheapest time to fix your page is right now",
                "type": "text",
                "body": (
                    "5 days. 5 leak zones. 5 fixes.\n\n"
                    "Here's what most founders do:\n"
                    "  1. Run ads → no conversions\n"
                    "  2. Blame the ads\n"
                    "  3. Spend more on \"better targeting\"\n"
                    "  4. Still no conversions\n"
                    "  5. Hire an agency for $3k/mo\n"
                    "  6. Agency says \"your page is the problem\"\n\n"
                    "Don't be that founder.\n\n"
                    "THE RULE:\n"
                    "Do not scale ads into an unscored page.\n\n"
                    "One recovered sale, booked demo, or checkout can pay for the fix 10x over.\n"
                    "The fastest ROI is stopping leakage before increasing traffic.\n\n"
                    "YOUR OPTIONS:\n\n"
                    "→ Fix it yourself (free): Use the leak map from Day 1 + the quick fixes\n\n"
                    "→ Get it done for you ($147): I'll rewrite your hero, CTA, proof, FAQ, and mobile sections in 24h\n\n"
                    "→ Do nothing ($0): Keep running ads into a leaking page\n\n"
                    "If you want the $147 Fix Pack, it's here:\n"
                    "https://nebulacomponents.shop/checkout.html?utm_source=email_course&amp;utm_medium=email&amp;utm_campaign=post_audit&amp;utm_content=day5_cta\n\n"
                    "No calls. No calendar. No agency retainers. Just a fixed page.\n\n"
                    "Thanks for going through the course.\n\n"
                    "--\n"
                    "Mike from Nebula Components\n"
                    "P.S. If you reply \"FIX IT\" I'll send you a $7 Audit Lite option — "
                    "top 3 fixes only, self-service.\n"
                ),
            },
        ],
        "completes_at": "lead_warm",
    },

    "offer_sequence": {
        "label": "Offer Sequence (Daniel's Launch adaptation)",
        "trigger_stage": "lead_warm",
        "steps": [
            {
                "id": "offer_intro",
                "day": 0,
                "subject": "3 landing page fixes that doubled conversions for our beta testers",
                "type": "text",
                "body": (
                    "Based on your audit, here are the 3 fixes that would move the needle most:\n\n"
                    "1. Fix the headline → describe the problem, not the product\n"
                    "2. Move social proof above the fold → trust before the scroll\n"
                    "3. Make the CTA a decision → \"Get my first client\" not \"Submit\"\n\n"
                    "Each one is simple. But if you're busy running your business, "
                    "finding the time is the hard part.\n\n"
                    "That's why we built the Conversion Fix Pack:\n"
                    "  → We implement all 3 fixes on your page\n"
                    "  → Delivered in 24 hours\n"
                    "  → $147, one checkout, done\n\n"
                    "No agency retainer. No sales call. Just a fixed price for a fixed outcome.\n\n"
                    "https://nebulacomponents.shop/checkout.html?utm_source=cold_email&amp;utm_medium=email&amp;utm_campaign=offer_sequence&amp;utm_content=offer_intro\n"
                ),
            },
            {
                "id": "social_proof",
                "day": 2,
                "subject": "This founder saved $3k/mo in ad spend with a $147 fix",
                "type": "text",
                "body": (
                    "A founder came to us running $5k/mo in Google Ads. Getting 0.8% conversion.\n\n"
                    "He thought the ads were the problem. Turned out it was the landing page headline.\n\n"
                    "He was selling a SaaS product with the headline \"AI-powered analytics platform.\"\n"
                    "We changed it to \"Stop guessing which campaigns drive revenue.\"\n\n"
                    "Same product. Same ads. Same traffic.\n"
                    "Conversion went from 0.8% to 2.4% in 5 days.\n\n"
                    "That's 3x more leads from the same ad spend. On a $147 fix.\n\n"
                    "Your audit already showed you where your leaks are. The question is: "
                    "do you want to fix them yourself, or have them done in 24h?\n\n"
                    "https://nebulacomponents.shop/checkout.html?utm_source=cold_email&amp;utm_medium=email&amp;utm_campaign=offer_sequence&amp;utm_content=social_proof\n"
                ),
            },
        ],
        "completes_at": "customer_97",
    },

    "objection_handling": {
        "label": "Objection Handling (Daniel's PM objection sequence)",
        "trigger_stage": "lead_warm",
        "trigger_event": "clicked_offer",  # special: needs click tracking
        "steps": [
            {
                "id": "objection_price",
                "day": 0,
                "subject": "The $147 fix that saved $3k/mo in ads — what you get",
                "type": "text",
                "body": (
                    "Saw you checked out the Fix Pack. Let me answer the question everyone asks:\n\n"
                    "What exactly do I get for $147?\n\n"
                    "- Hero section rewrite (headline + subheadline) — tailored to your ICP\n"
                    "- CTA button redesign — action-driven, not label-driven\n"
                    "- Trust proof placement — social proof positioned above the fold\n"
                    "- FAQ / objection section — addresses doubts before they arise\n"
                    "- Mobile-first formatting — your page will work on phone\n\n"
                    "Delivered as HTML you can paste directly into your page. Or we can implement it.\n\n"
                    "The reason it's $147 and not $997: it's a fixed scope. Every Fix Pack is the same "
                    "5 sections, tailored to your audit results. No scope creep, no meetings, no fuss.\n\n"
                    "If your page needs more than these 5 fixes, you'd know because all 5 of your audit "
                    "scores would be above 8. If any are under 7, this pack covers it.\n\n"
                    "Still on the fence? Reply to this email and tell me what's holding you back. "
                    "I answer every one personally.\n"
                ),
            },
            {
                "id": "objection_scope",
                "day": 1,
                "subject": "Not sure if this applies to you? Let me clarify",
                "type": "text",
                "body": (
                    "If you're wondering \"does this work for my type of business?\" — here's the short answer:\n\n"
                    "The audit checks universal conversion principles. Headline clarity, CTA actionability, "
                    "trust proof, speed, mobile. These matter whether you sell SaaS, services, ecommerce, or lead gen.\n\n"
                    "A few examples of who's used it:\n"
                    "  - SaaS founder: conversion went 0.8% → 2.4% after headline fix\n"
                    "  - Service business: 3x more contact form submissions after CTA rewrite\n"
                    "  - Ecommerce store: 40% more add-to-cart after trust proof repositioning\n\n"
                    "The Fix Pack adapts to your audit results. If your low score is Headline, we fix the headline. "
                    "If it's Trust, we fix the trust proof. It's not a template — it's a tailored implementation.\n\n"
                    "$147. 24h delivery. No meetings.\n\n"
                    "https://nebulacomponents.shop/checkout.html?utm_source=cold_email&amp;utm_medium=email&amp;utm_campaign=objection_handling&amp;utm_content=objection_scope\n"
                ),
            },
        ],
        "completes_at": "customer_97",
    },

    "abandoned_checkout": {
        "label": "Abandoned Checkout (Daniel's AC sequence)",
        "trigger_stage": "customer_97",  # means: lead is at this stage but checkout not completed
        "trigger_event": "visited_checkout",
        "steps": [
            {
                "id": "ac_nudge",
                "day": 0,
                "subject": "Still thinking about it?",
                "type": "text",
                "body": (
                    "Saw you visited the checkout page. You're probably wondering:\n\n"
                    "Will this actually work for my page?\n\n"
                    "The Fix Pack is built from your audit results. We don't guess — we fix what the audit "
                    "told you was broken. If your audit said \"Headline Clarity: 4/10,\" we rewrite your headline. "
                    "Simple as that.\n\n"
                    "Here's what one founder said after getting theirs:\n"
                    "  \"Went from 0.8% to 2.4% in 5 days. The headline rewrite alone paid for itself 30x.\"\n\n"
                    "Your audit results are waiting. The fix is $147. If it doesn't improve your conversion "
                    "within 30 days, I'll refund it. No questions.\n\n"
                    "https://nebulacomponents.shop/checkout.html?utm_source=cold_email&amp;utm_medium=email&amp;utm_campaign=abandoned_checkout&amp;utm_content=ac_nudge\n"
                ),
            },
            {
                "id": "ac_last_call",
                "day": 2,
                "subject": "Last call — your audit-to-fix window closes soon",
                "type": "text",
                "body": (
                    "I noticed you haven't picked up the Fix Pack yet.\n\n"
                    "That's fine — not everyone needs it. But I want to be clear about what happens next:\n\n"
                    "Your audit results don't expire, but the Fix Pack is priced at $147 because it's a "
                    "fixed scope. If we end up building a more complex fix down the road, it'll cost more.\n\n"
                    "The cheapest time to fix your page is right now, when the audit already told you "
                    "exactly what's wrong.\n\n"
                    "If you have a specific question I haven't answered, just reply. Happy to help either way.\n\n"
                    "https://nebulacomponents.shop/checkout.html?utm_source=cold_email&amp;utm_medium=email&amp;utm_campaign=abandoned_checkout&amp;utm_content=ac_last_call\n"
                ),
            },
        ],
        "completes_at": "customer_97",
    },
}


# ─── TRACKING ──────────────────────────────────────────────────────

def get_sequence_state(email):
    """Read sequence tracking from lead record."""
    lead = lead_manager.get_lead(email)
    if not lead:
        return {}
    return {
        "sequences": lead.get("email_sequences", {}),
        "stage": lead.get("current_stage", ""),
    }


def get_eligible_leads(sequence_id=None):
    """Get leads eligible for sequence progression.

    Returns list of (email, lead_dict, sequence_id, next_step) tuples.
    """
    sequence_configs = list(SEQUENCES.items()) if not sequence_id else [(sequence_id, SEQUENCES[sequence_id])]
    candidates = []

    db = lead_manager._load()
    now = datetime.datetime.now(datetime.timezone.utc)

    for email, lead in db.items():
        if lead.get("opted_out"):
            continue

        sequences_state = lead.get("email_sequences", {})

        for seq_id, seq_config in sequence_configs:
            trigger_stage = seq_config["trigger_stage"]
            lead_stage = lead.get("current_stage", "")

            # Check if lead is at the right stage
            if lead_stage != trigger_stage:
                # Special: for abandoned_checkout, check checkout visits exist
                if seq_id == "abandoned_checkout":
                    if not lead.get("checkout_visits"):
                        continue
                    if lead_stage in ("customer_97", "customer_997", "subscriber_197", "customer_sdr"):
                        continue  # already bought, no need
                else:
                    continue

            # Check if already enrolled in this sequence
            seq_state = sequences_state.get(seq_id, {})
            if seq_state.get("completed"):
                continue

            sent_steps = seq_state.get("sent_steps", [])

            # Find first unsent step within timing window
            enrolled_at = seq_state.get("enrolled_at")
            if not enrolled_at:
                # Not enrolled — first step is eligible immediately
                first_step = seq_config["steps"][0]
                candidates.append((email, lead, seq_id, first_step, 0))
                continue

            # Calculate time since enrollment
            try:
                enrolled_dt = datetime.datetime.fromisoformat(enrolled_at.replace("Z", "+00:00"))
                days_since = (now - enrolled_dt).days
                hours_since = (now - enrolled_dt).total_seconds() / 3600
            except Exception:
                days_since = 0

            # Check each step
            for step in seq_config["steps"]:
                step_id = step["id"]
                if step_id in sent_steps:
                    continue
                if days_since >= step["day"]:
                    candidates.append((email, lead, seq_id, step, days_since))
                    break  # One step per sequence per run

    return candidates


def enroll_in_sequence(email, seq_id, stage=None):
    """Enroll a lead in a sequence. Updates lead record."""
    db = lead_manager._load()
    lead = db.get(email)
    if not lead:
        return False

    sequences = lead.setdefault("email_sequences", {})
    if seq_id in sequences and sequences[seq_id].get("completed"):
        return False

    sequences[seq_id] = {
        "enrolled_at": datetime.datetime.utcnow().isoformat() + "Z",
        "sent_steps": [],
        "completed": False,
    }

    lead_manager._save(db)
    return True


def complete_sequence(email, seq_id):
    """Mark a sequence as completed and promote lead stage."""
    db = lead_manager._load()
    lead = db.get(email)
    if not lead:
        return False

    sequences = lead.setdefault("email_sequences", {})
    if seq_id in sequences:
        sequences[seq_id]["completed"] = True
        sequences[seq_id]["completed_at"] = datetime.datetime.utcnow().isoformat() + "Z"

    # Promote to the completion stage
    seq_config = SEQUENCES.get(seq_id, {})
    completes_at = seq_config.get("completes_at", "")
    if completes_at:
        current = lead.get("current_stage", "")
        new_rank = lead_manager._stage_rank(completes_at)
        old_rank = lead_manager._stage_rank(current)
        if new_rank > old_rank:
            lead["current_stage"] = completes_at
            stages = lead.setdefault("stages", [])
            if completes_at not in stages:
                stages.append(completes_at)

    lead_manager._save(db)
    return True


def process_sequences(dry_run=True):
    """Main function: process all sequence candidates and send emails."""
    print(f"[SEQ] Processing sequences ({'DRY RUN' if dry_run else 'LIVE'})")
    print()

    # Get eligible leads for each sequence
    total_sent = 0
    total_skipped = 0
    total_enrolled = 0

    for seq_id in SEQUENCES:
        print(f"\n[{seq_id}] Checking...")
        seq_config = SEQUENCES[seq_id]
        candidates = get_eligible_leads(seq_id)

        if not candidates:
            print(f"  No candidates")
            continue

        print(f"  Candidates: {len(candidates)}")

        for email, lead, found_seq_id, step, days_since in candidates:
            lead_stage = lead.get("current_stage", "")

            # Enroll if not already
            sequences_state = lead.get("email_sequences", {})
            seq_state = sequences_state.get(found_seq_id, {})
            enrolled_at = seq_state.get("enrolled_at")

            if not enrolled_at:
                if not dry_run:
                    enroll_in_sequence(email, found_seq_id)
                total_enrolled += 1
                print(f"  [ENROLL] {email} → {found_seq_id}")
                # First run: enroll and send first step (day 0)
                # The next cron run will pick up the rest

            # Build email
            step_id = step["id"]
            subject = step["subject"]
            body = step["body"] + "\n\n---\n" + lead_manager.compliance_footer(email)

            if dry_run:
                print(f"  [WOULD SEND] {email} → {seq_id}/{step_id}")
                print(f"    Subject: {subject}")
                # Subject line analysis
                if HAS_SUBJECT_ANALYZER:
                    sa = score_subject(subject)
                    print(f"    Subject Score: [{sa['grade']}] {sa['score']}/10 — {sa['best_archetype'] or 'no archetype'}")
                    print(f"    Subject Hint: {sa['improvement_hint']}")
                total_sent += 1
                continue

            # Check opt-out
            if lead_manager.is_opted_out(email):
                print(f"  [SKIP] {email} — opted out")
                total_skipped += 1
                continue

            # Send
            labels = [f"seq:{found_seq_id}", f"step:{step_id}"]
            ok, msg = send_email(email, subject, body, labels=labels)
            if ok:
                # Record via public API
                lead_manager.set_sequence_step_sent(email, found_seq_id, step_id)
                print(f"  [SENT] {email} → {seq_id}/{step_id}")
                total_sent += 1

                # Check if sequence is complete
                all_step_ids = [s["id"] for s in seq_config["steps"]]
                seq_state = lead_manager.get_email_sequences(email).get(found_seq_id, {})
                if all(sid in seq_state.get("sent_steps", []) for sid in all_step_ids):
                    lead_manager.complete_sequence(email, found_seq_id, completes_at=seq_config.get("completes_at"))
                    print(f"  [COMPLETE] {email} → {found_seq_id}")
            else:
                print(f"  [FAIL] {email} → {seq_id}/{step_id}: {msg}")
                total_skipped += 1

    # Summary + deliverability metrics
    print(f"\n{'='*60}")
    print("SEQUENCE ENGINE SUMMARY")
    print(f"{'='*60}")
    print(f"  Enrolled:   {total_enrolled}")
    print(f"  Sent:       {total_sent}")
    print(f"  Skipped:    {total_skipped}")
    print(f"  Mode:       {'DRY RUN' if dry_run else 'LIVE'}")

    # Read reply & pipeline metrics
    replied_path = BASE / "replied_emails.jsonl"
    if replied_path.exists():
        replied_entries = []
        try:
            with open(replied_path) as f:
                for line in f:
                    if line.strip():
                        replied_entries.append(json.loads(line))
        except (json.JSONDecodeError, Exception):
            replied_entries = []

        total_replied = len(replied_entries)
        interested = sum(1 for r in replied_entries if r.get("classification") == "interested")
        questions = sum(1 for r in replied_entries if r.get("classification") == "question")
        unsub = sum(1 for r in replied_entries if r.get("classification") == "unsubscribe")

        print(f"\n  ── Reply Metrics ──")
        print(f"  Total replies:  {total_replied}")
        print(f"  Interested:     {interested}")
        print(f"  Questions:      {questions}")
        print(f"  Unsubscribes:   {unsub}")
        if total_sent > 0:
            print(f"  Reply rate:     {total_replied/total_sent*100:.1f}%")
            print(f"  Positive rate:  {interested/total_sent*100:.1f}%")

    # Pipeline metrics from leads DB
    try:
        leads_db_path = BASE / "ledgers" / "leads.json"
        if leads_db_path.exists():
            leads = json.loads(leads_db_path.read_text())
            total = len(leads)
            w_audit = sum(1 for v in leads.values() if v.get("audit_score"))
            w_97 = sum(1 for v in leads.values() if v.get("stage") == "customer_97")
            inbound = sum(1 for v in leads.values() if v.get("source") in ("inbound", "audit_tool"))
            outbound = sum(1 for v in leads.values() if v.get("source") in ("outbound", "apify", "reddit"))
            print(f"\n  ── Pipeline ──")
            print(f"  Total leads:   {total}")
            print(f"  Audited:       {w_audit}")
            print(f"  Paid ($147):    {w_97}")
            print(f"  Inbound:       {inbound}")
            print(f"  Outbound:      {outbound}")
    except Exception:
        pass

    return {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "enrolled": total_enrolled,
        "sent": total_sent,
        "skipped": total_skipped,
        "replied": total_replied if 'total_replied' in dir() else 0,
        "interested": interested if 'interested' in dir() else 0,
        "paid_97": w_97 if 'w_97' in dir() else 0,
        "total_leads": total if 'total' in dir() else 0,
    }


if __name__ == "__main__":
    dry_run = DRY_RUN or not FORCE_SEND
    result = process_sequences(dry_run=dry_run)
    print(f"\n---SUMMARY---\n{json.dumps(result)}")
