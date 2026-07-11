#!/usr/bin/env python3
"""
prompts/generator.py — Build AI prompt packs from audit findings.

Reads the structured audit output (from deliver_audit.score_audit)
and page data, finds dimensions scoring below 7/10, maps each to
a parameterized prompt template, and returns a prompt pack.

The first prompt (worst dimension) serves as the free teaser.
Remaining prompts are the $7 upsell.

Usage:
    from audit_pipeline.prompts.generator import build_prompt_pack

    pack = build_prompt_pack(audit, page, email=lead_email)
    prompt = pack["teaser"]          # one free prompt (markdown)
    prompts = pack["full_pack"]      # list of prompt dicts
    pack["prompt_count"]             # total non-teaser count
"""

import hashlib
import json
import os
import re
from pathlib import Path
from string import Template

PACKS_DIR = Path(__file__).parent / "packs"
TEMPLATES_DIR = Path(__file__).parent / "templates"

DIM_LABELS = {
    "headline": "Headline",
    "cta": "CTA",
    "social_proof": "Social Proof",
    "load_speed": "Load Speed",
    "mobile": "Mobile",
    "above_fold": "Above Fold",
    "ad_signals": "Ad Tracking",
    "seo_foundations": "SEO Foundations",
    "ai_readiness": "AI Citation Readiness",
}

# ── Mapping: audit dimension key → template filename ───────
TEMPLATE_MAP = {
    "headline": "headline.md",
    "cta": "cta.md",
    "social_proof": "social_proof.md",
    "load_speed": "load_speed.md",
    "mobile": "mobile.md",
    "above_fold": "above_fold.md",
    "ad_signals": "ad_signals.md",
    "seo_foundations": "seo_foundations.md",
    "ai_readiness": "ai_readiness.md",
    "goal_contradiction": "goal_contradiction.md",
    "h1_misalignment": "h1_misalignment.md",
}


# ── Template loading with caching ───────────────────────────
_template_cache = {}

def _load_template(template_name):
    """Load a template file, cached."""
    if template_name not in _template_cache:
        path = TEMPLATES_DIR / template_name
        if not path.exists():
            return None
        _template_cache[template_name] = path.read_text()
    return _template_cache[template_name]


# ── Data extraction helpers ────────────────────────────────

def _extract_trust_words(dim):
    """Extract trust words from social_proof issue text."""
    issue = dim.get("issue", "")
    m = re.search(r"claims trust \(([^)]+)\)", issue)
    if m:
        return m.group(1)
    return "(no trust words detected on page)"


def _cta_list(page):
    """Format CTAs for display."""
    ctas = page.get("ctas", [])
    if not ctas:
        return "No CTA buttons found above the fold."
    return "\n".join(f"- {c}" for c in ctas[:5])


def _audience_from_stated(stated_visitor):
    if stated_visitor:
        return stated_visitor
    return "your target customer (check your analytics for the actual audience visiting this page)"


def _platform_from_page(page):
    html = page.get("html", "")
    h = html.lower()
    if "wp-content" in h or "wordpress" in h:
        return "WordPress"
    if "shopify" in h or "cdn.shopify.com" in h:
        return "Shopify"
    if "squarespace" in h:
        return "Squarespace"
    if "webflow" in h:
        return "Webflow"
    if "wix.com" in h:
        return "Wix"
    if "framer" in h:
        return "Framer"
    return "your CMS (check your page HTML)"


