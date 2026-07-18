#!/usr/bin/env python3
"""
generate_content_briefs.py — Auto-generate LinkedIn + Medium briefs from findings

Usage:
    python3 scripts/generate_content_briefs.py --finding "Your headline is visible. Most founders don't know it's their biggest leak." --track headline-clarity
    python3 scripts/generate_content_briefs.py --input idea_bank.json --limit 3

Output:
    - LinkedIn brief (hook + insight + proof + CTA)
    - Medium outline (headline + sections + examples)
"""

import json
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

BASE = Path("/home/mike/nebula")
OUTPUT_DIR = BASE / "content_queue"
HOOK_LIBRARY_PATH = BASE / "docs" / "hook_library.md"


def load_hook_library() -> dict:
    """Load hook library by category."""
    if not HOOK_LIBRARY_PATH.exists():
        return {}
    
    content = HOOK_LIBRARY_PATH.read_text()
    
    # Parse by category
    hooks_by_category = {}
    current_category = None
    
    for line in content.split("\n"):
        if line.startswith("## Category"):
            current_category = line.replace("## ", "").strip()
            hooks_by_category[current_category] = []
        elif current_category and line.startswith('"'):
            # Extract hook text
            hook_text = line.strip()
            if hook_text:
                hooks_by_category[current_category].append(hook_text)
    
    return hooks_by_category


def pick_hooks_for_track(track: str, hook_library: dict) -> list:
    """Pick relevant hooks for a track."""
    
    track_to_category = {
        "headline-clarity": "Category 1: Problem Revelation Hooks",
        "cta-friction": "Category 2: Audit Finding Hooks",
        "message-match": "Category 4: Counter-Intuitive Hooks",
        "social-proof": "Category 5: Teardown Hooks",
    }
    
    category = track_to_category.get(track, "Category 1: Problem Revelation Hooks")
    return hook_library.get(category, [])[:5]


def generate_linkedin_brief(finding: str, track: str, hook_library: dict) -> dict:
    """Generate LinkedIn brief from finding."""
    
    # Pick hooks
    hooks = pick_hooks_for_track(track, hook_library)
    
    # Generate brief
    brief = {
        "platform": "linkedin",
        "finding": finding,
        "track": track,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "brief": {
            "hook_variants": hooks[:5] if hooks else [
                "Your [X] is visible. Most founders don't know it's their biggest leak.",
                "I audited [N] pages. [X]% had the same problem.",
                "You spent [amount] on ads. Your [X] is costing you half.",
            ],
            "hook_checklist": [
                "Under 10 words",
                "Specific insight promised",
                "Not clickbait",
                "Connects to track",
                "Not repetitive with last 5 hooks",
            ],
            "structure": {
                "hook": "[First line — stop scroll]",
                "setup": "2-3 sentences why this matters",
                "insight": "3-5 sentences what audit data shows",
                "proof": "1 specific example or data point",
                "cta": "Comment AUDIT for free teardown",
            },
            "cta_type": "comment",
            "cta_text": "Comment 'AUDIT' and I'll send you a free landing page teardown.",
        },
    }
    
    return brief


def generate_medium_outline(finding: str, track: str) -> dict:
    """Generate Medium article outline from finding."""
    
    # Track to headline template
    headline_templates = {
        "headline-clarity": "Why 72% of Landing Pages Fail on the First Line",
        "cta-friction": "Your CTA Is Visible But Ignored: Here's Why",
        "message-match": "The Ad-to-Page Disconnect Bleeding Your Ad Spend",
        "social-proof": "How to Turn Decorative Testimonials into Evidence",
    }
    
    outline = {
        "platform": "medium",
        "finding": finding,
        "track": track,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "outline": {
            "headline": headline_templates.get(track, "The Hidden Problem Killing Your Conversions"),
            "structure": [
                {
                    "section": "Opening",
                    "length": "2-3 paragraphs",
                    "purpose": "Why this matters to founders",
                },
                {
                    "section": "The Leak",
                    "length": "3-4 paragraphs",
                    "purpose": "What audit data shows",
                },
                {
                    "section": "The Fix",
                    "length": "5-7 paragraphs",
                    "purpose": "Step-by-step methodology",
                    "steps": [
                        "Step 1: Identify the baseline",
                        "Step 2: Extract the buyer outcome",
                        "Step 3: Add specificity",
                        "Step 4: Test against ad promise",
                        "Step 5: Read aloud",
                    ],
                },
                {
                    "section": "The Evidence",
                    "length": "3-5 paragraphs",
                    "purpose": "Examples from audits",
                    "example_count": 3,
                },
                {
                    "section": "The Outcome",
                    "length": "2-3 paragraphs",
                    "purpose": "What changes when you apply this",
                },
                {
                    "section": "CTA",
                    "length": "1 paragraph",
                    "purpose": "Resource or next step",
                },
            ],
            "cta": {
                "link": "nebulacomponents.shop/audit",
                "utm": f"?utm_source=medium&utm_medium=article&utm_campaign={track}",
                "text": "Get your free audit → nebulacomponents.shop/audit",
            },
            "seo_keywords": [
                "landing page conversion",
                "headline optimization",
                "conversion rate optimization",
                "CRO best practices",
                track.replace("-", " "),
            ],
        },
    }
    
    return outline


