#!/usr/bin/env python3
"""
video_queue.py — local video production queue with Airtable-compatible schema.
Columns: brief, visual_dna_anchor, shot_count, model, aspect, duration, status, output_url

Usage:
  python3 video_queue.py add --brief "Shot 1 hook" --model Kling --aspect 9:16 --duration 2
  python3 video_queue.py list
  python3 video_queue.py list --status queued
  python3 video_queue.py update <id> --status done --output_url https://...
  python3 video_queue.py export --format csv    # Airtable-ready CSV
  python3 video_queue.py export --format json
"""

import json, csv, sys, argparse, uuid
from datetime import datetime, timezone
from pathlib import Path

QUEUE_PATH = Path.home() / "Videos" / "nebula-shoots" / "video_queue.json"
QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)

VISUAL_DNA = (
    "RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, "
    "near-black with teal accent, light film grain, slight vignette"
)

VALID_MODELS  = {"Veo", "Kling", "Sora", "Seedance", "Higgsfield", "Flux3", "Other"}
VALID_ASPECTS = {"9:16", "16:9", "1:1", "4:3"}
VALID_STATUS  = {"queued", "rendering", "done", "failed"}


def load() -> list[dict]:
    if QUEUE_PATH.exists():
        return json.loads(QUEUE_PATH.read_text())
    return []


def save(records: list[dict]) -> None:
    tmp = QUEUE_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(records, indent=2))
    tmp.replace(QUEUE_PATH)


def new_record(brief: str, model: str, aspect: str, duration: int,
               shot_count: int = 1, anchor: str = VISUAL_DNA,
               output_url: str = "") -> dict:
    return {
        "id":                 str(uuid.uuid4())[:8],
        "created_at":         datetime.now(timezone.utc).isoformat(),
        "brief":              brief,
        "visual_dna_anchor":  anchor,
        "shot_count":         shot_count,
        "model":              model,
        "aspect":             aspect,
        "duration":           duration,
        "status":             "queued",
        "output_url":         output_url,
    }


# ── Commands ─────────────────────────────────────────────────────────────────

def cmd_add(args):
    records = load()
    rec = new_record(
        brief=args.brief,
        model=args.model,
        aspect=args.aspect,
        duration=args.duration,
        shot_count=args.shot_count,
        anchor=args.anchor or VISUAL_DNA,
    )
    records.append(rec)
    save(records)
    print(f"Added [{rec['id']}] {rec['brief'][:60]} | {rec['model']} | {rec['aspect']} | {rec['duration']}s | {rec['status']}")


def cmd_list(args):
    records = load()
    if args.status:
        records = [r for r in records if r["status"] == args.status]
    if not records:
        print("Queue empty.")
        return
    header = f"{'ID':8} {'Status':10} {'Model':10} {'Aspect':6} {'Dur':4} {'Brief'}"
    print(header)
    print("─" * 80)
    for r in records:
        brief = r["brief"][:45] + "…" if len(r["brief"]) > 45 else r["brief"]
        print(f"{r['id']:8} {r['status']:10} {r['model']:10} {r['aspect']:6} {r['duration']:<4} {brief}")
    counts = {}
    for r in load():
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    print(f"\nTotal: {len(load())} | " + " | ".join(f"{s}: {n}" for s, n in sorted(counts.items())))


def cmd_update(args):
    records = load()
    for r in records:
        if r["id"] == args.id:
            if args.status:
                r["status"] = args.status
            if args.output_url:
                r["output_url"] = args.output_url
            r["updated_at"] = datetime.now(timezone.utc).isoformat()
            save(records)
            print(f"Updated [{r['id']}] → status={r['status']}, url={r.get('output_url','')}")
            return
    print(f"ID {args.id} not found.")
    sys.exit(1)


def cmd_export(args):
    records = load()
    if not records:
        print("Queue empty.")
        return
    if args.format == "json":
        print(json.dumps(records, indent=2))
    else:  # csv
        cols = ["id", "created_at", "brief", "visual_dna_anchor", "shot_count",
                "model", "aspect", "duration", "status", "output_url"]
        w = csv.DictWriter(sys.stdout, fieldnames=cols)
        w.writeheader()
        for r in records:
            w.writerow({c: r.get(c, "") for c in cols})


def cmd_seed(args):
    """Seed the queue with today's Nebula video production briefs."""
    records = load()
    shots = [
        ("Shot 1 — Crash Zoom hook: dashboard shows $0, dark desk, monitor glow only",
         "Kling", "16:9", 2),
        ("Shot 2 — Slow Dolly In: hand types URL into browser, teal glow",
         "Kling", "16:9", 4),
        ("Shot 3 — Crane Down: 9 audit signals lighting up teal one by one",
         "Kling", "16:9", 5),
        ("Shot 4 — Orbit tight: single finding text glows on dark screen",
         "Kling", "16:9", 5),
        ("Shot 5 — Bullet Time: $847/month on dark screen, world frozen",
         "Kling", "16:9", 5),
        ("Shot 6 — Static lock-off: wide dark desk, resolved, coffee steam, monitor glow",
         "Kling", "16:9", 9),
    ]
    for brief, model, aspect, dur in shots:
        rec = new_record(brief=brief, model=model, aspect=aspect, duration=dur)
        records.append(rec)
        print(f"Seeded [{rec['id']}] {brief[:60]}")
    save(records)
    print(f"\n{len(shots)} shots seeded. Run: python3 video_queue.py list")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Nebula video production queue")
    sub = p.add_subparsers(dest="cmd")

    # add
    a = sub.add_parser("add")
    a.add_argument("--brief",      required=True)
    a.add_argument("--model",      required=True, choices=VALID_MODELS)
    a.add_argument("--aspect",     default="16:9", choices=VALID_ASPECTS)
    a.add_argument("--duration",   type=int, default=5)
    a.add_argument("--shot_count", type=int, default=1)
    a.add_argument("--anchor",     default="")

    # list
    l = sub.add_parser("list")
    l.add_argument("--status", choices=VALID_STATUS)

    # update
    u = sub.add_parser("update")
    u.add_argument("id")
    u.add_argument("--status",     choices=VALID_STATUS)
    u.add_argument("--output_url", default="")

    # export
    e = sub.add_parser("export")
    e.add_argument("--format", default="csv", choices=["csv", "json"])

    # seed
    sub.add_parser("seed")

    args = p.parse_args()
    if args.cmd == "add":       cmd_add(args)
    elif args.cmd == "list":    cmd_list(args)
    elif args.cmd == "update":  cmd_update(args)
    elif args.cmd == "export":  cmd_export(args)
    elif args.cmd == "seed":    cmd_seed(args)
    else:                       p.print_help()


if __name__ == "__main__":
    main()
