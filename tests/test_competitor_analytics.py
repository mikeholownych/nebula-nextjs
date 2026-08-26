"""Task 3 Phase 3: competitor persistence, slots and comparison v2.

Fixture shapes mirror a real completed audits row from nebula_audit
(captured 2026-08-24):

    engine_output.keys() = findings, page_title, dimensions, email,
        composite_anchor, historical_data, composite, page_h1,
        guided_implementation, score, grade, engine_version, url,
        historical_insights, strategic_finding

    findings = [ {"key": "cta", "label": "CTA", "issue": "...",
                  "impact": 5.0, "effort": 2, "quadrant": "quick_win",
                  "signal_type": "conversion", ...}, ... ]   # failed signals

    dimensions = { "cta": {"score": 0.0, "weight": "high", "issue": "..."},
                   "mobile": {"score": 10.0, ...}, ... }     # all signals
"""

import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import BackgroundTasks, HTTPException

from platform_api.competitor import routes as competitor_routes


OWNER_EMAIL = "owner@example.com"
USER_ID = str(uuid4())


# ─── fakes ────────────────────────────────────────────────────────────────────


class FakeResult:
    def __init__(self, scalar=None, row=None, rows=None):
        self._scalar = scalar
        self._row = row
        self._rows = rows or []

    def scalar(self):
        return self._scalar

    def fetchone(self):
        return self._row

    def fetchall(self):
        return self._rows


class FakeSession:
    """Platform-db session: users email lookup + competitor_tracking writes."""

    def __init__(self):
        self.executed = []
        self.legacy_rows = []

    def execute(self, sql, params=None):
        text = str(sql)
        self.executed.append((text, params))
        if "FROM users" in text:
            return FakeResult(row=SimpleNamespace(email=OWNER_EMAIL))
        if "INSERT INTO competitor_tracking" in text:
            return FakeResult(row=SimpleNamespace(
                id=str(uuid4()),
                competitor_url=params["url"],
                label=params["label"],
                project_domain=params.get("project_domain"),
                created_at=None,
            ))
        if "FROM competitor_tracking" in text:
            return FakeResult(rows=self.legacy_rows)
        return FakeResult()

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def json(self):
        return self._payload


class FakeAsyncClient:
    payload = {}

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, json=None):
        return FakeResponse(type(self).payload)


class FakeConn:
    def __init__(self, log):
        self._log = log

    async def execute(self, sql, *params):
        self._log.append((" ".join(str(sql).split()), params))

    async def fetch(self, sql, *params):
        self._log.append((" ".join(str(sql).split()), params))
        return []


class FakePool:
    def __init__(self):
        self.log = []

    def acquire(self):
        conn = FakeConn(self.log)

        class _CM:
            async def __aenter__(self):
                return conn

            async def __aexit__(self, *exc):
                return False

        return _CM()


def current_user():
    return {"user_id": USER_ID, "user": None}


# ─── real engine_output fixture (shape captured from production) ─────────────

DIMENSIONS = {
    "cta": {"score": 0.0, "weight": "high", "issue": "No CTA buttons found"},
    "mobile": {"score": 10.0, "weight": "medium", "issue": "Mobile signal verification completed"},
    "headline": {"score": 6.0, "weight": "high", "issue": "H1 lacks a verb"},
    "above_fold": {"score": 0.0, "weight": "high", "issue": "H1 not in first 2000 chars"},
    "ad_signals": {"score": 5.0, "weight": "medium", "issue": "Meta description too short"},
    "load_speed": {"score": 8.0, "weight": "high", "issue": "Load Speed signal verification completed"},
    "ai_readiness": {"score": 5.0, "weight": "medium", "issue": "Missing: json ld"},
    "social_proof": {"score": 10.0, "weight": "high", "issue": "Social Proof signal verification completed"},
    "seo_foundations": {"score": 7.5, "weight": "high", "issue": "Missing: canonical"},
}

FINDINGS = [
    {"key": "cta", "label": "CTA", "impact": 5.0, "quadrant": "quick_win"},
    {"key": "above_fold", "label": "Above Fold", "impact": 5.0},
    {"key": "headline", "label": "Headline", "impact": 2.0},
    {"key": "ad_signals", "label": "Ad Tracking", "impact": 2.5},
    {"key": "ai_readiness", "label": "AI Citation Readiness", "impact": 2.5},
]

ENGINE_OUTPUT = {
    "findings": FINDINGS,
    "dimensions": DIMENSIONS,
    "score": 57,
    "grade": "D",
}


# ─── scenario 1: slot enforcement (free legacy parity vs paid entitlements) ──


UPGRADE_403 = {
    "message": "Competitor slots reached",
    "upgrade_url": "/pricing",
}


def _linked(monkeypatch, pool, urls):
    async def fetch(self, sql, *params):
        self._log.append((sql, params))
        return [{"competitor_url": u} for u in urls]

    monkeypatch.setattr(FakeConn, "fetch", fetch)
    monkeypatch.setattr(competitor_routes.audit_db, "pool", pool)


def _add(url):
    body = competitor_routes.CompetitorCreateRequest(url=url)
    return asyncio.run(
        competitor_routes.add_competitor(body, BackgroundTasks(), current_user())
    )


