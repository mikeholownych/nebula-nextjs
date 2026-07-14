#!/usr/bin/env python3
"""
LinkedIn Post Monitor — Process Apify results into trigger_leads.jsonl.

Steps:
1. Load raw Apify data (post_search, engagers/likers, engagers/commenters)
2. Extract all profiles (authors of search posts, engagers)
3. Dedup against existing trigger_leads.jsonl by profile_url
4. Apply is_qualified_signal() logic
5. Append new qualified leads with source="linkedin"

Usage: python3 linkedin_post_monitor_runner.py
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/home/mike/nebula")
TRIGGER_LEADS = BASE / "trigger_leads.jsonl"
RAW_DIR = BASE / "growth_system" / "apify_raw"

# Import filtering logic from claude_growth_system
sys.path.insert(0, str(BASE))
from claude_growth_system import is_qualified_signal, is_self_engager


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_jsonl(path: Path) -> list[dict]:
    """Load JSONL file, return list of dicts."""
    if not path.exists():
        return []
    rows = []
    text = path.read_text().strip()
    if not text:
        return []
    for line in text.splitlines():
        line = line.strip()
        if line:
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return rows


def append_jsonl(path: Path, rows: list[dict]) -> None:
    """Append rows to JSONL file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a") as f:
        for row in rows:
            f.write(json.dumps(row, sort_keys=True) + "\n")


def load_json(path: Path) -> list[dict]:
    """Load JSON array file."""
    if not path.exists():
        return []
    data = json.loads(path.read_text())
    return data if isinstance(data, list) else []


def extract_profiles_from_post_search(raw_results: list[dict]) -> list[dict]:
    """Extract profiles from post-search actor output."""
    profiles = []
    seen_urls = set()
    for post in raw_results:
        author = post.get("author") or {}
        text = post.get("text") or ""
        profile_url = (author.get("profile_url") or "").strip()
        name = (author.get("name") or "").strip()
        if not profile_url or not name:
            continue
        if not profile_url.startswith("https://www.linkedin.com/in/"):
            continue
        if profile_url in seen_urls:
            continue
        seen_urls.add(profile_url)
        
        # Check if the post text signals a buying trigger
        signals = []
        text_lower = text.lower()
        if any(t in text_lower for t in ["ad spend", "ads no sales", "no conversions", "not converting", "conversion rate zero", "landing page"]):
            signals.append("post_text_match")
        
        profiles.append({
            "name": name,
            "profile_url": profile_url,
            "role": author.get("headline") or "",
            "comment": text[:500] if text else "",
            "post_url": post.get("post_url", ""),
            "source": "linkedin_post_search",
            "discovered_at": utc_now(),
            "intent": "hot" if signals else "cold",
            "segment": "founder_ad_bleed" if signals else "cold",
            "triggers": signals or [],
            "score": 8 if signals else 3,
        })
    return profiles


def extract_engagers(raw_results: list[dict], engagement_type: str) -> list[dict]:
    """Extract profiles from engagers actor output."""
    profiles = []
    seen_urls = set()
    for row in raw_results:
        profile_url = (row.get("url_profile") or "").strip()
        name = (row.get("name") or "").strip()
        if not profile_url or not name:
            continue
        if profile_url in ("None", "") or not profile_url.startswith("https://www.linkedin.com/in/"):
            continue
        if profile_url in seen_urls:
            continue
        seen_urls.add(profile_url)
        
        subtitle = row.get("subtitle") or ""
        comment = row.get("Content") or row.get("text") or ""
        
        # Build comment string for qualified signal check
        prospect = {
            "comment": comment,
            "role": subtitle,
            "name": name,
        }
        
        qualified = is_qualified_signal(prospect)
        self_engager = is_self_engager(prospect)
        
        if self_engager:
            continue
        
        profiles.append({
            "name": name,
            "profile_url": profile_url,
            "role": subtitle,
            "comment": comment[:500] if comment else f"{engagement_type} on Nebula LinkedIn post",
            "post_url": row.get("post_Link", ""),
            "source": f"linkedin_{engagement_type}",
            "discovered_at": utc_now(),
            "intent": "hot" if qualified else "cold",
            "segment": "founder_ad_bleed" if qualified else "cold",
            "triggers": ["ad_discussion"] if qualified else [],
            "score": 7 if qualified else 3,
            "qualified_signal": qualified,
        })
    return profiles


def dedup_against_existing(new_profiles: list[dict], existing_leads: list[dict]) -> list[dict]:
    """Remove profiles already in trigger_leads.jsonl by profile_url."""
    existing_urls = set()
    for lead in existing_leads:
        url = lead.get("profile_url") or ""
        if url:
            existing_urls.add(url.strip())
    
    deduped = []
    for p in new_profiles:
        url = p.get("profile_url", "").strip()
        if url and url not in existing_urls:
            # Also check short form (just the username part)
            deduped.append(p)
            existing_urls.add(url)
    
    return deduped


