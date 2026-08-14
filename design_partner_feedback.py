"""Durable design-partner feedback records for the independent MailCheck service.

This is a relay artifact for Mike to review and forward to MailCheck. It is
separate from delivery outcomes and never grants send authority.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path('/home/mike/nebula')
FEEDBACK_PATH = ROOT / 'ops' / 'mailcheck_design_partner_feedback.jsonl'


def record_feedback(*, feedback_type: str, capability: str, workflow: str, observation: str, impact: str, evidence: dict[str, Any] | None = None) -> dict[str, Any]:
    item = {
        'feedback_id': hashlib.sha256(f'{feedback_type}|{capability}|{workflow}|{observation}'.encode()).hexdigest()[:20],
        'recorded_at': datetime.now(timezone.utc).isoformat(),
        'feedback_type': feedback_type,
        'capability': capability,
        'workflow': workflow,
        'observation': observation,
        'impact': impact,
        'evidence': evidence or {},
        'source': 'nebula-design-partner',
        'status': 'pending_mailcheck_review',
    }
    FEEDBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with FEEDBACK_PATH.open('a', encoding='utf-8') as f:
        f.write(json.dumps(item, sort_keys=True) + '\n')
    return item


__all__ = ['record_feedback', 'FEEDBACK_PATH']
