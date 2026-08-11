#!/usr/bin/env python3
"""Post-upload playbook - Shane Hummus "10 Things Every Smart YouTuber
Does IMMEDIATELY After Uploading" (N45nMvSOgFQ, 922K views, $477K/yr
AdSense). Everything a smart uploader does AFTER the video goes live.

Implemented here (wired into yt_orchestrator.py after upload):
  1. rename_to_title()  - file name = video title (his tip #7: "this
     tip alone probably got me an extra 10-20M views over the years").
     YouTube reads the filename as metadata during processing.
  2. ensure_playlist()  - deep-link to a channel playlist (tip #9):
     bingeing sends strong quality signals; every upload joins the
     teardown playlist so suggested/autoplay cycles the whole series.
  3. add_to_playlist()  - idempotent add (replay-safe; duplicate =
     400 ignored).
  4. post_self_comment()- pinned-comment strategy (tip #6): "almost
     everyone looks at the comments"; own comment = engagement signal
     + the free-audit link lives in the comments. The API cannot
     actually PIN (Studio-only), so this seeds the comment + the
     manual pin is a 10-second Studio step.
  5. publish_held()     - 24-48h private hold for LONG-FORM (tip #1):
     YouTube's AI scans new uploads; new channels get fewer resources
     so trust matters more. Shorts stay public (feed is time-sensitive;
     the Shorts feed IS the discovery surface).

Fail-closed + replay-safe: every step is try/except'd, idempotent via
post_upload_state.json (video_id → actions done), and never raises -
a post-upload step failing must not break the pipeline.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path

log = logging.getLogger("post_upload")

NEBULA_DIR = Path(__file__).resolve().parent.parent
STATE_FILE = NEBULA_DIR / "yt_channel" / "logs" / "post_upload_state.json"
PLAYLIST_TITLE = "Nebula Audits - Landing Page Teardowns"

FREE_AUDIT_URL = "https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=comments"


def _load_state() -> dict[str, dict[str, bool]]:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def _save_state(state: dict[str, dict[str, bool]]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2))
    tmp.replace(STATE_FILE)  # atomic write


def _mark(video_id: str, action: str) -> None:
    state = _load_state()
    state.setdefault(video_id, {})[action] = True
    _save_state(state)


def _already(video_id: str, action: str) -> bool:
    return _load_state().get(video_id, {}).get(action, False)


# ── 1. File name = title (tip #7) ───────────────────────────────────

def sanitize_filename(title: str, ext: str = ".mp4") -> str:
    """Turn a video title into a safe, readable file name.

    Keeps the SEO value (YouTube sees the filename during processing)
    while stripping characters that are invalid on filesystems."""
    s = title.replace("#", "").strip()
    s = re.sub(r'[\\/:*?"<>|\x00-\x1f]', " ", s)  # separator → space so '7/10' → '7 10'
    s = re.sub(r"\s+", " ", s).strip()
    s = s[:90].strip() or "video"
    return f"{s}{ext}"


def rename_to_title(video_path: str, title: str) -> Path:
    """Rename the produced file to '<title>.mp4' before upload (tip #7).

    Returns the new path. In-place (os.replace) - the produced file
    isn't needed afterward."""
    src = Path(video_path)
    dst = src.with_name(sanitize_filename(title, src.suffix))
    if dst != src:
        dst.unlink(missing_ok=True)
        src.rename(dst)
        log.info(f"Renamed for SEO: {src.name} -> {dst.name}")
    return dst


# ── 2/3. Playlist deep-linking (tip #9) ─────────────────────────────

def ensure_playlist(service, title: str = PLAYLIST_TITLE) -> str | None:
    """Find the teardown playlist, creating it if missing. Returns id."""
    try:
        resp = service.playlists().list(part="snippet", mine=True, maxResults=50).execute()
        for pl in resp.get("items", []):
            if pl["snippet"]["title"] == title:
                log.info(f"Playlist exists: {pl['id']}")
                return pl["id"]
        created = service.playlists().insert(
            part="snippet,status",
            body={
                "snippet": {
                    "title": title,
                    "description": "Every Nebula Audits landing page teardown, in order.",
                },
                "status": {"privacyStatus": "public"},
            },
        ).execute()
        log.info(f"Created playlist: {created['id']}")
        return created["id"]
    except Exception as e:
        log.warning(f"ensure_playlist failed: {e}")
        return None


def add_to_playlist(service, playlist_id: str, video_id: str) -> bool:
    """Add a video to the playlist. Idempotent (duplicate = 400 ignored)."""
    if _already(video_id, "playlist"):
        return True
    try:
        service.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {"kind": "youtube#video", "videoId": video_id},
                }
            },
        ).execute()
        _mark(video_id, "playlist")
        log.info(f"Added {video_id} to playlist {playlist_id}")
        return True
    except Exception as e:
        # 400 = already in playlist → treat as done (replay-safe)
        if "duplicate" in str(e).lower() or "already" in str(e).lower():
            _mark(video_id, "playlist")
            return True
        log.warning(f"add_to_playlist failed for {video_id}: {e}")
        return False


# ── 4. Self-comment (tip #6) ────────────────────────────────────────

