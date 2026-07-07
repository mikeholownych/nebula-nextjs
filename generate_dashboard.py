#!/usr/bin/env python3
"""
generate_dashboard.py — Nebula pipeline visual dashboard.

Jack Roberts principle: visual intelligence layer for the agentic OS.
A shareable HTML dashboard showing pipeline state, conversion funnel,
and operational metrics at a glance.

Generates: /home/mike/nebula/dashboard/index.html

Usage:
    python3 generate_dashboard.py                          # full dashboard
    python3 generate_dashboard.py --open                   # + open in browser
    python3 generate_dashboard.py --quiet                  # no stdout
    python3 generate_dashboard.py --cron                   # silent, optimized for cron
"""

import json
import os
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
DASHBOARD_DIR = NEBULA / "dashboard"
OUTPUT_PATH = DASHBOARD_DIR / "index.html"

# ── Data Loaders ─────────────────────────────────────────────────────────


def load_json(path) -> dict | list | None:
    try:
        return json.loads(Path(path).read_text())
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None


def load_jsonl(path, limit=0) -> list:
    results = []
    try:
        text = Path(path).read_text().strip()
        for i, line in enumerate(text.split("\n")):
            if line.strip():
                results.append(json.loads(line))
            if limit and i >= limit - 1:
                break
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        pass
    return results


def load_stats() -> dict:
    stats = load_json(NEBULA / "stats.json") or {}
    if isinstance(stats, dict):
        return stats
    return {}


def load_pipeline_health() -> dict:
    ph = load_json(NEBULA / "pipeline_health.json") or {}
    if isinstance(ph, dict):
        return ph
    return {}


def load_contacted() -> dict:
    c = load_json(NEBULA / "contacted.json") or {}
    if isinstance(c, dict):
        return c
    return {}


def load_hot_leads() -> list:
    hl = load_json(NEBULA / "HOT_LEAD.json") or []
    if isinstance(hl, list):
        return hl
    return []


def load_night_watch() -> dict:
    nw = load_json(NEBULA / "night_watch_report.json") or {}
    if isinstance(nw, dict):
        return nw
    return {}


