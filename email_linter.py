#!/usr/bin/env python3
"""
email_linter.py — Pre-send email quality gate.

Source: Illingworth "The Cold Email Formula My Best Clients Use Without Realizing"
  237-campaign analysis → 5 structural rules enforced at send time.

Rules (all MUST pass for email to send):
  1. Word count: 60–180 words (first-touch sweet spot ~74; structured max 180)
  2. Specific number: ≥1 digit sequence in body (3 issues, 26%, $97, 12h…)
  3. CTA = direct question ending in "?" — no calendar/book-a-call links
  4. Subject line: 3–9 words (5–7 ideal), no fake urgency phrases
  5. Personalization: {{firstName}} OR a known first_name token in subject or opening line

Severity levels:
  ERROR   — blocks send
  WARN    — logged, allowed through
"""

import re
from dataclasses import dataclass, field


# ── Config ─────────────────────────────────────────────────────────

WORD_COUNT_MIN  = 60    # Illingworth: "Not 50"
WORD_COUNT_MAX  = 180   # "150–180 words max"
WORD_COUNT_WARN = 120   # above this → warn (approaching verbose)

NUMBER_RE = re.compile(r'\b\d[\d,\.]*[%$kmb]?\b', re.IGNORECASE)

CALENDAR_PATTERNS = re.compile(
    r'(calendly|cal\.com|acuity|book a (call|time|meeting)|schedule a|'
    r'grab a slot|pick a time|click here to book)',
    re.IGNORECASE,
)

FAKE_URGENCY = re.compile(
    r'\b(limited time|act now|don\'t miss|last chance|urgent|ASAP|expir(es|ing)|'
    r'closing soon|today only|respond (immediately|now)|quick question)\b',
    re.IGNORECASE,
)

PRESSURE_CTA = re.compile(
    r'\b(let me know|feel free|don\'t hesitate|reach out if|hope to hear|'
    r'look forward to hearing|please advise)\b',
    re.IGNORECASE,
)

SUBJECT_WORD_MIN = 3
SUBJECT_WORD_MAX = 9   # Illingworth: "5–7 words, relevance or outcome-based"

PERSONALIZATION_RE = re.compile(
    r'(\{\{firstName\}\}|\{\{first_name\}\}|\{\{name\}\}|'
    r'\{\{CompanyName\}\}|\{\{company\}\})',
    re.IGNORECASE,
)


# ── Result dataclass ───────────────────────────────────────────────

@dataclass
class LintResult:
    passed: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    stats: dict = field(default_factory=dict)

    def fail(self, msg: str):
        self.passed = False
        self.errors.append(msg)

    def warn(self, msg: str):
        self.warnings.append(msg)

    def summary(self) -> str:
        lines = [f"{'✅ PASS' if self.passed else '❌ FAIL'} | wc={self.stats.get('word_count',0)} | subj_words={self.stats.get('subject_words',0)} | numbers={self.stats.get('number_count',0)}"]
        for e in self.errors:
            lines.append(f"  ERROR  {e}")
        for w in self.warnings:
            lines.append(f"  WARN   {w}")
        return "\n".join(lines)


# ── Core linter ────────────────────────────────────────────────────

