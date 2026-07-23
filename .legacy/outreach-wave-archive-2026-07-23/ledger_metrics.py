#!/usr/bin/env python3
"""Truth-first revenue and GTM metrics for Nebula.

Never counts Stripe test sessions or internal test emails as real revenue.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

BASE = Path('/home/mike/nebula')
CUSTOMER_LEDGER = BASE / 'ledgers/customer-ledger.jsonl'
FOLLOWUP_STATE = BASE / 'followup_state.jsonl'
OUTREACH_EVIDENCE = BASE / 'outreach_evidence.jsonl'
HOT_LEAD = BASE / 'HOT_LEAD.json'

TEST_MARKERS = ('test', 'restart-test', 'testco', 'test-thread', 'example.com', 'nebulashop@agentmail.to')
TRIGGER_MARKERS = (
    'reddit_explicit_pain', 'ad_bleed', 'zero_conversion', 'google_ads_no_sales',
    'ad_clicks_no_sales', 'surge_', 'ramp_', 'landing_page_not_converting',
)
WEAK_SIGNAL_MARKERS = ('local_business', 'weak_local_page')
WARM_ACTIONS = ('inbound_reply', 'warm_reply', 'inbound_audit_capture')


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


def load_hot_leads() -> list[dict]:
    if not HOT_LEAD.exists():
        return []
    try:
        raw = json.loads(HOT_LEAD.read_text())
    except json.JSONDecodeError:
        return []
    return raw if isinstance(raw, list) else [raw]


def is_test_payment(row: dict) -> bool:
    text = json.dumps(row, sort_keys=True).lower()
    payment_id = str(row.get('payment_id') or row.get('session_id') or '').lower()
    email = str(row.get('email') or '').lower()
    return payment_id.startswith('cs_test') or any(m in text or m in email for m in TEST_MARKERS)


def amount_cents(row: dict) -> int:
    if row.get('amount_cents') is not None:
        try:
            return int(row.get('amount_cents') or 0)
        except Exception:
            return 0
    amount = str(row.get('amount') or row.get('amount_dollars') or '').replace('$', '').replace(',', '').strip()
    try:
        return int(round(float(amount) * 100))
    except Exception:
        return 0


def real_payment_rows() -> list[dict]:
    return [r for r in load_jsonl(CUSTOMER_LEDGER) if r.get('event_type') == 'payment' and not is_test_payment(r)]


def test_payment_rows() -> list[dict]:
    return [r for r in load_jsonl(CUSTOMER_LEDGER) if r.get('event_type') == 'payment' and is_test_payment(r)]


def real_revenue_dollars() -> int:
    return sum(amount_cents(r) for r in real_payment_rows()) // 100


def trigger_based_sends() -> list[dict]:
    """Only real buying-trigger sends (ad bleed / zero conversion / explicit pain).
    Excludes weak-signal cold scrapes (local_business) which have no stated pain
    and were previously double-counted as trigger-based, masking the true reply rate.
    """
    rows = []
    for r in load_jsonl(OUTREACH_EVIDENCE):
        text = json.dumps(r, sort_keys=True).lower()
        if any(m in text for m in WEAK_SIGNAL_MARKERS):
            continue
        if any(m in text for m in TRIGGER_MARKERS):
            rows.append(r)
    return rows


def weak_signal_sends() -> list[dict]:
    """Cold scraped local-business sends with no real trigger — tracked separately."""
    rows = []
    for r in load_jsonl(OUTREACH_EVIDENCE):
        text = json.dumps(r, sort_keys=True).lower()
        if any(m in text for m in WEAK_SIGNAL_MARKERS):
            rows.append(r)
    return rows


def trigger_warm_replies() -> list[dict]:
    rows = []
    for r in load_jsonl(CUSTOMER_LEDGER):
        text = json.dumps(r, sort_keys=True).lower()
        if any(m in text for m in TEST_MARKERS):
            continue
        if any(a in text for a in WARM_ACTIONS) and ('warm' in text or 'interested' in text or 'send' in text):
            rows.append(r)
    return rows


def pitches_sent() -> list[dict]:
    return [r for r in load_jsonl(FOLLOWUP_STATE) if r.get('day') == 'hot_lead_97_pitch']


def audit_delivered_count() -> int:
    return sum(1 for h in load_hot_leads() if h.get('stage') in ('audit_delivered', 'pitch_sent') or h.get('audit_delivered_at'))


def summary() -> dict:
    trigger_sends = trigger_based_sends()
    warm = trigger_warm_replies()
    real = real_payment_rows()
    tests = test_payment_rows()
    return {
        'real_revenue': real_revenue_dollars(),
        'real_revenue_cents': sum(amount_cents(r) for r in real),
        'real_payments': len(real),
        'test_payments_excluded': len(tests),
        'trigger_based_sends': len(trigger_sends),
        'trigger_warm_replies': len(warm),
        'trigger_reply_rate': round((len(warm) / len(trigger_sends)) * 100, 2) if trigger_sends else 0.0,
        'hot_lead_pitches_sent': len(pitches_sent()),
        'audits_delivered_hot_lead': audit_delivered_count(),
    }


if __name__ == '__main__':
    print(json.dumps(summary(), indent=2))
