"""Task 5 Phase 3: sequenced remediation programs.

Fixture shapes mirror real nebula_audit rows (captured 2026-08-24):

    recommendations = {"email", "url", "finding_key", "label", "impact",
                       "effort", "quadrant", "status", "verified_at"}
        status in to_fix|doing|done; verified_at timestamptz or None

    fix_implementations joins audits for URL matching:
        {"finding_key", "implemented", audit.url}
"""

import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from platform_api.routes import audit_api
from platform_api.services import programs
from platform_api.auth.principal import (
    Principal,
    SCOPE_WORKSPACE_READ,
    SCOPE_WORKSPACE_WRITE,
)


OWNER_EMAIL = "owner@example.com"
DOMAIN = "example.com"


def _rec(fk, url, impact, effort, quadrant="major_project",
         label=None, status="to_fix", verified_at=None):
    return {
        "url": url,
        "finding_key": fk,
        "label": label or fk.replace("_", " ").title(),
        "impact": impact,
        "effort": effort,
        "quadrant": quadrant,
        "status": status,
        "verified_at": verified_at,
    }


def _principal(email=OWNER_EMAIL):
    return Principal(
        principal_type="user",
        principal_id="u1",
        workspace_email=email,
        email=email,
        scopes=frozenset({SCOPE_WORKSPACE_READ, SCOPE_WORKSPACE_WRITE}),
    )


class _Ent:
    def __init__(self, plan="pro", status="active"):
        self.plan = plan
        self.status = status


# ─── derive_steps ordering ────────────────────────────────────────────────────


def test_derive_quick_wins_first_by_impact_desc():
    recs = [
        _rec("low_qw", "https://example.com/a", 3.0, 1.0, "quick_win"),
        _rec("high_mp", "https://example.com/b", 9.0, 8.0, "major_project"),
        _rec("high_qw", "https://example.com/c", 7.5, 2.0, "quick_win"),
    ]
    steps = programs.derive_steps(recs)
    assert [(s["stage"], s["finding_key"]) for s in steps] == [
        (1, "high_qw"),
        (1, "low_qw"),
        (2, "high_mp"),
    ]


def test_derive_stage_two_impact_desc_then_effort_asc():
    recs = [
        _rec("tie_b", "https://example.com/b", 5.0, 6.0),
        _rec("low", "https://example.com/d", 2.0, 1.0),
        _rec("tie_a", "https://example.com/a", 5.0, 3.0),
        _rec("top", "https://example.com/c", 8.0, 9.0),
    ]
    steps = programs.derive_steps(recs)
    assert [s["finding_key"] for s in steps] == ["top", "tie_a", "tie_b", "low"]
    assert all(s["stage"] == 2 for s in steps)
    # step dicts carry the fields a roadmap UI needs
    top = steps[0]
    assert top["title"] and top["impact"] == 8.0 and top["effort"] == 9.0
    assert top["url"] == "https://example.com/c"
    assert top["quadrant"] == "major_project"


# ─── derivation caps: a program is a SHORT roadmap ────────────────────────────


def _backlog(qw_count=30, mp_count=30):
    recs = [
        _rec(f"qw_{i:02d}", f"https://example.com/qw{i}", float(30 - i),
             1.0, "quick_win")
        for i in range(qw_count)
    ]
    recs += [
        _rec(f"mp_{i:02d}", f"https://example.com/mp{i}", float(30 - i),
             float(i % 5))
        for i in range(mp_count)
    ]
    return recs


def test_derivation_caps_at_ten_steps_per_stage():
    steps = programs.derive_steps(_backlog(30, 30))
    assert len(steps) == programs.MAX_STEPS_STAGE1 + programs.MAX_STEPS_STAGE2
    stage1 = [s for s in steps if s["stage"] == 1]
    stage2 = [s for s in steps if s["stage"] == 2]
    assert len(stage1) == programs.MAX_STEPS_STAGE1 == 10
    assert len(stage2) == programs.MAX_STEPS_STAGE2 == 10
    assert [s["finding_key"] for s in stage1] == [
        f"qw_{i:02d}" for i in range(10)]
    assert [s["finding_key"] for s in stage2] == [
        f"mp_{i:02d}" for i in range(10)]
    keys = {s["finding_key"] for s in steps}
    # ranks 11..30 of both stages stay in the recommendations kanban
    assert all(f"qw_{i:02d}" not in keys for i in range(10, 30))
    assert all(f"mp_{i:02d}" not in keys for i in range(10, 30))


