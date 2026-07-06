#!/usr/bin/env python3
"""Audit quality review trigger.
Prints a concise report when 7+ pitches have gone out and real revenue is still $0.
"""
from __future__ import annotations

import json
from pathlib import Path

from ledger_metrics import summary, load_hot_leads

REPORT = Path('/home/mike/nebula/audit_quality_review.json')


def main() -> None:
    m = summary()
    leads = [h for h in load_hot_leads() if h.get('audit_score') is not None]
    scores = []
    for h in leads:
        try:
            scores.append(float(str(h.get('audit_score'))))
        except Exception:
            pass
    review = {
        'condition': '7+ pitches and $0 real revenue',
        'triggered': m['hot_lead_pitches_sent'] >= 7 and m['real_payments'] == 0,
        'hot_lead_pitches_sent': m['hot_lead_pitches_sent'],
        'real_payments': m['real_payments'],
        'audit_count_with_scores': len(scores),
        'score_min': min(scores) if scores else None,
        'score_max': max(scores) if scores else None,
        'score_avg': round(sum(scores) / len(scores), 2) if scores else None,
        'diagnosis': 'B/C audits may be too undifferentiated to create urgency' if scores and min(scores) >= 5 and max(scores) <= 8 else 'mixed severity; inspect outliers first',
        'required_change_if_triggered': [
            'Add one quantified leak estimate per audit',
            'Add first-screen screenshot/section-specific critique',
            'Pitch one concrete $97 fix, not generic implementation',
            'Stop sending generic B/C score summaries as the main urgency driver',
        ],
    }
    REPORT.write_text(json.dumps(review, indent=2))
    if review['triggered']:
        print('AUDIT DEPTH INVESTIGATION REQUIRED')
        print(json.dumps(review, indent=2))


if __name__ == '__main__':
    main()
