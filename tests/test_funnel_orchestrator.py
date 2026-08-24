"""Phase 3 Task 6: funnel orchestrator.

Mock-pool tests over the real funnel service + audit_api route functions:

    create_run(email, domain, ent, pool, create_audit=None)
        free -> one lifetime teaser run (count(plan_snapshot='teaser')=0),
                fan-out capped at TEASER_FUNNEL_URLS
        paid -> calendar-month count vs funnel_runs_per_month (None=unlimited),
                fan-out capped at funnel_urls_per_run
        atomic one-active-run-per-domain via WHERE NOT EXISTS insert plus
        the partial unique index (UniqueViolationError -> 409)

    sweep_completed(pool) reconciles funnel_pages from their linked audits
    and aggregates scorecards for fully-terminal runs.
"""

import json
import uuid

import pytest
from asyncpg.exceptions import UniqueViolationError
from fastapi import HTTPException

from platform_api.routes import audit_api
from platform_api.services import funnel
from platform_api.services.audit_db import audit_db
from platform_api.services.entitlements import (
    TEASER_FUNNEL_URLS,
    Entitlements,
)


EMAIL = "owner@example.com"
DOMAIN = "example.com"
RUN_ID = "11111111-1111-1111-1111-111111111111"


def _ent(plan="free"):
    if plan == "pro":
        return Entitlements(
            plan="pro", status="active", audits_per_month=20,
            monitored_urls=3, min_interval_hours=720, competitor_slots=2,
            funnel_runs_per_month=3, funnel_urls_per_run=10,
            analytics_depth="percentile")
    if plan == "agency":
        return Entitlements(
            plan="agency", status="active", audits_per_month=None,
            monitored_urls=None, min_interval_hours=168, competitor_slots=10,
            funnel_runs_per_month=None, funnel_urls_per_run=100,
            analytics_depth="segment")
    return Entitlements(plan="free", status="active", audits_per_month=1,
                        monitored_urls=0, min_interval_hours=None)


class FakePool:
    def __init__(self, conn):
        self._conn = conn

    def acquire(self):
        import contextlib

        @contextlib.asynccontextmanager
        async def _ctx():
            yield self._conn
        return _ctx()


class GateConn:
    """Scripts gate queries, the run insert, page inserts, run updates."""

    def __init__(self, teaser_count=0, month_count=0, insert_row={"id": RUN_ID},
                 insert_error=None, active_after_insert=1):
        self.teaser_count = teaser_count
        self.month_count = month_count
        self.insert_row = insert_row
        self.insert_error = insert_error
        self.active_after_insert = active_after_insert
        self.executed = []
        self.run_insert_args = None
        self.inserted_pages = []

    async def fetchval(self, sql, *args):
        q = " ".join(str(sql).split())
        if "plan_snapshot='teaser'" in q or "plan_snapshot = 'teaser'" in q:
            return self.teaser_count
        if "date_trunc" in q:
            return self.month_count
        if "status IN ('discovering','running')" in q and "COUNT(*)" in q:
            return self.active_after_insert
        return None

    async def fetchrow(self, sql, *args):
        q = " ".join(str(sql).split())
        if "INSERT INTO funnel_runs" in q:
            if self.insert_error is not None:
                raise self.insert_error
            self.run_insert_args = args
            return self.insert_row
        if "INSERT INTO funnel_pages" in q:
            self.inserted_pages.append(args)
            return {"id": f"page-{len(self.inserted_pages)}"}
        return None

    async def execute(self, sql, *args):
        self.executed.append((" ".join(str(sql).split()), args))

    async def fetch(self, sql, *args):
        return []


def _patch_queue(monkeypatch):
    kicks = []
    discovered = [f"https://example.com/p{i}" for i in range(5)]

    async def _kick():
        kicks.append(True)

    async def _discover(dom):
        return list(discovered)

    audits = []

    async def _create_audit(*, url, email, source=None, **kw):
        audits.append({"url": url, "email": email, "source": source})
        return uuid.uuid4()

    monkeypatch.setattr(funnel, "kick", _kick)
    monkeypatch.setattr(funnel, "discover_urls", _discover)
    return kicks, audits, _create_audit


