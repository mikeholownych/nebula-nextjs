#!/usr/bin/env python3
"""Weekly @NebulaAudits channel report — the 'is the channel actually
working' report, delivered automatically.

Applied from Austin Belcak's $16k/mo tracking build (BBjSsuKNuU8): the
most dangerous report is the one that used to get done and stopped
quietly. This one runs on schedule, joins:

  1. Channel stats from the YouTube Data API (views, subs, videos, top vid)
  2. Pipeline health from studio_activity.jsonl (runs, success rate, backlog)
  3. Funnel attribution from PostHog — how many audits were submitted
     with utm_source=youtube (the 'is YouTube generating leads' number)

and delivers a concise Hormozi-style report to Telegram.

Usage:
  python3 yt_channel/weekly_report.py [--days 7] [--send] [--json]
"""

import sys, json, os, logging, subprocess
from pathlib import Path
from datetime import datetime, timezone, timedelta

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("weekly_report")

ENV = NEBULA_DIR / ".env"
ACTIVITY = NEBULA_DIR / "yt_channel" / "logs" / "studio_activity.jsonl"
PRODUCTION_LOG = NEBULA_DIR / "yt_channel" / "videos" / "production_log.jsonl"
TELEGRAM_TARGET = "telegram:5920497760"

REPORT_DIR = NEBULA_DIR / "yt_channel" / "logs"
REPORT_DIR.mkdir(parents=True, exist_ok=True)


def load_env():
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.read_text().strip().splitlines():
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def channel_stats() -> dict:
    from yt_channel.upload import _get_authenticated_service
    svc = _get_authenticated_service()
    ch = svc.channels().list(part="statistics,contentDetails", mine=True).execute()["items"][0]
    stats = ch["statistics"]
    uploads_pl = ch["contentDetails"]["relatedPlaylists"]["uploads"]

    items, token = [], None
    while True:
        resp = svc.playlistItems().list(
            part="snippet", playlistId=uploads_pl, maxResults=50,
            pageToken=token).execute()
        items.extend(resp.get("items", []))
        token = resp.get("nextPageToken")
        if not token:
            break
    video_ids = [i["snippet"]["resourceId"]["videoId"] for i in items]

    videos = []
    for i in range(0, len(video_ids), 50):
        batch = ",".join(video_ids[i:i + 50])
        for v in svc.videos().list(part="snippet,statistics", id=batch).execute().get("items", []):
            st = v.get("statistics", {})
            videos.append({
                "title": v["snippet"]["title"],
                "views": int(st.get("viewCount", 0) or 0),
                "likes": int(st.get("likeCount", 0) or 0),
                "published": v["snippet"]["publishedAt"][:10],
            })
    videos.sort(key=lambda v: v["views"], reverse=True)

    return {
        "subs": int(stats.get("subscriberCount", 0) or 0),
        "total_views": int(stats.get("viewCount", 0) or 0),
        "video_count": len(videos),
        "videos": videos,
    }


def funnel_attribution(days: int) -> dict:
    """PostHog: audit_submitted events broken down by utm_source.

    Returns counts for 'youtube' vs all other sources, plus the
    conversion funnel (audit_page_viewed -> audit_submitted).
    """
    load_env()
    key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    host = os.environ.get("POSTHOG_HOST", "https://us.posthog.com")
    project = os.environ.get("POSTHOG_CLI_PROJECT_ID", "525183")
    if not key:
        return {"available": False, "reason": "POSTHOG_PERSONAL_API_KEY missing"}

    import urllib.request
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    def ph_query(payload):
        req = urllib.request.Request(
            f"{host}/api/projects/{project}/query/",
            data=json.dumps({"query": payload}).encode(),
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())

    def trend_total(event, properties=None):
        series = {"kind": "EventsNode", "event": event}
        if properties:
            series["properties"] = properties
        payload = {
            "kind": "TrendsQuery",
            "series": [series],
            "dateRange": {"date_from": date_from, "date_to": None},
            "interval": "day",
        }
        res = ph_query(payload)
        results = res.get("results", [])
        if results and isinstance(results[0], dict):
            return sum(results[0].get("data", []))
        return 0

    def count_by_source(event, source: str) -> int:
        """Count events where utm_source == source (either property name)."""
        for prop in ("$utm_source", "utm_source"):
            try:
                return trend_total(event, [{
                    "key": prop, "value": source, "operator": "exact", "type": "event",
                }])
            except Exception:
                continue
        return 0

    try:
        submitted = trend_total("audit_submitted")
        page_views = trend_total("audit_page_viewed")
        sources = {}
        for src in ("youtube", "linkedin", "google", "x", "twitter", "reddit", "direct", "email", "utm-disabled"):
            n = count_by_source("audit_submitted", src)
            if n:
                sources[src] = n
        return {
            "available": True,
            "date_from": date_from,
            "submitted": submitted,
            "audit_page_viewed": page_views,
            "by_source": sources,
            "youtube": sources.get("youtube", 0),
            "page_to_submit": (submitted / page_views * 100) if page_views else 0.0,
        }
    except Exception as e:
        return {"available": False, "reason": str(e)}


