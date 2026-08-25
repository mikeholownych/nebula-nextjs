"""Task 4 Phase 3: benchmark rollups + personal positioning endpoint.

Fixture shapes mirror real completed nebula_audit rows (see
tests/test_competitor_analytics.py): engine_output.dimensions carries every
signal with a 0-10 score; extract_signal_map (Task 3) decides pass/fail at
PASS_THRESHOLD = 8.0.
"""

from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from platform_api.routes import audit_api
from platform_api.services import benchmark_rollups as br
from platform_api.auth.principal import (
    Principal,
    SCOPE_WORKSPACE_READ,
)


OWNER_EMAIL = "owner@example.com"


def _engine_output(**dim_scores):
    return {"dimensions": {k: {"score": s} for k, s in dim_scores.items()}}


def _row(email, url, score, dims):
    return {
        "email": email,
        "url": url,
        "score": score,
        "engine_output": _engine_output(**dims),
    }


# ─── fakes ────────────────────────────────────────────────────────────────────


class FakeConn:
    def __init__(self, corpus_rows):
        self._corpus_rows = corpus_rows
        self.inserts = []

    async def fetch(self, sql, *args):
        if "FROM audits" in sql:
            return list(self._corpus_rows)
        raise AssertionError(f"unexpected fetch: {sql}")

    async def fetchrow(self, sql, *args):
        if "INSERT INTO benchmark_rollups" in sql:
            window_days, sample_size, composite, signals = args
            self.inserts.append({
                "window_days": window_days,
                "sample_size": sample_size,
                "composite": composite,
                "signals": signals,
            })
            return {
                "id": 1,
                "computed_at": datetime.now(timezone.utc),
                "sample_size": sample_size,
                "composite": composite,
                "signals": signals,
            }
        if "FROM benchmark_rollups" in sql:
            return None
        raise AssertionError(f"unexpected fetchrow: {sql}")


class FakePool:
    def __init__(self, conn):
        self._conn = conn

    def acquire(self):
        import contextlib

        @contextlib.asynccontextmanager
        async def _ctx():
            yield self._conn
        return _ctx()


class FakeDB:
    def __init__(self, conn):
        self.pool = FakePool(conn)

    async def connect(self):
        pass


# ─── percentile_rank edges ──────────────────────────────────────────────────


def test_percentile_rank_empty_corpus_defaults_50():
    assert br.percentile_rank([], 71.0) == 50


def test_percentile_rank_below_all_is_zero():
    assert br.percentile_rank([40.0, 60.0], 10.0) == 0


def test_percentile_rank_above_all_is_hundred():
    assert br.percentile_rank([40.0, 60.0], 99.0) == 100


def test_percentile_rank_share_strictly_below():
    assert br.percentile_rank([1.0, 2.0, 3.0, 4.0], 3.0) == 50


# ─── interpolate_percentile ─────────────────────────────────────────────────


def test_interpolate_percentile_at_anchor_points():
    composite = {"p25": 40.0, "p50": 50.0, "p75": 60.0, "p90": 70.0}
    assert br.interpolate_percentile(composite, 50.0) == 50
    assert br.interpolate_percentile(composite, 40.0) == 25
    assert br.interpolate_percentile(composite, 70.0) == 90


def test_interpolate_percentile_clamps_ends():
    composite = {"p25": 40.0, "p50": 50.0, "p75": 60.0, "p90": 70.0}
    assert br.interpolate_percentile(composite, -5.0) == 0
    assert br.interpolate_percentile(composite, 150.0) == 100


def test_interpolate_percentile_accepts_jsonb_string():
    composite = '{"p25": 40.0, "p50": 50.0, "p75": 60.0, "p90": 70.0}'
    assert br.interpolate_percentile(composite, 50.0) == 50


def test_interpolate_percentile_missing_composite_defaults_50():
    assert br.interpolate_percentile(None, 55.0) == 50
    assert br.interpolate_percentile("not json", 55.0) == 50
    assert br.interpolate_percentile({"p25": 40}, 55.0) == 50


# ─── refresh_rollups ────────────────────────────────────────────────────────


def _corpus():
    return [
        _row("a@example.com", "https://a.example.com/", 60,
             {"cta": 0.0, "mobile": 10.0}),
        _row("b@corp.io", "https://b.corp.io/", 80,
             {"cta": 9.0, "mobile": 10.0}),
        # internal founder email must be excluded
        _row("mike.holownych@gmail.com", "https://x.io/", 95,
             {"cta": 10.0, "mobile": 10.0}),
        # self-owned domain must be excluded
        _row("founder@nebulacomponents.com", "https://nebulacomponents.com/", 99,
             {"cta": 10.0, "mobile": 10.0}),
    ]


