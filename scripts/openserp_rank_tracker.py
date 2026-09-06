#!/usr/bin/env python3
"""Collect project-scoped SERP observations from a local OpenSERP server."""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "config" / "openserp_tracking.json"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def domain_matches(value: str | None, target: str) -> bool:
    value = (value or "").lower().removeprefix("www.").rstrip(".")
    target = target.lower().removeprefix("www.").rstrip(".")
    return value == target or value.endswith(f".{target}")


def keywords_from(path: Path) -> list[str]:
    data = load_json(path)
    result: list[str] = []
    for group in ("primary_keywords", "secondary_keywords"):
        for values in data.get(group, {}).values():
            result.extend(str(value).strip().lower() for value in values if str(value).strip())
    return list(dict.fromkeys(result))


def request_search(base_url: str, engine: str, keyword: str, region: str, language: str, limit: int, timeout: int, retries: int = 2) -> dict[str, Any]:
    query = urllib.parse.urlencode({"text": keyword, "region": region, "lang": language, "limit": limit})
    url = f"{base_url.rstrip('/')}/{urllib.parse.quote(engine)}/search?{query}"
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "NebulaOpenSERPTracker/1.0"})
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if not isinstance(payload, dict) or not isinstance(payload.get("results"), list):
                raise ValueError("OpenSERP response lacks a results array")
            last_count = len(payload["results"])
            if last_count > 0:
                return payload
            if attempt < retries:
                time.sleep(2 ** attempt)
        except urllib.error.HTTPError as exc:
            if exc.code != 429 and not 500 <= exc.code < 600:
                raise
            if attempt >= retries:
                raise
            time.sleep(2 ** attempt)
        except (urllib.error.URLError, TimeoutError):
            if attempt >= retries:
                raise
            time.sleep(2 ** attempt)
    raise ValueError(f"OpenSERP returned an empty SERP after {retries + 1} attempts")


def collect(config: dict[str, Any], keywords: list[str], engines: list[str], run_id: str, timeout: int) -> tuple[dict[str, Any], dict[str, Any]]:
    observed_at = datetime.now(timezone.utc).isoformat()
    rows: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    target = config["site"]
    for engine in engines:
        for keyword in keywords:
            try:
                payload = request_search(config["base_url"], engine, keyword, config["region"], config["language"], int(config["limit"]), timeout, int(config.get("retries", 2)))
                hit = next((item for item in payload["results"] if domain_matches(item.get("domain"), target)), None)
                rows.append({
                    "keyword": keyword,
                    "market": config["region"],
                    "language": config["language"],
                    "device": config["device"],
                    "engine": engine,
                    "domain": target,
                    "position": hit.get("rank") if hit else None,
                    "ranking_url": hit.get("url") if hit else None,
                    "title": hit.get("title") if hit else None,
                    "result_count": len(payload["results"]),
                    "observed_at": observed_at,
                    "run_id": run_id,
                    "theory_id": config.get("attribution", {}).get("theory_id"),
                    "cohort_id": config.get("attribution", {}).get("cohort_id"),
                    "experiment_id": config.get("attribution", {}).get("experiment_id"),
                    "source": "openserp",
                })
            except Exception as exc:  # keep other keyword observations usable
                failures.append({"keyword": keyword, "engine": engine, "observed_at": observed_at, "run_id": run_id, "error": str(exc), "source": "openserp"})
    return {"schema_version": 1, "provider": "openserp", "run_id": run_id, "observed_at": observed_at, "config": {"site": target, "engines": engines, "region": config["region"], "language": config["language"], "device": config["device"], "limit": config["limit"]}, "rows": rows}, {"schema_version": 1, "provider": "openserp", "run_id": run_id, "observed_at": observed_at, "failures": failures}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--keywords", nargs="*", help="Override configured keywords")
    parser.add_argument("--engines", nargs="*", help="Override configured engines")
    parser.add_argument("--run-id", default=None)
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--output-dir", type=Path, default=None)
    args = parser.parse_args()
    config = load_json(args.config)
    keywords = [k.strip().lower() for k in args.keywords if k.strip()] if args.keywords else keywords_from(ROOT / config["keywords_source"])
    engines = args.engines or config["engines"]
    run_id = args.run_id or f"openserp-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    report, failure_report = collect(config, keywords, engines, run_id, args.timeout)
    out = args.output_dir or ROOT / config["output_dir"]
    out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    raw_path = out / f"raw-{run_id}.json"
    rows_path = out / f"rows-{run_id}.json"
    failures_path = out / f"failures-{run_id}.json"
    raw_path.write_text(json.dumps(report, indent=2) + "\n")
    rows_path.write_text(json.dumps(report["rows"], indent=2) + "\n")
    failures_path.write_text(json.dumps(failure_report, indent=2) + "\n")
    print(f"run_id={run_id}")
    print(f"queries_requested={len(keywords) * len(engines)}")
    print(f"observations={len(report['rows'])}")
    print(f"failures={len(failure_report['failures'])}")
    print(f"raw_report={raw_path}")
    print(f"rows_report={rows_path}")
    print(f"failures_report={failures_path}")
    return 0 if not failure_report["failures"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