def load_attribution() -> dict:
    try:
        # Run attribution_report.py and capture output
        proc = subprocess.run(
            [sys.executable, str(NEBULA / "attribution_report.py"), "--json"],
            capture_output=True, text=True, timeout=30,
            cwd=str(NEBULA),
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return json.loads(proc.stdout.strip())
    except (FileNotFoundError, json.JSONDecodeError, subprocess.TimeoutExpired, OSError):
        pass
    return {}


# ── Dashboard Builder ────────────────────────────────────────────────────


def color_for_score(score: float) -> str:
    if score >= 8:
        return "#22c55e"
    elif score >= 6:
        return "#eab308"
    return "#ef4444"


def grade_badge(grade: str) -> str:
    colors = {"A": "#22c55e", "B": "#16a34a", "C": "#eab308", "D": "#f97316", "F": "#ef4444"}
    bg = colors.get(grade.upper(), "#6b7280")
    return f'<span style="background:{bg};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">{grade}</span>'


def build_dashboard() -> str:
    contacted = load_contacted()
    hot_leads = load_hot_leads()
    stats = load_stats()
    health = load_pipeline_health()
    night_watch = load_night_watch()
    attribution = load_attribution()

    # ── Pipeline counts ──
    total_contacted = len(contacted)
    total_hot = len(hot_leads)

    # Stage breakdown from HOT_LEAD
    stages = Counter(lead.get("stage", "unknown") for lead in hot_leads)
    audit_delivered = stages.get("audit_delivered", 0)
    pitch_sent = stages.get("pitch_sent", 0)
    paid = stages.get("paid", 0)
    uncontacted = stages.get("", 0)

    # Replied count
    replied = sum(1 for v in contacted.values() if v.get("replied") == "True")

    # Night Watch signals
    nw_changes = night_watch.get("changes", []) if isinstance(night_watch, dict) else []
    nw_down = night_watch.get("summary", {}).get("sites_down", 0) if isinstance(night_watch, dict) else 0

    # Attribution
    attribution_data = attribution.get("sources", []) if isinstance(attribution, dict) else []

    # ── Build HTML ──
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nebula Pipeline Dashboard</title>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#0f0f0f; color:#e5e5e5; padding:24px; }}
  h1 {{ font-size:24px; font-weight:600; margin-bottom:4px; color:#fff; }}
  .subtitle {{ color:#9ca3af; font-size:14px; margin-bottom:24px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:24px; }}
  .card {{ background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px; padding:16px; }}
  .card .label {{ font-size:12px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; }}
  .card .value {{ font-size:32px; font-weight:700; color:#fff; margin-top:4px; }}
  .card .change {{ font-size:12px; margin-top:4px; }}
  .section-title {{ font-size:16px; font-weight:600; margin:24px 0 12px; color:#d1d5db; }}
  table {{ width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px; }}
  th {{ text-align:left; padding:8px 12px; background:#1a1a1a; color:#9ca3af; font-weight:500; border-bottom:1px solid #2a2a2a; }}
  td {{ padding:8px 12px; border-bottom:1px solid #252525; }}
  tr:hover td {{ background:#1e1e1e; }}
  .badge {{ display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }}
  .badge-hot {{ background:#ef4444; color:#fff; }}
  .badge-warm {{ background:#eab308; color:#000; }}
  .badge-cold {{ background:#6b7280; color:#fff; }}
  .badge-paid {{ background:#22c55e; color:#000; }}
  .funnel {{ display:flex; gap:4px; align-items:center; margin-bottom:24px; }}
  .funnel-step {{ flex:1; text-align:center; padding:12px 8px; border-radius:8px; font-size:13px; }}
  .funnel-step .num {{ font-size:24px; font-weight:700; display:block; }}
  a {{ color:#60a5fa; text-decoration:none; }}
  a:hover {{ text-decoration:underline; }}
  .status-dot {{ display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }}
</style>
</head>
<body>

<h1>⛁ Nebula Pipeline</h1>
<p class="subtitle">Updated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} · Night Watch + Parallel Audit active</p>

<div class="grid">
  <div class="card">
    <div class="label">Contacted</div>
    <div class="value">{total_contacted}</div>
  </div>
  <div class="card">
    <div class="label">Warm Leads</div>
    <div class="value">{total_hot}</div>
  </div>
  <div class="card">
    <div class="label">Audits Delivered</div>
    <div class="value">{audit_delivered}</div>
  </div>
  <div class="card">
    <div class="label">Pitches Sent</div>
    <div class="value">{pitch_sent}</div>
  </div>
  <div class="card">
    <div class="label">Revenue</div>
    <div class="value">{stats.get('revenue', 0)}</div>
    <div class="change" style="color:#22c55e">{stats.get('payments', 0)} payments</div>
  </div>
  <div class="card">
    <div class="label">Replied</div>
    <div class="value">{replied}</div>
  </div>
  <div class="card">
    <div class="label">Night Watch</div>
    <div class="value">{len(nw_changes)}</div>
    <div class="change" style="color:#f97316">changes flagged</div>
  </div>
  <div class="card">
    <div class="label">Sites Down</div>
    <div class="value">{nw_down}</div>
    <div class="change" style="color:#ef4444">may need cleanup</div>
  </div>
</div>

<h2 class="section-title">Funnel</h2>
<div class="funnel">
  <div class="funnel-step" style="background:#1e293b">
    <span class="num">{total_contacted}</span>
    Contacted
  </div>
  <div class="funnel-step" style="background:#1e3a5f">
    <span class="num">{audit_delivered}</span>
    Audit Sent
  </div>
  <div class="funnel-step" style="background:#3b1f1f">
    <span class="num">{pitch_sent}</span>
    Pitch Sent
  </div>
  <div class="funnel-step" style="background:#14532d">
    <span class="num">{paid}</span>
    Paid
  </div>
</div>
"""

    # ── Hot Leads Table ──
    html += '<h2 class="section-title">Active Hot Leads</h2>\n'
    if hot_leads:
        html += """<table>
<thead><tr><th>Email</th><th>URL</th><th>Stage</th><th>Score</th><th>Grade</th><th>Audit Sent</th></tr></thead>
<tbody>
"""
        for lead in hot_leads[:20]:
            email = lead.get("email", "?")[:30]
            url = lead.get("url", "")[:40]
            stage = lead.get("stage", "")
            score = lead.get("audit_score", lead.get("score", ""))
            grade = lead.get("audit_grade", "")
            audit_at = (lead.get("audit_sent_at") or lead.get("pitch_sent_at") or "")[:10]
            score_str = str(score) if score else ""
            grade_html = grade_badge(grade) if grade else ""
            html += f"<tr><td>{email}</td><td><a href='{url}' target='_blank'>{url[:35]}</a></td><td>{stage}</td><td>{score_str}</td><td>{grade_html}</td><td>{audit_at}</td></tr>\n"
        html += "</tbody></table>\n"
    else:
        html += "<p style='color:#6b7280'>No hot leads yet.</p>\n"

    # ── Night Watch Changes ──
    if nw_changes:
        html += '<h2 class="section-title">🔔 Night Watch — Site Changes Detected</h2>\n'
        html += """<table>
<thead><tr><th>Email</th><th>Title</th><th>Changes</th></tr></thead>
<tbody>
"""
        for c in nw_changes[:10]:
            email = c.get("email", "?")[:30]
            title = c.get("current_title", "")[:50]
            changes = "; ".join(f"{k}: {v}" for k, v in c.get("changes", {}).items())[:80]
            html += f"<tr><td>{email}</td><td>{title}</td><td>{changes}</td></tr>\n"
        html += "</tbody></table>\n"

    # ── Attribution ──
    if attribution_data:
        html += '<h2 class="section-title">Attribution by Source</h2>\n'
        html += """<table>
<thead><tr><th>Source</th><th>Leads</th><th>Audits</th><th>Pitches</th><th>Revenue</th></tr></thead>
<tbody>
"""
        for src in attribution_data[:8]:
            html += f"<tr><td>{src.get('source','?')}</td><td>{src.get('leads',0)}</td><td>{src.get('audits_delivered',0)}</td><td>{src.get('pitches',0)}</td><td>${src.get('revenue',0)}</td></tr>\n"
        html += "</tbody></table>\n"

    # ── Footer ──
    html += f"""
<hr style="border-color:#252525;margin:32px 0 16px">
<p style="color:#6b7280;font-size:12px">
  Nebula Components · Pipeline Dashboard · Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}
  · <a href="pipeline_health.json">Health JSON</a> · <a href="stats.json">Stats JSON</a>
  · Night Watch running · Parallel Audit active
</p>
</body>
</html>"""
    return html


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate Nebula pipeline dashboard")
    parser.add_argument("--open", action="store_true", help="Open in browser")
    parser.add_argument("--quiet", action="store_true", help="Suppress stdout")
    parser.add_argument("--cron", action="store_true", help="Silent cron mode (no stdout)")
    args = parser.parse_args()

    DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)
    html = build_dashboard()
    OUTPUT_PATH.write_text(html)

    # Copy supporting JSON files for reference
    for fname in ["pipeline_health.json", "stats.json"]:
        src = NEBULA / fname
        if src.exists():
            (DASHBOARD_DIR / fname).write_text(src.read_text())

    if not args.quiet and not args.cron:
        file_size = len(html)
        print(f"DASHBOARD: {OUTPUT_PATH} ({file_size:,} bytes)")

    if args.open:
        import webbrowser
        webbrowser.open(f"file://{OUTPUT_PATH}")
        print(f"DASHBOARD: opened in browser")


if __name__ == "__main__":
    main()
