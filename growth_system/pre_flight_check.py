#!/usr/bin/env python3
"""
pre_flight_check.py — runs the 6-point content-safety audit before posting.
Usage: python3 pre_flight_check.py --caption "..." --visuals "..." [--platform tiktok,reels,youtube]
Or:    python3 pre_flight_check.py --file /path/to/video.mp4
       (looks for matching video.caption.txt and video.storyboard.md in same dir)

Exits 0 if all GREEN, exits 1 if any RED (blocks Blotato/posting automation).
Prints a table: GREEN / YELLOW / RED with specific fixes.
"""

import sys, argparse, os

# ── Rules ───────────────────────────────────────────────────────────────────

RULES = [
    {
        "id": "real_person_likeness",
        "label": "Real-person likeness",
        "red_patterns": [
            "elon", "musk", "bezos", "zuckerberg", "trump", "biden",
            "beyoncé", "taylor swift", "oprah", "celebrity", "famous person",
            "photoreal face of", "realistic portrait of", "ceo of",
        ],
        "yellow_patterns": [
            "person", "human", "face", "man", "woman", "founder", "actor",
        ],
        "yellow_override": "Yellow only if the person is generic/fictional, not named/real. Review visuals.",
        "fix_red": "Remove real-person likeness. Use generic fictional person or faceless scene.",
        "fix_yellow": "Confirm the person in visuals is fully fictional. If real-looking but unnamed, add a disclosure.",
    },
    {
        "id": "brand_logos",
        "label": "Brand logos / trade dress",
        "red_patterns": [
            "coca-cola", "coke logo", "nike logo", "apple logo", "google logo",
            "meta logo", "stripe logo", "paypal logo",
            "trademarked logo", "registered logo",
        ],
        "yellow_patterns": [
            "contains logo", "shows logo", "brand logo visible",
        ],
        "fix_red": "Replace with a generic/fictional brand or remove the logo from frame.",
        "fix_yellow": "Confirm any logos shown are owned by you or are fictional. If not, remove.",
    },
    {
        "id": "voice_cloning",
        "label": "Voice cloning consent",
        "red_patterns": [
            "cloned voice of", "voice clone of", "impersonating", "soundalike of",
            "sounds like [name]", "using [name]'s voice",
        ],
        "yellow_patterns": [
            "ai voice", "elevenlabs", "voice clone", "synthetic voice",
            "generated voice", "tts", "text to speech",
        ],
        "fix_red": "Stop immediately. You need written consent before cloning any person's voice except your own.",
        "fix_yellow": "Confirm the voice is either (a) your own clone, or (b) a stock/fictional voice. If someone else's — get written consent first.",
    },
    {
        "id": "ai_disclosure",
        "label": "AI-content disclosure",
        "red_patterns": [],
        "yellow_patterns": [
            "ai generated", "generated stills", "ai video", "flux", "midjourney",
            "higgsfield", "kling", "runway", "sora", "synthetic", "faceless",
            "ai voice", "elevenlabs", "tts", "avatar",
        ],
        "always_yellow": True,  # Any AI video should disclose
        "fix_red": "N/A",
        "fix_yellow": (
            "Add AI disclosure before posting:\n"
            "  Caption line: 'Made with AI — script written by me, visuals and voice generated.'\n"
            "  TikTok: Settings → AI-generated content → toggle ON\n"
            "  Reels/Meta: Tag as AI-generated in advanced settings\n"
            "  YouTube Shorts: Add 'AI-generated content' label in upload flow\n"
            "  LinkedIn: Add '(AI-generated visuals)' to caption"
        ),
    },
    {
        "id": "music_rights",
        "label": "Music rights",
        "red_patterns": [
            "spotify", "copyrighted music", "ripped audio", "background music from",
            "song by", "track by", "licensed from",
        ],
        "yellow_patterns": [
            "music", "background music", "soundtrack", "audio track", "song", "beat",
        ],
        "fix_red": "Remove the music immediately. Replace with Suno-generated audio, Epidemic Sound, Artlist, or platform's commercial-cleared library.",
        "fix_yellow": "Confirm music source. If not Suno, Epidemic Sound, Artlist, or platform-cleared — swap it before posting.",
    },
    {
        "id": "sensitive_claims",
        "label": "Sensitive-claim disclaimer",
        "red_patterns": [
            "guaranteed income", "guaranteed returns", "cures", "treats", "diagnoses",
            "medical advice", "financial advice", "legal advice",
            "guaranteed profit", "risk-free investment",
        ],
        "yellow_patterns": [
            "money", "earn", "revenue", "profit", "income", "savings", "investment",
            "health", "medical", "cure", "treat", "legal", "tax", "financial",
            "$/month", "/month", "per month", "dollars", "recover",
        ],
        "fix_red": "Remove the guaranteed claim entirely. No platform will let it stand and the FTC will fine you.",
        "fix_yellow": (
            "Add disclaimer to caption:\n"
            "  Financial estimates: 'Estimates based on industry averages. Your results will vary.'\n"
            "  Health/medical: 'Not medical advice. Consult a professional.'\n"
            "  Legal: 'Not legal advice. Consult a qualified attorney.'"
        ),
    },
]

