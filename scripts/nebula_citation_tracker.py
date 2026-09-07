#!/usr/bin/env python3
"""Capture evidence for Nebula's unbranded AI citation prompts.

This worker is measurement only. It does not publish content, change the registry,
or treat an empty/failed response as evidence of zero visibility.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "customer-portal/public/query_registry.json"
REPORT_DIR = ROOT / "aeo-reports"
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "perplexity/sonar"
BRAND_RE = re.compile(r"\bnebula\s+components\b|nebulacomponents\.com|nebulacomponents\.shop", re.I)
PRIORITY_TERMS = ("paid traffic", "not converting", "conversion", "mobile", "audit", "ads", "landing page")


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for path in (ROOT / ".env.local", ROOT / "customer-portal/.env.local"):
        if not path.exists():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    return values


def choose_queries(queries: list[dict[str, Any]], zero_only: bool, priority_only: bool, limit: int) -> list[dict[str, Any]]:
    selected = queries
    if zero_only:
        selected = [q for q in selected if q.get("baseline_mention_rate") in (None, 0, 0.0)]
    if priority_only:
        selected = [q for q in selected if q.get("commercial_value") == "high" or any(term in q.get("canonical_question", "").lower() for term in PRIORITY_TERMS)]
    selected = sorted(selected, key=lambda q: (-(1 if q.get("commercial_value") == "high" else 0), q.get("query_id", "")))
    return selected[:limit]


def request_answer(question: str, api_key: str, timeout: int) -> tuple[str, dict[str, Any]]:
    payload = {"model": MODEL, "temperature": 0.2, "max_tokens": 500, "messages": [{"role": "user", "content": question}]}
    request = urllib.request.Request(API_URL, data=json.dumps(payload).encode(), headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nebulacomponents.com",
        "X-Title": "Nebula citation tracker",
    }, method="POST")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read()
    data = json.loads(raw)
    answer = data["choices"][0]["message"]["content"]
    if not isinstance(answer, str) or not answer.strip():
        raise ValueError("provider returned an empty answer")
    return answer, data


def run(args: argparse.Namespace) -> int:
    env = load_env()
    api_key = os.environ.get("OPENROUTER_API_KEY") or env.get("OPENROUTER_API_KEY", "")
    if not api_key:
        print("ERROR: OPENROUTER_API_KEY is not configured", file=sys.stderr)
        return 2
    if not REGISTRY.exists():
        print(f"ERROR: query registry missing: {REGISTRY}", file=sys.stderr)
        return 2
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    queries = registry.get("queries")
    if not isinstance(queries, list) or not queries:
        print("ERROR: query registry has no queries", file=sys.stderr)
        return 2
    selected = choose_queries(queries, args.zero_only, args.priority_only, args.limit)
    if not selected:
        print("ERROR: no queries matched the requested selection", file=sys.stderr)
        return 2

    captured_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    results: list[dict[str, Any]] = []
    for query in selected:
        question = query["canonical_question"]
        try:
            answer, provider_response = request_answer(question, api_key, args.timeout)
            raw_answer = answer.encode("utf-8")
            results.append({
                "query_id": query.get("query_id"), "question": question,
                "status": "observed", "mention": bool(BRAND_RE.search(answer)),
                "answer": answer, "answer_sha256": hashlib.sha256(raw_answer).hexdigest(),
                "model": MODEL, "captured_at": captured_at,
                "provider_id": provider_response.get("id"),
            })
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError, ValueError, json.JSONDecodeError) as exc:
            results.append({"query_id": query.get("query_id"), "question": question, "status": "no_data", "error_type": type(exc).__name__, "error": str(exc)[:240], "model": MODEL, "captured_at": captured_at})

    observed = [r for r in results if r["status"] == "observed"]
    cited = [r for r in observed if r["mention"]]
    report = {"captured_at": captured_at, "model": MODEL, "registry": str(REGISTRY.relative_to(ROOT)), "selection": {"zero_only": args.zero_only, "priority_only": args.priority_only, "limit": args.limit}, "tested": len(results), "observed": len(observed), "cited": len(cited), "citation_rate": round(len(cited) / len(observed), 4) if observed else None, "results": results, "limitations": ["A failed or empty provider response is no_data, not zero visibility.", "This is a spot check, not a census.", "Mention detection is lexical and does not judge citation quality."]}
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = captured_at.replace(":", "").replace("-", "")
    (REPORT_DIR / f"citation-tracker-{stamp}.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    lines = [f"# Citation tracker: {captured_at}", "", f"- Tested: `{len(results)}`", f"- Observed: `{len(observed)}`", f"- Cited: `{len(cited)}`", f"- Citation rate: `{report['citation_rate'] if report['citation_rate'] is not None else 'no_data'}`", "", "## Results", ""]
    lines += [f"- `{r['query_id']}` {r['status']}: {r['question']}" + (f" — mention={r['mention']}" if r['status'] == 'observed' else f" — {r.get('error_type')}" ) for r in results]
    lines += ["", "## Limitations", ""] + [f"- {item}" for item in report["limitations"]] + [""]
    (REPORT_DIR / f"citation-tracker-{stamp}.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"tested": len(results), "observed": len(observed), "cited": len(cited), "citation_rate": report["citation_rate"], "report_dir": str(REPORT_DIR)}))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--zero-only", action="store_true")
    parser.add_argument("--priority-only", action="store_true")
    parser.add_argument("--limit", type=int, default=15)
    parser.add_argument("--timeout", type=int, default=45)
    return run(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
