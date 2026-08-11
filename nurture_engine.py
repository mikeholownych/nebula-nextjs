#!/usr/bin/env python3
"""
nurture_engine.py - Segment-aware email sequences (TrustOS Layer 2 steal).

Two modes:
  --send      (deprecated) Batch-sends to all leads in segment. Hit AM 429.
  --trickle   (recommended) Sends 1-2 emails per run. Run every 5 min via cron.

TrustOS mapping:
  Cold  (0-7):   1 email/week - educational
  Warm  (8-20):  3 emails/week - case studies, social proof
  Hot   (21+):   Immediate pitch + self-serve checkout CTA

Hot leads are handled separately by the pitching pipeline (hot_lead_watcher.py).
This engine handles cold and warm nurture cadences.

Run:  python3 nurture_engine.py --trickle
Cron: every 5m - python3 /home/mike/nebula/nurture_engine.py --trickle
"""
import json
import hashlib
import sqlite3
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from collections import defaultdict

BASE = Path("/home/mike/nebula")
sys.path.insert(0, str(BASE))

# Import track-aware rendering
from track_assignment import assign_track_from_audit
from template_renderer import render_template

DRY_RUN = "--dry-run" in sys.argv
TRICKLE = "--trickle" in sys.argv
FORCE_SEND = "--send" in sys.argv  # legacy batch mode

# ── Trickle config ──────────────────────────────────────────────────
# AgentMail rate limit: ~"Five minute send limit" observed at 2+ rapid sends.
# We send max 2 per 5-min cycle to stay under the window.
MAX_PER_TRICKLE = 2

# Min interval between nurture sends to the SAME lead (prevents spam)
MIN_DAYS_BETWEEN = {
    "cold": 6,     # ~1/week
    "warm": 2,     # ~3/week
    "hot":  0,     # immediate
}

# AgentMail config
INBOX = "sedrick@nebulacomponents.com"

# Test/sandbox emails that must never receive nurture
TEST_EMAILS = frozenset([
    "mike.holownych@aisyndicate.io",
    "mike.holownych@gmail.com",
    "mike@holownych.com",
    "test@example.com",
    "restart-test@example.com",
    "stripe@example.com",
    "founder@testco.com",
    "nebulashop@agentmail.to",
    "lead@example.com",
    "test@test.com",
    "final@smoke.test",
    "verify@nebula.test",
    "verify2@route.live",
])

NURTURE_LOG = BASE / "ledgers" / "nurture_log.jsonl"
SEGMENT_ORDER = ["cold", "warm", "hot"]  # low-segment first (cold is highest volume, lowest priority)


def send_email(to_email, subject, text_body, client_id=None):
    """Send through the centralized AgentMail release gate.

    Always passes an explicit idempotent client_id (nurture: prefix is whitelisted
    by OutboundReleaseGate for MARKETING). No auto: hashed ids - they make stuck
    retry loops invisible in delivery_events.
    """
    if DRY_RUN:
        print(f"  [DRY-RUN] WOULD SEND → {to_email}: {subject[:60]}")
        return True, "DRY_RUN"

    from agentmail_client import AgentMailClient

    if not client_id:
        digest = hashlib.sha1(f"{to_email}|{subject}".encode()).hexdigest()[:12]
        client_id = f"nurture:auto:{digest}"

    result = AgentMailClient(inbox=INBOX).send(
        to=[to_email],
        subject=subject,
        text=text_body,
        client_id=client_id,
    )
    if result.get("_error"):
        reason = result.get("_reason") or str(result.get("_error"))
        print(f"  [DELIVERY BLOCKED] {to_email}: {reason}")
        return False, reason
    return True, result.get("message_id") or result.get("id") or "sent"


# ── Content templates by segment ───────────────────────────────────

COLD_TEMPLATES = [
    {
        "subject": "Your free landing page audit is ready",
        "body": """Hey,

I checked out {site} and ran it through our audit engine. You're probably spending on ads right now - here's what your landing page is doing to that budget.

Quick summary for {domain}:
{audit_summary}

The full breakdown shows exactly where the leaks are:
{checkout_url}

No strings. Just the data.

- Mike
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

- Mike
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

- Mike
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

- Mike
Nebula Components""",
    },
    {
        "subject": "Quick question about {domain}",
        "body": """Hey,

Got a quick one - have you tried running {site} through an audit tool yet?

We ran it through ours and found some interesting things. The full report is here, takes 60 seconds to read:
{checkout_url}

Curious what you think.

- Mike
Nebula Components""",
    },
]

