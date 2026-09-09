#!/usr/bin/env python3
"""Compute and emit the evidence-derived IMPRESSIONS_FLOOR for the current GSC data.

Reads the most recent valid GSC export and sets the floor using a tiered schedule:
  - New site (total impressions < 500):   floor = 5
  - Early growth (< 2,000):               floor = 20
  - Growing (< 10,000):                   floor = 50
  - Established (>= 10,000):              floor = 100

The output is written to content-ledger/impressions-floor.json and printed to stdout
for the Hermes cron no_agent=True delivery pattern.

This script never modifies the source code. The live floor is read at runtime from
the environment variable NEBULA_IMPRESSIONS_FLOOR, which the cron update step sets
inside nebula/.env (sourced by the weekly orchestrator and pipeline scripts).
"""
from __future__ import annotations
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GSC_PATTERNS = [
    "agency-audit-2026-08-03/gsc-shop.json",
    "agency-audit-2026-08-03/gsc-com.json",
    "seo-reports/gsc-*.json",
]
FLOOR_LEDGER = ROOT / "content-ledger" / "impressions-floor.json"

TIERS: list[tuple[int, int]] = [
    (500,   5),    # new site
    (2_000, 20),   # early growth
    (10_000, 50),  # growing
]
FLOOR_ESTABLISHED = 100


def _total_impressions() -> int:
    """Sum impressions across all valid GSC export files."""
    total = 0
    seen: set[str] = set()
    for pattern in GSC_PATTERNS:
        for path in sorted(ROOT.glob(pattern)):
            key = path.name
            if key in seen:
                continue
            seen.add(key)
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                rows = data.get("rows") if isinstance(data, dict) else None
                if isinstance(rows, list):
                    total += sum(
                        int(r.get("impressions", 0))
                        for r in rows
                        if isinstance(r, dict)
                    )
            except (OSError, ValueError):
                continue
    return total


def compute_floor(total_impressions: int) -> tuple[int, str]:
    for threshold, floor in TIERS:
        if total_impressions < threshold:
            return floor, f"total_impressions={total_impressions} < {threshold}"
    return FLOOR_ESTABLISHED, f"total_impressions={total_impressions} >= {TIERS[-1][0]}"


def main() -> int:
    total = _total_impressions()
    floor, reason = compute_floor(total)

    # Read previous floor (if any)
    previous: int | None = None
    if FLOOR_LEDGER.exists():
        try:
            prev = json.loads(FLOOR_LEDGER.read_text())
            previous = int(prev.get("floor", 0)) or None
        except (ValueError, KeyError):
            pass

    changed = previous != floor
    payload = {
        "schema": "nebula.content-pipeline.impressions-floor.v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_impressions": total,
        "floor": floor,
        "previous_floor": previous,
        "changed": changed,
        "reason": reason,
        "tiers": [{"threshold": t, "floor": f} for t, f in TIERS]
        + [{"threshold": None, "floor": FLOOR_ESTABLISHED, "label": "established"}],
        "env_var": "NEBULA_IMPRESSIONS_FLOOR",
        "next_review": "raise threshold when total_impressions crosses next tier boundary",
    }

    FLOOR_LEDGER.parent.mkdir(parents=True, exist_ok=True)
    FLOOR_LEDGER.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")

    # Update .env only when the floor actually changed
    env_path = ROOT / ".env"
    if changed:
        env_lines: list[str] = []
        if env_path.exists():
            env_lines = env_path.read_text().splitlines()
        new_lines = [
            l for l in env_lines if not l.startswith("NEBULA_IMPRESSIONS_FLOOR=")
        ]
        new_lines.append(f"NEBULA_IMPRESSIONS_FLOOR={floor}")
        env_path.write_text("\n".join(new_lines) + "\n")
        print(
            json.dumps(
                {
                    "floor_updated": True,
                    "previous_floor": previous,
                    "new_floor": floor,
                    "total_impressions": total,
                    "reason": reason,
                },
                indent=2,
            )
        )
    else:
        # Silence when nothing changed (watchdog pattern)
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
