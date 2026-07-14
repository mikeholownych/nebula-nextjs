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
SRE_LOCK = BASE / 'sre_responder.lock'
RAMP_REPORT = BASE / 'ramp_pipeline_report.json'
RAMP_COOLDOWN_MINUTES = 120  # don't re-trigger ramp if last run had 0 sends within this window
STUCK_LEAD_FREEZE_FILE = BASE / 'sre_stuck_freezes.json'

# Test/internal emails to never auto-escalate
TEST_EMAILS_LC = frozenset([
    'mike.holownych@aisyndicate.io', 'mike.holownych@gmail.com',
    'test@example.com', 'restart-test@example.com', 'stripe@example.com',
    'founder@testco.com', 'nebulashop@agentmail.to',
])

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
    dlq = BASE / 'dead_letter_queue.jsonl'
    if not dlq.exists():
        return 0
    try:
        items = []
        for line in dlq.read_text().splitlines():
            line = line.strip()
            if line:
                items.append(json.loads(line))
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

    dlq.write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in remaining) + ('\n' if remaining else ''))
    if retried:
        log(f'[auto-fix] DLQ: retried {len(retried)}, remaining {len(remaining)}')
    return len(retried)

def fix_stuck_leads():
    """Advance leads stuck >4h in intermediate stages.
    
    Includes freeze tracking: if a lead gets unstuck 3+ times in 24h,
    it's moved to dead to prevent re-stuck loops.
    """
    # Load freeze tracker
    freezes = {}
    if STUCK_LEAD_FREEZE_FILE.exists():
        try:
            freezes = json.loads(STUCK_LEAD_FREEZE_FILE.read_text())
        except Exception:
            freezes = {}

    # Clean old freeze entries (>24h)
    now_ts = NOW.timestamp()
    for email in list(freezes.keys()):
        entries = [e for e in freezes.get(email, []) if now_ts - e['ts'] < 86400]
        if not entries:
            del freezes[email]
        else:
            freezes[email] = entries

    sys.path.insert(0, str(BASE))
    try:
        from lead_store import LeadStore
        db = LeadStore()
    except ImportError:
        return 0

    health_data = {}
    if HEALTH_FILE.exists():
        try:
            health_data = json.loads(HEALTH_FILE.read_text())
        except Exception:
            pass

    stuck = health_data.get('stuck_leads', [])
    now_utc = NOW

    # ── Direct LeadStore query for pitch_sent >168h ──────────────────────
    # The health check's stuck_leads array NEVER includes pitch_sent (it's
    # excluded as an async stage in LeadStore.get_stuck_leads). We query
    # LeadStore directly here so the SRE's 168h escalation actually fires.
    PITCH_SENT_STALE_HOURS = 168
    try:
        for lead in db.get_leads_by_stage('pitch_sent'):
            email = lead.get('email', '')
            if not email:
                continue
            if email.lower() in TEST_EMAILS_LC:
                continue
            # Determine when pitch was sent
            ts_str = lead.get('pitch_sent_at') or lead.get('updated_at', '')
            if not ts_str:
                continue
            try:
                t = datetime.fromisoformat(ts_str.rstrip('Z').replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
                hours = (now_utc - t).total_seconds() / 3600
                if hours > PITCH_SENT_STALE_HOURS:
                    stuck.append({
                        'email': email,
                        'stage': 'pitch_sent',
                        'hours_stuck': round(hours, 1),
                        'url': lead.get('url', ''),
                    })
            except Exception:
                continue
    except Exception as e:
        log(f'[pitch_sent_stale_check] Error querying LeadStore: {e}')

    # ── Direct LeadStore query for needs_review >24h ────────────────────
    # The health check's stuck_leads array also excludes needs_review (it's
    # classified as a "human-review holding stage" in get_stuck_leads). The
    # SRE's STAGE_ACTIONS handler for needs_review >24h -> dead never fires
    # without this direct query.
    NEEDS_REVIEW_STALE_HOURS = 24
    try:
        for lead in db.get_leads_by_stage('needs_review'):
            email = lead.get('email', '')
            if not email:
                continue
            if email.lower() in TEST_EMAILS_LC:
                continue
            # Determine when lead entered needs_review
            ts_str = lead.get('needs_review_at') or lead.get('updated_at', '')
            if not ts_str:
                continue
            try:
                t = datetime.fromisoformat(ts_str.rstrip('Z').replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
                hours = (now_utc - t).total_seconds() / 3600
                if hours > NEEDS_REVIEW_STALE_HOURS:
                    stuck.append({
                        'email': email,
                        'stage': 'needs_review',
                        'hours_stuck': round(hours, 1),
                        'url': lead.get('url', ''),
                    })
            except Exception:
                continue
    except Exception as e:
        log(f'[needs_review_stale_check] Error querying LeadStore: {e}')

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
        # needs_review >24h without human action → auto-close to dead
        'needs_review': lambda email, hours: (
            db.upsert_lead(email=email, stage='dead',
                           notes=f'sre_freeze: needs_review {hours}h, no human review')
            if hours > 24 else None
        ),
    }

    if not stuck:
        return 0

    actioned = 0
    for s in stuck:
        email = s.get('email', '')
        stage = s.get('stage', '')
        hours = s.get('hours_stuck', 0)
        action = STAGE_ACTIONS.get(stage)
        if action and email:
            # Check freeze count: if this lead has been unstuck 3+ times, freeze
            freeze_count = len(freezes.get(email, []))
            if freeze_count >= 3:
                db.upsert_lead(email=email, stage='dead',
                               notes=f'sre_freeze: unstuck {freeze_count}x, re-stuck loop')
                log(f'[auto-fix] FROZE {email} from {stage} ({freeze_count}x unstuck) → dead')
                actioned += 1
                continue

            action(email, hours)
            log(f'[auto-fix] Unstuck {email} from {stage} ({hours}h) → pitch_queued')
            # Record the unstuck event
            freezes.setdefault(email, []).append({
                'ts': now_ts,
                'stage': stage,
                'hours_stuck': hours,
            })
            actioned += 1

    # Save freeze tracker
    STUCK_LEAD_FREEZE_FILE.write_text(json.dumps(freezes, indent=2, default=str))
    return actioned

def _last_ramp_had_zero_sends() -> bool:
    """Check if the most recent ramp run produced 0 sent leads."""
    if not RAMP_REPORT.exists():
        return False
    try:
        report = json.loads(RAMP_REPORT.read_text())
        sent_count = report.get('counts', {}).get('sent', 0)
        if sent_count == 0:
            # Also check how recent — if report is old, it's not relevant
            ts_str = report.get('timestamp', '')
            if ts_str:
                try:
                    ts = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                    age_min = (NOW - ts).total_seconds() / 60
                    if age_min > RAMP_COOLDOWN_MINUTES:
                        return False  # report too old, ignore
                except Exception:
                    pass
            return True
    except Exception:
        pass
    return False


def _all_sources_broken() -> bool:
    """Check sre_state.json known_issues for critical source failures."""
    state = load_sre_state()
    issues = state.get('known_issues', {})
    broken = [k for k, v in issues.items() if 'blocked' in v.lower() or 'down' in v.lower() or 'unavailable' in v.lower() or 'rate-limited' in v.lower() or 'exhausted' in v.lower()]
    if len(broken) >= 2:
        log(f'[sources] {len(broken)} known source failures — will use extended cooldown')
        return True
    return False


def trigger_ramp_if_starved():
    """If no new leads added in >6h and no ramp running, kick off ramp.

    Includes cooldown: if last ramp report had 0 sends and sources are broken,
    don't re-trigger for RAMP_COOLDOWN_MINUTES.
    """
    lock = BASE / 'pipeline_ramp.lock'
    if lock.exists():
        return False

    # Cooldown: if last ramp report had 0 sends and it's recent, skip
    if _last_ramp_had_zero_sends():
        log(f'[ramp-cooldown] Last ramp run produced 0 sends — waiting {RAMP_COOLDOWN_MINUTES}m before retry')
        return False

    # Extended cooldown if multiple sources are known-broken
    # Check this BEFORE the per-report cooldown so source failures suppress
    # ramp re-triggers even if the last report is too old to count
    if _all_sources_broken():
        # Also check if there's any recent zero-send evidence (even if slightly stale)
        any_zero_recent = _last_ramp_had_zero_sends()
        if not any_zero_recent and RAMP_REPORT.exists():
            # Fallback: check if the MOST recent non-empty report had 0 sends
            try:
                report = json.loads(RAMP_REPORT.read_text())
                sent_count = report.get('counts', {}).get('sent', 0)
                any_zero_recent = sent_count == 0
            except Exception:
                pass
        if any_zero_recent:
            log(f'[ramp-cooldown] Multiple sources broken + last ramp 0 sends — suppressing ramp trigger')
            return False
        else:
            log(f'[ramp-cooldown] Multiple sources broken — suppressing ramp trigger despite no zero-send evidence')
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
    'Pipeline ramp recent run': (120, 'Stale during source outages — SRE suppresses ramp trigger when sources are broken'),
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

    # ── Lock: prevent concurrent SRE runs ────────────────────────────────
    LOCK_AGE_MAX = 600  # 10 min
    if SRE_LOCK.exists():
        age_sec = (NOW.timestamp() - SRE_LOCK.stat().st_mtime)
        if age_sec < LOCK_AGE_MAX:
            log(f'[lock] Another SRE run in progress (age={age_sec:.0f}s) — skipping')
            return
        else:
            log(f'[lock] Stale lock removed (age={age_sec:.0f}s)')
            SRE_LOCK.unlink()
    SRE_LOCK.write_text(json.dumps({'pid': os.getpid(), 'ts': NOW.isoformat()}))

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
        clear_failure(state, 'Stuck leads detected')

    # 5. Trigger ramp if pipeline starved
    if trigger_ramp_if_starved():
        actions_taken.append('Triggered ramp (pipeline starved >6h)')
        clear_failure(state, 'Pipeline ramp recent run')

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

    # 11. Check for stuck needs_site_extraction leads in ramp report
    try:
        _fix_ramp_needs_site_extraction()
    except Exception as e:
        log(f'[needs_site_extraction] Error: {e}')

    # 12. Track known source issues for cooldown logic
    _track_source_issues()

    # Cleanup SRE lock
    try:
        if SRE_LOCK.exists():
            SRE_LOCK.unlink()
    except Exception:
        pass

def _fix_ramp_needs_site_extraction():
    """Detect and remediate leads stuck in needs_site_extraction in ramp report."""
    if not RAMP_REPORT.exists():
        return
    try:
        report = json.loads(RAMP_REPORT.read_text())
    except Exception:
        return

    extraction_stuck = [r for r in report.get('queued', []) if r.get('status') == 'needs_site_extraction']
    if not extraction_stuck:
        return

    log(f'[needs_site_extraction] Found {len(extraction_stuck)} lead(s) stuck without site URLs')

    # Check age: only act on leads checked >2h ago (give pipeline time to retry naturally)
    now_ts = NOW.timestamp()
    old_enough = []
    for rec in extraction_stuck:
        checked_str = rec.get('checked_at', '')
        if not checked_str:
            old_enough.append(rec)
            continue
        try:
            checked_ts = datetime.fromisoformat(checked_str.replace('Z', '+00:00')).timestamp()
            if now_ts - checked_ts > 7200:  # 2h
                old_enough.append(rec)
        except Exception:
            old_enough.append(rec)

    if not old_enough:
        return

    # Move old extraction-stuck leads to dead letter
    dlq = BASE / 'dead_letter_queue.jsonl'
    moved = 0
    for rec in old_enough:
        dlq_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'site': rec.get('site'),
            'email': rec.get('email'),
            'trigger': rec.get('trigger', '')[:120],
            'url': rec.get('url', ''),
            'source': rec.get('source', ''),
            'reason': 'needs_site_extraction — stale >2h, no site URL extractable',
            'retry_count': 3,
            'source_script': 'sre_responder'
        }
        with dlq.open('a') as f:
            f.write(json.dumps(dlq_entry, ensure_ascii=False) + '\n')
        moved += 1

    # Remove from report queue
    stuck_urls = {r.get('url') for r in old_enough}
    report['queued'] = [r for r in report.get('queued', []) if r.get('url') not in stuck_urls]
    report['counts']['queued'] = len(report['queued'])
    RAMP_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False))

    if moved:
        log(f'[auto-fix] Moved {moved} stale needs_site_extraction lead(s) to dead letter')


