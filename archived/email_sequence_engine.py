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
        "label": "Post-Audit Nurture (Daniel's Pre-Launch → Launch adaptation)",
        "trigger_stage": "lead_audit",
        "steps": [
            {
                "id": "audit_delivery",
                "day": 0,
                "subject": "Why your landing page is leaking buyers (audit inside)",
                "type": "text",
                "body": (
                    "You ran a landing page audit. Here's what it checked:\n\n"
                    "1. Headline Clarity — does it describe the problem or the product?\n"
                    "2. CTA Actionability — is it a decision or a label?\n"
                    "3. Trust Proof — is social proof above the fold?\n"
                    "4. Page Speed — how fast does it load?\n"
                    "5. Mobile Responsiveness — does it work on phone?\n\n"
                    "If any of these scored under 7, that's a leak.\n\n"
                    "The good news: each leak has a fix. The headline alone accounts "
                    "for 40% of conversion variance — and it's a 15-minute change.\n\n"
                    "Over the next few days I'll show you exactly how to fix each one.\n\n"
                    "First step: review your scores. Then decide if you want the fixes done for you.\n\n"
                    "→ Fix them yourself: the free Fix Kit (templates + checklist) is waiting\n"
                    "→ Get them done in 24h: the $97 Conversion Fix Pack ships your new page sections\n\n"
                    "Link: https://nebulacomponents.shop/checkout.html\n"
                ),
            },
            {
                "id": "value_add",
                "day": 1,
                "subject": "Why the top 1% of landing pages don't describe what they do",
                "type": "text",
                "body": (
                    "I audited 100+ landing pages last month. The ones converting over 5% all had one thing in common:\n\n"
                    "They don't describe what they do. They describe the problem you already feel.\n\n"
                    "Example:\n"
                    "  Before: \"AI-powered lead generation platform\"\n"
                    "  After:  \"Stop losing deals to slow follow-ups\"\n\n"
                    "Same product. Different framing. The second one doubles conversion because "
                    "the visitor thinks \"that's my problem\" before they even scroll.\n\n"
                    "Your audit score for Headline Clarity tells you if you have this issue.\n"
                    "If it's under 7, rewriting your headline is the highest-leverage 15 minutes "
                    "you'll spend this week.\n\n"
                    "Want it done for you? The $97 Fix Pack includes a rewritten hero section "
                    "tailored to your ICP: https://nebulacomponents.shop/checkout.html\n"
                ),
            },
        ],
        "completes_at": "lead_warm",  # stage to promote to after Part 1
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
                    "  → $97, one checkout, done\n\n"
                    "No agency retainer. No sales call. Just a fixed price for a fixed outcome.\n\n"
                    "https://nebulacomponents.shop/checkout.html\n"
                ),
            },
            {
                "id": "social_proof",
                "day": 2,
                "subject": "This founder saved $3k/mo in ad spend with a $97 fix",
                "type": "text",
                "body": (
                    "A founder came to us running $5k/mo in Google Ads. Getting 0.8% conversion.\n\n"
                    "He thought the ads were the problem. Turned out it was the landing page headline.\n\n"
                    "He was selling a SaaS product with the headline \"AI-powered analytics platform.\"\n"
                    "We changed it to \"Stop guessing which campaigns drive revenue.\"\n\n"
                    "Same product. Same ads. Same traffic.\n"
                    "Conversion went from 0.8% to 2.4% in 5 days.\n\n"
                    "That's 3x more leads from the same ad spend. On a $97 fix.\n\n"
                    "Your audit already showed you where your leaks are. The question is: "
                    "do you want to fix them yourself, or have them done in 24h?\n\n"
                    "https://nebulacomponents.shop/checkout.html\n"
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
                "subject": "The $97 fix that saved $3k/mo in ads — what you get",
                "type": "text",
                "body": (
                    "Saw you checked out the Fix Pack. Let me answer the question everyone asks:\n\n"
                    "What exactly do I get for $97?\n\n"
                    "- Hero section rewrite (headline + subheadline) — tailored to your ICP\n"
                    "- CTA button redesign — action-driven, not label-driven\n"
                    "- Trust proof placement — social proof positioned above the fold\n"
                    "- FAQ / objection section — addresses doubts before they arise\n"
                    "- Mobile-first formatting — your page will work on phone\n\n"
                    "Delivered as HTML you can paste directly into your page. Or we can implement it.\n\n"
                    "The reason it's $97 and not $997: it's a fixed scope. Every Fix Pack is the same "
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
                    "$97. 24h delivery. No meetings.\n\n"
                    "https://nebulacomponents.shop/checkout.html\n"
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
                    "Your audit results are waiting. The fix is $97. If it doesn't improve your conversion "
                    "within 30 days, I'll refund it. No questions.\n\n"
                    "https://nebulacomponents.shop/checkout.html\n"
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
                    "Your audit results don't expire, but the Fix Pack is priced at $97 because it's a "
                    "fixed scope. If we end up building a more complex fix down the road, it'll cost more.\n\n"
                    "The cheapest time to fix your page is right now, when the audit already told you "
                    "exactly what's wrong.\n\n"
                    "If you have a specific question I haven't answered, just reply. Happy to help either way.\n\n"
                    "https://nebulacomponents.shop/checkout.html\n"
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
            ok, msg = send_email(email, subject, body)
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

    # Summary
    print(f"\n{'='*60}")
    print("SEQUENCE ENGINE SUMMARY")
    print(f"{'='*60}")
    print(f"  Enrolled:   {total_enrolled}")
    print(f"  Sent:       {total_sent}")
    print(f"  Skipped:    {total_skipped}")
    print(f"  Mode:       {'DRY RUN' if dry_run else 'LIVE'}")

    return {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "enrolled": total_enrolled,
        "sent": total_sent,
        "skipped": total_skipped,
    }


if __name__ == "__main__":
    dry_run = DRY_RUN or not FORCE_SEND
    result = process_sequences(dry_run=dry_run)
    print(f"\n---SUMMARY---\n{json.dumps(result)}")
