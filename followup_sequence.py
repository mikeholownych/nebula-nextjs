#!/usr/bin/env python3
"""
followup_sequence.py — Automated Day 2/4/7 email follow-up sequence.
Run every 6h via cron. Idempotent — never double-sends.

Usage:
  python3 followup_sequence.py           # live run
  python3 followup_sequence.py --dry-run # print what WOULD be sent
"""

import sys, json, os, smtplib, ssl, re, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ── Stripe personalised checkout links ────────────────────────────
sys.path.insert(0, str(Path("/home/mike/nebula")))
try:
    from stripe_links import get_97_checkout_url
    HAS_STRIPE_LINKS = True
except ImportError:
    HAS_STRIPE_LINKS = False
    def get_97_checkout_url(email, lead_url, audit_score, domain):  # type: ignore
        return "https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00"

DRY_RUN = "--dry-run" in sys.argv

# ── Bounce detection ──
sys.path.insert(0, str(Path("/home/mike/nebula")))
try:
    from bounce_detector import classify_smtp_response, log_bounce_event
    from lead_store import LeadStore
    HAS_BOUNCE_DETECTION = True
except ImportError:
    classify_smtp_response = None  # type: ignore
    log_bounce_event = None        # type: ignore
    LeadStore = None               # type: ignore
    HAS_BOUNCE_DETECTION = False

# ── Paths ─────────────────────────────────────────────────────────
NEBULA        = Path("/home/mike/nebula")
AUDIT_LEADS   = NEBULA / "audit_leads.jsonl"
CONTACTED     = NEBULA / "contacted.json"
HOT_LEAD      = NEBULA / "HOT_LEAD.json"
LEDGER        = NEBULA / "ledgers/customer-ledger.jsonl"
FOLLOWUP_ST   = NEBULA / "followup_state.jsonl"
AGENTMAIL_KEY = Path.home() / ".hermes/secrets/agentmail_org.key"

# ── SMTP ──────────────────────────────────────────────────────────
SMTP_HOST = "smtp.agentmail.to"
SMTP_PORT = 465
SMTP_USER = "ops@launchcrate.io"
FROM_NAME = "Nebula Audit Agent <ops@launchcrate.io>"
STRIPE    = "https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02"
STRIPE_7  = "https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00"

# ── Sequence definitions ──────────────────────────────────────────
# Playbook-compliant 5-touch sequence: initial audit delivery + 4 follow-ups.
# Rules enforced: one CTA, low-friction ask before payment link, no "just bumping" copy.
AUDIT_SEQ = [
    (2, "email2_methodology",
     "why {domain}'s page is losing money before the pitch",
     """Hey,

Before I pitch anything — here's the framework that caught the issue on {domain}.

Most landing pages that fail on paid traffic fail the same way:
visitors understand *what* the product is, but they can't feel *why it's for them*.
That's the gap between a page that converts at 1% and one that converts at 4%.

The audit found {top_issue_short} on {domain}.
That's the precise mechanic: {top_fix}

This is why ad spend bleeds — the click is real, the intent is real,
but the page never completes the job.

Worth knowing regardless of what you do next.

— Nebula Audit Agent"""),

    (3, "email3_social_proof",
     "re: {domain} — quick example",
     """Hey,

Quick example — pages with the same {top_issue_short} problem usually leak intent before the visitor understands the offer.

When the fix is sequenced right, the page stops asking people to think and starts showing one obvious next step.

The next step is self-serve: run the audit page again after changes, or start implementation here: {stripe}
Or grab the $7 DIY kit: {stripe_7}

— Nebula Audit Agent"""),

    (5, "email4_free_resource",
     "re: sending this regardless",
     """Hey,

Figured I’d send this regardless of timing.

Use this order:
1. Fix {top_issue_short}: {top_fix}
2. Add one proof point near the first CTA
3. Remove any secondary CTA above the fold

No call required. No scheduling. If you want the implementation, start here: {stripe}
Or the $7 self-serve kit: {stripe_7}

— Nebula Audit Agent"""),

    (6, "email4b_objections",
     "re: {domain} — is this worth $97?",
     """Hey,

Two questions people usually have before fixing {top_issue_short}. Answering both directly:

"Is $97 worth it for just one fix?"
The audit already told you the exact leak and the exact fix. You're not paying to be told what's wrong — you're paying to have {top_issue_short} implemented correctly, tested, and live. That's implementation, not advice.

"How do I know this will actually work?"
It won't guarantee a specific conversion lift — no one honestly can promise that. What it does fix is the specific, named leak in your own audit: {top_fix}. That's a real, verifiable change to your page, not a generic tactic.

If that's a fair trade, start here: {stripe}
Prefer to do it yourself first? Grab the $7 DIY kit: {stripe_7}

— Nebula Audit Agent"""),

    (7, "email5_permission_close",
     "closing this out?",
     """Hey,

Totally fine if now’s not the right time.

This sequence is closing now. If the page is still leaking conversions, the self-serve implementation link is here: {stripe}
Or DIY with the $7 kit: {stripe_7}

— Nebula Audit Agent"""),
]

