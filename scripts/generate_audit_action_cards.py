#!/usr/bin/env python3
"""Build internal Audit Action Cards from the governed ready queue.

This creates research and message artifacts only. It never sends, publishes,
authorizes outreach, or changes the governed queue.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "ops" / "master-lead-list-governed-queue-20260815.json"
OUTPUT = ROOT / "ops" / "audit_action_cards_20260815.jsonl"
SUMMARY = ROOT / "ops" / "audit_action_cards_20260815.summary.json"


def build_card(row: dict, index: int) -> dict:
    company = str(row.get("company") or "Unknown company").strip()
    finding = str(row.get("audit_finding") or "No audit finding recorded").strip()
    audit_url = (
        "https://nebulacomponents.com/audit?"
        "utm_source=action_card&utm_medium=outreach&utm_campaign=audit-action-cards-20260815&"
        f"utm_content={quote(company.lower().replace(' ', '-'))}"
    )
    return {
        "card_id": f"aac-20260815-{index:03d}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "internal_research_artifact",
        "send_authority": "none",
        "company": company,
        "contact": {
            "first_name": row.get("first_name"),
            "job_title": row.get("job_title"),
            "email": row.get("email"),
        },
        "trigger": {
            "source": row.get("source"),
            "icp_source": row.get("icp_source"),
            "page_url": row.get("url"),
        },
        "evidence": {
            "audit_score": row.get("audit_score"),
            "audit_grade": row.get("audit_grade"),
            "top_finding": finding,
        },
        "commercial_consequence": (
            "A visitor may have to work too hard to understand the next step, "
            "which can waste paid clicks before the page earns action."
        ),
        "repair_angle": (
            "Fix the highest-cost condition first, then re-audit the same condition "
            "before changing unrelated page elements."
        ),
        "provider_risk_context": {
            "hunter_status": (row.get("hunter") or {}).get("status"),
            "hunter_result": (row.get("hunter") or {}).get("result"),
            "mailcheck_classification": (row.get("mailcheck") or {}).get("classification"),
            "mailcheck_decision": (row.get("mailcheck") or {}).get("decision"),
            "mailcheck_verification_id": (row.get("mailcheck") or {}).get("verification_id"),
            "nebula_release_gate": "recheck at send time; provider output is not authorization",
        },
        "message_angle": (
            f"I reviewed {company}'s public page and found one issue worth checking: {finding}"
        ),
        "audit_url": audit_url,
        "source_message": row.get("body_text"),
        "next_action": "Review card, then route through the existing governed sender if independently approved.",
    }


def main() -> int:
    queue = json.loads(QUEUE.read_text())
    ready = queue.get("ready", [])
    cards = [build_card(row, i) for i, row in enumerate(ready, start=1)]
    OUTPUT.write_text("".join(json.dumps(card, ensure_ascii=False) + "\n" for card in cards))
    summary = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "workflow": "audit-action-card",
        "source_queue": str(QUEUE),
        "output": str(OUTPUT),
        "cards": len(cards),
        "send_authority": "none",
        "published": 0,
        "sent": 0,
    }
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
