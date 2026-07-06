#!/usr/bin/env python3
"""Normalize public stats so /api/stats never reports test revenue as real."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from ledger_metrics import summary

BASE = Path('/home/mike/nebula')
STATS = BASE / 'stats.json'


def main() -> None:
    stats = json.loads(STATS.read_text()) if STATS.exists() else {}
    metrics = summary()
    # Public revenue must mean real settled non-test payments only.
    stats['revenue'] = metrics['real_revenue']
    stats['real_revenue'] = metrics['real_revenue']
    stats['real_payments'] = metrics['real_payments']
    stats['test_revenue_excluded'] = True
    stats['test_payments_excluded'] = metrics['test_payments_excluded']
    stats['trigger_based_sends'] = metrics['trigger_based_sends']
    stats['trigger_warm_replies'] = metrics['trigger_warm_replies']
    stats['trigger_reply_rate'] = metrics['trigger_reply_rate']
    stats['hot_lead_pitches_sent'] = metrics['hot_lead_pitches_sent']
    stats['updated'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    STATS.write_text(json.dumps(stats, indent=2) + '\n')
    print(json.dumps({k: stats[k] for k in ('revenue','real_revenue','real_payments','test_payments_excluded','trigger_based_sends','trigger_warm_replies','trigger_reply_rate','hot_lead_pitches_sent','updated')}, indent=2))


if __name__ == '__main__':
    main()
