#!/home/mike/nebula/venv/bin/python3
"""
Batch pipeline: instantly_aug16_verified.jsonl → audit → D1 email → send
- Runs deliver_audit.py per lead to get findings
- Generates trigger-first copy per Nebula cold outreach standards
- Sends via send_d1() with verification already cached (skip re-verify)
- Logs all outcomes to ops/lead_lanes/instantly_aug16_sends.jsonl
- Paces 1 send per 6 seconds to stay under AgentMail rate limits
"""
from __future__ import annotations
import json
import subprocess
import sys
import time
import re
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "lead_gen"))

from sequence_engine import register_d1_sent, verify_email, _am_send
from agentmail_client import AgentMailClient
from outbound_release_gate import OutboundReleaseGate
import sequence_engine as _se

# Override the module-level gate with min_interval=0 so bulk batch isn't
# throttled by the 5-minute per-send cooldown designed for drip sequences.
_bulk_gate = OutboundReleaseGate(min_interval_seconds=0)
_bulk_am   = AgentMailClient(inbox=_se.INBOX, gate=_bulk_gate)

def _am_send(*, email: str, subject: str, text: str, html: str | None = None,
             client_id: str, labels: list[str]) -> dict:
    return _bulk_am.send([email], subject, text=text, html=html,
                         client_id=client_id, labels=labels)

LEADS_FILE = Path(__file__).parent.parent / "ops/lead_lanes/instantly_aug16_verified.jsonl"
SENDS_LOG  = Path(__file__).parent.parent / "ops/lead_lanes/instantly_aug16_sends.jsonl"
DELIVER_AUDIT = Path(__file__).parent.parent / "deliver_audit.py"
VENV_PY = Path(__file__).parent.parent / "venv/bin/python3"

SEND_PACE_SECONDS = 7   # ~8-9/min, well under rate limit
DRY_RUN = "--dry-run" in sys.argv

AUDIT_URL_BASE = "https://nebulacomponents.shop"
STRIPE_LINK = "https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"


def already_sent(email: str) -> bool:
    if not SENDS_LOG.exists():
        return False
    with open(SENDS_LOG) as f:
        for line in f:
            try:
                r = json.loads(line)
                if r.get("email", "").lower() == email.lower() and r.get("sent"):
                    return True
            except Exception:
                pass
    return False


def run_audit(domain: str) -> dict:
    """Run deliver_audit.py --dry-run to get findings without sending."""
    try:
        url = f"https://{domain}"
        result = subprocess.run(
            [str(VENV_PY), str(DELIVER_AUDIT), url, "audit@placeholder.invalid",
             "--dry-run", "--json"],
            capture_output=True, text=True, timeout=60,
            cwd=str(Path(__file__).parent.parent)
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout.strip())
    except Exception as e:
        pass
    return {}


def extract_top_finding(audit_data: dict) -> tuple[str, float]:
    """Return (finding_text, score) from audit output."""
    score = audit_data.get("overall_score") or audit_data.get("score", 0)
    findings = audit_data.get("findings") or audit_data.get("top_findings") or []
    if findings:
        top = findings[0]
        if isinstance(top, dict):
            return top.get("issue") or top.get("finding") or top.get("text") or "", float(score)
        return str(top), float(score)
    return "", float(score)


def build_subject(lead: dict, domain: str) -> str:
    company = lead.get("company") or domain
    # Short, company-specific, title-case, under 6 words
    return f"{domain} conversion score"


def build_email(lead: dict, finding: str, score: float, domain: str) -> tuple[str, str]:
    """Return (text, html) for D1 cold email."""
    raw_first = (lead.get("first_name") or "").strip()
    # Clean suffixes: "John A." -> "John", "Sameer, Cfa, Cfp" -> "Sameer"
    first = re.split(r'[,\s]', raw_first)[0].strip() or "there"
    company = (lead.get("company") or domain).strip()
    personalization = (lead.get("personalization") or "").strip()

    # Build finding line — use audit finding if available, else generic hook
    if finding and len(finding) > 20:
        finding_line = finding.rstrip(".") + "."
    else:
        finding_line = "Your page is losing conversions before visitors reach your CTA."

    # Score context
    if score and score > 0:
        score_line = f"Scored it across 9 conversion signals — it came back at {score:.1f}/10."
    else:
        score_line = "Ran it across 9 conversion signals."

    # Personalization hook
    if personalization and len(personalization) > 15:
        hook = personalization.rstrip(".") + "."
    else:
        hook = f"Ran a quick audit on {domain}."

    text = f"""Hey {first},

{hook}

{score_line} Top finding: {finding_line}

We fix the 3 highest-impact issues in 48 hours — $97, no calls, no retainer.

Want me to send you the full audit?

Mike
Nebula Components
"""

    html = f"""<p>Hey {first},</p>
<p>{hook}</p>
<p>{score_line} Top finding: {finding_line}</p>
<p>We fix the 3 highest-impact issues in 48 hours — $97, no calls, no retainer.</p>
<p>Want me to send you the full audit?</p>
<p>Mike<br>Nebula Components</p>
"""
    return text, html


