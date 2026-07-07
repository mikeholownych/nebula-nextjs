#!/usr/bin/env python3
"""
LinkedIn Post Monitor — tracks new commenters/likers on owned posts via Apify.

Run: python3 linkedin_post_monitor.py

On each run:
1. Calls Apify post_engagers actor (commenters + likers) for monitored posts
2. Compares results with previous run (stored JSONL)
3. Reports NEW engagers since last run
4. Flags actionable comments for engagement
5. Logs new contacts to lead_manager for follow-up
"""

import json, os, sys, subprocess, datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent
GS = BASE / "growth_system"
INPUT_DIR = GS / "apify_inputs"
RAW_DIR = GS / "apify_raw"
LEADS_FILE = BASE / "ledgers" / "leads.json"
MONITOR_STATE = GS / "linkedin_monitor_state.json"
MONITORED_POSTS = [
    "https://www.linkedin.com/feed/update/urn:li:share:7479391233749131264",
    "https://www.linkedin.com/feed/update/urn:li:activity:7478763831968768000/",
    "https://www.linkedin.com/feed/update/urn:li:activity:7480227128299479048/",
]

# Content angle classification for each monitored post.
# Angles: teach | case_study | hook | story | flex | gtm_framework
POST_ANGLES = {
    "https://www.linkedin.com/feed/update/urn:li:share:7479391233749131264": "teach",
    "https://www.linkedin.com/feed/update/urn:li:activity:7478763831968768000/": "hook",
    "https://www.linkedin.com/feed/update/urn:li:activity:7480227128299479048/": "teach",
}

# GTM-based content scoring — assess how well a post drives GTM goals.
# Each angle maps to a GTM intent: validation, inbound, outbound, positioning.
GTM_ANGLE_INTENTS = {
    "gtm_framework": "positioning_validation",   # Tests ICP/offer hypothesis
    "teach": "inbound_authority",                 # Builds familiarity for future outbound
    "hook": "reach_amplification",               # Broad reach, top-of-funnel
    "case_study": "proof_building",              # Social proof for conversion
    "story": "personal_trust",                   # Builds founder credibility
    "flex": "social_proof",                      # Results proof
}

# Accounts to suppress (own account / noise)
SUPPRESSED_NAMES = {
    "mike holownych", "ai syndicate", "startup spotlight canada",
    "mike h", "nebula components",
}

# Import lead_manager from parent
sys.path.insert(0, str(BASE))
import lead_manager

# ─── ENGAGER QUALITY SCORING ──────────────────────────────────────
HIGH_VALUE_KEYWORDS = [
    "founder", "ceo", "cto", "head of", "vp of", "president",
    "landing page", "conversion", "cpa", "ad spend", "roas",
    "growth", "marketing", "demand gen", "revenue",
]

BOUNCE_KEYWORDS = [
    "recruiter", "student", "intern", "freelance writer",
    "looking for work", "open to work",
]

def score_engager(profile):
    """Score a profile for lead value (0-10)."""
    headline = (profile.get("headline") or "").lower()
    name = (profile.get("name") or "").lower()
    text = f"{headline} {name}"

    score = 5  # base
    for kw in HIGH_VALUE_KEYWORDS:
        if kw in text:
            score += 1
    for kw in BOUNCE_KEYWORDS:
        if kw in text:
            score -= 2
    return max(0, min(10, score))


# ─── SYNTHETIC CONTENT FIREWALL (TrustOS Forensic AI Research method) ─────────
# Filters comments before treating them as buying signals.
# Returns (passes: bool, reason: str)

_FORBIDDEN_VOCAB = {
    "leverage", "harness", "unleash", "unlock", "unveil", "delve", "deep dive",
    "underscore", "navigate", "elevate", "supercharge", "synergy",
    "game-changing", "transformative", "innovative", "cutting-edge", "revolutionary",
    "robust", "seamless", "holistic", "meticulous", "pivotal", "crucial", "vital",
    "nuanced", "multifaceted", "comprehensive", "a testament to",
    "in today's fast-paced world", "in the ever-evolving landscape",
    "it is important to note", "a key takeaway is", "that being said",
    "furthermore", "moreover", "additionally", "therefore", "thus", "consequently",
    "notably", "tapestry", "symphony", "realm", "embark", "evoke", "illuminate",
    "whisper", "echo", "journey",
}

_VENDOR_CAMOUFLAGE_PHRASES = [
    "how i used to", "i used to struggle", "i solved this by", "that's why i built",
    "check out my", "book a call", "link in bio", "dm me", "our tool",
    "this highlights the need", "this underscores the importance",
]

_ACTIVE_SUFFERING_SIGNALS = [
    "help", "rant", "drowning", "is this normal", "what am i doing wrong",
    "no conversions", "barely any", "zero sales", "doesn't convert", "won't convert",
    "wasting money", "burning money", "no idea what's broken", "landing page sucks",
    "ads not working", "clicks but no", "spent and got nothing",
]

