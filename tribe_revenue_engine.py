#!/usr/bin/env python3
"""TRIBE revenue engine for Nebula.

Steals from Matthew's TRIBE email:
- Traffic: bottom-of-funnel traffic via clients/partners/warm intros beats random visits.
- Revenue: sell what the qualified buyer is willing to buy, including consulting bridges.
- Inbound: existing customers are the warmest referral source.
- Brand: do cool work, then turn it into proof/content.
- Email: abandoned checkout recovery is a one-time setup that keeps converting.

This script does not blast emails. It builds queues the sending agents can consume.
"""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

BASE = Path(__file__).resolve().parent
LEDGERS = BASE / "ledgers"
GS = BASE / "growth_system"
CUSTOMER_LEDGER = LEDGERS / "customer-ledger.jsonl"
ABANDONED_CARTS = LEDGERS / "abandoned_carts.jsonl"
REPLIED_EMAILS = BASE / "replied_emails.jsonl"
REFERRAL_QUEUE = GS / "warm_intro_referral_queue.jsonl"
CONSULTING_QUEUE = GS / "flexible_consulting_offer_queue.jsonl"
BRAND_PROOF_QUEUE = GS / "brand_proof_queue.jsonl"
CART_QUEUE = GS / "abandoned_checkout_recovery_queue.jsonl"
CONFIG = GS / "tribe_growth_playbook.json"

EXCLUDE_EMAIL_RE = re.compile(r"(example\.com|test|mike\.holownych|nebulashop|agentmail|stripe@example)", re.I)


@dataclass
class QueueItem:
    timestamp: str
    queue: str
    email: str
    domain: str
    source_event: str
    priority: str
    subject: str
    body: str
    rationale: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            if isinstance(row, dict):
                rows.append(row)
        except json.JSONDecodeError:
            continue
    return rows


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        for row in rows:
            f.write(json.dumps(row, sort_keys=True, ensure_ascii=False) + "\n")


def clean_domain(url_or_email: str) -> str:
    s = str(url_or_email or "").strip().lower()
    if "@" in s and not s.startswith("http"):
        return s.split("@", 1)[1]
    s = re.sub(r"^https?://", "", s)
    s = s.split("/", 1)[0]
    return s.replace("www.", "")


def usable_email(email: str) -> bool:
    return bool(email and "@" in email and not EXCLUDE_EMAIL_RE.search(email))


def usable_domain(domain: str) -> bool:
    if not domain or EXCLUDE_EMAIL_RE.search(domain):
        return False
    return domain not in {"example.com", "localhost", "nebulacomponents.shop", "aisyndicate.io"}


def referral_body(domain: str) -> str:
    return f"""Hey — quick ask.

You were one of the better-fit founders/pages we've audited. Do you know one other founder as sharp as you who is paying for traffic but not getting enough conversions?

If yes, a one-line intro is enough. I'll send them the same free leak map first — no pitch attached.

— Nebula"""


def consulting_body(domain: str) -> str:
    return f"""Hey — if the full implementation is too much or timing is weird, we can do a lighter bridge.

Option: 3 short advisory passes over 30 days.
1. Find the highest-leverage leak
2. Rewrite the page path
3. Review the result after changes

No retainer. No long project. Just enough help to reduce risk before you commit to anything bigger.

Worth pricing out for {domain}?"""


def cart_body(domain: str) -> str:
    return f"""Hey — saw you started checkout and didn't finish.

No pressure. Usually that means one of three things:
1. timing is off
2. you want to DIY first
3. you need lower-risk help before implementation

If it's #2, use the free audit path again: https://nebulacomponents.shop/audit.html
If it's #3, reply "bridge" and I'll send the lighter consulting option.

— Nebula"""


def build_referral_queue(customer_rows: list[dict[str, Any]]) -> list[QueueItem]:
    seen: set[str] = set()
    out: list[QueueItem] = []
    for row in customer_rows:
        event = row.get("event_type") or row.get("event")
        if event not in {"payment", "audit_delivered"}:
            continue
        email = str(row.get("email") or row.get("lead_email") or "").lower().strip()
        if not usable_email(email) or email in seen:
            continue
        seen.add(email)
        domain = clean_domain(row.get("url") or email)
        if not usable_domain(domain):
            continue
        priority = "p0" if event == "payment" else "p1"
        out.append(QueueItem(
            timestamp=utc_now(), queue="warm_intro_referral", email=email, domain=domain,
            source_event=str(event), priority=priority,
            subject="quick intro ask",
            body=referral_body(domain),
            rationale="Warm intro from existing customer/audit relationship is highest-quality traffic.",
        ))
    return out