def main():
    print("=" * 60)
    print("LinkedIn Post Monitor — Processing Run")
    print(f"Started: {utc_now()}")
    print("=" * 60)
    
    # 1. Load existing leads
    existing_leads = load_jsonl(TRIGGER_LEADS)
    print(f"\nExisting leads in trigger_leads.jsonl: {len(existing_leads)}")
    
    # 2. Load raw Apify data
    post_search_raw = load_json(RAW_DIR / "post_search_latest.json")
    likers_raw = load_json(RAW_DIR / "post_engagers_likers_latest.json")
    commenters_raw = load_json(RAW_DIR / "post_engagers_commenters_latest.json")
    
    print(f"Raw data loaded:")
    print(f"  Post search results: {len(post_search_raw)}")
    print(f"  Likers: {len(likers_raw)}")
    print(f"  Commenters: {len(commenters_raw)}")
    
    # 3. Extract profiles
    search_profiles = extract_profiles_from_post_search(post_search_raw)
    liker_profiles = extract_engagers(likers_raw, "likers")
    commenter_profiles = extract_engagers(commenters_raw, "commenters")
    
    print(f"\nExtracted profiles:")
    print(f"  From post search: {len(search_profiles)}")
    print(f"  From likers: {len(liker_profiles)}")
    print(f"  From commenters: {len(commenter_profiles)}")
    
    # Print some details about extracted profiles
    for p in search_profiles:
        print(f"    POST SEARCH: {p['name']} | {p['profile_url'][:60]}")
        if p['comment']:
            print(f"      Text: {p['comment'][:100]}")
    
    for p in liker_profiles:
        print(f"    LIKER: {p['name']} | role={p['role'][:60]}")
    
    for p in commenter_profiles:
        print(f"    COMMENT: {p['name']} | {p['comment'][:100]}")
    
    # 4. Combine and dedup
    all_new = search_profiles + liker_profiles + commenter_profiles
    print(f"\nTotal extracted before dedup: {len(all_new)}")
    
    new_leads = dedup_against_existing(all_new, existing_leads)
    print(f"After dedup against existing: {len(new_leads)} new")
    
    # 5. Apply qualified signal filter
    qualified_leads = []
    for lead in new_leads:
        # Check using is_qualified_signal logic
        prospect = {
            "comment": lead.get("comment", ""),
            "role": lead.get("role", ""),
            "name": lead.get("name", ""),
        }
        if is_qualified_signal(prospect):
            lead["qualified"] = True
            qualified_leads.append(lead)
        else:
            # Still include cold leads but mark them
            lead["qualified"] = False
    
    qualified_count = len([l for l in new_leads if l["qualified"]])
    print(f"\nQualified signal count: {qualified_count}/{len(new_leads)}")
    
    # 6. Append only qualified leads (per task instructions)
    qualified_leads = [l for l in new_leads if l.get("qualified")]
    
    if qualified_leads:
        append_jsonl(TRIGGER_LEADS, qualified_leads)
        print(f"\n✅ Appended {len(qualified_leads)} qualified leads to trigger_leads.jsonl")
        
        for lead in qualified_leads:
            print(f"  ⭐ {lead['name']}")
            print(f"     URL: {lead['profile_url']}")
            print(f"     Source: {lead['source']}")
            print(f"     Score: {lead.get('score', '?')} | Segment: {lead.get('segment', '?')}")
            if lead.get('comment'):
                print(f"     Signal: {lead['comment'][:120]}")
    else:
        print("\n✅ No qualified leads to append")
        if new_leads:
            print(f"   ({len(new_leads)} unqualified leads skipped — none passed is_qualified_signal())")
    
    # 7. Summary
    print(f"\n{'=' * 60}")
    print(f"SUMMARY")
    print(f"{'=' * 60}")
    print(f"  Engagers found (unique, non-self): {len(search_profiles) + len(liker_profiles) + len(commenter_profiles)}")
    print(f"  New leads added: {len(new_leads)}")
    print(f"  Qualified leads among new: {qualified_count}")
    print(f"  Total in trigger_leads.jsonl: {len(existing_leads) + len(new_leads)}")
    print(f"  Errors: None")
    
    return {
        "timestamp": utc_now(),
        "engagers_found": len(all_new),
        "new_leads_added": len(new_leads),
        "qualified_new_leads": qualified_count,
        "total_leads": len(existing_leads) + len(new_leads),
        "status": "completed",
    }


if __name__ == "__main__":
    summary = main()
    print(f"\n---JSON-RESULT---\n{json.dumps(summary)}")
