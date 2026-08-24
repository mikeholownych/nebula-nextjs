"""Remediation programs (Phase 3 Task 5).

Turns the recommendation backlog for one workspace email + domain into a
two-stage sequenced roadmap persisted in programs / program_steps:

    stage 1 = quadrant 'quick_win', impact DESC
    stage 2 = everything else,      impact DESC then effort ASC

Completion is derived live on every read: a step flips to done/verified when
its matching recommendations row is done or verified, or when an implemented
fix_implementations row exists for the same finding on the same URL. Open
steps are regenerated from the current backlog while done / verified /
dismissed history is preserved by (finding_key, url).
"""

from platform_api.services import domains
from platform_api.services.domains import registered_domain


def _num(value):
    try:
        return float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def derive_steps(open_recs) -> list[dict]:
    """Pure: order the open backlog into sequenced step dicts.

    Input rows need url, finding_key, label, impact, effort, quadrant.
    Output preserves every field a roadmap UI renders plus its stage; the
    list order IS the execution sequence.
    """
    quick = []
    rest = []
    for rec in open_recs or []:
        quadrant = rec.get("quadrant")
        entry = {
            "finding_key": rec["finding_key"],
            "url": rec["url"],
            "title": rec.get("label") or str(rec["finding_key"]),
            "impact": _num(rec.get("impact")),
            "effort": _num(rec.get("effort")),
            "quadrant": quadrant,
            "stage": 1 if quadrant == "quick_win" else 2,
        }
        (quick if entry["stage"] == 1 else rest).append(entry)
    quick.sort(key=lambda s: -s["impact"])
    rest.sort(key=lambda s: (-s["impact"], s["effort"]))
    return quick + rest


def reconcile_steps(existing_steps, desired) -> dict:
    """Pure: merge derived desired steps against stored steps.

    - done / verified / dismissed rows are history: preserved verbatim
    - pending / active rows survive only while their (finding_key, url)
      stays in the desired open set
    - desired entries with no surviving row become insert candidates
      (placeholder ids 'new-<i>')
    Returns {"steps", "insert", "delete_ids"} with seq reassigned dense:
    preserved history first (stored order), then open work in derive order.
    """
    satisfied_states = {"done", "verified", "dismissed"}
    desired_keys = {(e["finding_key"], e["url"]) for e in desired or []}
    preserved = []
    kept = {}
    deletable = []
    for row in existing_steps or []:
        key = (row["finding_key"], row["url"])
        if row["status"] in satisfied_states:
            preserved.append(row)
        elif key in desired_keys:
            kept[key] = row
        else:
            deletable.append(row)
    preserved_keys = {(r["finding_key"], r["url"]) for r in preserved}

    inserts = []
    final = list(preserved)
    for entry in desired or []:
        key = (entry["finding_key"], entry["url"])
        if key in preserved_keys:
            # history wins over the open backlog: never duplicate
            continue
        match = kept.pop(key, None)
        if match is not None:
            merged = dict(match)
            merged.update(entry)
            final.append(merged)
        else:
            fresh = dict(entry)
            fresh["id"] = f"new-{len(inserts)}"
            fresh["status"] = "pending"
            inserts.append(fresh)
            final.append(fresh)

    for seq, step in enumerate(final, start=1):
        step["seq"] = seq
    return {
        "steps": final,
        "insert": inserts,
        "delete_ids": [row["id"] for row in deletable],
    }


def build_done_index(rec_rows, fix_rows) -> dict:
    """Pure: {(finding_key, url): ("done"|"verified", audit_id|None)}.

    rec_rows carry status/verified_at/audit_id per (url, finding_key);
    fix_rows are implemented fix_implementations joined to their audit's
    url. Caller passes already domain-scoped rows. A verified state wins
    over plain done.
    """
    index: dict[tuple, tuple] = {}
    rank = {"done": 1, "verified": 2}
    for row in rec_rows or []:
        if row.get("verified_at"):
            state, audit_id = "verified", row.get("audit_id")
        elif row.get("status") == "done":
            state, audit_id = "done", row.get("audit_id")
        else:
            continue
        key = (row["finding_key"], row["url"])
        current = index.get(key)
        if current is None or rank[state] > rank[current[0]]:
            index[key] = (state, audit_id)
    for row in fix_rows or []:
        key = (row["finding_key"], row["url"])
        current = index.get(key)
        if current is None or rank["done"] > rank[current[0]]:
            index[key] = ("done", None)
    return index


async def _implemented_fixes(conn, email):
    return await conn.fetch(
        """SELECT a.url AS url, fi.finding_key AS finding_key
           FROM fix_implementations fi
           JOIN audits a ON a.id = fi.audit_id
           WHERE fi.email=$1 AND fi.implemented = true""", email)


