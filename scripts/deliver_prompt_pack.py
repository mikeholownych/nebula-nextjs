#!/usr/bin/env python3
"""Deliver the full AI prompt pack to a paying customer.

Triggered by the Stripe webhook (customer-portal/app/api/webhooks/stripe/route.ts)
the moment a real checkout.session.completed event lands for the Fix Pack offer.

The paid offer is: full 7-point audit + a complete set of AI prompts (one per
weak dimension) tailored to the customer's actual page, for them to run
through Claude/ChatGPT/their own developer. This script is what makes that
claim true rather than just copy — it re-scrapes the real page, regenerates
the full pack (audit_pipeline.prompts.generator.build_prompt_pack — the same
generator that already produces the free teaser prompt), and emails it.

Usage: venv/bin/python3 scripts/deliver_prompt_pack.py \
  --email buyer@example.com --stripe-session-id cs_live_...
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

NEBULA_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(NEBULA_DIR))

from deliver_audit import scrape_page, score_audit, send_via_agentmail, HOT_LEAD_PATH  # noqa: E402
from audit_pipeline.prompts.generator import build_prompt_pack, generate_prompt_pack_text  # noqa: E402

LEDGER_FILE = NEBULA_DIR / "ledgers" / "customer-ledger.jsonl"
TELEGRAM_TARGET = "telegram:5920497760"


def log(msg):
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", flush=True)


def telegram_notify(message):
    try:
        subprocess.run(["hermes", "send", "--to", TELEGRAM_TARGET, message], capture_output=True, timeout=15)
    except Exception as e:
        log(f"telegram notify failed: {e}")


def load_ledger_rows():
    if not LEDGER_FILE.exists():
        return []
    rows = []
    for line in LEDGER_FILE.read_text().splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def already_delivered(stripe_session_id, rows):
    return any(
        r.get("event_type") == "prompt_pack_delivered"
        and r.get("stripe_session_id") == stripe_session_id
        for r in rows
    )


def delivery_client_id(stripe_session_id):
    return f"fix-pack:{stripe_session_id}"


def find_audited_url(email, rows):
    """Most recent audit_delivered ledger row for this email — that's the
    page the customer actually asked us to look at."""
    matches = [
        r for r in rows
        if r.get("event_type") == "audit_delivered" and (r.get("email") or "").lower() == email.lower()
    ]
    if not matches:
        return None
    matches.sort(key=lambda r: r.get("timestamp") or "")
    return matches[-1].get("url")


def append_ledger(entry):
    LEDGER_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LEDGER_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


def update_hot_lead_stage(email, url):
    try:
        existing = json.loads(HOT_LEAD_PATH.read_text()) if HOT_LEAD_PATH.exists() else []
    except json.JSONDecodeError:
        existing = []
    leads = existing if isinstance(existing, list) else [existing]
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    matched = False
    for lead in leads:
        if isinstance(lead, dict) and (lead.get("email") or "").lower() == email.lower():
            lead["stage"] = "prompt_pack_delivered"
            lead["status"] = "fulfilled"
            lead["action"] = "monitor_reply"
            lead["fulfilled_at"] = now
            matched = True
    if not matched:
        leads.append({
            "email": email, "url": url, "stage": "prompt_pack_delivered",
            "status": "fulfilled", "action": "monitor_reply", "fulfilled_at": now,
        })
    tmp = HOT_LEAD_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(leads, indent=2))
    tmp.rename(HOT_LEAD_PATH)  # atomic on same filesystem


def compose_email(url, pack, audit):
    all_prompts = ([pack["teaser"]] if pack["teaser"] else []) + pack["full_pack"]
    body = generate_prompt_pack_text(all_prompts)
    intro = (
        f"Here's your full prompt pack for {url}.\n\n"
        f"Overall score: {audit.get('overall')}/10 ({audit.get('overall_grade')})\n\n"
        f"Paste each prompt below into Claude, ChatGPT, or Gemini (or hand this "
        f"to your developer) — each one is built from what we actually found on "
        f"your page, not a generic template.\n\n"
        f"{'=' * 40}\n\n"
    )
    subject = f"Your prompt pack — {len(all_prompts)} fixes for {url}"
    return subject, intro + body


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--stripe-session-id", required=True)
    args = parser.parse_args()
    email = args.email.strip().lower()
    stripe_session_id = args.stripe_session_id.strip()
    if not stripe_session_id:
        log("stripe session ID is required for idempotent delivery")
        return 1

    rows = load_ledger_rows()
    if already_delivered(stripe_session_id, rows):
        log(f"{stripe_session_id} already has a prompt_pack_delivered record — skipping (idempotent)")
        return 0

    try:
        from lead_store import LeadStore
        bounced = LeadStore().is_bounced(email)
    except Exception as e:
        log(f"bounce check failed, refusing to send: {e}")
        telegram_notify(f"⚠️ Prompt pack delivery blocked — bounce check failed for {email}: {e}")
        return 1
    if bounced:
        log(f"{email} is bounced — refusing to send")
        telegram_notify(f"⚠️ Prompt pack purchase from {email}, but that address is on the bounce list. Needs manual follow-up.")
        return 1

    url = find_audited_url(email, rows)
    if not url:
        log(f"no prior audit_delivered record found for {email} — cannot determine which page to build the pack for")
        telegram_notify(
            f"⚠️ Prompt pack purchase from {email}, but no prior free-audit record exists for that "
            f"email — can't tell which page to build it for. Needs manual follow-up."
        )
        return 1

    log(f"building full prompt pack for {email} ({url})")
    try:
        page = scrape_page(url)
        audit = score_audit(page)
        pack = build_prompt_pack(audit, page, email=email, stated_goal="conversions")
    except Exception as e:
        log(f"failed to build prompt pack: {e}")
        telegram_notify(f"⚠️ Prompt pack purchase from {email} ({url}) — pack generation failed: {e}. Needs manual follow-up.")
        return 1

    if pack["count"] == 0:
        # Page scores well across the board — nothing below the 7/10 threshold
        # to generate a prompt for. Real edge case, needs a human, not a silent no-op.
        log(f"{email}: page scored too well to generate any prompts (count=0)")
        telegram_notify(
            f"⚠️ Prompt pack purchase from {email} ({url}) — the page now scores well enough "
            f"that no prompts qualify (all dimensions >= 7/10). Needs a manual response, not an empty email."
        )
        return 1

    subject, body = compose_email(url, pack, audit)
    sent = send_via_agentmail(
        to=email,
        subject=subject,
        body=body,
        client_id=delivery_client_id(stripe_session_id),
    )
    if not sent.get("ok"):
        log(f"send failed: {sent}")
        telegram_notify(f"⚠️ Prompt pack purchase from {email} ({url}) — send failed: {sent.get('error')}. Needs manual follow-up.")
        return 1

    append_ledger({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "event_type": "prompt_pack_delivered",
        "stripe_session_id": stripe_session_id,
        "email": email,
        "url": url,
        "prompt_count": pack["count"],
        "message_id": sent.get("message_id"),
    })
    update_hot_lead_stage(email, url)
    log(f"delivered {pack['count']} prompts to {email} for {url}")
    telegram_notify(f"✅ Prompt pack delivered — {email} ({url}), {pack['count']} prompts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