def passes_content_firewall(comment: str) -> tuple:
    """
    Forensic AI Research Synthetic Content Firewall.
    Returns (True, 'active_suffering') if comment shows real buying pain.
    Returns (False, reason) if comment is AI-generated, vendor-disguised, or generic.
    """
    text = (comment or "").lower()
    if not text.strip():
        return False, "empty"

    # Reject vendor camouflage
    for phrase in _VENDOR_CAMOUFLAGE_PHRASES:
        if phrase in text:
            return False, f"vendor_camouflage:{phrase}"

    # Reject forbidden vocabulary (AI / marketing signatures)
    for word in _FORBIDDEN_VOCAB:
        if word in text:
            return False, f"ai_vocab:{word}"

    # Reject "not X, but Y" antithesis structure (AI tell)
    import re
    if re.search(r"\bnot\b.{1,40}\bbut\b", text):
        return False, "antithesis_structure"

    # Require active suffering signal for HIGH classification
    has_signal = any(sig in text for sig in _ACTIVE_SUFFERING_SIGNALS)
    if has_signal:
        return True, "active_suffering"

    # Neutral — not AI spam but not buying signal either
    return True, "neutral"


def load_state():
    """Load state from previous run."""
    if MONITOR_STATE.exists():
        return json.loads(MONITOR_STATE.read_text())
    return {"seen_comments": [], "seen_likes": [], "last_run": None}


def save_state(state):
    """Persist state."""
    MONITOR_STATE.write_text(json.dumps(state, indent=2, sort_keys=True))


def normalize_engager(row):
    """Normalize Apify output to standard shape."""
    return {
        "name": row.get("authorName") or row.get("name") or row.get("fullName") or "",
        "profile_url": (
            row.get("authorProfileUrl") or row.get("profileUrl")
            or row.get("profile_url") or row.get("url_profile") or ""
        ),
        "headline": (
            row.get("authorHeadline") or row.get("headline")
            or row.get("tagline") or row.get("subtitle") or ""
        ),
        "comment": (
            row.get("commentText") or row.get("text") or row.get("comment")
            or row.get("Content") or ""
        ),
        "timestamp": (
            row.get("timestamp") or row.get("date") or row.get("createdAt")
            or row.get("Datetime") or ""
        ),
        "type": row.get("type") or "commenter",
        "source_url": row.get("sourceUrl") or "",
        "post_link": (
            row.get("post_Link") or row.get("postLink") or row.get("postUrl") or ""
        ),
    }


