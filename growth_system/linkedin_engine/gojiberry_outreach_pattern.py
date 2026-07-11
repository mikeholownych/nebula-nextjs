#!/usr/bin/env python3
"""
Gojiberry-inspired LinkedIn Outreach Pattern Generator.

Key steal: Question-first DM (zero offer in message 1).
Sequence: ask → relate → book (vs Nebula's current: offer → follow-up → book)

Gojiberry's 3-message micro-sequence:
  1. "Quick question - what's your biggest challenge with [topic] right now?"
  2. "Interesting - we just solved that exact problem for [similar company]. Mind if I send you a 3-minute video showing how?"
  Backup: "Hey [Name], did you get a chance to check my message? Noticed you're [observation] - we should chat."

Nebula's current pattern: first DM includes the audit offer.
This pattern: first DM is pure question. No link. No offer. Just conversation.
"""

import json
import os
import sys
from datetime import datetime, timezone

# === CONFIGURATION ===
OUTREACH_FILE = os.path.join(os.path.dirname(__file__), "outreach_drafts.jsonl")
WARM_TRACKER = os.path.join(os.path.dirname(__file__), "warm_tracker.jsonl")
MAX_PER_DAY = 20

# === MESSAGE PATTERNS (Gojiberry Steal) ===

def generate_connection_note(name, signal_context):
    """
    Connection request note (Gojiberry style: signal-specific, no pitch).
    Rule: reference something specific about them. 2-3 sentences. No pitch.
    """
    templates = [
        f"{name}, saw your thoughts on {signal_context}. Working on the same problem — thought it was worth connecting.",
        f"{name}, your post about {signal_context} stood out. I'm focused on the same space. Worth a connection?",
        f"Saw your comment on {signal_context} — some sharp observations. Connecting to follow your work.",
    ]
    return templates[hash(name + signal_context) % len(templates)]


def generate_first_dm_question(name, signal_context, pain_area):
    """
    Gojiberry Message 1: Pure question. Zero offer. Zero link. Zero pitch.
    """
    templates = [
        f"Hey {name} — quick question: what's your biggest challenge with {pain_area} right now?",
        f"Hey {name} — curious: what's the #1 thing you're struggling with on {pain_area}?",
        f"{name} — what's the most frustrating part about {pain_area} for you at the moment?",
    ]
    return templates[hash(name + pain_area) % len(templates)]


def generate_first_dm_value(name, signal_context, pain_area):
    """
    Nebula current pattern variant (control group): offers audit immediately.
    Use this as A/B control.
    """
    return f"{name}, if useful, send the landing page. I'll tell you the first leak I'd fix. No pitch."


def generate_second_dm(name, pain_area, similar_company="SaaS founders"):
    """
    Gojiberry Message 2 (after prospect replies): relate + soft ask.
    """
    templates = [
        f"Interesting — we just solved that exact problem for {similar_company}. Mind if I send you a 3-minute video showing how?",
        f"Good to know — that's exactly the pattern we've been fixing for {similar_company}. Want me to show you the fix? 3 min video, no call.",
        f"Makes sense. We've been helping {similar_company} with this same issue. Quick video walkthrough?",
    ]
    return templates[hash(name + pain_area + similar_company) % len(templates)]


def generate_backup_dm(name, observation):
    """
    Gojiberry Backup DM (if no reply): personal observation + soft ask.
    """
    return f"Hey {name}, did you get a chance to check my message above? Noticed you're {observation} — we should chat."


def generate_followup_value(name):
    """
    Value bomb follow-up (if no reply after backup).
    """
    return f"Quick value bomb: check if the first CTA appears before proof. If yes, move proof above it before changing ads."


# === DRAFT GENERATOR ===

