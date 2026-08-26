#!/usr/bin/env python3
"""Live route probe - the 'nothing errors out' gate.

Probes every route in the OpenAPI spec against a running API and fails on
any 5xx. Auth-guarded routes are expected to answer 4xx; those are healthy.
State-changers that are public by design are skipped explicitly.

Usage:
    venv/bin/python3 platform_api/scripts/probe_routes.py [--base-url URL]

Exit codes: 0 = clean, 1 = one or more 5xx defects, 2 = could not reach API.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

# Public-by-design state changers: probing them would do real work.
SKIP_EXACT = {
    ("POST", "/audit/run"),
    ("POST", "/hooks/deploy/{token}"),  # token-gated; probing burns nothing but proves nothing
    # Lead/newsletter capture endpoints would otherwise ingest probe junk rows
    # into production tables on every deploy.
    ("POST", "/api/newsletter/subscribe"),
    ("POST", "/leads/exit-intent"),
    ("POST", "/visitor-profile"),
    ("POST", "/api/ab/conversion"),
}

DUMMY_UUID = "00000000-0000-0000-0000-000000000000"


def _fill(path: str) -> str:
    out = path
    for param in {"audit_id", "schedule_id", "session_id", "competitor_id",
                  "exp_id", "hook_id", "key_id", "badge_id", "monitor_id",
                  "rec_id", "org_id", "email", "token"}:
        out = out.replace(f"{{{param}}}", DUMMY_UUID if param != "email" else "probe@example.invalid")
    return out


def _request(base: str, method: str, url_path: str, timeout: float = 10.0):
    req = urllib.request.Request(
        base + url_path, method=method,
        data=b"" if method in ("POST", "PUT", "PATCH") else None,
        headers={"Content-Type": "application/json"} if method in ("POST", "PUT", "PATCH") else {},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://127.0.0.1:8001")
    args = ap.parse_args()

    from platform_api.main import app

    spec = app.openapi()
    probes = []
    for path, ops in spec["paths"].items():
        for method in ops:
            m = method.upper()
            if (m, path) in SKIP_EXACT:
                continue
            probes.append((m, _fill(path)))

    defects, healthy, unreachable = [], [], []
    for method, url in sorted(probes):
        code = _request(args.base_url, method, url)
        row = f"{method:6} {url} -> {code}"
        if code is None:
            unreachable.append(row)
        elif code >= 500:
            defects.append(row)
        else:
            healthy.append(row)

    print(f"probed={len(probes)} healthy(4xx/2xx/3xx)={len(healthy)} "
          f"5xx-defects={len(defects)} unreachable={len(unreachable)}")
    for row in defects:
        print("DEFECT ", row)
    for row in unreachable:
        print("UNREACHABLE", row)
    return 1 if defects or unreachable else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as exc:  # cannot even build app -> loud failure
        print(f"probe setup failed: {exc}", file=sys.stderr)
        sys.exit(2)
