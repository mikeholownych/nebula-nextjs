"""
audit_evidence.py — Evidence layer for Nebula audit findings.

Enriches each finding in the opp_matrix with a structured evidence block:
  {
    "measured":   str   — what was actually observed/computed
    "required":   str   — the standard it must meet
    "delta":      str   — the gap between measured and required
    "selector":   str   — CSS selector or DOM path to the element (if applicable)
    "confidence": str   — "definitive" | "high" | "contextual"
    "timestamp":  str   — ISO8601 UTC
  }

Called by score_audit() after the opp_matrix is built.
Adds no new network calls — operates on the already-fetched soup + audit data.
"""

import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Colour contrast helpers ────────────────────────────────────────────────────

def _hex_to_relative_luminance(hex_color: str) -> float | None:
    """Return WCAG relative luminance for a hex colour string, or None."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) not in (3, 6):
        return None
    if len(hex_color) == 3:
        hex_color = "".join(c * 2 for c in hex_color)
    try:
        r, g, b = (int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    except ValueError:
        return None
    def _linearise(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = _linearise(r), _linearise(g), _linearise(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contrast_ratio(l1: float, l2: float) -> float:
    lighter = max(l1, l2)
    darker  = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def _extract_inline_colors(element) -> tuple[str | None, str | None]:
    """
    Try to extract fg/bg hex colours from an element's inline style.
    Returns (fg_hex, bg_hex) — either may be None.
    """
    style = element.get("style", "") if element else ""
    fg = re.search(r'color\s*:\s*(#[0-9a-fA-F]{3,6})', style)
    bg = re.search(r'background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})', style)
    return (fg.group(1) if fg else None, bg.group(1) if bg else None)


# ── Per-dimension evidence builders ───────────────────────────────────────────

def _evidence_headline(soup: BeautifulSoup, dim: dict) -> dict:
    h1 = soup.find("h1")
    if not h1:
        return {
            "measured":   "No <h1> tag found in document",
            "required":   "Exactly one <h1> containing the primary value proposition (12–90 chars)",
            "delta":      "Missing entirely",
            "selector":   "h1",
            "confidence": "definitive",
            "timestamp":  _now_iso(),
        }
    txt = h1.get_text(strip=True)
    length = len(txt)
    selector = f"h1:first-of-type"
    if length < 12:
        return {
            "measured":   f'<h1> text: "{txt}" ({length} chars)',
            "required":   "12–90 chars — enough to convey a specific value proposition",
            "delta":      f"{12 - length} chars below minimum — too short to communicate benefit",
            "selector":   selector,
            "confidence": "definitive",
            "timestamp":  _now_iso(),
        }
    if length > 90:
        return {
            "measured":   f'<h1> text: "{txt[:80]}…" ({length} chars)',
            "required":   "12–90 chars — above 90 dilutes the primary message",
            "delta":      f"{length - 90} chars above maximum",
            "selector":   selector,
            "confidence": "high",
            "timestamp":  _now_iso(),
        }
    return {
        "measured":   f'<h1>: "{txt[:80]}" ({length} chars)',
        "required":   "12–90 chars with clear value proposition",
        "delta":      "Within range — issue is likely specificity or message match",
        "selector":   selector,
        "confidence": "contextual",
        "timestamp":  _now_iso(),
    }


def _evidence_cta(soup: BeautifulSoup, dim: dict) -> dict:
    ts = _now_iso()
    # Find all primary CTA candidates
    cta_elements = soup.find_all("button") + soup.find_all(
        "a", href=lambda h: h and any(
            x in h for x in ["buy", "get", "start", "checkout", "order", "signup", "sign-up"]
        )
    )
    weak_verbs = {"learn more", "click here", "submit", "go", "next", "continue", "ok"}

    if not cta_elements:
        # Fallback: any <a> or <button>
        all_ctas = [(el.get_text(strip=True), el) for el in
                    soup.find_all(["a", "button"]) if el.get_text(strip=True)]
        if not all_ctas:
            return {
                "measured":   "No <button> or <a> elements found",
                "required":   "At least one action-oriented CTA above the fold",
                "delta":      "No clickable CTA present",
                "selector":   "button, a",
                "confidence": "definitive",
                "timestamp":  ts,
            }
        # Check weak verbs
        weak = [(t, el) for t, el in all_ctas if t.lower() in weak_verbs]
        if weak:
            text, el = weak[0]
            fg, bg = _extract_inline_colors(el)
            contrast_note = ""
            if fg and bg:
                l1 = _hex_to_relative_luminance(fg)
                l2 = _hex_to_relative_luminance(bg)
                if l1 is not None and l2 is not None:
                    ratio = _contrast_ratio(l1, l2)
                    contrast_note = f" Contrast ratio: {ratio:.2f}:1 (WCAG AA requires 4.5:1)."
            return {
                "measured":   f'Primary CTA text: "{text}"{contrast_note}',
                "required":   "Action-specific verb (Get, Fix, Start, Book, Run) — not generic direction",
                "delta":      f'"{text}" signals no destination — visitors cannot predict what happens next',
                "selector":   el.name + (f'[href*="{el.get("href","")[:30]}"]' if el.get("href") else ""),
                "confidence": "high",
                "timestamp":  ts,
            }

    # CTA exists — check contrast if inline colours available
    el = cta_elements[0]
    text = el.get_text(strip=True)
    fg, bg = _extract_inline_colors(el)
    if fg and bg:
        l1 = _hex_to_relative_luminance(fg)
        l2 = _hex_to_relative_luminance(bg)
        if l1 is not None and l2 is not None:
            ratio = _contrast_ratio(l1, l2)
            if ratio < 4.5:
                return {
                    "measured":   f'CTA "{text}" — fg: {fg}, bg: {bg}, contrast: {ratio:.2f}:1',
                    "required":   "WCAG AA: 4.5:1 minimum contrast ratio for normal text",
                    "delta":      f"{4.5 - ratio:.2f} below WCAG AA minimum — low visibility on mobile",
                    "selector":   el.name + (f'[style*="color"]' if "color" in el.get("style","") else ""),
                    "confidence": "definitive",
                    "timestamp":  ts,
                }

    return {
        "measured":   f'CTA present: "{text[:60]}"',
        "required":   "Action-specific text, ≥4.5:1 contrast, visible above fold",
        "delta":      "Text acceptable — issue is likely placement or contrast (inline colours not available for full check)",
        "selector":   el.name,
        "confidence": "contextual",
        "timestamp":  ts,
    }


def _evidence_above_fold(soup: BeautifulSoup, dim: dict, html_text: str) -> dict:
    ts = _now_iso()
    first_3k = html_text[:3000]
    has_h1 = bool(soup.find("h1"))
    has_cta = bool(re.search(r'<button|href.*get|href.*start|href.*buy', first_3k, re.IGNORECASE))
    has_price = bool(re.search(r'\$[\d,]+|from \$|pricing', first_3k, re.IGNORECASE))

    missing = []
    if not has_h1:
        missing.append("H1 headline")
    if not has_cta:
        missing.append("primary CTA")
    if not has_price:
        missing.append("price/offer signal")

    if not missing:
        return {
            "measured":   "H1, CTA, and price signal all present in first 3,000 chars of HTML",
            "required":   "All three above the fold (≤3,000 chars / first viewport)",
            "delta":      "No structural gap detected — issue may be visual hierarchy",
            "selector":   "body > :first-child",
            "confidence": "contextual",
            "timestamp":  ts,
        }
    return {
        "measured":   f"First 3,000 chars of HTML missing: {', '.join(missing)}",
        "required":   "H1 + primary CTA + price/offer signal all within first viewport",
        "delta":      f"Visitor sees content without {' or '.join(missing)} — exits before scrolling",
        "selector":   "body",
        "confidence": "high",
        "timestamp":  ts,
    }


def _evidence_social_proof(soup: BeautifulSoup, dim: dict, lower: str) -> dict:
    ts = _now_iso()
    trust_words = ["testimonial", "review", "customer", "trusted", "case study", "guarantee", "results"]
    claimed = [w for w in trust_words if w in lower]
    _proof_re = (
        r'(\d+\s*(stars?|reviews?|customers?|clients?|companies|users?))'
        r'|(trustpilot|g2\.com|capterra|clutch|google reviews)'
        r'|(\u201c|\u2018|said|says|\u2014\s*[A-Z])'
    )
    shown = bool(re.search(_proof_re, lower, re.IGNORECASE))

    if claimed and not shown:
        return {
            "measured":   f"Trust language present ({', '.join(claimed[:3])}) — no concrete proof element found",
            "required":   "Named testimonial, star rating, review count, or third-party badge",
            "delta":      "Page asserts credibility without evidence — visitors treat this as a claim, not proof",
            "selector":   "[class*=testimonial], [class*=review], [class*=trust]",
            "confidence": "definitive",
            "timestamp":  ts,
        }
    if not claimed and not shown:
        return {
            "measured":   "No trust signals found anywhere on page",
            "required":   "At least one named testimonial, review count, or social proof element before the primary CTA",
            "delta":      "Visitors asked to buy from a stranger with no validation — conversion impact: high",
            "selector":   "body",
            "confidence": "definitive",
            "timestamp":  ts,
        }
    return {
        "measured":   "Concrete proof elements present",
        "required":   "Proof before primary CTA",
        "delta":      "Proof exists — check placement relative to CTA position",
        "selector":   "[class*=testimonial], [class*=review]",
        "confidence": "contextual",
        "timestamp":  ts,
    }


def _evidence_mobile(soup: BeautifulSoup, dim: dict, lower: str) -> dict:
    ts = _now_iso()
    viewport_tag = soup.find("meta", attrs={"name": "viewport"})
    has_viewport = viewport_tag is not None
    viewport_content = viewport_tag.get("content", "") if viewport_tag else ""
    has_width_device = "width=device-width" in viewport_content

    if not has_viewport:
        return {
            "measured":   "No <meta name='viewport'> tag found",
            "required":   '<meta name="viewport" content="width=device-width, initial-scale=1">',
            "delta":      "Without viewport meta, mobile browsers render desktop layout at ~980px — content is tiny",
            "selector":   "head > meta[name='viewport']",
            "confidence": "definitive",
            "timestamp":  ts,
        }
    if not has_width_device:
        return {
            "measured":   f'Viewport tag present but content="{viewport_content}"',
            "required":   "width=device-width in viewport content",
            "delta":      "Viewport declared but not device-width responsive",
            "selector":   "meta[name='viewport']",
            "confidence": "high",
            "timestamp":  ts,
        }
    return {
        "measured":   f'<meta name="viewport" content="{viewport_content}">',
        "required":   "width=device-width, initial-scale=1",
        "delta":      "Viewport correctly declared — issue is likely CSS media queries or tap target sizes",
        "selector":   "meta[name='viewport']",
        "confidence": "contextual",
        "timestamp":  ts,
    }


def _evidence_load_speed(dim: dict, html_text: str) -> dict:
    ts = _now_iso()
    html_kb = len(html_text) // 1024
    # Try to extract PageSpeed score from issue text
    ps_match = re.search(r'Lighthouse performance:\s*(\d+)/100', dim.get("issue", ""))
    fcp_match = re.search(r'FCP[:\s]+([\d.]+)\s*s', dim.get("issue", ""))

    if ps_match:
        score_val = int(ps_match.group(1))
        threshold = 90
        return {
            "measured":   f"Lighthouse mobile performance: {score_val}/100" + (f", FCP: {fcp_match.group(1)}s" if fcp_match else ""),
            "required":   "≥90/100 Lighthouse performance (Google 'Good' threshold)",
            "delta":      f"{threshold - score_val} points below 'Good' — affects Core Web Vitals ranking signal",
            "selector":   "N/A — page-level metric",
            "confidence": "definitive",
            "timestamp":  ts,
        }
    return {
        "measured":   f"HTML payload: {html_kb}KB (PageSpeed API unavailable for live score)",
        "required":   "HTML ≤120KB; Lighthouse mobile ≥90",
        "delta":      "Live speed score unavailable — HTML size within bounds" if html_kb < 120 else f"HTML {html_kb}KB exceeds 120KB threshold",
        "selector":   "N/A",
        "confidence": "contextual",
        "timestamp":  ts,
    }


def _evidence_ad_signals(soup: BeautifulSoup, dim: dict, lower: str) -> dict:
    ts = _now_iso()
    checks = {
        "Facebook Pixel":    bool(re.search(r'fbq\(|facebook\.net/tr|connect\.facebook\.net', lower)),
        "GA4":               bool(re.search(r'gtag\(|G-[A-Z0-9]{6,}|google-analytics', lower)),
        "UTM parameters":    bool(re.search(r'utm_source|utm_medium|utm_campaign', lower)),
        "Thank-you page":    bool(re.search(r'thank.?you|order.?confirm|success|receipt', lower)),
        "Conversion event":  bool(re.search(r'Purchase|CompleteRegistration|Lead|fbq\(.track', lower)),
    }
    missing = [k for k, v in checks.items() if not v]
    present = [k for k, v in checks.items() if v]
    if not missing:
        return {
            "measured":   f"All tracking signals detected: {', '.join(present)}",
            "required":   "Pixel, GA4, UTM, thank-you page, conversion event",
            "delta":      "None — tracking complete",
            "selector":   "script[src*=facebook], script[src*=google]",
            "confidence": "high",
            "timestamp":  ts,
        }
    return {
        "measured":   f"Present: {', '.join(present) or 'none'}. Missing: {', '.join(missing)}",
        "required":   "Facebook Pixel + GA4 + conversion event on thank-you page for accurate ROAS",
        "delta":      f"Missing {len(missing)}/5 signals — ad platform cannot optimise toward conversions",
        "selector":   "head > script",
        "confidence": "definitive",
        "timestamp":  ts,
    }


def _evidence_seo(soup: BeautifulSoup, dim: dict) -> dict:
    ts = _now_iso()
    title = (soup.title.get_text(strip=True) if soup.title else "")
    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_desc = meta_desc_tag.get("content", "").strip() if meta_desc_tag else ""
    h1 = (soup.find("h1").get_text(strip=True) if soup.find("h1") else "")
    h1_count = len(soup.find_all("h1"))

    issues = []
    if not title:
        issues.append("No <title> tag")
    elif len(title) < 30:
        issues.append(f"<title> only {len(title)} chars (min 30)")
    elif len(title) > 60:
        issues.append(f"<title> {len(title)} chars (truncated in SERP at 60)")

    if not meta_desc:
        issues.append("No meta description")
    elif len(meta_desc) < 120:
        issues.append(f"Meta description only {len(meta_desc)} chars (min 120)")

    if h1_count == 0:
        issues.append("No <h1>")
    elif h1_count > 1:
        issues.append(f"{h1_count} <h1> tags (must be exactly 1)")

    measured_parts = []
    if title:
        measured_parts.append(f'title: "{title[:50]}" ({len(title)} chars)')
    if meta_desc:
        measured_parts.append(f'meta desc: {len(meta_desc)} chars')
    if h1:
        measured_parts.append(f'h1: "{h1[:50]}"')
    measured_parts.append(f'h1 count: {h1_count}')

    return {
        "measured":   " | ".join(measured_parts) if measured_parts else "No SEO tags found",
        "required":   "<title> 30–60 chars; meta description 120–155 chars; exactly one <h1>",
        "delta":      "; ".join(issues) if issues else "Within spec",
        "selector":   "head > title, head > meta[name='description'], h1",
        "confidence": "definitive" if issues else "contextual",
        "timestamp":  ts,
    }


def _evidence_ai_readiness(soup: BeautifulSoup, dim: dict) -> dict:
    ts = _now_iso()
    scripts = soup.find_all("script", type="application/ld+json")
    has_jsonld = bool(scripts)
    og_props = ["og:title", "og:description", "og:image", "og:url", "og:type"]
    og_found = [p for p in og_props if soup.find("meta", property=p)]
    canonical = soup.find("link", rel="canonical")

    return {
        "measured":   (
            f"JSON-LD: {'present (' + str(len(scripts)) + ' block(s))' if has_jsonld else 'absent'} | "
            f"OpenGraph: {len(og_found)}/5 tags | "
            f"Canonical: {'present' if canonical else 'absent'}"
        ),
        "required":   "JSON-LD structured data + 5/5 OpenGraph tags + canonical URL for AI engine citation",
        "delta":      (
            f"Missing: "
            + (", ".join(filter(None, [
                "JSON-LD" if not has_jsonld else "",
                f"{5 - len(og_found)} OG tags" if len(og_found) < 5 else "",
                "canonical" if not canonical else "",
            ])) or "None")
        ),
        "selector":   "script[type='application/ld+json'], meta[property^='og:'], link[rel='canonical']",
        "confidence": "definitive",
        "timestamp":  ts,
    }


# ── Public interface ───────────────────────────────────────────────────────────

EVIDENCE_BUILDERS = {
    "headline":        lambda soup, dim, html, lower: _evidence_headline(soup, dim),
    "cta":             lambda soup, dim, html, lower: _evidence_cta(soup, dim),
    "above_fold":      lambda soup, dim, html, lower: _evidence_above_fold(soup, dim, html),
    "social_proof":    lambda soup, dim, html, lower: _evidence_social_proof(soup, dim, lower),
    "mobile":          lambda soup, dim, html, lower: _evidence_mobile(soup, dim, lower),
    "load_speed":      lambda soup, dim, html, lower: _evidence_load_speed(dim, html),
    "ad_signals":      lambda soup, dim, html, lower: _evidence_ad_signals(soup, dim, lower),
    "seo_foundations": lambda soup, dim, html, lower: _evidence_seo(soup, dim),
    "ai_readiness":    lambda soup, dim, html, lower: _evidence_ai_readiness(soup, dim),
}


def enrich_findings_with_evidence(opp_matrix: list, html_text: str) -> list:
    """
    Takes the opp_matrix from score_audit() and enriches each finding
    with a structured 'evidence' block. Returns the enriched list.
    """
    if not html_text or not opp_matrix:
        return opp_matrix

    soup = BeautifulSoup(html_text, "html.parser")
    lower = html_text.lower()
    enriched = []

    for finding in opp_matrix:
        key = finding.get("key", "")
        builder = EVIDENCE_BUILDERS.get(key)
        if builder:
            try:
                finding = dict(finding)
                finding["evidence"] = builder(soup, finding, html_text, lower)
            except Exception as exc:
                finding["evidence"] = {
                    "measured":   f"Evidence extraction failed: {exc}",
                    "required":   "N/A",
                    "delta":      "N/A",
                    "selector":   "N/A",
                    "confidence": "error",
                    "timestamp":  _now_iso(),
                }
        enriched.append(finding)

    return enriched
