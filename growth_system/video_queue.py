#!/usr/bin/env python3
"""
video_queue.py - video production queue backed by Postgres (nebula_audit db).
Columns: id, created_at, updated_at, brief, visual_dna_anchor, shot_count,
         model, aspect, duration, status, output_url

Usage:
  python3 video_queue.py add --brief "Shot 1 hook" --model Kling --aspect 9:16 --duration 2
  python3 video_queue.py list
  python3 video_queue.py list --status queued
  python3 video_queue.py update <id> --status done --output_url https://...
  python3 video_queue.py export --format csv
  python3 video_queue.py seed       # seed with today's Nebula 30s ad shots
"""

import sys, csv, argparse, os
from datetime import datetime, timezone

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("pip install psycopg2-binary")
    sys.exit(1)

# ── Connection ───────────────────────────────────────────────────────────────

DSN = os.environ.get(
    "AUDIT_DATABASE_URL",
    "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"
)

VISUAL_DNA = (
    "RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, "
    "near-black with teal accent, light film grain, slight vignette"
)

COLS = ["id", "created_at", "updated_at", "brief", "visual_dna_anchor",
        "shot_count", "model", "aspect", "duration", "status", "output_url"]


def conn():
    return psycopg2.connect(DSN)


# ── Commands ─────────────────────────────────────────────────────────────────

def cmd_add(args):
    with conn() as c, c.cursor() as cur:
        cur.execute("""
            INSERT INTO video_queue (brief, visual_dna_anchor, shot_count, model, aspect, duration)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, status
        """, (
            args.brief,
            args.anchor or VISUAL_DNA,
            args.shot_count,
            args.model,
            args.aspect,
            args.duration,
        ))
        row = cur.fetchone()
    print(f"Added [{row[0]}] {args.brief[:60]} | {args.model} | {args.aspect} | {args.duration}s | {row[1]}")


def cmd_list(args):
    with conn() as c, c.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        if args.status:
            cur.execute("SELECT * FROM video_queue WHERE status=%s ORDER BY created_at", (args.status,))
        else:
            cur.execute("SELECT * FROM video_queue ORDER BY created_at")
        rows = cur.fetchall()

    if not rows:
        print("Queue empty.")
        return

    print(f"{'ID':8} {'Status':10} {'Model':10} {'Aspect':6} {'Dur':4} {'Brief'}")
    print("─" * 80)
    for r in rows:
        brief = r["brief"][:45] + "…" if len(r["brief"]) > 45 else r["brief"]
        print(f"{r['id']:8} {r['status']:10} {r['model']:10} {r['aspect']:6} {r['duration']:<4} {brief}")

    with conn() as c, c.cursor() as cur:
        cur.execute("""
            SELECT status, count(*) FROM video_queue GROUP BY status ORDER BY status
        """)
        counts = {row[0]: row[1] for row in cur.fetchall()}
    total = sum(counts.values())
    print(f"\nTotal: {total} | " + " | ".join(f"{s}: {n}" for s, n in sorted(counts.items())))


def cmd_update(args):
    updates = []
    vals = []
    if args.status:
        updates.append("status = %s")
        vals.append(args.status)
    if args.output_url:
        updates.append("output_url = %s")
        vals.append(args.output_url)
    if not updates:
        print("Nothing to update.")
        return
    updates.append("updated_at = now()")
    vals.append(args.id)

    with conn() as c, c.cursor() as cur:
        cur.execute(
            f"UPDATE video_queue SET {', '.join(updates)} WHERE id = %s RETURNING id, status, output_url",
            vals
        )
        row = cur.fetchone()
    if row:
        print(f"Updated [{row[0]}] → status={row[1]}, url={row[2] or ''}")
    else:
        print(f"ID {args.id} not found.")
        sys.exit(1)


def cmd_export(args):
    with conn() as c, c.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("SELECT * FROM video_queue ORDER BY created_at")
        rows = cur.fetchall()

    if not rows:
        print("Queue empty.")
        return

    if args.format == "json":
        import json
        print(json.dumps([dict(r) for r in rows], indent=2, default=str))
    else:
        w = csv.DictWriter(sys.stdout, fieldnames=COLS)
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in COLS})


def cmd_seed(args):
    shots = [
        ("Shot 1 - Crash Zoom hook: dashboard shows $0, dark desk, monitor glow only",   "Kling", "16:9", 2),
        ("Shot 2 - Slow Dolly In: hand types URL into browser, teal glow",               "Kling", "16:9", 4),
        ("Shot 3 - Crane Down: 9 audit signals lighting up teal one by one",             "Kling", "16:9", 5),
        ("Shot 4 - Orbit tight: single finding text glows on dark screen",               "Kling", "16:9", 5),
        ("Shot 5 - Bullet Time: $847/month on dark screen, world frozen",                "Kling", "16:9", 5),
        ("Shot 6 - Static lock-off: wide dark desk, resolved, coffee steam, monitor",    "Kling", "16:9", 9),
    ]
    with conn() as c, c.cursor() as cur:
        # Skip if already seeded
        cur.execute("SELECT count(*) FROM video_queue")
        if cur.fetchone()[0] > 0:
            print("Queue already has records - skipping seed. Use 'list' to view.")
            return
        for brief, model, aspect, dur in shots:
            cur.execute("""
                INSERT INTO video_queue (brief, visual_dna_anchor, shot_count, model, aspect, duration)
                VALUES (%s, %s, 1, %s, %s, %s) RETURNING id
            """, (brief, VISUAL_DNA, model, aspect, dur))
            row = cur.fetchone()
            print(f"Seeded [{row[0]}] {brief[:60]}")
    print(f"\n{len(shots)} shots seeded.")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Nebula video queue (Postgres)")
    sub = p.add_subparsers(dest="cmd")

    a = sub.add_parser("add")
    a.add_argument("--brief",      required=True)
    a.add_argument("--model",      required=True, choices=["Veo","Kling","Sora","Seedance","Higgsfield","Flux3","Other"])
    a.add_argument("--aspect",     default="16:9", choices=["9:16","16:9","1:1","4:3"])
    a.add_argument("--duration",   type=int, default=5)
    a.add_argument("--shot_count", type=int, default=1)
    a.add_argument("--anchor",     default="")

    l = sub.add_parser("list")
    l.add_argument("--status", choices=["queued","rendering","done","failed"])

    u = sub.add_parser("update")
    u.add_argument("id")
    u.add_argument("--status",     choices=["queued","rendering","done","failed"])
    u.add_argument("--output_url", default="")

    e = sub.add_parser("export")
    e.add_argument("--format", default="csv", choices=["csv","json"])

    sub.add_parser("seed")

    args = p.parse_args()
    dispatch = {"add": cmd_add, "list": cmd_list, "update": cmd_update,
                "export": cmd_export, "seed": cmd_seed}
    fn = dispatch.get(args.cmd)
    if fn:
        fn(args)
    else:
        p.print_help()


if __name__ == "__main__":
    main()
