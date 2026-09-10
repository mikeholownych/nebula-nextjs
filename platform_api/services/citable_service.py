"""Citable CRO and Discovery Service.

Runs Citable's open-source CRO inspection, detector suite, and executive reporting
against submitted landing page targets to power Nebula's commercial SaaS audits.
Synchronizes audit results, 9 canonical conversion signals, and findings between
the results page and the executive briefing deliverable.
"""

from __future__ import annotations

import hashlib
import html
import json
import logging
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("nebula.citable_service")

MIN_CITABLE_VERSION = (1, 18, 0)
DEFAULT_CITABLE_VERSION = "1.18.1"
DEFAULT_CITABLE_COMMIT = "dccdf5c8ffbcb9134a35c7a89a01f81afe73f8ac"

REPO_ROOT = Path(__file__).resolve().parents[2]
CITABLE_RUNS_DIR = REPO_ROOT / ".citable" / "runs"


def resolve_citable_release_commit() -> str:
    """Read release commit from resource-data.json or return DEFAULT_CITABLE_COMMIT."""
    resource_data_file = REPO_ROOT / "customer-portal" / "public" / "resources" / "citable" / "resource-data.json"
    if resource_data_file.exists():
        try:
            data = json.loads(resource_data_file.read_text(encoding="utf-8"))
            commit = data.get("commit")
            if commit and isinstance(commit, str) and len(commit) == 40:
                return commit
        except Exception:
            pass
    return DEFAULT_CITABLE_COMMIT


CITABLE_RELEASE_COMMIT = resolve_citable_release_commit()


def compute_artifact_integrity_hash(summary_payload: Dict[str, Any], findings: List[Dict[str, Any]]) -> str:
    """Compute deterministic SHA-256 hash across sealed summary payload and findings."""
    canonical = json.dumps({"summary": summary_payload, "findings": findings}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


_DEFAULT_BIN_CANDIDATES = [
    Path("/home/mike/.hermes/node24/bin/citable"),
    Path("/usr/local/bin/citable"),
    Path("/usr/bin/citable"),
]

# Canonical 9 conversion signals matching customer-portal/config/signals.canon.json
CANONICAL_SIGNALS = [
    {"id": "headline", "canon": "message match", "label": "Message Match", "desc": "Does the page promise match the expectation created by referring ad or search?"},
    {"id": "cta", "canon": "CTA clarity", "label": "CTA Clarity", "desc": "Is the next step obvious and proportionate to visitor intent?"},
    {"id": "above_fold", "canon": "above-fold clarity", "label": "Above-Fold Clarity", "desc": "Can a visitor understand the offer and next action in the first viewport?"},
    {"id": "social_proof", "canon": "trust signals", "label": "Trust Signals", "desc": "Does the page support its claims with proximate proof before asking for commitment?"},
    {"id": "load_speed", "canon": "load speed", "label": "Load Speed", "desc": "Does the page become interactive quickly enough to prevent paid bounces?"},
    {"id": "mobile", "canon": "mobile viewport", "label": "Mobile Viewport", "desc": "Is the primary action visible and usable on small viewports?"},
    {"id": "ad_signals", "canon": "ad tracking", "label": "Ad Tracking", "desc": "Can paid clicks be connected to conversions and ROAS without guessing?"},
    {"id": "seo_foundations", "canon": "SEO foundations", "label": "SEO Foundations", "desc": "Can search systems retrieve and interpret core page architecture?"},
    {"id": "ai_readiness", "canon": "AI readiness", "label": "AI Readiness", "desc": "Can answer engines identify, verify, and cite page answers accurately?"},
]


def resolve_citable_bin() -> Optional[str]:
    """Find the executable path for citable."""
    env_bin = os.getenv("CITABLE_BIN")
    if env_bin and Path(env_bin).exists():
        return env_bin
    for cand in _DEFAULT_BIN_CANDIDATES:
        if cand.exists() and os.access(cand, os.X_OK):
            return str(cand)
    which_bin = shutil.which("citable")
    if which_bin:
        return which_bin
    return None


def citable_version(raw: str) -> tuple[int, int, int]:
    """Parse a semantic Citable version from CLI output or a version string."""
    import re

    match = re.search(r"(?:^|\s)v?(\d+)\.(\d+)\.(\d+)(?:\s|$)", raw.strip())
    if not match:
        raise ValueError(f"invalid Citable version: {raw!r}")
    return tuple(int(part) for part in match.groups())


def installed_citable_version(citable_bin: str, timeout_seconds: float = 5.0) -> str:
    """Return the installed Citable version, refusing versions below v1.17.0."""
    res = subprocess.run(
        [citable_bin, "--version"],
        capture_output=True,
        text=True,
        timeout=timeout_seconds,
        cwd=str(REPO_ROOT),
    )
    output = (res.stdout or res.stderr or "").strip()
    version = citable_version(output)
    if version < MIN_CITABLE_VERSION:
        raise RuntimeError(
            f"Citable {output!r} is below the required v{'.'.join(map(str, MIN_CITABLE_VERSION))}"
        )
    return f"{version[0]}.{version[1]}.{version[2]}"


def inspect_cro_telemetry(url: str, timeout_seconds: float = 15.0) -> Dict[str, Any]:
    """Execute Citable's open-source CRO inspector against a target URL."""
    citable_bin = resolve_citable_bin()
    if not citable_bin:
        logger.warning("citable binary not found; skipping CRO inspection")
        return {}

    try:
        release_version = installed_citable_version(citable_bin)
        cmd = [citable_bin, "inspect", "cro", "/", "--target", url, "--json"]
        res = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            cwd=str(REPO_ROOT),
        )
        if res.returncode == 0 and res.stdout.strip():
            payload = json.loads(res.stdout)
            telemetry = payload.get("result") if isinstance(payload, dict) and isinstance(payload.get("result"), dict) else payload
            if not isinstance(telemetry, dict):
                raise ValueError("Citable CRO result is not an object")
            telemetry["_citable_version"] = release_version
            if isinstance(payload, dict):
                telemetry["_citable_output_schema"] = payload.get("citable_output_schema")
                telemetry["_citable_generated_at"] = payload.get("generated_at")
            return telemetry
        logger.warning("citable inspect cro non-zero exit or empty: %s", res.stderr)
    except Exception as exc:
        logger.warning("citable inspect cro failed for %s: %s", url, exc)

    return {}