# ─── pure URL normalization / sitemap parsing ────────────────────────────────


def test_normalize_url_rules():
    assert funnel.normalize_url("https://example.com/") == \
        "https://example.com/"
    # bare host normalizes to the root form
    assert funnel.normalize_url("https://example.com") == \
        "https://example.com/"
    assert funnel.normalize_url("https://EXAMPLE.com/About/") == \
        "https://example.com/About"
    assert funnel.normalize_url("http://example.com/pricing") == \
        "http://example.com/pricing"
    assert funnel.normalize_url("ftp://example.com/x") is None
    assert funnel.normalize_url("mailto:x@example.com") is None
    assert funnel.normalize_url("https://example.com/logo.png") is None
    assert funnel.normalize_url("https://example.com/sitemap.xml") is None
    assert funnel.normalize_url("https://example.com/doc.pdf") is None
    assert funnel.normalize_url("https://example.com/img.webp") is None


def test_sitemap_parse_normalizes_dedupes_in_order():
    xml = """<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://example.com/b</loc></url>
      <url><loc> https://example.com/a </loc></url>
      <url><loc>https://EXAMPLE.com/b/</loc></url>
      <url><loc>https://example.com/a.png</loc></url>
      <url><loc>ftp://example.com/skip</loc></url>
    </urlset>"""
    assert funnel.discover_from_sitemap(xml) == [
        "https://example.com/b", "https://example.com/a"]


def test_sitemap_parse_tolerates_garbage():
    assert funnel.discover_from_sitemap("<not-xml") == []
    assert funnel.discover_from_sitemap("") == []


async def test_discover_urls_fetches_https_sitemap(monkeypatch):
    seen = {}

    class FakeResponse:
        status_code = 200
        content = (b"<urlset><url><loc>https://x.io/p</loc></url></urlset>")

    class FakeClient:
        def __init__(self, **kwargs):
            seen["timeout"] = kwargs.get("timeout")
            seen["follow_redirects"] = kwargs.get("follow_redirects")

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, url):
            seen["url"] = url
            return FakeResponse()

    monkeypatch.setattr(funnel.httpx, "AsyncClient", FakeClient)
    assert await funnel.discover_urls("x.io") == ["https://x.io/p"]
    assert seen["url"] == "https://x.io/sitemap.xml"
    assert seen["timeout"] == 15.0
    assert seen["follow_redirects"] is True


async def test_discover_urls_http_failure_yields_empty(monkeypatch):
    class BoomClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, url):
            raise OSError("connection refused")

    monkeypatch.setattr(funnel.httpx, "AsyncClient", BoomClient)
    assert await funnel.discover_urls("down.io") == []


# ─── gating: teaser lifetime rule ────────────────────────────────────────────


async def test_teaser_lifetime_rule_blocks_second_free_run():
    conn = GateConn(teaser_count=1)
    with pytest.raises(HTTPException) as exc:
        await funnel.create_run(EMAIL, DOMAIN, _ent("free"), FakePool(conn))
    assert exc.value.status_code == 403
    detail = exc.value.detail
    assert detail.get("upgrade_url") == "/pricing"
    assert detail.get("message")


async def test_first_teaser_run_allowed_and_capped(monkeypatch):
    kicks, audits, create_audit = _patch_queue(monkeypatch)
    conn = GateConn()
    result = await funnel.create_run(EMAIL, DOMAIN, _ent("free"),
                                     FakePool(conn), create_audit=create_audit)
    # teaser cap beats the fixture's zero urls_per_run for free plans
    assert len(conn.inserted_pages) == TEASER_FUNNEL_URLS == 3
    assert result["requested_count"] == 3
    assert result["discovered_count"] == 5
    assert result["status"] == "running"
    # pages are normal audits owned by the requester with source='funnel'
    assert all(a["source"] == "funnel" for a in audits)
    assert all(a["email"] == EMAIL for a in audits)
    assert len(audits) == 3
    # run row snapshots the teaser plan
    assert conn.run_insert_args[2] == "teaser"
    assert kicks == [True]


