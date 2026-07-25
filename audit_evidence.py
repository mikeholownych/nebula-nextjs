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

import json
import logging
import re
from datetime import datetime, timezone
from urllib.parse import urlparse
from bs4 import BeautifulSoup

LOGGER = logging.getLogger(__name__)
MAX_EVIDENCE_FIELD = 500
VALID_CONFIDENCE = {"definitive", "high", "contextual", "unavailable"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _bounded(value, limit: int = MAX_EVIDENCE_FIELD) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _selector(element) -> str:
    """Return a bounded DOM path without interpolating attacker-controlled attributes."""
    if not element or not getattr(element, "name", None):
        return "N/A"
    parts = []
    current = element
    while current and getattr(current, "name", None) and len(parts) < 8:
        siblings = current.parent.find_all(current.name, recursive=False) if current.parent else []
        index = siblings.index(current) + 1 if current in siblings and len(siblings) > 1 else None
        parts.append(f"{current.name}:nth-of-type({index})" if index else current.name)
        current = current.parent
        if getattr(current, "name", None) == "[document]":
            break
    return _bounded(" > ".join(reversed(parts)), 240)


def _sanitize_evidence(evidence: dict) -> dict:
    confidence = str(evidence.get("confidence") or "unavailable").lower()
    if confidence not in VALID_CONFIDENCE:
        confidence = "unavailable"
    if confidence == "definitive":
        confidence = "contextual"
    return {
        "measured": _bounded(evidence.get("measured")),
        "required": _bounded(evidence.get("required")),
        "delta": _bounded(evidence.get("delta")),
        "selector": _bounded(evidence.get("selector") or "N/A", 240),
        "confidence": confidence,
        "timestamp": _bounded(evidence.get("timestamp") or _now_iso(), 32),
    }


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
    declarations = {}
    for declaration in style.split(";"):
        name, separator, value = declaration.partition(":")
        if separator:
            declarations[name.strip().lower()] = value.strip()

    def _hex_value(value: str) -> str | None:
        match = re.search(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b", value)
        return match.group(0) if match else None

    foreground = _hex_value(declarations.get("color", ""))
    background = _hex_value(
        declarations.get("background-color", declarations.get("background", ""))
    )
    return foreground, background


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
    selector = _selector(h1)
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
    action_terms = ("buy", "get", "start", "checkout", "order", "signup", "sign-up", "book", "try", "run")
    all_ctas = [el for el in soup.find_all(["a", "button"]) if el.get_text(" ", strip=True)]
    candidates = [
        el for el in all_ctas
        if el.name == "button"
        or any(term in str(el.get("href") or "").lower() for term in action_terms)
        or any(term in el.get_text(" ", strip=True).lower() for term in action_terms)
    ]
    if not all_ctas:
        return {
            "measured": "No button or link text found in fetched source HTML",
            "required": "At least one action-oriented CTA in the rendered primary journey",
            "delta": "No source-level CTA candidate; client-rendered controls remain unverified",
            "selector": "N/A",
            "confidence": "contextual",
            "timestamp": ts,
        }

    el = (candidates or all_ctas)[0]
    text = _bounded(el.get_text(" ", strip=True), 120)
    weak_verbs = {"learn more", "click here", "submit", "go", "next", "continue", "ok"}
    fg, bg = _extract_inline_colors(el)
    if fg and bg:
        l1 = _hex_to_relative_luminance(fg)
        l2 = _hex_to_relative_luminance(bg)
        if l1 is not None and l2 is not None:
            ratio = _contrast_ratio(l1, l2)
            declarations = {}
            for declaration in str(el.get("style") or "").split(";"):
                name, separator, value = declaration.partition(":")
                if separator:
                    declarations[name.strip().lower()] = value.strip().lower()
            size_match = re.search(r"([\d.]+)px", declarations.get("font-size", ""))
            size_px = float(size_match.group(1)) if size_match else 0.0
            weight_text = declarations.get("font-weight", "")
            weight = int(weight_text) if weight_text.isdigit() else (700 if weight_text in {"bold", "bolder"} else 400)
            is_large = size_px >= 24 or (size_px >= 18.66 and weight >= 700)
            threshold = 3.0 if is_large else 4.5
            passes = ratio >= threshold
            return {
                "measured": f'CTA "{text}" — inline fg: {fg}, bg: {bg}, contrast: {ratio:.2f}:1',
                "required": f"Source-level inline styles: {threshold:.1f}:1 minimum for {'large' if is_large else 'normal'} text; computed-style browser audit required",
                "delta": (
                    f"Passes source-level threshold by {ratio - threshold:.2f}; rendered/computed contrast remains unverified"
                    if passes else
                    f"Source-level contrast is {threshold - ratio:.2f} below threshold; confirm with computed-style browser audit"
                ),
                "selector": _selector(el),
                "confidence": "high",
                "timestamp": ts,
            }

    weak = text.lower() in weak_verbs
    return {
        "measured": f'CTA source text: "{text}"; no complete inline foreground/background pair',
        "required": "Action-specific text plus computed-style contrast and rendered placement inspection",
        "delta": (
            "Generic CTA wording detected; rendered contrast and placement remain unverified"
            if weak else
            "Source text is action-oriented; rendered contrast and placement remain unverified"
        ),
        "selector": _selector(el),
        "confidence": "contextual",
        "timestamp": ts,
    }


def _evidence_above_fold(soup: BeautifulSoup, dim: dict, html_text: str) -> dict:
    ts = _now_iso()
    first_3k = html_text[:3000]
    early_soup = BeautifulSoup(first_3k, "html.parser")
    has_h1 = bool(early_soup.find("h1"))
    has_cta = bool(early_soup.find(["button", "a"]))
    has_price = bool(re.search(r'\$[\d,]+|from \$|pricing', early_soup.get_text(" "), re.IGNORECASE))

    missing = []
    if not has_h1:
        missing.append("H1 headline")
    if not has_cta:
        missing.append("primary CTA")
    if not has_price:
        missing.append("price/offer signal")

    if not missing:
        return {
            "measured":   "Early HTML proxy: H1, CTA, and price signal present in first 3,000 source chars",
            "required":   "Rendered viewport inspection is required; source order is not a rendered viewport measurement",
            "delta":      "No source-order gap detected — visual hierarchy remains unverified",
            "selector":   "N/A",
            "confidence": "contextual",
            "timestamp":  ts,
        }
    return {
        "measured":   f"Early HTML proxy missing: {', '.join(missing)} in first 3,000 source chars",
        "required":   "Rendered viewport inspection is required; source order is not a rendered viewport measurement",
        "delta":      f"Source order suggests missing {' or '.join(missing)}; rendered position remains unverified",
        "selector":   "N/A",
        "confidence": "contextual",
        "timestamp":  ts,
    }


def _evidence_social_proof(soup: BeautifulSoup, dim: dict, lower: str) -> dict:
    ts = _now_iso()
    trust_terms = ["testimonial", "review", "customer", "trusted", "case study", "guarantee", "results"]
    claimed = [term for term in trust_terms if term in lower]
    marker_patterns = {
        "review count": r"\b\d+\s+(?:reviews?|customers?|clients?|users?)\b",
        "rating": r"\b\d(?:\.\d)?\s*(?:/\s*5|stars?)\b",
        "third-party platform": r"\b(?:trustpilot|g2\.com|capterra|clutch|google reviews)\b",
        "testimonial markup": r"(?:testimonial|review)[-_ ](?:card|quote|author)",
    }
    markers = [name for name, pattern in marker_patterns.items() if re.search(pattern, lower, re.IGNORECASE)]
    return {
        "measured": f"Fetched source trust terms: {', '.join(claimed[:5]) or 'none'}; recognized proof markers: {', '.join(markers) or 'none'}",
        "required": "Rendered proof presence, placement, identity, and authenticity require browser/content review",
        "delta": "Static source markers only; no visitor-impact or authenticity conclusion is made",
        "selector": "N/A",
        "confidence": "contextual",
        "timestamp": ts,
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
    html_kib = len(html_text.encode("utf-8")) / 1024
    # Try to extract PageSpeed score from issue text
    ps_match = re.search(r'Lighthouse performance:\s*(\d+)/100', dim.get("issue", ""))
    fcp_match = re.search(r'FCP[:\s]+([\d.]+)\s*s', dim.get("issue", ""))

    if ps_match:
        score_val = int(ps_match.group(1))
        threshold = 70
        return {
            "measured":   f"Lighthouse mobile performance: {score_val}/100" + (f", FCP: {fcp_match.group(1)}s" if fcp_match else ""),
            "required":   "Target ≥70/100 Lighthouse mobile performance; Core Web Vitals require separate metrics",
            "delta":      (f"{threshold - score_val} points below target" if score_val < threshold else f"{score_val - threshold} points above target"),
            "selector":   "N/A — page-level metric",
            "confidence": "definitive",
            "timestamp":  ts,
        }
    return {
        "measured":   f"Fetched HTML payload: {html_kib:.1f} KiB; no PageSpeed score present in finding",
        "required":   "HTML-size heuristic ≤120 KiB; target Lighthouse mobile ≥70 when measured",
        "delta":      "Performance unavailable; payload heuristic within range" if html_kib < 120 else f"Payload heuristic exceeds 120 KiB by {html_kib - 120:.1f} KiB",
        "selector":   "N/A",
        "confidence": "contextual",
        "timestamp":  ts,
    }


def _evidence_ad_signals(soup: BeautifulSoup, dim: dict, lower: str) -> dict:
    ts = _now_iso()
    checks = {
        "Facebook Pixel initializer": bool(re.search(r"\bfbq\s*\(|connect\.facebook\.net/.+fbevents", lower)),
        "GA4 initializer or measurement ID": bool(re.search(r"\bgtag\s*\(|['\"]g-[a-z0-9]{6,}['\"]", lower)),
        "UTM-bearing link": bool(soup.find("a", href=re.compile(r"[?&]utm_(?:source|medium|campaign)=", re.IGNORECASE))),
        "explicit conversion call": bool(re.search(r"(?:fbq|gtag)\s*\([^\n]{0,120}(?:purchase|generate_lead|conversion|completeregistration)", lower)),
    }
    present = [name for name, detected in checks.items() if detected]
    absent = [name for name, detected in checks.items() if not detected]
    return {
        "measured": f"Fetched source artifacts present: {', '.join(present) or 'none'}; not observed: {', '.join(absent) or 'none'}",
        "required": "Runtime tag firing, consent behavior, event payloads, server-side tracking, and confirmation routes require live protocol inspection",
        "delta": f"{len(absent)}/4 source artifacts not observed; absence from static HTML is not proof of missing tracking",
        "selector": "N/A",
        "confidence": "contextual",
        "timestamp": ts,
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
    elif len(meta_desc) > 155:
        issues.append(f"Meta description {len(meta_desc)} chars (heuristic max 155)")

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
        "required":   "Editorial heuristics: title 30–60 chars, description 120–155 chars; rendered heading structure requires accessibility inspection",
        "delta":      "; ".join(issues) if issues else "Within source-level heuristic ranges",
        "selector":   "head > title, head > meta[name='description'], h1",
        "confidence": "contextual",
        "timestamp":  ts,
    }


def _evidence_ai_readiness(soup: BeautifulSoup, dim: dict) -> dict:
    ts = _now_iso()
    scripts = soup.find_all("script", type="application/ld+json")
    valid_jsonld = 0
    for script in scripts:
        try:
            parsed = json.loads(script.string or script.get_text() or "")
            if isinstance(parsed, (dict, list)):
                valid_jsonld += 1
        except (json.JSONDecodeError, TypeError):
            continue

    og_props = ["og:title", "og:description", "og:image", "og:url", "og:type"]
    og_found = []
    for prop in og_props:
        tag = soup.find("meta", property=prop)
        if tag and str(tag.get("content") or "").strip():
            og_found.append(prop)

    canonical_tag = soup.find("link", rel=lambda value: value and "canonical" in value)
    canonical_href = str(canonical_tag.get("href") or "").strip() if canonical_tag else ""
    parsed_canonical = urlparse(canonical_href)
    canonical_valid = parsed_canonical.scheme in {"http", "https"} and bool(parsed_canonical.netloc)
    return {
        "measured": f"valid JSON-LD: {valid_jsonld}/{len(scripts)} block(s) | OpenGraph: {len(og_found)}/5 non-empty tags | Canonical: {'present' if canonical_valid else 'absent'}",
        "required": "Parseable JSON-LD, non-empty OpenGraph values, and an absolute HTTP(S) canonical; citation eligibility still requires external validation",
        "delta": "Static metadata validation only; search-engine ingestion and AI citation are not inferred",
        "selector": "N/A",
        "confidence": "contextual",
        "timestamp": ts,
    }


# ── Local Business GBP Products ────────────────────────────────────────────

def _evidence_local_gbp(html_text: str, lower: str) -> dict:
    """Evidence for local business GBP product gap detection."""
    ts = _now_iso()

    # Detect which local signals fired
    signals_found = []
    if re.search(r'\d{1,5}\s+[\w\s]+(?:st|ave|blvd|rd|dr|way|ln|ct|pl|ste|unit)\b', lower):
        signals_found.append("physical address")
    if re.search(r'tel:|call\s+us|\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4}', lower):
        signals_found.append("phone number")
    if re.search(r'maps\.google\.com|google\.com/maps|goo\.gl/maps|iframe.*maps', lower):
        signals_found.append("Google Maps embed")
    business_types = r'\b(salon|spa\b|clinic|dental|lawyer|attorney|restaurant|caf[ée]|gym|plumb(?:er|ing)|roofer|roofing|hvac|electrician|car repair|pet groomer|veterinarian|photographer|wedding|florist|bakery|landscaping|cleaning service|painting contractor|flooring|tile installer|furniture store)\b'
    location_words = r'\b(toronto|vancouver|calgary|ottawa|montreal|dallas|fort worth|houston|austin|chicago|new york|los angeles|miami|seattle|denver|atlanta|boston|phoenix|san diego|near\s+me|nearby|our\s+location|visit\s+us|directions)\b'
    if re.search(business_types, lower) and re.search(location_words, lower):
        signals_found.append("location + business type match")

    # Check for existing GBP/schema presence
    has_schema = bool(re.search(r'"@type"\s*:\s*"(LocalBusiness|Store|Restaurant|HealthAndBeautyBusiness)"', html_text))
    has_product_schema = bool(re.search(r'"@type"\s*:\s*"Product"|AggregateOffer', html_text))

    return {
        "measured": f"Local signals detected: {', '.join(signals_found) or 'none'} | Schema LocalBusiness: {'present' if has_schema else 'absent'} | Product schema: {'present' if has_product_schema else 'absent'}",
        "required": "Local businesses should list top services/products in Google Business Profile dashboard to surface pricing in SERPs",
        "delta": f"{len(signals_found)} local signals confirmed; GBP product listings not detected in source HTML or schema",
        "selector": "N/A",
        "confidence": "contextual",
        "timestamp": ts,
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
    "local_gbp":       lambda soup, dim, html, lower: _evidence_local_gbp(html, lower),
}


def enrich_findings_with_evidence(opp_matrix: list, html_text: str) -> list:
    """Attach bounded source evidence and create an independent CTA contrast finding."""
    source_findings = [dict(item) for item in (opp_matrix or []) if isinstance(item, dict)]
    analysis_html = str(html_text or "")[:2_000_000]
    if not analysis_html:
        return [
            {
                **finding,
                "evidence": _sanitize_evidence({
                    "measured": "Evidence unavailable for this finding",
                    "required": "Fetched source HTML is required",
                    "delta": "No evidence claim emitted",
                    "selector": "N/A",
                    "confidence": "unavailable",
                    "timestamp": _now_iso(),
                }),
            }
            for finding in source_findings
        ]

    soup = BeautifulSoup(analysis_html, "html.parser")
    lower = analysis_html.lower()

    if not any(finding.get("key") == "cta" for finding in source_findings):
        cta_evidence = _sanitize_evidence(_evidence_cta(soup, {}))
        if cta_evidence["delta"].lower().startswith("source-level contrast is"):
            source_findings.append({
                "key": "cta",
                "label": "CTA Contrast",
                "impact": 8,
                "effort": 2,
                "quadrant": "quick_win",
                "score": 4,
                "issue": "CTA source-level contrast is below the applicable inline-style threshold.",
                "fix": "Change CTA foreground/background colors, then verify computed contrast in a rendered browser audit.",
                "evidence": cta_evidence,
            })

    enriched = []
    for original in source_findings:
        finding = {
            key: (_bounded(value, 1_000) if isinstance(value, str) else value)
            for key, value in original.items()
        }
        builder = EVIDENCE_BUILDERS.get(str(finding.get("key") or ""))
        raw_evidence = finding.get("evidence")
        if builder and not isinstance(raw_evidence, dict):
            try:
                finding["evidence"] = _sanitize_evidence(
                    builder(soup, finding, analysis_html, lower)
                )
            except Exception:
                LOGGER.exception("Evidence builder failed for key=%s", finding.get("key"))
                finding["evidence"] = _sanitize_evidence({
                    "measured": "Evidence unavailable for this finding",
                    "required": "Evidence extraction must complete before a measurement claim is shown",
                    "delta": "No evidence claim emitted",
                    "selector": "N/A",
                    "confidence": "unavailable",
                    "timestamp": _now_iso(),
                })
        elif isinstance(raw_evidence, dict):
            finding["evidence"] = _sanitize_evidence(raw_evidence)
        enriched.append(finding)
    return enriched
