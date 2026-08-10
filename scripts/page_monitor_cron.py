#!/home/mike/nebula/.venv/bin/python3
"""
Nebula page monitoring cron.
Runs for every active monitored_pages row that is due for a check.
Re-audits the page via the platform API, writes a monitoring_event,
and sends a Telegram alert if the score dropped by >= alert_threshold.

Designed to be called by the Hermes cron system (no_agent=False).
"""
import json, os, sys, subprocess, time, logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('monitor-cron')

PLATFORM_API = os.getenv('PLATFORM_API_URL', 'http://127.0.0.1:8001')
TELEGRAM_CHAT_ID = '5920497760'

# ── DB helpers ──────────────────────────────────────────────────────────────
import psycopg2, psycopg2.extras

def get_conn():
    return psycopg2.connect(
        host='/var/run/postgresql', port=5433, dbname='nebula_audit', user='postgres',
        cursor_factory=psycopg2.extras.RealDictCursor,
    )

# ── Audit trigger ─────────────────────────────────────────────────────────
import urllib.request, urllib.error

def trigger_audit(url: str) -> dict | None:
    """Fire a POST to platform API to run an audit. Returns parsed response or None."""
    payload = json.dumps({'url': url, 'email': f'monitor@invalid.nebulacomponents.com', 'name': None}).encode()
    req = urllib.request.Request(f'{PLATFORM_API}/audit/run', data=payload, method='POST')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except Exception as e:
        log.error('Audit trigger failed for %s: %s', url, e)
        return None

# ── Telegram alert ────────────────────────────────────────────────────────
def send_telegram(message: str) -> None:
    try:
        subprocess.run(
            ['hermes', 'send', '--to', f'telegram:{TELEGRAM_CHAT_ID}', message],
            timeout=15, check=False,
        )
    except Exception as e:
        log.warning('Telegram alert failed: %s', e)

# ── Main loop ─────────────────────────────────────────────────────────────
def run() -> None:
    conn = get_conn()
    cur = conn.cursor()

    # Fetch pages due for a check
    cur.execute("""
        SELECT id, subscription_id, email, url, label, plan,
               check_interval_hours, last_checked_at,
               last_score, last_grade, baseline_score, baseline_grade,
               alert_threshold
        FROM monitored_pages
        WHERE active = TRUE
          AND (
            last_checked_at IS NULL
            OR last_checked_at < NOW() - make_interval(hours => check_interval_hours)
          )
        ORDER BY last_checked_at NULLS FIRST
        LIMIT 50
    """)
    pages = cur.fetchall()
    log.info('Pages due for monitoring check: %d', len(pages))

    for page in pages:
        pid = page['id']
        url = page['url']
        log.info('Checking %s (monitor #%d)', url, pid)

        result = trigger_audit(url)
        if not result:
            log.warning('Audit failed for monitor #%d, skipping', pid)
            continue

        score = result.get('score')
        grade = result.get('grade')
        audit_id = result.get('audit_id') or result.get('id')

        if score is None:
            log.warning('No score returned for monitor #%d', pid)
            continue

        prev_score = page['last_score']
        delta = (score - prev_score) if prev_score is not None else None
        is_first_run = prev_score is None

        # Persist event
        cur.execute("""
            INSERT INTO monitoring_events (monitored_page_id, audit_id, score, grade, score_delta)
            VALUES (%s, %s, %s, %s, %s)
        """, (pid, audit_id, score, grade, delta))

        # Update monitored_pages
        if is_first_run:
            cur.execute("""
                UPDATE monitored_pages
                SET last_checked_at = NOW(), last_audit_id = %s,
                    last_score = %s, last_grade = %s,
                    baseline_score = %s, baseline_grade = %s, updated_at = NOW()
                WHERE id = %s
            """, (audit_id, score, grade, score, grade, pid))
        else:
            cur.execute("""
                UPDATE monitored_pages
                SET last_checked_at = NOW(), last_audit_id = %s,
                    last_score = %s, last_grade = %s, updated_at = NOW()
                WHERE id = %s
            """, (audit_id, score, grade, pid))

        conn.commit()
        log.info('Monitor #%d: score=%d/%s delta=%s', pid, score, grade, delta)

        # Score-drop alert
        if not is_first_run and delta is not None and delta <= -page['alert_threshold']:
            label = page['label'] or url
            message = (
                f"⚠️ *Page Score Drop Detected*\n"
                f"**{label}**\n"
                f"Score: {prev_score} → {score} ({delta:+d} points)\n"
                f"Grade: {page['last_grade']} → {grade}\n"
                f"Threshold: -{page['alert_threshold']} points\n"
                f"Audit: nebulacomponents.com/audit/{audit_id}/results\n"
                f"Subscription: {page['plan']} · {page['email']}"
            )
            cur.execute(
                "UPDATE monitoring_events SET alert_sent = TRUE WHERE monitored_page_id = %s AND audit_id = %s",
                (pid, audit_id),
            )
            conn.commit()
            send_telegram(message)
            log.info('Alert sent for monitor #%d', pid)

        time.sleep(2)  # Throttle between audits

    cur.close()
    conn.close()
    log.info('Monitoring run complete')
    print(f'Checked {len(pages)} page(s). Run complete.')

if __name__ == '__main__':
    run()
