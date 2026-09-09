"""Scoring adapters for the audit worker.

HTTP handlers must not call subprocess.run. The CLI adapter is only invoked
from a worker thread via asyncio.to_thread.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Optional

REPO_ROOT = Path(__file__).resolve().parents[2]
AUDIT_SCRIPT = REPO_ROOT / "deliver_audit.py"
_VENV_PYTHON = REPO_ROOT / "venv" / "bin" / "python3"
_HOST_PYTHON = Path("/home/mike/nebula/venv/bin/python3")


def _python_bin() -> str:
    override = os.getenv("AUDIT_PYTHON")
    if override:
        return override
    if _VENV_PYTHON.exists():
        return str(_VENV_PYTHON)
    if _HOST_PYTHON.exists():
        return str(_HOST_PYTHON)
    return sys.executable


def audit_engine_mode() -> str:
    return (os.getenv("AUDIT_ENGINE") or "inprocess").strip().lower()


def _parse_json_output(stdout: str) -> dict:
    lines = stdout.strip().split("\n")
    json_line = None
    for line in reversed(lines):
        if line.strip().startswith("{"):
            json_line = line
            break
    if not json_line:
        raise ValueError("no_json_output")
    return json.loads(json_line)


def score_inprocess(job: dict) -> dict:
    """Import deliver_audit scoring. Raises ImportError if the module cannot load."""
    repo = str(REPO_ROOT)
    if repo not in sys.path:
        sys.path.insert(0, repo)
    import deliver_audit as da  # type: ignore

    url = job["url"]
    session = da.get_session()
    html = da.fetch_page(url, session)
    if not html:
        raise RuntimeError("fetch_failed")
    page = da.scrape_page(url, html)
    if getattr(da, "HAS_SIGNAL_VERIFIER", False):
        audit = da.score_audit_with_signal_verifiers(page)
    else:
        audit = da.score_audit(page)

    historical = job.get("historical_data")
    if historical:
        audit = da.apply_historical_personalization(audit, historical)

    guided = None
    if getattr(da, "HAS_GUIDED_IMPLEMENTATION", False):
        try:
            from guided_implementation import build_guided_implementation
            guided = build_guided_implementation(audit, page)
        except Exception:
            guided = None

    citable_res = {}
    try:
        audit_data_payload = {
            "audit_id": str(job.get("id", "")),
            "url": url,
            "score": audit.get("overall"),
            "composite": audit.get("composite"),
            "grade": audit.get("overall_grade", ""),
            "findings": audit.get("opp_matrix", []),
            "dimensions": audit.get("dimensions", {}),
            "strategic_finding": audit.get("strategic_finding"),
            "guided_implementation": guided or audit.get("guided_implementation"),
        }
        citable_res = run_citable_analysis(url, client_name=client_name, audit_data=audit_data_payload)
    except Exception as _c_exc:
        import logging as _c_log
        _c_log.getLogger("nebula.audit_engine").warning("Citable analysis failed for %s: %s", url, _c_exc)

    return {
        "url": url,
        "email": job.get("email"),
        "score": audit.get("overall"),
        "grade": audit.get("overall_grade", ""),
        "engine_version": audit.get("engine_version", getattr(da, "ENGINE_VERSION", None)),
        "composite": audit.get("composite"),
        "composite_anchor": audit.get("composite_anchor"),
        "findings": audit.get("opp_matrix", []),
        "dimensions": audit.get("dimensions", {}),
        "page_title": page.get("title", ""),
        "page_h1": page.get("h1", ""),
        "guided_implementation": guided or audit.get("guided_implementation"),
        "strategic_finding": audit.get("strategic_finding"),
        "historical_data": audit.get("historical_data"),
        "historical_insights": audit.get("historical_insights"),
        "observation": audit.get("observation"),
        "case_file": audit.get("case_file"),
        "registry_version": audit.get("registry_version"),
        "citable": citable_res,
        "citable_brief": citable_res.get("executive_brief_html"),
        "citable_deck": citable_res.get("executive_deck_md"),
        "citable_version": citable_res.get("citable_version"),
        "citable_release_commit": citable_res.get("citable_release_commit"),
        "citable_run_id": citable_res.get("run_id"),
        "citable_integrity_hash": citable_res.get("integrity_hash"),
    }


def score_via_cli(job: dict) -> dict:
    """Run deliver_audit.py --json --dry-run. Call only from a worker thread."""
    email = job.get("email") or "anonymous@invalid.nebulacomponents.com"
    cmd = [
        _python_bin(),
        str(AUDIT_SCRIPT),
        job["url"],
        email,
        "--json",
        "--dry-run",
    ]
    historical = job.get("historical_data")
    if historical:
        cmd.extend(["--historical-data", json.dumps(historical)])
    spend = job.get("monthly_ad_spend")
    if spend is not None:
        cmd.extend(["--monthly-ad-spend", str(spend)])

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=120,
        cwd=str(REPO_ROOT),
        shell=False,
    )
    if result.returncode != 0:
        raise RuntimeError("script_error")
    data = _parse_json_output(result.stdout)
    data["engine"] = "cli"
    return data


def score_job(job: dict) -> dict:
    mode = audit_engine_mode()
    if mode == "cli":
        return score_via_cli(job)
    try:
        return score_inprocess(job)
    except ImportError:
        return score_via_cli(job)