def test_stage_two_cap_breaks_impact_ties_by_lowest_effort():
    recs = [
        _rec(f"tie_{i:02d}", f"https://example.com/t{i}", 6.0,
             float(15 - i))
        for i in range(15)
    ]
    stage2 = [s for s in programs.derive_steps(recs) if s["stage"] == 2]
    assert [s["finding_key"] for s in stage2] == [
        f"tie_{i:02d}" for i in range(14, 4, -1)]


def test_regeneration_does_not_resurrect_capped_out_steps():
    desired = programs.derive_steps(_backlog(30, 30))
    first = programs.reconcile_steps([], desired)
    assert len(first["insert"]) == 20

    stored = [dict(entry) for entry in first["insert"]]
    stable = programs.reconcile_steps(stored, desired)
    assert stable["insert"] == [] and stable["delete_ids"] == []

    # legacy bloated programs hold pending rows ranked below the caps:
    # regeneration trims them and a follow-up pass never re-adds them
    overflow = [
        _step("ov-qw10", "qw_10", "https://example.com/qw10", "pending"),
        _step("ov-qw11", "qw_11", "https://example.com/qw11", "pending"),
        _step("ov-mp10", "mp_10", "https://example.com/mp10", "pending",
              stage=2),
    ]
    trimmed = programs.reconcile_steps(stored + overflow, desired)
    assert sorted(trimmed["delete_ids"]) == ["ov-mp10", "ov-qw10",
                                             "ov-qw11"]
    assert trimmed["insert"] == []
    again = programs.reconcile_steps(trimmed["steps"], desired)
    assert again["insert"] == [] and again["delete_ids"] == []


def test_get_or_create_trims_legacy_overflow_to_caps(monkeypatch):
    monkeypatch.setattr(
        programs.domains, "registered_domain",
        lambda value: DOMAIN if "example.com" in value else None)
    legacy = [
        _step(f"s-legacy-{i:02d}", f"stale_{i:02d}",
              f"https://example.com/stale{i}", "pending",
              stage=1 if i < 20 else 2, seq=i + 1)
        for i in range(40)
    ]
    conn = ProgramFakeConn(
        rec_rows=_backlog(30, 30),
        active_program={"id": "p-old", "generated_at": None},
        existing_steps=legacy)
    payload = asyncio.run(programs.get_or_create_program(
        OWNER_EMAIL, DOMAIN, FakePool(conn)))

    open_steps = [s for s in payload["steps"] if s["status"] != "done"]
    assert len(open_steps) == 20
    deletes = [args for sql, args in conn.executed
               if sql.startswith("DELETE FROM program_steps")]
    assert len(deletes) == 40
    assert len(conn.inserted_steps) == 20


# ─── regeneration preserves history by (finding_key, url) ─────────────────────


def _step(step_id, fk, url, status, stage=1, seq=1):
    return {
        "id": step_id,
        "seq": seq,
        "stage": stage,
        "finding_key": fk,
        "url": url,
        "title": fk,
        "impact": 5.0,
        "effort": 3.0,
        "quadrant": "quick_win" if stage == 1 else "major_project",
        "status": status,
    }


def test_reconcile_preserves_done_and_drops_closed_pending():
    done = _step("s-done", "load_speed", "https://example.com/", "done")
    dismissed = _step("s-dis", "cta", "https://example.com/x", "dismissed")
    stale_pending = _step("s-stale", "headline", "https://example.com/y",
                          "pending", stage=2)
    existing = [done, dismissed, stale_pending]
    # open set changed: load_speed/cta satisfied so absent; headline fixed
    # upstream; fresh quick win appeared.
    desired = programs.derive_steps([
        _rec("social_proof", "https://example.com/z", 7.5, 2.0, "quick_win"),
    ])

    plan = programs.reconcile_steps(existing, desired)

    kept_ids = {s["id"] for s in plan["steps"]}
    assert "s-done" in kept_ids and "s-dis" in kept_ids
    assert "s-stale" not in kept_ids
    assert plan["delete_ids"] == ["s-stale"]
    inserted = plan["insert"]
    assert len(inserted) == 1
    assert inserted[0]["finding_key"] == "social_proof"
    assert inserted[0]["stage"] == 1
    # preserved history first, then open work in derive order; seq dense 1..n
    assert [s["id"] for s in plan["steps"]] == [
        "s-done", "s-dis", "new-0"]
    assert [s["seq"] for s in plan["steps"]] == [1, 2, 3]


