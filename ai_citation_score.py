#!/usr/bin/env python3
"""
AI Citation Score — measures how discoverable Nebula is to AI models.

Ameer Asghar's insight: "Winning = being the name the model recommends."
AI models (ChatGPT, Claude, Gemini) prioritize sites with:
  1. Structured data (JSON-LD) — machine-parseable business info
  2. Clear Q&A content — answer specific questions directly
  3. Citations from sources AI trusts — referenced elsewhere
  4. Author/Publisher authority — who wrote it matters
  5. Fresh content — recency signal

Usage:
  python3 ai_citation_score.py              # Score all local HTML pages
  python3 ai_citation_score.py --all        # Score + generate recommendations
  python3 ai_citation_score.py --fix        # Auto-add JSON-LD to pages missing it
"""

import os
import re
import json
import datetime

NEBULA_DIR = "/home/mike/nebula"
SCORE_DIR = os.path.join(NEBULA_DIR, "docs")


def score_page(filepath):
    """Score a single HTML page for AI citation readiness (0-100).
    
    Weighting:
      - Structured data (JSON-LD): 30 points
      - Meta tags (title, description, OG): 20 points
      - Content quality (word count, headings): 20 points
      - Author/Publisher signals: 15 points
      - Technical signals (canonical, freshness): 15 points
    """
    try:
        with open(filepath, "r") as f:
            html = f.read()
    except (OSError, IOError):
        return {"file": filepath, "error": "Cannot read", "score": 0}
    
    filename = os.path.basename(filepath)
    html_lower = html.lower()
    
    # 1. Structured data (JSON-LD) — 30 points
    ld_score = 0
    ld_count = html.count('application/ld+json')
    if ld_count > 0:
        ld_score = min(30, 15 + (ld_count * 5))
        # Bonus for having @type Organization or WebSite or Product
        if '"@type"' in html and ('"Organization"' in html or '"WebSite"' in html or '"Product"' in html):
            ld_score = 30
    elif html.count('itemscope') > 0 or html.count('itemprop') > 0:
        ld_score = 10  # Microdata instead of JSON-LD
    
    # 2. Meta tags — 20 points
    meta_score = 0
    has_desc = bool(re.search(r'<meta\s+name="description"', html_lower))
    has_title = bool(re.search(r'<title>', html_lower))
    has_og_title = bool(re.search(r'<meta\s+property="og:title"', html_lower))
    has_og_desc = bool(re.search(r'<meta\s+property="og:description"', html_lower))
    has_og_url = bool(re.search(r'<meta\s+property="og:url"', html_lower))
    has_canonical = bool(re.search(r'<link\s+rel="canonical"', html_lower))
    
    if has_title: meta_score += 4
    if has_desc: meta_score += 4
    if has_og_title: meta_score += 3
    if has_og_desc: meta_score += 3
    if has_og_url: meta_score += 3
    if has_canonical: meta_score += 3
    
    # 3. Content quality — 20 points
    content_score = 0
    # Word count (estimated)
    text_only = re.sub(r'<[^>]+>', ' ', html)
    words = len(text_only.split())
    if words > 300: content_score += 5
    elif words > 100: content_score += 3
    else: content_score += 1
    
    # Has H1
    if re.search(r'<h1[^>]*>', html_lower): content_score += 4
    # Has H2s
    h2_count = len(re.findall(r'<h2[^>]*>', html_lower))
    content_score += min(4, h2_count)
    # Has structured lists or tables
    if html.count('<li>') > 3: content_score += 3
    if html.count('<table') > 0: content_score += 2
    # Has a code block or pre
    if '<code>' in html_lower or '<pre>' in html_lower: content_score += 2
    
    # 4. Author/Publisher signals — 15 points
    author_score = 0
    if 'publisher' in html_lower: author_score += 4
    if 'author' in html_lower: author_score += 4
    if 'organization' in html_lower or '"name"' in html_lower: author_score += 4
    if 'about' in html_lower or 'faq' in html_lower: author_score += 3
    
    # 5. Technical signals — 15 points
    tech_score = 0
    if has_canonical: tech_score += 4
    if 'https://' in html: tech_score += 3  # SSL
    if html.count('lastmod') > 0 or html.count('date') > 0: tech_score += 4
    # Responseiveness / viewport
    if 'viewport' in html_lower: tech_score += 4
    
    total = ld_score + meta_score + content_score + author_score + tech_score
    
    # Grade
    if total >= 80: grade = "A"
    elif total >= 65: grade = "B"
    elif total >= 50: grade = "C"
    elif total >= 35: grade = "D"
    else: grade = "F"
    
    return {
        "file": filename,
        "score": total,
        "grade": grade,
        "breakdown": {
            "structured_data": {"score": ld_score, "max": 30, "has_json_ld": ld_count > 0},
            "meta_tags": {"score": meta_score, "max": 20},
            "content_quality": {"score": content_score, "max": 20},
            "author_signals": {"score": author_score, "max": 15},
            "technical": {"score": tech_score, "max": 15},
        },
        "missing": _find_missing(filename, html_lower, ld_count),
    }