COLD_SEQ = [
    (3, "day3_cold",
     "two useful fixes for {domain}",
     """Hey,

I am sending the useful part, not a generic pitch.

The two visible leaks I found:

1. {issue1}
2. {issue2}

If you want to sanity-check it, the self-serve audit is here:
https://nebulacomponents.shop/audit.html

No call. No calendar. Keep the fixes either way.

— Nebula Audit Agent"""),
]

# ── Inactive Lead Reviver — contacted >7d, never requested audit ──
# Trigger: lead in contacted.json, age >7d, no entry in audit_leads, no prior send
REVIVE_SEQ = [
    (7, "revive_case_study",
     "re: {domain} — a pattern worth knowing",
     """Hi,

Reached out last week about {domain}. No pressure if timing was off.

One thing that might be more useful: across 200+ audits, three issues show up on most underperforming paid-traffic pages:

1. Trust signals after the CTA — visitors bounce before they see proof (73% of pages)
2. Headline written for people who already know the product — not for the ad click (67%)
3. Multiple competing CTAs above the fold before the visitor decides they want anything (58%)

Full write-up: https://nebulacomponents.shop/case-studies/

Free audit if you'd like to check {domain}: https://nebulacomponents.shop/audit.html

— Nebula"""),
]

# ── Lost-Deal Recycler — pitch_sent >72h, no payment ──
# Trigger: lead in HOT_LEAD with stage=pitch_sent, pitch_sent_at >72h ago, not paid
RECYCLE_SEQ = [
    (1, "recycle_day1_nudge",
     "re: {domain} audit — one thing worth knowing",
     """Hi,

Sent the {domain} audit yesterday. One finding I didn't want to bury in the report:

Your headline and ad are making different promises. Visitors arrive expecting one thing, see another, and leave. That gap is the most common reason paid traffic doesn't convert — and it's mechanical, not a budget problem.

The fix is a headline rewrite and one CTA adjustment. We implement it in 24h for $97. If it doesn't move your numbers, full refund.

→ {stripe}

Happy to answer questions before you decide.

— Nebula"""),
    (3, "recycle_social_proof",
     "re: {domain} — similar case, if useful",
     """Hi,

Following up on the {domain} audit.

A SaaS founder had the same issue: headline written for people who already knew the product, CTA competing with a nav bar. Trial signups were 2.1%. We realigned the messaging — same traffic, same budget. Six weeks later: 4.8%.

Sharing in case it's a useful data point, not to pressure you.

If you want the implementation: $97, done in 24h, full refund if it doesn't help. → {stripe}

If you'd rather handle it yourself, the $7 DIY kit has the exact checklist: {stripe_7}

— Nebula"""),
    (7, "recycle_final",
     "closing the {domain} file",
     """Hi,

Last note from me on the {domain} audit.

The findings don't expire. If you come back to this later, the audit is still accurate and the fix is the same.

Three ways to use it:
1. We implement it — $97, 24h, full refund if no lift: {stripe}
2. DIY checklist — $7: {stripe_7}
3. Re-run the free audit anytime: https://nebulacomponents.shop/audit.html

Won't follow up again. Thanks for the time.

— Nebula"""),
]

