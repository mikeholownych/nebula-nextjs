#!/usr/bin/env python3
"""Deterministic recovery handler for Platform API incidents.

Called by the journal error enricher after it finds an application traceback.
It does not guess at code fixes. It gathers the authoritative service state,
performs only a bounded API restart when the API is unhealthy, verifies the
recovery, and writes an append-only incident record.
"""
from __future__ import annotations

import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/home/mike/nebula")
LEDGER = BASE / "ledgers" / "sre-incidents.jsonl"
UNIT = "nebula-platform-api.service"
HEALTH_URL = "http://127.0.0.1:8001/healthz"


def _run(args: list[str], timeout: int = 20) -> tuple[int, str]:
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr).strip()[-4000:]
    except Exception as exc:
        return 1, f"{type(exc).__name__}: {exc}"


def _active() -> tuple[bool, str]:
    rc, out = _run(["systemctl", "is-active", UNIT], 10)
    return rc == 0 and out.splitlines()[-1:] == ["active"], out


def _healthy() -> tuple[bool, str]:
    rc, out = _run(["curl", "-fsS", "--max-time", "8", HEALTH_URL], 12)
    return rc == 0, out


def _recent_logs() -> str:
    _, out = _run(
        ["journalctl", "-u", UNIT, "--since", "10 minutes ago", "--no-pager", "-o", "short-iso"],
        20,
    )
    return out


def investigate_and_recover(errors: list[dict], *, allow_restart: bool = True) -> dict:
    """Investigate one alert batch and recover only if the API is unhealthy."""
    started = datetime.now(timezone.utc).isoformat()
    active_before, active_detail = _active()
    healthy_before, health_detail_before = _healthy()
    logs = _recent_logs()
    result = {
        "incident_id": f"platform-api-{int(time.time())}",
        "started_at": started,
        "unit": UNIT,
        "errors": [
            {k: e.get(k) for k in ("signature", "exception_type", "message", "file", "line", "route")}
            for e in errors
        ],
        "investigation": {
            "service_active_before": active_before,
            "health_before": healthy_before,
            "health_detail_before": health_detail_before,
            "recent_log_excerpt": logs[-4000:],
        },
        "action": "none",
    }

    if not healthy_before and allow_restart:
        result["action"] = "restart_api"
        rc, restart_detail = _run(["sudo", "systemctl", "restart", UNIT], 45)
        result["restart_rc"] = rc
        result["restart_detail"] = restart_detail
        # Give systemd a bounded window, not an unbounded sleep.
        active_after, active_after_detail = False, "not checked"
        healthy_after, health_after_detail = False, "not checked"
        for _ in range(6):
            time.sleep(2)
            active_after, active_after_detail = _active()
            healthy_after, health_after_detail = _healthy()
            if active_after and healthy_after:
                result["recovery"] = {
                    "recovered": True,
                    "status": "restarted_and_verified",
                    "service_active_after": active_after,
                    "health_after": healthy_after,
                    "health_detail_after": health_after_detail,
                }
                break
        else:
            result["recovery"] = {
                "recovered": False,
                "service_active_after": active_after,
                "health_after": healthy_after,
                "health_detail_after": health_after_detail,
                "service_detail_after": active_after_detail,
            }
    else:
        result["recovery"] = {
            "recovered": healthy_before,
            "status": "verified_healthy_no_restart" if healthy_before else "unhealthy_restart_disabled",
            "service_active_after": active_before,
            "health_after": healthy_before,
            "health_detail_after": health_detail_before,
            "note": "No restart required; service health probe passed." if healthy_before else "Restart disabled.",
        }

    result["completed_at"] = datetime.now(timezone.utc).isoformat()
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    with LEDGER.open("a", encoding="utf-8") as f:
        f.write(json.dumps(result, ensure_ascii=False) + "\n")
    return result


if __name__ == "__main__":
    import sys
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = []
    print(json.dumps(investigate_and_recover(payload, allow_restart=True), indent=2))