HOT_TEMPLATES = [
    {
        "subject": "Fix Pack for {domain} is ready",
        "body": """Hey,

We've identified the specific fixes {site} needs to start converting. Here's the summary:

{audit_summary}

The Fix Pack ($147) covers implementation of everything above - deployed to your site within 48 hours.

{checkout_url}

Most clients see results within 7 days.

- Mike
Nebula Components

P.S. - "We tried an agency before and got nothing." I hear that every week. We don't do 3-month testing cycles. We audit, fix, ship in 48 hours. No retainers. No meetings. Just results.""",
    },
    {
        "subject": "Worth 15 minutes this week?",
        "body": """Hey,

We've been tracking {domain} and the fix opportunities are clear. The audit uncovered specific, measurable issues that are costing you conversions right now.

I'm happy to walk through the results and a fix plan - 15 minutes, no pitch.

What does your calendar look like this week?

- Mike
Nebula Components

P.S. - Not sure if this applies to your industry? Every audit comes with a competitor benchmark. You'll see exactly where you stand vs. companies that are converting.""",
    },
    {
        "subject": "{domain} audit - full breakdown",
        "body": """Hey,

Since you've been checking out the audit, here's the complete picture of what {site} needs:

1. Technical fixes (speed, schema, mobile): HIGH priority
2. Content gaps (missing trust signals, weak CTAs): MEDIUM
3. AI citation readiness (new ranking signal): HIGH priority

The Fix Pack handles all of it:
{checkout_url}

If you'd rather talk through it first, I'm available.

- Mike
Nebula Components

P.S. - Think you can fix this yourself? Most of these issues take a dev 8-12 hours to identify and fix. The Fix Pack costs less than 2 hours of dev time and ships in 48 hours.""",
    },
]

SEGMENT_TEMPLATES = {
    "cold": COLD_TEMPLATES,
    "warm": WARM_TEMPLATES,
    "hot": HOT_TEMPLATES,
}


# ── Nurture log ─────────────────────────────────────────────────────

def load_nurture_log() -> dict:
    """Return {email_lower: [(timestamp, subject_fingerprint, segment), ...]} sorted oldest-first."""
    log = defaultdict(list)  # email → list of (ts_utc_str, subj_fp, segment)
    client_ids = set()
    if NURTURE_LOG.exists():
        for line in NURTURE_LOG.read_text().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                email = entry.get("email", "").lower()
                if entry.get("client_id"):
                    client_ids.add(entry["client_id"])
                if not email:
                    continue
                log[email].append((
                    entry.get("timestamp", ""),
                    entry.get("subject", "")[:60],
                    entry.get("segment", "unknown"),
                ))
            except json.JSONDecodeError:
                continue
    log["client_ids"] = client_ids
    return dict(log)