def _clean_str(value: Any) -> str:
    """Sanitize string removing em-dashes per repository doctrine."""
    if not value:
        return ""
    text = str(value).replace("\u2014", " - ").replace("\u2013", " - ")
    return text.strip()


def generate_cro_executive_brief(
    audit_data: Dict[str, Any],
    cro_telemetry: Optional[Dict[str, Any]] = None,
    client_name: str = "Nebula Client",
    format: str = "html",
    citable_version_text: str = DEFAULT_CITABLE_VERSION,
) -> str:
    """Render executive briefing matching the exact findings and score of the audit."""
    url = _clean_str(audit_data.get("url") or "https://nebulacomponents.com")
    raw_score = audit_data.get("score")
    raw_composite = audit_data.get("composite")
    grade = _clean_str(audit_data.get("grade") or "B")
    strategic_finding = _clean_str(audit_data.get("strategic_finding") or "")
    audit_id = _clean_str(str(audit_data.get("audit_id") or audit_data.get("id") or "N/A"))[:8]
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Score normalization (audit_data may store 0-10 or 0-100)
    score_val = float(raw_score) if raw_score is not None else 7.0
    if score_val > 10.0:
        score_val = score_val / 10.0
    comp_val = float(raw_composite) if raw_composite is not None else score_val
    if comp_val > 10.0:
        comp_val = comp_val / 10.0

    raw_findings = audit_data.get("findings") or []
    if isinstance(raw_findings, str):
        try:
            raw_findings = json.loads(raw_findings)
        except Exception:
            raw_findings = []

    findings_list: List[Dict[str, Any]] = []
    for f in raw_findings:
        if isinstance(f, dict):
            findings_list.append({
                "label": _clean_str(f.get("label") or f.get("key") or "Conversion Condition"),
                "condition_id": _clean_str(f.get("condition_id") or f.get("key") or "CRO-COND"),
                "issue": _clean_str(f.get("issue") or "Condition unfulfilled"),
                "fix": _clean_str(f.get("fix") or "Optimize landing page conversion condition"),
                "impact": float(f.get("impact") or 5.0),
                "effort": int(f.get("effort") or 3),
                "quadrant": _clean_str(f.get("quadrant") or "quick_win"),
                "determination": _clean_str(f.get("determination") or "FAIL"),
            })

    cro = cro_telemetry or audit_data.get("citable", {}).get("cro") or {}

    # Merge any findings detected by Citable CRO inspection
    seen_ids = {f["condition_id"] for f in findings_list}
    for cf in cro.get("findings") or []:
        det_id = _clean_str(cf.get("detector_id") or "CRO-COND")
        if det_id not in seen_ids:
            seen_ids.add(det_id)
            findings_list.append({
                "label": _clean_str(cf.get("detector_id") or "CRO Condition"),
                "condition_id": det_id,
                "issue": _clean_str(cf.get("summary") or "CRO friction detected"),
                "fix": _clean_str(cf.get("remediation") or "Optimize conversion action"),
                "impact": 8.0 if cf.get("severity") == "high" else (5.0 if cf.get("severity") == "medium" else 2.5),
                "effort": 3,
                "quadrant": "quick_win",
                "determination": "FAIL",
            })

    # Sort findings by impact descending
    findings_list.sort(key=lambda x: (-x["impact"], x["effort"]))

    dimensions = audit_data.get("dimensions") or {}
    if isinstance(dimensions, str):
        try:
            dimensions = json.loads(dimensions)
        except Exception:
            dimensions = {}

    cro_status = _clean_str(cro.get("conversion_status") or ("needs_attention" if findings_list else "ready"))
    ctas = cro.get("ctas") or []
    hero_ctas = cro.get("hero_cta_count", 0)
    forms = cro.get("forms") or []
    analytics_installed = bool(cro.get("analytics_installed", True))

    fmt = format.lower().strip()
    if fmt in ("markdown", "deck", "md", "markdown-deck"):
        # Markdown presentation deck format
        deck_lines = [
            f"# Executive Landing Page Conversion Briefing: {client_name}",
            "<!-- slide -->",
            "## Executive Scorecard",
            f"- **Target URL**: {url}",
            f"- **Audit ID**: {audit_id}",
            f"- **Audit Date**: {date_str}",
            f"- **Page Condition Score**: {comp_val:.1f} / 10 (Composite)",
            f"- **Conversion Grade**: {grade}",
            f"- **Conversion Posture**: {cro_status.upper()}",
            f"- **Failed Conditions**: {len(findings_list)} of 9 signals",
            "",
            "> Citable and Nebula measure observable landing page conversion conditions and evidence-backed heuristics. An effect on conversion outcomes is not established.",
            "",
            "<!-- slide -->",
            "## Nine Core Conversion Signals",
            "| Signal | Status | Score | Description |",
            "| :--- | :--- | :--- | :--- |",
        ]

        for sig in CANONICAL_SIGNALS:
            sig_dim = dimensions.get(sig["id"]) or {}
            s_score = float(sig_dim.get("score", 10.0))
            if s_score > 10.0:
                s_score = s_score / 10.0
            is_failing = any(f["condition_id"].lower().startswith(sig["id"].lower()) or sig["id"] in f["condition_id"].lower() for f in findings_list)
            status_str = "FAIL" if (is_failing or s_score < 7.0) else "PASS"
            deck_lines.append(f"| {sig['label']} | {status_str} | {s_score:.1f}/10 | {sig['desc']} |")

        deck_lines.extend([
            "",
            "<!-- slide -->",
            "## Prioritized Conversion Findings",
        ])

        if findings_list:
            for idx, f in enumerate(findings_list, 1):
                deck_lines.append(f"### {idx}. {f['label']} ({f['condition_id']})")
                deck_lines.append(f"- **Impact**: {f['impact']:.1f}/10 | **Effort**: {f['effort']}/5 ({f['quadrant']})")
                deck_lines.append(f"- **Observable Issue**: {f['issue']}")
                deck_lines.append(f"- **Recommended Fix**: {f['fix']}")
                deck_lines.append("")
        else:
            deck_lines.append("- Zero blocking conversion conditions detected.")

        if strategic_finding:
            deck_lines.extend([
                "<!-- slide -->",
                "## Strategic Synthesis",
                f"> {strategic_finding}",
                "",
                "### Implementation Directive",
                "- Priority 1: Focus on highest-impact failed condition to preserve ad spend.",
                "- Priority 2: Re-audit after 30 days to verify whether condition status resolved.",
            ])

        deck_lines.extend([
            "",
            "<!-- slide -->",
            "## Citable Telemetry & Page Inspection",
            f"- **Interactive CTAs Detected**: {len(ctas)} total ({hero_ctas} above fold)",
            f"- **Lead Capture Forms**: {len(forms)} form(s) analyzed",
            f"- **Conversion Tracking**: {'Installed' if analytics_installed else 'Not detected'}",
            f"- **Message Match**: {cro.get('title_to_h1_alignment', {}).get('h1Text', 'Verified')}",
            "",
            "<!-- slide -->",
            "## Governance & Regulatory Notice",
            "Nebula Components and Citable provide evidence-bounded analysis of public conversion mechanics.",
            "Findings reflect deterministic page inspection and published industry CRO heuristics. No warranty or guarantee of conversion rate lift is expressed or implied.",
        ])

        return "\n".join(deck_lines)

    # HTML Executive Brief format
    rows_signals = []
    for sig in CANONICAL_SIGNALS:
        sig_dim = dimensions.get(sig["id"]) or {}
        s_score = float(sig_dim.get("score", 10.0))
        if s_score > 10.0:
            s_score = s_score / 10.0
        is_failing = any(f["condition_id"].lower().startswith(sig["id"].lower()) or sig["id"] in f["condition_id"].lower() for f in findings_list)
        status_code = "FAIL" if (is_failing or s_score < 7.0) else "PASS"
        badge_class = "badge-fail" if status_code == "FAIL" else "badge-pass"

        rows_signals.append(f"""
        <tr>
          <td><strong>{html.escape(sig["label"])}</strong></td>
          <td><span class="badge {badge_class}">{status_code}</span></td>
          <td style="font-weight:600;">{s_score:.1f}/10</td>
          <td class="text-muted">{html.escape(sig["desc"])}</td>
        </tr>
        """)

    rows_findings = []
    for idx, f in enumerate(findings_list, 1):
        quad_label = "Quick Win" if f["quadrant"] == "quick_win" else ("Major Project" if f["quadrant"] == "major_project" else "Fill In")
        rows_findings.append(f"""
        <tr>
          <td>
            <span class="badge badge-fail">{idx}</span>
            <strong>{html.escape(f["label"])}</strong>
            <br/><span class="text-muted text-xs"><code>{html.escape(f["condition_id"])}</code></span>
          </td>
          <td>
            <span class="impact-pill">{f["impact"]:.1f}/10</span>
            <br/><span class="text-muted text-xs">{quad_label}</span>
          </td>
          <td>{html.escape(f["issue"])}</td>
          <td><span class="fix-text">{html.escape(f["fix"])}</span></td>
        </tr>
        """)

    if not rows_findings:
        rows_findings.append("""
        <tr>
          <td colspan="4" style="text-align: center; padding: 24px; color: #16a34a;">
            All 9 conversion signals passed this run. No critical conversion leaks detected.
          </td>
        </tr>
        """)

    strategic_block = ""
    if strategic_finding:
        strategic_block = f"""
        <div class="strategic-card">
          <div class="strategic-label">Executive Strategic Finding</div>
          <div class="strategic-content">{html.escape(strategic_finding)}</div>
        </div>
        """

    content_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Briefing: {html.escape(client_name)}</title>
  <style>
    :root {{
      --bg: #0a0b0d;
      --panel: #13151a;
      --border: #232730;
      --fg: #f3f4f6;
      --fg-muted: #9ca3af;
      --accent: #c7ff2f;
      --danger: #ef4444;
      --success: #10b981;
      --warning: #f59e0b;
    }}
    @media (prefers-color-scheme: light) {{
      :root {{
        --bg: #ffffff;
        --panel: #f9fafb;
        --border: #e5e7eb;
        --fg: #111827;
        --fg-muted: #6b7280;
        --accent: #0f172a;
        --danger: #dc2626;
        --success: #16a34a;
        --warning: #d97706;
      }}
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: var(--fg);
      background-color: var(--bg);
      max-width: 960px;
      margin: 40px auto;
      padding: 0 24px;
    }}
    .header-bar {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }}
    .header-title h1 {{
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 6px 0;
    }}
    .meta-line {{
      font-size: 13px;
      color: var(--fg-muted);
    }}
    .meta-line strong {{
      color: var(--fg);
    }}
    .brand-tag {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      background: rgba(199, 255, 47, 0.08);
      border: 1px solid rgba(199, 255, 47, 0.25);
      padding: 4px 10px;
      border-radius: 6px;
    }}
    .kpi-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }}
    .kpi-card {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }}
    .kpi-title {{
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--fg-muted);
      font-weight: 600;
    }}
    .kpi-val {{
      font-size: 32px;
      font-weight: 800;
      margin-top: 4px;
      font-variant-numeric: tabular-nums;
    }}
    .kpi-sub {{
      font-size: 12px;
      color: var(--fg-muted);
      margin-top: 4px;
    }}
    .strategic-card {{
      background: rgba(199, 255, 47, 0.04);
      border: 1px solid rgba(199, 255, 47, 0.3);
      border-radius: 8px;
      padding: 18px 20px;
      margin: 28px 0;
    }}
    .strategic-label {{
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 6px;
    }}
    .strategic-content {{
      font-size: 15px;
      line-height: 1.6;
      color: var(--fg);
    }}
    h2 {{
      font-size: 18px;
      font-weight: 700;
      margin: 36px 0 14px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 14px;
    }}
    th, td {{
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }}
    th {{
      background: var(--panel);
      font-weight: 600;
      color: var(--fg-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .badge {{
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }}
    .badge-fail {{
      background: rgba(239, 68, 68, 0.15);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }}
    .badge-pass {{
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }}
    .impact-pill {{
      display: inline-block;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      font-size: 13px;
    }}
    .fix-text {{
      color: var(--fg);
      font-size: 13px;
    }}
    .text-muted {{
      color: var(--fg-muted);
    }}
    .text-xs {{
      font-size: 12px;
    }}
    code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
    }}
    .telemetry-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }}
    .telemetry-box {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 14px;
    }}
    .telemetry-box strong {{
      display: block;
      font-size: 13px;
      margin-bottom: 4px;
    }}
    .telemetry-box span {{
      font-size: 13px;
      color: var(--fg-muted);
    }}
    .disclosure {{
      background: var(--panel);
      border-left: 3px solid var(--fg-muted);
      padding: 14px 18px;
      font-size: 12px;
      color: var(--fg-muted);
      line-height: 1.6;
      margin-top: 40px;
      border-radius: 0 6px 6px 0;
    }}
    .footer-actions {{
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: var(--fg-muted);
      flex-wrap: wrap;
      gap: 12px;
    }}
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="header-title">
      <span class="brand-tag">Citable + Nebula Components</span>
      <h1 style="margin-top: 8px;">Executive Landing Page Conversion Briefing</h1>
      <div class="meta-line">
        <strong>Client:</strong> {html.escape(client_name)} &nbsp;|&nbsp;
        <strong>Target URL:</strong> {html.escape(url)} &nbsp;|&nbsp;
        <strong>Audit ID:</strong> {html.escape(audit_id)} &nbsp;|&nbsp;
        <strong>Date:</strong> {date_str}
      </div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Condition Score</div>
      <div class="kpi-val">{comp_val:.1f}<span style="font-size: 18px; color: var(--fg-muted);">/10</span></div>
      <div class="kpi-sub">Composite anchor</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Conversion Grade</div>
      <div class="kpi-val" style="color: {'var(--success)' if grade.startswith('A') else ('var(--warning)' if grade.startswith('B') else 'var(--danger)')};">{html.escape(grade)}</div>
      <div class="kpi-sub">Overall rating</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Conversion Leaks</div>
      <div class="kpi-val" style="color: {'var(--danger)' if len(findings_list) > 0 else 'var(--success)'};">{len(findings_list)}</div>
      <div class="kpi-sub">Failed conditions</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Citable Posture</div>
      <div class="kpi-val" style="font-size: 20px; margin-top: 14px; text-transform: uppercase;">{html.escape(cro_status.replace('_', ' '))}</div>
      <div class="kpi-sub">Readiness status</div>
    </div>
  </div>

  {strategic_block}

  <h2>Nine Core Conversion Signals</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Signal</th>
        <th style="width: 14%;">Status</th>
        <th style="width: 16%;">Score</th>
        <th>Diagnostic Scope</th>
      </tr>
    </thead>
    <tbody>
      {"".join(rows_signals)}
    </tbody>
  </table>

  <h2>Prioritized Findings and Remediation Agenda</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Failed Condition</th>
        <th style="width: 16%;">Impact / Effort</th>
        <th style="width: 28%;">Observable Condition</th>
        <th>Recommended Fix</th>
      </tr>
    </thead>
    <tbody>
      {"".join(rows_findings)}
    </tbody>
  </table>

  <h2>Citable CRO Telemetry & Evidence</h2>
  <div class="telemetry-grid">
    <div class="telemetry-box">
      <strong>Call to Action Visibility</strong>
      <span>{len(ctas)} interactive CTAs detected ({hero_ctas} above fold in hero)</span>
    </div>
    <div class="telemetry-box">
      <strong>Lead Capture Friction</strong>
      <span>{len(forms)} form(s) analyzed for input friction and submit triggers</span>
    </div>
    <div class="telemetry-box">
      <strong>Search and Ad Scent</strong>
      <span>H1: "{html.escape(cro.get('title_to_h1_alignment', {}).get('h1Text', 'Detected')[:40])}"</span>
    </div>
    <div class="telemetry-box">
      <strong>Analytics and Tracking</strong>
      <span>{'Analytics tags confirmed active' if analytics_installed else 'No standard tracking tags detected'}</span>
    </div>
  </div>

  <div class="disclosure">
    <strong>Regulatory & Governance Notice:</strong> Nebula Components and Citable measure observable landing page conversion conditions, interaction friction, and evidence-backed heuristics. Nebula has not established that changing these conditions alone guarantees conversion lift. Audit findings reflect deterministic inspections and published industry CRO baselines.
  </div>

  <div class="footer-actions">
    <div>Generated by Nebula Components SaaS Platform powered by Citable v{citable_version_text}</div>
    <div>nebulacomponents.com</div>
  </div>
