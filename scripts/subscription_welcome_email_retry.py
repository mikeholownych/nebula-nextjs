#!/usr/bin/env python3
"""Retry failed subscription welcome emails with durable DB state."""
import json, logging, os, urllib.request, urllib.error
import psycopg2, psycopg2.extras

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('subscription-welcome-retry')
API = os.getenv('PLATFORM_API_URL', 'http://127.0.0.1:8001')
NAMES = {'pro': 'Pro', 'growth': 'Growth', 'agency': 'Agency'}

def send(row):
    name = NAMES.get(row['plan'], row['plan'].title())
    text = f"Your Nebula {name} plan is active.\n\nRun your first audit: https://nebulacomponents.com/audit\n\n- Mike\nNebula Components"
    html = f'<p>Your Nebula {name} plan is active.</p><p><a href="https://nebulacomponents.com/audit">Run your first audit →</a></p><p>- Mike<br>Nebula Components</p>'
    body = json.dumps({'to': row['email'], 'subject': f'Your Nebula {name} plan is active', 'text': text, 'html': html}).encode()
    req = urllib.request.Request(f'{API}/email/send', data=body, method='POST', headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r: return r.status < 300, ''
    except Exception as e: return False, str(e)[:500]

def main():
    conn = psycopg2.connect(host='/var/run/postgresql', port=5433, dbname='nebula_platform', user='postgres', cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("""SELECT id, stripe_subscription_id, email, plan
                   FROM subscriptions
                   WHERE livemode = TRUE AND status IN ('active','trialing')
                     AND welcome_email_sent_at IS NULL
                     AND welcome_email_attempts < 5
                   ORDER BY created_at LIMIT 100""")
    rows = cur.fetchall(); sent = 0
    for row in rows:
        ok, err = send(row)
        cur.execute("""UPDATE subscriptions
                       SET welcome_email_attempts = welcome_email_attempts + 1,
                           welcome_email_sent_at = CASE WHEN %s THEN NOW() ELSE welcome_email_sent_at END,
                           welcome_email_last_error = CASE WHEN %s THEN NULL ELSE %s END,
                           updated_at = NOW() WHERE id = %s""", (ok, ok, err or 'email provider rejected or timed out', row['id']))  # type: ignore[index]
        conn.commit()
        sent += int(ok)
    conn.close()
    if rows:
        print(f'Retried {sent}/{len(rows)} subscription welcome emails.')

if __name__ == '__main__': main()
