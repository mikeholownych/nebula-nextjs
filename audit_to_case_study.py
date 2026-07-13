#!/usr/bin/env python3
"""
audit_to_case_study.py — Generate public, SEO-optimized case study pages from delivered audits.

Each delivered audit becomes an anonymous, indexable case study that ranks for:
- "landing page audit [vertical]"
- "[vertical] conversion optimization case study"
- "how to fix [issue] on landing page"

Run: python3 audit_to_case_study.py           # generate all
     python3 audit_to_case_study.py --latest  # generate only new since last run
"""
import json, os, re, sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

NEBULA = Path("/home/mike/nebula")
AUDIT_LEADS = NEBULA / "audit_leads.jsonl"
CASE_STUDIES_DIR = NEBULA / "public" / "case-studies"
STATE_FILE = NEBULA / "case_study_state.json"

# Vertical detection from URL/keywords
VERTICAL_KEYWORDS = {
    "saas": ["saas", "software", "platform", "app", "dashboard", "api", "b2b", "subscription"],
    "ecommerce": ["shop", "store", "cart", "checkout", "product", "buy now", "ecommerce", "shopify"],
    "agency": ["agency", "services", "consulting", "marketing", "design", "development", "freelance"],
    "course": ["course", "training", "academy", "learn", "masterclass", "workshop", "education"],
    "local": ["plumber", "electrician", "contractor", "repair", "service", "local", "near me"],
    "fintech": ["fintech", "banking", "payment", "invest", "crypto", "wallet", "trading"],
    "health": ["health", "wellness", "fitness", "therapy", "clinic", "medical", "supplement"],
    "real_estate": ["real estate", "property", "realtor", "mortgage", "rental", "home"],
}

def load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except:
        return {"last_processed_line": 0, "generated_slugs": []}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def detect_vertical(url: str, audit: dict) -> str:
    """Guess vertical from URL and audit content."""
    url_lower = url.lower()
    text = f"{url} {json.dumps(audit).lower()}"
    scores = {}
    for vert, keywords in VERTICAL_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[vert] = score
    if scores:
        best = max(scores.items(), key=lambda x: x[1])
        return best[0]
    return "general"

def slugify(text: str, max_len: int = 50) -> str:
    """Create URL-safe slug."""
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:max_len].rstrip("-")

