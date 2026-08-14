from __future__ import annotations

import json
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from mailcheck_adapter import MailCheckAdapter, MailCheckError


@pytest.fixture
def adapter(tmp_path: Path) -> MailCheckAdapter:
    key = tmp_path / "key"
    key.write_text("x" * 65)
    return MailCheckAdapter(key_file=key, db_path=tmp_path / "beta.db")


def test_confirmed_invalid_blocks_even_when_contact_admissible(adapter):
    decision = adapter.release_decision({
        "id": "v-1",
        "status": "COMPLETED",
        "classification": "CONFIRMED_INVALID",
        "contact_admissible": True,
    })
    assert decision.allowed is False
    assert decision.decision == "BLOCK"
    assert decision.reason == "confirmed_invalid"


def test_accept_all_never_authorizes_send(adapter):
    decision = adapter.release_decision({
        "id": "v-2",
        "status": "COMPLETED",
        "classification": "ACCEPT_ALL",
        "contact_admissible": True,
    })
    assert decision.allowed is False
    assert decision.decision == "PENDING_REVIEW"


def test_high_confidence_valid_still_requires_nebula_gate(adapter):
    decision = adapter.release_decision({
        "id": "v-3",
        "status": "COMPLETED",
        "classification": "HIGH_CONFIDENCE_VALID",
    })
    assert decision.allowed is True
    assert decision.decision == "ALLOW_TECHNICAL_REVIEW"


def test_missing_secret_fails_closed(tmp_path):
    a = MailCheckAdapter(key_file=tmp_path / "missing", db_path=tmp_path / "beta.db")
    with pytest.raises(MailCheckError, match="MAILCHECK_KEY_UNAVAILABLE"):
        a._request("GET", "/ready")


def test_submit_is_idempotent_and_persists_hash(monkeypatch, adapter):
    calls = []
    response = {"id": "v-123", "status": "PENDING"}

    def fake_request(method, path, *, body=None, idempotency_key=None):
        calls.append((method, path, body, idempotency_key))
        if method == "GET":
            return {"id": "v-123", "status": "COMPLETED", "classification": "HIGH_CONFIDENCE_VALID"}, "req-2"
        return response, "req-1"

    monkeypatch.setattr(adapter, "_request", fake_request)
    first = adapter.submit("Buyer@Example.com", lead_id="lead-1", source="beta")
    second = adapter.submit("buyer@example.com", lead_id="lead-1", source="beta")
    assert first["id"] == second["id"] == "v-123"
    assert len([c for c in calls if c[0] == "POST"]) == 1
    row = adapter.db_path
    import sqlite3
    with sqlite3.connect(row) as db:
        stored = db.execute("SELECT email_hash FROM verifications").fetchone()[0]
    assert stored != "buyer@example.com"
    assert len(stored) == 64


def test_quota_is_bounded():
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        key = Path(d) / "key"
        key.write_text("x" * 65)
        with pytest.raises(ValueError):
            MailCheckAdapter(key_file=key, db_path=Path(d) / "a.db", monthly_quota=99)
        with pytest.raises(ValueError):
            MailCheckAdapter(key_file=key, db_path=Path(d) / "b.db", monthly_quota=501)
