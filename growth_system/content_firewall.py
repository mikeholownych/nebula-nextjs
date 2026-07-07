"""
Content Firewall — Synthetic Content Detector
Adapted from TrustOS Forensic AI Research (flagstad.io, July 2026)
Filter: detect and discard AI-generated content, vendor camouflage, and marketing
disguised as user sentiment from lead scraping pipelines.
"""
import re

FORBIDDEN_VOCAB = {
    # Venture-Speak
    "leverage", "harness", "unleash", "unlock", "unveil",
    "delved?|deep dive", "underscore", "navigate",
    "elevate", "supercharge", "synergy",
    # Hype
    "game-changing", "transformative", "innovative",
    "cutting-edge", "revolutionary", "robust",
    "seamless", "holistic", "meticulous", "pivotal",
    "crucial", "essential", "vital", "nuanced",
    "multifaceted", "comprehensive",
    # Filler
    "in today'?s fast-paced world",
    "in the ever-evolving landscape",
    "it is important to note",
    "a key takeaway is",
    "that being said",
    # Weak transitions
    "furthermore", "moreover", "additionally",
    "additionally", "consequently", "notably",
    # Poetic fluff
    "tapestry", "symphony", "realm", "embark",
    "evoke", "illuminate", "whisper", "echo", "journey"
}

ANTI_PATTERNS = [
    # Type A: Vendor Camouflage — Problem -> Agitation -> Solution structure
    (r"(?:struggl|battle|wrestl).{0,30}(?:but|however|discover|found|the solution|that's why)",
     "vendor_camouflage_pas"),
    # Type B: AI Fingerprint — Perfect rhythm (balanced sentence length)
    (r"^.{50,80}[.!?]\s*.{50,80}[.!?]\s*.{50,80}[.!?]\s*.{50,80}[.!?]",
     "ai_perfect_rhythm"),
    # Type C: Explanatory crutch
    (r"this highlights the need to|this underscores the importance of|this demonstrates why",
     "ai_explanatory_crutch"),
    # Type D: "Not just X, but Y" antithesis
    (r"(?:it'?s )?not (?:just|only|simply) .{10,80} (?:but|it'?s) ",
     "ai_antithesis_structure"),
    # Type E: "Topic: Explanation" colon format
    (r"\*\*[A-Z][a-z]+(?: [A-Z][a-z]+)*:\*\*",
     "ai_topic_colon_format"),
]

# Summary paragraph markers
SUMMARY_PATTERNS = [
    r"in conclusion",
    r"overall,",
    r"to summarize",
    r"in summary",
]


def has_forbidden_vocab(text: str) -> list:
    """Check for forbidden vocabulary. Returns list of matches."""
    found = []
    lower = text.lower()
    for term in FORBIDDEN_VOCAB:
        if re.search(term, lower):
            found.append(term)
    return found


def detect_ai_patterns(text: str) -> dict:
    """Run all anti-pattern checks. Returns dict of pattern_name -> bool/matches."""
    results = {}
    for pattern, name in ANTI_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        if matches:
            results[name] = len(matches)
    # Summary paragraphs
    for pat in SUMMARY_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            results["ai_summary_paragraph"] = results.get("ai_summary_paragraph", 0) + 1
    return results


def firewall_score(text: str) -> dict:
    """
    Score text on 0-100 where 100 = definitely human-written user sentiment.
    Returns dict with score, flags, and details.
    """
    violations = []
    total_penalty = 0

    # 1. Forbidden vocabulary (-10 each, max -40)
    forbidden = has_forbidden_vocab(text)
    vocab_penalty = min(len(forbidden) * 10, 40)
    if vocab_penalty:
        violations.append({"type": "forbidden_vocab", "count": len(forbidden), "penalty": vocab_penalty, "terms": forbidden})
        total_penalty += vocab_penalty

    # 2. AI pattern detection (-15 each, max -60)
    ai_flags = detect_ai_patterns(text)
    for pat_name, count in ai_flags.items():
        penalty = min(count * 15, 30)
        violations.append({"type": pat_name, "count": count, "penalty": penalty})
        total_penalty += penalty

    raw_score = 100 - total_penalty
    score = max(0, raw_score)

    verdict = "human" if score >= 60 else "synthetic" if score < 40 else "ambiguous"

    return {
        "score": score,
        "verdict": verdict,
        "violations": violations,
        "readable_summary": f"Score: {score}/100 — {'Human' if verdict == 'human' else 'Synthetic' if verdict == 'synthetic' else 'Ambiguous'} ({len(violations)} violation types, {total_penalty}pts penalized)"
    }


def filter_lead(lead_text: str, url: str = "", min_score: int = 50) -> dict:
    """
    Filter a lead's scraped text. Returns dict with pass/fail and details.
    Use before processing scraped content as a buying signal.
    """
    result = firewall_score(lead_text)
    return {
        "url": url,
        "passed": result["score"] >= min_score,
        "score": result["score"],
        "verdict": result["verdict"],
        "summary": result["readable_summary"],
        "violations": result["violations"],
    }


# --- Demo ---
if __name__ == "__main__":
    # Human-written user pain (target)
    human_text = """I spent $10k on Meta ads this month and got 3 orders. My CTR is 4%. Something is broken on my landing page but I can't figure out what. The ad manager says it's the algorithm. I've changed the headline twice. Nothing moved. Is there a way to actually diagnose this without paying an agency $5k?"""

    # AI-generated vendor content (should fail)
    ai_text = """In today's fast-paced digital landscape, businesses face numerous challenges when it comes to optimizing their conversion funnels. It is important to note that leveraging cutting-edge AI technology can be a game-changing solution. Our comprehensive platform harnesses the power of machine learning to unlock hidden revenue potential. Furthermore, our innovative approach seamlessly integrates with your existing stack, ensuring a robust and transformative experience. In conclusion, partnering with us is the key to navigating the complexities of modern marketing and achieving revolutionary growth."""

    print("=== FIREWALL DEMO ===")
    print(f"Human text score: {filter_lead(human_text)['summary']}")
    print(f"AI text score: {filter_lead(ai_text)['summary']}")