async def test_teaser_cap_never_exceeds_three_even_for_paid_fixture_leak():
    conn = GateConn(teaser_count=2)
    with pytest.raises(HTTPException) as exc:
        await funnel.create_run(EMAIL, DOMAIN, _ent("free"), FakePool(conn))
    assert exc.value.status_code == 403


# ─── gating: paid monthly cap ────────────────────────────────────────────────


async def test_pro_monthly_cap_rejects_at_limit():
    conn = GateConn(month_count=3)  # pro funnel_runs_per_month = 3
    with pytest.raises(HTTPException) as exc:
        await funnel.create_run(EMAIL, DOMAIN, _ent("pro"), FakePool(conn))
    assert exc.value.status_code == 429
    assert exc.value.detail.get("limit") == 3


async def test_pro_under_cap_fans_out_to_urls_per_run(monkeypatch):
    kicks, audits, create_audit = _patch_queue(monkeypatch)
    conn = GateConn(month_count=2)
    result = await funnel.create_run(EMAIL, DOMAIN, _ent("pro"),
                                     FakePool(conn), create_audit=create_audit)
    assert result["status"] == "running"
    assert result["requested_count"] == 5  # discovered 5, pro cap 10
    assert len(audits) == 5
    assert conn.run_insert_args[2] == "pro"
    assert kicks == [True]


async def test_agency_unlimited_month_skips_monthly_check(monkeypatch):
    kicks, _audits, create_audit = _patch_queue(monkeypatch)
    conn = GateConn(month_count=99999)
    result = await funnel.create_run(EMAIL, DOMAIN, _ent("agency"),
                                     FakePool(conn), create_audit=create_audit)
    assert result["status"] == "running"
    assert conn.run_insert_args[2] == "agency"


# ─── atomic one-active-run-per-domain ────────────────────────────────────────


async def test_second_active_run_filtered_out_is_conflict():
    conn = GateConn(insert_row=None)  # WHERE NOT EXISTS rejected us
    with pytest.raises(HTTPException) as exc:
        await funnel.create_run(EMAIL, DOMAIN, _ent("pro"), FakePool(conn))
    assert exc.value.status_code == 409
    assert exc.value.detail.get("message") == \
        "A run is already active for this domain"


async def test_unique_violation_maps_to_conflict_409():
    conn = GateConn(insert_error=UniqueViolationError(
        "uq_funnel_runs_active_domain"))
    with pytest.raises(HTTPException) as exc:
        await funnel.create_run(EMAIL, DOMAIN, _ent("pro"), FakePool(conn))
    assert exc.value.status_code == 409
    assert exc.value.detail.get("message") == \
        "A run is already active for this domain"


# ─── discovery failure persists a failed run, answers without raising ────────


async def test_discovery_failure_marks_run_failed_with_reason(monkeypatch):
    kicks, _audits, create_audit = _patch_queue(monkeypatch)

    async def _empty(dom):
        return []

    monkeypatch.setattr(funnel, "discover_urls", _empty)
    conn = GateConn(month_count=0)
    result = await funnel.create_run(EMAIL, "nebulacomponents.com",
                                     _ent("pro"), FakePool(conn))
    assert result["status"] == "failed"
    assert result["error"] == \
        "No sitemap found at https://nebulacomponents.com/sitemap.xml"
    failed_updates = [e for e in conn.executed
                      if "SET status='failed'" in e[0]]
    assert len(failed_updates) == 1
    payload = json.loads(failed_updates[0][1][1])
    assert payload["error"] == result["error"]


# ─── sweep aggregation math ──────────────────────────────────────────────────


class SweepConn:
    def __init__(self, runs, page_counts, done_rows):
        self.runs = runs
        self.page_counts = page_counts
        self.done_rows = done_rows
        self.executed = []
        self.finalized = []

    async def execute(self, sql, *args):
        q = " ".join(str(sql).split())
        self.executed.append((q, args))
        if q.startswith("UPDATE funnel_runs SET status"):
            self.finalized.append(args)

    async def fetch(self, sql, *args):
        q = " ".join(str(sql).split())
        if "FROM funnel_runs" in q and "status='running'" in q:
            return list(self.runs)
        if "GROUP BY status" in q:
            return list(self.page_counts)
        if "fp.status='done'" in q:
            return list(self.done_rows)
        return []

    async def fetchrow(self, sql, *args):
        return None

    async def fetchval(self, sql, *args):
        return None