def log_sent(email, subject, segment, message_id, track_id=None, track_position_days=None, client_id=None):
    """Persist a nurture send to the log."""
    NURTURE_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email": email.lower(),
        "subject": subject[:60],
        "segment": segment,
        "message_id": message_id,
        "client_id": client_id or "",
    }
    if track_id:
        entry["track_id"] = track_id
    if track_position_days is not None:
        entry["track_position_days"] = track_position_days

    with open(NURTURE_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")


# ── Lead selection for trickle ──────────────────────────────────────

def get_audit_summary(lead):
    score = lead.get("audit_score")
    grade = lead.get("audit_grade", "")
    if score and grade:
        return f"Score: {score:.0f}/100 - Grade: {grade}"
    return "We found several conversion-blocking issues - fixes are actionable and measurable."


def lead_state_info(email: str) -> dict:
    """Cross-check the canonical lead_state.db (segment DB is not authoritative)."""
    try:
        conn = sqlite3.connect(BASE / "lead_state.db")
        row = conn.execute(
            "SELECT stage, source FROM leads WHERE lower(email)=lower(?)", (email,)
        ).fetchone()
        conn.close()
        return {"stage": row[0], "source": row[1]} if row else {}
    except Exception:
        return {}


# Stages that mean "already in a conversation/relationship - NOT a cold nurture target"
RELATIONSHIP_STAGES = frozenset({
    "replied", "contacted", "audit_delivered", "pitch_sent", "paid",
    "problem_confirmed", "commercially_qualified", "fix_offered", "fix_purchased",
    "fix_delivered", "outcome_measured", "case_study_eligible",
})


def pick_leads_for_nurture(db, send_log, max_count=MAX_PER_TRICKLE) -> list:
    """Pick leads due for nurture email, oldest-waiting-first across segments.

    Selection rules:
    1. Lead must be in cold or warm segment (hot handled by pitch pipeline)
    2. Lead must not be bounced/dead
    3. Lead must have an unsent template in its segment
    4. Lead must have waited MIN_DAYS_BETWEEN since last nurture send
    5. Returns up to max_count, rebalancing across segments
    """
    candidates = []

    for segment_name in SEGMENT_ORDER:
        if segment_name == "hot":
            continue  # hot leads handled by pitch pipeline
        templates = SEGMENT_TEMPLATES.get(segment_name, [])
        leads = db.get_leads_by_segment(segment_name)
        min_days = MIN_DAYS_BETWEEN.get(segment_name, 2)

        for lead in leads:
            email = lead.get("email", "").lower()
            if not email or db.is_bounced(email):
                continue
            if email in TEST_EMAILS:
                continue
            ls = lead_state_info(email)
            if ls.get("stage") in RELATIONSHIP_STAGES:
                continue  # already in conversation - cold nurture would be a mistake
            if (ls.get("source") or "").startswith("teardown-"):
                continue  # teardown founders get the teardown track, not generic cold

            # Check which templates have been sent
            lead_history = send_log.get(email, [])
            sent_subjects = {s[1] for s in lead_history}

            # Find first unsent template for this segment
            next_tmpl = None
            for tmpl in templates:
                fp = tmpl["subject"][:60]
                if fp not in sent_subjects:
                    next_tmpl = tmpl
                    break

            if not next_tmpl:
                continue  # all templates exhausted

            # Check time since last send to this lead (any segment)
            if lead_history:
                # lead_history is (ts_utc, subj_fp, segment) - oldest first
                # Get the most recent timestamp
                recent_ts = max(h[0] for h in lead_history if h[0])
                try:
                    last_send = datetime.fromisoformat(recent_ts)
                    now = datetime.now(timezone.utc)
                    if now - last_send < timedelta(days=min_days):
                        continue  # too soon
                except (ValueError, TypeError):
                    pass  # bad timestamp, proceed anyway

            candidates.append({
                "email": email,
                "segment": segment_name,
                "lead": lead,
                "template": next_tmpl,
                "sent_count": len(lead_history),
                "template_index": templates.index(next_tmpl),
            })

    # Sort: segment priority (cold first → lower volume caught quickly),
    # then by template index (earlier in sequence first), then by sent count (least nurtured first)
    candidates.sort(key=lambda c: (
        SEGMENT_ORDER.index(c["segment"]),
        c["template_index"],
        c["sent_count"],
    ))

    return candidates[:max_count]


# ── Teardown founder track ─────────────────────────────────────────
# Founders we already teardown-notified (source=teardown-*). Nurture the
# relationship: value-add follow-ups on a cadence, NOT the generic cold copy.

TEARDOWN_SEQ = [
    {
        "step": "d2", "min_days": 2,
        "subject": "One more thing I found on {domain}",
        "body": "Quick follow-up on the teardown I sent.\n\n"
                "{extra}\n\n"
                "If you fix that one, the 30-day re-audit will show the before/after. "
                "Free - the offer is https://nebulacomponents.com/pricing\n",
    },
    {
        "step": "d6", "min_days": 6,
        "subject": "What the fix would look like on {domain}",
        "body": "Putting a real number on it:\n\n"
                "The finding from your teardown costs you {cost_estimate} in lost "
                "conversions every month if the page keeps the leak.\n\n"
                "The $97 One-Leak Repair Sprint ships the highest-impact fix with a "
                "30-day re-audit: https://buy.stripe.com/9B63cvc2o7YMcid2Nk43S0j\n",
    },
    {
        "step": "d12", "min_days": 12,
        "subject": "Closing the loop on {domain}",
        "body": "Last note on this one - the teardown stays live at "
                "https://nebulacomponents.com/teardowns/{slug} whenever you need it.\n\n"
                "If you ship the fix yourself, reply with the result and I'll re-audit it "
                "free. If you'd rather we do it, the sprint link is above. Either way, "
                "good luck with {domain}.\n",
    },
]


def pick_teardown_followups(send_log, max_count=2) -> list:
    """Founders we teardown-notified, due for the next follow-up step."""
    try:
        conn = sqlite3.connect(BASE / "lead_state.db")
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT email, url, source, trigger_context, discovered_at FROM leads "
            "WHERE stage='discovered' AND source LIKE 'teardown-%'"
        ).fetchall()
        conn.close()
    except Exception as e:
        print(f"  [TEARDOWN TRACK ERROR] {e}")
        return []

    now = datetime.now(timezone.utc)
    candidates = []
    for r in rows:
        email = r["email"].lower()
        if email in TEST_EMAILS:
            continue
        try:
            discovered = datetime.fromisoformat(r["discovered_at"])
            if discovered.tzinfo is None:
                discovered = discovered.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            discovered = now
        days = (now - discovered).days
        slug = (r["source"] or "").replace("teardown-", "")

        for tmpl in TEARDOWN_SEQ:
            cid = f"campaign:nurture-teardown-{email}-{tmpl['step']}"
            if cid in send_log.get("client_ids", set()):
                continue
            if days < tmpl["min_days"]:
                continue
            domain = (r["url"] or "").replace("https://", "").replace("http://", "").split("/")[0] or email.split("@")[1]
            candidates.append({
                "email": email,
                "segment": "teardown",
                "client_id": cid,
                "track_id": f"teardown-{slug}",
                "track_position_days": days,
                "subject": tmpl["subject"].format(domain=domain),
                "body": tmpl["body"].format(
                    domain=domain, slug=slug,
                    extra=(r["trigger_context"] or "").strip()[:160],
                    cost_estimate="a measurable share of your ad spend",
                ),
                "due_days": days,
            })
            break  # one step per founder per cycle
    candidates.sort(key=lambda c: -c["due_days"])
    return candidates[:max_count]