def run_apify_actor(actor, input_file):
    """Run an Apify actor and return the dataset results."""
    cmd = ["apify", "actors", "call", actor, "--input-file", str(input_file), "--json"]
    proc = subprocess.run(cmd, cwd=BASE, text=True, capture_output=True, timeout=900)
    if proc.returncode != 0:
        print(f"[WARN] Actor failed: {actor}")
        print(proc.stderr[:500])
        return []

    run_info = json.loads(proc.stdout.strip() or "{}")

    # Extract dataset ID
    dataset_id = None
    if isinstance(run_info, dict):
        dataset_id = run_info.get("defaultDatasetId")
        if not dataset_id and isinstance(run_info.get("data"), dict):
            dataset_id = run_info["data"].get("defaultDatasetId")
        if not dataset_id and isinstance(run_info.get("storage"), dict):
            dataset_id = run_info["storage"].get("defaultDatasetId")
        if not dataset_id and isinstance(run_info.get("run"), dict):
            # Dig into nested run info
            storage = run_info.get("storage") or {}
            dataset_id = storage.get("defaultDatasetId")

    if not dataset_id:
        print(f"[WARN] No dataset ID from actor {actor}")
        return []

    # Fetch results
    import urllib.request
    token = ""
    secret = Path.home() / ".hermes" / "secrets" / "apify.key"
    if secret.exists():
        token = secret.read_text().strip()
    if not token:
        print("[WARN] No Apify token found")
        return []

    req = urllib.request.Request(
        f"https://api.apify.com/v2/datasets/{dataset_id}/items?clean=true&format=json",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


def load_cached_results(kind):
    """Fall back to the latest cached Apify results on disk."""
    cache_file = RAW_DIR / f"post_engagers_{kind}_latest.json"
    if cache_file.exists():
        try:
            return json.loads(cache_file.read_text())
        except Exception:
            pass
    return []


def check_for_new_engagers():
    """Main function — check for new engagers and report."""
    state = load_state()
    state["last_run"] = datetime.datetime.utcnow().isoformat() + "Z"
    new_engagers = []

    # ── Check commenters ──────────────────────────────────────────
    commenter_input = INPUT_DIR / "post_engagers_commenters.json"
    if commenter_input.exists():
        print("[MONITOR] Fetching commenters...")
        results = []
        try:
            results = run_apify_actor(
                "scraping_solutions/linkedin-posts-engagers-likers-and-commenters-no-cookies",
                commenter_input,
            )
        except Exception as e:
            print(f"[MONITOR] Commenter fetch error: {e}")
        if not results:
            print("[MONITOR] No live commenter results — using cached data.")
            results = load_cached_results("commenters")

        seen = set(state.get("seen_comments", []))
        for row in results:
            eng = normalize_engager(row)
            profile_url = eng["profile_url"].strip()
            name = eng["name"].strip()
            if not profile_url and not name:
                continue
            # Suppress owned/noise accounts
            if name.lower() in SUPPRESSED_NAMES:
                continue
            key = profile_url or name
            if key in seen:
                continue
            seen.add(key)

            score = score_engager(eng)
            is_actionable = bool(eng["comment"].strip())

            # Determine content attribution
            post_link = eng.get("post_link", "")
            content_angle = POST_ANGLES.get(post_link, "teach")

            new_engagers.append({
                **eng,
                "score": score,
                "actionable": is_actionable,
                "discovered_at": state["last_run"],
                "content_angle": content_angle,
            })

            # Log to lead_manager with attribution
            if eng["profile_url"]:
                lead_manager.upsert_lead(
                    email=f"linkedin_{eng['profile_url'].split('/in/')[-1].split('/')[0]}@placeholder.nebula",
                    stage="lead_warm" if score >= 7 else "lead_free_kit",
                    source="linkedin_post_comment",
                    name=name,
                    content_post_url=post_link or None,
                    content_angle=content_angle,
                )

        state["seen_comments"] = list(seen)

    # ── Check likers ──────────────────────────────────────────────
    liker_input = INPUT_DIR / "post_engagers_likers.json"
    if liker_input.exists():
        print("[MONITOR] Fetching likers...")
        results = []
        try:
            results = run_apify_actor(
                "scraping_solutions/linkedin-posts-engagers-likers-and-commenters-no-cookies",
                liker_input,
            )
        except Exception as e:
            print(f"[MONITOR] Liker fetch error: {e}")
        if not results:
            print("[MONITOR] No live liker results — using cached data.")
            results = load_cached_results("likers")

        seen = set(state.get("seen_likes", []))
        for row in results:
            eng = normalize_engager(row)
            profile_url = eng["profile_url"].strip()
            name = eng["name"].strip()
            if not profile_url and not name:
                continue
            # Suppress owned/noise accounts
            if name.lower() in SUPPRESSED_NAMES:
                continue
            key = profile_url or name
            if key in seen:
                continue
            seen.add(key)

            score = score_engager(eng)

            # Determine content attribution
            post_link = eng.get("post_link", "")
            content_angle = POST_ANGLES.get(post_link, "teach")

            new_engagers.append({
                **eng,
                "score": score,
                "actionable": False,
                "discovered_at": state["last_run"],
                "content_angle": content_angle,
            })

            # Likers = cooler, score at lead_free_kit unless hot
            if score >= 8:
                lead_manager.upsert_lead(
                    email=f"linkedin_{eng['profile_url'].split('/in/')[-1].split('/')[0]}@placeholder.nebula",
                    stage="lead_warm",
                    source="linkedin_post_like",
                    name=name,
                    content_post_url=post_link or None,
                    content_angle=content_angle,
                )
            elif eng["profile_url"]:
                lead_manager.upsert_lead(
                    email=f"linkedin_{eng['profile_url'].split('/in/')[-1].split('/')[0]}@placeholder.nebula",
                    stage="lead_free_kit",
                    source="linkedin_post_like",
                    name=name,
                    content_post_url=post_link or None,
                    content_angle=content_angle,
                )

        state["seen_likes"] = list(seen)

    save_state(state)

    # ── Summary ───────────────────────────────────────────────────
    if new_engagers:
        actionable = [e for e in new_engagers if e["actionable"]]
        high_value = [e for e in new_engagers if e["score"] >= 7]

        print(f"\n{'='*60}")
        print(f"NEW ENGAGERS FOUND: {len(new_engagers)}")
        print(f"  Comments (actionable): {len(actionable)}")
        print(f"  High-value (score >=7): {len(high_value)}")
        print(f"{'='*60}")

        for e in high_value:
            intent = GTM_ANGLE_INTENTS.get(e.get("content_angle", "teach"), "unknown")
            print(f"\n  ⭐ {e['name']} ({e.get('headline','')[:60]})")
            print(f"     Score: {e['score']}/10 | GTM intent: {intent} | {e['profile_url']}")
            if e.get("comment"):
                print(f"     Comment: {e['comment'][:200]}")

        if actionable:
            print(f"\n  --- PRIORITY ENGAGEMENTS ({len(actionable)}) ---")
            for e in actionable:
                print(f"  ▶ Reply to {e['name']}:")
                print(f"     \"{e['comment'][:200]}\"")
    else:
        print(f"[MONITOR] No new engagers since last check.")

    return new_engagers


if __name__ == "__main__":
    results = check_for_new_engagers()
    # Output JSON for cron consumption
    summary = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "new_engagers": len(results),
        "actionable": len([e for e in results if e["actionable"]]),
        "high_value": len([e for e in results if e["score"] >= 7]),
    }
    print(f"\n---SUMMARY---\n{json.dumps(summary)}")
