import re
from typing import Optional

import httpx

TIMEOUT = 10.0

SignalResult = dict  # {"passed": bool, "score": float, "issue": str | None, "evidence": str | None}


def _result(passed: bool, score: float, issue: Optional[str] = None, evidence: Optional[str] = None) -> SignalResult:
    return {"passed": passed, "score": score, "issue": issue, "evidence": evidence}


def _assert_public_url(url: str) -> None:
    """SEC-P2-3: block loopback/private/metadata targets before fetching.

    Mirrors the Next.js ssrf-guard (best-effort application boundary).
    """
    from urllib.parse import urlparse
    import ipaddress
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"URL scheme not allowed: {parsed.scheme}")
    host = parsed.hostname or ""
    if not host:
        raise ValueError("URL has no hostname")
    try:
        infos = {ai[4][0] for ai in __import__("socket").getaddrinfo(host, None)}
    except Exception as exc:
        raise ValueError(f"URL host could not be resolved: {host}") from exc
    for ip in infos:
        addr = ipaddress.ip_address(ip)
        if (
            addr.is_private or addr.is_loopback or addr.is_link_local
            or addr.is_reserved or addr.is_multicast or addr.is_unspecified
        ):
            raise ValueError(f"URL resolves to blocked address: {ip}")


async def _fetch_html(url: str) -> str:
    _assert_public_url(url)
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
        current = url
        for _hop in range(5):  # bounded redirect chain, each hop re-validated
            resp = await client.get(current, headers={"User-Agent": "NebulaVerifier/1.0"})
            if resp.is_redirect:
                location = resp.headers.get("Location")
                if not location:
                    raise ValueError("redirect missing Location")
                from urllib.parse import urljoin
                current = urljoin(current, location)
                _assert_public_url(current)
                continue
            resp.raise_for_status()
            return resp.text
        raise ValueError("too many redirects")


