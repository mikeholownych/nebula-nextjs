#!/usr/bin/env python3
"""
channel1/weekly_rollup.py — Friday decision dashboard. Reads live files and
prints the Channel 1 metrics in EXECUTION ORDER (FRIDAY_CHECKLIST.md):
  0. Freshness → 1. Revenue → 2. Audit rate → 3. Reply rate → 4. Sourcing volume

Also records angle kills with a reason tag so the graveyard compounds into
learning instead of just accumulating dead angles.

Usage:
  python3 weekly_rollup.py [--weeks 1]
  python3 weekly_rollup.py --kill "<angle>" --reason <reason> [--note "..."]
      reason: bad_list | weak_proof | bad_framing | too_much_friction |
              stale_sample | too_few_sends
      (writes to kill_log.jsonl, then prints the board)

Sources:
  - pipeline_sheet.csv      (prospects, statuses, touches)
  - /home/mike/nebula/stats.json  (emails_sent, replies, revenue)
  - reply_diagnostics.jsonl (S1–S4 failure distribution, if any replies logged)
  - kill_log.jsonl          (killed angles + reasons)
  - Stripe revenue: ops-finance ledger if present, else stats.json
"""

import argparse
import csv
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

def _env_path(name: str, default: Path) -> Path:
    return Path(os.environ.get(name, str(default)))

HERE = Path(__file__).parent
SHEET = _env_path("CH1_SHEET", HERE / "pipeline_sheet.csv")
KILL_LOG = _env_path("CH1_KILL_LOG", HERE / "kill_log.jsonl")
STATS = _env_path("CH1_STATS", Path("/home/mike/nebula/stats.json"))
DIAG = _env_path("CH1_DIAG", Path("/home/mike/nebula/reply_diagnostics.jsonl"))
LEDGER = _env_path("CH1_LEDGER", Path("/home/mike/nebula/ledgers/customer-ledger.jsonl"))

KILL_REASONS = {
    "bad_list": "wrong segment or stale trigger (research, not copy)",
    "weak_proof": "not enough proof in touch 1 (add audit artifact)",
    "bad_framing": "S3 wrong — they don't feel the pain you name",
    "too_much_friction": "ask is a call; drop to $97 link / free audit",
    "stale_sample": "<5 sends, no statistical basis — don't conclude",
    "too_few_sends": "same as stale_sample; keep the angle, add volume",
}

THRESHOLDS = {
    "fix_packs_per_week": {"green": 1, "yellow": 0.5, "red": 0},
    "audit_to_purchase_pct": {"green": 10.0, "yellow": 3.0, "red": 0},
    "offers_per_week": {"green": 5, "yellow": 3, "red": 0},
    "reply_rate_pct": {"green": 20.0, "yellow": 10.0, "red": 0},
    "audits_requested_per_week": {"green": 3, "yellow": 1, "red": 0},
}


def flag(value, metric) -> str:
    t = THRESHOLDS[metric]
    if value >= t["green"]:
        return "GREEN"
    if value >= t["yellow"]:
        return "YELLOW"
    return "RED"


def load_sheet() -> list[dict]:
    if not SHEET.exists() or SHEET.stat().st_size == 0:
        return []
    with open(SHEET, newline="") as f:
        return list(csv.DictReader(f))


def load_stats() -> dict:
    if not STATS.exists():
        return {}
    try:
        return json.loads(STATS.read_text())
    except json.JSONDecodeError:
        return {}


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def load_ledger_revenue() -> float:
    total = 0.0
    for r in load_jsonl(LEDGER):
        for k in ("amount", "revenue", "total"):
            v = r.get(k)
            if isinstance(v, (int, float)):
                total += float(v)
                break
    return total