# ── Post-audit nurture track ───────────────────────────────────────
# People who completed a free audit and submitted an email. Warm by
# definition - sequence: findings recap → case study → $97 sprint → re-audit.

AUDIT_SEQ = [
    {
        "step": "d1", "min_days": 1,
        "subject": "Your audit is ready - the one finding that matters",
        "body": "You ran the free audit on {site}. Here's the short version:\n\n"
                "{finding}\n\n"
                "See the full breakdown anytime: https://nebulacomponents.com/audit\n",
    },
    {
        "step": "d4", "min_days": 4,
        "subject": "What a fixed version of {domain} looks like",
        "body": "Same engine, real before/after - we teardown public sites and show "
                "exactly what's leaking: https://nebulacomponents.com/teardowns\n\n"
                "Every finding includes the evidence. That's the standard your fix "
                "should meet too.\n",
    },
    {
        "step": "d9", "min_days": 9,
        "subject": "The $97 sprint - one leak, fixed, 30-day re-audit",
        "body": "If your audit found a leak worth fixing, this is the smallest way to "
                "ship it:\n\n"
                "→ One-Leak Repair Sprint ($97): the highest-impact finding from your "
                "audit, implemented, with a 30-day re-audit included.\n"
                "https://buy.stripe.com/9B63cvc2o7YMcid2Nk43S0j\n\n"
                "No retainer. No site access needed - we write the targeted fix, you "
                "implement it in minutes.\n",
    },
    {
        "step": "d16", "min_days": 16,
        "subject": "Last one - re-audit stays free",
        "body": "Closing the loop: your audit link stays valid, and if you ship any fix "
                "yourself, the 30-day re-audit will show what changed.\n\n"
                "If it's still leaking, the sprint link from my last email is the "
                "fastest path. Either way, no more emails after this one.\n",
    },
]