def lint_email(subject: str, body: str, first_name: str = "") -> LintResult:
    """
    Lint an outbound email against Illingworth's 237-campaign formula.

    Args:
        subject    : subject line string
        body       : plain-text email body (no headers)
        first_name : known recipient first name (used for personalisation check)

    Returns:
        LintResult with .passed, .errors, .warnings, .stats
    """
    r = LintResult()
    subj_lower = subject.lower()

    # ── Rule 1: Word count ─────────────────────────────────────────
    wc = len(body.split())
    r.stats["word_count"] = wc

    if wc < WORD_COUNT_MIN:
        r.fail(f"Too short: {wc} words (min {WORD_COUNT_MIN}). Illingworth: 'Short enough to feel casual, long enough to say something useful'.")
    elif wc > WORD_COUNT_MAX:
        r.fail(f"Too long: {wc} words (max {WORD_COUNT_MAX}). Cut ruthlessly.")
    elif wc > WORD_COUNT_WARN:
        r.warn(f"Approaching verbose: {wc} words. Sweet spot is 74 for first-touch.")

    # ── Rule 2: Specific number in body ───────────────────────────
    numbers = NUMBER_RE.findall(body)
    r.stats["number_count"] = len(numbers)
    if not numbers:
        r.fail("Zero numbers in body. Illingworth: 'If your email has zero numbers, it feels like zero thought went into it.' Add: audit count, %, $ amount, timeframe.")

    # ── Rule 3: CTA is a direct question; no calendar links ────────
    # Check ALL sentences — P.S. and opt-out footer are expected to trail the CTA
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', body.strip()) if s.strip()]
    has_question_cta = any("?" in s for s in sentences)

    if not has_question_cta:
        r.fail("CTA does not end with a question. Illingworth: 'Every campaign ended with a direct question. Direct questions demand responses.' Use: 'Interested?' / 'Worth a look?' / 'Want me to send it?'")

    if CALENDAR_PATTERNS.search(body):
        r.fail("Calendar/booking link in first-touch email. Illingworth: 'Avoid pressure language or calendar links in the first touch.'")

    if PRESSURE_CTA.search(body):
        m = PRESSURE_CTA.search(body)
        phrase = m.group() if m else ""
        r.warn(f"Soft/passive CTA phrase detected ('{phrase}'). Replace with a direct question.")

    # ── Rule 4: Subject line word count ───────────────────────────
    subj_words = len(subject.split())
    r.stats["subject_words"] = subj_words

    if subj_words < SUBJECT_WORD_MIN:
        r.warn(f"Subject too short: {subj_words} words. Illingworth: '5–7 words, relevance or outcome-based'.")
    elif subj_words > SUBJECT_WORD_MAX:
        r.warn(f"Subject too long: {subj_words} words (max {SUBJECT_WORD_MAX}). Trim to feel human.")

    if FAKE_URGENCY.search(subject):
        m = FAKE_URGENCY.search(subject)
        phrase = m.group() if m else ""
        r.fail(f"Fake urgency in subject: '{phrase}'. Illingworth: 'No fake urgency.'")

    # "Quick question" overuse (Illingworth: "No 'quick question'")
    if "quick question" in subj_lower:
        r.warn("'Quick question' in subject — heavily filtered now. Illingworth explicitly flagged this.")

    # ── Rule 5: Personalization in subject or opening line ────────
    # Either a template token OR an actual name present
    first_line = sentences[0] if sentences else ""
    has_token  = bool(PERSONALIZATION_RE.search(subject + " " + first_line))
    has_name   = bool(first_name and (first_name.lower() in subject.lower() or first_name.lower() in first_line.lower()))
    r.stats["personalized"] = has_token or has_name

    if not (has_token or has_name):
        r.warn(
            "No {{firstName}} or name in subject/opening. "
            "Illingworth: 33% of top performers used it — keeps tone human, not robotic. "
            "Add to subject: 'Let's chat, {first_name}?' or first line: 'Hi {first_name},'."
        )

    return r


# ── Convenience gate (used in build_email) ────────────────────────

def gate(subject: str, body: str, first_name: str = "", raise_on_error: bool = False) -> LintResult:
    """
    Run lint_email and optionally raise ValueError on hard failures.
    Use raise_on_error=True in send path to block bad emails.
    """
    result = lint_email(subject, body, first_name)
    if not result.passed and raise_on_error:
        raise ValueError(f"Email failed lint:\n{result.summary()}")
    return result


# ── CLI smoke test ─────────────────────────────────────────────────

if __name__ == "__main__":
    # Should FAIL: too short, no number, no question CTA, calendar link
    bad_email = (
        "Hi, I help founders fix landing pages. Would love to book a call on calendly.",
        "Let me know if you want to chat."
    )
    # Should PASS: ~74 words, number, question CTA, decent subject
    good_email = (
        "Your ads — found something, Mike",
        """Hi Mike,

Saw your post about $3k/mo Google Ads with flat conversions.

Problem I keep seeing: the ads are fine, but the page loses 60%+ of visitors before they see the offer. Ran 100+ audits — the hero section is where the budget bleeds almost every time.

Want me to run a free audit on your page? I'll send findings same day — just reply with your URL.

—
Reply STOP to opt out."""
    )

    print("=== Email Linter — smoke test ===\n")
    for label, (subj, body) in [("BAD", bad_email), ("GOOD", good_email)]:
        r = lint_email(subj, body, first_name="Mike")
        print(f"[{label}] subject: '{subj}'")
        print(r.summary())
        print()
