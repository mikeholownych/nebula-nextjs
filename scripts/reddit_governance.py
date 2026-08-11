#!/usr/bin/env python3
"""
Reddit Content Governance - fail-closed gate for ALL Reddit outbound.

Every piece of Reddit content (comment or post) must pass this gate before
Zernio even creates a draft. Purpose: protect the account from
shadowbans/subreddit bans that are INVISIBLE to the Zernio API.

Two layers:
  A. HUMANIZE - strip AI tells (based on the humanizer skill / Wikipedia's
     "Signs of AI writing"). Automod and users both flag AI-sounding content.
  B. RULES - Reddit sitewide + per-subreddit rules (verified 2026-08-08):

Subreddit rule database (fetched from public rules / 3rd-party verifiers):
  r/PPC            : SELF-PROMO BANNED. No tool/agency/service mentions,
                     even in answers. Removal + ban risk high.
  r/FacebookAds    : SELF-PROMO BANNED. Same posture as r/PPC.
  r/GoogleAds      : SELF-PROMO BANNED.
  r/ecommerce      : SELF-PROMO BANNED. Confirmed removal 2026-08-04.
  r/Entrepreneur   : PROMO ONLY in weekly Share Your Business thread.
  r/SaaS           : PROMO ONLY in weekly Share Your SaaS Saturday thread.
  r/SideProject    : PROMO ALLOWED but only as project-context posts
                     ("I built X", story+technical detail). Bare landing-page
                     drops get removed.
  r/buildinpublic  : PROMO ALLOWED for what you're building. No link-drops.
  r/webdev         : PROMO BANNED outside specific threads.

Sitewide rules enforced:
  - 90/10: self-promo content must be ≤10% of account activity (tracked
    separately in reddit_activity.json - gate requires 9 non-promo per 1 promo)
  - No same link cross-posted to multiple subs within 24h
  - No engagement bait / vote manipulation ("upvote if", "like this")
  - Disclose affiliation when you do mention your product
  - No URL in comment BODY on banned subs; offer DM / "happy to share a link"
  - Max 5 substantive comments/day (rate limit, per reddit-post-framing skill)

Usage:
  from reddit_governance import govern_reddit_content
  result = govern_reddit_content(text, subreddit="PPC", kind="comment",
                                 account_id="...")
  if not result["pass"]:  # blocked - reasons in result["violations"]
"""
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

NEBULA_DIR = Path("/home/mike/nebula")
ACTIVITY_FILE = NEBULA_DIR / ".reddit_activity.json"
POSTED_LINKS_FILE = NEBULA_DIR / ".reddit_posted_links.json"

NEBULA_DOMAIN = "nebulacomponents.com"

# ══════════════════════════════════════════════════════════════════════
# A. SUBREDDIT RULE DATABASE (verified 2026-08-08)
# ══════════════════════════════════════════════════════════════════════

# "banned"        : no mention of product/service EVER, even in answers
# "thread_only"   : promo allowed only inside the designated weekly thread
# "context"       : promo allowed if post is project-context (story/build detail)
# "allowed"       : full promo allowed (rare)

SUBREDDIT_RULES = {
    "ppc": {
        "posture": "banned",
        "rule_text": "Spam Posts & Comments Reported as: Spam. Includes posting a thread of services or tools by agencies, freelancers, contractors.",
        "no_url": True,
        "no_mention": True,          # cannot even name the product
        "no_dm_offer": True,         # cannot even offer a DM on banned subs
        "approved_lane": None,
    },
    "facebookads": {
        "posture": "banned",
        "rule_text": "No self-promotion. No agency or service promotion.",
        "no_url": True,
        "no_mention": True,
        "no_dm_offer": True,
        "approved_lane": None,
    },
    "googleads": {
        "posture": "banned",
        "rule_text": "No self-promotion.",
        "no_url": True,
        "no_mention": True,
        "no_dm_offer": True,
        "approved_lane": None,
    },
    "ecommerce": {
        "posture": "banned",
        "rule_text": "No self-promotion. Removed 2026-08-04 (confirmed).",
        "no_url": True,
        "no_mention": True,
        "no_dm_offer": True,
        "approved_lane": None,
    },
    "entrepreneur": {
        "posture": "thread_only",
        "rule_text": "Self-promotion only in the weekly Share Your Business thread.",
        "no_url": True,               # outside the approved lane
        "no_mention": True,           # outside the approved lane
        "no_dm_offer": True,          # outside the approved lane
        "approved_lane": "share your business",
    },
    "saas": {
        "posture": "thread_only",
        "rule_text": "Self-promotion only in weekly Share Your SaaS Saturday thread.",
        "no_url": True,
        "no_mention": True,
        "no_dm_offer": True,
        "approved_lane": "share your saas",
    },
    "sideproject": {
        "posture": "context",
        "rule_text": "Self-promotion welcome but requires project-context: story, build detail, what you learned. Bare landing-page drops are removed.",
        "no_url": False,
        "no_mention": False,
        "no_dm_offer": False,
        "approved_lane": "any project post with build context",
        "require_story": True,
    },
    "buildinpublic": {
        "posture": "context",
        "rule_text": "Share what you're building with context. No link-drops.",
        "no_url": False,
        "no_mention": False,
        "no_dm_offer": False,
        "approved_lane": "build-in-public posts with context",
        "require_story": True,
    },
    "webdev": {
        "posture": "thread_only",
        "rule_text": "No self-promotion outside designated threads.",
        "no_url": True,
        "no_mention": True,
        "no_dm_offer": True,
        "approved_lane": None,
    },
}

