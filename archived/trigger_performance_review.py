#!/usr/bin/env python3
"""Self-improvement mining: which trigger_type/vertical/offer_variant is actually
converting to warm replies, vs which is dead weight.

Modeled on the "Theo" pattern (review what worked, propose changes) — but scoped
to data we actually have: outreach_evidence.jsonl attribution + customer-ledger warm replies.
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

BASE = Path('/home/mike/nebula')
OUTREACH_EVIDENCE = BASE / 'outreach_evidence.jsonl'
CUSTOMER_LEDGER = BASE / 'ledgers/customer-ledger.jsonl'
OUT = BASE / 'trigger_performance_report.json'

TEST_MARKERS = ('test', 'restart-test', 'testco', 'test-thread', 'example.com', 'nebulashop@agentmail.to')


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def is_test(row: dict) -> bool:
    text = json.dumps(row, sort_keys=True).lower()
    return any(m in text for m in TEST_MARKERS)


def warm_emails() -> set[str]:
    """Emails/prospects that produced a warm/interested signal, excluding test data."""
    warm = set()
    for r in load_jsonl(CUSTOMER_LEDGER):
        if is_test(r):
            continue
        text = json.dumps(r, sort_keys=True).lower()
        if 'inbound_reply' in text or 'warm' in text:
            sender = (r.get('sender') or r.get('email') or '').lower()
            if sender:
                warm.add(sender)
    return warm


def main() -> None:
    warm = warm_emails()
    buckets: dict[str, dict] = defaultdict(lambda: {'sent': 0, 'warm': 0, 'prospects': []})

    for r in load_jsonl(CUSTOMER_LEDGER):
        if is_test(r):
            continue
        attribution = r.get('attribution')
        if not attribution:
            continue  # only score attributed sends; unattributed legacy rows add no signal
        trigger_type = attribution.get('trigger_type') or 'unattributed'
        vertical = attribution.get('vertical') or 'unattributed'
        offer_variant = attribution.get('offer_variant') or 'unattributed'
        key = f"{trigger_type} | {vertical} | {offer_variant}"
        buckets[key]['sent'] += 1
        facts = r.get('facts') or {}
        prospect_email = (r.get('lead_email') or facts.get('lead_email') or '').lower()
        buckets[key]['prospects'].append(prospect_email)
        if prospect_email in warm:
            buckets[key]['warm'] += 1

    ranked = []
    for key, data in buckets.items():
        sent = data['sent']
        warm_count = data['warm']
        rate = round((warm_count / sent) * 100, 1) if sent else 0.0
        ranked.append({
            'segment': key,
            'sent': sent,
            'warm_replies': warm_count,
            'reply_rate_pct': rate,
        })
    ranked.sort(key=lambda x: (-x['reply_rate_pct'], -x['sent']))

    total_sent = sum(b['sent'] for b in buckets.values())
    total_warm = sum(b['warm'] for b in buckets.values())

    report = {
        'total_trigger_sends': total_sent,
        'total_warm_replies': total_warm,
        'overall_reply_rate_pct': round((total_warm / total_sent) * 100, 2) if total_sent else 0.0,
        'segments_ranked': ranked,
        'recommendation': (
            'Not enough data yet to kill/scale any segment (need 10+ sends per segment for signal).'
            if all(b['sent'] < 10 for b in buckets.values())
            else 'Scale segments with reply_rate_pct > overall average; kill segments with 10+ sends and 0 replies.'
        ),
    }
    OUT.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