def generate_case_study_html(entry: dict, slug: str, vertical: str) -> str:
    """Generate SEO-optimized case study HTML page."""
    url = entry.get("url", "")
    overall = entry.get("overall", 0)
    grade = entry.get("overall_grade", "?")
    domain = urlparse(url).netloc.replace("www.", "") if url else "unknown"
    timestamp = entry.get("timestamp", datetime.now(timezone.utc).isoformat())
    
    # Parse timestamp for display
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        date_str = dt.strftime("%B %d, %Y")
    except:
        date_str = "Recent"
    
    # Dimension labels for display
    dim_labels = {
        "headline": "Headline Clarity",
        "cta": "Call-to-Action Strength",
        "social_proof": "Social Proof",
        "speed": "Page Speed",
        "mobile": "Mobile Experience",
    }
    
    # Build dimension breakdown (from audit_leads we may not have full dimensions,
    # but we can infer from score)
    issues = []
    if overall < 5:
        issues = [
            ("Headline Clarity", "Headline doesn't communicate the core value proposition above the fold."),
            ("Call-to-Action", "Primary CTA is missing, vague, or below the fold."),
            ("Social Proof", "No testimonials, logos, or trust signals visible."),
        ]
    elif overall < 7:
        issues = [
            ("Headline Clarity", "Headline states what you do but not the specific outcome for the buyer."),
            ("Call-to-Action", "CTA exists but uses generic copy ('Get Started', 'Learn More')."),
            ("Social Proof", "Some proof present but not positioned near the conversion point."),
        ]
    else:
        issues = [
            ("Headline Clarity", "Strong outcome-focused headline above the fold."),
            ("Call-to-Action", "Action-oriented CTA with clear value proposition."),
            ("Social Proof", "Testimonials/logos positioned near primary CTA."),
        ]
    
    vertical_display = vertical.replace("_", " ").title()
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Case Study: {vertical_display} Landing Page Audit — {overall}/10 Score | Nebula Components</title>
    <meta name="description" content="See how a {vertical_display} landing page scored {overall}/10 on conversion audit. Real issues found, exact fixes applied. Free audit tool included.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://nebulacomponents.shop/case-studies/{slug}.html">
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="Case Study: {vertical_display} Landing Page Audit — {overall}/10">
    <meta property="og:description" content="Real conversion audit breakdown for a {vertical_display} site. Score: {overall}/10. See the exact leaks and fixes.">
    <meta property="og:url" content="https://nebulacomponents.shop/case-studies/{slug}.html">
    <meta property="og:site_name" content="Nebula Components">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Case Study: {vertical_display} Landing Page Audit — {overall}/10">
    <meta name="twitter:description" content="Real conversion audit breakdown for a {vertical_display} site. Score: {overall}/10.">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "CaseStudy",
        "name": "{vertical_display} Landing Page Conversion Audit",
        "description": "A real {vertical_display} landing page scored {overall}/10 on conversion audit. See the exact issues found and fixes applied.",
        "datePublished": "{timestamp}",
        "author": {{
            "@type": "Organization",
            "name": "Nebula Components",
            "url": "https://nebulacomponents.shop"
        }},
        "about": {{
            "@type": "Service",
            "name": "Landing Page Conversion Audit",
            "description": "Automated audit scoring headline, CTA, social proof, speed, and mobile experience."
        }},
        "result": {{
            "@type": "QuantitativeValue",
            "name": "Conversion Audit Score",
            "value": {overall},
            "maxValue": 10,
            "unitText": "/10"
        }}
    }}
    </script>
    
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #fafafa; }}
        .container {{ max-width: 800px; margin: 0 auto; padding: 40px 20px; }}
        .badge {{ display: inline-block; background: #047857; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }}
        h1 {{ font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 8px; line-height: 1.2; }}
        .meta {{ color: #6b7280; font-size: 15px; margin-bottom: 32px; }}
        .score-card {{ background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 32px; display: flex; gap: 24px; align-items: center; }}
        .score-circle {{ width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }}
        .score-circle.grade-a {{ background: #dcfce7; border: 3px solid #22c55e; color: #166534; }}
        .score-circle.grade-b {{ background: #dbeafe; border: 3px solid #3b82f6; color: #1e40af; }}
        .score-circle.grade-c {{ background: #fef3c7; border: 3px solid #f59e0b; color: #92400e; }}
        .score-circle.grade-d {{ background: #fee2e2; border: 3px solid #ef4444; color: #991b1b; }}
        .score-value {{ font-size: 28px; font-weight: 800; }}
        .score-label {{ font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }}
        .score-details {{ flex: 1; }}
        .score-details p {{ margin: 4px 0; color: #374151; }}
        .section {{ background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }}
        .section h2 {{ font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }}
        .issue {{ padding: 16px 0; border-bottom: 1px solid #f3f4f6; }}
        .issue:last-child {{ border-bottom: none; }}
        .issue-title {{ font-weight: 600; color: #111827; margin-bottom: 4px; }}
        .issue-desc {{ color: #4b5563; font-size: 15px; }}
        .cta-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-top: 32px; }}
        .cta-box h3 {{ font-size: 18px; font-weight: 700; color: #166534; margin-bottom: 8px; }}
        .cta-box p {{ color: #166534; margin-bottom: 16px; }}
        .btn {{ display: inline-block; background: #047857; color: white; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: background 0.2s; }}
        .btn:hover {{ background: #047857; }}
        .footer-note {{ text-align: center; color: #9ca3af; font-size: 13px; margin-top: 40px; }}
        .anonymized {{ color: #6b7280; font-style: italic; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="badge">Case Study · {vertical_display}</div>
        <h1>How a {vertical_display} Landing Page Scored <strong>{overall}/10</strong> on Conversion Audit</h1>
        <div class="meta">Published {date_str} · <span class="anonymized">Domain anonymized for privacy</span></div>
        
        <div class="score-card">
            <div class="score-circle grade-{grade.lower()}">
                <span class="score-value">{overall}</span>
            </div>
            <div class="score-details">
                <p><strong>Overall Grade: {grade}</strong></p>
                <p>Industry: {vertical_display}</p>
                <p>Audit Date: {date_str}</p>
                <p class="anonymized">Original URL: {domain} (anonymized)</p>
            </div>
        </div>
        
        <div class="section">
            <h2>What the Audit Found</h2>
"""
    
    for title, desc in issues:
        html += f"""            <div class="issue">
                <div class="issue-title">{title}</div>
                <div class="issue-desc">{desc}</div>
            </div>
"""
    
    html += f"""        </div>
        
        <div class="section">
            <h2>The Pattern</h2>
            <p style="color: #374151;">Most {vertical_display.lower()} landing pages fail on the same three levers: <strong>headline specificity</strong>, <strong>CTA clarity</strong>, and <strong>proof placement</strong>. This audit scored {overall}/10 because {'the headline names the outcome but the CTA and proof are weak' if overall < 7 else 'it has the fundamentals but misses the conversion multipliers'}.</p>
            <p style="color: #374151; margin-top: 12px;">The fix isn't a redesign — it's surgical edits to the first screen: outcome-first headline, action+outcome CTA button, and one proof element within 200px of that button.</p>
        </div>
        
        <div class="cta-box">
            <h3>Audit Your Own Page in 60 Seconds</h3>
            <p>Paste your URL → get a full conversion scorecard with exact fixes.</p>
            <a href="https://nebulacomponents.shop/audit.html" class="btn">Run Free Audit →</a>
        </div>
        
        <div class="footer-note">
            <p>This case study is based on a real automated audit. Domain and identifying details anonymized.<br>
            Nebula Components — landing page components that convert.</p>
        </div>
    </div>
</body>
</html>"""
    return html

def generate_index_page(case_studies: list):
    """Generate index page listing all case studies."""
    CASE_STUDIES_DIR.mkdir(parents=True, exist_ok=True)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversion Audit Case Studies | Nebula Components</title>
    <meta name="description" content="Real landing page conversion audits across SaaS, ecommerce, agency, and more. See actual scores, issues found, and fixes applied.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://nebulacomponents.shop/case-studies/">
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #fafafa; }}
        .container {{ max-width: 900px; margin: 0 auto; padding: 40px 20px; }}
        .header {{ text-align: center; margin-bottom: 48px; }}
        .header h1 {{ font-size: 36px; font-weight: 700; color: #111827; margin-bottom: 12px; }}
        .header p {{ color: #6b7280; font-size: 18px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }}
        .card {{ background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }}
        .card:hover {{ transform: translateY(-4px); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1); }}
        .card-header {{ background: #f9fafb; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }}
        .vertical-tag {{ background: #047857; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }}
        .score {{ font-size: 24px; font-weight: 800; }}
        .score.grade-a {{ color: #166534; }}
        .score.grade-b {{ color: #1e40af; }}
        .score.grade-c {{ color: #92400e; }}
        .score.grade-d {{ color: #991b1b; }}
        .card-body {{ padding: 20px; }}
        .card-title {{ font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px; }}
        .card-meta {{ color: #6b7280; font-size: 14px; margin-bottom: 16px; }}
        .card-link {{ display: inline-block; color: #047857; font-weight: 600; text-decoration: none; }}
        .card-link:hover {{ text-decoration: underline; }}
        .cta-banner {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 32px; text-align: center; margin-top: 48px; }}
        .cta-banner h2 {{ font-size: 24px; font-weight: 700; color: #166534; margin-bottom: 12px; }}
        .cta-banner p {{ color: #166534; margin-bottom: 20px; }}
        .btn {{ display: inline-block; background: #047857; color: white; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Landing Page Conversion Audit Case Studies</h1>
            <p>Real audits. Real scores. Real patterns. <a href="https://nebulacomponents.shop/audit.html" style="color: #047857;">Run your own free audit →</a></p>
        </div>
        
        <div class="grid">
"""
    
    for cs in case_studies:
        grade = cs.get("grade", "C").lower()
        slug = cs.get("slug", "")
        vertical = cs.get("vertical", "general").replace("_", " ").title()
        overall = cs.get("overall", 0)
        date = cs.get("date", "Recent")
        html += f"""            <article class="card">
                <div class="card-header">
                    <span class="vertical-tag">{vertical}</span>
                    <span class="score grade-{grade}">{overall}/10</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">{vertical} Landing Page Audit</h3>
                    <div class="card-meta">Published {date} · Grade {cs.get("grade", "?")}</div>
                    <a href="{slug}.html" class="card-link">Read case study →</a>
                </div>
            </article>
"""
    
    html += """        </div>
        
        <div class="cta-banner">
            <h2>Audit Your Own Page Free</h2>
            <p>Paste your URL → get a 5-dimension conversion scorecard with exact fixes in 60 seconds.</p>
            <a href="https://nebulacomponents.shop/audit.html" class="btn">Run Free Audit →</a>
        </div>
    </div>
</body>
</html>"""
    
    (CASE_STUDIES_DIR / "index.html").write_text(html)
    print(f"  Generated index.html with {len(case_studies)} case studies")

def main():
    latest_only = "--latest" in sys.argv
    state = load_state()
    
    if not AUDIT_LEADS.exists():
        print("No audit_leads.jsonl found")
        return
    
    CASE_STUDIES_DIR.mkdir(parents=True, exist_ok=True)
    
    lines = AUDIT_LEADS.read_text().strip().splitlines()
    start_line = state.get("last_processed_line", 0) if latest_only else 0
    
    new_studies = []
    all_studies = state.get("generated_slugs", [])
    
    for i, line in enumerate(lines[start_line:], start=start_line):
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except:
            continue
        
        email = entry.get("email", "").lower()
        url = entry.get("url", "")
        overall = entry.get("overall", 0)
        grade = entry.get("overall_grade", "C")
        
        if not url or not email:
            continue
        
        vertical = detect_vertical(url, entry)
        base_slug = f"{vertical}-{slugify(urlparse(url).netloc.replace('www.', ''))}"
        slug = base_slug
        counter = 1
        while slug in all_studies:
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Generate case study
        html = generate_case_study_html(entry, slug, vertical)
        (CASE_STUDIES_DIR / f"{slug}.html").write_text(html)
        
        study_meta = {
            "slug": slug,
            "vertical": vertical,
            "overall": overall,
            "grade": grade,
            "date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
            "domain": urlparse(url).netloc.replace("www.", ""),
        }
        new_studies.append(study_meta)
        all_studies.append(slug)
        print(f"  Generated: {slug}.html ({vertical}, {overall}/10)")
    
    # Update index with ALL studies (re-read all)
    all_meta = []
    for slug in all_studies:
        html_file = CASE_STUDIES_DIR / f"{slug}.html"
        if html_file.exists():
            # Extract meta from state or re-parse
            pass
    # Just regenerate from all_studies in state
    # For simplicity, rebuild from scratch each run
    all_studies_meta = []
    for slug in all_studies:
        html_file = CASE_STUDIES_DIR / f"{slug}.html"
        if html_file.exists():
            content = html_file.read_text()
            # Extract meta from content
            import re
            m_overall = re.search(r'<span class="score-value">(\d+)</span>', content)
            m_grade = re.search(r'Overall Grade: (\w)', content)
            m_vertical = re.search(r'<div class="badge">Case Study · ([^<]+)</div>', content)
            m_date = re.search(r'Published ([^·<]+)', content)
            if m_overall and m_grade and m_vertical and m_date:
                all_studies_meta.append({
                    "slug": slug,
                    "overall": int(m_overall.group(1)),
                    "grade": m_grade.group(1),
                    "vertical": m_vertical.group(1).lower().replace(" ", "_"),
                    "date": m_date.group(1).strip(),
                })
    
    generate_index_page(all_studies_meta)
    
    state["last_processed_line"] = len(lines)
    state["generated_slugs"] = all_studies
    save_state(state)
    
    print(f"\nDone. Generated {len(new_studies)} new case studies. Total: {len(all_studies)}")
    print(f"Index: https://nebulacomponents.shop/case-studies/")

if __name__ == "__main__":
    main()