# ══════════════════════════════════════════════════════════════════════
# B. AI-TELL PATTERNS (condensed from humanizer skill / Wikipedia)
# ══════════════════════════════════════════════════════════════════════

AI_VOCAB = [
    r"\bdelve[sd]?\b", r"\blandscape\b", r"\btapestry\b", r"\btestament\b",
    r"\bpivotal\b", r"\bcrucial\b", r"\bunderscore[sd]?\b", r"\bhighlights?\b",
    r"\bshowcas(?:e|es|ing)\b", r"\bfoster(?:s|ing)?\b", r"\bgarners?\b",
    r"\bintricacies?\b", r"\benhanc(?:e|es|ing)\b", r"\bvibrant\b",
    r"\bgroundbreaking\b", r"\brenowned\b", r"\bseamless(?:ly)?\b",
    r"\bunlock(?:ing|s|ed)?\b", r"\bempower(?:s|ing|ed)?\b",
    r"\bjourney\b", r"\bgame-?changer\b", r"\bdeep dive\b",
    r"\bat the end of the day\b", r"\bwhen it comes to\b",
    r"\bin a world where\b", r"\bmoving forward\b", r"\bcircle back\b",
    r"\blean into\b", r"\bunpack\b", r"\bdrives? results\b",
    r"\bbest-in-class\b", r"\bstate-of-the-art\b", r"\bcutting-edge\b",
    r"\bI hope this helps\b", r"\bOf course!\b", r"\bCertainly!\b",
    r"\blet me know if you'd like\b", r"\bas of my last\b",
    r"\bup to my last\b", r"\bbased on available information\b",
    r"\bIt's not just about\b", r"\bnot merely\b", r"\bthe real question is\b",
    r"\bat its core\b", r"\bwhat really matters\b", r"\bthe heart of the matter\b",
    r"\bLet's dive in\b", r"\bLet's explore\b", r"\bHere's what you need to know\b",
    r"\bwithout further ado\b", r"\bno guessing\b", r"\bno wasted motion\b",
    r"\bAnd that's okay\b", r"\bAnd that's fine\b", r"\byou're not alone\b",
    r"\bIt's completely normal\b", r"\bElevate\b", r"\bRevolutioniz(?:e|es|ing)\b",
    r"\bUnleash\b", r"\bSupercharge\b", r"\bSkyrocket\b", r"\bEffortless(?:ly)?\b",
    r"\bExplore\b.*\bpossibilities\b", r"\bcomprehensive\b.*\bsolution\b",
    r"\bholistic\b", r"\bscalable\b.*\b(?:solution|approach)\b",
]

AI_STRUCTURE = [
    (r"^[-*]\s*\*\*[A-Z][^:*]{2,30}:\*\*", "bold-header list item"),
    (r"\b(?:Additionally|Moreover|Furthermore|Importantly|Notably|Crucially|Interestingly|Essentially|Ultimately)\b", "adverb opener"),
    (r"\b(?:not only|not just)\b.*\b(?:but also|it's|but)\b", "negative parallelism"),
    (r"\[\w+\]|\[\w+ [\w ]+\]", "bracket placeholder"),
    (r"\b(?:firstly|secondly|thirdly|lastly)\b", "enumeration adverb"),
    (r"\b(?:in conclusion|to summarize|in summary|overall,)\b", "conclusion marker"),
    (r"\b(?:it is important to note|it's worth noting|it should be noted)\b", "filler note"),
    (r"\b(?:here are|let me share)\b.*\b(?:steps?|tips?|ways|strategies|frameworks?)\b", "listicle announce"),
    (r"\b(?:game|world|space|realm)\b.*\b(?:of)\b", "abstract domain metaphor"),
    (r"\b(?:truly|genuinely|honestly)\b.*\b(?:revolution|transform|change the)\b", "intensity inflation"),
]

