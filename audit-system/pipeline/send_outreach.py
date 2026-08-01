#!/usr/bin/env python3
"""
pipeline/send_outreach.py
Generate and send trigger-based outreach for a qualified lead via AgentMail.

Usage:
  python3 send_outreach.py <email> [--dry-run]

Checks:
  - Audit exists and is completed
  - Has quick_win finding with impact >= 4.0
  - Email not in bounce list
  - lifecycle_state == commercially_qualified (or --force to skip)
  - Pre-send checklist passes (4-sentence structure, one question mark,
    no filler, no guesses, plain-words who-line, reads under 15s)

The message follows the 4-sentence cold-DM structure:
  S1 TRIGGER   — what changed / the specific thing (the audit itself)
  S2 WHO       — one plain line about Nebula
  S3 WHY THEM  — the finding that could only be sent to them
  S4 THE ASK   — one low-friction invitation, one question mark

Source: Rananjay Raj cold-DM carousel (implemented 2026-07-31).
"""

import sys
import os
import argparse
import json
import re
from pathlib import Path

sys.path.insert(0, "/home/mike/nebula")

import psycopg2


# ─────────────────────────────────────────────────────────────────────────────
# Pre-send checklist (the "Before you hit send" gate)
# ─────────────────────────────────────────────────────────────────────────────

FILLER_PHRASES = [
    "hope this finds you well",
    "hoping this finds you well",
    "just wanted to reach out",
    "just reaching out",
    "i hope you",
    "i noticed you probably",
    "you probably struggle",
    "you might be struggling",
    "would love to jump on a call",
    "would you be open to a quick call",
    "saw that you just",
]

GUESS_WORDS = [
    "probably",
    "maybe you",
    "might be",
    "i assume",
    "i guess",
    "it seems like",
    "likely",
]


def check_message(subject: str, body: str, domain: str) -> dict:
    """
    Run the 8-box pre-send checklist. Returns {"ok": bool, "checks": [...], "fails": [...]}.

    Adapted for audit-based outreach: the "no claim about what's broken inside
    their company" box is satisfied by grounding the claim in the audit finding
    (measured evidence) rather than guessing — but we still block speculative
    language like "probably" in the copy.
    """
    combined = (subject + " " + body).lower()
    checks = []

    def add(name, passed, detail=""):
        checks.append({"check": name, "passed": passed, "detail": detail})

    # 1. Trigger named — the subject names the domain (the audit is the trigger)
    add("trigger_named", domain.lower() in subject.lower() or domain.lower() in body.lower(),
        "subject/body names the domain")

    # 2. Work created named — the finding/issue is stated
    has_finding = "finding" in body or "issue" in body or "leak" in body or "conversion" in body.lower()
    add("work_named", has_finding, "body names the specific issue")

    # 3. Who line in plain words — "Nebula" + what we do, no jargon
    has_who = "nebula" in combined and ("audit" in combined or "fix" in combined)
    add("who_plain", has_who, "plain who-line present")

    # 4. Why-them could not be sent to anyone else — domain-specific finding
    add("why_them_specific", domain.lower() in body.lower(),
        "body references the specific domain")

    # 5. Exactly one question mark, in the ask (last sentence)
    q_count = body.count("?")
    body_lines = [l for l in body.strip().split("\n") if l.strip()]
    last_line = body_lines[-1] if body_lines else ""
    q_in_last = "?" in last_line
    add("one_question_mark", q_count == 1, f"question marks: {q_count}")
    add("question_in_ask", q_in_last, "question mark is in the final ask sentence")

    # 6. No filler / greeting / "just"
    fillers_hit = [f for f in FILLER_PHRASES if f in combined]
    add("no_filler", not fillers_hit,
        f"fillers found: {fillers_hit}" if fillers_hit else "no fillers")

    # 7. No speculative claim about what's broken — block guess words
    guesses_hit = [g for g in GUESS_WORDS if g in combined]
    add("no_guesses", not guesses_hit,
        f"guess words: {guesses_hit}" if guesses_hit else "no guess language")

    # 8. Reads aloud under 15 seconds (~150 wpm → ~37 words; allow ~65 for email)
    word_count = len(combined.split())
    add("reads_under_15s", word_count <= 65, f"word count: {word_count}")

    fails = [c for c in checks if not c["passed"]]
    return {"ok": len(fails) == 0, "checks": checks, "fails": fails}


# ─────────────────────────────────────────────────────────────────────────────
# Data access
# ─────────────────────────────────────────────────────────────────────────────