# ── Audit logic ──────────────────────────────────────────────────────────────

def audit(caption: str, visuals: str) -> list[dict]:
    text = (caption + " " + visuals).lower()
    results = []
    for rule in RULES:
        status = "GREEN"
        fix = None

        # Check RED
        for pat in rule["red_patterns"]:
            if pat in text:
                status = "RED"
                fix = rule["fix_red"]
                break

        # Check YELLOW (only if not already RED)
        if status == "GREEN":
            if rule.get("always_yellow"):
                status = "YELLOW"
                fix = rule["fix_yellow"]
            else:
                for pat in rule["yellow_patterns"]:
                    if pat in text:
                        status = "YELLOW"
                        fix = rule.get("fix_yellow", "Review before posting.")
                        break

        results.append({
            "id": rule["id"],
            "label": rule["label"],
            "status": status,
            "fix": fix,
        })
    return results


def print_table(results: list[dict]) -> bool:
    """Print table, return True if any RED."""
    icons = {"GREEN": "🟢", "YELLOW": "🟡", "RED": "🔴"}
    has_red = False
    print()
    print("━" * 60)
    print("  PRE-FLIGHT SAFETY AUDIT")
    print("━" * 60)
    for r in results:
        icon = icons[r["status"]]
        print(f"\n{icon} {r['status']:7} — {r['label']}")
        if r["fix"] and r["status"] in ("YELLOW", "RED"):
            for line in r["fix"].split("\n"):
                print(f"           {line}")
        if r["status"] == "RED":
            has_red = True
    print()
    if has_red:
        print("🔴 BLOCKED — fix all RED items before posting.")
    else:
        greens = sum(1 for r in results if r["status"] == "GREEN")
        yellows = sum(1 for r in results if r["status"] == "YELLOW")
        print(f"✅ CLEAR — {greens} GREEN, {yellows} YELLOW (review before posting)")
    print("━" * 60)
    return has_red


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--caption", default="")
    parser.add_argument("--visuals", default="")
    parser.add_argument("--file", default="")
    args = parser.parse_args()

    caption = args.caption
    visuals = args.visuals

    if args.file:
        base = os.path.splitext(args.file)[0]
        cap_file = base + ".caption.txt"
        vis_file = base + ".storyboard.md"
        if os.path.exists(cap_file):
            caption = open(cap_file).read()
        if os.path.exists(vis_file):
            visuals = open(vis_file).read()
        if not caption and not visuals:
            print(f"No caption/storyboard found for {args.file}")
            print(f"Expected: {cap_file} and {vis_file}")
            sys.exit(2)

    if not caption and not visuals:
        print("Usage: --caption '...' --visuals '...'  OR  --file video.mp4")
        sys.exit(2)

    results = audit(caption, visuals)
    has_red = print_table(results)
    sys.exit(1 if has_red else 0)


if __name__ == "__main__":
    main()