def test_reconcile_keeps_open_pending_row_instead_of_duplicating():
    pending = _step("s-open", "ad_signals", "https://example.com/w",
                    "active", stage=2)
    desired = programs.derive_steps([
        _rec("ad_signals", "https://example.com/w", 3.8, 8.0),
    ])
    plan = programs.reconcile_steps([pending], desired)
    assert plan["insert"] == [] and plan["delete_ids"] == []
    assert [s["id"] for s in plan["steps"]] == ["s-open"]
    assert plan["steps"][0]["seq"] == 1


# ─── completion derivation from mocked recommendation / fix rows ──────────────


def test_done_index_from_rec_and_fix_rows():
    rec_rows = [
        {"url": "https://example.com/", "finding_key": "load_speed",
         "status": "done", "verified_at": None, "audit_id": "a1"},
        {"url": "https://example.com/about", "finding_key": "cta",
         "status": "to_fix", "verified_at": "2026-08-20T11:12:04+00:00",
         "audit_id": "a2"},
        {"url": "https://other.io/", "finding_key": "load_speed",
         "status": "done", "verified_at": None, "audit_id": "a3"},
    ]
    fix_rows = [
        {"url": "https://example.com/pricing", "finding_key": "above_fold"},
    ]
    # pure assembler over caller-supplied rows: domain filtering happens at
    # fetch time, so every provided row lands in the index verbatim
    idx = programs.build_done_index(rec_rows, fix_rows)
    assert idx[("load_speed", "https://example.com/")][0] == "done"
    assert idx[("cta", "https://example.com/about")] == (
        "verified", "a2")
    assert idx[("load_speed", "https://other.io/")][0] == "done"
    assert idx[("above_fold", "https://example.com/pricing")] == (
        "done", None)


def test_refresh_completion_flips_matched_steps_and_persists():
    steps = [
        _step("s1", "load_speed", "https://example.com/", "pending"),
        _step("s2", "headline", "https://example.com/y", "pending"),
    ]
    done_idx = {
        ("load_speed", "https://example.com/"): ("done", None),
    }
    conn = FakeCompletionConn()
    pool = FakePool(conn)

    updated = asyncio.run(programs.refresh_completion(
        OWNER_EMAIL, DOMAIN, pool, program_id="p1",
        steps=steps, done_index=done_idx))

    assert updated == [("s1", "done")]
    assert conn.updates == [("s1", "done", None)]


# ─── get_or_create_program end to end over a scripted fake pool ───────────────


class FakeCompletionConn:
    def __init__(self):
        self.executed = []

    @property
    def updates(self):
        return [args for sql, args in self.executed
                if sql.startswith("UPDATE program_steps SET status")]

    async def execute(self, sql, *args):
        self.executed.append((" ".join(str(sql).split()), args))

    async def fetch(self, sql, *args):
        return []

    async def fetchrow(self, sql, *args):
        return None


class FakePool:
    def __init__(self, conn):
        self._conn = conn

    def acquire(self):
        import contextlib

        @contextlib.asynccontextmanager
        async def _ctx():
            yield self._conn
        return _ctx()


class ProgramFakeConn(FakeCompletionConn):
    """Scripts the create path: no active program, two open recs."""

    def __init__(self, rec_rows, fixes=None, active_program=None,
                 existing_steps=None):
        super().__init__()
        self.rec_rows = rec_rows
        self.fixes = fixes or []
        self.active_program = active_program
        self.existing_steps = existing_steps or []
        self.inserted_steps = []
        self.program_inserted = False

    async def fetch(self, sql, *args):
        if "FROM recommendations" in sql:
            return list(self.rec_rows)
        if "FROM fix_implementations" in sql:
            return list(self.fixes)
        if "FROM program_steps" in sql:
            return list(self.existing_steps)
        return []

    async def fetchrow(self, sql, *args):
        if "FROM programs" in sql and "INSERT" not in sql:
            return self.active_program
        if "INSERT INTO programs" in sql:
            self.program_inserted = True
            return {"id": "p-new", "generated_at": None}
        if "INSERT INTO program_steps" in sql:
            self.inserted_steps.append(args)
            return {"id": f"new-{len(self.inserted_steps) - 1}"}
        if "UPDATE program_steps SET status" in sql:
            return None
        return await super().fetchrow(sql)