def _engine(dimensions, findings):
    return {"dimensions": dimensions, "findings": findings}


DONE_ROWS_PARTIAL = [
    {
        "url": "https://example.com/a",
        "score": 55.0,
        "engine_output": _engine(
            {"cta": {"score": 5.0}, "mobile": {"score": 9.0}},
            [{"key": "cta", "quadrant": "quick_win"},
             {"key": "load_speed", "quadrant": "quick_win"}]),
    },
    {
        "url": "https://example.com/b",
        "score": 75.0,
        "engine_output": _engine(
            {"cta": {"score": 9.0}},
            [{"key": "cta", "quadrant": "quick_win"}]),
    },
    {
        "url": "https://example.com/c",
        "score": 65.0,
        "engine_output": _engine({}, []),
    },
]


def test_scorecard_math_partial():
    card = funnel.build_scorecard(DONE_ROWS_PARTIAL)
    assert card["domain_avg"] == 65.0
    # cta passed on 1 of 2 scored pages; mobile 1 of 1
    assert card["signal_pass_rates"] == {"cta": 0.5, "mobile": 1.0}
    assert card["worst_pages"] == [
        {"url": "https://example.com/a", "score": 55.0},
        {"url": "https://example.com/c", "score": 65.0},
        {"url": "https://example.com/b", "score": 75.0},
    ]
    # cta appears on two done pages -> recurring; load_speed only one -> dropped
    assert card["recurring_quick_wins"] == [
        {"finding_key": "cta", "count": 2}]


def test_scorecard_handles_empty_and_jsonb_strings():
    empty = funnel.build_scorecard([])
    assert empty["domain_avg"] is None
    assert empty["worst_pages"] == []
    rows = [{"url": "https://example.com/x", "score": "80",
             "engine_output": json.dumps({"dimensions": {"seo": {"score": 8}}})}]
    card = funnel.build_scorecard(rows)
    assert card["domain_avg"] == 80.0
    assert card["signal_pass_rates"] == {"seo": 1.0}


async def test_sweep_finalizes_partial_run_as_complete_partial():
    conn = SweepConn(
        runs=[{"id": RUN_ID, "domain": DOMAIN}],
        page_counts=[{"status": "done", "cnt": 3},
                     {"status": "failed", "cnt": 1}],
        done_rows=DONE_ROWS_PARTIAL)
    processed = await funnel.sweep_completed(FakePool(conn))
    assert processed == 1
    assert len(conn.finalized) == 1
    run_id, status, scorecard_json, coverage = conn.finalized[0]
    assert str(run_id) == RUN_ID
    assert status == "complete_partial"
    assert float(coverage) == 75.0
    card = json.loads(scorecard_json)
    assert card["domain_avg"] == 65.0


async def test_sweep_finalizes_clean_run_as_complete():
    conn = SweepConn(
        runs=[{"id": RUN_ID, "domain": DOMAIN}],
        page_counts=[{"status": "done", "cnt": 2}],
        done_rows=DONE_ROWS_PARTIAL[:2])
    processed = await funnel.sweep_completed(FakePool(conn))
    assert processed == 1
    _run_id, status, _card, coverage = conn.finalized[0]
    assert status == "complete"
    assert float(coverage) == 100.0


async def test_sweep_skips_nonterminal_runs():
    conn = SweepConn(
        runs=[{"id": RUN_ID, "domain": DOMAIN},
              {"id": "22222222-2222-2222-2222-222222222222",
               "domain": "other.com"}],
        page_counts=[{"status": "pending", "cnt": 2}],
        done_rows=[])
    processed = await funnel.sweep_completed(FakePool(conn))
    assert processed == 0
    assert conn.finalized == []


async def test_sweep_reconciles_page_states_from_audits_first():
    conn = SweepConn(runs=[], page_counts=[], done_rows=[])
    await funnel.sweep_completed(FakePool(conn))
    reconcile_sqls = [q for q, _args in conn.executed
                      if q.startswith("UPDATE funnel_pages")]
    assert any("a.status='completed'" in q for q in reconcile_sqls)
    assert any("a.status='failed'" in q for q in reconcile_sqls)