def pick_audit_nurture(send_log, max_count=2) -> list:
    """Audit completers with submitted email, due for next post-audit step."""
    audit_path = BASE / "audit_leads.jsonl"
    if not audit_path.exists():
        return []

    leads = {}
    for line in audit_path.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        email = (entry.get("email") or "").strip().lower()
        if not email or email in TEST_EMAILS:
            continue
        leads.setdefault(email, entry)

    from lead_store import LeadStore
    db = LeadStore()
    now = datetime.now(timezone.utc)
    candidates = []
    for email, entry in leads.items():
        if db.is_bounced(email):
            continue
        try:
            completed = datetime.fromisoformat(entry.get("timestamp", ""))
            if completed.tzinfo is None:
                completed = completed.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            completed = now
        days = (now - completed).days

        for tmpl in AUDIT_SEQ:
            cid = f"campaign:nurture-audit-{email}-{tmpl['step']}"
            if cid in send_log.get("client_ids", set()):
                continue
            if days < tmpl["min_days"]:
                continue
            domain = (entry.get("url") or "").replace("https://", "").replace("http://", "").split("/")[0] or email.split("@")[1]
            site = entry.get("url") or f"https://{domain}"
            candidates.append({
                "email": email,
                "segment": "audit",
                "client_id": cid,
                "track_id": "post-audit",
                "track_position_days": days,
                "subject": tmpl["subject"].format(domain=domain),
                "body": tmpl["body"].format(
                    domain=domain, site=site,
                    finding="the highest-impact finding in your report - see the link below for the full breakdown",
                ),
                "due_days": days,
            })
            break
    candidates.sort(key=lambda c: -c["due_days"])
    return candidates[:max_count]


# ── Trickle cycle ───────────────────────────────────────────────────