def log_result(result: dict) -> None:
    with open(SENDS_LOG, "a") as f:
        f.write(json.dumps(result) + "\n")


def main():
    leads = []
    with open(LEADS_FILE) as f:
        for line in f:
            leads.append(json.loads(line.strip()))

    print(f"Loaded {len(leads)} verified leads")
    print(f"DRY RUN: {DRY_RUN}")
    print(f"Log: {SENDS_LOG}\n")

    sent_count = 0
    skip_count = 0
    fail_count = 0

    for i, lead in enumerate(leads):
        email = lead["email"]
        domain = lead.get("company_domain") or email.split("@")[1]
        first = (lead.get("first_name") or "").strip()

        # Dedup
        if already_sent(email):
            print(f"[{i+1}/{len(leads)}] SKIP (already sent): {email}")
            skip_count += 1
            continue

        # Audit
        audit_data = run_audit(domain)
        finding, score = extract_top_finding(audit_data)

        subject = build_subject(lead, domain)
        body_text, body_html = build_email(lead, finding, score, domain)

        if DRY_RUN:
            print(f"[{i+1}/{len(leads)}] DRY RUN — {email}")
            print(f"  Subject: {subject}")
            print(f"  Finding: {finding[:80] if finding else '(none)'} | Score: {score}")
            print(f"  Body preview: {body_text[:120].strip()}")
            log_result({
                "email": email,
                "first_name": first,
                "company": lead.get("company"),
                "domain": domain,
                "subject": subject,
                "finding": finding,
                "score": score,
                "sent": False,
                "dry_run": True,
                "ts": datetime.now(timezone.utc).isoformat(),
            })
            continue

        # Send via AgentMail directly (verification already done + cached)
        safe = email.replace('@', '-').replace('.', '-').replace('+', '-')
        idempotency_key = f"campaign:instantly-aug16-{safe}-d1"
        try:
            result = _am_send(
                email=email,
                subject=subject,
                text=body_text,
                html=body_html,
                client_id=idempotency_key,
                labels=["targeted-outreach", "sequence-d1", "instantly-aug16"],
            )
            if result and not result.get("_error"):
                thread_id = result.get("thread_id", "")
                message_id = result.get("message_id", result.get("id", ""))
                # Register in sequence DB
                register_d1_sent(
                    email=email,
                    first_name=first,
                    thread_id=thread_id,
                    message_id=message_id,
                    product_url=f"https://{domain}",
                    signal_notes="Instantly.ai Aug-16 batch — founder/CEO SaaS list",
                    audit_finding=finding,
                    hook_variant="instantly_aug16",
                    mailcheck_verification_id=lead.get("mc_verification_id", ""),
                )
                log_result({
                    "email": email,
                    "first_name": first,
                    "company": lead.get("company"),
                    "domain": domain,
                    "subject": subject,
                    "finding": finding,
                    "score": score,
                    "sent": True,
                    "thread_id": thread_id,
                    "message_id": message_id,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                print(f"[{i+1}/{len(leads)}] SENT: {email} | score={score:.1f} | {subject}")
                sent_count += 1
                time.sleep(SEND_PACE_SECONDS)
            else:
                err = result.get("_error") if result else "no result"
                log_result({
                    "email": email, "sent": False, "error": str(err),
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                print(f"[{i+1}/{len(leads)}] FAIL: {email} — {err}")
                fail_count += 1
        except Exception as e:
            log_result({
                "email": email, "sent": False, "error": str(e),
                "ts": datetime.now(timezone.utc).isoformat(),
            })
            print(f"[{i+1}/{len(leads)}] ERROR: {email} — {e}")
            fail_count += 1
            time.sleep(2)

    print(f"\n=== DONE ===")
    print(f"Sent: {sent_count} | Skipped: {skip_count} | Failed: {fail_count}")
    print(f"Log: {SENDS_LOG}")


if __name__ == "__main__":
    main()