def post_self_comment(service, video_id: str, kind: str = "short") -> bool:
    """Post our own comment on the new video right after upload.

    Text: the free-audit link + a question (questions draw replies,
    replies draw notifications → the 'social hour' effect). One per
    video, tracked in state (replay-safe). Pin is a manual Studio
    step - the comment is the API-able part."""
    if _already(video_id, "comment"):
        return True
    text = (
        f"🔥 Free audit: {FREE_AUDIT_URL}\n\n"
        f"New teardown every day. What should we audit next?"
    )
    try:
        service.commentThreads().insert(
            part="snippet",
            body={
                "snippet": {
                    "videoId": video_id,
                    "topLevelComment": {"snippet": {"textOriginal": text}},
                }
            },
        ).execute()
        _mark(video_id, "comment")
        log.info(f"Self-comment posted on {video_id}")
        return True
    except Exception as e:
        log.warning(f"post_self_comment failed for {video_id}: {e}")
        return False


# ── 5. Publish held videos (tip #1) ─────────────────────────────────

def publish_held(service, min_age_h: float = 24.0, dry_run: bool = False) -> list[str]:
    """Flip long-form videos held private for >= min_age_h to public.

    tip #1: upload private → wait 24-48h (YouTube's AI scans the
    upload; new channels get fewer resources so trust matters more) →
    publish. Idempotent: skips non-private, skips too-young.

    Returns list of video ids published (or would-publish in dry_run)."""
    from datetime import datetime, timedelta, timezone

    published: list[str] = []
    try:
        ch = service.channels().list(part="contentDetails", mine=True).execute()["items"][0]
        uploads_pl = ch["contentDetails"]["relatedPlaylists"]["uploads"]
        items, token = [], None
        while True:
            resp = service.playlistItems().list(
                part="snippet", playlistId=uploads_pl, maxResults=50,
                pageToken=token).execute()
            items.extend(resp.get("items", []))
            token = resp.get("nextPageToken")
            if not token:
                break
        ids = [i["snippet"]["resourceId"]["videoId"] for i in items]
        cutoff = datetime.now(timezone.utc) - timedelta(hours=min_age_h)
        for i in range(0, len(ids), 50):
            batch = ",".join(ids[i:i + 50])
            for v in service.videos().list(part="status,snippet", id=batch).execute().get("items", []):
                if v["status"].get("privacyStatus") != "private":
                    continue
                pub_at = datetime.fromisoformat(
                    v["snippet"]["publishedAt"].replace("Z", "+00:00"))
                age = datetime.now(timezone.utc) - pub_at
                if age < timedelta(hours=min_age_h):
                    continue
                if dry_run:
                    log.info(f"[dry-run] would publish {v['id']} ({age.total_seconds()/3600:.1f}h old)")
                    published.append(v["id"])
                else:
                    service.videos().update(
                        part="status",
                        body={
                            "id": v["id"],
                            "status": {
                                "privacyStatus": "public",
                                "selfDeclaredMadeForKids": False,
                            },
                        },
                    ).execute()
                    log.info(f"Published held video {v['id']} ({age.total_seconds()/3600:.1f}h old)")
                    published.append(v["id"])
    except Exception as e:
        log.warning(f"publish_held failed: {e}")
    return published


# ── Run-all for the orchestrator ────────────────────────────────────

def run_post_upload(service, video_id: str, kind: str, playlist_id: str | None = None) -> dict:
    """Execute the post-upload steps for one new video. Never raises."""
    result = {"video_id": video_id, "kind": kind}
    if playlist_id:
        result["playlist"] = add_to_playlist(service, playlist_id, video_id)
    result["comment"] = post_self_comment(service, video_id, kind)
    return result


if __name__ == "__main__":
    import argparse
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Post-upload playbook tools")
    parser.add_argument("--publish-held", action="store_true",
                        help="Publish long-form videos held private >=24h (tip #1)")
    parser.add_argument("--dry-run", action="store_true",
                        help="With --publish-held: list what would publish, change nothing")
    parser.add_argument("--ensure-playlist", action="store_true",
                        help="Find or create the teardown playlist")
    parser.add_argument("--backfill-playlist", action="store_true",
                        help="Add ALL existing channel videos to the playlist")
    parser.add_argument("--comment", metavar="VIDEO_ID",
                        help="Post the self-comment on a specific video")
    args = parser.parse_args()

    from yt_channel.upload import _get_authenticated_service
    svc = _get_authenticated_service()

    if args.publish_held:
        published = publish_held(svc, dry_run=args.dry_run)
        print(f"publish_held: {len(published)} videos {'would be' if args.dry_run else ''} published")
        for vid in published:
            print(f"  {vid}")

    if args.ensure_playlist or args.backfill_playlist:
        pl_id = ensure_playlist(svc)
        print(f"playlist_id: {pl_id}")
        if pl_id and args.backfill_playlist:
            ch = svc.channels().list(part="contentDetails", mine=True).execute()["items"][0]
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
            for it in items:
                vid = it["snippet"]["resourceId"]["videoId"]
                add_to_playlist(svc, pl_id, vid)
            print(f"backfilled {len(items)} videos")

    if args.comment:
        ok = post_self_comment(svc, args.comment)
        print(f"comment on {args.comment}: {'posted' if ok else 'skipped/failed'}")