async def refresh_completion(email, domain, pool, program_id=None,
                             steps=None, done_index=None):
    """Flip pending/active steps whose work is complete; persist updates.

    Accepts preloaded steps/done_index (read path reuse); otherwise loads
    them for the active program. Returns [(step_id, new_status)].
    """
    async with pool.acquire() as conn:
        if program_id is None or steps is None or done_index is None:
            prog = await conn.fetchrow(
                """SELECT id FROM programs
                   WHERE email=$1 AND domain=$2 AND status='active'
                   LIMIT 1""", email, domain)
            if prog is None:
                return []
            program_id = prog["id"]
            steps = await conn.fetch(
                "SELECT * FROM program_steps WHERE program_id=$1 "
                "ORDER BY seq", program_id)
            rec_rows = await conn.fetch(
                """SELECT url, finding_key, status, verified_at, audit_id
                   FROM recommendations WHERE email=$1""", email)
            fix_rows = await _implemented_fixes(conn, email)
            done_index = build_done_index(rec_rows, fix_rows)
        updated = []
        for step in steps:
            if step["status"] not in ("pending", "active"):
                continue
            hit = done_index.get((step["finding_key"], step["url"]))
            if not hit:
                continue
            new_status = hit[0]
            await conn.execute(
                "UPDATE program_steps SET status=$2,"
                " verified_audit_id=COALESCE($3, verified_audit_id),"
                " updated_at=now() WHERE id=$1",
                step["id"], new_status, hit[1])
            step["status"] = new_status
            updated.append((step["id"], new_status))
        return updated


async def get_or_create_program(email, domain, pool) -> dict:
    """Return-or-create the active program for (email, domain) with live
    completion derivation and backlog regeneration applied."""
    dom = registered_domain(domain) or domain
    async with pool.acquire() as conn:
        rec_rows = await conn.fetch(
            """SELECT url, finding_key, label, impact, effort, quadrant,
                      status, verified_at
               FROM recommendations WHERE email=$1""", email)
        open_recs = [
            dict(r) for r in rec_rows
            if registered_domain(r["url"]) == dom
            and r["status"] != "done" and r["verified_at"] is None
        ]

        prog = await conn.fetchrow(
            """SELECT id, generated_at FROM programs
               WHERE email=$1 AND domain=$2 AND status='active'
               LIMIT 1""", email, dom)

        if prog is None:
            prog = await conn.fetchrow(
                """INSERT INTO programs (email, domain)
                   VALUES ($1, $2) RETURNING id, generated_at""",
                email, dom)
            plan = reconcile_steps([], derive_steps(open_recs))
        else:
            rec_state = await conn.fetch(
                """SELECT url, finding_key, status, verified_at, audit_id
                   FROM recommendations WHERE email=$1""", email)
            fix_rows = await _implemented_fixes(conn, email)
            done_index = build_done_index(rec_state, fix_rows)
            existing = [dict(r) for r in await conn.fetch(
                "SELECT * FROM program_steps WHERE program_id=$1 "
                "ORDER BY seq", prog["id"])]
            await refresh_completion(email, dom, pool,
                                     program_id=prog["id"], steps=existing,
                                     done_index=done_index)
            plan = reconcile_steps(existing, derive_steps(open_recs))

        for row_id in plan["delete_ids"]:
            await conn.execute("DELETE FROM program_steps WHERE id=$1",
                               row_id)

        inserted_by_key = {}
        for fresh in plan["insert"]:
            row = await conn.fetchrow(
                """INSERT INTO program_steps (program_id, seq, stage,
                       finding_key, url, title, impact, effort, quadrant,
                       status)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
                   RETURNING id""",
                prog["id"], fresh["seq"], fresh["stage"],
                fresh["finding_key"], fresh["url"], fresh["title"],
                fresh["impact"], fresh["effort"], fresh["quadrant"])
            inserted_by_key[(fresh["finding_key"], fresh["url"])] = \
                str(row["id"])

        # durable resequencing for surviving rows (new rows were inserted
        # with their final seq/stage already)
        for step in plan["steps"]:
            key = (step["finding_key"], step["url"])
            if key in inserted_by_key:
                continue
            await conn.execute(
                "UPDATE program_steps SET seq=$2, stage=$3, status=$4,"
                " updated_at=now() WHERE id=$1",
                step["id"], step["seq"], step["stage"], step["status"])

        return {
            "program": {
                "id": str(prog["id"]),
                "domain": dom,
                "email": email,
                "generated_at": (prog["generated_at"].isoformat()
                                 if prog["generated_at"] else None),
            },
            "steps": [
                {
                    "id": inserted_by_key.get(
                        (s["finding_key"], s["url"]), str(s["id"])),
                    "seq": s["seq"],
                    "stage": s["stage"],
                    "finding_key": s["finding_key"],
                    "url": s["url"],
                    "title": s["title"],
                    "impact": _num(s.get("impact")),
                    "effort": _num(s.get("effort")),
                    "quadrant": s.get("quadrant"),
                    "status": s["status"],
                }
                for s in plan["steps"]
            ],
        }
