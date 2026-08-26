"""Authoritative lifecycle events gate every post-audit nurture send."""

import json
from datetime import datetime, timedelta, timezone

import nurture_engine


def test_lifecycle_decision_suppresses_terminal_and_unverified_states():
    import importlib, nurture_engine as _ne
    importlib.reload(_ne)
    assert _ne.classify_lifecycle(set(), paid=False, relationship_stage=None) == "suppress_unverified"
    assert _ne.classify_lifecycle({"audit_completed"}, paid=True, relationship_stage=None) == "suppress_paid"
    assert _ne.classify_lifecycle({"purchase_completed"}, paid=False, relationship_stage=None) == "suppress_paid"
    assert _ne.classify_lifecycle({"audit_result_viewed"}, paid=False, relationship_stage="replied") == "suppress_relationship"
    assert _ne.classify_lifecycle({"checkout_started"}, paid=False, relationship_stage=None) == "suppress_checkout"


def test_lifecycle_decision_selects_recovery_or_post_audit_path():
    import importlib, nurture_engine as _ne
    importlib.reload(_ne)
    assert _ne.classify_lifecycle(
        {"audit_completed"}, paid=False, relationship_stage=None
    ) == "delivery_recovery"
    assert _ne.classify_lifecycle(
        {"audit_completed", "audit_result_viewed"}, paid=False, relationship_stage=None
    ) == "post_audit"


class FakeLeadStore:
    def is_bounced(self, _email):
        return False


def _write_audit_lead(base, audit_id="audit-1", email="buyer@example.com"):
    completed = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
    (base / "audit_leads.jsonl").write_text(json.dumps({
        "audit_id": audit_id,
        "email": email,
        "url": "https://example.com",
        "timestamp": completed,
    }) + "\n")


def test_pick_audit_nurture_fails_closed_without_lifecycle_authority(tmp_path, monkeypatch):
    """lifecycle_loader returning None must cause pick_audit_nurture to return []."""
    _write_audit_lead(tmp_path)
    # Import fresh from the worktree file, bypassing any cached module
    import importlib.util as _ilu, sys as _sys
    spec = _ilu.spec_from_file_location(
        "nurture_engine_wt",
        str(tmp_path.parent.parent / "nurture_engine.py")
        if False else
        str(tmp_path.parent / "nurture_engine.py")
        if False else
        "/home/mike/nebula/.worktrees/research-pattern-hardening/nurture_engine.py",
    )
    _ne = _ilu.module_from_spec(spec)
    spec.loader.exec_module(_ne)

    monkeypatch.setattr(_ne, "BASE", tmp_path)
    monkeypatch.setattr("lead_store.LeadStore", FakeLeadStore)

    candidates = _ne.pick_audit_nurture(
        {"client_ids": set()}, lifecycle_loader=lambda _pairs: None
    )
    assert candidates == []


def test_pick_audit_nurture_uses_delivery_recovery_path(tmp_path, monkeypatch):
    """audit_completed without audit_result_viewed routes to delivery_recovery."""
    _write_audit_lead(tmp_path)
    import importlib.util as _ilu
    spec = _ilu.spec_from_file_location(
        "nurture_engine_wt2",
        "/home/mike/nebula/.worktrees/research-pattern-hardening/nurture_engine.py",
    )
    _ne = _ilu.module_from_spec(spec)
    spec.loader.exec_module(_ne)

    monkeypatch.setattr(_ne, "BASE", tmp_path)
    monkeypatch.setattr("lead_store.LeadStore", FakeLeadStore)
    monkeypatch.setattr(_ne, "lead_state_info", lambda _email: {})

    candidates = _ne.pick_audit_nurture(
        {"client_ids": set()},
        lifecycle_loader=lambda _pairs: {
            "audit-1": {"events": {"audit_completed"}, "paid": False},
        },
    )
    assert len(candidates) == 1
    assert candidates[0]["lifecycle_path"] == "delivery_recovery"
    assert candidates[0]["client_id"].endswith("-d1")