def build_consulting_queue(reply_rows: list[dict[str, Any]], customer_rows: list[dict[str, Any]]) -> list[QueueItem]:
    paid = {str(r.get("email", "")).lower().strip() for r in customer_rows if r.get("event_type") == "payment"}
    out: list[QueueItem] = []
    seen: set[str] = set()
    for row in reply_rows:
        email = str(row.get("sender") or row.get("email") or "").lower().strip()
        if not usable_email(email) or email in paid or email in seen:
            continue
        classification = str(row.get("classification") or "").lower()
        preview = str(row.get("preview") or row.get("body") or "")
        if classification not in {"warm", "replied", "interested"} and not re.search(r"price|budget|later|risk|consult|call|interested", preview, re.I):
            continue
        seen.add(email)
        domain = clean_domain(email)
        out.append(QueueItem(
            timestamp=utc_now(), queue="flexible_consulting_offer", email=email, domain=domain,
            source_event="reply", priority="p0",
            subject="lighter option?",
            body=consulting_body(domain),
            rationale="Qualified but not ready for core offer: create a lower-risk consulting bridge instead of forcing the default path.",
        ))
    return out


def build_cart_queue(cart_rows: list[dict[str, Any]], customer_rows: list[dict[str, Any]]) -> list[QueueItem]:
    paid = {str(r.get("email", "")).lower().strip() for r in customer_rows if r.get("event_type") == "payment"}
    out: list[QueueItem] = []
    seen: set[str] = set()
    for row in cart_rows:
        email = str(row.get("email") or "").lower().strip()
        if not usable_email(email) or email in paid or email in seen:
            continue
        seen.add(email)
        domain = clean_domain(row.get("url") or email)
        out.append(QueueItem(
            timestamp=utc_now(), queue="abandoned_checkout_recovery", email=email, domain=domain,
            source_event="checkout.session.expired", priority="p0",
            subject="want the lower-risk path?",
            body=cart_body(domain),
            rationale="Abandoned checkout is already-interested traffic; recover with risk reduction, not pressure.",
        ))
    return out


def build_brand_proof_queue(customer_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    seen: set[str] = set()
    for row in customer_rows[-100:]:
        event = row.get("event_type") or row.get("event")
        if event not in {"audit_delivered", "payment"}:
            continue
        domain = clean_domain(row.get("url") or row.get("email") or row.get("lead_email") or "")
        if not usable_domain(domain) or domain in seen:
            continue
        seen.add(domain)
        out.append({
            "timestamp": utc_now(),
            "source_event": event,
            "domain": domain,
            "proof_asset": "Do cool work → talk about the specific leak found/fixed.",
            "post_angle": f"Most founders buy more traffic. The smarter move is finding why {domain} leaks the traffic it already has.",
            "cta": "Run the free leak map before buying more clicks.",
        })
    return out[-25:]


def write_config() -> None:
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps({
        "source": "TRIBE weekly email — Matthew",
        "traffic": "Split top-of-funnel and bottom-of-funnel; warm intros are higher-value traffic than random visits.",
        "revenue": "Give qualified buyers the thing they are willing to buy; add consulting bridge when full service is too much risk.",
        "inbound": "Ask existing customers/audit relationships for one intro to someone as good as them.",
        "brand": "Do cool work, then publish proof from that work repeatedly.",
        "email": "Abandoned checkout recovery is a one-time setup that can become automated revenue.",
        "queues": {
            "warm_intro_referral": str(REFERRAL_QUEUE),
            "flexible_consulting_offer": str(CONSULTING_QUEUE),
            "abandoned_checkout_recovery": str(CART_QUEUE),
            "brand_proof": str(BRAND_PROOF_QUEUE),
        },
    }, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    customer_rows = read_jsonl(CUSTOMER_LEDGER)
    reply_rows = read_jsonl(REPLIED_EMAILS)
    cart_rows = read_jsonl(ABANDONED_CARTS)

    referrals = build_referral_queue(customer_rows)
    consulting = build_consulting_queue(reply_rows, customer_rows)
    carts = build_cart_queue(cart_rows, customer_rows)
    brand = build_brand_proof_queue(customer_rows)
    write_config()

    if not args.dry_run:
        write_jsonl(REFERRAL_QUEUE, [asdict(x) for x in referrals])
        write_jsonl(CONSULTING_QUEUE, [asdict(x) for x in consulting])
        write_jsonl(CART_QUEUE, [asdict(x) for x in carts])
        write_jsonl(BRAND_PROOF_QUEUE, brand)

    print(json.dumps({
        "customer_rows": len(customer_rows),
        "reply_rows": len(reply_rows),
        "cart_rows": len(cart_rows),
        "warm_intro_referrals": len(referrals),
        "consulting_bridges": len(consulting),
        "cart_recoveries": len(carts),
        "brand_proof_assets": len(brand),
        "dry_run": args.dry_run,
    }, indent=2))


if __name__ == "__main__":
    main()
