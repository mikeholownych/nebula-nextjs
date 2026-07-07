"""YouTube Data API v3 upload module.

Supports:
  - OAuth 2.0 desktop auth (first-time browser grant)
  - Video upload with title/desc/tags/category
  - Thumbnail set
  - Playlist assignment

Setup:
  1. Create GCP project → enable YouTube Data API v3
  2. Create OAuth 2.0 credentials (Desktop App type)
  3. Save client_secret.json to CREDS_DIR / client_secret.json
  4. Run setup_oauth() once (opens browser for consent)
"""

import os, json, pickle, logging
from pathlib import Path

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

from .config import (
    CHANNEL_NAME, CHANNEL_DESCRIPTION, TAGS, CATEGORY_ID,
)

logger = logging.getLogger(__name__)

# ── Paths ───────────────────────────────────────────────────────────
CREDS_DIR = Path(__file__).resolve().parent / "creds"
CLIENT_SECRET_FILE = CREDS_DIR / "client_secret.json"
TOKEN_FILE = CREDS_DIR / "token.pickle"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]

# ── Auth ────────────────────────────────────────────────────────────

def _get_authenticated_service():
    """Get YouTube API service using stored or fresh OAuth token."""
    if not CLIENT_SECRET_FILE.exists():
        raise FileNotFoundError(
            f"OAuth client secret not found at {CLIENT_SECRET_FILE}\n"
            f"Create a GCP project, enable YouTube Data API v3, "
            f"download OAuth 2.0 Desktop credentials as JSON, "
            f"and save to {CLIENT_SECRET_FILE}"
        )

    creds = None
    if TOKEN_FILE.exists():
        with open(TOKEN_FILE, "rb") as f:
            creds = pickle.load(f)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "wb") as f:
            pickle.dump(creds, f)
        logger.info("OAuth token refreshed")

    if not creds or not creds.valid:
        logger.info("Starting OAuth consent flow (console mode)...")
        print("\n" + "="*60)
        print("  YOUTUBE OAUTH SETUP — CONSOLE MODE")
        print("="*60)
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CLIENT_SECRET_FILE), SCOPES,
            redirect_uri="urn:ietf:wg:oauth:2.0:oob"
        )
        auth_url, _ = flow.authorization_url(prompt="consent")
        print("\n1. Open this URL in your browser:")
        print(f"\n   {auth_url}\n")
        print("2. Sign in with the Google account that owns your YouTube channel")
        print("3. Click 'Continue' (you'll see a warning about unverified app)")
        print("4. Click 'Continue' again to grant permissions")
        print("5. Copy the authorization code (long string of letters/numbers)")
        code = input("   Paste the code here and press Enter: ").strip()
        flow.fetch_token(code=code)
        creds = flow.credentials
        with open(TOKEN_FILE, "wb") as f:
            pickle.dump(creds, f)
        print(f"\n✅ OAuth token saved to {TOKEN_FILE}")
        print("="*60 + "\n")

    return build("youtube", "v3", credentials=creds)


def setup_oauth():
    """Run first-time OAuth setup. Opens browser for consent."""
    logger.info("Setting up YouTube OAuth...")
    CREDS_DIR.mkdir(parents=True, exist_ok=True)

    if not CLIENT_SECRET_FILE.exists():
        logger.warning(
            f"First: save your OAuth client_secret.json to {CLIENT_SECRET_FILE}"
        )
        return False

    service = _get_authenticated_service()
    # Verify by fetching channel info
    request = service.channels().list(part="snippet", mine=True)
    response = request.execute()
    if response.get("items"):
        channel = response["items"][0]
        logger.info(f"Authenticated as: {channel['snippet']['title']}")
        return True
    else:
        logger.warning("No channel found — create one at youtube.com first")
        return False


# ── Upload ──────────────────────────────────────────────────────────

def _build_snippet(title, description, tags=None):
    """Build video snippet metadata."""
    return {
        "title": title,
        "description": description,
        "tags": tags or TAGS,
        "categoryId": CATEGORY_ID,
    }


def upload_video(video_path, title, description, tags=None, privacy="public"):
    """Upload a video to YouTube.

    Args:
        video_path: Path to video file
        title: Video title
        description: Video description
        tags: List of tags
        privacy: "public", "unlisted", or "private"

    Returns:
        Video ID string, or None on failure
    """
    service = _get_authenticated_service()
    snippet = _build_snippet(title, description, tags)
    body = {"snippet": snippet, "status": {"privacyStatus": privacy}}

    media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True)

    request = service.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    response = request.execute()
    video_id = response.get("id")
    logger.info(f"Uploaded video {video_id}: {title}")
    return video_id


def set_thumbnail(video_id, thumbnail_path):
    """Set a custom thumbnail for a video."""
    service = _get_authenticated_service()
    media = MediaFileUpload(str(thumbnail_path))
    request = service.thumbnails().set(
        videoId=video_id,
        media_body=media,
    )
    response = request.execute()
    logger.info(f"Thumbnail set for {video_id}")
    return response


# ── CLI ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        setup_oauth()
    else:
        print("Usage: python3 -m yt_channel.upload setup")
        print("       python3 -m yt_channel.upload <video_path> <title>")