def record_kill(angle: str, reason: str, note: str = "") -> None:
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "angle": angle,
        "reason": reason,
        "note": note,
    }
    with open(KILL_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"🗡️  Killed '{angle}' — reason: {reason} ({KILL_REASONS.get(reason, '?')})")
    if note:
        print(f"   Note: {note}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--weeks", type=int, default=1, help="Weeks to compare (default 1)")
    p.add_argument("--kill", help="Record a killed angle, then print the board")
    p.add_argument("--reason", choices=sorted(KILL_REASONS), help="Kill reason tag")
    p.add_argument("--note", default="", help="Optional note for the kill")
    p.add_argument("--force", action="store_true", help="Bypass the freshness hard stop (preview only)")
    args = p.parse_args()

    if args.kill:
        if not args.reason:
            print("❌ --kill requires --reason: " + ", ".join(sorted(KILL_REASONS)))
            return 1
        record_kill(args.kill, args.reason, args.note)
        print()

    sheet = load_sheet()
    stats = load_stats()
    diag = load_jsonl(DIAG)
    kills = load_jsonl(KILL_LOG)

    print("═" * 62)
    print("CHANNEL 1 — WEEKLY DECISION DASHBOARD")
    print(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("═" * 62)

    # --- 0. FRESHNESS (first — stale data invalidates all downstream judgment) ---
    stats_updated = (stats.get("updated") or stats.get("data_updated") or "unknown")[:10]
    stale = stats_updated != "unknown" and stats_updated < datetime.now(timezone.utc).strftime("%Y-%m-%d")
    print("\n0. FRESHNESS")
    print(f"   stats.json updated:    {stats_updated}  {'⚠️ STALE — numbers are historical, not this week' if stale else 'ok'}")
    print(f"   Kill ledger entries:   {len(kills)}")
    if kills:
        reasons = Counter(k.get("reason", "?") for k in kills)
        dist = ", ".join(f"{k}:{v}" for k, v in sorted(reasons.items()))
        print(f"   Kill reasons:          {dist}")
        top = reasons.most_common(1)[0][0]
        print(f"   → Pattern: {top} → {KILL_REASONS.get(top, '?')}")

    if stale and not args.force:
        print("\n⛔ HARD STOP — stats.json is STALE. Nothing below is trustworthy.")
        print("   Per FRIDAY_CHECKLIST step 0: refresh the data before acting on anything.")
        print("   (Use --force to preview the board while you fix it.)")
        print("─" * 62)
        return 0

    # --- 1. REVENUE (the only gate that stops everything) ---
    revenue = float(stats.get("real_revenue") or stats.get("revenue") or 0)
    ledger_rev = load_ledger_revenue()
    if ledger_rev > 0:
        revenue = ledger_rev
    purchases = [r for r in sheet if r.get("status") == "fix_purchased"]
    fix_packs_per_week = len(purchases) / max(args.weeks, 1)
    audits = [r for r in sheet if r.get("status") in ("audit_requested", "audit_completed",
                                                      "problem_confirmed", "commercially_qualified",
                                                      "fix_offered", "fix_purchased",
                                                      "fix_delivered", "outcome_measured",
                                                      "case_study_eligible")]
    audit_to_purchase_pct = (len(purchases) / len(audits) * 100) if audits else 0.0

    print("\n1. REVENUE")
    print(f"   Fix Pack purchases:     {len(purchases)}  ({fix_packs_per_week:.2f}/wk)  [{flag(fix_packs_per_week, 'fix_packs_per_week')}]")
    print(f"   Audit → purchase rate:  {audit_to_purchase_pct:.1f}%  [{flag(audit_to_purchase_pct, 'audit_to_purchase_pct')}]")
    print(f"   Revenue tracked:        ${revenue:.2f}  (ledger={'yes' if ledger_rev > 0 else 'no'})")
    if flag(fix_packs_per_week, "fix_packs_per_week") == "RED":
        print("   → RED: STOP OUTREACH. Fix offer/delivery before volume.")

    # --- 2. AUDIT REQUEST RATE (does the offer move people?) ---
    by_status = Counter(r.get("status", "?") for r in sheet)
    audit_requested = by_status.get("audit_requested", 0)
    audits_per_week = audit_requested / max(args.weeks, 1)
    print("\n2. AUDIT PIPELINE")
    print(f"   Audits requested/wk:    {audits_per_week:.1f}  [{flag(audits_per_week, 'audits_requested_per_week')}]")
    print(f"   Audits completed:       {by_status.get('audit_completed', 0)}")
    if audits_per_week == 0:
        print("   → RED: touch 1 must SHOW the audit artifact (pre-audit first).")

    # --- 3. REPLY RATE & DIAGNOSTICS (is the message resonating?) ---
    replies = int(stats.get("replies") or stats.get("trigger_warm_replies") or 0)
    reply_rate = float(stats.get("trigger_reply_rate") or 0)
    print("\n3. REPLY RATE & DIAGNOSTICS")
    print(f"   Replies:                {replies}  |  reply rate: {reply_rate * 100:.1f}%  [{flag(reply_rate * 100, 'reply_rate_pct')}]")
    if diag:
        stages = Counter(d.get("stage") or d.get("failure") or "unknown" for d in diag)
        dist = ", ".join(f"{k}:{v}" for k, v in sorted(stages.items()))
        print(f"   Diagnostic distribution: {dist}")
        top = stages.most_common(1)[0][0] if stages else "?"
        label = {"S1": "Trigger", "S2": "Who", "S3": "Why them", "S4": "Ask"}.get(top, top)
        print(f"   → Fix target this week: stage {top} ({label})")
    else:
        print("   No diagnosed replies yet — reply_diagnostics.jsonl empty.")
    if flag(reply_rate * 100, "reply_rate_pct") == "RED":
        print("   → RED: fix S1/S3, rewrite, test 5 fresh leads.")

    # --- 4. SOURCING VOLUME (only after 0–3 are at least yellow) ---
    emails_sent = int(stats.get("emails_sent") or 0)
    sends_per_week = emails_sent / max(args.weeks, 1)
    total = len(sheet)
    print("\n4. VOLUME & THROUGHPUT")
    print(f"   Prospects in sheet:     {total}  ({'GREEN' if total >= 30 else ('YELLOW' if total >= 15 else 'RED')} vs 30–50 target)")
    print(f"   Emails sent:            {emails_sent} total ({sends_per_week:.1f}/wk)  [{flag(sends_per_week, 'offers_per_week')}]")
    if by_status:
        status_line = ", ".join(f"{k}:{v}" for k, v in sorted(by_status.items()))
        print(f"   Status breakdown:       {status_line}")
    if total < 15:
        print("   → RED: add a sourcing lane, not more sends.")

    # --- Decisions ---
    print("\n" + "─" * 62)
    decisions = []
    if flag(fix_packs_per_week, "fix_packs_per_week") == "RED":
        if audits_per_week >= 1:
            decisions.append("REVENUE RED but AUDIT RATE LIVE → keep audit motion; defer $97 ask until after value delivery. Do not scale pitches.")
        else:
            decisions.append("REVENUE RED → stop outreach, fix offer/delivery first")
    if audits_per_week == 0 and sends_per_week >= 3:
        decisions.append("AUDITS 0/wk → put audit artifact in touch 1")
    if reply_rate * 100 < 10 and sends_per_week >= 5:
        decisions.append("REPLY <10% → fix S1/S3, rewrite, test 5 fresh leads")
    if total < 15:
        decisions.append("SHEET <15 → add a sourcing lane, not more sends")
    if flag(fix_packs_per_week, "fix_packs_per_week") == "GREEN" and flag(sends_per_week, "offers_per_week") == "GREEN":
        decisions.append("ALL GREEN → double batch to 10/wk, keep pre-auditing")

    if decisions:
        print("DECISIONS (in order):")
        for d in decisions:
            print(f"   → {d}")
    else:
        print("DECISIONS: no threshold crossed — keep current batch, review next Friday.")
    print("─" * 62)
    return 0


if __name__ == "__main__":
    sys.exit(main())
