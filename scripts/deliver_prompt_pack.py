#!/usr/bin/env python3
"""Deliver one tailored repair sprint to a paying customer.

Triggered by the Stripe webhook (customer-portal/app/api/webhooks/stripe/route.ts)
the moment a real checkout.session.completed event lands for the Fix Pack offer.

The paid offer is one customer-implemented copy, code, or configuration change
for the highest-impact failing signal. The script re-resolves the exact paid
audit from stored engine findings, generates the implementation kit from that
payload, and emails it. It does not re-scrape or re-score the live page.

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

from deliver_audit import send_via_agentmail, HOT_LEAD_PATH  # noqa: E402
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


def fetch_stored_audit(audit_id):
    """Return the completed audit payload already stored by the engine."""
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
    return audit


def fetch_audited_url(audit_id, _email):
    """Resolve the exact completed audit URL from the platform authority."""
    audit = fetch_stored_audit(audit_id)
    if not audit:
        return None
    url = audit.get("url")
    return url if isinstance(url, str) and url.startswith(("http://", "https://")) else None


_FINDING_KEY_MAP = (
    ("headline", "headline"),
    ("h1", "headline"),
    ("cta", "cta"),
    ("contrast", "cta"),
    ("social", "social_proof"),
    ("proof", "social_proof"),
    ("speed", "load_speed"),
    ("load", "load_speed"),
    ("mobile", "mobile"),
    ("viewport", "mobile"),
    ("fold", "above_fold"),
    ("ad_", "ad_signals"),
    ("tracking", "ad_signals"),
    ("seo", "seo_foundations"),
    ("schema", "seo_foundations"),
    ("ai_", "ai_readiness"),
    ("citation", "ai_readiness"),
)


def _dimension_key(finding_key):
    from audit_pipeline.prompts.generator import TEMPLATE_MAP

    key = (finding_key or "").lower()
    if key in TEMPLATE_MAP:
        return key
    for needle, mapped in _FINDING_KEY_MAP:
        if needle in key:
            return mapped
    return None


def audit_from_stored(stored):
    """Build the pack generator's audit shape from stored findings, not a live re-score."""
    findings = stored.get("findings") or []
    if not isinstance(findings, list):
        findings = []
    dimensions = {}
    for finding in findings:
        if not isinstance(finding, dict):
            continue
        dim_key = _dimension_key(str(finding.get("key") or ""))
        if not dim_key or dim_key in dimensions:
            continue
        try:
            impact = float(finding.get("impact") or 8)
        except (TypeError, ValueError):
            impact = 8
        dimensions[dim_key] = {
            "score": max(0, min(10, 10 - impact)),
            "issue": finding.get("issue") or finding.get("label") or "",
            "fix": finding.get("fix") or "",
        }
    return {
        "overall": stored.get("score") or stored.get("composite") or 0,
        "overall_grade": stored.get("grade") or "N/A",
        "dimensions": dimensions,
        "findings": findings,
    }


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