# Em dash overuse (pattern 14): >2 em dashes in a short comment is a tell
# Curly quotes (pattern 19): direct tell
# Emoji in post body: tell for text content (not titles)

# ══════════════════════════════════════════════════════════════════════
# C. SITEWIDE PATTERNS
# ══════════════════════════════════════════════════════════════════════

ENGAGEMENT_BAIT = [
    r"\bupvote\b", r"\bup-?vote\b", r"\bshare this\b", r"\bfollow me\b",
    r"\bcomment '?\w+'? if\b", r"\bsmash that\b",
    r"\bhit the bell\b", r"\bsubscribe\b",
    r"\b(?:if you )?like this (?:post|comment|video)\b", r"\blike and share\b",
]

PROMO_PHRASES = [
    r"\bcheck out my\b", r"\btry my\b", r"\buse my\b", r"\bmy tool\b",
    r"\bmy product\b", r"\bmy service\b", r"\bmy app\b", r"\bmy platform\b",
    r"\bmy agency\b", r"\bwe offer\b", r"\bwe provide\b", r"\bwe help\b",
    r"\bsign up\b", r"\bget started\b", r"\bbook a\b", r"\bschedule a\b",
    r"\bfree consultation\b", r"\bfree audit\b", r"\bI built\b",
    r"\bwe built\b", r"\bI made\b", r"\bwe made\b", r"\bI launched\b",
    r"\bwe launched\b", r"\bI'm the founder\b", r"\bwe're the\b",
]

URL_RE = re.compile(r"(https?://|www\.|\.com\b|\.io\b|\.app\b|\.dev\b|\.co\b)(\S*)", re.I)
NEBULA_URL_RE = re.compile(r"nebulacomponents\.(?:com|shop)", re.I)
UTM_RE = re.compile(r"[?&]utm_[a-z]+=", re.I)


def _load_json(path: Path, default):
    try:
        if path.exists():
            return json.loads(path.read_text())
    except Exception:
        pass
    return default


def _save_json(path: Path, data):
    tmp = str(path) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=1)
    os.rename(tmp, str(path))


# ══════════════════════════════════════════════════════════════════════
# HUMANIZE CHECKS
# ══════════════════════════════════════════════════════════════════════

