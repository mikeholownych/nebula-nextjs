#!/usr/bin/env python3
"""Channel performance analyzer — ICAHN with OUR OWN data.

'If you already have a channel, you have better proof of concept — you can
do the ICAHN method with money (or conversions) instead of views.' — Shane
Hummus, $333k playbook (YtpQSmu794k).

Ranks our published videos vs the channel average so we can double down on
what actually outperforms:
  - outlier videos (views / engagement / CTR-ish) → what to make MORE of
  - underperformers → what to stop making
  - per-video stats joined with production_log (domain, title, score)

Retention curves need the yt-analytics.readonly scope, which the current
OAuth token lacks. If the token gains that scope later, this script will
pick up averageViewDuration + audienceWatchRatio automatically; until then
it reports what statistics-only can give us (views, likes, comments) and
says so explicitly — never pretends analytics data is available.

Usage:
  python3 yt_channel/retention_analysis.py [--json]
"""

import sys, json, logging
from pathlib import Path
from datetime import datetime, timezone

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("retention_analysis")

LOG_DIR = NEBULA_DIR / "yt_channel" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

ANALYTICS_SCOPE = "https://www.googleapis.com/auth/yt-analytics.readonly"


def _production_map() -> dict[str, dict]:
    """video title → production log entry (domain, score, kind)."""
    out = {}
    log_file = NEBULA_DIR / "yt_channel" / "videos" / "production_log.jsonl"
    if not log_file.exists():
        return out
    for line in log_file.read_text().strip().splitlines():
        if not line:
            continue
        try:
            e = json.loads(line)
        except json.JSONDecodeError:
            continue
        out[e.get("title", "")] = e
    return out


def analyze() -> dict:
    from yt_channel.upload import _get_authenticated_service
    svc = _get_authenticated_service()

    # Channel id + upload playlist
    ch = svc.channels().list(part="contentDetails,statistics", mine=True).execute()["items"][0]
    uploads_pl = ch["contentDetails"]["relatedPlaylists"]["uploads"]
    chan_stats = ch["statistics"]

    # All videos
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

    videos = {}
    for i in range(0, len(video_ids), 50):
        batch = ",".join(video_ids[i:i + 50])
        for v in svc.videos().list(part="snippet,statistics,contentDetails", id=batch).execute().get("items", []):
            videos[v["id"]] = v

    prod = _production_map()
    rows = []
    for vid_id, v in videos.items():
        st = v.get("statistics", {})
        views = int(st.get("viewCount", 0) or 0)
        likes = int(st.get("likeCount", 0) or 0)
        comments = int(st.get("commentCount", 0) or 0)
        title = v["snippet"]["title"]
        rows.append({
            "video_id": vid_id,
            "title": title,
            "published": v["snippet"]["publishedAt"][:10],
            "views": views,
            "likes": likes,
            "comments": comments,
            "engagement_rate": round(100 * (likes + comments) / views, 2) if views else 0.0,
            "duration_s": _iso_duration_to_s(v["contentDetails"].get("duration", "PT0S")),
            "production": prod.get(title, {}),
        })

    rows.sort(key=lambda r: r["views"], reverse=True)
    n = len(rows) or 1
    avg_views = sum(r["views"] for r in rows) / n
    avg_eng = sum(r["engagement_rate"] for r in rows) / n

    # Outliers vs OUR average (ICAHN with our own data)
    for r in rows:
        r["views_vs_avg"] = round(r["views"] / avg_views, 2) if avg_views else 0.0
        r["eng_vs_avg"] = round(r["engagement_rate"] / avg_eng, 2) if avg_eng else 0.0
        r["outlier"] = r["views_vs_avg"] >= 2.0 or r["eng_vs_avg"] >= 2.0

    # Analytics-scope check (true retention)
    retention = None
    creds_path = NEBULA_DIR / "yt_channel" / "creds" / "token.pickle"
    has_analytics = False
    try:
        import pickle
        from google.oauth2.credentials import Credentials
        with open(creds_path, "rb") as f:
            tok = pickle.load(f)
        has_analytics = ANALYTICS_SCOPE in tok.scopes
    except Exception:
        pass
    if not has_analytics:
        retention = {
            "available": False,
            "reason": f"token lacks {ANALYTICS_SCOPE} — one-time consent refresh required "
                      f"(re-run setup with the added scope) to read true retention curves",
        }
    else:
        try:
            # channel-level audience retention (video-level needs the
            # youtubeAnalytics API; keep this honest and channel-scoped).
            # NOTE: reports() lives on the youtubeAnalytics v2 service,
            # NOT on the youtube v3 service from _get_authenticated_service.
            import pickle
            from googleapiclient.discovery import build
            from google.oauth2.credentials import Credentials
            with open(creds_path, "rb") as f:
                tok = pickle.load(f)
            an_svc = build("youtubeAnalytics", "v2", credentials=tok)
            end = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            resp = an_svc.reports().query(
                ids="channel==MINE",
                startDate="2026-07-01", endDate=end,
                metrics="averageViewDuration,views,estimatedMinutesWatched",
                dimensions="video",
            ).execute()
            retention = {"available": True, "rows": resp.get("rows", [])}
        except Exception as e:
            retention = {"available": False, "reason": str(e)}

    return {
        "generated": datetime.now(timezone.utc).isoformat(),
        "channel": chan_stats,
        "avg_views": round(avg_views, 1),
        "avg_engagement_rate": round(avg_eng, 2),
        "video_count": len(rows),
        "outliers": [r for r in rows if r["outlier"]],
        "underperformers": [r for r in rows if r["views"] > 0 and r["views_vs_avg"] < 0.5][:5],
        "retention": retention,
        "videos": rows,
    }


def _iso_duration_to_s(d: str) -> int:
    import re
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d)
    if not m:
        return 0
    h, mi, s = (int(x or 0) for x in m.groups())
    return h * 3600 + mi * 60 + s


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nebula Audits channel performance analyzer")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    report = analyze()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out = LOG_DIR / f"retention_analysis_{stamp}.json"
    out.write_text(json.dumps(report, indent=2))

    if args.json:
        print(json.dumps(report, indent=2))
        return

    print(f"\n=== Channel performance (ICAHN on our own data) ===")
    print(f"Videos: {report['video_count']} | Avg views: {report['avg_views']} | "
          f"Avg engagement: {report['avg_engagement_rate']}%")
    print(f"Subs: {report['channel'].get('subscriberCount', '?')} | "
          f"Total views: {report['channel'].get('viewCount', '?')}")
    print("\n— OUTLIERS (make more of these) —")
    for r in report["outliers"]:
        prod = r["production"]
        dom = prod.get("domain", "?")
        print(f"  {r['views']:>6,}v x{r['views_vs_avg']:>4.1f} avg | eng {r['engagement_rate']}% "
              f"| {dom:<24} | {r['title'][:52]}")
    if not report["outliers"]:
        print("  (none yet — early channel, keep cadence)")
    print("\n— UNDERPERFORMERS (stop or fix) —")
    for r in report["underperformers"]:
        print(f"  {r['views']:>6,}v x{r['views_vs_avg']:>4.1f} avg | {r['title'][:60]}")
    print("\n— Retention —")
    rt = report["retention"]
    if rt.get("available"):
        print(f"  available: {len(rt.get('rows', []))} video rows")
    else:
        print(f"  NOT available: {rt.get('reason', '?')}")
    print(f"\nFull report: {out}")


if __name__ == "__main__":
    main()
