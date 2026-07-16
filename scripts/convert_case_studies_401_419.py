#!/usr/bin/env python3
"""
Convert case studies 401-419 from HTML to Next.js dynamic routes.
Extracts data from HTML case studies and generates page.tsx files.
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
files_to_convert = all_files[-19:]  # Last 19 files

print(f"Converting {len(files_to_convert)} case studies...")

def extract_category(html):
    """Extract category from badge."""
    match = re.search(r'Case Study · (\w+)', html)
    if match:
        return match.group(1)
    return "General"

def extract_score(html):
    """Extract score from title or content."""
    match = re.search(r'(\d+\.?\d*)/10', html)
    if match:
        return float(match.group(1))
    return 0.0

def extract_grade(score):
    """Convert score to grade."""
    if score >= 8:
        return ("A", "grade-a")
    elif score >= 6:
        return ("B", "grade-b")
    elif score >= 4:
        return ("C", "grade-c")
    else:
        return ("D", "grade-d")

def extract_domain(filename):
    """Extract domain from filename."""
    name = filename.replace(".html", "")
    parts = name.split("-", 1)
    if len(parts) > 1:
        return parts[1]
    return name

def extract_issues(html):
    """Extract issue titles and descriptions."""
    issues = []
    issue_pattern = r'<div class="issue-title">(.*?)</div>\s*<div class="issue-desc">(.*?)</div>'
    matches = re.findall(issue_pattern, html, re.DOTALL)
    for title, desc in matches:
        title_clean = re.sub(r'<.*?>', '', title).strip()
        desc_clean = re.sub(r'<.*?>', '', desc).strip()
        issues.append({
            "title": title_clean,
            "description": desc_clean
        })
    return issues

def extract_pattern_text(html):
    """Extract pattern text."""
    match = re.search(r'<h2>The Pattern</h2>\s*<p[^>]*>(.*?)</p>', html, re.DOTALL)
    if match:
        text = match.group(1).strip()
        text = re.sub(r'<.*?>', '', text)
        return text
    return ""

def extract_jsonld(html):
    """Extract JSON-LD schema."""
    match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def escape_js_string(s):
    """Escape string for JavaScript/TSX."""
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    s = s.replace('\n', ' ')
    s = s.replace('\r', '')
    return s

def generate_page_tsx(slug, category, domain, score, grade_letter, grade_class, issues, pattern_text, jsonld_str):
    """Generate page.tsx content."""
    
    # Format issues as JS array
    issues_js_parts = []
    for issue in issues:
        title_escaped = escape_js_string(issue["title"])
        desc_escaped = escape_js_string(issue["description"])
        issues_js_parts.append('{ title: "' + title_escaped + '", description: "' + desc_escaped + '" }')
    
    issues_js = ", ".join(issues_js_parts)
    
    # Escape pattern text
    pattern_escaped = escape_js_string(pattern_text)
    
    # Parse JSON-LD and create inline version
    try:
        jsonld_obj = json.loads(jsonld_str)
        # Create minified JSON string for embedding
        jsonld_minified = json.dumps(jsonld_obj, separators=(',', ': '))
        jsonld_escaped = escape_js_string(jsonld_minified)
    except:
        # Fallback to empty object
        jsonld_escaped = "{}"
    
    # Build the content using string concatenation to avoid f-string issues
    content = """import { Metadata } from 'next';
import CaseStudyPage from '../../CaseStudyPage';

export const metadata: Metadata = {
  title: "Case Study: """ + category + """ Landing Page Audit — """ + str(score) + """/10 Score | Nebula Components",
  description: "See how a """ + category + """ landing page scored """ + str(score) + """/10 on conversion audit. Real issues found, exact fixes applied. Free audit tool included.",
};

export default function Page() {
  return (
    <CaseStudyPage
      category=\"""" + category + """\"
      domain=\"""" + domain + """\"
      score={""" + str(score) + """}
      gradeClass=\"""" + grade_class + """\"
      gradeLetter=\"""" + grade_letter + """\"
      issues={[""" + issues_js + """]}
      patternText=\"""" + pattern_escaped + """\"
      jsonLd=\"""" + jsonld_escaped + """\"
    />
  );
}
"""
    return content

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
    jsonld = extract_jsonld(html)
    
    # Create slug (directory name)
    slug = filepath.name.replace(".html", "")
    
    # Generate content
    content = generate_page_tsx(
        slug, category, domain, score, grade_letter, grade_class,
        issues, pattern_text, jsonld
    )
    
    # Create directory and write file
    target_dir = TARGET_DIR / slug
    target_dir.mkdir(exist_ok=True)
    
    target_file = target_dir / "page.tsx"
    with open(target_file, 'w') as f:
        f.write(content)
    
    converted += 1
    print(f"  ✓ Created {target_file}")

print(f"\n✅ Converted {converted} case studies!")
print(f"Files saved to: {TARGET_DIR}")