</body>
</html>
"""

    return content_html


def run_citable_analysis(
    url: str,
    client_name: str = "Nebula Client",
    audit_data: Optional[Dict[str, Any]] = None,
    timeout_seconds: float = 30.0,
) -> Dict[str, Any]:
    """Execute Citable CRO inspection and page audit on a submitted URL.

    Returns structured Citable CRO metrics, findings, and synchronized
    Executive Brief (HTML) and Markdown deck deliverables matching the audit results.
    """
    cro_telemetry = inspect_cro_telemetry(url, timeout_seconds=min(timeout_seconds, 15.0))
    release_version = cro_telemetry.get("_citable_version", DEFAULT_CITABLE_VERSION)

    base_audit = audit_data or {
        "url": url,
        "score": 7.0,
        "composite": 7.0,
        "grade": "B",
        "findings": [],
        "dimensions": {},
    }

    brief_html = generate_cro_executive_brief(
        base_audit,
        cro_telemetry=cro_telemetry,
        client_name=client_name,
        format="html",
        citable_version_text=release_version,
    )

    deck_md = generate_cro_executive_brief(
        base_audit,
        cro_telemetry=cro_telemetry,
        client_name=client_name,
        format="markdown-deck",
        citable_version_text=release_version,
    )

    findings = list(base_audit.get("findings") or [])
    seen_ids = {f.get("condition_id") or f.get("key") for f in findings if isinstance(f, dict)}
    for cf in cro_telemetry.get("findings") or []:
        det_id = _clean_str(cf.get("detector_id") or "CRO-COND")
        if det_id not in seen_ids:
            seen_ids.add(det_id)
            finding = {
                "label": _clean_str(cf.get("detector_id") or "CRO Condition"),
                "condition_id": det_id,
                "issue": _clean_str(cf.get("summary") or "CRO friction detected"),
                "fix": _clean_str(cf.get("remediation") or "Optimize conversion action"),
                "impact": 8.0 if cf.get("severity") == "high" else (5.0 if cf.get("severity") == "medium" else 2.5),
                "effort": 3,
                "quadrant": "quick_win",
                "determination": "FAIL",
            }
            for key in (
                "detector_version",
                "tool_version",
                "source_url",
                "evidence_selector",
                "evidence_source_class",
                "viewport",
                "methodology",
                "revalidation_requirement",
                "confidence",
            ):
                if key in cf:
                    finding[key] = cf[key]
            finding.setdefault("detector_version", cf.get("detector_version", 1))
            finding.setdefault("tool_version", cf.get("tool_version") or release_version)
            finding.setdefault("methodology", cf.get("methodology", "heuristic"))
            finding.setdefault("revalidation_requirement", cf.get("revalidation_requirement", "same_condition_inspection"))
            findings.append(finding)
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        imp = float(f.get("impact", 5.0))
        if imp >= 8.0:
            counts["critical"] += 1
        elif imp >= 5.0:
            counts["high"] += 1
        elif imp >= 2.5:
            counts["medium"] += 1
        else:
            counts["low"] += 1

    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ-citable-cro")
    generated_at_str = datetime.now(timezone.utc).isoformat()
    summary_payload = {
        "counts": counts,
        "posture": {
            "cro": cro_telemetry.get("conversion_status", "ready"),
            "support": "suitable",
            "evidence": "measured",
        },
        "url": url,
        "generated_at": generated_at_str,
    }
    integrity_hash = compute_artifact_integrity_hash(summary_payload, findings)

    manifest_payload = {
        "run_id": run_id,
        "citable_version": release_version,
        "citable_release_commit": CITABLE_RELEASE_COMMIT,
        "integrity_hash": integrity_hash,
        "generated_at": generated_at_str,
        "url": url,
        "counts": counts,
        "findings_count": len(findings),
    }

    # Persist sealed run record into .citable/runs/<run_id>
    try:
        run_dir = CITABLE_RUNS_DIR / run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        (run_dir / "summary.json").write_text(json.dumps(summary_payload, indent=2), encoding="utf-8")
        (run_dir / "findings.json").write_text(json.dumps(findings, indent=2), encoding="utf-8")
        (run_dir / "manifest.json").write_text(json.dumps(manifest_payload, indent=2), encoding="utf-8")
    except Exception as exc:
        logger.warning("failed to persist citable run directory for %s: %s", run_id, exc)

    return {
        "status": "completed",
        "run_id": run_id,
        "url": url,
        "client_name": client_name,
        "citable_version": release_version,
        "citable_release_commit": CITABLE_RELEASE_COMMIT,
        "citable_output_schema": cro_telemetry.get("_citable_output_schema"),
        "citable_generated_at": cro_telemetry.get("_citable_generated_at"),
        "integrity_hash": integrity_hash,
        "counts": counts,
        "cro": cro_telemetry,
        "findings": findings,
        "executive_brief_html": brief_html,
        "executive_deck_md": deck_md,
    }


def generate_citable_implementation_kit(
    audit_data: Dict[str, Any],
    finding_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a customer-ready implementation kit for the selected or highest-impact finding."""
    audit_id = _clean_str(str(audit_data.get("id") or audit_data.get("audit_id") or "N/A"))
    url = _clean_str(audit_data.get("url") or "")
    findings = list(audit_data.get("findings") or [])
    if isinstance(findings, str):
        try:
            findings = json.loads(findings)
        except Exception:
            findings = []

    target_finding: Dict[str, Any] = {}
    if finding_id:
        for f in findings:
            if isinstance(f, dict) and (f.get("condition_id") == finding_id or f.get("key") == finding_id):
                target_finding = f
                break

    if not target_finding and findings:
        sorted_findings = sorted(
            [f for f in findings if isinstance(f, dict)],
            key=lambda x: (-float(x.get("impact") or 5.0), int(x.get("effort") or 3)),
        )
        if sorted_findings:
            target_finding = sorted_findings[0]

    cond_id = _clean_str(target_finding.get("condition_id") or target_finding.get("key") or "CRO-001")
    label = _clean_str(target_finding.get("label") or "Conversion Condition")
    issue = _clean_str(target_finding.get("issue") or "Condition unfulfilled on audited target")
    fix = _clean_str(target_finding.get("fix") or "Apply replacement copy or configuration")

    kit_core = {
        "schema_version": "1.0",
        "audit_id": audit_id,
        "url": url,
        "target_condition_id": cond_id,
        "finding": {
            "condition_id": cond_id,
            "label": label,
            "issue": issue,
            "recommended_fix": fix,
            "impact": float(target_finding.get("impact") or 5.0),
            "effort": int(target_finding.get("effort") or 3),
            "detector_version": target_finding.get("detector_version", 1),
            "methodology": target_finding.get("methodology", "heuristic"),
            "revalidation_requirement": target_finding.get("revalidation_requirement", "same_condition_inspection"),
        },
        "component_template": {
            "action": "replace",
            "condition": cond_id,
            "implementation_payload": fix,
        },
        "acceptance_tests": [
            f"Verify observable condition for {cond_id} has been applied on {url}",
            f"Inspect target viewport to confirm {label} fulfills heuristic criteria",
            "Confirm no console errors or visual regressions introduced",
        ],
        "deployment_and_rollback": {
            "deployment": "Apply the implementation payload to your staging or production environment and run acceptance tests.",
            "rollback": "Revert the commit or CMS content change if acceptance tests fail or regressions occur.",
        },
        "re_audit_instructions": "After shipping to production, trigger a 30-day same-scope re-audit to verify whether the condition changed from FAIL to PASS.",
        "boundary_notice": "Nebula Components and Citable measure observable landing page conversion conditions. An effect on conversion outcomes is not established.",
    }

    core_bytes = json.dumps(kit_core, sort_keys=True, separators=(",", ":")).encode("utf-8")
    kit_core["integrity_hash"] = hashlib.sha256(core_bytes).hexdigest()
    return kit_core