def generate_briefs(
    finding: str,
    track: str,
    output_format: str = "both"
) -> dict:
    """Generate LinkedIn + Medium briefs."""
    
    # Load hook library
    hook_library = load_hook_library()
    
    result = {
        "finding": finding,
        "track": track,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    if output_format in ["linkedin", "both"]:
        result["linkedin_brief"] = generate_linkedin_brief(finding, track, hook_library)
    
    if output_format in ["medium", "both"]:
        result["medium_outline"] = generate_medium_outline(finding, track)
    
    return result


def save_briefs(briefs: dict, output_dir: Path = OUTPUT_DIR):
    """Save briefs to content queue."""
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save LinkedIn brief
    if "linkedin_brief" in briefs:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"linkedin_brief_{ts}.json"
        filepath = output_dir / filename
        filepath.write_text(json.dumps(briefs["linkedin_brief"], indent=2))
        print(f"✅ LinkedIn brief saved: {filepath}")
    
    # Save Medium outline
    if "medium_outline" in briefs:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"medium_outline_{ts}.json"
        filepath = output_dir / filename
        filepath.write_text(json.dumps(briefs["medium_outline"], indent=2))
        print(f"✅ Medium outline saved: {filepath}")


def print_briefs(briefs: dict):
    """Print formatted briefs."""
    
    print("\n" + "=" * 70)
    print("CONTENT BRIEFS")
    print(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    print("=" * 70)
    
    # LinkedIn
    if "linkedin_brief" in briefs:
        print("\n### LINKEDIN BRIEF ###\n")
        lb = briefs["linkedin_brief"]["brief"]
        print("HOOK VARIANTS:")
        for i, hook in enumerate(lb["hook_variants"][:5], 1):
            print(f"  {i}. {hook}")
        
        print("\nHOOK CHECKLIST:")
        for item in lb["hook_checklist"]:
            print(f"  □ {item}")
        
        print(f"\nSTRUCTURE:")
        print(f"  Hook: {lb['structure']['hook']}")
        print(f"  Setup: {lb['structure']['setup']}")
        print(f"  Insight: {lb['structure']['insight']}")
        print(f"  Proof: {lb['structure']['proof']}")
        print(f"  CTA: {lb['structure']['cta']}")
        
        print(f"\nCTA: {lb['cta_text']}")
    
    # Medium
    if "medium_outline" in briefs:
        print("\n### MEDIUM OUTLINE ###\n")
        mo = briefs["medium_outline"]["outline"]
        print(f"HEADLINE: {mo['headline']}\n")
        
        print("STRUCTURE:")
        for section in mo["structure"]:
            print(f"\n  [{section['section']}] ({section['length']})")
            print(f"  Purpose: {section['purpose']}")
            if "steps" in section:
                for step in section["steps"]:
                    print(f"    - {step}")
            if "example_count" in section:
                print(f"    Examples needed: {section['example_count']}")
        
        print(f"\nCTA: {mo['cta']['text']}")
        print(f"UTM: {mo['cta']['utm']}")
        
        print("\nSEO KEYWORDS:")
        for keyword in mo["seo_keywords"]:
            print(f"  - {keyword}")
    
    print("\n" + "=" * 70)


def batch_generate_from_idea_bank(input_path: Path, limit: int = 3) -> list:
    """Generate briefs from idea bank JSON."""
    
    if not input_path.exists():
        print(f"Idea bank not found: {input_path}")
        return []
    
    idea_bank = json.loads(input_path.read_text())
    ideas = idea_bank.get("ideas", [])[:limit]
    
    all_briefs = []
    for idea in ideas:
        finding = idea.get("finding", "")
        track = idea.get("problem", "headline-clarity")
        
        if finding:
            briefs = generate_briefs(finding, track)
            all_briefs.append(briefs)
            save_briefs(briefs)
    
    return all_briefs


# CLI
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate LinkedIn + Medium briefs from findings")
    parser.add_argument("--finding", type=str, help="Finding text to generate brief from")
    parser.add_argument("--track", type=str, default="headline-clarity", help="Track category")
    parser.add_argument("--input", type=Path, help="Idea bank JSON file")
    parser.add_argument("--limit", type=int, default=3, help="Max ideas to process")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR, help="Output directory")
    parser.add_argument("--format", choices=["linkedin", "medium", "both"], default="both")
    parser.add_argument("--quiet", action="store_true", help="Suppress printed output")
    
    args = parser.parse_args()
    
    if args.finding:
        # Single finding mode
        briefs = generate_briefs(args.finding, args.track, args.format)
        save_briefs(briefs, args.output)
        
        if not args.quiet:
            print_briefs(briefs)
    
    elif args.input:
        # Batch mode from idea bank
        all_briefs = batch_generate_from_idea_bank(args.input, args.limit)
        
        if not args.quiet:
            for briefs in all_briefs:
                print_briefs(briefs)
    
    else:
        # No input — show usage
        parser.print_help()