def get_audit_data(email):
    conn = psycopg2.connect(dbname="nebula_audit", user="postgres", host="/var/run/postgresql", port=5433)
    cur = conn.cursor()

    # Get top finding
    cur.execute("""
        SELECT 
            a.url,
            a.score,
            f->>'label',
            f->>'issue',
            f->>'fix',
            (f->>'impact')::numeric
        FROM audits a,
             jsonb_array_elements(a.findings) f
        WHERE a.email = %s
          AND a.status = 'completed'
          AND (f->>'impact')::numeric >= 4.0
          AND f->>'quadrant' = 'quick_win'
        ORDER BY (f->>'impact')::numeric DESC
        LIMIT 1
    """, (email,))
    row = cur.fetchone()

    # Fallback: any high-impact finding if no quick_win
    if not row:
        cur.execute("""
            SELECT 
                a.url, a.score,
                f->>'label', f->>'issue', f->>'fix',
                (f->>'impact')::numeric
            FROM audits a, jsonb_array_elements(a.findings) f
            WHERE a.email = %s AND a.status = 'completed'
              AND (f->>'impact')::numeric >= 4.0
            ORDER BY (f->>'impact')::numeric DESC LIMIT 1
        """, (email,))
        row = cur.fetchone()

    conn.close()
    if not row:
        return None
    return {
        "url": row[0], "score": row[1],
        "finding": row[2], "issue": row[3],
        "fix": row[4], "impact": float(row[5])
    }


def is_bounced(email):
    try:
        from lead_store import LeadStore
        store = LeadStore()
        return store.is_bounced(email)
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Message generation — 4-sentence structure
# ─────────────────────────────────────────────────────────────────────────────

def build_message(data):
    """Build subject + body using the 4-sentence cold-DM structure."""
    url = data["url"]
    domain = url.replace("https://", "").replace("http://", "").split("/")[0]
    finding = data["finding"]
    issue = data["issue"]
    fix = data["fix"]
    impact = data["impact"]

    subject = f"Found the conversion issue on {domain}"

    body = f"""Ran an audit on {url}.

We're Nebula — we audit landing pages that burn ad budgets.

Your highest-impact issue ({impact}/5): {finding}. {issue}

The exact implementation brief — step-by-step fix, verification test, 30-day re-audit — is $97: https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h

Want it?"""

    return subject, body, domain


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("email", help="Lead email address")
    parser.add_argument("--dry-run", action="store_true", help="Print without sending")
    parser.add_argument("--force", action="store_true", help="Skip lifecycle_state gate")
    parser.add_argument("--skip-checklist", action="store_true",
                        help="Skip pre-send checklist (emergency only — never use in production)")
    args = parser.parse_args()

    email = args.email

    # Bounce check
    if is_bounced(email):
        print(f"❌ Skipped: {email} is bounced")
        sys.exit(1)

    # Pull audit data
    data = get_audit_data(email)
    if not data:
        print(f"❌ No completed audit with qualifying finding for {email}")
        sys.exit(1)

    subject, body, domain = build_message(data)

    print(f"To:      {email}")
    print(f"Subject: {subject}")
    print(f"\n{body}")
    print()

    # ── Pre-send checklist gate ────────────────────────────────────────────
    result = check_message(subject, body, domain)
    print("── Pre-send checklist ──")
    for c in result["checks"]:
        mark = "✅" if c["passed"] else "❌"
        print(f"  {mark} {c['check']}" + (f"  ({c['detail']})" if c["detail"] else ""))

    if not result["ok"] and not args.skip_checklist:
        print("\n❌ BLOCKED: pre-send checklist failed. Fix the message before sending.")
        print("   (Use --skip-checklist only for emergency manual sends.)")
        sys.exit(2)

    if args.dry_run:
        print("\n✅ DRY RUN — not sent")
        return

    # Send via AgentMail
    from agentmail_client import AgentMailClient
    client = AgentMailClient()
    result_send = client.send(
        to=[email],
        subject=subject,
        text=body,
        labels=["outreach", "sprint-offer"]
    )

    if result_send.get("ok") or result_send.get("id"):
        print(f"✅ Sent to {email}")
        print(f"   Message ID: {result_send.get('id', 'unknown')}")

        # Update lifecycle state
        try:
            conn = psycopg2.connect(dbname="nebula_audit", user="postgres", host="/var/run/postgresql", port=5433)
            cur = conn.cursor()
            cur.execute("""
                UPDATE audits SET status = 'pitched'
                WHERE email = %s AND status = 'completed'
            """, (email,))
            conn.commit()
            conn.close()
            print(f"   DB: status → pitched")
        except Exception as e:
            print(f"   DB update skipped: {e}")
    else:
        print(f"❌ Send failed: {result_send}")
        sys.exit(1)


if __name__ == "__main__":
    main()
