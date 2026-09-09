#!/usr/bin/env python3
"""Pull live GSC + GA4 + PostHog + audit-DB stats for the last 24h (and 7d context).

Decrypts stored tokens via platform_api.infra.secret_box, refreshes them,
and queries Google Search Console + GA4 Data API directly. PostHog is queried
via the personal API key. Audit DB counts come from the local Postgres.

Modes:
  --json    full JSON dump (default)
  --digest  compact human-readable summary for cron delivery
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "/home/mike/nebula")

from platform_api.infra.secret_box import decrypt  # noqa: E402
from platform_api.config import settings  # noqa: E402

# --- DB access via psql (simplest, no async) ---
import subprocess  # noqa: E402

DB = "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433"
AUDIT_DB = "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"


def psql(sql, db=DB):
    out = subprocess.run(
        ["psql", db, "-t", "-A", "-F", "|", "-c", sql],
        capture_output=True, text=True,
    )
    return out.stdout.strip()


def load_env():
    env = os.path.join("/home/mike/nebula", ".env")
    if os.path.exists(env):
        with open(env) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip())


def ph_query(payload):
    key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    host = os.environ.get("POSTHOG_HOST", "https://us.posthog.com")
    project = os.environ.get("POSTHOG_CLI_PROJECT_ID", "525183")
    req = urllib.request.Request(
        f"{host}/api/projects/{project}/query/",
        data=json.dumps({"query": payload}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def ph_event_total(event, date_from, date_to):
    payload = {
        "kind": "TrendsQuery",
        "series": [{"kind": "EventsNode", "event": event}],
        "dateRange": {"date_from": date_from, "date_to": date_to},
        "interval": "day",
    }
    res = ph_query(payload)
    results = res.get("results", [])
    if results and isinstance(results[0], dict):
        return sum(results[0].get("data", []))
    return 0


def get_conn(table):
    """Return dict of decrypted token fields for the single connection row."""
    if table == "ga4_connections":
        cols = "access_token, refresh_token, token_expiry, property_id"
    else:
        cols = "access_token, refresh_token, token_expiry, gsc_site_url"
    row = psql(f"SELECT {cols} FROM {table} LIMIT 1")
    if not row:
        return None
    parts = row.split("|")
    if table == "ga4_connections":
        access, refresh, expiry, prop = parts[0], parts[1], parts[2], parts[3]
        site = None
    else:
        access, refresh, expiry, site = parts[0], parts[1], parts[2], parts[3]
        prop = None
    return {
        "access_token": decrypt(access),
        "refresh_token": decrypt(refresh),
        "token_expiry": expiry,
        "property_id": prop,
        "gsc_site_url": site,
    }


def refresh_google(refresh_token):
    """Refresh a Google OAuth token using the app's client creds."""
    data = urllib.parse.urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token", data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["access_token"]


