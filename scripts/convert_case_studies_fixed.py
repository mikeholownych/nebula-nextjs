#!/usr/bin/env python3
"""
Convert case studies 401-419 from HTML to Next.js dynamic routes.
Properly formatted with valid TypeScript.
"""

import os
import re
from pathlib import Path
import json

# Paths
SOURCE_DIR = Path("/home/mike/nebula/public/case-studies")
TARGET_DIR = Path("/home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal/customer-portal/app/case-studies/[slug]")

# Get the last 19 files (401-419)
all_files = sorted(SOURCE_DIR.glob("*.html"))
files_to_convert = all_files[-19:]

print(f"Converting {len(files_to_convert)} case studies...")

def extract_category(html):
    match = re.search(r'Case Study · (\w+)', html)
    return match.group(1) if match else "General"

def extract_score(html):
    match = re.search(r'(\d+\.?\d*)/10', html)
    return float(match.group(1)) if match else 0.0

def extract_grade(score):
    if score >= 8:
        return ("A", "grade-a")
    elif score >= 6:
        return ("B", "grade-b")
    elif score >= 4:
        return ("C", "grade-c")
    else:
        return ("D", "grade-d")

def extract_domain(filename):
    name = filename.replace(".html", "")
    parts = name.split("-", 1)
    return parts[1] if len(parts) > 1 else name

def extract_issues(html):
    issues = []
    issue_pattern = r'<div class="issue-title">(.*?)</div>\s*<div class="issue-desc">(.*?)</div>'
    matches = re.findall(issue_pattern, html, re.DOTALL)
    for title, desc in matches:
        title_clean = re.sub(r'<.*?>', '', title).strip().replace('\n', ' ')
        desc_clean = re.sub(r'<.*?>', '', desc).strip().replace('\n', ' ')
        issues.append({"title": title_clean, "description": desc_clean})
    return issues

def extract_pattern_text(html):
    match = re.search(r'<h2>The Pattern</h2>\s*<p[^>]*>(.*?)</p>', html, re.DOTALL)
    if match:
        text = match.group(1).strip()
        text = re.sub(r'<.*?>', '', text).replace('\n', ' ')
        return text
    return ""

def extract_jsonld_date(html):
    """Extract date from JSON-LD."""
    match = re.search(r'"datePublished":\s*"(.*?)"', html)
    return match.group(1) if match else "2026-07-01"

# Process each file
converted = 0
for filepath in files_to_convert:
    print(f"Processing {filepath.name}...")
    
    with open(filepath, 'r') as f:
        html = f.read()
    
    # Extract data
    category = extract_category(html)
    score = extract_score(html)
    grade_letter, grade_class = extract_grade(score)
    domain = extract_domain(filepath.name)
    issues = extract_issues(html)
    pattern_text = extract_pattern_text(html)
    date_published = extract_jsonld_date(html)
    
    slug = filepath.name.replace(".html", "")
    
    # Create directory
    target_dir = TARGET_DIR / slug
    target_dir.mkdir(exist_ok=True)
    
    # Build the issues array as proper JSON
    issues_json = json.dumps(issues, ensure_ascii=False)
    
    # Build pattern text - escape for JSX
    pattern_escaped = pattern_text.replace('\\', '\\\\').replace('"', '\\"')
    
    # Create JSON-LD object
    jsonld_obj = {
        "@context": "https://schema.org",
        "@type": "CaseStudy",
        "name": f"{category} Landing Page Conversion Audit",
        "description": f"A real {category} landing page scored {score}/10 on conversion audit. See the exact issues found and fixes applied.",
        "datePublished": date_published,
        "author": {
            "@type": "Organization",
            "name": "Nebula Components",
            "url": "https://nebulacomponents.shop"
        },
        "about": {
            "@type": "Service",
            "name": "Landing Page Conversion Audit",
            "description": "Automated audit scoring headline, CTA, social proof, speed, and mobile experience."
        },
        "result": {
            "@type": "QuantitativeValue",
            "name": "Conversion Audit Score",
            "value": score,
            "maxValue": 10,
            "unitText": "/10"
        }
    }
    
    # Write the file
    target_file = target_dir / "page.tsx"
    
    with open(target_file, 'w') as f:
        f.write(f'''import {{ Metadata }} from 'next';
import CaseStudyPage from '../../CaseStudyPage';

export const metadata: Metadata = {{
  title: "Case Study: {category} Landing Page Audit — {score}/10 Score | Nebula Components",
  description: "See how a {category} landing page scored {score}/10 on conversion audit. Real issues found, exact fixes applied. Free audit tool included.",
}};

export default function Page() {{
  const jsonLd = {json.dumps(jsonld_obj, indent=2)};

  return (
    <CaseStudyPage
      category="{category}"
      domain="{domain}"
      score={{{score}}}
      gradeClass="{grade_class}"
      gradeLetter="{grade_letter}"
      issues={{{issues_json}}}
      patternText="{pattern_escaped}"
      jsonLd={{JSON.stringify(jsonLd)}}
    />
  );
}}
''')
    
    converted += 1
    print(f"  ✓ Created {target_file}")

print(f"\n✅ Converted {converted} case studies!")
print(f"Files saved to: {TARGET_DIR}")