async def verify_headline(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        match = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.IGNORECASE | re.DOTALL)
        if not match:
            return _result(False, 0.0, "No H1 tag found on page")
        text = re.sub(r"<[^>]+>", "", match.group(1)).strip()
        if len(text) < 6:
            return _result(False, 0.3, f"H1 too short ({len(text)} chars)", text)
        if len(text) > 80:
            return _result(False, 0.5, f"H1 too long ({len(text)} chars)", text[:80])
        value_keywords = re.compile(
            r"\b(get|grow|boost|save|increase|reduce|stop|start|discover|transform|"
            r"unlock|achieve|improve|build|create|launch|scale|earn|free|fast|easy|"
            r"proven|guaranteed|without|never|always|fix|find|protect|manage|compare)\b", re.IGNORECASE
        )
        if not value_keywords.search(text):
            return _result(False, 0.6, "H1 lacks a verb or value-prop keyword", text)
        return _result(True, 1.0, None, text)
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_cta(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        cta_tags = re.findall(r"<(button|a)\b[^>]*>(.*?)</\1>", html, flags=re.IGNORECASE | re.DOTALL)
        action_verb_pattern = re.compile(
            r"\b(get|start|try|buy|sign\s*up|book|schedule|claim|download|join|subscribe|order|reserve|request|apply|explore|see|compare|fix|run|audit)\b",
            re.IGNORECASE
        )
        found_actions = []
        for _, inner in cta_tags:
            inner_text = re.sub(r"<[^>]+>", "", inner).strip()
            match = action_verb_pattern.search(inner_text)
            if match:
                found_actions.append(match.group(0).lower())
        if not found_actions:
            return _result(False, 0.0, "No CTA buttons/links with action words found")
        evidence = ", ".join(set(found_actions[:5]))
        return _result(True, 1.0, None, f"Found action words: {evidence}")
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_above_fold(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        body_match = re.search(r"<body[^>]*>(.*)", html, re.IGNORECASE | re.DOTALL)
        if not body_match:
            return _result(False, 0.0, "No body tag found")
        
        # Check within the main hero content or strip header from body
        main_match = re.search(r"<main[^>]*>(.*)", html, re.IGNORECASE | re.DOTALL)
        raw_content = main_match.group(1) if main_match else re.sub(r"<header\b.*?</header>", "", body_match.group(1), flags=re.IGNORECASE | re.DOTALL)
        clean_content = re.sub(r"<(script|style|svg)\b.*?</\1>", "", raw_content, flags=re.IGNORECASE | re.DOTALL)
        above_fold = clean_content[:3500]

        has_h1 = bool(re.search(r"<h1\b", above_fold, re.IGNORECASE))
        cta_tags = re.findall(r"<(button|a)\b[^>]*>(.*?)</\1>", above_fold, flags=re.IGNORECASE | re.DOTALL)
        action_verb_pattern = re.compile(
            r"\b(get|start|try|buy|sign\s*up|book|schedule|view|run|audit|see|claim|order|explore|compare|discover|fix|download)\b",
            re.IGNORECASE
        )
        has_cta = False
        for _, inner in cta_tags:
            inner_text = re.sub(r"<[^>]+>", "", inner).strip()
            if action_verb_pattern.search(inner_text):
                has_cta = True
                break

        if has_h1 and has_cta:
            return _result(True, 1.0, None, "H1 and CTA present above the fold")
        issues = []
        if not has_h1:
            issues.append("H1 not in first 2000 chars")
        if not has_cta:
            issues.append("CTA not in first 2000 chars")
        return _result(False, 0.5 if (has_h1 or has_cta) else 0.0, "; ".join(issues))
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_social_proof(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        markers = [
            (r"<blockquote", "blockquote"),
            (r"testimonial", "testimonial keyword"),
            (r"(\d+)\s*\+?\s*(reviews?|ratings?|customers?|clients?|users?)", "review count"),
            (r"★|☆|star-rating|star_rating", "star ratings"),
            (r"logo-?(?:strip|bar|wall|grid|carousel)", "logo strip"),
            (r"as\s*(?:seen|featured)\s*(?:in|on)", "press mentions"),
        ]
        found = []
        for pattern, label in markers:
            if re.search(pattern, html, re.IGNORECASE):
                found.append(label)
        if found:
            return _result(True, 1.0, None, f"Found: {', '.join(found)}")
        return _result(False, 0.0, "No social proof markers found")
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_load_speed(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        html_bytes = len(html.encode("utf-8", errors="ignore"))
        html_kib = html_bytes / 1024
        if html_kib < 200:
            return _result(True, 0.8, None, f"HTML {html_kib:.0f} KiB")
        return _result(False, 0.5, f"HTML is {html_kib:.0f} KiB", f"{html_kib:.0f} KiB")
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_mobile(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        viewport = re.search(
            r'<meta\s+[^>]*name=["\']viewport["\'][^>]*>', html, re.IGNORECASE
        )
        if viewport:
            return _result(True, 1.0, None, "Viewport meta tag present")
        return _result(False, 0.0, "Missing viewport meta tag")
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_ad_signals(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        desc_match = re.search(
            r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']',
            html, re.IGNORECASE
        )
        if not desc_match:
            desc_match = re.search(
                r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']description["\']',
                html, re.IGNORECASE
            )
        if not desc_match:
            return _result(False, 0.0, "No meta description found")
        desc = desc_match.group(1).strip()
        length = len(desc)
        if 120 <= length <= 160:
            return _result(True, 1.0, None, f"Meta description: {length} chars")
        if length < 120:
            return _result(False, 0.5, f"Meta description too short ({length} chars)", desc[:80])
        return _result(False, 0.5, f"Meta description too long ({length} chars)", desc[:80])
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_seo_foundations(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        checks = {}
        checks["title"] = bool(re.search(r"<title[^>]*>.+?</title>", html, re.IGNORECASE | re.DOTALL))
        checks["meta_desc"] = bool(re.search(r'<meta\s+[^>]*name=["\']description["\']', html, re.IGNORECASE))
        checks["canonical"] = bool(re.search(r'<link\s+[^>]*rel=["\']canonical["\']', html, re.IGNORECASE))
        checks["h1"] = bool(re.search(r"<h1\b", html, re.IGNORECASE))
        passed_count = sum(checks.values())
        all_passed = passed_count == 4
        missing = [k for k, v in checks.items() if not v]
        if all_passed:
            return _result(True, 1.0, None, "All SEO foundations present")
        score = passed_count / 4.0
        return _result(False, score, f"Missing: {', '.join(missing)}")
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


async def verify_ai_readiness(url: str, html: Optional[str] = None) -> SignalResult:
    try:
        if html is None:
            html = await _fetch_html(url)
        checks = {}
        checks["json_ld"] = bool(re.search(
            r'<script\s+[^>]*type=["\']application/ld\+json["\']', html, re.IGNORECASE
        ))
        headings = re.findall(r"<(h[1-6])\b", html, re.IGNORECASE)
        if headings:
            levels = [int(h[1]) for h in headings]
            checks["heading_hierarchy"] = levels[0] == 1 and all(
                levels[i] - levels[i - 1] <= 1 for i in range(1, len(levels))
            )
        else:
            checks["heading_hierarchy"] = False
        passed_count = sum(checks.values())
        if passed_count == 2:
            return _result(True, 1.0, None, "JSON-LD and clean heading hierarchy present")
        missing = [k.replace("_", " ") for k, v in checks.items() if not v]
        return _result(False, passed_count / 2.0, f"Missing: {', '.join(missing)}")
    except Exception as e:
        return _result(False, 0.0, f"Fetch failed: {str(e)[:100]}")


SIGNAL_VERIFIERS = {
    "headline": verify_headline,
    "cta": verify_cta,
    "above_fold": verify_above_fold,
    "social_proof": verify_social_proof,
    "mobile": verify_mobile,
    "load_speed": verify_load_speed,
    "ad_signals": verify_ad_signals,
    "seo_foundations": verify_seo_foundations,
    "ai_readiness": verify_ai_readiness,
}


async def verify_signal(signal_key: str, url: str, html: Optional[str] = None) -> SignalResult:
    verifier = SIGNAL_VERIFIERS.get(signal_key)
    if not verifier:
        return _result(False, 0.0, f"Unknown signal: {signal_key}")
    return await verifier(url, html)
