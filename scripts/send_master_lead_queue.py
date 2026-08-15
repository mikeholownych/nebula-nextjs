#!/usr/bin/env python3
"""Send the governed uploaded master-lead queue through sequence_engine."""
from __future__ import annotations

import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('/home/mike/nebula')
QUEUE = ROOT / 'ops' / 'master-lead-list-governed-queue-20260815.json'
DB = ROOT / 'lead_gen' / 'lead_state.db'
sys.path.insert(0, str(ROOT))

from lead_gen.sequence_engine import send_d1
from send_window import in_send_window


def main() -> int:
    queue = json.loads(QUEUE.read_text())
    db = sqlite3.connect(DB)
    ready = queue.get('ready', [])
    sent = blocked = skipped = 0
    results = []
    for lead in ready:
        email = lead['email'].strip().lower()
        if not in_send_window(email):
            skipped += 1
            results.append({'email': email, 'status': 'outside_send_window'})
            continue
        existing = db.execute(
            "SELECT status FROM sequence_state WHERE lower(email)=? LIMIT 1", (email,)
        ).fetchone()
        if existing:
            blocked += 1
            results.append({'email': email, 'status': 'existing_lead', 'existing_status': existing[0]})
            continue
        response = send_d1(
            email=email,
            first_name=lead.get('first_name') or 'there',
            subject=lead['subject'],
            body_text=lead['body_text'],
            body_html='<p>' + lead['body_text'].replace('\n\n', '</p><p>').replace('\n', '<br>') + '</p>',
            product_url=lead.get('url', ''),
            signal_notes='User-provided AI SDR master lead list; ICP source: ' + (lead.get('icp_source') or ''),
            audit_finding=lead.get('audit_finding', ''),
        )
        if response.get('sent'):
            sent += 1
            results.append({'email': email, 'status': 'sent', 'thread_id': response.get('thread_id'), 'message_id': response.get('message_id')})
        else:
            blocked += 1
            results.append({'email': email, 'status': 'blocked_or_failed', 'reason': response.get('reason', 'unknown')})
    db.close()
    report = {
        'run_at': datetime.now(timezone.utc).isoformat(),
        'workflow': 'nebula-w6-audit-to-payment',
        'queue': str(QUEUE),
        'candidates': len(ready),
        'audits': sum(1 for x in ready if x.get('audit_finding')),
        'risk_checked': len(ready),
        'ready': len(ready),
        'sent': sent,
        'delivered': 0,
        'replied': 0,
        'audit_engaged': 0,
        'offer_presented': 0,
        'checkout_started': 0,
        'paid': 0,
        'revenue': 0,
        'mailcheck_risky_averted': sum(1 for x in queue.get('held', []) if 'mailcheck_not_send_authorized' in (x.get('hold_reason') or '')),
        'mailcheck_hard_blocks': sum(1 for x in queue.get('held', []) if 'confirmed_invalid_hard_block' in (x.get('hold_reason') or '')),
        'outside_send_window': skipped,
        'blocked': blocked,
        'results': results,
    }
    log_path = ROOT / 'ops' / 'w6_run_latest.json'
    log_path.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