def _track_source_issues():
    """Scan ramp log for known source failures and log them in sre_state."""
    state = load_sre_state()
    if 'known_issues' not in state:
        state['known_issues'] = {}

    # Check Apify availability by looking at the trigger log
    log_path = BASE / 'ramp_auto_trigger.log'
    if log_path.exists():
        try:
            lines = log_path.read_text().splitlines()
            # Look at last 50 lines for Apify errors
            recent = lines[-50:]
            apify_403 = any('HTTP 403' in l and 'apify' in l for l in recent)
            apify_timeout = any('timed out' in l and 'apify' in l for l in recent)
            apify_circuit = any('circuit-breaker' in l and 'apify' in l for l in recent)

            if apify_403:
                state['known_issues']['apify_scraper'] = 'HTTP 403 — Too many outstanding invoices (billing issue)'
            elif apify_timeout:
                state['known_issues']['apify_scraper'] = 'Request timeout — actor may be slow'
            elif apify_circuit:
                state['known_issues']['apify_scraper'] = 'Circuit breaker tripped — all scrapers failed'
            elif 'apify_scraper' in state.get('known_issues', {}):
                # Check if there's a more recent run without Apify errors
                if any('apify' in l and not l.endswith('403') and 'HTTP 403' not in l for l in lines[-100:]):
                    # If Apify appears in recent log without errors, it recovered
                    pass
                elif not any('apify' in l for l in lines[-20:]):
                    # No Apify activity in last 20 lines — stale issue, not active
                    pass
                else:
                    # Still seeing the issue
                    pass
        except Exception:
            pass

    save_sre_state(state)


if __name__ == '__main__':
    main()
