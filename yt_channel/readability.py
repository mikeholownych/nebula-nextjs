#!/usr/bin/env python3
"""Readability scoring for YouTube scripts — Jenny Hoyos method.

From "Shorts Genius Shares Everything She Knows" (As7abwNhG7Y, 4.8M
views; Jenny Hoyos: 600M views/yr, 10M avg/video):

She scraped thousands of viral Shorts transcripts and ran them through
readability formulas. Finding: the most popular Shorts (Mr Beast = 1st
grade) sit at **5th grade or under**. Target: 5th grade or below.

Gotcha she calls out: words like "business", "finance", "profit" inflate
the reading level dramatically — explain the concept instead of using
the jargon word.

Implementation: Flesch-Kincaid Grade Level (stdlib, no deps).
  grade = 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
Syllables approximated by vowel-group counting (good enough for a gate).

Usage:
  python3 yt_channel/readability.py "Your hook text here"
"""
import re
import sys

TARGET_GRADE = 5  # Jenny Hoyos: 5th grade or under


def _count_syllables(word: str) -> int:
    """Approximate syllable count via vowel runs (no dictionary needed)."""
    w = word.lower().strip()
    if not w:
        return 0
    # Remove silent trailing 'e' (but keep 'le' words like 'table')
    if len(w) > 2 and w.endswith("e") and not w.endswith("le"):
        w = w[:-1]
    # Count vowel runs
    runs = re.findall(r"[aeiouy]+", w)
    n = len(runs)
    return max(1, n)


def flesch_kincaid_grade(text: str) -> float:
    """Return Flesch-Kincaid Grade Level (US school grade)."""
    # Split into sentences (., !, ?)
    sentences = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    words = [w for w in re.findall(r"[A-Za-z']+", text)]
    if not words or not sentences:
        return 0.0
    total_syllables = sum(_count_syllables(w) for w in words)
    return (
        0.39 * (len(words) / len(sentences))
        + 11.8 * (total_syllables / len(words))
        - 15.59
    )


def flesch_reading_ease(text: str) -> float:
    """Return Flesch Reading Ease (0-100, higher = easier)."""
    sentences = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    words = [w for w in re.findall(r"[A-Za-z']+", text)]
    if not words or not sentences:
        return 100.0
    total_syllables = sum(_count_syllables(w) for w in words)
    return (
        206.835
        - 1.015 * (len(words) / len(sentences))
        - 84.6 * (total_syllables / len(words))
    )


def check_text(text: str, target: int = TARGET_GRADE) -> dict:
    """Return readability metrics + pass/fail vs the 5th-grade target."""
    grade = flesch_kincaid_grade(text)
    ease = flesch_reading_ease(text)
    words = len(re.findall(r"[A-Za-z']+", text))
    return {
        "text": text,
        "words": words,
        "fk_grade": round(grade, 1),
        "reading_ease": round(ease, 1),
        "target_grade": target,
        "pass": grade <= target,
        # Jenny's gotcha: flag jargon words that inflate reading level
        "jargon": [w for w in ("business", "finance", "profit", "conversion",
                               "optimization", "optimize", "strategy",
                               "analytics", "traffic", "audience")
                   if re.search(rf"\b{w}\b", text.lower())],
    }


def check_script(segments) -> list:
    """Run readability check over a script's segment texts.

    Args:
        segments: list of {text: str, visual: str, ...} dicts
    Returns:
        list of per-segment check dicts
    """
    out = []
    for seg in segments:
        out.append(check_text(seg.get("text", "")))
    return out


if __name__ == "__main__":
    text = " ".join(sys.argv[1:])
    if not text:
        print("Usage: python3 yt_channel/readability.py 'text to check'")
        sys.exit(1)
    r = check_text(text)
    status = "✅ PASS" if r["pass"] else "❌ FAIL"
    print(f"{status} — FK grade {r['fk_grade']} (target ≤{r['target_grade']}), "
          f"reading ease {r['reading_ease']}, {r['words']} words")
    if r["jargon"]:
        print(f"  ⚠️ jargon words: {', '.join(r['jargon'])} (consider plain-speak)")
