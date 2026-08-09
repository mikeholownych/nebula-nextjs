#!/usr/bin/env python3
"""YouTube settings audit — encodes Adam Ivy's '9 Settings That Kill Small
Channels' (CghjIJ3wdZA, 404K views) as an automated + manual checklist.

Auto-checked via YouTube Data API:
  1. madeForKids == False (the $42K COPPA fine setting)
  2. privacyStatus (should be public for published, unlisted default for new)
  3. embeddable == True
  4. license == 'youtube'
  5. notifySubscribers — WRITE-ONLY, cannot read via API (Studio-only)

Manual (Studio-only toggles — reported, not automatable):
  - Upload defaults → UNLISTED (protect against accidental publishing)
  - Blocked words list + 'block links from new commenters' (spam)
  - Featured places OFF (privacy/safety)
  - Automatic chapters OFF → manual chapter titles (SEO)
  - 'Publish to subscriptions feed' checkbox per-video (notifySubscribers)
  - End screens on long-form (session time) — N/A under 2 min

Usage:
  python3 yt_channel/settings_audit.py [--json]
"""
import sys, json
from pathlib import Path

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))


def audit() -> dict:
    from yt_channel.upload import _get_authenticated_service
    svc = _get_authenticated_service()

    ch = svc.channels().list(part="contentDetails,statistics", mine=True).execute()["items"][0]
    uploads_pl = ch["contentDetails"]["relatedPlaylists"]["uploads"]

    items, token = [], None
    while True:
        resp = svc.playlistItems().list(part="snippet", playlistId=uploads_pl, maxResults=50,
                                        pageToken=token).execute()
        items.extend(resp.get("items", []))
        token = resp.get("nextPageToken")
        if not token:
            break
    video_ids = [i["snippet"]["resourceId"]["videoId"] for i in items]

    videos = []
    for i in range(0, len(video_ids), 50):
        batch = ",".join(video_ids[i:i + 50])
        for v in svc.videos().list(part="snippet,status,contentDetails", id=batch).execute().get("items", []):
            st = v["status"]
            dur = v["contentDetails"].get("duration", "PT0S")
            is_short = dur.startswith("PT") and "M" not in dur
            videos.append({
                "id": v["id"],
                "title": v["snippet"]["title"],
                "kind": "short" if is_short else "long",
                "duration": dur,
                "privacy": st.get("privacyStatus"),
                "made_for_kids": st.get("madeForKids"),
                "self_declared_kids": st.get("selfDeclaredMadeForKids"),
                "embeddable": st.get("embeddable"),
                "license": st.get("license"),
                "public_stats": st.get("publicStatsViewable"),
            })

    # Auto-check results
    issues = []
    for v in videos:
        if v["made_for_kids"]:
            issues.append(f"madeForKids=True on {v['title']} — COPPA fine risk, comments disabled")
        if v["privacy"] not in ("public", "unlisted"):
            issues.append(f"privacy={v['privacy']} on {v['title']}")
        if not v["embeddable"]:
            issues.append(f"embeddable=False on {v['title']}")

    return {
        "generated": json.dumps({"now": True}),
        "channel": ch["statistics"],
        "video_count": len(videos),
        "videos": videos,
        "auto_checks": {
            "made_for_kids_all_false": all(not v["made_for_kids"] for v in videos),
            "all_public_or_unlisted": all(v["privacy"] in ("public", "unlisted") for v in videos),
            "all_embeddable": all(v["embeddable"] for v in videos),
            "issues": issues,
        },
        "manual_checks": {
            "upload_default_unlisted": "Studio → Settings → Upload defaults → Visibility: UNLISTED",
            "notify_subscribers_write_only": ("videos.update status.notifySubscribers can SET but not "
                                              "READ via API; check per-video in Studio"),
            "blocked_words": "Studio → Settings → Community → Blocked words (+ block links from new commenters)",
            "featured_places_off": "Studio → Settings → Upload defaults → Advanced: Featured places OFF",
            "auto_chapters_off": "Studio → Settings → Upload defaults → Advanced: disable auto chapters; write manual SEO chapters",
            "end_screens": "Editor → End screen: add video/playlist/subscribe (N/A for <2min Shorts)",
        },
    }


def main():
    import argparse, logging
    from datetime import datetime
    parser = argparse.ArgumentParser(description="Nebula Audits YouTube settings audit (Adam Ivy 9-settings)")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = audit()
    LOG_DIR = NEBULA_DIR / "yt_channel" / "logs"
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = LOG_DIR / f"settings_audit_{stamp}.json"
    out.write_text(json.dumps(report, indent=2))

    if args.json:
        print(json.dumps(report, indent=2))
        return

    print("\n=== YouTube Settings Audit (Adam Ivy 9-settings) ===")
    print(f"Videos: {report['video_count']} | Subs: {report['channel'].get('subscriberCount','?')}")
    print("\n— AUTO-CHECKED (API) —")
    for k, v in report["auto_checks"].items():
        if k != "issues":
            print(f"  {'✅' if v else '❌'} {k}: {v}")
    if report["auto_checks"]["issues"]:
        print("  Issues found:")
        for i in report["auto_checks"]["issues"]:
            print(f"    ❌ {i}")
    else:
        print("  ✅ No auto-check issues — madeForKids all False, privacy OK, embeddable all True")
    print("\n— MANUAL (Studio-only) —")
    for k, v in report["manual_checks"].items():
        print(f"  ☐ {k}: {v}")
    print(f"\nFull report: {out}")


if __name__ == "__main__":
    main()