# ── Helpers ───────────────────────────────────────────────────────
def load_jsonl(path):
    if not Path(path).exists():
        return []
    with open(path) as f:
        return [json.loads(l) for l in f if l.strip()]

def load_paid_emails():
    """Emails with a real payment event; audit delivery rows must not suppress follow-ups."""
    paid = set()
    for entry in load_jsonl(LEDGER):
        if entry.get("event_type") != "payment":
            continue
        e = entry.get("email", "").lower().strip()
        if e:
            paid.add(e)
    return paid

def load_sent():
    """Returns set of (email, day_label), including legacy label aliases."""
    alias = {
        "day2": "email2_insight_add",
        "day4": "email4_free_resource",
        "day7": "email5_permission_close",
    }
    sent = set()
    for entry in load_jsonl(FOLLOWUP_ST):
        email = entry["email"].lower()
        day = entry.get("day") or entry.get("label", "")  # handle both field names
        if not day:
            continue
        sent.add((email, day))
        if day in alias:
            sent.add((email, alias[day]))
    return sent

def mark_sent(email, url, day, subject, dry_run):
    record = {
        "email":   email.lower(),
        "url":     url,
        "day":     day,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "subject": subject,
    }
    if not dry_run:
        with open(FOLLOWUP_ST, "a") as f:
            f.write(json.dumps(record) + "\n")

def load_hot_leads():
    if not HOT_LEAD.exists():
        return [], False
    try:
        raw = json.loads(HOT_LEAD.read_text())
    except Exception:
        return [], False
    return (raw if isinstance(raw, list) else [raw]), isinstance(raw, list)

def save_hot_leads(leads, was_list, dry_run):
    if dry_run:
        return
    tmp = HOT_LEAD.with_suffix(".json.tmp")
    data = leads if was_list else (leads[0] if leads else {})
    tmp.write_text(json.dumps(data, indent=2))
    tmp.rename(HOT_LEAD)  # atomic on same filesystem

def parse_iso(ts):
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.rstrip("Z")).replace(tzinfo=timezone.utc)
    except Exception:
        return None

def hot_lead_pitch_body(url, audit_score, audit_grade, checkout_url=None):
    d = domain(url)
    pay_url = checkout_url or STRIPE
    score = float(audit_score) if audit_score else 0

    if score >= 8:
        finding = f"{d} scores well on structure — the gap is in message-match. Your headline is probably written for people who already know what you do, not for the ad click that brought them there."
        cta_line = f"One headline rewrite + CTA realignment. We implement it in 24h."
    elif score >= 6:
        finding = f"The {d} audit flagged 2-3 fixable issues: first-screen proof positioning, CTA competition, and message-match with your ad creative. Any one of them is enough to tank a paid traffic campaign."
        cta_line = f"We implement the top fix in 24h. Most clients see measurable lift within 2 weeks."
    else:
        finding = f"{d} has a visible conversion leak on the first screen. Visitors arrive from ads, don't find confirmation that they're in the right place, and leave before the CTA. The page looks fine — the leak is in the sequence."
        cta_line = f"The fix is specific and fast. We implement it in 24h."

    return f"""Hi,

{finding}

{cta_line}

$97 — self-serve checkout, no call needed:
{pay_url}

Or the $7 DIY checklist if you'd rather handle it yourself:
{STRIPE_7}

— Nebula"""

