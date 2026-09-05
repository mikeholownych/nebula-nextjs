#!/usr/bin/env python3
"""Classify refresh recommendations without changing article files."""
from __future__ import annotations
import argparse, json, math, sys
from pathlib import Path
from typing import Any
DECISIONS = ("NO_CHANGE", "OBSERVE", "REVIEW", "CONSOLIDATE", "RETIRE")

def _metric(metrics: dict[str, Any], key: str) -> float:
    value = metrics.get(key, 0)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0: raise ValueError(f"{key} must be a finite non-negative number")
    return float(value)

def review_refresh(metrics: dict[str, Any], article_paths=None, days: int = 28) -> dict[str, Any]:
    if not isinstance(metrics, dict): raise ValueError("metrics must be an object")
    age = _metric(metrics, "age_days"); clicks = _metric(metrics, "clicks"); impressions = _metric(metrics, "impressions"); purchases = _metric(metrics, "purchases")
    if metrics.get("retired"): decision = "RETIRE"
    elif metrics.get("cannibalization") or metrics.get("duplicate"): decision = "CONSOLIDATE"
    elif age >= 84 and clicks == 0 and impressions == 0: decision = "RETIRE"
    elif age >= 28 and clicks == 0 and impressions > 0: decision = "REVIEW"
    elif age >= 28 or purchases > 0: decision = "OBSERVE"
    else: decision = "NO_CHANGE"
    return {"decision": decision, "days": days, "article_files_edited": False, "analytics_files_edited": False, "reason": f"age_days={age:g}, clicks={clicks:g}, impressions={impressions:g}, purchases={purchases:g}"}

def main():
    p = argparse.ArgumentParser(); p.add_argument("--days", type=int, default=28); p.add_argument("--input", type=Path, required=True); a = p.parse_args(); root = Path(__file__).resolve().parents[2]
    try:
        path = a.input.resolve(strict=True); path.relative_to(root)
        if path.suffix.lower() != ".json": raise ValueError("input must be a repository JSON file")
        data = json.loads(path.read_text()); print(json.dumps(review_refresh(data, days=a.days), indent=2, sort_keys=True)); return 0
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError, TypeError) as exc:
        detail = exc.msg if isinstance(exc, json.JSONDecodeError) else str(exc); print(f"error: invalid input: {detail}", file=sys.stderr); return 2
if __name__ == "__main__": raise SystemExit(main())