# ─── quota exemption: funnel audits never consume audits_per_month ──────────


async def test_quota_count_excludes_funnel_source_audits(monkeypatch):
    captured = {}

    class QuotaConn:
        async def fetchrow(self, sql, *args):
            captured["sql"] = " ".join(str(sql).split())
            return {"cnt": 7}

    async def _noop():
        return None

    monkeypatch.setattr(audit_db, "connect", _noop)
    monkeypatch.setattr(audit_db, "pool", FakePool(QuotaConn()))
    completed = await audit_db.count_completed_this_month(EMAIL.lower())
    assert "(source IS NULL OR source <> 'funnel')" in captured["sql"]
    assert completed == 7


# ─── routes ──────────────────────────────────────────────────────────────────


def _principal(email=EMAIL):
    from platform_api.auth.principal import (
        SCOPE_WORKSPACE_READ,
        SCOPE_WORKSPACE_WRITE,
        Principal,
    )
    return Principal(
        principal_type="user",
        principal_id="u1",
        workspace_email=email,
        email=email,
        scopes=frozenset({SCOPE_WORKSPACE_READ, SCOPE_WORKSPACE_WRITE}),
    )


async def test_post_route_gates_free_teaser_through_service(monkeypatch):
    async def _free(email):
        return _ent("free")

    class BoomPool:
        def acquire(self):  # pragma: no cover - gate must fire first
            raise AssertionError("gate must reject before touching pages")

    monkeypatch.setattr(audit_api, "resolve_for_email", _free)
    monkeypatch.setattr(audit_db, "connect", _noop_factory())

    conn = GateConn(teaser_count=1)
    monkeypatch.setattr(audit_db, "pool", FakePool(conn))
    with pytest.raises(HTTPException) as exc:
        await audit_api.create_funnel_run(
            audit_api.FunnelRunRequest(domain="https://example.com"),
            principal=_principal())
    assert exc.value.status_code == 403
    assert exc.value.detail.get("upgrade_url") == "/pricing"


def _noop_factory():
    async def _noop():
        return None
    return _noop


async def test_post_route_bad_domain_is_400(monkeypatch):
    monkeypatch.setattr(audit_db, "connect", _noop_factory())

    class BoomPool:
        def acquire(self):  # pragma: no cover
            raise AssertionError("bad domain must fail before any SQL")

    monkeypatch.setattr(audit_db, "pool", BoomPool())
    with pytest.raises(HTTPException) as exc:
        await audit_api.create_funnel_run(
            audit_api.FunnelRunRequest(domain="not-a-domain"),
            principal=_principal())
    assert exc.value.status_code == 400


async def test_get_route_returns_latest_run_with_pages_summary(monkeypatch):
    created = "2026-08-24T10:00:00+00:00"

    class StatusConn:
        async def fetchrow(self, sql, *args):
            return {
                "id": uuid.UUID(RUN_ID), "domain": DOMAIN,
                "status": "complete_partial", "requested_count": 4,
                "discovered_count": 12, "plan_snapshot": "pro",
                "scorecard": json.dumps({"domain_avg": 65.0}),
                "coverage_pct": None, "created_at": created,
                "completed_at": created,
            }

        async def fetch(self, sql, *args):
            return [
                {"url": "https://example.com/a", "status": "done",
                 "score": 55.0},
                {"url": "https://example.com/z", "status": "failed",
                 "score": None},
            ]

    async def _noop():
        return None

    monkeypatch.setattr(audit_db, "connect", _noop)
    monkeypatch.setattr(audit_db, "pool", FakePool(StatusConn()))
    out = await audit_api.get_latest_funnel_run(domain="example.com",
                                                principal=_principal())
    assert out["run"]["status"] == "complete_partial"
    assert out["run"]["plan"] == "pro"
    assert out["run"]["scorecard"] == {"domain_avg": 65.0}
    assert [p["status"] for p in out["pages"]] == ["done", "failed"]
    assert out["pages"][1]["score"] is None