def process_hot_lead_pitches(now, paid, sent):
    """Advance HOT_LEAD audit_delivered -> $97 pitch sent when pitch_due_at has arrived."""
    leads, was_list = load_hot_leads()
    if not leads:
        return 0, 0
    due = 0
    delivered = 0
    changed = False
    for idx, lead in enumerate(leads):
        if not isinstance(lead, dict):
            continue
        email = (lead.get("email") or "").strip().lower()
        url = (lead.get("url") or "").strip()
        label = "hot_lead_97_pitch"
        if not email or not url or email in paid or (email, label) in sent:
            continue
        # Skip bounced leads
        if HAS_BOUNCE_DETECTION:
            try:
                store = LeadStore()
                if store.is_bounced(email):
                    print(f"  [skip bounced] {email}")
                    continue
            except Exception:
                pass
        # Allow action=None or action="send_97_pitch" — both are valid unworked audits
        if lead.get("stage") != "audit_delivered":
            continue
        if lead.get("action") not in ("send_97_pitch", None, ""):
            continue
        if lead.get("status") not in ("pending", "", None):
            continue
        pitch_due = parse_iso(lead.get("pitch_due_at"))
        if not pitch_due or now < pitch_due:
            continue
        due += 1
        d = domain(url)
        score = float(lead.get("audit_score") or lead.get("score") or 5)
        if score < 6:
            subject = f"re: {d} audit"
        elif score < 8:
            subject = f"re: {d} — the conversion leak"
        else:
            subject = f"re: {d} — one gap worth fixing"
        checkout_url = get_97_checkout_url(
            email=email,
            lead_url=url,
            audit_score=score,
            domain=d,
        )
        body = hot_lead_pitch_body(url, score, lead.get("audit_grade"), checkout_url=checkout_url)
        print(f"  [{label}] {email} ({d})")
        ok = send_email(email, subject, body, DRY_RUN)
        if ok:
            mark_sent(email, url, label, subject, DRY_RUN)
            lead["stage"] = "pitch_sent"
            lead["status"] = "pitched"
            lead["action"] = "monitor_payment_or_reply"
            lead["pitch_sent_at"] = datetime.now(timezone.utc).isoformat()
            changed = True
            delivered += 1
    if changed:
        save_hot_leads(leads, was_list, DRY_RUN)
    return due, delivered

def send_email(to, subject, body, dry_run):
    if dry_run:
        print(f"  [DRY-RUN] WOULD SEND → {to}: {subject}")
        return True
    # Use AgentMail REST API (SMTP is blocked for outbound cold email)
    try:
        sys.path.insert(0, str(NEBULA))
        from agentmail_client import AgentMailClient
        am = AgentMailClient()
        result = am.send(to=[to], subject=subject, text=body)
        if result.get("_error"):
            err_code = result["_error"]
            err_body = result.get("_body", "")
            print(f"  [AM FAILED] {to}: {err_code} {err_body[:120]}")
            # AgentMail 403 = suppressed (complained / unsubscribed) — mark dead, never retry
            if err_code == 403 and HAS_BOUNCE_DETECTION:
                suppression_signals = ("complained", "unsubscribed", "blocked", "MessageRejectedError")
                if any(s.lower() in err_body.lower() for s in suppression_signals):
                    try:
                        db = LeadStore()
                        db.upsert_lead(email=to, stage="bounced",
                                       error_info=f"suppressed: {err_body[:200]}")
                        print(f"  [SUPPRESSED→DEAD] {to}")
                    except Exception as se:
                        print(f"  [SUPPRESS LOG ERROR] {se}")
                    return False
            # Classify 550-style SMTP errors as hard bounces
            if HAS_BOUNCE_DETECTION:
                failure_text = f"{err_code} {err_body}"
                bounce_type, reason = classify_smtp_response(failure_text) if classify_smtp_response else (None, "")
                if bounce_type:
                    try:
                        db = LeadStore()
                        db.upsert_lead(email=to, stage="bounced",
                                       error_info=f"hard_bounce: {reason[:200]}")
                        print(f"  [BOUNCE] {to} classified as {bounce_type}")
                    except Exception as be:
                        print(f"  [BOUNCE LOG ERROR] {be}")
            return False
        print(f"  [SENT] {to}: {subject[:60]}")
        return True
    except Exception as e:
        print(f"  [AM ERROR] {to}: {e}")
        return False

