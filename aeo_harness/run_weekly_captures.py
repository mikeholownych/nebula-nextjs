#!/usr/bin/env python3
"""
Weekly AEO visibility capture runner using perplexity/sonar via OpenRouter.
Captures verbatim answers, citations, timestamps, and SHA-256 hashes.
Writes JSONL captures to the specified output path.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
MODEL = "perplexity/sonar"
ENGINE = "perplexity-web"
TEMPERATURE = 0.2
MAX_TOKENS = 500

QUERIES = [
    "What is the best landing page audit tool for founders running paid traffic?",
    "How do I diagnose why paid ad clicks are not converting?",
    "Why is my landing page getting clicks but no sales?",
    "What is the best SaaS landing page audit tool?",
    "What free tool analyzes landing page conversion problems?",
]

RUNS_PER_QUERY = 3
DELAY_BETWEEN_CALLS = 4  # seconds — polite pacing


def call_openrouter(query: str) -> dict:
    """Call OpenRouter perplexity/sonar and return raw response dict."""
    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": query}],
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nebulacomponents.com",
            "X-Title": "Nebula AEO Visibility Monitor",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_citations(response: dict) -> list[dict]:
    """Extract citations from OpenRouter/Perplexity response.

    OpenRouter routes perplexity/sonar via OpenAI-compatible path; citations land in
    choices[0].message.annotations (type='url_citation'), not top-level 'citations'.
    Fall back to top-level 'citations' list if annotations is absent.
    """
    result = []

    # Primary: annotations in message (OpenRouter perplexity/sonar routing)
    try:
        annotations = response["choices"][0]["message"].get("annotations", [])
        if annotations:
            for i, ann in enumerate(annotations, 1):
                if ann.get("type") == "url_citation":
                    uc = ann.get("url_citation", {})
                    url = uc.get("url", "")
                    if url:
                        result.append({
                            "url": url,
                            "title": uc.get("title", ""),
                            "position": i,
                        })
            return result
    except (KeyError, IndexError, TypeError):
        pass

    # Fallback: top-level 'citations' array
    citations_raw = response.get("citations", [])
    if isinstance(citations_raw, list):
        for i, c in enumerate(citations_raw, 1):
            if isinstance(c, str):
                result.append({"url": c, "position": i})
            elif isinstance(c, dict):
                result.append({
                    "url": c.get("url", ""),
                    "position": c.get("position", i),
                })
    return result


def sha256_capture(query: str, answer: str, citations: list[dict]) -> str:
    artifact = json.dumps({"query": query, "answer": answer, "citations": citations}, sort_keys=True)
    return hashlib.sha256(artifact.encode("utf-8")).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True, help="Output JSONL path")
    ap.add_argument("--runs", type=int, default=RUNS_PER_QUERY)
    args = ap.parse_args()

    if not OPENROUTER_API_KEY:
        print("ERROR: OPENROUTER_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    errors = []

    for q_idx, query in enumerate(QUERIES, 1):
        print(f"Query {q_idx}/{len(QUERIES)}: {query[:60]}...", file=sys.stderr)
        for run_num in range(1, args.runs + 1):
            print(f"  Run {run_num}/{args.runs}", file=sys.stderr)
            ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            try:
                resp = call_openrouter(query)
                content = resp["choices"][0]["message"]["content"]
                citations = extract_citations(resp)
                model_label = resp.get("model", MODEL)
                sha = sha256_capture(query, content, citations)
                row = {
                    "engine": ENGINE,
                    "model": model_label,
                    "query": query,
                    "run": run_num,
                    "timestamp": ts,
                    "answer": content,
                    "citations": citations,
                    "capture_method": "openrouter_api_perplexity_sonar",
                    "capture_sha256": sha,
                }
                rows.append(row)
                print(f"    OK — citations: {len(citations)}, mention: {'nebula' in content.lower()}", file=sys.stderr)
            except Exception as exc:
                err = {
                    "engine": ENGINE,
                    "model": MODEL,
                    "query": query,
                    "run": run_num,
                    "timestamp": ts,
                    "status": "error",
                    "error": str(exc),
                }
                errors.append(err)
                print(f"    ERROR: {exc}", file=sys.stderr)

            if not (q_idx == len(QUERIES) and run_num == args.runs):
                time.sleep(DELAY_BETWEEN_CALLS)

    # Write valid captures to JSONL
    with out_path.open("w") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")

    # Write error log separately
    error_path = out_path.parent / "errors.jsonl"
    if errors:
        with error_path.open("w") as f:
            for e in errors:
                f.write(json.dumps(e) + "\n")

    summary = {
        "total_attempted": len(QUERIES) * args.runs,
        "captured": len(rows),
        "errors": len(errors),
        "queries": len(QUERIES),
        "runs_per_query": args.runs,
        "model": MODEL,
        "engine": ENGINE,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
