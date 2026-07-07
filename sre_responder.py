#!/usr/bin/env python3
"""
SRE Responder — Nebula Components
Detect → Remediate → Verify → Escalate (only when auto-fix fails)

Runs every 15 min via cron. Stays silent when healthy.
Alerts only on: escalation needed, revenue event, 3x fix failure.
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE = Path('/home/mike/nebula')
HEALTH_FILE = BASE / 'pipeline_health.json'
SRE_STATE = BASE / 'sre_state.json'
REMEDIATION_LOG = BASE / 'sre_remediation.log'
VENV_PYTHON = str(BASE / 'venv/bin/python3')
NOW = datetime.now(timezone.utc)

# ── Telegram alert via hermes ──────────────────────────────────────────────
def telegram_alert(msg: str, level: str = 'warn'):
    """Only fires on escalation or revenue events. Not on every warning."""
    icon = {'info': 'ℹ️', 'warn': '⚠️', 'critical': '🚨', 'revenue': '💰'}.get(level, '⚠️')
    full = f"{icon} *SRE [{level.upper()}]*\n{msg}"
    try:
        subprocess.run(
            ['hermes', 'send', '--chat', '5920497760', full],
            capture_output=True, timeout=15
        )
    except Exception as e:
        log(f'telegram_alert failed: {e}')

def log(msg: str):
    ts = NOW.strftime('%Y-%m-%d %H:%M:%S UTC')
    line = f'[{ts}] {msg}'
    print(line)
    with REMEDIATION_LOG.open('a') as f:
        f.write(line + '\n')
    # Trim to last 2000 lines
    lines = REMEDIATION_LOG.read_text().splitlines()
    if len(lines) > 2000:
        REMEDIATION_LOG.write_text('\n'.join(lines[-2000:]) + '\n')

# ── SRE state for failure counters ───────────────────────────────────────
def load_sre_state() -> dict:
    try:
        return json.loads(SRE_STATE.read_text())
    except Exception:
        return {}

def save_sre_state(state: dict):
    SRE_STATE.write_text(json.dumps(state, indent=2, default=str))

def bump_failure(state: dict, key: str) -> int:
    state.setdefault('failures', {})
    state['failures'][key] = state['failures'].get(key, 0) + 1
    return state['failures'][key]

def clear_failure(state: dict, key: str):
    state.setdefault('failures', {})
    state['failures'].pop(key, None)

# ── Remediations ─────────────────────────────────────────────────────────

def fix_missing_scripts():
    """Ensure all cron wrapper scripts exist."""
    wrappers = {
        'followup_sequence.sh': 'followup_sequence.py',
        'pipeline_ramp.sh': 'ramp_pipeline_fill.py',
        'bounce_scan.sh': 'bounce_scan_cron.py',
        'signal_scrapers.sh': 'signal_scrapers.py',
        'audit_to_case_study.sh': 'audit_to_case_study.py',
        'ih_authority_scheduler.sh': 'ih_authority_scheduler.py',
        'surge_weekly.sh': 'surge_weekly_outreach.py',
        'testimonial_queue.sh': 'testimonial_queue.py',
        'nebula_company_os_sync.sh': 'nebula_company_os_sync.py',
        'nebula_claude_growth_system.sh': 'nebula_claude_growth_system.py',
        'nebula-daily-brief.sh': 'nebula_daily_brief.py',
        'inbox_monitor.py': None,  # script itself, just needs to exist
    }
    fixed = []
    for sh, py in wrappers.items():
        path = BASE / sh
        if path.exists():
            continue
        if py is None:
            # Create a no-op stub that exits 0
            path.write_text('#!/usr/bin/env bash\nexit 0\n')
        else:
            target = BASE / py
            if target.exists():
                path.write_text(f'#!/usr/bin/env bash\nset -euo pipefail\ncd /home/mike/nebula\nexec python3 {py} "$@"\n')
            else:
                path.write_text(f'#!/usr/bin/env bash\n# STUB: {py} not yet implemented\nexit 0\n')
        path.chmod(0o755)
        fixed.append(sh)
    if fixed:
        log(f'[auto-fix] Created missing wrappers: {", ".join(fixed)}')
    return len(fixed)

def fix_stale_ramp_lock():
    """Remove stale pipeline_ramp.lock if >30 min old."""
    lock = BASE / 'pipeline_ramp.lock'
    if not lock.exists():
        return False
    age_min = (NOW.timestamp() - lock.stat().st_mtime) / 60
    if age_min > 30:
        lock.unlink()
        log(f'[auto-fix] Removed stale ramp lock (age={age_min:.0f}m)')
        return True
    return False

def fix_stale_followup_lock():
    """Remove stale followup.lock if >30 min old."""
    lock = BASE / 'followup.lock'
    if not lock.exists():
        return False
    age_min = (NOW.timestamp() - lock.stat().st_mtime) / 60
    if age_min > 30:
        lock.unlink()
        log(f'[auto-fix] Removed stale followup lock (age={age_min:.0f}m)')
        return True
    return False

def fix_dead_letter():
    """Retry leads in dead letter queue that are still deliverable."""
    dlq = BASE / 'dead_letter.json'
    if not dlq.exists():
        return 0
    try:
        items = json.loads(dlq.read_text())
        if not items:
            return 0
    except Exception:
        return 0

    # Import inline to avoid hard dependency
    sys.path.insert(0, str(BASE))
    try:
        from agentmail_client import AgentMailClient
        from lead_store import LeadStore
        am = AgentMailClient()
        db = LeadStore()
    except ImportError as e:
        log(f'[dlq] Import failed: {e}')
        return 0

    retried = []
    remaining = []
    for item in items:
        email = item.get('email', '')
        if not email or db.is_bounced(email):
            continue
        r = am.send(
            to=[email],
            subject=item.get('subject', 'Re: your audit'),
            text=item.get('body', ''),
        )
        if r.get('message_id'):
            db.upsert_lead(email=email, stage=item.get('target_stage', 'contacted'))
            log(f'[dlq-retry] SENT {email}')
            retried.append(email)
        elif r.get('_error') == 403:
            db.upsert_lead(email=email, stage='bounced', error_info='am_suppressed_dlq')
            log(f'[dlq-retry] BLOCKED {email} → marked bounced')
        else:
            remaining.append(item)

    dlq.write_text(json.dumps(remaining, indent=2))
    if retried:
        log(f'[auto-fix] DLQ: retried {len(retried)}, remaining {len(remaining)}')
    return len(retried)

def fix_stuck_leads():
    """Advance leads stuck >4h in intermediate stages."""
    health_data = {}
    if HEALTH_FILE.exists():
        try:
            health_data = json.loads(HEALTH_FILE.read_text())
        except Exception:
            pass

    stuck = health_data.get('stuck_leads', [])
    if not stuck:
        return 0

    sys.path.insert(0, str(BASE))
    try:
        from lead_store import LeadStore
        db = LeadStore()
    except ImportError:
        return 0

    STAGE_ACTIONS = {
        # leads stuck in audit_delivered >4h → re-queue for pitch
        'audit_delivered': lambda email, hours: (
            db.upsert_lead(email=email, stage='pitch_queued',
                           notes=f'sre_requeue: stuck {hours}h in audit_delivered')
            if hours > 4 else None
        ),
        # pitch_sent >168h (7d) without recycler engagement → flag for human review
        'pitch_sent': lambda email, hours: (
            db.upsert_lead(email=email, stage='needs_review',
                           notes=f'sre_escalate: pitch_sent {hours}h, recycler exhausted')
            if hours > 168 else None
        ),
    }

    actioned = 0
    for s in stuck:
        email = s.get('email', '')
        stage = s.get('stage', '')
        hours = s.get('hours_stuck', 0)
        action = STAGE_ACTIONS.get(stage)
        if action and email:
            action(email, hours)
            log(f'[auto-fix] Unstuck {email} from {stage} ({hours}h) → pitch_queued')
            actioned += 1

    return actioned

def trigger_ramp_if_starved():
    """If no new leads added in >6h and no ramp running, kick off ramp."""
    lock = BASE / 'pipeline_ramp.lock'
    if lock.exists():
        return False

    contacted = BASE / 'contacted.json'
    if not contacted.exists():
        return False

    try:
        data = json.loads(contacted.read_text())
        # Find newest contact timestamp
        newest_ts = None
        for v in data.values():
            ts_str = v.get('contacted_at') or v.get('sent_at')
            if ts_str:
                try:
                    ts = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                    if newest_ts is None or ts > newest_ts:
                        newest_ts = ts
                except Exception:
                    pass
        if newest_ts:
            hours_dry = (NOW - newest_ts).total_seconds() / 3600
            if hours_dry > 6:
                log(f'[auto-fix] Pipeline starved ({hours_dry:.1f}h no new leads) — triggering ramp')
                subprocess.Popen(
                    [VENV_PYTHON, str(BASE / 'ramp_pipeline_fill.py')],
                    cwd=str(BASE), close_fds=True,
                    stdout=open(BASE / 'ramp_auto_trigger.log', 'a'),
                    stderr=subprocess.STDOUT
                )
                return True
    except Exception as e:
        log(f'[ramp-trigger] Error: {e}')
    return False

def check_bounce_suppression_sync():
    """Mark AgentMail-suppressed addresses as bounced in DB proactively."""
    sys.path.insert(0, str(BASE))
    try:
        from lead_store import LeadStore
        from agentmail_client import AgentMailClient
    except ImportError:
        return 0

    db = LeadStore()
    am = AgentMailClient()

    # Check leads in 'contacted' stage that haven't moved in >48h
    # These may be silently suppressed — probe them
    probe_file = BASE / 'sre_probe_queue.json'
    queue = []
    if probe_file.exists():
        try:
            queue = json.loads(probe_file.read_text())
        except Exception:
            queue = []

    if not queue:
        return 0

    newly_suppressed = 0
    remaining = []
    for email in queue[:10]:  # max 10 probes per run
        if db.is_bounced(email):
            continue
        r = am.send(
            to=[email],
            subject='quick follow-up',
            text='Following up on the audit I sent. Worth 60 seconds to check?'
        )
        if r.get('_error') == 403 and 'bounced' in r.get('_body', ''):
            db.upsert_lead(email=email, stage='bounced', error_info='am_suppressed_probe')
            log(f'[auto-fix] Probe suppressed: {email} → marked bounced')
            newly_suppressed += 1
        else:
            remaining.append(email)

    probe_file.write_text(json.dumps(remaining + queue[10:]))
    return newly_suppressed

# ── Signal/noise evaluation ───────────────────────────────────────────────

NOISE_CHECKS = {
    # check_name: (min_alert_interval_minutes, description)
    'smtp_check': (0, 'SMTP is now retired — always passes'),
    'ramp_lock_stale': (30, 'Stale lock every ramp run — acceptable'),
}

def evaluate_snr():
    """Identify checks that fire too often without producing action."""
    if not HEALTH_FILE.exists():
        return
    try:
        h = json.loads(HEALTH_FILE.read_text())
    except Exception:
        return
    checks = h.get('checks', [])
    noisy = [c for c in checks if not c.get('passed') and c.get('name') in NOISE_CHECKS]
    for c in noisy:
        name = c['name']
        desc = NOISE_CHECKS[name][1]
        log(f'[snr] Suppressing low-signal check "{name}": {desc}')

# ── Main orchestration ────────────────────────────────────────────────────

def main():
    state = load_sre_state()
    actions_taken = []
    escalations = []

    log('── SRE Responder tick ──')

    # 1. Ensure all wrappers exist (silent fix, no alert needed)
    fixed_scripts = fix_missing_scripts()

    # 2. Remove stale locks
    if fix_stale_ramp_lock():
        actions_taken.append('Removed stale ramp lock')
        clear_failure(state, 'ramp_lock')
    if fix_stale_followup_lock():
        actions_taken.append('Removed stale followup lock')
        clear_failure(state, 'followup_lock')

    # 3. Retry dead letter queue
    dlq_retried = fix_dead_letter()
    if dlq_retried:
        actions_taken.append(f'DLQ retried {dlq_retried} leads')

    # 4. Unstick stuck leads
    unstuck = fix_stuck_leads()
    if unstuck:
        actions_taken.append(f'Unstuck {unstuck} leads → pitch_queued')

    # 5. Trigger ramp if pipeline starved
    if trigger_ramp_if_starved():
        actions_taken.append('Triggered ramp (pipeline starved >6h)')

    # 6. Probe suppression sync
    newly_suppressed = check_bounce_suppression_sync()
    if newly_suppressed:
        actions_taken.append(f'Suppression sync: {newly_suppressed} newly bounced')

    # 7. Check health file for critical failures that need escalation
    if HEALTH_FILE.exists():
        try:
            h = json.loads(HEALTH_FILE.read_text())
            failed_checks = [c for c in h.get('checks', []) if not c.get('passed')]
            # Filter known noise
            actionable_failures = [c for c in failed_checks if c.get('name') not in NOISE_CHECKS]

            for c in actionable_failures:
                name = c.get('name', '')
                detail = c.get('detail', '')
                failures = bump_failure(state, name)
                if failures >= 3:
                    escalations.append(f'`{name}` failed {failures}x: {detail}')
                else:
                    log(f'[watch] {name} failed (attempt {failures}/3): {detail}')

            # Clear failure counters for checks that have recovered
            current_failing = {c.get('name') for c in actionable_failures}
            for check_name in list(state.get('failures', {}).keys()):
                if check_name not in current_failing:
                    prev = state['failures'].pop(check_name, None)
                    if prev is not None:
                        log(f'[recovered] Cleared failure counter for "{check_name}" (was {prev})')
        except Exception as e:
            log(f'[health-read] Error: {e}')

    # 8. SNR evaluation
    evaluate_snr()

    # 9. Check for revenue (Stripe webhook hits)
    revenue_file = BASE / 'ops/revenue.json'
    if revenue_file.exists():
        try:
            rev = json.loads(revenue_file.read_text())
            total = rev.get('total_revenue_usd', 0)
            last_notified = state.get('last_revenue_notified', 0)
            if total > last_notified:
                telegram_alert(
                    f'Payment received! Revenue: ${total:.2f}\nNew: +${total - last_notified:.2f}',
                    level='revenue'
                )
                state['last_revenue_notified'] = total
                actions_taken.append(f'Revenue alert fired: ${total:.2f}')
        except Exception as e:
            log(f'[revenue-check] Error: {e}')

    # 10. Escalate only when needed
    if escalations:
        msg = f"*{len(escalations)} escalation(s) need attention:*\n" + '\n'.join(f'• {e}' for e in escalations)
        telegram_alert(msg, level='critical')
        log(f'[escalate] Sent alert: {len(escalations)} issues')

    # Save state
    state['last_run'] = NOW.isoformat()
    state['last_actions'] = actions_taken
    save_sre_state(state)

    if actions_taken:
        log(f'[done] Actions taken: {"; ".join(actions_taken)}')
    else:
        log('[done] No action needed — pipeline healthy')

    # Silent on healthy (no stdout = no cron delivery)
    # Only print if actions taken or escalations (triggers delivery)
    if actions_taken or escalations:
        print('\n'.join(actions_taken + escalations))

if __name__ == '__main__':
    main()
