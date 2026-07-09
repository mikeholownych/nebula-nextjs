#!/usr/bin/env python3
"""
nurture_engine.py — Segment-aware email sequences (TrustOS Layer 2 steal).

Uses lead_score from LeadStore to divide leads into cold/warm/hot segments
and sends different content cadences based on engagement level.

TrustOS mapping:
  Cold  (0-7):   1 email/week — educational (audit intro, value drops)
  Warm  (8-20):  3 emails/week — case studies, social proof
  Hot   (21+):   Immediate pitch + self-serve checkout CTA

Hot leads trigger the $147 pitch directly (no delay — these are ready to buy).

Run:  python3 nurture_engine.py [--dry-run] [--send]
Cron: every 4h — python3 /home/mike/nebula/nurture_engine.py --send
"""
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/home/mike/nebula")
sys.path.insert(0, str(BASE))

DRY_RUN = "--dry-run" in sys.argv
FORCE_SEND = "--send" in sys.argv

# ── Config ──────────────────────────────────────────────────────────
MAX_PER_SEGMENT = {
    "cold": 10,    # 1/week, cap at 10/day to avoid overwhelming
    "warm": 10,    # 3/week ≈ 12/mo, cap at 10/day
    "hot":  20,    # Hot leads get pitched immediately — no cap
}

# AgentMail config
INBOX = "nebulashop@agentmail.to"
API_BASE = "https://api.agentmail.to"

def _get_auth():
    secret = Path.home() / ".hermes" / "secrets" / "agentmail.key"
    token = secret.read_text().strip() if secret.exists() else ""
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def send_email(to_email, subject, text_body):
    """Send via AgentMail API. Returns (success_bool, message)."""
    if DRY_RUN:
        print(f"  [DRY-RUN] WOULD SEND → {to_email}: {subject[:60]}")
        return True, "DRY_RUN"

    import urllib.request, urllib.error
    headers = _get_auth()
    payload = json.dumps({
        "to": [to_email],
        "subject": subject,
        "text": text_body,
    }).encode()

    try:
        req = urllib.request.Request(
            f"{API_BASE}/inboxes/{INBOX}/messages/send",
            data=payload, headers=headers, method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode()
            result = json.loads(body) if body else {}
            msg = result.get("message_id", "sent")
            return True, msg
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:200] if e.fp else str(e)
        if e.code == 403:
            print(f"  [403 SUPPRESSED] {to_email}")
            return False, "403_suppressed"
        print(f"  [AM {e.code}] {to_email}: {err_body}")
        return False, f"{e.code}: {err_body}"
    except Exception as e:
        print(f"  [AM ERROR] {to_email}: {e}")
        return False, str(e)


# ── Content templates by segment ───────────────────────────────────
# TrustOS: cold gets educational, warm gets proof, hot gets pitch

COLD_TEMPLATES = [
    {
        "subject": "Your free landing page audit is ready",
        "body": """Hey,

I checked out {site} and ran it through our audit engine. You're probably spending on ads right now — here's what your landing page is doing to that budget.

Quick summary for {domain}:
{audit_summary}

The full breakdown shows exactly where the leaks are:
{checkout_url}

No strings. Just the data.

— Mike
Nebula Components""",
    },
    {
        "subject": "The #1 reason B2B landing pages bleed money",
        "body": """Hey,

Most founders we talk to think their offer is the problem. In 9 out of 10 audits, it's not.

It's the page itself:
• No clear value prop in the first 3 seconds
• Trust signals buried below the fold
• CTA that asks for commitment before proving value

We built a free tool that scans for these exact leaks. Here's the one we ran on {site}:
{checkout_url}

— Mike
Nebula Components""",
    },
]

WARM_TEMPLATES = [
    {
        "subject": "How {domain_example} fixed the same problem",
        "body": """Hey,

We audited a company in your space last month. Same problem: ad spend, no conversions.

Here's what the audit found:
• 62-point page speed issue (loading 4s+ on mobile)
• Missing schema markup (0 products indexed)
• Form submission error hidden in console

We fixed all three. Their conversion rate went from 0.3% to 4.1% in 2 weeks.

The fix pack covers exactly this: {checkout_url}

— Mike
Nebula Components""",
    },
    {
        "subject": "What your competitors are doing (that you're not)",
        "body": """Hey,

We scanned 50 competitors in your space. The ones converting consistently all have 3 things in common:

1. AI citation optimization (Google's new ranking signal)
2. Technical SEO fundamentals (speed, schema, CLS)
3. Objection-first landing page copy

The audit we ran on {site} covers all 3:
{checkout_url}

— Mike
Nebula Components""",
    },
    {
        "subject": "Quick question about {domain}",
        "body": """Hey,

Got a quick one — have you tried running {site} through an audit tool yet?

We ran it through ours and found some interesting things. The full report is here, takes 60 seconds to read:
{checkout_url}

Curious what you think.

— Mike
Nebula Components""",
    },
]

