"""Funnel orchestrator (Phase 3 Task 6).

POST /audit/funnel/runs discovers a domain's sitemap URLs and fans them out
as source='funnel' page audits through the normal queue (AuditDB.create_audit
+ audit_runner.kick). The hourly cron sweep reconciles funnel_pages state
from their linked audits and aggregates a scorecard once every page of a run
reached a terminal state.

Gating: free plans get exactly one lifetime teaser run capped at
TEASER_FUNNEL_URLS; paid plans are bounded per calendar month by
funnel_runs_per_month (null = unlimited) with fan-out capped at
funnel_urls_per_run. Funnel page audits never consume audits_per_month:
they are covered by the run entitlement, and count_completed_this_month
filters source <> 'funnel'.

One active run per domain is enforced atomically by the partial unique index
uq_funnel_runs_active_domain (status IN discovering, running); the insert
uses WHERE NOT EXISTS plus a post-insert re-check so both racing paths land
on the same 409.
"""

import json
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

import httpx
from asyncpg.exceptions import UniqueViolationError
from fastapi import HTTPException

from platform_api.services.audit_runner import kick
from platform_api.services.entitlements import TEASER_FUNNEL_URLS
from platform_api.services.signal_extract import extract_signal_map

_ASSET_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".xml", ".svg", ".webp",
)

_CONFLICT_MESSAGE = "A run is already active for this domain"


def _no_sitemap_error(dom: str) -> str:
    return f"No sitemap found at https://{dom}/sitemap.xml"


def normalize_domain(value) -> str | None:
    """Host-only lowercase domain from raw user input ('https://Www.X.io/')."""
    raw = (value or "").strip().lower()
    if not raw:
        return None
    candidate = raw if "://" in raw else "https://" + raw
    try:
        parsed = urlparse(candidate)
    except ValueError:
        return None
    host = parsed.hostname or ""
    host = host.strip(".")
    if not host or "." not in host:
        return None
    return host


def normalize_url(raw) -> str | None:
    """Keep http(s) pages only: lowercase host, strip trailing slash except
    root, drop obvious asset extensions. None means 'not a funnel page'."""
    if not raw:
        return None
    value = str(raw).strip()
    if not value:
        return None
    try:
        parsed = urlparse(value)
    except ValueError:
        return None
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return None
    path = parsed.path or "/"
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/") or "/"
    lowered = path.lower()
    if any(lowered.endswith(ext) for ext in _ASSET_EXTENSIONS):
        return None
    url = f"{parsed.scheme}://{parsed.hostname.lower()}{path}"
    if parsed.query:
        url += "?" + parsed.query
    return url


def discover_from_sitemap(content) -> list[str]:
    """<loc> entries -> normalized deduped URLs, input order preserved."""
    try:
        root = ET.fromstring(content)
    except ET.ParseError:
        return []
    urls: list[str] = []
    seen: set[str] = set()
    for node in root.iter():
        tag = getattr(node, "tag", "")
        if isinstance(tag, str) and tag.rsplit("}", 1)[-1].lower() == "loc":
            norm = normalize_url((node.text or "").strip())
            if norm and norm not in seen:
                seen.add(norm)
                urls.append(norm)
    return urls


async def discover_urls(domain: str) -> list[str]:
    """Fetch https://<domain>/sitemap.xml (15s, redirects followed). Any
    failure yields [] - the caller turns that into a failed run row."""
    sitemap_url = f"https://{domain}/sitemap.xml"
    try:
        async with httpx.AsyncClient(timeout=15.0,
                                     follow_redirects=True) as client:
            resp = await client.get(sitemap_url)
    except Exception:  # noqa: BLE001 - discovery failure is a failed run
        return []
    if resp.status_code != 200:
        return []
    return discover_from_sitemap(resp.content)


