#!/usr/bin/env python3
"""Nebula Audits brand identity - vidIQ 'Primal Branding' framework.

From "The Secret Behind YouTube's Biggest Channels" (pgvFAwznds0,
vidIQ, May 2026; Patrick Hanlon's primal branding: Nike, Apple, Red
Bull, PewDiePie, Moist Critical, MrBeast all use it):

7 elements - creation story, creed, icon, rituals, sacred words,
anti-believers, leader. For a faceless audit channel, the 'leader' is
the brand persona; everything else maps to constants below. The goal
is consistency: every video, description, and thumbnail reinforces the
same belief system so viewers root for the channel, not just watch it.

Usage: import these constants in script_gen.py / short_gen.py and in
the channel-about updater (set_channel_about.py).
"""
import json
from pathlib import Path

# ── Identity ──────────────────────────────────────────────────────────
NAME = "Nebula Audits"
HANDLE = "@nebulaaudits"
URL = "nebulacomponents.com"
AUDIT_URL = "https://nebulacomponents.com/audit"
SUBSCRIBE_URL = f"https://www.youtube.com/{HANDLE}?sub_confirmation=1"

# ── Element 1: Creation story (why we started) ────────────────────────
# Every big channel leads with WHY. Ours: the anti-slop stance - real
# audits, real scores, real screenshots (from the 'don't be AI slop'
# playbook). Written to be vulnerable and specific, not corporate.
CREATION_STORY = (
    "Every day, founders pay for ads and watch the money disappear. "
    "The problem isn't the ads - it's the page they land on. "
    "Nebula Audits started because automated 'AI slop' teardowns "
    "were useless: no real data, no real screenshots, no real fixes. "
    "So we built the opposite. Every teardown here is a real audit "
    "of a real site - actual load times, actual conversion signals, "
    "an actual score out of 10. No fluff. No hype. Just the number "
    "your ads are paying for, and the fix to change it."
)

# ── Element 2: Creed (what we stand for, not what we make) ────────────
# One sentence, demonstrated not said. Shown in every description.
CREED = "Real audits. Real scores. No fluff."

# ── Element 3: Icon (the thing people recognize without reading) ──────
# The 'THE VERDICT' score card + score circle is our icon - the same
# visual in every Short's payoff moment (reward card). Repetition makes
# it iconic. Also the orange/cyan accent bars.
ICON = {
    "label": "THE VERDICT",
    "score_circle": True,   # the X/10 circle
    "accent_top": "#22D3EE",  # cyan
    "accent_bottom": "#F97316",  # orange
    "note": "Keep these constants unchanged across ALL videos - the icon is built by repetition.",
}

# ── Element 4: Ritual (recurring moment viewers anticipate) ───────────
# The daily teardown + the VERDICT reveal at the end is our ritual.
# The sign-off line is the verbal ritual - same line every video.
SIGN_OFF = "That's your number. Nebula's got your fix."

# ── Element 5: Sacred words (community language) ──────────────────────
# Words we consistently use so viewers start to speak them back.
SACRED_WORDS = [
    "verdict",       # the reveal ritual
    "the number",    # the score as the payoff
    "teardown",      # what we do
    "fix list",      # what they get
]

# ── Element 6: Anti-believers (strong POV we won't walk back) ─────────
# Said UP FRONT in hooks: we believe most landing pages are leaking
# money and most 'audit tools' are fluff. Viewers who disagree opt
# out fast; viewers who agree feel 'welcome home'.
ANTI_BELIEVER_LINE = (
    "Most audit tools give you a pretty score and nothing you can fix. "
    "This channel is the opposite."
)
# Used in the channel about + first video; also a hook variant.

# ── Element 7: Leader (the persona at the center) ─────────────────────
# For a faceless channel the leader is the brand persona: consistent
# voice, consistent standards, never chasing trends at the cost of
# the creed. Encoded here so generated copy never drifts.
LEADER = {
    "voice": "plain-spoken, direct, zero hype (5th-grade readability)",
    "standard": "every teardown is a real audit with a real score",
    "never": "never fake a screenshot, never invent a metric, never walk back the creed",
}


def about_text() -> str:
    """The channel 'About' description (creation story + creed + ritual)."""
    return (
        f"{CREED}\n\n"
        f"{CREATION_STORY}\n\n"
        f"New teardown every day. Watch for the {ICON['label']} at the end - "
        f"that's the number your ads are paying for.\n\n"
        f"Get your own free audit: {AUDIT_URL}"
    )


def video_signature(include_story: bool = False) -> str:
    """The consistent brand block appended to every video description."""
    lines = [CREED]
    if include_story:
        lines.append(CREATION_STORY)
    lines += [
        f"Get a free audit of your site: {AUDIT_URL}",
        f"Subscribe for a daily teardown: {SUBSCRIBE_URL}",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    print("=== Nebula Audits - Primal Branding constants ===\n")
    print("CREED:", CREED)
    print("\nABOUT:\n" + about_text())
    print("\nSIGN_OFF:", SIGN_OFF)
