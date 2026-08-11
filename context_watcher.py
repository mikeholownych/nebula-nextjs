#!/usr/bin/env python3
"""
CONTEXT.md Watcher - Nebula Components
Detects when source-of-truth files have changed since CONTEXT.md was last
updated, then dispatches a Hermes agent to apply the delta.

Runs weekly via cron (or on-demand). Silent when nothing changed.
Inspired by OKF "LLM as wiki librarian" pattern.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path('/home/mike/nebula')
CONTEXT_FILE = REPO / 'customer-portal' / 'CONTEXT.md'
STATE_FILE = REPO / 'context_watcher_state.json'
LOCK_FILE = REPO / 'context_watcher.lock'

# Files whose changes should trigger a CONTEXT.md review.
# Format: (repo-relative path, what it affects in CONTEXT.md)
WATCHED_FILES = [
    ('platform_api/services/audit_db.py',           'AuditDB methods, table names, DB schema'),
    ('platform_api/config.py',                      'service ports, environment variables'),
    ('platform_api/routes/audit_api.py',            'API endpoints, route paths'),
    ('platform_api/routes/audits.py',               'API endpoints, route paths'),
    ('customer-portal/app/audit/page.tsx',          'audit flow, frontend routes'),
    ('customer-portal/DESIGN.md',                   'brand colors, typography tokens'),
    ('customer-portal/PRODUCT.md',                  'ICP, offer definition, pricing'),
    ('customer-portal/next.config.ts',              'Next.js routing, rewrites'),
    ('CLAUDE.md',                                   'offer prices, service URLs, key operational facts'),
]

# ─── Lock ────────────────────────────────────────────────────────────────────

def acquire_lock():
    if LOCK_FILE.exists():
        try:
            pid = int(LOCK_FILE.read_text().strip())
            os.kill(pid, 0)
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
    print(f'[{ts}] {msg}', flush=True)

# ─── State ───────────────────────────────────────────────────────────────────

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"file_commits": {}, "context_last_updated": None}

def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2))

# ─── Git helpers ─────────────────────────────────────────────────────────────

def git(*args) -> str:
    result = subprocess.run(
        ['git', '-C', str(REPO)] + list(args),
        capture_output=True, text=True, timeout=15
    )
    return result.stdout.strip()

def current_commit(path: str) -> str | None:
    """Last commit SHA that touched this file."""
    out = git('log', '--format=%H', '-1', '--', path)
    return out or None

def commit_summary(sha: str) -> str:
    if not sha:
        return 'no commits'
    return git('log', '--format=%h %s (%ar)', '-1', sha)

def diff_since(path: str, old_sha: str) -> str:
    """Unified diff of path since old_sha."""
    if not old_sha:
        return git('show', f'HEAD:{path}')[:3000]
    return git('diff', old_sha, 'HEAD', '--', path)[:3000]

# ─── Change detection ────────────────────────────────────────────────────────

def detect_changes(state: dict) -> list[dict]:
    """
    Compare current HEAD commit for each watched file against last-seen commit.
    Returns list of {path, affects, old_sha, new_sha, diff_snippet}.
    """
    changes = []
    for path, affects in WATCHED_FILES:
        new_sha = current_commit(path)
        old_sha = state['file_commits'].get(path)

        if new_sha and new_sha != old_sha:
            diff = diff_since(path, old_sha) if old_sha else f"[new file - {path}]"
            changes.append({
                'path': path,
                'affects': affects,
                'old_sha': old_sha,
                'new_sha': new_sha,
                'commit_summary': commit_summary(new_sha),
                'diff_snippet': diff[:1500],
            })
    return changes

# ─── Agent dispatch ──────────────────────────────────────────────────────────

def build_agent_prompt(changes: list[dict], context_content: str) -> str:
    change_list = '\n\n'.join(
        f"### {c['path']}\n"
        f"Affects: {c['affects']}\n"
        f"Change: {c['commit_summary']}\n"
        f"Diff:\n```\n{c['diff_snippet']}\n```"
        for c in changes
    )

    return f"""You are the CONTEXT.md maintenance agent for Nebula Components.

Your job: update CONTEXT.md at /home/mike/nebula/customer-portal/CONTEXT.md
to reflect the changes below. Make only targeted, factual edits - do not
restructure or rewrite sections that aren't affected.

Rules:
- Use the existing CONTEXT.md vocabulary and section headings
- Only change entries that are factually outdated based on the diffs
- If a signal was added/removed in signal_verifier.py, update the Signals list
- If a DB method changed, update AuditDB section
- If a port or service URL changed in config.py or CLAUDE.md, update Architecture
- If an offer price changed, update the Product section
- If nothing in a section changed, leave it exactly as-is
- At the bottom of the file, append (or update) a `## Change Log` entry:
  `- {datetime.now(timezone.utc).strftime('%Y-%m-%d')}: Updated by context_watcher - <one-line summary of what changed>`
- Then commit: git -C /home/mike/nebula add customer-portal/CONTEXT.md && git -C /home/mike/nebula commit -m "docs(context): auto-update CONTEXT.md - <summary>"

## Current CONTEXT.md

```markdown
{context_content[:6000]}
```

## Changed files (apply these diffs to update CONTEXT.md):

{change_list}

After editing and committing, output exactly:
CONTEXT_UPDATED: <one-line summary of changes made>
"""

def dispatch_agent(prompt: str):
    """Write the prompt to a temp file and call hermes run."""
    prompt_file = REPO / '.context_watcher_prompt.tmp'
    prompt_file.write_text(prompt)
    try:
        result = subprocess.run(
            ['hermes', 'run', str(prompt_file)],
            capture_output=True, text=True, timeout=300
        )
        output = result.stdout + result.stderr
        log(f"Agent exit {result.returncode}")
        if 'CONTEXT_UPDATED:' in output:
            # Extract summary line
            for line in output.splitlines():
                if line.startswith('CONTEXT_UPDATED:'):
                    log(f"✅ {line}")
                    break
        else:
            log(f"Agent output tail: {output[-500:]}")
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        log("Agent timed out (300s)")
        return False
    finally:
        prompt_file.unlink(missing_ok=True)

def send_telegram(msg: str):
    try:
        subprocess.run(
            ['hermes', 'send', '--to', 'telegram:5920497760', msg],
            capture_output=True, timeout=20, text=True
        )
    except Exception as e:
        log(f"telegram send failed: {e}")

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    acquire_lock()
    try:
        state = load_state()
        changes = detect_changes(state)

        if not changes:
            log("No changes detected in watched files. CONTEXT.md is current.")
            return

        log(f"Detected {len(changes)} changed file(s):")
        for c in changes:
            log(f"  {c['path']} - {c['commit_summary']}")

        if not CONTEXT_FILE.exists():
            log(f"CONTEXT.md missing at {CONTEXT_FILE} - skipping agent dispatch.")
            return

        context_content = CONTEXT_FILE.read_text()
        prompt = build_agent_prompt(changes, context_content)

        log("Dispatching maintenance agent…")
        success = dispatch_agent(prompt)

        if success:
            # Update state: mark all watched files as seen at current SHA
            for path, _ in WATCHED_FILES:
                sha = current_commit(path)
                if sha:
                    state['file_commits'][path] = sha
            state['context_last_updated'] = datetime.now(timezone.utc).isoformat()
            save_state(state)

            summary = ', '.join(c['path'].split('/')[-1] for c in changes)
            send_telegram(f"📖 CONTEXT.md updated\nTriggered by: {summary}")
        else:
            log("Agent failed - state not updated, will retry next run.")

    finally:
        release_lock()


if __name__ == '__main__':
    main()
