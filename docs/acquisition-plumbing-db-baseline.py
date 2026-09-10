"""Read-only before/after metric projection. No report/ledger mutations."""
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts import funnel_health_monitor as monitor

if __name__ == '__main__':
    now = datetime.now(timezone.utc)
    with psycopg.connect(monitor.DB_CONNINFO, options='-c default_transaction_read_only=on -c timezone=UTC -c statement_timeout=30000') as conn:
        conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ')
        evidence = {'captured_at': now.isoformat(), 'read_only': conn.execute('SHOW transaction_read_only').fetchone()[0], 'periods': {}}
        for days in (14, 30):
            # Complete UTC days, fixed end so results can be reproduced exactly.
            end = now.date()
            period = monitor.Period(f'{days}d', end - timedelta(days=days), end, end - timedelta(days=2*days), end - timedelta(days=days))
            classes = monitor.classified_ledger_counts(conn, period)
            before = dict(conn.execute('''SELECT event_name,count(*) FROM analytics_event_ledger
                WHERE occurred_at >= %s AND occurred_at < %s AND event_name=ANY(%s)
                  AND environment='production' AND payment_mode='live' AND is_synthetic=false
                GROUP BY event_name''', [period.start, period.end, list(monitor.EVENTS)]).fetchall())
            reasons = conn.execute('''SELECT failure_reason,properties->>'reason_code',count(*) FROM analytics_event_ledger
                WHERE occurred_at >= %s AND occurred_at < %s AND event_name='checkout_creation_failed'
                  AND environment='production' AND payment_mode='live' AND is_synthetic=false
                  AND (audit_id IS NULL OR audit_id <> ALL(%s)) GROUP BY 1,2 ORDER BY 3 DESC''', [period.start, period.end, list(monitor.PROBE_AUDIT_IDS)]).fetchall()
            evidence['periods'][f'{days}d'] = {'start': str(period.start), 'end_exclusive': str(period.end), 'before_live_nonsynthetic': before, 'after_classification': classes, 'raw': monitor.raw_counts(classes), 'nonprobe_failure_reasons': reasons}
        evidence['purchases_by_mode'] = conn.execute('SELECT livemode,payment_status,count(*),sum(amount_total) FROM purchases GROUP BY 1,2').fetchall()
    output = ROOT / 'docs/acquisition-plumbing-db-baseline.json'
    output.write_text(json.dumps(evidence, indent=2, default=str) + '\n')
    print(json.dumps(evidence, indent=2, default=str))