def _md_to_html(md: str) -> str:
    """Convert the prompt markdown to styled HTML for the email body.

    Handles the subset of markdown the LLM generator actually produces:
    headings, bold, code blocks (fenced), inline code, bullet lists,
    horizontal rules, and plain paragraphs.
    """
    import re
    lines = md.split("\n")
    out = []
    in_code = False
    in_ul = False

    def flush_ul():
        nonlocal in_ul
        if in_ul:
            out.append("</ul>")
            in_ul = False

    def escape(s):
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    def inline_fmt(s):
        # Bold **text**
        s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
        # Inline code `text`
        s = re.sub(
            r"`([^`]+)`",
            r'<code style="background:#1a2530;color:#00c2a0;padding:2px 6px;'
            r'border-radius:3px;font-family:monospace;font-size:13px;">\1</code>',
            s,
        )
        return s

    for line in lines:
        # Fenced code block toggle
        if line.strip().startswith("```"):
            flush_ul()
            if not in_code:
                in_code = True
                out.append(
                    '<pre style="background:#0f1923;color:#e2e8f0;padding:16px 20px;'
                    'border-radius:8px;border-left:3px solid #00c2a0;overflow-x:auto;'
                    'font-family:\'Courier New\',monospace;font-size:13px;line-height:1.6;'
                    'margin:16px 0;white-space:pre-wrap;word-break:break-word;">'
                )
            else:
                in_code = False
                out.append("</pre>")
            continue

        if in_code:
            out.append(escape(line))
            continue

        stripped = line.strip()

        # Horizontal rule
        if re.match(r"^[-=]{3,}$", stripped):
            flush_ul()
            out.append('<hr style="border:none;border-top:1px solid #1e3040;margin:24px 0;">')
            continue

        # Headings
        m = re.match(r"^(#{1,4})\s+(.*)", stripped)
        if m:
            flush_ul()
            level = len(m.group(1))
            text = inline_fmt(escape(m.group(2)))
            sizes = {1: "22px", 2: "18px", 3: "15px", 4: "14px"}
            mt = "28px" if level <= 2 else "20px"
            out.append(
                f'<h{level} style="color:#e2e8f0;font-size:{sizes[level]};'
                f'font-weight:700;margin:{mt} 0 8px;line-height:1.3;">'
                f"{text}</h{level}>"
            )
            continue

        # Bullet list item
        if re.match(r"^[-*]\s+", stripped):
            if not in_ul:
                in_ul = True
                out.append('<ul style="margin:8px 0 8px 0;padding-left:20px;color:#94a3b8;">')
            text = inline_fmt(escape(re.sub(r"^[-*]\s+", "", stripped)))
            out.append(
                f'<li style="margin:4px 0;font-size:14px;line-height:1.6;">{text}</li>'
            )
            continue

        flush_ul()

        # Blank line → spacer
        if not stripped:
            out.append('<div style="height:8px;"></div>')
            continue

        # Plain paragraph
        text = inline_fmt(escape(stripped))
        out.append(
            f'<p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#94a3b8;">{text}</p>'
        )

    flush_ul()
    if in_code:
        out.append("</pre>")

    return "\n".join(out)


def compose_email(url, pack, audit):
    teaser = pack["teaser"] if pack else None

    # ── Fallback: kit generation failed ──────────────────────────────────────
    if not teaser:
        subject = "Your One-Leak Repair Sprint"
        body = (
            f"Here's your One-Leak Repair Sprint for {url}.\n\n"
            "We could not generate a kit for this audit. You will be contacted "
            "shortly with a manual fix.\n"
        )
        html = _kit_html(url, audit, "Kit unavailable", body, "", fallback=True)
        return subject, body, html

    selected_label = teaser.get("label") or teaser.get("title") or "highest-impact finding"
    prompt_md = teaser.get("prompt_md", "")
    generated_note = "" if pack.get("llm_generated") else (
        "\n\nNote: prompt generation was unavailable. This is the standard template "
        "filled with your real page context.\n"
    )
    prompt_md_full = prompt_md + generated_note

    intro = (
        f"Here's your One-Leak Repair Sprint for {url}.\n\n"
        f"Overall score: {audit.get('overall')}/10 ({audit.get('overall_grade')})\n\n"
        f"Selected finding: {selected_label}.\n\n"
        f"Run the prompt below in your terminal agent (Claude Code, Cursor, "
        f"Codex, or any coding agent with terminal + file access in your "
        f"repository). It is already filled in with what the audit found on "
        f"your page - your real headline, real CTA, real platform - and it "
        f"tells the agent exactly what to change, which files to touch, and "
        f"how to verify the fix. Where a fact can only come from you (a real "
        f"customer name, an exact review count), the agent will ask for it "
        f"before proceeding.\n\n"
        f"Run the same audit again within 30 days to verify the condition "
        f"changed. This does not guarantee conversion lift.\n\n"
        f"{'=' * 40}\n\n"
    )
    body = intro + prompt_md_full
    subject = f"Your One-Leak Repair Sprint - {selected_label}"
    html = _kit_html(url, audit, selected_label, intro, prompt_md_full)
    return subject, body, html