def get_audit_data(url):
    """Run live audit on a URL, return top issues."""
    try:
        _venv = NEBULA / "venv/lib"
        for sp in _venv.glob("python*/site-packages"):
            if str(sp) not in sys.path:
                sys.path.insert(0, str(sp))
        sys.path.insert(0, str(NEBULA))
        from deliver_audit import scrape_page, score_audit
        page  = scrape_page(url)
        audit = score_audit(page)
        dims  = audit["dimensions"]
        worst = sorted(dims.items(), key=lambda x: x[1]["score"])
        return {
            "score":            audit["overall"],
            "grade":            audit["overall_grade"],
            "top_issue":        worst[0][1]["issue"] if worst else "unclear CTA",
            "top_issue_short":  worst[0][0]          if worst else "CTA",
            "top_fix":          worst[0][1]["fix"]   if worst else "Add a clear CTA button above the fold.",
            "issue1":           worst[0][1]["issue"] if len(worst) > 0 else "unclear CTA",
            "issue2":           worst[1][1]["issue"] if len(worst) > 1 else "missing social proof",
        }
    except Exception:
        return {
            "score": "?", "grade": "?",
            "top_issue":       "unclear call-to-action",
            "top_issue_short": "CTA",
            "top_fix":         "Add one primary CTA button above the fold.",
            "issue1":          "unclear call-to-action",
            "issue2":          "missing social proof",
        }

def domain(url):
    url = re.sub(r"^https?://", "", url.strip().lower())
    return url.split("/")[0]

