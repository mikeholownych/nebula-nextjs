#!/usr/bin/env python3
"""Upload test video to Nebula Audits YouTube channel.
Run from nebula root: python3 yt_channel/do_first_upload.py
"""
import sys, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
os.chdir(str(Path(__file__).resolve().parent.parent))

from yt_channel.upload import upload_video, set_thumbnail

video_path = "yt_channel/videos/nebulacomponents_shop.mp4"
thumb_path = "yt_channel/thumbnails/nebulacomponents_shop.png"

title = "Landing Page Audit: NebulaComponents.shop (Score: 6.4/10 C)"

description = (
    "Full landing page audit of NebulaComponents.shop.\n\n"
    "Score: 6.4/10 (C)\n\n"
    "Every dimension scored with actionable fixes.\n\n"
    "Free instant audit of your site: https://nebulacomponents.shop"
)

video_id = upload_video(
    video_path=video_path,
    title=title,
    description=description,
    privacy="public",
)
if video_id:
    print(f"✅ Uploaded: https://youtube.com/watch?v={video_id}")
    set_thumbnail(video_id, thumb_path)
    print("✅ Thumbnail set")
else:
    print("❌ Upload failed")
