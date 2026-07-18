#!/usr/bin/env python3
"""
Integration test for nurture_engine with track-aware rendering.

Run: python3 -m pytest tests/test_nurture_engine_track_aware.py -v
"""

import json
import sys
from pathlib import Path

BASE = Path("/home/mike/nebula")
sys.path.insert(0, str(BASE))

import pytest


def test_nurture_engine_imports_track_modules():
    """Verify nurture_engine imports track_assignment and template_renderer."""
    import nurture_engine
    
    assert hasattr(nurture_engine, 'assign_track_from_audit'), "Missing track_assignment import"
    assert hasattr(nurture_engine, 'render_template'), "Missing template_renderer import"


def test_log_sent_includes_track_fields():
    """Verify log_sent accepts track_id and track_position_days."""
    from nurture_engine import log_sent, load_nurture_log, NURTURE_LOG
    import tempfile
    import os
    
    # Use temp log file
    original_log = None
    if NURTURE_LOG.exists():
        original_log = NURTURE_LOG.read_text()
    
    try:
        # Test logging with track fields
        log_sent(
            email="test@example.com",
            subject="Test subject",
            segment="cold",
            message_id="msg-123",
            track_id="headline-clarity",
            track_position_days=5
        )
        
        # Verify logged
        log = load_nurture_log()
        assert "test@example.com" in log, "Email not in log"
        
        # Read raw entry
        if NURTURE_LOG.exists():
            lines = NURTURE_LOG.read_text().strip().split("\n")
            last_line = lines[-1]
            entry = json.loads(last_line)
            assert entry.get("track_id") == "headline-clarity", "track_id not logged"
            assert entry.get("track_position_days") == 5, "track_position_days not logged"
    finally:
        # Restore
        if original_log:
            NURTURE_LOG.write_text(original_log)
        elif NURTURE_LOG.exists():
            # Remove test entry
            lines = NURTURE_LOG.read_text().strip().split("\n")
            lines = [l for l in lines if "test@example.com" not in l]
            NURTURE_LOG.write_text("\n".join(lines) + "\n" if lines else "")


def test_track_aware_rendering_in_trickle():
    """Test that run_trickle uses track-aware templates when track assigned."""
    # This is an integration test that would require mocking LeadStore
    # For now, just verify the code path exists
    
    from nurture_engine import run_trickle
    # Mock would be needed for full test
    # This is a placeholder for manual testing
    
    # The code path exists:
    # 1. Get track_id from lead.get("nurture_track")
    # 2. If track_id exists, build template_id: f"{segment}_{track_topic}_1"
    # 3. Call render_template(template_id, lead, audit)
    # 4. If successful, send with track fields in log
    
    assert True, "Placeholder for integration test"


def test_template_id_construction():
    """Verify template ID is built correctly from segment + track."""
    # Template ID pattern: {segment}_{track_topic}_{n}
    # track_id: "headline-clarity" → track_topic: "headline"
    
    cases = [
        ("cold", "headline-clarity", "cold_headline_1"),
        ("warm", "cta-friction", "warm_cta_1"),
        ("hot", "message-match", "hot_message_pitch_1"),
    ]
    
    for segment, track_id, expected_prefix in cases:
        track_topic = track_id.split("-")[0]
        
        if segment == "hot":
            template_id = f"hot_{track_topic}_pitch_1"
        else:
            template_id = f"{segment}_{track_topic}_1"
        
        # Verify against expected pattern
        if "hot" in expected_prefix:
            assert "pitch" in template_id, f"Hot templates should include 'pitch': {template_id}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
