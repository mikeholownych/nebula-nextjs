#!/usr/bin/env python3
"""
parallel_audit.py — run N audits concurrently using subprocess delegation.

Jack Roberts principle: spin up sub-agents for parallel execution.
Instead of processing leads one-at-a-time, run up to 3 concurrent audit
processes, reducing total pipeline time by 3x.

Usage:
    python3 parallel_audit.py --leads leads.json
    python3 parallel_audit.py --emails file.txt        # one email per line
    python3 parallel_audit.py --stdin                   # pipe JSON lines

Integration:
    Called by trigger_lead_engine.py or cron. Writes audit results
    to audit_leads.jsonl and updates contacted.json.

Architecture:
    ┌─────────────────────────────────────────────┐
    │  parallel_audit.py (orchestrator)            │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
    │  │ audit A  │ │ audit B  │ │ audit C  │    │  ← concurrent
    │  └──────────┘ └──────────┘ └──────────┘    │
    │  each calls: deliver_audit.py single-shot   │
    └─────────────────────────────────────────────┘
"""

import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

NEBULA = Path("/home/mike/nebula")
AUDIT_LEADS_FILE = NEBULA / "audit_leads.jsonl"
CONTACTED_PATH = NEBULA / "contacted.json"
MAX_WORKERS = 3  # Jack's sweet spot — parallel but not rate-limited
VENV_PYTHON = str(NEBULA / "venv" / "bin" / "python3")


def run_single_audit(email: str, url: str, lead_data: dict = None) -> dict:
    """Run one deliver_audit.py process and return its result."""
    start = time.time()
    result = {
        "email": email,
        "url": url,
        "status": "pending",
        "duration_s": 0,
        "error": None,
    }

    try:
        proc = subprocess.run(
            [VENV_PYTHON, str(NEBULA / "deliver_audit.py"),
             url, email, "--json-output"],
            capture_output=True, text=True, timeout=120,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )
        result["duration_s"] = round(time.time() - start, 1)

        if proc.returncode == 0:
            # Try to parse JSON output from deliver_audit
            try:
                output = json.loads(proc.stdout.strip())
                result["status"] = output.get("status", "sent")
                result["message_id"] = output.get("message_id", "")
                result["audit_score"] = output.get("audit_score", 0)
                result["audit_grade"] = output.get("audit_grade", "")
            except (json.JSONDecodeError, ValueError):
                result["status"] = "sent"  # assumed success on clean exit
            result["stdout"] = proc.stdout.strip()[:200]
        else:
            result["status"] = "failed"
            result["error"] = proc.stderr.strip()[:300]
            result["stderr"] = proc.stderr.strip()[:300]
    except subprocess.TimeoutExpired:
        result["status"] = "timeout"
        result["error"] = f"Process exceeded 120s timeout"
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)[:200]

    return result


def load_leads(path: str = None) -> list[dict]:
    """Load leads from various input formats."""
    leads = []

    if path is None or path == "--stdin":
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                leads.append(json.loads(line))
            except json.JSONDecodeError:
                # Treat as email line with optional url
                parts = line.split(",")
                leads.append({"email": parts[0].strip(), "url": parts[1].strip() if len(parts) > 1 else ""})
    elif path.endswith(".json"):
        data = json.loads(Path(path).read_text())
        if data is None:
            data = {}
        if isinstance(data, list):
            leads = data
        elif isinstance(data, dict):
            # contacted.json format — keyed by email
            leads = [{"email": k, **v} for k, v in data.items() if v.get("url")]
    elif path.endswith(".jsonl"):
        for line in Path(path).read_text().strip().split("\n"):
            if line.strip():
                leads.append(json.loads(line))
    elif path.endswith(".txt"):
        for line in Path(path).read_text().strip().split("\n"):
            line = line.strip()
            if line and not line.startswith("#"):
                parts = line.split(",")
                leads.append({"email": parts[0].strip(), "url": parts[1].strip() if len(parts) > 1 else ""})
    else:
        # Assume it's a single url,email pair passed directly
        leads.append({"email": "", "url": path})

    # Filter leads without valid URLs
    valid = []
    for lead in leads:
        url = lead.get("url", "").strip()
        if not url or url == "None":
            continue
        if not url.startswith("http"):
            url = "https://" + url
        lead["url"] = url
        valid.append(lead)

    return valid


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Parallel audit pipeline — run N audits concurrently")
    parser.add_argument("--leads", type=str, default=None,
                        help="Path to leads file (.json/.jsonl/.txt) or '--stdin' for pipe")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS,
                        help=f"Concurrent workers (default: {MAX_WORKERS})")
    parser.add_argument("--since-hours", type=int, default=0,
                        help="Only audit leads contacted in last N hours (0 = all)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse and validate but don't execute")
    args = parser.parse_args()

    if not args.leads:
        # Default: read from contacted.json
        leads = load_leads(str(CONTACTED_PATH))
    else:
        leads = load_leads(args.leads)

    print(f"PARALLEL_AUDIT: {len(leads)} leads loaded, {args.workers} workers")
    
    if not leads:
        print("PARALLEL_AUDIT: no leads with URLs found — nothing to do")
        return

    if args.dry_run:
        for l in leads[:5]:
            print(f"  would audit: {l.get('email','?'):<30} {l.get('url','')[:60]}")
        if len(leads) > 5:
            print(f"  ... and {len(leads)-5} more")
        return

    results = []
    start_total = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(run_single_audit, lead.get("email", ""), lead["url"], lead): lead
            for lead in leads
        }

        done = 0
        failed = 0
        for future in as_completed(futures):
            done += 1
            lead = futures[future]
            try:
                result = future.result()
                results.append(result)
                if result["status"] in ("failed", "timeout", "error"):
                    failed += 1
                    print(f"  ✗ [{done}/{len(leads)}] {result['status']:<8} {lead.get('email','?'):<30} {result.get('error','')[:50]}")
                else:
                    print(f"  ✓ [{done}/{len(leads)}] {result['duration_s']:>4.1f}s  {lead.get('email','?'):<30} score={result.get('audit_score','?')}")
            except Exception as e:
                failed += 1
                print(f"  ✗ [{done}/{len(leads)}] error    {lead.get('email','?'):<30} {str(e)[:50]}")

    total_time = round(time.time() - start_total, 1)
    serial_estimate = round(sum(r.get("duration_s", 0) for r in results), 1)
    speedup = round(serial_estimate / max(total_time, 0.01), 1) if total_time > 0 else 1.0

    summary = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total": len(leads),
        "completed": len(results),
        "failed": failed,
        "total_time_s": total_time,
        "serial_estimate_s": serial_estimate,
        "speedup_x": speedup,
        "workers": args.workers,
    }

    print(f"\n{'='*50}")
    print(f"PARALLEL_AUDIT: {len(results)} audits in {total_time}s ({speedup}x speedup vs serial)")
    print(f"  workers={args.workers}  completed={len(results)}  failed={failed}")

    # Save results for downstream consumption
    results_file = NEBULA / f"parallel_audit_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    results_file.write_text(json.dumps(results, indent=2, default=str))
    print(f"PARALLEL_AUDIT: results → {results_file.name}")

    # Also append to audit_leads.jsonl
    with open(AUDIT_LEADS_FILE, "a") as f:
        for r in results:
            if r.get("status") == "sent":
                f.write(json.dumps(r) + "\n")

    return summary


if __name__ == "__main__":
    main()