def _find_missing(filename, html, ld_count):
    """Identify what's missing for AI citation."""
    missing = []
    
    # Page-specific recommendations
    critical_pages = {
        "index.html": ["Organization schema", "WebSite schema"],
        "checkout.html": ["Product schema"],
        "audit.html": ["WebApplication schema"],
        "beta-tester.html": ["Product or Service schema"],
    }
    
    if ld_count == 0:
        if filename in critical_pages:
            missing.extend(critical_pages[filename])
        else:
            missing.append("JSON-LD structured data")
    
    if 'name="description"' not in html:
        missing.append("meta description")
    
    if 'property="og:title"' not in html:
        missing.append("OG title")
    
    if 'property="og:description"' not in html:
        missing.append("OG description")
    
    if 'rel="canonical"' not in html:
        missing.append("canonical URL")
    
    if '<h1' not in html:
        missing.append("H1 heading")
    
    if '<h2' not in html:
        missing.append("H2 subheadings")
    
    return missing


def generate_report(pages):
    """Generate full AI citation report."""
    scores = [p["score"] for p in pages if "score" in p]
    avg = sum(scores) / len(scores) if scores else 0
    grades = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    for p in pages:
        g = p.get("grade", "F")
        grades[g] = grades.get(g, 0) + 1
    
    # Find top gaps
    all_missing = {}
    for p in pages:
        for m in p.get("missing", []):
            all_missing[m] = all_missing.get(m, 0) + 1
    top_gaps = sorted(all_missing.items(), key=lambda x: -x[1])[:10]
    
    return {
        "summary": {
            "total_pages_scored": len(pages),
            "average_score": round(avg, 1),
            "grade_distribution": grades,
        },
        "top_citation_gaps": top_gaps,
        "pages": sorted(pages, key=lambda x: x.get("score", 0)),
        "recommendations": _generate_recommendations(pages, top_gaps),
    }


