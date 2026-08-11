#!/usr/bin/env python3
"""
Error Enricher - Nebula Components
Monitors nebula-platform-api journal for 500s and tracebacks.
On detection: enriches with file → recent commits → prior occurrences → Telegram alert.

Runs every 2 min via cron. Silent when healthy.
Pattern adapted from airweave-ai/error-monitoring-agent - no Airweave dependency needed.
"""

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from collections import defaultdict

BASE = Path('/home/mike/nebula')
STATE_FILE = BASE / 'error_enricher_state.json'
LOG_FILE = BASE / 'error_enricher.log'
LOCK_FILE = BASE / 'error_enricher.lock'
PLATFORM_API_DIR = BASE / 'platform_api'
VENV_PYTHON = str(BASE / 'venv/bin/python3')

# How far back to scan for new errors (seconds)
SCAN_WINDOW_SECONDS = 150  # 2.5 min - overlap to catch boundary errors

# Dedup: suppress repeat alerts for same error signature within this window
DEDUP_WINDOW_MINUTES = 60

# ─── Lock ────────────────────────────────────────────────────────────────────

def acquire_lock():
    if LOCK_FILE.exists():
        try:
            pid = int(LOCK_FILE.read_text().strip())
            os.kill(pid, 0)  # check if process alive
            log(f"Already running (pid {pid}), exiting.")
            sys.exit(0)
        except (ProcessLookupError, ValueError):
            LOCK_FILE.unlink(missing_ok=True)
    LOCK_FILE.write_text(str(os.getpid()))

def release_lock():
    LOCK_FILE.unlink(missing_ok=True)

# ─── Logging ─────────────────────────────────────────────────────────────────

def log(msg: str):
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    with LOG_FILE.open('a') as f:
        f.write(line + '\n')
    # Trim to last 3000 lines
    try:
        lines = LOG_FILE.read_text().splitlines()
        if len(lines) > 3000:
            LOG_FILE.write_text('\n'.join(lines[-2500:]) + '\n')
    except Exception:
        pass

# ─── State ───────────────────────────────────────────────────────────────────

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"seen": {}}  # signature -> last_alerted_iso

def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2))

# ─── Journal scrape ──────────────────────────────────────────────────────────

def fetch_recent_journal(unit: str = 'nebula-platform-api', seconds: int = SCAN_WINDOW_SECONDS) -> str:
    try:
        result = subprocess.run(
            ['sudo', 'journalctl', '-u', unit, '--no-pager',
             f'--since={seconds} seconds ago', '-o', 'short-iso'],
            capture_output=True, text=True, timeout=15
        )
        return result.stdout
    except Exception as e:
        log(f"journal fetch failed: {e}")
        return ""

# ─── Error extraction ─────────────────────────────────────────────────────────

# Patterns to detect 500-class errors
ERROR_PATTERNS = [
    re.compile(r'ERROR.*Exception', re.IGNORECASE),
    re.compile(r'Traceback \(most recent call last\)'),
    re.compile(r'HTTP/1\.[01]" 5\d\d '),   # 5xx response codes
    re.compile(r'CRITICAL', re.IGNORECASE),
    re.compile(r'Unhandled exception'),
    re.compile(r'raise \w+Error|raise \w+Exception'),
]

FILE_PATTERN = re.compile(r'File "([^"]+\.py)", line (\d+)')
EXCEPTION_PATTERN = re.compile(r'^(\w+(?:Error|Exception|Warning)): (.+)$', re.MULTILINE)
ROUTE_PATTERN = re.compile(r'"(GET|POST|PUT|DELETE|PATCH) ([^\s"]+)')