def generate_citable_remediation_verification(
    audit_data: Dict[str, Any],
    finding_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a closed-loop same-condition verification report."""
    audit_id = _clean_str(str(audit_data.get("id") or audit_data.get("audit_id") or "N/A"))
    url = _clean_str(audit_data.get("url") or "")
    findings = list(audit_data.get("findings") or [])
    if isinstance(findings, str):
        try:
            findings = json.loads(findings)
        except Exception:
            findings = []

    target_finding: Dict[str, Any] = {}
    if finding_id:
        for f in findings:
            if isinstance(f, dict) and (f.get("condition_id") == finding_id or f.get("key") == finding_id):
                target_finding = f
                break

    if not target_finding and findings:
        sorted_findings = sorted(
            [f for f in findings if isinstance(f, dict)],
            key=lambda x: (-float(x.get("impact") or 5.0), int(x.get("effort") or 3)),
        )
        if sorted_findings:
            target_finding = sorted_findings[0]

    cond_id = _clean_str(target_finding.get("condition_id") or target_finding.get("key") or "CRO-001")
    label = _clean_str(target_finding.get("label") or "Conversion Condition")
    issue = _clean_str(target_finding.get("issue") or "Condition unfulfilled")

    verif_core = {
        "schema_version": "1.0",
        "audit_id": audit_id,
        "url": url,
        "condition_id": cond_id,
        "condition_label": label,
        "status": "pending_reobservation",
        "before_state": {
            "status": "FAIL",
            "issue": issue,
        },
        "after_state": {
            "status": "AWAITING_REAUDIT",
            "revalidation_window_days": 30,
        },
        "verdict": "awaiting_30_day_reobservation",
        "revalidation_directive": "Re-run audit after deployment. A change from FAIL to PASS indicates the diagnosed condition changed.",
        "boundary_notice": "Same-condition re-observation proves the diagnosed condition changed. It does not prove conversion impact. That boundary is differentiation, not a defect to hide.",
    }

    core_bytes = json.dumps(verif_core, sort_keys=True, separators=(",", ":")).encode("utf-8")
    verif_core["integrity_hash"] = hashlib.sha256(core_bytes).hexdigest()
    return verif_core
