#!/usr/bin/env python3
"""Set the Nebula Audits channel About text via YouTube Data API.

Primal branding (vidIQ pgvFAwznds0): the channel About is where the
creation story + creed live. This sets it from yt_channel/brand.py.

Usage:
  python3 yt_channel/set_channel_about.py
"""
import sys
from pathlib import Path

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))

from yt_channel.brand import NAME, about_text


def main() -> int:
    from yt_channel.upload import _get_authenticated_service
    svc = _get_authenticated_service()

    ch = svc.channels().list(part="snippet,brandingSettings", mine=True).execute()["items"][0]
    old = ch.get("brandingSettings", {}).get("channel", {}).get("description", "")
    new = about_text()

    if old == new:
        print("About already set — no change.")
        return 0

    # channels.update: brandingSettings cannot be combined with other
    # parts, so send a minimal body with just id + brandingSettings.
    body = {
        "id": ch["id"],
        "brandingSettings": {
            "channel": {"description": new},
        },
    }
    svc.channels().update(part="brandingSettings", body=body).execute()
    print(f"✅ Channel About updated ({NAME}):")
    print(new)
    return 0


if __name__ == "__main__":
    sys.exit(main())