def _kit_html(url, audit, selected_label, intro_text, prompt_md, fallback=False):
    """Build the full HTML email for the kit delivery."""
    from urllib.parse import urlparse
    domain = urlparse(url).netloc or url
    score = audit.get("overall", "?")
    grade = audit.get("overall_grade", "?")
    audit_url = f"https://nebulacomponents.com/audit"

    # Score badge colour
    try:
        score_num = float(score)
        badge_color = "#22c55e" if score_num >= 7 else "#f59e0b" if score_num >= 5 else "#ef4444"
    except (ValueError, TypeError):
        badge_color = "#94a3b8"

    prompt_html = _md_to_html(prompt_md) if not fallback else (
        f'<p style="color:#94a3b8;font-size:14px;">{intro_text}</p>'
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your One-Leak Repair Sprint</title>
</head>
<body style="margin:0;padding:0;background:#0a0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f14;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="padding:0 0 24px;">
    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00c2a0;">
      Nebula Components
    </p>
  </td></tr>

  <!-- Hero -->
  <tr><td style="background:#0f1923;border-radius:12px;padding:28px 28px 24px;border:1px solid #1e3040;margin-bottom:20px;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#00c2a0;">
      One-Leak Repair Sprint
    </p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#e2e8f0;line-height:1.3;">
      {selected_label}
    </h1>
    <p style="margin:0;font-size:14px;color:#64748b;">
      {domain}
    </p>
  </td></tr>

  <tr><td style="height:16px;"></td></tr>

  <!-- Score card -->
  <tr><td style="background:#0f1923;border-radius:10px;padding:20px 24px;border:1px solid #1e3040;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#475569;">Audit Score</p>
          <p style="margin:0;font-size:32px;font-weight:800;color:{badge_color};line-height:1;">{score}<span style="font-size:16px;color:#475569;font-weight:400;">/10</span></p>
        </td>
        <td style="width:1px;background:#1e3040;margin:0 20px;"></td>
        <td style="padding-left:24px;">
          <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#475569;">Grade</p>
          <p style="margin:0;font-size:32px;font-weight:800;color:{badge_color};line-height:1;">{grade}</p>
        </td>
        <td style="padding-left:24px;">
          <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#475569;">Selected Finding</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">{selected_label}</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="height:20px;"></td></tr>

  <!-- Intro -->
  <tr><td style="padding:0 4px;">
    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#94a3b8;">
      The prompt below is ready to run in your terminal agent - <strong style="color:#e2e8f0;">Claude Code, Cursor, Codex</strong>, or any agent with terminal + file access in your repository.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#94a3b8;">
      It is already filled in with your real page data - headline, CTA text, platform. Where only you know the answer (a real customer name, exact review count), the agent will ask before proceeding.
    </p>
    <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#475569;">
      Run the free re-audit within 30 days to verify the fix held. This does not guarantee conversion lift.
    </p>
  </td></tr>

  <tr><td style="height:24px;"></td></tr>

  <!-- Divider with label -->
  <tr><td style="padding:0 4px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-top:1px solid #1e3040;"></td>
        <td style="white-space:nowrap;padding:0 12px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00c2a0;">Your Implementation Prompt</td>
        <td style="border-top:1px solid #1e3040;"></td>
      </tr>
    </table>
  </td></tr>

  <!-- Prompt content -->
  <tr><td style="background:#0a0f14;border-radius:10px;padding:24px;border:1px solid #1e3040;">
    {prompt_html}
  </td></tr>

  <tr><td style="height:28px;"></td></tr>

  <!-- Re-audit CTA -->
  <tr><td align="center" style="padding:28px 24px;background:#0f1923;border-radius:10px;border:1px solid #00c2a0;border-opacity:.3;">
    <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#e2e8f0;">Verify the fix held</p>
    <p style="margin:0 0 20px;font-size:13px;color:#64748b;">
      Once you've applied the change, run the free re-audit on the same URL.<br>Your 30-day window is included.
    </p>
    <a href="{audit_url}"
       style="display:inline-block;background:#00c2a0;color:#0a0f14;text-decoration:none;
              font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;letter-spacing:.02em;">
      Run Re-Audit →
    </a>
  </td></tr>

  <tr><td style="height:32px;"></td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid #1e3040;padding-top:24px;">
    <p style="margin:0 0 6px;font-size:12px;color:#334155;">
      <strong style="color:#475569;">Nebula Components</strong> &nbsp;·&nbsp;
      <a href="https://nebulacomponents.com" style="color:#00c2a0;text-decoration:none;">nebulacomponents.com</a>
    </p>
    <p style="margin:0;font-size:11px;color:#1e3040;line-height:1.6;">
      Questions about your kit? Reply to this email - we respond within one business day.<br>
      This is a one-time transactional email for your $97 One-Leak Repair Sprint purchase.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""



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
        log(f"{stripe_session_id} already has a kit delivery record - skipping (idempotent)")
        return 0

    try:
        from lead_store import LeadStore
        bounced = LeadStore().is_bounced(email)
    except Exception as e:
        log(f"bounce check failed, refusing to send: {e}")
        telegram_notify(f"⚠️ Prompt pack delivery blocked - bounce check failed for {email}: {e}")
        return 1
    if bounced:
        log(f"{email} is bounced - refusing to send")
        telegram_notify(f"⚠️ Prompt pack purchase from {email}, but that address is on the bounce list. Needs manual follow-up.")
        return 1

    try:
        stored = fetch_stored_audit(audit_id)
    except Exception as e:
        log(f"exact audit lookup failed for {audit_id}: {e}")
        stored = None
    url = stored.get("url") if isinstance(stored, dict) else None
    if not stored or not isinstance(url, str) or not url.startswith(("http://", "https://")):
        log(f"exact completed audit {audit_id} could not be resolved for {email}")
        telegram_notify(
            f"⚠️ Prompt pack purchase from {email}, but exact audit {audit_id} could not be "
            f"resolved - refusing to guess a page. Needs manual follow-up."
        )
        return 1

    log(f"building repair sprint for {email} ({url})")
    audit = audit_from_stored(stored)
    page = {
        "url": url,
        "title": stored.get("page_title") or stored.get("title") or "",
        "h1": stored.get("page_h1") or stored.get("h1") or "",
    }
    try:
        pack = generate_real_pack(audit, page, email=email, stated_goal="conversions")
    except Exception as e:
        log(f"failed to build prompt pack from stored findings: {e}")
        telegram_notify(
            f"⚠️ Prompt pack purchase from {email} ({url}) - pack generation failed: {e}. Needs manual follow-up."
        )
        return 1
    if not pack or not pack.get("teaser"):
        log("pack generation produced no teaser - refusing to mark delivered")
        telegram_notify(
            f"⚠️ Prompt pack purchase from {email} ({url}) - pack generation produced no teaser. Needs manual follow-up."
        )
        return 1

    subject, body, html = compose_email(url, pack, audit)
    sent = send_via_agentmail(
        to=email,
        subject=subject,
        body=body,
        html=html,
        client_id=delivery_client_id(stripe_session_id),
    )
    if not sent.get("ok"):
        log(f"send failed: {sent}")
        telegram_notify(f"⚠️ Prompt pack purchase from {email} ({url}) - send failed: {sent.get('error')}. Needs manual follow-up.")
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
    log(f"delivered repair sprint to {email} for {url}")
    telegram_notify(f"✅ repair sprint delivered - {email} ({url})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
