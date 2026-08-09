#!/usr/bin/env python3
"""Nebula Audits studio status dashboard.

The content-studio pattern (Komputer Mechanic, TTSPDNUinek): every agent
logs its name/task/outcome to a DB, and the dashboard shows real runs,
success rate, and failures — "no fake metrics anywhere."

This script reads the pipeline's own logs (studio_activity.jsonl,
production_log.jsonl, retention_analysis_*.json) and prints the studio
overview: runs, success rate per stage, videos produced, uploads, backlog,
outliers, and recent failures.

Usage:
  python3 yt_channel/studio_status.py [--json]
"""

import sys, json, logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))

logging.basicConfig(level=logging.ERROR)

LOG_DIR = NEBULA_DIR / "yt_channel" / "logs"
ACTIVITY = LOG_DIR / "studio_activity.jsonl"
PRODUCTION = NEBULA_DIR / "yt_channel" / "videos" / "production_log.jsonl"


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.read_text().strip().splitlines():
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def _latest_retention() -> dict | None:
    files = sorted(LOG_DIR.glob("retention_analysis_*.json"))
    if not files:
        return None
    try:
        return json.loads(files[-1].read_text())
    except Exception:
        return None


def summarize() -> dict:
    activity = _read_jsonl(ACTIVITY)
    production = _read_jsonl(PRODUCTION)
    retention = _latest_retention()

    # Per-stage success rate
    stages = {}
    for e in activity:
        s = stages.setdefault(e.get("stage", "?"), {"ok": 0, "fail": 0})
        s[e.get("status") if e.get("status") in ("ok", "fail") else "ok"] += 1

    # Recent failures (last 10)
    failures = [e for e in activity if e.get("status") == "fail"][-10:]

    # 24h activity (the heat-map proxy)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    recent = [e for e in activity
              if e.get("timestamp", "") >= cutoff.isoformat()]

    # Backlog: produced but not (yet) uploaded — production entries whose
    # domain has no matching upload ok-stage after the render time.
    uploaded_domains = {
        e["domain"] for e in activity
        if e.get("stage") == "upload" and e.get("status") == "ok"
    }
    backlog = [e for e in production
               if e.get("domain") not in uploaded_domains]

    return {
        "generated": datetime.now(timezone.utc).isoformat(),
        "runs_total": len(activity),
        "runs_24h": len(recent),
        "stages": stages,
        "videos_produced": len(production),
        "backlog": backlog[-8:],
        "uploaded_domains": sorted(uploaded_domains),
        "recent_failures": failures,
        "retention": retention,
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nebula Audits studio status")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = summarize()
    if args.json:
        print(json.dumps(report, indent=2))
        return

    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║  NEBULA AUDITS — STUDIO STATUS                           ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"  Runs (all-time): {report['runs_total']}   |   Last 24h: {report['runs_24h']}")

    print("\n  Stage success rate (from studio_activity.jsonl):")
    for stage in ("audit", "render", "qa", "upload"):
        s = report["stages"].get(stage, {"ok": 0, "fail": 0})
        total = s["ok"] + s["fail"]
        rate = 100 * s["ok"] / total if total else 0
        bar = "█" * int(rate / 10) + "░" * (10 - int(rate / 10))
        print(f"    {stage:<7} {bar} {rate:>3.0f}%  ({s['ok']} ok / {s['fail']} fail)")

    print(f"\n  Videos produced: {report['videos_produced']}  |  Uploaded domains: {len(report['uploaded_domains'])}")
    if report["backlog"]:
        print("  Backlog (rendered, not uploaded):")
        for e in report["backlog"][-5:]:
            print(f"    - {e.get('domain','?'):<24} {e.get('title','')[:40]}")

    rt = report["retention"]
    if rt:
        print(f"\n  Channel (retention_analysis {rt.get('generated','')[:16]}):")
        print(f"    {rt.get('video_count',0)} videos | avg views {rt.get('avg_views','?')} | "
              f"avg engagement {rt.get('avg_engagement_rate','?')}%")
        for o in rt.get("outliers", [])[:3]:
            print(f"    ★ OUTLIER {o.get('views','?')}v x{o.get('views_vs_avg','?')} avg — {o.get('title','')[:50]}")
        if not rt.get("outliers"):
            print("    (no outliers yet — early channel, keep cadence)")

    if report["recent_failures"]:
        print("\n  Recent failures:")
        for f in report["recent_failures"][-5:]:
            print(f"    ✗ {f.get('timestamp','')[:19]} {f.get('stage','?'):<7} {f.get('domain','?'):<24} {f.get('detail','')[:60]}")
    else:
        print("\n  Recent failures: none ✅")


if __name__ == "__main__":
    main()
