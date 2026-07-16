#!/usr/bin/env python3
"""Batch convert HTML case studies 151-200 to Next.js dark theme pages."""

import os
import re
import json
from pathlib import Path
from html.parser import HTMLParser
from bs4 import BeautifulSoup

# Get sorted list of HTML files
HTML_DIR = Path("/home/mike/nebula/public/case-studies")
APP_DIR = Path("/home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal/customer-portal/app/case-studies")

def get_sorted_files():
    """Get sorted HTML files and return 151-200."""
    files = sorted(HTML_DIR.glob("*.html"))
    # Return files 151-200 (index 150-199)
    return files[150:200]

def extract_json_ld(soup):
    """Extract JSON-LD script tag content."""
    script = soup.find("script", {"type": "application/ld+json"})
    if script:
        return script.string.strip()
    return None

def extract_title(soup):
    """Extract page title."""
    title_tag = soup.find("title")
    if title_tag:
        return title_tag.string
    return "Case Study | Nebula Components"

def extract_meta(soup, name):
    """Extract meta tag content."""
    meta = soup.find("meta", {"name": name})
    if meta:
        return meta.get("content", "")
    return ""

def extract_og_meta(soup, prop):
    """Extract Open Graph meta content."""
    meta = soup.find("meta", {"property": prop})
    if meta:
        return meta.get("content", "")
    return ""

def extract_case_data(soup):
    """Extract case study data from HTML."""
    data = {
        "title": extract_title(soup),
        "description": extract_meta(soup, "description"),
        "og_title": extract_og_meta(soup, "og:title"),
        "og_description": extract_og_meta(soup, "og:description"),
        "json_ld": extract_json_ld(soup),
    }
    
    # Extract badge text
    badge = soup.find(class_="badge")
    data["badge"] = badge.get_text(strip=True) if badge else "Case Study"
    
    # Extract h1
    h1 = soup.find("h1")
    data["h1"] = h1.get_text(strip=True) if h1 else "Case Study"
    
    # Extract score from JSON-LD
    if data["json_ld"]:
        try:
            jd = json.loads(data["json_ld"])
            data["score"] = jd.get("result", {}).get("value", 0)
        except:
            data["score"] = 0
    else:
        data["score"] = 0
    
    # Extract issues
    issues = []
    issue_divs = soup.find_all(class_="issue")
    for issue in issue_divs:
        title_div = issue.find(class_="issue-title")
        desc_div = issue.find(class_="issue-desc")
        if title_div and desc_div:
            issues.append({
                "title": title_div.get_text(strip=True),
                "description": desc_div.get_text(strip=True)
            })
    data["issues"] = issues
    
    # Extract pattern section
    pattern_section = soup.find("div", class_="section")
    if pattern_section:
        pattern_h2 = pattern_section.find("h2", string=re.compile("Pattern"))
        if pattern_h2:
            # Get all paragraphs after h2
            paragraphs = []
            for sib in pattern_h2.find_next_siblings("p"):
                paragraphs.append(sib.get_text(strip=True))
            data["pattern"] = paragraphs
    
    # Extract grade from score-circle
    score_circle = soup.find(class_="score-circle")
    if score_circle:
        classes = score_circle.get("class", [])
        for c in classes:
            if "grade-" in c:
                data["grade"] = c.replace("grade-", "").upper()
                break
        grade_text = soup.find("p", string=re.compile("Overall Grade"))
        if grade_text:
            match = re.search(r"Grade:\s*([A-D])", grade_text.get_text())
            if match:
                data["grade"] = match.group(1)
    
    # Extract date published (from JSON-LD or meta)
    if data["json_ld"]:
        try:
            jd = json.loads(data["json_ld"])
            data["date_published"] = jd.get("datePublished", "")
        except:
            data["date_published"] = ""
    else:
        data["date_published"] = ""
    
    return data

def slugify(filename):
    """Convert filename to slug."""
    # Remove .html extension
    slug = filename.replace(".html", "")
    return slug

def get_grade_color(grade):
    """Get Tailwind color classes for grade."""
    colors = {
        "A": ("bg-green-500/20", "border-green-500", "text-green-400"),
        "B": ("bg-blue-500/20", "border-blue-500", "text-blue-400"),
        "C": ("bg-yellow-500/20", "border-yellow-500", "text-yellow-400"),
        "D": ("bg-red-500/20", "border-red-500", "text-red-400"),
    }
    return colors.get(grade, colors["C"])