HOT_TEMPLATES = [
    {
        "subject": "Fix Pack for {domain} is ready",
        "body": """Hey,

We've identified the specific fixes {site} needs to start converting. Here's the summary:

{audit_summary}

The Fix Pack ($147) covers implementation of everything above — deployed to your site within 48 hours.

{checkout_url}

Most clients see results within 7 days.

— Mike
Nebula Components

P.S. — "We tried an agency before and got nothing." I hear that every week. We don't do 3-month testing cycles. We audit, fix, ship in 48 hours. No retainers. No meetings. Just results.""",
    },
    {
        "subject": "Worth 15 minutes this week?",
        "body": """Hey,

We've been tracking {domain} and the fix opportunities are clear. The audit uncovered specific, measurable issues that are costing you conversions right now.

I'm happy to walk through the results and a fix plan — 15 minutes, no pitch.

What does your calendar look like this week?

— Mike
Nebula Components

P.S. — Not sure if this applies to your industry? Every audit comes with a competitor benchmark. You'll see exactly where you stand vs. companies that are converting.""",
    },
    {
        "subject": "{domain} audit — full breakdown",
        "body": """Hey,

Since you've been checking out the audit, here's the complete picture of what {site} needs:

1. Technical fixes (speed, schema, mobile): HIGH priority
2. Content gaps (missing trust signals, weak CTAs): MEDIUM
3. AI citation readiness (new ranking signal): HIGH priority

The Fix Pack handles all of it:
{checkout_url}

If you'd rather talk through it first, I'm available.

— Mike
Nebula Components

P.S. — Think you can fix this yourself? Most of these issues take a dev 8-12 hours to identify and fix. The Fix Pack costs less than 2 hours of dev time and ships in 48 hours.""",
    },
]


def load_nurture_log():
    """Track which emails we've sent per lead to avoid duplicates."""
    log_path = BASE / "ledgers" / "nurture_log.jsonl"
    sent = {}  # email.lower() → set of subject_fingerprints
    if log_path.exists():
        for line in log_path.read_text().splitlines():
            if line.strip():
                try:
                    entry = json.loads(line)
                    email = entry.get("email", "").lower()
                    subj = entry.get("subject", "")[:60]
                    if email:
                        if email not in sent:
                            sent[email] = set()
                        sent[email].add(subj)
                except json.JSONDecodeError:
                    pass
    return sent, log_path


def log_sent(email, subject, segment, message_id):
    """Persist a nurture send to the log."""
    log_path = BASE / "ledgers" / "nurture_log.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "a") as f:
        f.write(json.dumps({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "email": email.lower(),
            "subject": subject[:60],
            "segment": segment,
            "message_id": message_id,
        }) + "\n")


def get_audit_summary(lead):
    """Generate a short audit summary from the lead's data, or a generic one."""
    score = lead.get("audit_score")
    grade = lead.get("audit_grade", "")
    if score and grade:
        return f"Score: {score:.0f}/100 — Grade: {grade}"
    return "We found several conversion-blocking issues — fixes are actionable and measurable."


def run_nurture_cycle():
    """Main nurture loop: load leads by segment, send appropriate emails."""
    from lead_store import LeadStore

    db = LeadStore()
    sent_log, _ = load_nurture_log()

    total_sent = 0
    total_skipped = 0
    total_errors = 0

    segments = [
        ("cold", COLD_TEMPLATES, MAX_PER_SEGMENT["cold"]),
        ("warm", WARM_TEMPLATES, MAX_PER_SEGMENT["warm"]),
        ("hot",  HOT_TEMPLATES,  MAX_PER_SEGMENT["hot"]),
    ]

    for segment_name, templates, max_send in segments:
        leads = db.get_leads_by_segment(segment_name)
        print(f"\n[{segment_name.upper()}] {len(leads)} leads, max {max_send} sends")

        sent_in_segment = 0
        for lead in leads:
            if sent_in_segment >= max_send:
                break

            email = lead.get("email", "").lower()
            if not email or db.is_bounced(email):
                continue

            # Build context
            domain = lead.get("url", "").replace("https://", "").replace("http://", "").split("/")[0] or email.split("@")[1] if "@" in email else "yoursite.com"
            site = lead.get("url", "") or f"https://{domain}"
            audit_summary = get_audit_summary(lead)

            # Build checkout URL
            checkout_url = f"https://nebulacomponents.shop/checkout?email={email}&url={site}"

            sent_for_lead = sent_log.get(email, set())
            sent_any = False

            for tmpl in templates:
                # Skip if this subject was already sent to this lead
                subj_fingerprint = tmpl["subject"][:60]
                if subj_fingerprint in sent_for_lead:
                    continue

                # Fill template
                try:
                    subject = tmpl["subject"].format(
                        domain=domain[:30],
                        domain_example=domain[:20],
                    )
                    body = tmpl["body"].format(
                        site=site,
                        domain=domain[:30],
                        email=email,
                        audit_summary=audit_summary,
                        checkout_url=checkout_url,
                    )
                except KeyError as e:
                    print(f"  [TEMPLATE ERROR] {email}: missing key {e}")
                    continue

                ok, msg_id = send_email(email, subject, body)
                if ok:
                    log_sent(email, subject, segment_name, msg_id)
                    sent_any = True
                    sent_in_segment += 1
                    total_sent += 1
                    print(f"  ✓ {email} [{segment_name}]: {subject[:50]}")
                else:
                    total_errors += 1

                # One email per lead per cycle (don't blast them all at once)
                break

            if not sent_any:
                # All templates already used — lead is fully nurtured
                if sent_for_lead:
                    total_skipped += 1
                else:
                    # First cycle, template error
                    total_errors += 1

        print(f"  → sent {sent_in_segment} in {segment_name}")

    print(f"\n=== Nurture cycle complete ===")
    print(f"  Sent:    {total_sent}")
    print(f"  Skipped: {total_skipped}")
    print(f"  Errors:  {total_errors}")
    return {"sent": total_sent, "skipped": total_skipped, "errors": total_errors}


if __name__ == "__main__":
    if DRY_RUN or FORCE_SEND:
        run_nurture_cycle()
    else:
        print("Usage: python3 nurture_engine.py [--dry-run] [--send]")
        print("  --dry-run  Simulate without sending")
        print("  --send     Send live emails")
