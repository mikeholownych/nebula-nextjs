#!/usr/bin/env python3
"""Set up the Nebula Audits YouTube channel branding via API."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from googleapiclient.http import MediaFileUpload
from yt_channel.upload import _get_authenticated_service

yt = _get_authenticated_service()

CHANNEL_ID = "UCHg6WCnjVNEVX3gCPoJnNxQ"

DESCRIPTION = (
    "Free landing page audits for ecommerce brands and SaaS founders.\n\n"
    "Every video tears down a real site: score it across 9 dimensions, "
    "find the leaks, and show you exactly what to fix.\n\n"
    "Get a free audit of your own site: https://nebulacomponents.shop"
)

KEYWORDS = [
    "landing page audit",
    "conversion rate optimization",
    "CRO",
    "ecommerce",
    "landing page",
    "website audit",
    "ad conversion",
    "page speed",
    "UX audit",
    "Nebula Audits",
]

# 1. Update channel description + keywords + country + links
print("Updating channel branding settings...")
r = yt.channels().update(
    part="brandingSettings",
    body={
        "id": CHANNEL_ID,
        "brandingSettings": {
            "channel": {
                "title": "Nebula Audits",
                "description": DESCRIPTION,
                "keywords": " ".join(f'"{k}"' for k in KEYWORDS),
                "defaultLanguage": "en",
                "country": "US",
                "unsubscribedTrailer": "",
            },
            "watch": {
                "textColor": "#FFFFFF",
                "backgroundColor": "#0F1726",
            },
        },
    }
).execute()
print(f"✅ Description + keywords set")

# 2. Upload channel banner (2560x1440)
banner_path = Path("yt_channel/logo/youtube_banner.png")
if banner_path.exists():
    print("Uploading channel banner...")
    media = MediaFileUpload(str(banner_path), mimetype="image/png", resumable=True)
    banner_r = yt.channelBanners().insert(
        media_body=media,
        body={}
    ).execute()
    banner_url = banner_r.get("url", "")
    print(f"Banner uploaded: {banner_url}")

    # Apply banner to channel
    yt.channels().update(
        part="brandingSettings",
        body={
            "id": CHANNEL_ID,
            "brandingSettings": {
                "channel": {
                    "title": "Nebula Audits",
                },
                "image": {
                    "bannerExternalUrl": banner_url,
                }
            }
        }
    ).execute()
    print("✅ Banner applied to channel")
else:
    print(f"⚠️  Banner not found at {banner_path}")

# 3. Final state
r2 = yt.channels().list(
    part="snippet,brandingSettings", mine=True
).execute()
ch = r2["items"][0]
print(f"\n=== Channel State ===")
print(f"Title: {ch['snippet']['title']}")
print(f"Description: {ch['snippet']['description'][:80]}...")
print(f"URL: https://youtube.com/@nebulaaudits")