def _html_size(page):
    html = page.get("html", "")
    return str(len(html) // 1000)


def _parse_signals(dim):
    """Parse ad_signals found/missing from issue text."""
    issue = dim.get("issue", "")
    found_match = re.search(r"Found: ([^.]+)", issue)
    missing_match = re.search(r"Missing: ([^.]+)", issue)
    found = found_match.group(1) if found_match else ""
    missing = missing_match.group(1) if missing_match else ""
    return found, missing


def _og_status(dim):
    """Extract OG count from ai_readiness issue text."""
    issue = dim.get("issue", "")
    m = re.search(r"(\d)/5", issue)
    return m.group(1) if m else "0"


def _ai_flag(field, dim, page):
    """Check if a specific AI signal was found."""
    issue = dim.get("issue", "")
    html = page.get("html", "").lower()
    if field == "jsonld":
        return "✅ Found" if '<script type="application/ld+json"' in html else "❌ Missing"
    if field == "twitter":
        return "✅ Present" if 'name="twitter:card"' in html else "❌ Missing"
    if field == "canonical":
        return "✅ Set" if 'rel="canonical"' in html else "❌ Missing"
    return ""


def _shared_words(page):
    """Count shared significant words between title and H1."""
    title = page.get("title", "")
    h1 = page.get("h1", "")
    if not title or not h1:
        return "(one or both missing)"
    stop = {"the","a","an","in","on","at","to","for","of","and","or","is","your","our","we","you","it","be","as","with"}
    t_words = set(re.findall(r"[a-z]+", title.lower())) - stop
    h_words = set(re.findall(r"[a-z]+", h1.lower())) - stop
    common = t_words & h_words
    return ", ".join(sorted(common)) if common else "(none — complete misalignment)"


def _estimated_offer(page):
    """Guess what the page offers from its text."""
    html_lower = page.get("html", "").lower()
    if "free" in html_lower:
        return "a free tool or resource"
    if "pricing" in html_lower or "$" in html_lower:
        return "a paid product or service"
    return "your core offer (check your homepage hero text)"


# ── Main builder ────────────────────────────────────────────

def build_prompt_pack(audit, page, email=None, stated_visitor=None, stated_goal=None):
    """
    Build a prompt pack from audit findings.

    Args:
        audit: dict from score_audit() — {overall, overall_grade, dimensions, opp_matrix}
        page: dict from scrape_page() — {url, html, title, h1, text, ctas}
        email: optional lead email (for file naming)
        stated_visitor: optional audience description
        stated_goal: optional page goal ("sales", "leads", "bookings")

    Returns:
        dict with:
          - count: total applicable prompt types
          - teaser: one markdown prompt (free sample)
          - full_pack: list of {key, label, prompt_md} for remaining prompts
          - pack_path: path where the full pack was saved (or None)
    """
    url = page.get("url", "")
    dimensions = audit.get("dimensions", {})
    audience = _audience_from_stated(stated_visitor)
    platform = _platform_from_page(page)
    page_goal = stated_goal or "conversions"
    brand_name = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
    offer = _estimated_offer(page)
    primary_kw = page.get("h1", "")[:50] if page.get("h1") else brand_name
    cta_text = page.get("ctas", [""])[0] if page.get("ctas") else "(no CTA found)"

    # Identify which dimensions need prompts (score < 7 or score < 10 for critical)
    need_prompts = []
    for key, dim in dimensions.items():
        score = dim.get("score", 10)
        if score >= 7:
            continue
        template_name = TEMPLATE_MAP.get(key)
        if not template_name:
            continue
        template_content = _load_template(template_name)
        if not template_content:
            continue

        # Build template params per dimension type
        params = {
            "url": url,
            "audience": audience,
            "platform": platform,
            "offer": offer,
            "page_goal": page_goal,
            "brand_name": brand_name,
            "primary_keyword": primary_kw,
            "secondary_keywords": "(add keywords here — check Google Search Console for what you rank for)",
            "cta_text": cta_text,
            "cta_list": _cta_list(page),
            "html_size": _html_size(page),
            "title_tag": page.get("title", "(no title tag found)"),
            "h1_text": page.get("h1", "(no H1 found)"),
            "h1_count": str(1 if page.get("h1") else 0),
            "meta_description": "(check your page source for the meta description)",
            "post_cta": f"the next step after clicking (check what happens when someone clicks '{cta_text}')",
            "customer_count": "(fill in your number or delete this line)",
            "has_testimonials": "yes" if "testimonial" in page.get("html", "").lower() else "not on this page",
            "has_case_studies": "yes" if "case study" in page.get("html", "").lower() else "not on this page",
            "rating": "(your rating from G2/Capterra/Google if you have one)",
            "has_press": "yes" if "as seen" in page.get("html", "").lower() or "featured" in page.get("html", "").lower() else "not on this page",
            "logo_url": f"https://{brand_name}/logo.png (update with your actual logo URL)",
            "social_links": "(add your LinkedIn, Twitter, Facebook URLs)",
            "shared_words": _shared_words(page),
        }

        # Finding-specific issue/fix text
        params["headline_text"] = page.get("h1", "(no H1 found)")
        params["headline_issue"] = dim.get("issue", "Headline doesn't clearly state the buyer outcome.")

        params["cta_issue"] = dim.get("issue", "CTA language may not drive action.")
        params["cta_text"] = cta_text

        params["social_proof_issue"] = dim.get("issue", "Trust signals are weak or missing.")
        params["trust_words_found"] = _extract_trust_words(dim)

        params["load_speed_issue"] = dim.get("issue", "Page load speed needs improvement.")

        params["mobile_issue"] = dim.get("issue", "Mobile viewport may not be configured.")

        params["above_fold_issue"] = dim.get("issue", "Above-fold content lacks key conversion elements.")
        has_cta = bool(page.get("ctas"))
        params["has_cta"] = "yes" if has_cta else "no"
        has_offer = bool(re.search(r'\$\d|free|discount|offer|save|deal', page.get("html", "")[:2000].lower()))
        params["has_offer"] = "yes" if has_offer else "no"

        params["ad_signals_issue"] = dim.get("issue", "Ad tracking is incomplete.")
        signals_found, signals_missing = _parse_signals(dim)
        params["signals_found"] = signals_found or "none detected"
        params["signals_missing"] = signals_missing or "not checked"
        missing_items = signals_missing.split(",") if signals_missing else ["(check which tracking is missing)"]
        params["missing_item_1"] = missing_items[0].strip() if missing_items else "unknown"
        params["missing_item_2"] = missing_items[1].strip() if len(missing_items) > 1 else missing_items[0].strip()

        params["seo_issues_text"] = dim.get("issue", "SEO metadata needs work.")

        params["ai_findings_text"] = dim.get("issue", "AI citation readiness needs improvement.")
        params["og_status"] = _og_status(dim)
        params["has_jsonld"] = "✅" if '<script type="application/ld+json"' in page.get("html", "") else "❌"
        params["has_twitter"] = "✅" if 'name="twitter:card"' in page.get("html", "") else "❌"
        params["has_canonical"] = "✅" if 'rel="canonical"' in page.get("html", "") else "❌"
        params["has_jsonld_note"] = "Found" if params["has_jsonld"] == "✅" else "Missing"
        params["has_twitter_note"] = "Present" if params["has_twitter"] == "✅" else "Missing"
        params["has_canonical_note"] = "Set" if params["has_canonical"] == "✅" else "Missing"
        params["og_note"] = f"{params['og_status']}/5 complete"

        # Goal contradiction — separate from dimension check
        contradictions = dim.get("contradictions", [])
        if contradictions:
            params["stated_goal"] = stated_goal or "conversions"
            params["contradictions_text"] = "\n".join(
                f"• {e}" for _, e, _ in contradictions[:3]
            )

        # H1 misalignment — derived from title/h1
        params["secondary_keywords"] = "(check your analytics for related search terms)"

        # Render the template
        try:
            filled = Template(template_content).safe_substitute(params)
            # Remove any remaining ${...} or {...} unfilled placeholders
            filled = re.sub(r'\$\{[^}]+\}', '(fill in your details here)', filled)
            filled = re.sub(r'\{[a-zA-Z_][a-zA-Z0-9_]*\}', '(fill in your details here)', filled)
        except Exception:
            filled = f"*Template rendering error for {key}. See {template_name}*"

        need_prompts.append({
            "key": key,
            "label": DIM_LABELS.get(key, key.replace("_", " ").title()),
            "score": score,
            "prompt_md": filled,
            "params_used": params,
        })

    # Sort by score ascending (worst first)
    need_prompts.sort(key=lambda x: x["score"])
    need_prompts = need_prompts[:10]  # cap at 10 to keep email tight

    # First one is the teaser (free), rest are the $7 upsell
    teaser = need_prompts[0] if need_prompts else None
    upsell = need_prompts[1:] if need_prompts else []

    # Save full pack to file
    pack_path = None
    if email:
        token = hashlib.sha256(email.encode()).hexdigest()[:16]
        packs_dir = PACKS_DIR
        packs_dir.mkdir(parents=True, exist_ok=True)
        pack_data = {
            "email": email,
            "url": url,
            "overall": audit.get("overall"),
            "grade": audit.get("overall_grade"),
            "teaser": teaser["prompt_md"] if teaser else None,
            "prompts": [p["prompt_md"] for p in upsell],
        }
        pack_path = packs_dir / f"{token}.json"
        with open(pack_path, "w") as f:
            json.dump(pack_data, f, indent=2)

    return {
        "count": len(need_prompts),
        "teaser": teaser,
        "full_pack": upsell,
        "pack_path": str(pack_path) if pack_path else None,
    }


def load_prompt_pack(token):
    """Load a saved prompt pack by token (for serving after purchase)."""
    path = PACKS_DIR / f"{token}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def generate_prompt_pack_text(prompt_dicts):
    """Format a list of prompt dicts into a single markdown document."""
    blocks = []
    for p in prompt_dicts:
        blocks.append(f"## {p['label']}\n\n{p['prompt_md']}")
    return "\n\n---\n\n".join(blocks)
