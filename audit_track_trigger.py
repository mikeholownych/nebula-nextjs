#!/usr/bin/env python3
"""
audit_track_trigger.py — Assign nurture track when audit completes.

This module integrates with the audit completion flow:
1. When audit finishes, extract findings
2. Call assign_track_from_audit(findings)
3. Call upsert_lead with nurture_track assigned

Usage:
    from audit_track_trigger import trigger_track_assignment
    
    track_id = trigger_track_assignment(email, audit_id, findings)
"""

import sys
from pathlib import Path
from typing import List, Dict, Any

BASE = Path("/home/mike/nebula")
sys.path.insert(0, str(BASE))

from track_assignment import assign_track_from_audit
from lead_manager import upsert_lead


def trigger_track_assignment(
    email: str,
    audit_id: str,
    findings: List[Dict[str, Any]],
    url: str = None
) -> str:
    """
    Assign nurture track based on audit findings and update lead.
    
    Args:
        email: Lead email
        audit_id: Audit record ID
        findings: List of audit findings with 'category' and 'severity'
        url: Page URL (optional, for lead record)
    
    Returns:
        track_id: Assigned track (e.g., "headline-clarity")
    """
    # Assign track from findings
    track_id = assign_track_from_audit(findings)
    
    # Update lead record
    upsert_lead(
        email=email,
        stage="lead_audit",  # Or keep existing stage
        source="audit_completion",
        url=url,
        nurture_track=track_id,
        audit_id=audit_id
    )
    
    print(f"[track_trigger] Assigned track '{track_id}' to {email} from audit {audit_id}")
    
    return track_id


def test_trigger():
    """Test track assignment trigger."""
    
    # Mock audit completion
    email = "test-founder@example.com"
    audit_id = "AUDIT-TEST-001"
    findings = [
        {"category": "headline", "severity": "high", "observation": "Headline describes product, not problem"},
        {"category": "cta", "severity": "medium", "observation": "CTA ambiguous"}
    ]
    
    track_id = trigger_track_assignment(
        email=email,
        audit_id=audit_id,
        findings=findings,
        url="https://example.com"
    )
    
    assert track_id in ["headline-clarity", "cta-friction"], f"Unexpected track: {track_id}"
    print(f"✓ Track assigned: {track_id}")
    
    # Verify lead updated
    from lead_manager import get_lead
    
    lead = get_lead(email)
    assert lead is not None, "Lead not found"
    assert lead.get("nurture_track") == track_id, "Track not stored"
    assert lead.get("track_audit_id") == audit_id, "Audit ID not stored"
    assert lead.get("track_position_days") == 0, "Position should be 0"
    
    print(f"✓ Lead updated: {lead.get('nurture_track')}, position: {lead.get('track_position_days')}")


if __name__ == "__main__":
    test_trigger()
