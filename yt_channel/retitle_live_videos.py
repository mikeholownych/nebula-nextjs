#!/usr/bin/env python3
"""Re-title and re-describe the live Nebula Audits videos for search intent.

Maps existing video IDs to pain-first titles + email-capture descriptions,
then updates via the YouTube Data API. Idempotent: skips videos already
matching the new title.
"""
import sys
from pathlib import Path
NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))
from yt_channel.upload import _get_authenticated_service

# video_id -> (new_title, new_description)
UPDATES = {
    "EP0UF0Fpaso": (
        "Why This Landing Page Isn't Converting: nebulacomponents.com Teardown (7/10)",
        "A data-driven landing page teardown of nebulacomponents.com.\n\n"
        "Score: 6.9/10 — close to great, but with clear conversion leaks.\n\n"
        "Get your own free landing page audit — fix list emailed to you:\n"
        "https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=video&utm_campaign=retitle\n\n"
        "#landingpage #cro #conversionoptimization",
    ),
    "5ykZwtaxGmo": (
        "You're Wasting Ad Spend On This Page #Shorts",
        "Free landing page audit: nebulacomponents.com\n\n"
        "Get a free audit of your own site — fix list emailed to you:\n"
        "https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=shorts&utm_campaign=retitle\n\n"
        "#LandingPage #CRO #ConversionOptimization #Shorts #MarketingTips",
    ),
    "-D0zQychrcQ": (
        "What stripe.com Gets Right (That Most Pages Don't): Review (7/10)",
        "A data-driven landing page review of stripe.com.\n\n"
        "Score: 6.8/10 — close to great.\n\n"
        "Get your own free landing page audit — fix list emailed to you:\n"
        "https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=video&utm_campaign=retitle\n\n"
        "#landingpage #cro #conversionoptimization",
    ),
    "aiK2FVrSHyY": (
        "Why This Landing Page Isn't Converting: patreon.com Teardown",
        "A data-driven landing page teardown of patreon.com.\n\n"
        "Get your own free landing page audit — fix list emailed to you:\n"
        "https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=video&utm_campaign=retitle\n\n"
        "#landingpage #cro #conversionoptimization",
    ),
    "2053xikPsRE": (
        "You're Wasting Ad Spend On This Page #Shorts",
        "Free landing page audit: nebulacomponents.shop\n\n"
        "Get a free audit of your own site — fix list emailed to you:\n"
        "https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=shorts&utm_campaign=retitle\n\n"
        "#LandingPage #CRO #ConversionOptimization #Shorts #MarketingTips",
    ),
    "FLvi-GZqzSQ": (
        "Why This Landing Page Isn't Converting: nebulacomponents.shop Audit (6/10)",
        "A data-driven landing page audit of nebulacomponents.shop.\n\n"
        "Score: 6.4/10.\n\n"
        "Get your own free landing page audit — fix list emailed to you:\n"
        "https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=video&utm_campaign=retitle\n\n"
        "#landingpage #cro #conversionoptimization",
    ),
}

svc = _get_authenticated_service()
done = []
for vid, (title, desc) in UPDATES.items():
    try:
        body = svc.videos().list(part="snippet", id=vid).execute()
        items = body.get("items", [])
        if not items:
            print(f"SKIP {vid}: not found")
            continue
        sn = items[0]["snippet"]
        if sn.get("title") == title:
            print(f"SKIP {vid}: already titled")
            continue
        sn["title"] = title
        sn["description"] = desc
        svc.videos().update(part="snippet", body={"id": vid, "snippet": sn}).execute()
        print(f"OK   {vid}: -> {title}")
        done.append(vid)
    except Exception as e:
        print(f"ERR  {vid}: {e}")
print(f"\nUpdated {len(done)}/{len(UPDATES)}")
