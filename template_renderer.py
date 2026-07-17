#!/usr/bin/env python3
"""
template_renderer.py — Load and render nurture templates with variable injection.

Templates are markdown files with {curly_brace} variables.
Renderer loads template, injects lead/audit data, returns rendered email.

Usage:
    from template_renderer import render_template
    
    email_body = render_template(
        template_id="cold_headline_diagnosis_1",
        lead=lead_dict,
        audit=audit_dict
    )
"""

import json
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any

BASE = Path("/home/mike/nebula")
TEMPLATES_DIR = BASE / "templates"

# Default fallbacks for missing variables
DEFAULTS = {
    "first_name": "there",
    "domain": "your site",
    "site": "your landing page",
    "headline_text": "Your headline",
    "cta_text": "Your CTA",
    "testimonial_sample": "Your testimonial",
    "ad_text_sample": "Your ad copy",
    "audit_link_with_source": "https://nebulacomponents.shop/audit.html",
    "headline_worksheet_link": "https://nebulacomponents.shop/resources/headline-worksheet",
    "message_match_worksheet_link": "https://nebulacomponents.shop/resources/message-match-worksheet",
    "cta_worksheet_link": "https://neblecomponents.shop/resources/cta-worksheet",
    "proof_worksheet_link": "https://nebulacomponents.shop/resources/proof-guide",
    "stripe_fix_pack_link": "https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b",
}


def extract_first_name(email: str, name: str = "") -> str:
    """Extract first name from email or name field."""
    if name and name.strip():
        # Use name if available
        parts = name.strip().split()
        return parts[0].capitalize()
    
    # Fall back to email local part
    if email and "@" in email:
        local = email.split("@")[0]
        # Remove numbers and special chars
        local = re.sub(r"[0-9_\-\.]+", "", local)
        if local:
            return local.capitalize()
    
    return "there"


def extract_domain(url: str) -> str:
    """Extract domain from URL."""
    if not url:
        return "your site"
    
    url = url.strip()
    # Remove protocol
    url = re.sub(r"^https?://", "", url)
    # Remove path
    url = url.split("/")[0]
    # Remove www
    url = re.sub(r"^www\.", "", url)
    
    return url


def load_template(template_id: str) -> Optional[Dict[str, str]]:
    """
    Load template file and parse into subject + body.
    
    Returns:
        {
            "subject": "...",
            "body": "...",
            "metadata": {...}  # frontmatter
        }
    """
    # Template naming: cold_headline_diagnosis_1 → segment=cold, file=headline_diagnosis_1.md
    # OR: headline_diagnosis_1 → segment=cold (default), file=headline_diagnosis_1.md
    parts = template_id.split("_")
    
    if len(parts) < 2:
        return None
    
    # Check if first part is a segment name
    segment_names = ["cold", "warm", "hot"]
    
    if parts[0] in segment_names:
        segment = parts[0]
        # File is rest of template_id
        filename = "_".join(parts[1:]) + ".md"
        if not filename or filename == ".md":
            filename = f"{template_id}.md"
    else:
        # No segment prefix, assume cold
        segment = "cold"
        filename = f"{template_id}.md"
    
    # Template file path
    template_file = TEMPLATES_DIR / segment / filename
    
    if not template_file.exists():
        print(f"[template_renderer] Template not found: {template_file}")
        return None
    
    content = template_file.read_text()
    
    # Parse frontmatter (between ---)
    metadata = {}
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            frontmatter = parts[1].strip()
            content = parts[2].strip()
            
            # Parse YAML-like frontmatter
            for line in frontmatter.split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    metadata[key.strip()] = val.strip().strip('"')
    
    # Extract subject from first line starting with "Subject:"
    subject = ""
    body_lines = []
    
    for line in content.split("\n"):
        if line.startswith("Subject:"):
            subject = line.replace("Subject:", "").strip()
        else:
            body_lines.append(line)
    
    body = "\n".join(body_lines).strip()
    
    return {
        "subject": subject,
        "body": body,
        "metadata": metadata
    }


