#!/home/mike/nebula/venv/bin/python3
"""One-shot, idempotent Batch 3 send to Oneupweb.

Scheduled for 2026-08-10 09:00 ET (13:00 UTC). Text-only: no open tracking.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BASE = Path("/home/mike/nebula")
sys.path.insert(0, str(BASE))

from agentmail_client import AgentMailClient, LABEL_OUTREACH
from company_os.controls import critic_gate
from lead_store import LeadStore
import lead_manager

EMAIL = "aolds@oneupweb.com"
SUBJECT = "An independent look at your PPC page"
CLIENT_ID = "campaign:batch3:oneupweb:2026-08-10"
TEXT = """Andy — the McCarthy case study is a strong brag: organic goal completions up 771%. You clearly measure client outcomes.

Question: when a buyer lands on your paid media page, does the page itself prove that track record, or just claim it?

I reviewed the rendered page buyers actually see. The page says “proven track record” and “decades of experience” — and shows no numbers, no case study, no testimonial to back it. The proof is one click away in your case studies, but the page itself claims rather than shows.

That's the kind of thing an independent pass catches that a team's own review is calibrated to skip. Would that second opinion be worth anything? If so, I'll send the manual readout and browser evidence.

Mike
Nebula Components

---
This is a targeted business email based on Oneupweb's public PPC services page.
Unsubscribe: https://nebulacomponents.com/unsubscribe.html?email=aolds%40oneupweb.com
Nebula Components, 66 Sonneck Square, Scarborough, ON M1E 1A9
"""


def preflight() -> dict:
    store = LeadStore()
    lead = store.get_lead(EMAIL)
    checks = {
        "registered": bool(lead),
        "stage": lead.get("stage") if lead else None,
        "bounced": store.is_bounced(EMAIL),
        "opted_out": lead_manager.is_opted_out(EMAIL),
        "critic_allowed": False,
        "critic_issues": [],
    }
    critic = critic_gate(TEXT, "outreach")
    checks["critic_allowed"] = critic.allowed
    checks["critic_issues"] = list(critic.issues)
    if not checks["registered"]:
        raise RuntimeError("lead_not_registered")
    if checks["stage"] in {"contacted", "audit_delivered", "pitch_sent", "replied", "paid"}:
        raise RuntimeError(f"lead_already_advanced:{checks['stage']}")
    if checks["bounced"]:
        raise RuntimeError("lead_bounced")
    if checks["opted_out"]:
        raise RuntimeError("lead_opted_out")
    if not checks["critic_allowed"]:
        raise RuntimeError("critic_blocked:" + ",".join(checks["critic_issues"]))
    return checks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        checks = preflight()
    except Exception as exc:
        print(json.dumps({"status": "blocked", "email": EMAIL, "reason": str(exc)}))
        return 1

    if args.dry_run:
        print(json.dumps({
            "status": "dry_run_pass",
            "email": EMAIL,
            "subject": SUBJECT,
            "client_id": CLIENT_ID,
            "text_only": True,
            "checks": checks,
        }, indent=2))
        return 0

    result = AgentMailClient().send(
        to=[EMAIL],
        subject=SUBJECT,
        text=TEXT,
        client_id=CLIENT_ID,
        labels=[LABEL_OUTREACH, "batch3-rendered-review"],
    )
    if result.get("_error"):
        print(json.dumps({
            "status": "send_failed",
            "email": EMAIL,
            "reason": result.get("_reason") or result.get("_error"),
            "client_id": result.get("client_id", CLIENT_ID),
        }))
        return 1

    receipt = result.get("message_id") or result.get("id")
    store = LeadStore()
    store.advance_stage(
        EMAIL,
        "contacted",
        notes=f"Batch 3 Oneupweb sent; provider_receipt={receipt}; client_id={CLIENT_ID}; deliverable_on_reply=manual rendered-browser readout",
    )
    lead = store.get_lead(EMAIL)
    print(json.dumps({
        "status": "sent",
        "email": EMAIL,
        "provider_receipt": receipt,
        "client_id": CLIENT_ID,
        "lead_stage": lead.get("stage") if lead else None,
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