def generate_page_tsx(filename, case_data):
    """Generate Next.js page.tsx content."""
    slug = slugify(filename)
    json_ld_str = case_data.get("json_ld", "{}") or "{}"
    
    # Escape for JSX
    json_ld_escaped = json_ld_str.replace("`", "\\`").replace("${", "\\${")
    
    grade = case_data.get("grade", "C")
    grade_colors = get_grade_color(grade)
    
    # Build issues JSX
    issues_jsx = []
    for issue in case_data.get("issues", []):
        issues_jsx.append(f'''          <div className="py-4 border-b border-white/10 last:border-0">
            <div className="font-semibold text-white mb-1">{issue["title"]}</div>
            <div className="text-white/70">{issue["description"]}</div>
          </div>''')
    
    issues_block = "\n".join(issues_jsx)
    
    # Build pattern paragraphs
    pattern_jsx = []
    for p in case_data.get("pattern", []):
        pattern_jsx.append(f'          <p className="text-white/70 mb-4">{p}</p>')
    pattern_block = "\n".join(pattern_jsx) if pattern_jsx else '          <p className="text-white/70">Analysis coming soon.</p>'
    
    # Extract date for display
    date_str = case_data.get("date_published", "")
    if date_str:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            date_display = dt.strftime("%B %d, %Y")
        except:
            date_display = "Recently"
    else:
        date_display = "Recently"
    
    return f'''import type {{ Metadata }} from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {{
  title: '{case_data.get("title", "Case Study")}',
  description: `{case_data.get("description", "")}`,
  openGraph: {{
    title: '{case_data.get("og_title", case_data.get("title", "Case Study"))}',
    description: '{case_data.get("og_description", "")}',
  }},
}};

const jsonLd = `{json_ld_escaped}`;

export default function CaseStudy() {{
  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ {{ __html: jsonLd }} }}
      />
      
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
            ← Back to Audit Tool
          </Link>
          
          <div className="mb-4">
            <span className="inline-block bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium">
              {case_data.get("badge", "Case Study")}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {case_data.get("h1", "Case Study")}
          </h1>
          
          <p className="text-white/50 text-sm mb-12">
            Published {date_display} · Domain anonymized for privacy
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full {grade_colors[0]} border-3 {grade_colors[1]} flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold {grade_colors[2]}">{case_data.get("score", 0)}</span>
              </div>
              <div>
                <p className="font-semibold text-white">Overall Grade: {grade}</p>
                <p className="text-white/60">Industry: Ecommerce</p>
                <p className="text-white/60">Audit Date: {date_display}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 pb-4 border-b border-white/10">What the Audit Found</h2>
{issues_block}
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 pb-4 border-b border-white/10">The Pattern</h2>
{pattern_block}
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-emerald-400 mb-2">Audit Your Own Page in 60 Seconds</h3>
            <p className="text-emerald-200/70 mb-6">Paste your URL → get a full conversion scorecard with exact fixes.</p>
            <Link 
              href="/landing-page-audit-tool" 
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-xl transition"
            >
              Run Free Audit →
            </Link>
          </div>
          
          <p className="text-center text-white/30 text-sm mt-12">
            This case study is based on a real automated audit. Domain and identifying details anonymized.<br/>
            Nebula Components — landing page components that convert.
          </p>
        </div>
      </div>
    </>
  );
}}
'''

def main():
    files = get_sorted_files()
    print(f"Converting {len(files)} files (cases 151-200)...")
    
    # Ensure APP_DIR exists
    APP_DIR.mkdir(parents=True, exist_ok=True)
    
    for i, html_path in enumerate(files, 151):
        print(f"  [{i}] Processing {html_path.name}...")
        
        # Read HTML
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Extract data
        case_data = extract_case_data(soup)
        
        # Generate page.tsx
        tsx_content = generate_page_tsx(html_path.name, case_data)
        
        # Create directory
        slug = slugify(html_path.name)
        output_dir = APP_DIR / slug
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Write file
        output_path = output_dir / "page.tsx"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(tsx_content)
        
        print(f"    ✓ Created {output_path}")
    
    print(f"\n✅ Converted {len(files)} case studies!")

if __name__ == "__main__":
    main()