def _generate_recommendations(pages, top_gaps):
    """Generate actionable AI citation recommendations."""
    recs = []
    
    # Check for JSON-LD coverage
    pages_with_ld = sum(1 for p in pages if p.get("breakdown", {}).get("structured_data", {}).get("has_json_ld", False))
    if pages_with_ld < len(pages):
        missing_count = len(pages) - pages_with_ld
        recs.append({
            "priority": "HIGH",
            "action": f"Add JSON-LD structured data to {missing_count} page(s) lacking it",
            "impact": "AI models parse structured data to understand your business — without it you're invisible",
            "pages_missing": [p["file"] for p in pages if not p.get("breakdown", {}).get("structured_data", {}).get("has_json_ld", False)],
        })
    
    # Check for missing critical schema types
    critical_schema = {
        "index.html": "Organization + WebSite",
        "checkout.html": "Product",
        "audit.html": "WebApplication",
        "beta-tester.html": "Service/Product",
    }
    for filename, schema_types in critical_schema.items():
        page = next((p for p in pages if p["file"] == filename), None)
        if page and not page.get("breakdown", {}).get("structured_data", {}).get("has_json_ld", False):
            recs.append({
                "priority": "HIGH" if filename == "index.html" else "MEDIUM",
                "action": f"Add {schema_types} schema to {filename}",
                "impact": f"Critical for AI models to identify Nebula as a {schema_types.split('+')[0].strip()}",
            })
    
    # Meta tags
    pages_no_canonical = [p["file"] for p in pages if "canonical URL" in p.get("missing", [])]
    if pages_no_canonical:
        recs.append({
            "priority": "MEDIUM",
            "action": f"Add canonical URLs to {len(pages_no_canonical)} page(s)",
            "impact": "Prevents duplicate content confusion for AI models",
            "pages_missing": pages_no_canonical[:5],
        })
    
    # Content recommendations for AI citation
    recs.append({
        "priority": "MEDIUM",
        "action": "Publish a 'What is a landing page audit?' definitive guide",
        "impact": "When ChatGPT answers 'how to audit a landing page', Nebula needs to be the cited source",
    })
    
    recs.append({
        "priority": "LOW",
        "action": "Get cited by AI-trusted sources (builtwith, g2, producthunt, dev.to, medium)",
        "impact": "AI models weight citations from sources they already trust",
    })
    
    recs.append({
        "priority": "LOW",
        "action": "Add FAQ schema for common questions AI models answer",
        "impact": "FAQ rich results appear in Google + AI training data",
    })
    
    return recs


def scan_all():
    """Score all HTML pages in the Nebula directory."""
    html_files = [f for f in os.listdir(NEBULA_DIR) if f.endswith(".html")]
    pages = []
    for f in sorted(html_files):
        filepath = os.path.join(NEBULA_DIR, f)
        result = score_page(filepath)
        pages.append(result)
    return generate_report(pages)


if __name__ == "__main__":
    import sys
    
    if "--fix" in sys.argv:
        print("Auto-fix mode: Add JSON-LD to pages missing it")
        # This would auto-generate and inject JSON-LD
        # For now, just show what needs fixing
        report = scan_all()
        for rec in report["recommendations"]:
            if "Add JSON-LD" in rec["action"]:
                print(f"  [{rec['priority']}] {rec['action']}")
                for p in rec.get("pages_missing", [])[:5]:
                    print(f"    - {p}")
        print()
        print("Auto-fix ready. Run without --fix for full report.")
        sys.exit(0)
    
    report = scan_all()
    print(f"AI Citation Score Report — {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"={'='*60}")
    print(f"Total pages: {report['summary']['total_pages_scored']}")
    print(f"Average score: {report['summary']['average_score']}/100")
    print(f"Grade distribution: {report['summary']['grade_distribution']}")
    print()
    
    print("Top Citation Gaps:")
    for gap, count in report["top_citation_gaps"][:8]:
        bar = "█" * count + "░" * (15 - count)
        print(f"  {bar} {gap} ({count} pages)")
    print()
    
    print("Recommendations:")
    for rec in report["recommendations"]:
        print(f"  [{rec['priority']}] {rec['action']}")
        print(f"       {rec['impact']}")
    print()
    
    print("Page Scores (worst → best):")
    for p in report["pages"]:
        bar = "█" * (p["score"] // 5) + "░" * (20 - p["score"] // 5)
        print(f"  {bar} {p['score']:3d}/100 {p['grade']} {p['file']}")
    
    if "--all" in sys.argv:
        print()
        print("Detailed Breakdown:")
        for p in report["pages"]:
            if p["missing"]:
                print(f"\n{p['file']} ({p['grade']}, {p['score']}/100):")
                for m in p["missing"][:5]:
                    print(f"  ❌ {m}")