def test_get_or_create_returns_two_stage_sequenced_roadmap(monkeypatch):
    monkeypatch.setattr(
        programs.domains, "registered_domain",
        lambda value: DOMAIN if "example.com" in value else None)
    recs = [
        _rec("big_proj", "https://example.com/deep", 4.0, 9.0),
        _rec("fast_win", "https://example.com/", 7.5, 2.0, "quick_win"),
        _rec("tiny_win", "https://example.com/about", 4.0, 1.0, "quick_win"),
    ]
    conn = ProgramFakeConn(recs)
    payload = asyncio.run(programs.get_or_create_program(
        OWNER_EMAIL, DOMAIN, FakePool(conn)))

    assert conn.program_inserted is True
    steps = payload["steps"]
    assert [(s["stage"], s["finding_key"], s["seq"]) for s in steps] == [
        (1, "fast_win", 1),
        (1, "tiny_win", 2),
        (2, "big_proj", 3),
    ]
    assert payload["program"]["id"] == "p-new"


def test_get_or_create_regenerates_preserving_history(monkeypatch):
    monkeypatch.setattr(
        programs.domains, "registered_domain",
        lambda value: DOMAIN if "example.com" in value else None)
    existing = [
        _step("s-done", "load_speed", "https://example.com/", "done", seq=1),
        _step("s-gone", "headline", "https://example.com/y", "pending",
              stage=2, seq=2),
    ]
    conn = ProgramFakeConn(
        rec_rows=[_rec("fresh", "https://example.com/new", 6.0, 2.0)],
        active_program={"id": "p-old", "generated_at": None},
        existing_steps=existing)
    payload = asyncio.run(programs.get_or_create_program(
        OWNER_EMAIL, DOMAIN, FakePool(conn)))

    assert payload["program"]["id"] == "p-old"
    ids = {s["id"] for s in payload["steps"]}
    assert "s-done" in ids and "s-gone" not in ids
    # done history first, open work after, dense sequence
    assert [(s["seq"], s["status"]) for s in payload["steps"]] == [
        (1, "done"), (2, "pending")]


def test_completion_flip_visible_on_next_read(monkeypatch):
    """Demoable contract: completing a recommendation flips its step to done
    on next read."""
    monkeypatch.setattr(
        programs.domains, "registered_domain",
        lambda value: DOMAIN if "example.com" in value else None)
    steps = [
        dict(_step("s-live", "social_proof", "https://example.com/about",
                   "pending"), seq=1),
    ]
    conn = ProgramFakeConn(
        rec_rows=[
            _rec("social_proof", "https://example.com/about", 7.5, 2.0,
                 "quick_win", status="done"),
        ],
        active_program={"id": "p-old", "generated_at": None},
        existing_steps=steps)
    payload = asyncio.run(programs.get_or_create_program(
        OWNER_EMAIL, DOMAIN, FakePool(conn)))
    live = [s for s in payload["steps"] if s["id"] == "s-live"][0]
    assert live["status"] == "done"
    assert conn.updates == [("s-live", "done", None)]


# ─── route gate ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_program_route_gated_to_paid_plans(monkeypatch):
    async def _free(email):
        return _Ent(plan="free")

    async def _error(email):
        return _Ent(plan="pro", status="error")

    class BoomPool:
        def acquire(self):  # pragma: no cover - gate must fire first
            raise AssertionError("pool must not be touched for gated plans")

    monkeypatch.setattr(audit_api.audit_db, "pool", BoomPool())

    monkeypatch.setattr(audit_api, "resolve_for_email", _free)
    with pytest.raises(HTTPException) as exc:
        await audit_api.get_remediation_program(domain="example.com",
                                                principal=_principal())
    assert exc.value.status_code == 403
    detail = exc.value.detail
    assert detail.get("upgrade_url") == "/pricing"
    assert detail.get("message")

    monkeypatch.setattr(audit_api, "resolve_for_email", _error)
    with pytest.raises(HTTPException) as exc:
        await audit_api.get_remediation_program(domain="example.com",
                                                principal=_principal())
    assert exc.value.status_code == 403


# ─── dismissal persists across regeneration ───────────────────────────────────


def test_dismissed_step_survives_regeneration():
    dismissed = _step("s-dis", "cta", "https://example.com/x", "dismissed")
    desired = programs.derive_steps([
        _rec("cta", "https://example.com/x", 5.0, 1.0, "quick_win"),
    ])
    plan = programs.reconcile_steps([dismissed], desired)
    assert plan["insert"] == []
    assert [s["id"] for s in plan["steps"]] == ["s-dis"]
    assert plan["steps"][0]["status"] == "dismissed"