def extract_error_clusters(journal_text: str) -> list[dict]:
    """
    Parse journal output into error clusters.
    Returns list of {signature, exception_type, message, file, line, route, raw_lines}.
    Groups traceback blocks together; also catches standalone 500 log lines.
    """
    lines = journal_text.splitlines()
    clusters = []
    current_block = []
    in_traceback = False

    for line in lines:
        if 'Traceback (most recent call last)' in line:
            in_traceback = True
            current_block = [line]
            continue

        if in_traceback:
            current_block.append(line)
            # Traceback ends at the exception line: no leading whitespace,
            # not empty, and we have at least 3 lines
            stripped = line.lstrip()
            if len(current_block) >= 3 and stripped and not line.startswith(' ') and not line.startswith('\t'):
                in_traceback = False
                cluster = _parse_block(current_block)
                if cluster:
                    clusters.append(cluster)
                current_block = []
            continue

        # Standalone 500 response line (not inside a traceback)
        if ROUTE_PATTERN.search(line) and re.search(r'" 5\d\d ', line):
            cluster = _parse_block([line])
            if cluster:
                # Attach route to previous traceback cluster if signatures match
                if clusters and not clusters[-1].get("route"):
                    route_m = ROUTE_PATTERN.search(line)
                    if route_m:
                        clusters[-1]["route"] = f"{route_m.group(1)} {route_m.group(2)}"
                        clusters[-1]["signature"] = (
                            f"{clusters[-1]['exception_type']}:"
                            f"{clusters[-1].get('file', 'unknown')}:"
                            f"{clusters[-1].get('line', '0')}"
                        )
                else:
                    clusters.append(cluster)

    if current_block:
        cluster = _parse_block(current_block)
        if cluster:
            clusters.append(cluster)

    # Deduplicate by signature, keeping last occurrence
    seen = {}
    for c in clusters:
        seen[c["signature"]] = c
    return list(seen.values())


def _parse_block(lines: list[str]) -> dict | None:
    text = '\n'.join(lines)

    # Extract file + line - prefer innermost app frame over venv/stdlib frames
    file_match = None
    app_frame = None
    for m in FILE_PATTERN.finditer(text):
        file_match = m
        fp = m.group(1)
        if '/venv/' not in fp and '/site-packages/' not in fp and str(BASE) in fp:
            app_frame = m
    best = app_frame or file_match
    file_path = best.group(1) if best else None
    line_no = best.group(2) if best else None

    # Normalize file path to repo-relative
    rel_path = None
    if file_path:
        try:
            rel_path = str(Path(file_path).relative_to(BASE))
        except ValueError:
            rel_path = file_path

    # Extract exception type + message
    # Try matching against lines directly (journal prefix may precede the exception class)
    exc_match = EXCEPTION_PATTERN.search(text)
    if not exc_match:
        # Try each line stripped of journal prefix (timestamp + host + process)
        journal_prefix = re.compile(r'^\S+\s+\S+\s+\S+\[\d+\]:\s*')
        for raw_line in lines:
            stripped = journal_prefix.sub('', raw_line)
            exc_match = re.search(r'(\w+(?:Error|Exception|Warning)): (.+)$', stripped)
            if exc_match:
                break
    exc_type = exc_match.group(1) if exc_match else None
    exc_msg = exc_match.group(2)[:200] if exc_match else None

    # Extract route
    route_match = ROUTE_PATTERN.search(text)
    route = f"{route_match.group(1)} {route_match.group(2)}" if route_match else None

    # Build dedup signature
    signature = f"{exc_type or 'unknown'}:{rel_path or 'unknown'}:{line_no or '0'}"

    if not exc_type and not any(p.search(text) for p in ERROR_PATTERNS):
        return None

    return {
        "signature": signature,
        "exception_type": exc_type or "UnknownError",
        "message": exc_msg or lines[-1][:200] if lines else "unknown",
        "file": rel_path,
        "line": line_no,
        "route": route,
        "raw": text[:1000],
    }

# ─── Enrichment ───────────────────────────────────────────────────────────────