def build_draft(name, profile_url, signal_context, pain_area, icp_score,
                observation=None, similar_company="SaaS founders",
                pattern="gojiberry_question_first"):
    """
    Build a complete outreach draft using the selected pattern.

    Patterns:
      - gojiberry_question_first: Pure question, no offer in msg 1 (TEST)
      - nebula_audit_first: Audit offer in msg 1 (CONTROL)
    """
    connection_note = generate_connection_note(name, signal_context)

    if pattern == "gojiberry_question_first":
        first_dm = generate_first_dm_question(name, signal_context, pain_area)
    else:
        first_dm = generate_first_dm_value(name, signal_context, pain_area)

    if observation:
        backup_dm = generate_backup_dm(name, observation)
    else:
        backup_dm = generate_followup_value(name)

    draft = {
        "name": name,
        "profile_url": profile_url,
        "pattern": pattern,
        "icp_score": icp_score,
        "connection_note": connection_note,
        "first_dm": first_dm,
        "second_dm": generate_second_dm(name, pain_area, similar_company),
        "backup_dm": backup_dm,
        "followup_value": generate_followup_value(name),
        "signal_context": signal_context,
        "pain_area": pain_area,
        "status": "draft_needs_approval",
        "cap_policy": f"max_{MAX_PER_DAY}_per_day",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return draft


def save_draft(draft):
    """Append a draft to the outreach_drafts.jsonl file."""
    os.makedirs(os.path.dirname(OUTREACH_FILE), exist_ok=True)
    with open(OUTREACH_FILE, "a") as f:
        f.write(json.dumps(draft) + "\n")
    print(f"DRAFT SAVED: {draft['name']} ({draft['pattern']})")


def save_warm_tracker(draft, due_date_offset=1):
    """Save a warm tracker entry for follow-up scheduling."""
    from datetime import timedelta
    due = (datetime.now(timezone.utc) + timedelta(days=due_date_offset)).strftime("%Y-%m-%d")
    entry = {
        "name": draft["name"],
        "profile_url": draft["profile_url"],
        "pattern": draft["pattern"],
        "due_date": due,
        "next_action": "connection_note",
        "status": "pending_approval",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    os.makedirs(os.path.dirname(WARM_TRACKER), exist_ok=True)
    with open(WARM_TRACKER, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"TRACKER SAVED: {draft['name']} due {due}")


# === BATCH PROSPECT GENERATOR ===
# Sample prospects for testing

SAMPLE_PROSPECTS = [
    {
        "name": "Alex Chen",
        "profile_url": "https://linkedin.com/in/alexchen",
        "signal_context": "conversion optimization",
        "pain_area": "landing page conversions",
        "icp_score": 8,
        "observation": "running Google Ads but seeing drop-off at checkout",
        "similar_company": "B2B SaaS companies"
    },
    {
        "name": "Sarah Mitchell",
        "profile_url": "https://linkedin.com/in/sarahmitchell",
        "signal_context": "ad spend with no conversions",
        "pain_area": "ad performance",
        "icp_score": 9,
        "observation": "posting about low ROAS in marketing groups",
        "similar_company": "DTC brands"
    },
    {
        "name": "James Walker",
        "profile_url": "https://linkedin.com/in/jameswalker",
        "signal_context": "CRO and A/B testing",
        "pain_area": "conversion rate optimization",
        "icp_score": 6,
        "observation": "asking for landing page feedback in CRO forums",
        "similar_company": "growth-stage startups"
    },
    {
        "name": "Priya Patel",
        "profile_url": "https://linkedin.com/in/priyapatel",
        "signal_context": "landing page optimization",
        "pain_area": "page performance",
        "icp_score": 7,
        "observation": "commenting on competitors' content about conversion leaks",
        "similar_company": "ecommerce founders"
    },
]


def generate_test_drafts():
    """Generate one A and one B draft for each sample prospect."""
    drafts = []
    for p in SAMPLE_PROSPECTS:
        # TEST variant: Gojiberry question-first
        draft_a = build_draft(
            name=p["name"],
            profile_url=p["profile_url"],
            signal_context=p["signal_context"],
            pain_area=p["pain_area"],
            icp_score=p["icp_score"],
            observation=p["observation"],
            similar_company=p["similar_company"],
            pattern="gojiberry_question_first"
        )
        drafts.append(draft_a)
        save_draft(draft_a)
        save_warm_tracker(draft_a)

        # CONTROL variant: Nebula audit-first
        draft_b = build_draft(
            name=p["name"] + " [CONTROL]",
            profile_url=p["profile_url"],
            signal_context=p["signal_context"],
            pain_area=p["pain_area"],
            icp_score=p["icp_score"],
            observation=p["observation"],
            similar_company=p["similar_company"],
            pattern="nebula_audit_first"
        )
        drafts.append(draft_b)
        save_draft(draft_b)
        save_warm_tracker(draft_b, due_date_offset=2)

    return drafts


# === CLI ===
if __name__ == "__main__":
    print("=== Gojiberry Outreach Pattern Generator ===\n")

    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        drafts = generate_test_drafts()
        print(f"\nGenerated {len(drafts)} drafts ({len(drafts)//2} A/B pairs)")
        print(f"Saved to: {OUTREACH_FILE}")
        print(f"Tracker: {WARM_TRACKER}")
    else:
        # Single draft mode
        name = input("Prospect name: ").strip()
        signal = input("Signal context (e.g., 'conversion optimization'): ").strip()
        pain = input("Pain area (e.g., 'landing page conversions'): ").strip()
        score = int(input("ICP score (1-10): ").strip() or "5")
        profile = input("LinkedIn URL (optional): ").strip()
        observation = input("Specific observation for backup DM: ").strip()

        draft = build_draft(
            name=name,
            profile_url=profile,
            signal_context=signal,
            pain_area=pain,
            icp_score=score,
            observation=observation or None,
        )
        save_draft(draft)
        save_warm_tracker(draft)

        print(f"\nGenerated {draft['pattern']} draft for {name}")
        print(f"Connection note: {draft['connection_note']}")
        print(f"First DM: {draft['first_dm']}")
        print(f"Second DM: {draft['second_dm']}")
        print(f"Backup DM: {draft['backup_dm']}")
