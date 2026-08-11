#!/usr/bin/env python3
"""Fail-fast evaluator for live Nebula outreach experiments.

This reads the authoritative outreach SQLite state and customer ledger. It does
not send, rewrite copy, promote variants, or modify lead state.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE = Path("/home/mike/nebula")
DB_PATH = BASE / "lead_gen" / "lead_state.db"
LEDGER_PATH = BASE / "ledgers" / "customer-ledger.jsonl"
REPORT_PATH = BASE / "ops" / "research" / "experiment_reports.jsonl"

EXPERIMENT = {
    "experiment_id": "outreach_hook_v1",
    "name": "Trigger-aware D1 hook variants",
    "variants": ["A", "B", "C"],
    "primary_metric": "purchases",
    "secondary_metric": "warm_replies",
    "minimum_sends_per_variant": 10,
    "maximum_sends_per_variant": 20,
    "no_signal_rule": "10 sends and 0 warm replies",
    "no_purchase_rule": "20 sends and 0 purchases",
}


def iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict):
            rows.append(row)
    return rows


def collect(base: Path = BASE) -> dict[str, dict[str, Any]]:
    stats = {
        v: {"sends": 0, "warm_replies": 0, "purchases": 0, "emails": []}
        for v in EXPERIMENT["variants"]
    }
    db_path = base / "lead_gen" / "lead_state.db"
    if db_path.exists():
        with sqlite3.connect(str(db_path)) as db:
            db.row_factory = sqlite3.Row
            rows = db.execute(
                "SELECT email, hook_variant, status, replied_at FROM sequence_state"
            ).fetchall()
        for row in rows:
            variant = str(row["hook_variant"] or "").upper()
            if variant not in stats:
                continue
            stats[variant]["sends"] += 1
            stats[variant]["emails"].append(row["email"])
            if row["replied_at"] or str(row["status"] or "").lower() == "replied":
                stats[variant]["warm_replies"] += 1

    paid_emails = {
        str(row.get("email") or "").strip().lower()
        for row in read_jsonl(base / "ledgers" / "customer-ledger.jsonl")
        if str(row.get("event_type") or row.get("action") or "").lower() in {"payment", "purchase", "charge.succeeded"}
    }
    for variant in stats.values():
        variant["purchases"] = sum(
            1 for email in variant["emails"] if str(email).strip().lower() in paid_emails
        )
    return stats


def decision_for(row: dict[str, Any]) -> str:
    """Classify progress without confusing leading indicators with proof.

    Only an attributable purchase is a success signal. Replies may justify an
    earlier investigation, but they never produce a winner.
    """
    if row["purchases"] > 0:
        return "SALE_SIGNAL"
    if row["sends"] >= EXPERIMENT["minimum_sends_per_variant"] and row["warm_replies"] == 0:
        return "NO_SIGNAL"
    if row["sends"] >= EXPERIMENT["maximum_sends_per_variant"]:
        return "NO_PURCHASES"
    return "continue"


def report(base: Path = BASE, write: bool = False) -> dict[str, Any]:
    stats = collect(base)
    variants = []
    for variant in EXPERIMENT["variants"]:
        row = {"variant": variant, **stats[variant]}
        row["emails"] = sorted(row["emails"])
        row["decision"] = decision_for(row)
        row["reply_rate"] = round(row["warm_replies"] / row["sends"], 4) if row["sends"] else 0.0
        row["purchase_rate"] = round(row["purchases"] / row["sends"], 4) if row["sends"] else 0.0
        variants.append(row)
    report = {
        "reported_at": iso_now(),
        "experiment": EXPERIMENT,
        "variants": variants,
        "winner": None,
        "promotion_allowed": False,
        "promotion_reason": "Manual review required. This evaluator never promotes copy.",
    }
    qualified = [r for r in variants if r["purchases"] > 0]
    if len(qualified) >= 2:
        report["winner"] = max(qualified, key=lambda r: (r["purchase_rate"], r["purchases"]))["variant"]
        report["promotion_reason"] = "Multiple variants have purchases. Compare customer quality and margin manually."
    if write:
        REPORT_PATH_FOR_BASE = base / "ops" / "research" / "experiment_reports.jsonl"
        REPORT_PATH_FOR_BASE.parent.mkdir(parents=True, exist_ok=True)
        with REPORT_PATH_FOR_BASE.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(report, sort_keys=True) + "\n")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate live Nebula outreach experiment")
    parser.add_argument("--base", default=str(BASE))
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = report(Path(args.base), write=args.write)
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        for row in result["variants"]:
            print(f"{row['variant']}: sends={row['sends']} replies={row['warm_replies']} purchases={row['purchases']} decision={row['decision']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