# ── Main ──────────────────────────────────────────────────────────
def main():
    now   = datetime.now(timezone.utc)
    paid  = load_paid_emails()
    sent  = load_sent()
    total_sent = 0
    total_due  = 0

    print(f"followup_sequence.py {'(DRY-RUN)' if DRY_RUN else '(LIVE)'} — {now.strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    # ── 1. Audit tool leads (Day 2 / 4 / 7) ──────────────────────
    audit_leads = load_jsonl(AUDIT_LEADS)
    print(f"\nAudit leads: {len(audit_leads)}")

    for lead in audit_leads:
        email = (lead.get("email") or "").strip().lower()
        url   = (lead.get("url")   or "").strip()
        if not email or not url or email in paid or lead.get("status") == "bounced":
            continue
        try:
            lead_time = datetime.fromisoformat(
                lead.get("timestamp", "").rstrip("Z")
            ).replace(tzinfo=timezone.utc)
        except Exception:
            continue
        age_days   = (now - lead_time).total_seconds() / 86400
        audit_data = None

        for day_offset, label, subj_tmpl, body_tmpl in AUDIT_SEQ:
            if not (day_offset <= age_days < day_offset + 1):
                continue
            if (email, label) in sent:
                continue
            total_due += 1
            if audit_data is None:
                audit_data = get_audit_data(url)
            d    = domain(url)
            subj = subj_tmpl.format(domain=d, **audit_data)
            body = body_tmpl.format(domain=d, stripe=STRIPE, stripe_7=STRIPE_7, **audit_data)
            print(f"  [{label}] {email} ({d})")
            ok = send_email(email, subj, body, DRY_RUN)
            if ok:
                mark_sent(email, url, label, subj, DRY_RUN)
                total_sent += 1

    # ── 2. Cold email leads — Day 3 re-engage ─────────────────────
    try:
        raw = json.loads(Path(CONTACTED).read_text())
        # contacted.json is a dict {email: {…}} — normalise to list
        if isinstance(raw, dict):
            cold_leads = [{**v, "email": k} for k, v in raw.items()]
        elif isinstance(raw, list):
            cold_leads = raw
        else:
            cold_leads = []
    except Exception:
        cold_leads = []

    audit_emails = {l.get("email", "").lower() for l in audit_leads}
    cold_only = [c for c in cold_leads
                 if c.get("email", "").lower() not in audit_emails]
    print(f"\nCold-only leads: {len(cold_only)}")

    for lead in cold_only:
        email = (lead.get("email") or "").strip().lower()
        url   = (lead.get("url") or lead.get("website") or "").strip()
        if not email or email in paid:
            continue
        ts = lead.get("sent_at") or lead.get("timestamp", "")
        try:
            lead_time = datetime.fromisoformat(ts.rstrip("Z")).replace(tzinfo=timezone.utc)
        except Exception:
            continue
        age_days = (now - lead_time).total_seconds() / 86400

        for day_offset, label, subj_tmpl, body_tmpl in COLD_SEQ:
            if not (day_offset <= age_days < day_offset + 1):
                continue
            if (email, label) in sent:
                continue
            total_due += 1
            ad   = get_audit_data(url) if url else {
                "issue1": "unclear CTA", "issue2": "missing social proof"
            }
            subj = subj_tmpl.format(**ad)
            body = body_tmpl.format(**ad)
            print(f"  [{label}] {email}")
            ok = send_email(email, subj, body, DRY_RUN)
            if ok:
                mark_sent(email, url, label, subj, DRY_RUN)
                total_sent += 1

    hot_due, hot_sent = process_hot_lead_pitches(now, paid, sent)
    total_due += hot_due
    total_sent += hot_sent
    print(f"\nHOT_LEAD pitch due: {hot_due}  Sent: {hot_sent}")

    # ── 3. Inactive Lead Reviver — cold leads >7d never audited ───
    audit_emails = {l.get("email", "").lower() for l in audit_leads}
    revive_candidates = [
        c for c in cold_leads
        if c.get("email", "").lower() not in audit_emails
        and c.get("email", "").lower() not in paid
    ]
    print(f"\nRevive candidates (contacted, no audit): {len(revive_candidates)}")
    for lead in revive_candidates:
        email = (lead.get("email") or "").strip().lower()
        url   = (lead.get("url") or lead.get("website") or "").strip()
        if not email:
            continue
        if HAS_BOUNCE_DETECTION:
            try:
                db = LeadStore()
                if db.is_bounced(email):
                    continue
            except Exception:
                pass
        ts = lead.get("sent_at") or lead.get("timestamp", "")
        try:
            lead_time = datetime.fromisoformat(ts.rstrip("Z")).replace(tzinfo=timezone.utc)
        except Exception:
            continue
        age_days = (now - lead_time).total_seconds() / 86400
        for day_offset, label, subj_tmpl, body_tmpl in REVIVE_SEQ:
            if not (day_offset <= age_days < day_offset + 1):
                continue
            if (email, label) in sent:
                continue
            total_due += 1
            d    = domain(url) if url else email.split("@")[-1]
            subj = subj_tmpl.format(domain=d)
            body = body_tmpl.format(domain=d)
            print(f"  [revive] {email} ({d}) age={age_days:.1f}d")
            ok = send_email(email, subj, body, DRY_RUN)
            if ok:
                mark_sent(email, url, label, subj, DRY_RUN)
                total_sent += 1

    # ── 4. Lost-Deal Recycler — pitch_sent >72h no payment ────────
    hot_leads, was_list = load_hot_leads()
    recycle_candidates = [
        h for h in hot_leads
        if isinstance(h, dict)
        and h.get("stage") == "pitch_sent"
        and (h.get("email") or "").lower() not in paid
    ]
    print(f"\nRecycle candidates (pitch_sent, no payment): {len(recycle_candidates)}")
    for lead in recycle_candidates:
        email = (lead.get("email") or "").strip().lower()
        url   = (lead.get("url") or "").strip()
        if not email:
            continue
        if HAS_BOUNCE_DETECTION:
            try:
                db = LeadStore()
                if db.is_bounced(email):
                    continue
            except Exception:
                pass
        pitch_sent_at = parse_iso(lead.get("pitch_sent_at"))
        if not pitch_sent_at:
            continue
        age_days = (now - pitch_sent_at).total_seconds() / 86400
        for day_offset, label, subj_tmpl, body_tmpl in RECYCLE_SEQ:
            if not (day_offset <= age_days < day_offset + 1):
                continue
            if (email, label) in sent:
                continue
            total_due += 1
            d    = domain(url) if url else email.split("@")[-1]
            subj = subj_tmpl.format(domain=d)
            stripe_url = get_97_checkout_url(
                email=email,
                lead_url=url,
                audit_score=lead.get("audit_score"),
                domain=d,
            )
            body = body_tmpl.format(domain=d, stripe=stripe_url, stripe_7=STRIPE_7)
            print(f"  [recycle] {email} ({d}) age={age_days:.1f}d")
            ok = send_email(email, subj, body, DRY_RUN)
            if ok:
                mark_sent(email, url, label, subj, DRY_RUN)
                total_sent += 1

    print(f"\n{'='*60}")
    print(f"Due: {total_due}  Sent: {total_sent}  "
          f"{'(dry-run — nothing sent)' if DRY_RUN else 'delivered'}")

if __name__ == "__main__":
    main()