def test_add_competitor_free_third_rival_allowed(monkeypatch):
    """Free keeps grandfathered parity: 2 rivals used, third is allowed
    even though the entitlement fixture grants free 0 slots."""
    ent = SimpleNamespace(plan="free", competitor_slots=0)
    monkeypatch.setattr(
        "platform_api.services.entitlements.resolve_sync",
        lambda email, db: ent,
    )
    fake_session = FakeSession()
    monkeypatch.setattr(
        "platform_api.db.session.SessionLocal", lambda: fake_session
    )
    _linked(monkeypatch, FakePool(), [
        "https://rival-a.com", "https://rival-b.com",
    ])

    result = _add("https://rival-c.com")
    assert result["url"] == "https://rival-c.com"
    assert result["audit_triggered"] is True
    inserts = [
        e for e in fake_session.executed
        if "INSERT INTO competitor_tracking" in e[0]
    ]
    assert inserts and inserts[0][1]["url"] == "https://rival-c.com"


def test_add_competitor_free_fourth_rival_denied(monkeypatch):
    """Free's fourth rival exceeds the legacy three-slot parity: 403 with
    the standard upgrade shape."""
    ent = SimpleNamespace(plan="free", competitor_slots=0)
    monkeypatch.setattr(
        "platform_api.services.entitlements.resolve_sync",
        lambda email, db: ent,
    )
    fake_session = FakeSession()
    monkeypatch.setattr(
        "platform_api.db.session.SessionLocal", lambda: fake_session
    )
    _linked(monkeypatch, FakePool(), [
        "https://rival-a.com", "https://rival-b.com", "https://rival-c.com",
    ])

    with pytest.raises(HTTPException) as exc:
        _add("https://rival-d.com")
    assert exc.value.status_code == 403
    assert exc.value.detail == UPGRADE_403


def test_add_competitor_pro_limited_by_entitlement_slots(monkeypatch):
    """Pro gets full diagnostics but only its entitlement slots (2): a
    third rival is denied even though legacy parity allows 3."""
    ent = SimpleNamespace(plan="pro", competitor_slots=2)
    monkeypatch.setattr(
        "platform_api.services.entitlements.resolve_sync",
        lambda email, db: ent,
    )
    fake_session = FakeSession()
    monkeypatch.setattr(
        "platform_api.db.session.SessionLocal", lambda: fake_session
    )
    _linked(monkeypatch, FakePool(), [
        "https://rival-a.com", "https://rival-b.com",
    ])

    with pytest.raises(HTTPException) as exc:
        _add("https://rival-c.com")
    assert exc.value.status_code == 403
    assert exc.value.detail == UPGRADE_403


# ─── scenario 2: persistence of rival audit link ─────────────────────────────


def test_run_competitor_audit_persists_link_row(monkeypatch):
    audit_id = str(uuid4())
    FakeAsyncClient.payload = {
        "audit_id": audit_id,
        "status": "completed",
        "score": 5.7,
        "findings": FINDINGS,
    }
    monkeypatch.setattr(competitor_routes.httpx, "AsyncClient", FakeAsyncClient)

    fake_session = FakeSession()
    monkeypatch.setattr("platform_api.db.session.SessionLocal", lambda: fake_session)

    pool = FakePool()
    monkeypatch.setattr(competitor_routes.audit_db, "pool", pool)

    tracking_id = str(uuid4())
    asyncio.run(
        competitor_routes._run_competitor_audit(
            tracking_id, USER_ID, "https://rival-a.com"
        )
    )

    inserts = [e for e in pool.log if e[0].startswith("INSERT INTO competitor_audits")]
    assert inserts, f"no competitor_audits insert recorded: {pool.log}"
    sql, params = inserts[0]
    assert "owner_email, competitor_url, audit_id" in sql
    assert params[0] == OWNER_EMAIL  # workspace owner, NOT synthetic email
    assert params[1] == "https://rival-a.com"
    assert params[2] == audit_id
    assert OWNER_EMAIL.split("@")[0] not in ("competitor+" + USER_ID)

    updates = [
        e for e in fake_session.executed if "UPDATE competitor_tracking" in e[0]
    ]
    assert updates, "last_score update lost"


# ─── scenario 3: gap logic + extraction helpers ───────────────────────────────


def test_compute_gaps_and_signal_extraction():
    from platform_api.services.competitor_analytics import compute_gaps
    from platform_api.services.signal_extract import (
        extract_finding_keys,
        extract_signal_map,
    )

    you_signals = extract_signal_map(ENGINE_OUTPUT)
    # >=8.0 passes; observed production rows put clean signals at 8-10 and
    # substantive issues at <=7.5
    assert you_signals == {
        "cta": False,
        "mobile": True,
        "headline": False,
        "above_fold": False,
        "ad_signals": False,
        "load_speed": True,
        "ai_readiness": False,
        "social_proof": True,
        "seo_foundations": False,
    }
    assert extract_finding_keys(ENGINE_OUTPUT) == [
        "cta",
        "above_fold",
        "headline",
        "ad_signals",
        "ai_readiness",
    ]
    # tolerate malformed / missing payloads (asyncpg jsonb arrives as a string)
    assert extract_signal_map(None) == {}
    assert extract_signal_map({"dimensions": {"x": "junk"}}) == {}
    assert extract_signal_map("not-json") == {}
    assert extract_finding_keys({"findings": "not-a-list"}) == []
    str_payload = extract_signal_map(
        __import__("json").dumps(ENGINE_OUTPUT)
    )
    assert str_payload["mobile"] is True and str_payload["cta"] is False
    assert extract_finding_keys({"findings": "not-a-list"}) == []

    rival_output = {
        "dimensions": {
            **DIMENSIONS,
            "mobile": {"score": 3.0},           # rival fails where you pass
            "social_proof": {"score": 2.0},     # rival fails where you pass
            "seo_foundations": {"score": 9.0},  # rival passes where you fail
        },
    }
    rival_signals = extract_signal_map(rival_output)

    gaps = compute_gaps(you_signals, rival_signals)
    assert gaps["your_edge"] == ["mobile", "social_proof"]
    assert gaps["threats"] == ["seo_foundations"]