def gsc_query(access_token, site_url, start, end, dimensions=None, row_limit=500):
    payload = {
        "startDate": start,
        "endDate": end,
        "dimensions": dimensions or [],
        "rowLimit": row_limit,
    }
    encoded = urllib.parse.quote(site_url, safe="")
    url = f"https://www.googleapis.com/webmasters/v3/sites/{encoded}/searchAnalytics/query"
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def ga4_query(access_token, property_id, start, end, dimensions, metrics):
    url = f"https://analyticsdata.googleapis.com/v1beta/{property_id}:runReport"
    body = {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "dimensions": [{"name": d} for d in dimensions],
        "metrics": [{"name": m} for m in metrics],
    }
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    load_env()
    today = datetime.now(timezone.utc).date()
    d1 = (today - timedelta(days=1)).isoformat()   # last 24h
    d7 = (today - timedelta(days=7)).isoformat()    # 7d context
    out = {"generated_at": datetime.now(timezone.utc).isoformat()}

    # --- GSC ---
    gsc = get_conn("gsc_connections")
    if gsc and gsc["gsc_site_url"]:
        try:
            tok = refresh_google(gsc["refresh_token"])
            site = gsc["gsc_site_url"]
            # 24h totals
            r24 = gsc_query(tok, site, d1, today.isoformat())
            rows = r24.get("rows", [])
            out["gsc_24h"] = rows[0] if rows else {"clicks": 0, "impressions": 0}
            # 7d totals
            r7 = gsc_query(tok, site, d7, today.isoformat())
            rows7 = r7.get("rows", [])
            out["gsc_7d"] = rows7[0] if rows7 else {"clicks": 0, "impressions": 0}
            # top pages 24h
            rp = gsc_query(tok, site, d1, today.isoformat(), dimensions=["page"], row_limit=20)
            out["gsc_top_pages_24h"] = [
                {"page": r["keys"][0], "clicks": r["clicks"], "impressions": r["impressions"],
                 "ctr": r.get("ctr", 0), "position": r.get("position", 0)}
                for r in rp.get("rows", [])
            ]
            # top queries 24h
            rq = gsc_query(tok, site, d1, today.isoformat(), dimensions=["query"], row_limit=20)
            out["gsc_top_queries_24h"] = [
                {"query": r["keys"][0], "clicks": r["clicks"], "impressions": r["impressions"],
                 "ctr": r.get("ctr", 0), "position": r.get("position", 0)}
                for r in rq.get("rows", [])
            ]
        except Exception as e:
            out["gsc_error"] = str(e)
    else:
        out["gsc_error"] = "no gsc_connections row"

    # --- GA4 ---
    ga4 = get_conn("ga4_connections")
    if ga4 and ga4["property_id"]:
        try:
            tok = refresh_google(ga4["refresh_token"])
            prop = ga4["property_id"]
            # 24h sessions + key events + users
            r = ga4_query(tok, prop, d1, today.isoformat(), [], ["sessions", "keyEvents", "totalUsers", "screenPageViews"])
            out["ga4_24h"] = r.get("rows", [{}])[0].get("metricValues", [])
            # 7d
            r7 = ga4_query(tok, prop, d7, today.isoformat(), [], ["sessions", "keyEvents", "totalUsers", "screenPageViews"])
            out["ga4_7d"] = r7.get("rows", [{}])[0].get("metricValues", [])
            # top pages 24h
            rp = ga4_query(tok, prop, d1, today.isoformat(), ["pagePath"], ["screenPageViews", "sessions"])
            out["ga4_top_pages_24h"] = [
                {"page": row["dimensionValues"][0]["value"],
                 "views": row["metricValues"][0]["value"],
                 "sessions": row["metricValues"][1]["value"]}
                for row in rp.get("rows", [])[:20]
            ]
        except Exception as e:
            out["ga4_error"] = str(e)
    else:
        out["ga4_error"] = "no ga4_connections row"

    # --- PostHog ---
    try:
        ph_events = [
            "landing_page_view", "audit_page_viewed", "audit_submitted",
            "lab_check_completed", "lab_full_audit_clicked", "audit_started",
            "checkout_started", "purchase_completed",
        ]
        out["posthog_24h"] = {e: ph_event_total(e, d1, today.isoformat()) for e in ph_events}
        out["posthog_7d"] = {e: ph_event_total(e, d7, today.isoformat()) for e in ph_events}
    except Exception as e:
        out["posthog_error"] = str(e)

    # --- Audit DB ---
    try:
        row = psql(
            "SELECT "
            "COUNT(*) FILTER (WHERE completed_at >= now() - interval '24 hours'), "
            "COUNT(*) FILTER (WHERE completed_at >= now() - interval '7 days'), "
            "COUNT(*) FILTER (WHERE paid_at IS NOT NULL AND paid_at >= now() - interval '24 hours'), "
            "COUNT(*) FILTER (WHERE paid_at IS NOT NULL AND paid_at >= now() - interval '7 days') "
            "FROM audits;",
            db=AUDIT_DB,
        )
        parts = row.split("|")
        out["audits_24h"] = int(parts[0]) if parts and parts[0] else 0
        out["audits_7d"] = int(parts[1]) if len(parts) > 1 and parts[1] else 0
        out["paid_24h"] = int(parts[2]) if len(parts) > 2 and parts[2] else 0
        out["paid_7d"] = int(parts[3]) if len(parts) > 3 and parts[3] else 0
    except Exception as e:
        out["audit_db_error"] = str(e)

    if "--digest" in sys.argv:
        print(render_digest(out))
    else:
        print(json.dumps(out, indent=2))


def _mv(metric_values, idx):
    """Safely read a GA4 metric value by index."""
    try:
        return metric_values[idx]["value"]
    except (IndexError, TypeError, KeyError):
        return "0"


def render_digest(out):
    lines = []
    lines.append("Nebula stats: last 24h (post-fix clean window)")
    lines.append("")

    # GA4
    if "ga4_24h" in out:
        mv = out["ga4_24h"]
        lines.append("GA4 (24h): "
                     f"{_mv(mv, 0)} sessions, {_mv(mv, 2)} users, "
                     f"{_mv(mv, 3)} pageviews, {_mv(mv, 1)} key events")
    elif "ga4_error" in out:
        lines.append(f"GA4: ERROR — {out['ga4_error']}")

    # PostHog
    if "posthog_24h" in out:
        ph = out["posthog_24h"]
        lines.append(f"PostHog (24h): {ph.get('landing_page_view', 0)} landing views, "
                     f"{ph.get('audit_page_viewed', 0)} audit views, "
                     f"{ph.get('audit_submitted', 0)} audit submitted")
    elif "posthog_error" in out:
        lines.append(f"PostHog: ERROR — {out['posthog_error']}")

    # GSC
    if "gsc_24h" in out:
        g = out["gsc_24h"]
        lines.append(f"GSC (24h): {g.get('clicks', 0)} clicks, {g.get('impressions', 0)} impressions")
    elif "gsc_error" in out:
        lines.append(f"GSC: ERROR — {out['gsc_error']}")

    # Audit DB
    if "audits_24h" in out:
        lines.append(f"Audits (24h): {out['audits_24h']} completed, {out['paid_24h']} paid")
    elif "audit_db_error" in out:
        lines.append(f"Audit DB: ERROR — {out['audit_db_error']}")

    lines.append("")
    lines.append("7d context:")
    if "ga4_7d" in out:
        mv = out["ga4_7d"]
        lines.append(f"  GA4: {_mv(mv, 0)} sessions, {_mv(mv, 3)} pageviews, {_mv(mv, 1)} key events")
    if "posthog_7d" in out:
        ph = out["posthog_7d"]
        lines.append(f"  PostHog: {ph.get('landing_page_view', 0)} landing views, "
                     f"{ph.get('audit_submitted', 0)} audit submitted")
    if "gsc_7d" in out:
        g = out["gsc_7d"]
        lines.append(f"  GSC: {g.get('clicks', 0)} clicks, {g.get('impressions', 0)} impressions")
    if "audits_7d" in out:
        lines.append(f"  Audits: {out['audits_7d']} completed, {out['paid_7d']} paid")

    return "\n".join(lines)


if __name__ == "__main__":
    main()
