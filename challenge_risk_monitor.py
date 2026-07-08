#!/usr/bin/env python3
"""Challenge risk monitor.
Quiet when green. Prints concise alerts when kill criteria or audit-quality criteria trigger.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from ledger_metrics import summary, load_hot_leads

STATE = Path('/home/mike/nebula/challenge_risk_monitor_state.json')


def load_state() -> dict:
    if not STATE.exists():
        return {}
    try:
        return json.loads(STATE.read_text())
    except Exception:
        return {}


def save_state(state: dict) -> None:
    STATE.write_text(json.dumps(state, indent=2))


def main() -> None:
    state = load_state()
    m = summary()
    alerts = []

    trigger_sends = int(m['trigger_based_sends'])
    warm_replies = int(m['trigger_warm_replies'])
    if trigger_sends >= 30 and warm_replies == 0 and not state.get('kill_30_0_alerted'):
        alerts.append(
            'KILL CRITERIA HIT: trigger-based sends >=30 and warm replies =0. Stop this segment; change targeting/message before more volume.'
        )
        state['kill_30_0_alerted'] = datetime.now(timezone.utc).isoformat()

    pitches = int(m['hot_lead_pitches_sent'])
    real_payments = int(m['real_payments'])
    if pitches >= 7 and real_payments == 0 and not state.get('audit_depth_alerted'):
        alerts.append(
            'AUDIT QUALITY REVIEW TRIGGERED: 7+ $147 pitches sent and 0 real payments. Investigate audit depth/urgency before more pitches.'
        )
        state['audit_depth_alerted'] = datetime.now(timezone.utc).isoformat()
        try:
            import subprocess
            result = subprocess.run(['/home/mike/nebula/venv/bin/python3', '/home/mike/nebula/audit_quality_review.py'], capture_output=True, text=True, timeout=60)
            if result.stdout.strip():
                alerts.append(result.stdout.strip())
        except Exception as e:
            alerts.append(f'audit_quality_review.py failed: {e}')

    # July 4 holiday monitor heartbeat only when pitches are due or sent.
    july4_due = [h for h in load_hot_leads() if str(h.get('pitch_due_at','')).startswith('2026-07-04') and h.get('status') == 'pending']
    july4_sent = [h for h in load_hot_leads() if str(h.get('pitch_sent_at','')).startswith('2026-07-04')]
    if july4_due or july4_sent:
        last_key = f"holiday_monitor_{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H')}"
        if not state.get(last_key):
            alerts.append(
                f"JULY4 PITCH MONITOR: pending_due={len(july4_due)} sent_today={len(july4_sent)} trigger_sends={trigger_sends} warm_replies={warm_replies} real_revenue=${m['real_revenue']}"
            )
            state[last_key] = True

    save_state(state)
    if alerts:
        print('\n'.join(alerts))


if __name__ == '__main__':
    main()
