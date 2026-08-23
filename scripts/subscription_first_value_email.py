#!/usr/bin/env python3
"""
Nebula subscription first-value email.
Queries subscriptions created 47-49 hours ago with no prior first-value email sent,
and sends "Have you run your audit yet?" via the platform API.

Runs daily at 9 AM UTC via cron.
"""
import json, logging, os, urllib.request, urllib.error
from datetime import datetime, timezone
import psycopg2, psycopg2.extras

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('first-value-email')

PLATFORM_API = os.getenv('PLATFORM_API_URL', 'http://127.0.0.1:8001')

PLAN_NAMES = {
    'pro': 'Pro',
    'growth': 'Growth',
    'agency': 'Agency',
}

def send_email(to: str, subject: str, text: str, html: str) -> bool:
    # Durable delivery: transactional outbox enqueue (channel 'email'), not
    # the removed /email/send endpoint. The outbox worker owns retries.
    payload = json.dumps({
        'channel': 'email',
        'recipient': to,
        'payload': {
            'subject': subject,
            'body': html,
            'from_email': 'audits@nebulacomponents.shop',
            'content_type': 'text/html',
        },
    }).encode()
    req = urllib.request.Request(f'{PLATFORM_API}/api/outbox/enqueue', data=payload, method='POST')
    req.add_header('Content-Type', 'application/json')
    secret = os.getenv('INTERNAL_API_SECRET', '').strip()
    if secret:
        req.add_header('Authorization', f'Bearer {secret}')
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status < 300
    except urllib.error.HTTPError as e:
        log.error('Email send failed %s: %s', to, e)
        return False
    except Exception as e:
        log.error('Email send error %s: %s', to, e)
        return False


def build_first_value_email(email: str, plan: str) -> tuple[str, str, str]:
    plan_name = PLAN_NAMES.get(plan, plan.title())
    subject = 'Have you run your audit yet?'
    text = f"""Hi,

You signed up for Nebula {plan_name} - the audit is free and takes 90 seconds.

Paste your landing page URL here to find what's leaking:
https://nebulacomponents.com/audit

The two most common failures across 86 pages we've audited:
- Above-fold: headline present, no CTA visible in first viewport (100% of pages)
- Ad signal continuity: page doesn't continue what the ad promised (99% of pages)

Both are invisible to PageSpeed Insights. The audit catches them.

→ Run your audit: https://nebulacomponents.com/audit

- Mike
Nebula Components
"""
    html = f"""<p>Hi,</p>
<p>You signed up for Nebula {plan_name} - the audit is free and takes 90 seconds.</p>
<p><strong><a href="https://nebulacomponents.com/audit">Paste your landing page URL here →</a></strong></p>
<p>The two most common failures across 86 pages we've audited:</p>
<ul>
  <li><strong>Above-fold</strong>: headline present, no CTA visible in first viewport (100% of pages)</li>
  <li><strong>Ad signal continuity</strong>: page doesn't continue what the ad promised (99% of pages)</li>
</ul>
<p>Both are invisible to PageSpeed Insights. The audit catches them.</p>
<p><a href="https://nebulacomponents.com/audit">Run your audit now →</a></p>
<p>- Mike<br>Nebula Components</p>"""
    return subject, text, html


def main() -> None:
    conn = psycopg2.connect(
        host='/var/run/postgresql', port=5433, dbname='nebula_platform', user='postgres',
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    cur = conn.cursor()

    # Find subscriptions created 47-49 hours ago (first-value window)
    cur.execute("""
        SELECT s.id, s.email, s.plan
        FROM subscriptions s
        WHERE s.status = 'active'
          AND s.livemode = TRUE
          AND s.created_at BETWEEN NOW() - INTERVAL '49 hours' AND NOW() - INTERVAL '47 hours'
          AND NOT EXISTS (
            SELECT 1 FROM monitoring_events me
            WHERE me.monitored_page_id IN (
              SELECT id FROM monitored_pages WHERE LOWER(email) = LOWER(s.email)
            )
          )
          AND s.email NOT LIKE 'anonymous+%@invalid.nebulacomponents.com'
        ORDER BY s.created_at ASC
        LIMIT 100
    """)
    targets = cur.fetchall()
    log.info('First-value email targets: %d', len(targets))

    sent = 0
    for row in targets:
        subject, text, html = build_first_value_email(row['email'], row['plan'])
        if send_email(row['email'], subject, text, html):
            sent += 1
            log.info('First-value email sent to %s (plan=%s)', row['email'], row['plan'])
        else:
            log.warning('Failed to send first-value email to %s', row['email'])

    conn.close()
    log.info('First-value emails sent: %d / %d', sent, len(targets))
    print(f'Sent {sent}/{len(targets)} first-value emails.')


if __name__ == '__main__':
    main()