async def _gate(email: str, ent, conn) -> tuple[str, int]:
    """(plan_snapshot, url_cap) or HTTPException on denial.

    Gate order note: free-plan lifetime check fires BEFORE the one-active-per-domain
    INSERT (which would yield 409). This means a free user whose teaser is exhausted
    receives 403 even when they also have a conflicting active run.  The 409 conflict
    path is therefore only reachable by paid plans.  Denial semantics are correct in
    both cases; the ordering is intentional (lifetime block is the stronger constraint).
    """
    plan = getattr(ent, "plan", "free")
    degraded = getattr(ent, "status", "error") == "error"
    if degraded or plan == "free":
        prior = await conn.fetchval(
            """SELECT COUNT(*) FROM funnel_runs
               WHERE email=$1 AND plan_snapshot='teaser'""", email)
        if int(prior or 0) > 0:
            raise HTTPException(status_code=403, detail={
                "message": "Your free teaser funnel has already been used",
                "upgrade_url": "/pricing"})
        return "teaser", TEASER_FUNNEL_URLS
    monthly_cap = getattr(ent, "funnel_runs_per_month", 0)
    if monthly_cap is not None:
        used = await conn.fetchval(
            """SELECT COUNT(*) FROM funnel_runs WHERE email=$1
               AND created_at >= date_trunc('month',
                                           NOW() AT TIME ZONE 'UTC')""",
            email)
        if int(used or 0) >= int(monthly_cap):
            raise HTTPException(status_code=429, detail={
                "message": "Funnel run limit reached for this month",
                "limit": int(monthly_cap)})
    url_cap = max(int(getattr(ent, "funnel_urls_per_run", 0) or 0), 0)
    return plan, url_cap


async def _insert_run(email: str, dom: str, plan_snapshot: str, conn):
    """Atomic active-run claim; every race path collapses to 409."""
    try:
        row = await conn.fetchrow(
            """INSERT INTO funnel_runs (email, domain, status, plan_snapshot)
               SELECT $1, $2, 'discovering', $3
               WHERE NOT EXISTS (
                   SELECT 1 FROM funnel_runs
                   WHERE domain=$2 AND status IN ('discovering','running'))
               RETURNING id""",
            email, dom, plan_snapshot)
    except UniqueViolationError:
        raise HTTPException(status_code=409,
                            detail={"message": _CONFLICT_MESSAGE})
    if row is None:
        raise HTTPException(status_code=409,
                            detail={"message": _CONFLICT_MESSAGE})
    # Post-insert re-check over the partial unique index: exactly our row may
    # hold the slot. Unreachable under the index; kept as the documented belt.
    active = await conn.fetchval(
        """SELECT COUNT(*) FROM funnel_runs
           WHERE domain=$1 AND status IN ('discovering','running')""", dom)
    if int(active or 0) != 1:  # pragma: no cover - index guarantees 1
        raise HTTPException(status_code=409,
                            detail={"message": _CONFLICT_MESSAGE})
    return row["id"]


async def fan_out(run_id, *, email: str, discovered: list[str], url_cap: int,
                  pool, create_audit=None) -> int:
    """Insert capped funnel_pages rows with one source='funnel' audit each,
    flip the run to running, then wake the queue workers."""
    if create_audit is None:
        from platform_api.services.audit_db import audit_db
        create_audit = audit_db.create_audit
    capped = list(discovered)[:max(int(url_cap or 0), 0)]
    inserted = 0
    async with pool.acquire() as conn:
        for url in capped:
            try:
                audit_id = await create_audit(url=url, email=email,
                                              source="funnel")
            except Exception:  # noqa: BLE001 - stop fanning, keep the run
                break
            await conn.fetchrow(
                """INSERT INTO funnel_pages (run_id, url, audit_id)
                   VALUES ($1, $2, $3) RETURNING id""", run_id, url, audit_id)
            inserted += 1
        if inserted:
            await conn.execute(
                """UPDATE funnel_runs SET requested_count=$2,
                       discovered_count=$3, status='running' WHERE id=$1""",
                run_id, inserted, len(discovered))
        else:
            await _mark_failed(run_id, "No pages could be enqueued", conn)
    await kick()
    return inserted


async def _mark_failed(run_id, error: str, conn) -> None:
    await conn.execute(
        """UPDATE funnel_runs SET status='failed', completed_at=now(),
               scorecard=$2::jsonb WHERE id=$1""",
        run_id, json.dumps({"error": error}))


async def create_run(email: str, domain: str, ent, pool,
                     create_audit=None) -> dict:
    """Gate -> atomic insert -> discover -> fan out. Discovery failure keeps
    the run row as status='failed' with the reason in scorecard.error and
    answers 200 (the caller sees the failure payload)."""
    dom = normalize_domain(domain)
    if dom is None:
        raise HTTPException(status_code=400, detail="Bad domain")
    async with pool.acquire() as conn:
        plan_snapshot, url_cap = await _gate(email, ent, conn)
        run_id = await _insert_run(email, dom, plan_snapshot, conn)
    try:
        discovered = await discover_urls(dom)
    except Exception:  # noqa: BLE001 - discovery failure is a failed run
        discovered = []
    if not discovered:
        async with pool.acquire() as conn:
            await _mark_failed(run_id, _no_sitemap_error(dom), conn)
        return {"run_id": str(run_id), "domain": dom, "status": "failed",
                "discovered_count": 0, "requested_count": 0,
                "error": _no_sitemap_error(dom)}
    requested = await fan_out(run_id, email=email, discovered=discovered,
                              url_cap=url_cap, pool=pool,
                              create_audit=create_audit)
    return {"run_id": str(run_id), "domain": dom, "status": "running",
            "discovered_count": len(discovered), "requested_count": requested}