def run_trickle():
    """Send 1-2 emails per run across segment, teardown, and audit tracks."""
    from lead_store import LeadStore

    db = LeadStore()
    send_log = load_nurture_log()

    candidates = pick_leads_for_nurture(db, send_log,
                                         max_count=MAX_PER_TRICKLE)
    teardown_cands = pick_teardown_followups(send_log, max_count=MAX_PER_TRICKLE)
    audit_cands = pick_audit_nurture(send_log, max_count=MAX_PER_TRICKLE)

    all_candidates = (teardown_cands + audit_cands + candidates)[:MAX_PER_TRICKLE]

    if not all_candidates:
        print("[trickle] No leads due for nurture")
        return {"sent": 0, "skipped": 0, "errors": 0, "candidates": 0}

    print(f"[trickle] {len(all_candidates)} lead(s) due for nurture "
          f"(segment={len(candidates)}, teardown={len(teardown_cands)}, audit={len(audit_cands)})")
    sent = 0
    errors = 0

    for c in all_candidates:
        email = c["email"]
        segment = c["segment"]

        # Prebuilt track candidate (teardown/audit) - has subject/body/client_id
        if "client_id" in c and "body" in c:
            ok, msg_id = send_email(email, c["subject"], c["body"], client_id=c["client_id"])
            if ok:
                log_sent(email, c["subject"], segment, msg_id,
                         track_id=c.get("track_id"), track_position_days=c.get("track_position_days"),
                         client_id=c["client_id"])
                sent += 1
                print(f"  ✓ {email} [{segment}/{c.get('track_id','')}]: {c['subject'][:50]}")
            else:
                if msg_id == "429_rate_limit":
                    print(f"  → Rate limit hit after {sent} sent. Remaining deferred.")
                    errors += 1
                    break
                errors += 1
            if sent < len(all_candidates):
                time.sleep(3)
            continue

        # Legacy segment candidate - existing track-aware path
        lead = c["lead"]
        tmpl = c["template"]
        track_id = lead.get("nurture_track", "")
        track_position = lead.get("track_position_days", 0)
        subject_fp = tmpl["subject"]
        cid = f"nurture:segment:{hashlib.sha1(f'{email}|{subject_fp}'.encode()).hexdigest()[:12]}"

        if track_id and track_id != "":
            track_topic = track_id.split("-")[0]
            position_variant = min(track_position // 7 + 1, 3)
            if segment == "hot":
                template_id = f"hot_{track_topic}_pitch_1"
            elif segment == "cold":
                template_id = f"cold_{track_topic}_{'diagnosis' if position_variant == 1 else 'intro'}_{position_variant}"
            elif segment == "warm":
                template_id = f"warm_{track_topic}_{'teardown' if position_variant == 1 else 'checklist'}_{position_variant}"
            else:
                template_id = f"{segment}_{track_topic}_1"

            rendered = render_template(
                template_id=template_id,
                lead=lead,
                audit=None,
                extra_vars={"checkout_url": f"https://nebulacomponents.com/checkout?email={email}"}
            )

            if rendered:
                subject = rendered["subject"]
                body = rendered["body"]
                ok, msg_id = send_email(email, subject, body, client_id=cid)
                if ok:
                    log_sent(email, subject, segment, msg_id, track_id=track_id,
                             track_position_days=track_position, client_id=cid)
                    sent += 1
                    print(f"  ✓ {email} [{segment}/{track_id}]: {subject[:50]}")
                else:
                    if msg_id == "429_rate_limit":
                        print(f"  → Rate limit hit after {sent} sent. Remaining deferred.")
                        errors += 1
                        break
                    errors += 1
                if sent < len(all_candidates):
                    time.sleep(3)
                continue

        domain = lead.get("url", "").replace("https://", "").replace("http://", "").split("/")[0] or email.split("@")[1] if "@" in email else "yoursite.com"
        site = lead.get("url", "") or f"https://{domain}"
        audit_summary = get_audit_summary(lead)
        checkout_url = f"https://nebulacomponents.com/checkout?email={email}&url={site}"

        trigger_text = (lead.get("trigger_text") or "").strip()
        signal_opener = ""
        if trigger_text and c["template_index"] == 0 and segment == "cold":
            opener = trigger_text[:120].rstrip(".,;")
            signal_opener = f"Came across your post about \"{opener}\" - ran a quick audit on your page.\n\n"

        try:
            subject = tmpl["subject"].format(domain=domain[:30], domain_example=domain[:20])
            body = tmpl["body"].format(site=site, domain=domain[:30], email=email,
                                       audit_summary=audit_summary, checkout_url=checkout_url)
            if signal_opener:
                body = signal_opener + body
        except KeyError as e:
            print(f"  [TEMPLATE ERROR] {email}: missing key {e}")
            errors += 1
            continue

        ok, msg_id = send_email(email, subject, body, client_id=cid)
        if ok:
            log_sent(email, subject, segment, msg_id, client_id=cid)
            sent += 1
            print(f"  ✓ {email} [{segment}]: {subject[:50]}")
        else:
            if msg_id == "429_rate_limit":
                print(f"  → Rate limit hit after {sent} sent. Remaining deferred.")
                errors += 1
                break
            errors += 1

        if sent < len(all_candidates):
            time.sleep(3)

    print(f"\n[trickle] Sent: {sent}  Errors: {errors}  Deferred: {len(all_candidates)-sent-errors}")
    return {"sent": sent, "errors": errors, "candidates": len(all_candidates)}


# ── Legacy batch mode (deprecated) ──────────────────────────────────

def run_nurture_cycle():
    """DEPRECATED batch-send mode. Use --trickle instead."""
    from lead_store import LeadStore

    db = LeadStore()
    send_log, _ = load_nurture_log()

    total_sent = 0
    total_skipped = 0
    total_errors = 0

    segments = [
        ("cold", COLD_TEMPLATES, 10),
        ("warm", WARM_TEMPLATES, 10),
        ("hot",  HOT_TEMPLATES,  20),
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

            domain = lead.get("url", "").replace("https://", "").replace("http://", "").split("/")[0] or email.split("@")[1] if "@" in email else "yoursite.com"
            site = lead.get("url", "") or f"https://{domain}"
            audit_summary = get_audit_summary(lead)
            checkout_url = f"https://nebulacomponents.com/checkout?email={email}&url={site}"

            sent_for_lead = send_log.get(email, set())
            sent_any = False

            for tmpl in templates:
                subj_fingerprint = tmpl["subject"][:60]
                if subj_fingerprint in sent_for_lead:
                    continue

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
                break

            if not sent_any:
                if sent_for_lead:
                    total_skipped += 1
                else:
                    total_errors += 1

        print(f"  → sent {sent_in_segment} in {segment_name}")

    print(f"\n=== Nurture cycle complete ===")
    print(f"  Sent:    {total_sent}")
    print(f"  Skipped: {total_skipped}")
    print(f"  Errors:  {total_errors}")
    return {"sent": total_sent, "skipped": total_skipped, "errors": total_errors}


# ── CLI ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if TRICKLE:
        run_trickle()
    elif DRY_RUN or FORCE_SEND:
        run_nurture_cycle()
    else:
        print("Usage: python3 nurture_engine.py [--trickle | --send | --dry-run]")
        print("  --trickle  Send 1-2 emails per run (recommended, run every 5m)")
        print("  --send     Batch send (deprecated, hits AM 429)")
        print("  --dry-run  Simulate without sending")