@pytest.mark.asyncio
async def test_refresh_rollups_excludes_internal_and_self_and_inserts_one_row():
    conn = FakeConn(_corpus())
    summary = await br.refresh_rollups(days=90, db=FakeDB(conn))

    assert summary["sample_size"] == 2
    assert len(conn.inserts) == 1

    ins = conn.inserts[0]
    assert ins["window_days"] == 90
    assert ins["sample_size"] == 2

    composite = __import__("json").loads(ins["composite"])
    for key in ("p25", "p50", "p75", "p90"):
        assert key in composite
    # excluded founders scored 95/99; remaining corpus is 60/80 -> p50 in [60,80]
    assert composite["p25"] <= composite["p50"] <= composite["p75"] <= composite["p90"]
    assert 60.0 <= composite["p50"] <= 80.0

    signals = __import__("json").loads(ins["signals"])
    # cta passed in only one of the two kept audits
    assert signals["cta"]["ok_rate"] == pytest.approx(0.5)
    assert signals["mobile"]["ok_rate"] == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_refresh_rollups_empty_corpus_inserts_nothing():
    conn = FakeConn([])
    summary = await br.refresh_rollups(days=90, db=FakeDB(conn))
    assert summary["sample_size"] == 0
    assert conn.inserts == []


# ─── /audit/analytics/benchmarks/me ─────────────────────────────────────────


def _principal(email=OWNER_EMAIL):
    return Principal(
        principal_type="user",
        principal_id="u1",
        workspace_email=email,
        email=email,
        scopes=frozenset({SCOPE_WORKSPACE_READ}),
    )


class _Ent:
    def __init__(self, depth):
        self.plan = "pro"
        self.status = "active"
        self.analytics_depth = depth


@pytest.mark.asyncio
async def test_benchmarks_me_depth_none_gated_with_upgrade_shape(monkeypatch):
    async def _free(email):
        return _Ent("none")
    monkeypatch.setattr(audit_api, "resolve_for_email", _free)

    with pytest.raises(HTTPException) as exc:
        await audit_api.my_benchmark_position(domain="example.com",
                                              principal=_principal())
    assert exc.value.status_code == 403
    detail = exc.value.detail
    assert detail.get("upgrade_url") == "/pricing"
    assert detail.get("message")


@pytest.mark.asyncio
async def test_benchmarks_me_payload_shape(monkeypatch):
    async def _paid(email):
        return _Ent("percentile")

    async def _mine(email, domain, db=None):
        return {
            "score": 65,
            "engine_output": _engine_output(cta=3.0, mobile=10.0),
        }

    async def _rollup(db=None):
        return {
            "computed_at": datetime(2026, 8, 24, tzinfo=timezone.utc),
            "composite": {"p25": 40.0, "p50": 50.0, "p75": 60.0, "p90": 70.0},
            "signals": {"cta": {"ok_rate": 0.5}, "mobile": {"ok_rate": 1.0}},
        }

    monkeypatch.setattr(audit_api, "resolve_for_email", _paid)
    monkeypatch.setattr(br, "latest_completed_audit_for_domain", _mine)
    monkeypatch.setattr(br, "latest_rollup", _rollup)

    payload = await audit_api.my_benchmark_position(domain="example.com",
                                                    principal=_principal())

    assert set(payload.keys()) == {
        "overall_percentile", "computed_at", "signals", "depth"}
    # score 65 sits between p75=60 and p90=70 -> between 75 and 90
    assert 75 <= payload["overall_percentile"] <= 90
    assert payload["depth"] == "percentile"
    assert payload["computed_at"].startswith("2026-08-24")
    assert set(payload["signals"].keys()) == {"cta", "mobile"}
    assert payload["signals"]["cta"]["you_pass"] is False
    assert payload["signals"]["cta"]["corpus_ok_rate"] == pytest.approx(0.5)
    assert payload["signals"]["mobile"]["you_pass"] is True


@pytest.mark.asyncio
async def test_benchmarks_me_requires_tenant_binding(monkeypatch):
    anonymous = Principal(principal_type="user", principal_id="u1",
                          workspace_email=None, email=None,
                          scopes=frozenset({SCOPE_WORKSPACE_READ}))
    with pytest.raises(HTTPException) as exc:
        await audit_api.my_benchmark_position(domain="example.com",
                                              principal=anonymous)
    assert exc.value.status_code == 403
