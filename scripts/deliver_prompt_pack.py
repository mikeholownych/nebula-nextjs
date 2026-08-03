#!/usr/bin/env python3
"""Deliver one tailored self-implementation kit to a paying customer.

Triggered by the Stripe webhook (customer-portal/app/api/webhooks/stripe/route.ts)
the moment a real checkout.session.completed event lands for the Fix Pack offer.

The paid offer is one customer-implemented copy, code, or configuration change
for the highest-impact failing signal. The script re-resolves the exact paid
audit, re-scrapes its URL, generates candidate artifacts, selects the worst
scoring signal, and emails that one bounded implementation kit.

Usage: venv/bin/python3 scripts/deliver_prompt_pack.py \
  --email buyer@example.com --stripe-session-id cs_live_... \
  --audit-id 123e4567-e89b-12d3-a456-426614174000
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
from audit_pipeline.prompts.real_generator import generate_real_pack  # noqa: E402

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
        r.get("event_type") in {"implementation_kit_delivered", "prompt_pack_delivered"}
        and r.get("stripe_session_id") == stripe_session_id
        for r in rows
    )


def delivery_client_id(stripe_session_id):
    return f"fix-pack:{stripe_session_id}"


def find_audited_url(audit_id, email, rows):
    """Return only the URL bound to this exact audit and customer."""
    matches = [
        r for r in rows
        if r.get("event_type") == "audit_delivered"
        and r.get("audit_id") == audit_id
        and (r.get("email") or "").lower() == email.lower()
    ]
    return matches[0].get("url") if len(matches) == 1 else None


def fetch_audited_url(audit_id, _email):
    """Resolve the exact completed audit from the platform authority."""
    import os
    import requests

    base_url = os.environ.get("PLATFORM_API_URL", "http://127.0.0.1:8001").rstrip("/")
    response = requests.get(f"{base_url}/audit/{audit_id}", timeout=10)
    if response.status_code != 200:
        return None
    audit = response.json()
    if (
        audit.get("audit_id") != audit_id
        or audit.get("status") != "completed"
    ):
        return None
    url = audit.get("url")
    return url if isinstance(url, str) and url.startswith(("http://", "https://")) else None


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
            lead["stage"] = "implementation_kit_delivered"
            lead["status"] = "fulfilled"
            lead["action"] = "monitor_reply"
            lead["fulfilled_at"] = now
            matched = True
    if not matched:
        leads.append({
            "email": email, "url": url, "stage": "implementation_kit_delivered",
            "status": "fulfilled", "action": "monitor_reply", "fulfilled_at": now,
        })
    tmp = HOT_LEAD_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(leads, indent=2))
    tmp.rename(HOT_LEAD_PATH)  # atomic on same filesystem


def compose_email(url, pack, audit):
    teaser = pack["teaser"] if pack else None
    if not teaser:
        return "Your One-Leak Self-Implementation Kit", (
            f"Here's your One-Leak Self-Implementation Kit for {url}.\n\n"
            "We could not generate a kit for this audit. You will be contacted "
            "shortly with a manual fix.\n"
        )

    selected_label = teaser.get("label") or teaser.get("title") or "highest-impact finding"
    prompt_md = teaser.get("prompt_md", "")
    generated_note = "" if pack.get("llm_generated") else (
        "\n\nNote: prompt generation was unavailable, so this is the standard "
        "template. It still contains the real page context above the blanks.\n"
    )

    intro = (
        f"Here's your One-Leak Self-Implementation Kit for {url}.\n\n"
        f"Overall score: {audit.get('overall')}/10 ({audit.get('overall_grade')})\n\n"
        f"Selected finding: {selected_label}.\n\n"
        f"Run the prompt below in your terminal agent (Claude Code, Cursor, "
        f"Codex, or any coding agent with terminal + file access in your "
        f"repository). It is already filled in with what the audit found on "
        f"your page — your real headline, real CTA, real platform — and it "
        f"tells the agent exactly what to change, which files to touch, and "
        f"how to verify the fix. Where a fact can only come from you (a real "
        f"customer name, an exact review count), the agent will ask for it "
        f"before proceeding.\n\n"
        f"Run the same audit again within 30 days to verify the condition "
        f"changed. This does not guarantee conversion lift.\n\n"
        f"{'=' * 40}\n\n"
    )
    body = intro + prompt_md + generated_note
    subject = f"Your One-Leak Self-Implementation Kit — {selected_label}"
    return subject, body


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--stripe-session-id", required=True)
    parser.add_argument("--audit-id", required=True)
    args = parser.parse_args()
    email = args.email.strip().lower()
    stripe_session_id = args.stripe_session_id.strip()
    audit_id = args.audit_id.strip()
    if not stripe_session_id:
        log("stripe session ID is required for idempotent delivery")
        return 1

    rows = load_ledger_rows()
    if already_delivered(stripe_session_id, rows):
        log(f"{stripe_session_id} already has a kit delivery record — skipping (idempotent)")
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

    try:
        url = fetch_audited_url(audit_id, email)
    except Exception as e:
        log(f"exact audit lookup failed for {audit_id}: {e}")
        url = None
    if not url:
        log(f"exact completed audit {audit_id} could not be resolved for {email}")
        telegram_notify(
            f"⚠️ Prompt pack purchase from {email}, but exact audit {audit_id} could not be "
            f"resolved — refusing to guess a page. Needs manual follow-up."
        )
        return 1

    log(f"building self-implementation kit for {email} ({url})")
    try:
        page = scrape_page(url)
        audit = score_audit(page)
        pack = generate_real_pack(audit, page, email=email, stated_goal="conversions")
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
        "event_type": "implementation_kit_delivered",
        "stripe_session_id": stripe_session_id,
        "audit_id": audit_id,
        "email": email,
        "url": url,
        "finding_count": 1,
        "selected_finding": pack["teaser"].get("key") if pack["teaser"] else None,
        "message_id": sent.get("message_id"),
    })
    update_hot_lead_stage(email, url)
    log(f"delivered self-implementation kit to {email} for {url}")
    telegram_notify(f"✅ Self-implementation kit delivered — {email} ({url})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