def check_humanized(text: str) -> list[str]:
    """Return list of AI-tell violations (empty = passes)."""
    violations = []
    low = text.lower()

    for pat in AI_VOCAB:
        if re.search(pat, low):
            violations.append(f"AI vocab: '{pat.strip(chr(92))}'")
            break  # one vocab hit is enough to flag

    for pat, label in AI_STRUCTURE:
        if re.search(pat, low):
            violations.append(f"AI structure: {label}")
            break

    # Em dash overuse
    if text.count("-") > 2:
        violations.append("em dash overuse (>2)")

    # Curly quotes
    if re.search(r"[\u201c\u201d\u2018\u2019]", text):
        violations.append("curly quotes")

    # Emoji in body (strong AI signal for text content)
    emoji = re.findall(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", text)
    if len(emoji) > 0:
        violations.append("emoji in body")

    # Listicle / rule-of-three structure signals
    if re.search(r"^\s*[-*]\s+", text, re.M) and len(re.findall(r"^\s*[-*]\s+", text, re.M)) >= 3:
        violations.append("3+ bullet list (listicle structure)")

    # Slogan-y closing
    if re.search(r"(?:remember|always remember|at the end of the day),?\s+[a-z]", low):
        violations.append("slogan-y closing")

    # Perfectly uniform sentence length (avg deviation < 3 chars across >= 5 sentences)
    sentences = [s for s in re.split(r"[.!?]+", text) if len(s.strip()) > 3]
    if len(sentences) >= 5:
        lengths = [len(s.split()) for s in sentences]
        avg = sum(lengths) / len(lengths)
        dev = sum(abs(l - avg) for l in lengths) / len(lengths)
        if dev < 1.5:
            violations.append("uniform sentence rhythm (AI cadence)")

    return violations


# ══════════════════════════════════════════════════════════════════════
# RULE CHECKS
# ══════════════════════════════════════════════════════════════════════

def check_subreddit_rules(text: str, subreddit: str, kind: str) -> list[str]:
    """Return rule violations for this subreddit + content kind."""
    violations = []
    sub = subreddit.lower().lstrip("r/")
    rules = SUBREDDIT_RULES.get(sub)
    if not rules:
        violations.append(f"subreddit '{sub}' not in rule database - unknown posture, blocked by default")
        return violations

    posture = rules["posture"]
    low = text.lower()

    has_url = bool(URL_RE.search(text))
    has_nebula_url = bool(NEBULA_URL_RE.search(text))
    has_utm = bool(UTM_RE.search(text))
    has_mention = bool(re.search(r"nebul|audit", low))

    if posture in ("banned",):
        if kind == "post":
            violations.append(f"r/{sub} bans self-promotion - do not post here at all")
        if has_nebula_url or has_utm:
            violations.append(f"r/{sub} bans promo - URL to own site is removal+ban risk")
        elif has_url:
            violations.append(f"r/{sub} bans promo - external URL looks like promotion")
        if has_mention:
            violations.append(f"r/{sub} bans product mentions in answers - even 'we do X'")
        if rules.get("no_dm_offer") and re.search(r"\bDM\b|direct message|shoot me a", text, re.I):
            violations.append(f"r/{sub} bans even DM offers for services")

    elif posture == "thread_only":
        if kind == "post" and not re.search(r"(share your business|share your saas|weekly.*thread|promotion thread)", low):
            violations.append(f"r/{sub} allows promo only in its weekly share thread - not as a standalone post")
        if has_nebula_url or has_utm:
            violations.append(f"r/{sub}: URL outside the approved share thread = removal risk")

    elif posture == "context":
        if kind == "post" and rules.get("require_story"):
            word_count = len(text.split())
            has_context = bool(
                re.search(r"\b(?:i built|i made|i'm building|we built|learned|lesson|story|started)\b", low)
                and word_count >= 80
            )
            if not has_context:
                violations.append(f"r/{sub} removes bare link drops - needs project context/story (>=80 words + build language)")
        if has_utm:
            violations.append("UTM links are an explicit spam signal on Reddit - strip utm_* params")

    return violations


def check_sitewide(text: str, kind: str) -> list[str]:
    """Return sitewide violations."""
    violations = []
    low = text.lower()

    if re.search(r"|".join(ENGAGEMENT_BAIT), low):
        violations.append("engagement bait / vote manipulation (sitewide Rule 3)")

    if NEBULA_URL_RE.search(text) and not re.search(r"\b(?:i (?:built|made|run|own)|we (?:built|run|own)|founder|co-founder)\b", low):
        violations.append("affiliation not disclosed (sitewide transparency norm)")

    if UTM_RE.search(text):
        violations.append("UTM params on Reddit are a spam filter trigger")

    return violations


# ══════════════════════════════════════════════════════════════════════
# ACTIVITY TRACKING (90/10 + rate limits)
# ══════════════════════════════════════════════════════════════════════

MAX_COMMENTS_PER_DAY = 5
MIN_SECONDS_BETWEEN = 150  # 2.5 min - comfortable margin over API limits


def check_activity(account_id: str) -> list[str]:
    """Enforce 90/10 ratio + daily comment cap + spacing + shadowban lockout."""
    violations = []
    act = _load_json(ACTIVITY_FILE, {"accounts": {}})
    acc = act["accounts"].get(account_id, {"comments": [], "promo_comments": 0})
    comments = acc.get("comments", [])

    # ── SHADOWBAN LOCKOUT (fail-closed) ─────────────────────────────────
    # If the account is marked shadowbanned in .reddit_activity.json, ALL
    # sends are blocked. Nothing from this account goes out, ever, until a
    # human explicitly clears the flag.
    if acc.get("shadowbanned"):
        violations.append("account shadowbanned - no sends allowed (clear flag only with human approval)")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_count = sum(1 for ts in comments if ts.startswith(today))
    if today_count >= MAX_COMMENTS_PER_DAY:
        violations.append(f"daily comment cap reached ({MAX_COMMENTS_PER_DAY})")

    if comments:
        last_ts = datetime.fromisoformat(comments[-1].replace("Z", "+00:00"))
        elapsed = (datetime.now(timezone.utc) - last_ts).total_seconds()
        if elapsed < MIN_SECONDS_BETWEEN:
            violations.append(f"rate limit: {MIN_SECONDS_BETWEEN - int(elapsed)}s until next comment allowed")

    promo_count = acc.get("promo_comments", 0)
    total = len(comments)
    if total >= 10 and promo_count / total > 0.1:
        violations.append(f"90/10 ratio broken: {promo_count}/{total} promo comments")

    return violations


def record_activity(account_id: str, kind: str, subreddit: str, is_promo: bool):
    act = _load_json(ACTIVITY_FILE, {"accounts": {}})
    acc = act["accounts"].setdefault(account_id, {"comments": [], "promo_comments": 0})
    acc.setdefault("comments", [])
    acc.setdefault("promo_comments", 0)
    ts = datetime.now(timezone.utc).isoformat()
    acc["comments"].append(ts)
    if is_promo:
        acc["promo_comments"] = acc.get("promo_comments", 0) + 1
    # Keep only 60 days
    cutoff = datetime.now(timezone.utc).timestamp() - 60 * 86400
    acc["comments"] = [c for c in acc["comments"] if _ts_to_epoch(c) > cutoff]
    _save_json(ACTIVITY_FILE, act)


def _ts_to_epoch(ts: str) -> float:
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
    except Exception:
        return 0


def check_link_crosspost(url: str, subreddit: str) -> list[str]:
    """No same link to multiple subs within 24h (spam filter trigger)."""
    violations = []
    links = _load_json(POSTED_LINKS_FILE, {"links": []})
    now = time.time()
    domain = re.sub(r"https?://(www\.)?", "", (url or "")).split("/")[0]
    for entry in links["links"]:
        if entry.get("domain") == domain and entry.get("subreddit") != subreddit.lower():
            age = now - entry.get("ts", 0)
            if age < 86400:
                violations.append(f"same domain {domain} posted to r/{entry['subreddit']} within 24h")
    return violations


def record_link(domain: str, subreddit: str):
    links = _load_json(POSTED_LINKS_FILE, {"links": []})
    links["links"] = [l for l in links["links"] if time.time() - l.get("ts", 0) < 7 * 86400]
    links["links"].append({"domain": domain, "subreddit": subreddit.lower(), "ts": time.time()})
    _save_json(POSTED_LINKS_FILE, links)


# ══════════════════════════════════════════════════════════════════════
# MAIN GATE
# ══════════════════════════════════════════════════════════════════════

def govern_reddit_content(
    text: str,
    subreddit: str,
    kind: str = "comment",          # "comment" | "post"
    account_id: str = "",
    url: str = "",
    check_rate: bool = True,
) -> dict:
    """
    Fail-closed gate. Returns:
      {"pass": bool, "violations": [...], "reason": str}
    Any violation => blocked (pass=False). The caller must NOT send.
    """
    violations = []
    violations += check_humanized(text)
    violations += check_subreddit_rules(text, subreddit, kind)
    violations += check_sitewide(text, kind)
    if url:
        violations += check_link_crosspost(url, subreddit)
    if check_rate and account_id:
        violations += check_activity(account_id)

    ok = len(violations) == 0
    return {
        "pass": ok,
        "violations": violations[:6],
        "reason": "" if ok else "; ".join(violations[:3]),
        "subreddit": subreddit,
        "kind": kind,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


def humanize(text: str) -> str:
    """Light-touch humanization pass: strip the worst AI tells without
    changing meaning. Full humanization happens at generation time; this
    is the safety net."""
    out = text
    # 1. Curly -> straight quotes
    out = out.replace("\u201c", '"').replace("\u201d", '"').replace("\u2018", "'").replace("\u2019", "'")
    # 2. Collapse 3+ em dashes to one (keep max 2)
    parts = out.split("-")
    if len(parts) > 3:
        out = parts[0] + "-" + parts[1] + "-" + "-".join(parts[2:]).replace("-", ",")
    # 3. Strip emoji from body
    out = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", "", out)
    # 4. Remove common filler openers
    out = re.sub(r"^(Additionally|Moreover|Furthermore|Importantly|Interestingly|Notably|Crucially),\s*", "", out)
    out = re.sub(r"^(Of course|Certainly|Sure thing)!?\s*", "", out)
    # 5. Remove "I hope this helps" / "Let me know if you'd like..."
    out = re.sub(r"\s+I hope this helps!?\s*$", "", out)
    out = re.sub(r"\s+Let me know if you'd like (?:me to|to).*$", "", out)
    # 6. Strip UTM params from any URL
    out = re.sub(r"[?&]utm_[a-z]+=[^&\s]+", "", out)
    out = re.sub(r"&+$", "", out)
    return out.strip()


if __name__ == "__main__":
    # CLI: python reddit_governance.py "text" --subreddit PPC --kind comment
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("text", nargs="+")
    ap.add_argument("--subreddit", required=True)
    ap.add_argument("--kind", default="comment")
    ap.add_argument("--account-id", default="")
    args = ap.parse_args()
    r = govern_reddit_content(" ".join(args.text), args.subreddit, args.kind, args.account_id)
    print(json.dumps(r, indent=2))
    sys.exit(0 if r["pass"] else 1)