def build_scorecard(done_rows) -> dict:
    """Pure aggregation over done-page rows {url, score, engine_output}."""
    scored = [(r.get("url"), _num(r.get("score"))) for r in done_rows
              if r.get("score") is not None]
    domain_avg = (round(sum(s for _, s in scored) / len(scored), 1)
                  if scored else None)
    tally: dict[str, list[int]] = {}
    quick_wins: dict[str, int] = {}
    for r in done_rows:
        for key, passed in extract_signal_map(r.get("engine_output")).items():
            bucket = tally.setdefault(key, [0, 0])
            bucket[1] += 1
            if passed:
                bucket[0] += 1
        output = r.get("engine_output")
        if isinstance(output, str):
            try:
                output = json.loads(output)
            except json.JSONDecodeError:
                output = {}
        findings = output.get("findings") if isinstance(output, dict) else None
        for f in findings or []:
            if not isinstance(f, dict):
                continue
            key = f.get("key")
            if key and f.get("quadrant") == "quick_win":
                quick_wins[str(key)] = quick_wins.get(str(key), 0) + 1
    return {
        "domain_avg": domain_avg,
        "signal_pass_rates": {
            key: round(passes / total, 2)
            for key, (passes, total) in sorted(tally.items())
        },
        "worst_pages": [
            {"url": u, "score": round(s, 1)}
            for u, s in sorted(scored, key=lambda p: p[1])[:5]
        ],
        "recurring_quick_wins": [
            {"finding_key": key, "count": count}
            for key, count in sorted(quick_wins.items(),
                                     key=lambda kv: (-kv[1], kv[0]))
            if count > 1
        ],
    }


def _num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


async def sweep_completed(pool) -> int:
    """Reconcile funnel_pages from their linked audits, then finalize every
    running run whose pages are all terminal. Returns processed runs."""
    processed = 0
    async with pool.acquire() as conn:
        # Nothing else writes funnel_pages terminal states: derive them from
        # the audits table (source of truth) before checking completeness.
        await conn.execute(
            """UPDATE funnel_pages fp SET status='done', score=a.score,
                   updated_at=now()
               FROM audits a
               WHERE fp.audit_id=a.id AND a.status='completed'
                 AND fp.status IN ('pending','running')""")
        await conn.execute(
            """UPDATE funnel_pages fp SET status='failed', updated_at=now()
               FROM audits a
               WHERE fp.audit_id=a.id AND a.status='failed'
                 AND fp.status IN ('pending','running')""")
        runs = await conn.fetch(
            "SELECT id, domain FROM funnel_runs WHERE status='running'")
        for run in runs:
            counts = {r["status"]: int(r["cnt"]) for r in await conn.fetch(
                """SELECT status, COUNT(*) AS cnt FROM funnel_pages
                   WHERE run_id=$1 GROUP BY status""", run["id"])}
            if counts.get("pending", 0) or counts.get("running", 0):
                continue
            done = counts.get("done", 0)
            failed = counts.get("failed", 0)
            terminal = done + failed
            if terminal == 0:
                continue
            coverage = round(done / terminal * 100, 2)
            new_status = "complete" if failed == 0 else "complete_partial"
            done_rows = [
                dict(r) for r in await conn.fetch(
                    """SELECT fp.url AS url, a.score AS score,
                              a.engine_output AS engine_output
                       FROM funnel_pages fp
                       LEFT JOIN audits a ON a.id = fp.audit_id
                       WHERE fp.run_id=$1 AND fp.status='done'
                       ORDER BY fp.created_at""", run["id"])]
            scorecard = build_scorecard(done_rows)
            await conn.execute(
                """UPDATE funnel_runs SET status=$2, scorecard=$3::jsonb,
                       coverage_pct=$4, completed_at=now() WHERE id=$1""",
                run["id"], new_status, json.dumps(scorecard), coverage)
            processed += 1
    return processed