def studio_health(days: int) -> dict:
    activity = _read_jsonl(ACTIVITY)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    recent = [e for e in activity if e.get("timestamp", "") >= cutoff]

    stages = {}
    for e in recent:
        s = stages.setdefault(e.get("stage", "?"), {"ok": 0, "fail": 0})
        status = e.get("status")
        if status in ("ok", "fail"):
            s[status] += 1
    fails = [e for e in recent if e.get("status") == "fail"]

    prods = _read_jsonl(PRODUCTION_LOG)
    return {
        "runs": len(recent),
        "stages": stages,
        "failures": fails[-5:],
        "produced": len([p for p in prods if p.get("timestamp", "") >= cutoff]),
    }


def build_report(days: int) -> dict:
    ch = channel_stats()
    fun = funnel_attribution(days)
    health = studio_health(days)
    return {
        "generated": datetime.now(timezone.utc).isoformat(),
        "period_days": days,
        "channel": ch,
        "funnel": fun,
        "health": health,
    }


def render_text(r: dict) -> str:
    ch = r["channel"]
    fun = r["funnel"]
    h = r["health"]
    days = r["period_days"]
    top = ch["videos"][0] if ch["videos"] else None

    lines = [
        f"📊 @NebulaAudits — Weekly Report (last {days}d)",
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        f"CHANNEL",
        f"  Subs: {ch['subs']:,}  |  Total views: {ch['total_views']:,}  |  Videos: {ch['video_count']}",
    ]
    if top:
        lines.append(f"  Top video: {top['title'][:42]} — {top['views']} views")
        lines.append(f"  Top % of total: {top['views'] / ch['total_views'] * 100:.0f}%" if ch["total_views"] else "")

    lines.append("")
    lines.append("PIPELINE HEALTH")
    ok_total = sum(s["ok"] for s in h["stages"].values())
    fail_total = sum(s["fail"] for s in h["stages"].values())
    total = ok_total + fail_total
    rate = 100 * ok_total / total if total else 100
    lines.append(f"  Runs: {h['runs']}  |  Success: {rate:.0f}%  |  Failures: {fail_total}")
    lines.append(f"  Videos produced (period): {h['produced']}")
    if h["failures"]:
        for f in h["failures"][-3:]:
            lines.append(f"  ✗ {f.get('stage','?')} {f.get('domain','?')}: {f.get('detail','')[:50]}")

    lines.append("")
    lines.append("YOUTUBE → LEADS (PostHog)")
    if fun.get("available"):
        lines.append(f"  Audit page views: {fun.get('audit_page_viewed', 0)}")
        lines.append(f"  Audits submitted: {fun.get('submitted', 0)}")
        lines.append(f"  Page→Submit conv: {fun.get('page_to_submit', 0):.1f}%")
        lines.append(f"  From utm_source=youtube: {fun.get('youtube', 0)}")
        src = fun.get("by_source", {})
        if src:
            others = {k: v for k, v in src.items() if k != "youtube" and v}
            if others:
                top_src = max(others.items(), key=lambda kv: kv[1])
                lines.append(f"  Other top source: {top_src[0]} ({top_src[1]})")
    else:
        lines.append(f"  N/A — {fun.get('reason', '?')}")

    lines.append("")
    lines.append(f"Generated {r['generated'][:16]} UTC")
    return "\n".join(lines)


def send_telegram(text: str):
    """Send via hermes CLI (same pattern as deliver_reaudit)."""
    res = subprocess.run(
        ["hermes", "send", "--to", TELEGRAM_TARGET, text],
        capture_output=True, text=True, timeout=60,
    )
    if res.returncode != 0:
        log.warning(f"hermes send failed: {res.stderr.strip()[:200]}")
        return False
    log.info("Telegram delivered")
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nebula Audits weekly report")
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--send", action="store_true", help="deliver to Telegram")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = build_report(args.days)
    text = render_text(report)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out = REPORT_DIR / f"weekly_report_{stamp}.json"
    out.write_text(json.dumps(report, indent=2))

    if args.json:
        print(json.dumps(report, indent=2))
        return

    print(text)
    if args.send:
        ok = send_telegram(text)
        print(f"\n[telegram] {'delivered' if ok else 'FAILED'}")
    print(f"\nFull report: {out}")


if __name__ == "__main__":
    main()