def enrich(error: dict) -> dict:
    """Add git context: recent commits touching the file, first-seen vs regression."""
    enriched = dict(error)

    if error.get("file"):
        enriched["recent_commits"] = _git_log_file(error["file"])
        enriched["last_changed_by"] = _last_commit_touching(error["file"])
    else:
        enriched["recent_commits"] = []
        enriched["last_changed_by"] = None

    return enriched


def _git_log_file(rel_path: str, n: int = 3) -> list[str]:
    try:
        result = subprocess.run(
            ['git', '-C', str(BASE), 'log', '--oneline', f'-{n}', '--', rel_path],
            capture_output=True, text=True, timeout=10
        )
        return [l.strip() for l in result.stdout.splitlines() if l.strip()]
    except Exception:
        return []


def _last_commit_touching(rel_path: str) -> str | None:
    try:
        result = subprocess.run(
            ['git', '-C', str(BASE), 'log', '-1', '--format=%h %s (%ar)', '--', rel_path],
            capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip() or None
    except Exception:
        return None

# ─── Dedup ────────────────────────────────────────────────────────────────────

def should_alert(signature: str, state: dict) -> bool:
    seen = state.get("seen", {})
    if signature not in seen:
        return True
    last_alerted = datetime.fromisoformat(seen[signature])
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=DEDUP_WINDOW_MINUTES)
    return last_alerted < cutoff


def mark_alerted(signature: str, state: dict):
    state.setdefault("seen", {})[signature] = datetime.now(timezone.utc).isoformat()
    # Prune entries older than 24h
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    state["seen"] = {k: v for k, v in state["seen"].items() if v > cutoff}

# ─── Alert ────────────────────────────────────────────────────────────────────

def format_alert(error: dict, is_new: bool) -> str:
    tag = "🆕 NEW" if is_new else "🔁 REGRESSION"
    lines = [
        f"🚨 *Platform API Error* {tag}",
        f"*Type:* `{error['exception_type']}`",
        f"*Msg:* {error['message'][:150]}",
    ]
    if error.get("route"):
        lines.append(f"*Route:* `{error['route']}`")
    if error.get("file"):
        loc = f"`{error['file']}`"
        if error.get("line"):
            loc += f" line {error['line']}"
        lines.append(f"*File:* {loc}")
    if error.get("last_changed_by"):
        lines.append(f"*Last commit:* `{error['last_changed_by']}`")
    if error.get("recent_commits"):
        lines.append("*Recent touches:*")
        for c in error["recent_commits"][:2]:
            lines.append(f"  • `{c}`")
    return '\n'.join(lines)


def send_telegram(msg: str):
    try:
        result = subprocess.run(
            ['hermes', 'send', '--to', 'telegram:5920497760', msg],
            capture_output=True, timeout=20, text=True
        )
        if result.returncode != 0:
            log(f"telegram send failed: rc={result.returncode} {result.stderr.strip()[:200]}")
    except Exception as e:
        log(f"telegram send exception: {e}")

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    acquire_lock()
    try:
        state = load_state()

        journal = fetch_recent_journal()
        if not journal:
            return

        errors = extract_error_clusters(journal)
        if not errors:
            return

        log(f"Found {len(errors)} error cluster(s) in last {SCAN_WINDOW_SECONDS}s")

        # Deduplicate within this run by signature
        seen_this_run = set()
        alerted = 0

        for error in errors:
            sig = error["signature"]
            if sig in seen_this_run:
                continue
            seen_this_run.add(sig)

            if not should_alert(sig, state):
                log(f"Suppressed (dedup): {sig}")
                continue

            is_new = sig not in state.get("seen", {})
            enriched = enrich(error)
            msg = format_alert(enriched, is_new)
            send_telegram(msg)
            mark_alerted(sig, state)
            alerted += 1
            log(f"Alerted: {sig} (new={is_new})")

        save_state(state)

        if alerted:
            log(f"Sent {alerted} alert(s).")

    finally:
        release_lock()


if __name__ == '__main__':
    main()