def render_template(
    template_id: str,
    lead: Dict[str, Any],
    audit: Optional[Dict[str, Any]] = None,
    extra_vars: Optional[Dict[str, str]] = None
) -> Optional[Dict[str, str]]:
    """
    Render a template with lead and audit data.
    
    Args:
        template_id: e.g., "cold_headline_diagnosis_1"
        lead: Lead record from lead_manager
        audit: Audit record (optional, for finding-specific templates)
        extra_vars: Additional variables to inject
    
    Returns:
        {
            "subject": "Rendered subject",
            "body": "Rendered body text",
            "metadata": {...}
        }
        or None if template not found
    """
    template = load_template(template_id)
    if not template:
        return None
    
    # Build variable map
    email = lead.get("email", "")
    name = lead.get("name", "")
    url = lead.get("url", "")
    
    domain = extract_domain(url)
    first_name = extract_first_name(email, name)
    
    variables = {
        "first_name": first_name,
        "email": email,
        "name": name,
        "domain": domain,
        "site": url or f"https://{domain}",
        **DEFAULTS,
    }
    
    # Add audit-specific variables if audit provided
    if audit:
        findings = audit.get("findings", [])
        
        # Extract specific finding text by category
        headline_finding = next(
            (f for f in findings if f.get("category") == "headline"),
            {}
        )
        cta_finding = next(
            (f for f in findings if f.get("category") == "cta"),
            {}
        )
        message_match_finding = next(
            (f for f in findings if f.get("category") == "message_match"),
            {}
        )
        social_proof_finding = next(
            (f for f in findings if f.get("category") == "social_proof"),
            {}
        )
        
        variables.update({
            "headline_text": headline_finding.get("observation", DEFAULTS["headline_text"]),
            "cta_text": cta_finding.get("observation", DEFAULTS["cta_text"]),
            "ad_text_sample": message_match_finding.get("observation", DEFAULTS["ad_text_sample"]),
            "testimonial_sample": social_proof_finding.get("observation", DEFAULTS["testimonial_sample"]),
        })
    
    # Add extra vars (highest priority)
    if extra_vars:
        variables.update(extra_vars)
    
    # Render subject and body
    subject = template["subject"]
    body = template["body"]
    
    # Replace {variable} patterns
    for key, val in variables.items():
        placeholder = "{" + key + "}"
        subject = subject.replace(placeholder, str(val))
        body = body.replace(placeholder, str(val))
    
    # Warn about unfilled variables
    unfilled = re.findall(r"\{[a-z_]+\}", subject + body)
    if unfilled:
        print(f"[template_renderer] Warning: Unfilled variables in {template_id}: {unfilled}")
    
    return {
        "subject": subject,
        "body": body,
        "metadata": template.get("metadata", {})
    }


def test_renderer():
    """Test the renderer with sample data."""
    lead = {
        "email": "jane@example.com",
        "name": "Jane Founder",
        "url": "https://example.com",
    }
    
    audit = {
        "findings": [
            {
                "category": "headline",
                "observation": "Headline says 'Analytics Platform' but visitor needs to know what they get"
            }
        ]
    }
    
    # Use a template that exists
    result = render_template(
        template_id="cold_headline_diagnosis_1",
        lead=lead,
        audit=audit
    )
    
    if result:
        print("=== SUBJECT ===")
        print(result["subject"])
        print("\n=== BODY ===")
        print(result["body"])
        print("\n=== METADATA ===")
        print(json.dumps(result["metadata"], indent=2))
    else:
        # Try alternate template name
        print("Primary template not found, testing alternate...")
        result2 = render_template(
            template_id="headline_diagnosis_1",
            lead=lead,
            audit=audit
        )
        if result2:
            print("Found alternate template:")
            print("=== SUBJECT ===")
            print(result2["subject"])
        else:
            print("Template not found. Available templates:")
            import os
            for root, dirs, files in os.walk(TEMPLATES_DIR):
                for f in files:
                    if f.endswith('.md'):
                        rel = os.path.relpath(os.path.join(root, f), TEMPLATES_DIR)
                        print(f"  - {rel}")


if __name__ == "__main__":
    test_renderer()
