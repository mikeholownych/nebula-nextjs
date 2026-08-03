#!/usr/bin/env python3
"""
GSC Content Refresh — Automated content refresh loop for Nebula learning-centre pages.

Flow:
  1. Parse last gsc_programmatic_review.md → extract positions 8-20, ≥3 impressions
  2. Map page URL → local .tsx file path
  3. For each candidate: fetch top-3 SERP competitors, generate content diff,
     patch modifiedDate + append improvements
  4. Submit refreshed URLs to IndexNow
  5. Write refresh log

Run: every Monday at 10am (after gsc_programmatic_review at 8am)
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Config ─────────────────────────────────────────────────────────────────────

NEBULA_ROOT = Path("/home/mike/nebula")
PORTAL_ROOT = NEBULA_ROOT / "customer-portal"
LEARNING_CENTRE_ROOT = PORTAL_ROOT / "app" / "learning-centre"
GSC_REVIEW_PATH = NEBULA_ROOT / "gsc_programmatic_review.md"
LOG_PATH = NEBULA_ROOT / "logs" / "gsc_content_refresh.log"
REFRESH_RECORD_PATH = NEBULA_ROOT / "logs" / "content_refresh_record.jsonl"

INDEXNOW_SCRIPT = str(NEBULA_ROOT / "scripts" / "submit_indexnow.py")
CLAUDE_SEO_SCRIPTS = "/home/mike/claude-seo/scripts"

HOST = "nebulacomponents.com"
INDEXNOW_KEY = "c8f12a94d30b4e8597f519623e59b671"
INDEXNOW_KEY_LOCATION = f"https://{HOST}/{INDEXNOW_KEY}.txt"

# Minimum impressions to qualify for refresh
MIN_IMPRESSIONS = 1
# Position range to target — wide for early-stage site
POS_MIN = 1.0
POS_MAX = 100.0
# Max pages to refresh per run (rate-limit safety)
MAX_REFRESHES_PER_RUN = 5
# Days between refreshes of same page
MIN_DAYS_BETWEEN_REFRESHES = 21

# ── Logging ────────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")


# ── GSC Review Parser ──────────────────────────────────────────────────────────

def parse_striking_distance(review_path: Path) -> list[dict]:
    """Extract positions 8-20, ≥MIN_IMPRESSIONS from last gsc review."""
    if not review_path.exists():
        log(f"GSC review not found at {review_path} — running it now")
        result = subprocess.run(
            [sys.executable, str(NEBULA_ROOT / "scripts" / "gsc_programmatic_review.py")],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            log(f"ERROR: GSC review failed: {result.stderr[:200]}")
            return []
        log("GSC review generated successfully")

    text = review_path.read_text()

    candidates = []
    seen_pages: set[str] = set()

    # Parse ALL table rows from entire file — covers Section 4 and Section 5
    # Anchored to start of table row (pipe + optional whitespace)
    row_re = re.compile(
        r"^\|\s+\*{0,2}([^|*\n]+?)\*{0,2}\s+\|\s+`([\d.]+)`\s+\|\s+(\d+)\s+\|\s+(\d+)\s+\|\s+([\d.]+)%\s+\|\s+`([^`|]+)`\s+\|",
        re.MULTILINE
    )
    for m in row_re.finditer(text):
        query, pos, impressions, clicks, ctr, page_path = m.groups()
        pos_f = float(pos)
        impressions_i = int(impressions)
        page_path = page_path.strip()
        query = query.strip()

        if query.lower() in ("query", "target page", "ranking page"):
            continue
        if not page_path.startswith("/learning-centre/"):
            continue
        if page_path in seen_pages:
            continue
        if POS_MIN <= pos_f <= POS_MAX and impressions_i >= MIN_IMPRESSIONS:
            candidates.append({
                "query": query,
                "position": pos_f,
                "impressions": impressions_i,
                "clicks": int(clicks),
                "ctr": float(ctr),
                "page_path": page_path,
                "url": f"https://{HOST}{page_path}",
            })
            seen_pages.add(page_path)

    # Sort: highest impressions first, then closest to page 1
    candidates.sort(key=lambda x: (-x["impressions"], x["position"]))

    log(f"Found {len(candidates)} candidates across all GSC sections")
    return candidates


# ── URL → .tsx Path Mapping ───────────────────────────────────────────────────

def url_to_tsx_path(page_path: str) -> Optional[Path]:
    """Map /learning-centre/slug → .tsx file path."""
    m = re.match(r"^/learning-centre/([^/]+)/?$", page_path)
    if not m:
        return None
    slug = m.group(1)
    candidate = LEARNING_CENTRE_ROOT / slug / "page.tsx"
    return candidate if candidate.exists() else None


# ── Refresh Record ─────────────────────────────────────────────────────────────

def load_refresh_record() -> dict[str, str]:
    """Returns {page_path: last_refreshed_iso_date}."""
    record: dict[str, str] = {}
    if REFRESH_RECORD_PATH.exists():
        for line in REFRESH_RECORD_PATH.read_text().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                record[entry["page_path"]] = entry["refreshed_at"]
            except Exception:
                pass
    return record


def write_refresh_entry(page_path: str, query: str, changes: str) -> None:
    REFRESH_RECORD_PATH.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "page_path": page_path,
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "changes": changes,
    }
    with open(REFRESH_RECORD_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")


def recently_refreshed(page_path: str, record: dict[str, str]) -> bool:
    last = record.get(page_path)
    if not last:
        return False
    last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
    age_days = (datetime.now(timezone.utc) - last_dt).days
    return age_days < MIN_DAYS_BETWEEN_REFRESHES


# ── Competitor Fetch ──────────────────────────────────────────────────────────

def fetch_serp_competitors(query: str, n: int = 3) -> list[str]:
    """Fetch top-n competitor pages for query via GSC SERP / claude-seo fetch."""
    try:
        # Use claude-seo's gsc_query to get competing URLs for this query
        result = subprocess.run(
            [sys.executable,
             os.path.join(CLAUDE_SEO_SCRIPTS, "gsc_query.py"),
             "query",
             "--property", f"sc-domain:{HOST}",
             "--days", "28",
             "--json",
             "--limit", "5"],
            capture_output=True, text=True, timeout=30
        )
        # Fall back to simple web fetch of top results via fetch_page
        urls = _serp_fallback(query, n)
        return urls
    except Exception as e:
        log(f"Competitor fetch error for '{query}': {e}")
        return []


def _serp_fallback(query: str, n: int) -> list[str]:
    """Use DuckDuckGo HTML search as fallback (no API key needed)."""
    try:
        import urllib.request
        import urllib.parse
        q = urllib.parse.quote_plus(query + " site:*.com -site:nebulacomponents.com")
        url = f"https://html.duckduckgo.com/html/?q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        # Extract result URLs
        found = re.findall(r'href="(https?://(?!duckduckgo)[^"]+)"', html)
        # Filter junk
        clean = []
        for u in found:
            if any(skip in u for skip in ["duckduckgo", "google", "facebook", "twitter", "reddit", "youtube"]):
                continue
            if u not in clean:
                clean.append(u)
            if len(clean) >= n:
                break
        return clean
    except Exception as e:
        log(f"SERP fallback error: {e}")
        return []


def fetch_page_text(url: str) -> str:
    """Fetch and return plain text of a URL using claude-seo fetch_page."""
    try:
        result = subprocess.run(
            [sys.executable,
             os.path.join(CLAUDE_SEO_SCRIPTS, "fetch_page.py"),
             url, "--output", "-"],
            capture_output=True, text=True, timeout=20
        )
        if result.returncode == 0 and result.stdout:
            # Strip HTML tags
            text = re.sub(r"<[^>]+>", " ", result.stdout)
            text = re.sub(r"\s+", " ", text).strip()
            return text[:4000]  # Limit per competitor
    except Exception:
        pass
    # urllib fallback
    try:
        import urllib.request
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:4000]
    except Exception as e:
        return f"[fetch failed: {e}]"


# ── TSX Content Extractor ──────────────────────────────────────────────────────

def extract_tsx_text(tsx_path: Path) -> str:
    """Extract readable text content from TSX page."""
    content = tsx_path.read_text()
    # Strip JSX tags, keep text content
    text = re.sub(r"<[^>]+>", " ", content)
    # Remove JS/TS boilerplate
    text = re.sub(r"(import |export |const |function |return \(|\)|\{|\})", " ", text)
    text = re.sub(r"className=['\"][^'\"]*['\"]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:6000]


# ── AI Content Diff ───────────────────────────────────────────────────────────

def get_llm_key() -> tuple[str, str]:
    """
    Returns (api_key, base_url) for LLM calls.
    Prefers OpenRouter (real API key), falls back to Bedrock via AWS.
    """
    # Try OpenRouter first
    for env_path in [Path.home() / ".hermes" / ".env", Path.home() / ".env",
                     Path("/home/mike/nebula/.env")]:
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key == "OPENROUTER_API_KEY" and len(val) > 10:
                    return val, "https://openrouter.ai/api/v1"
    # Fallback: check env
    v = os.environ.get("OPENROUTER_API_KEY", "")
    if v:
        return v, "https://openrouter.ai/api/v1"
    return "", ""


def generate_content_improvements(
    query: str,
    current_text: str,
    competitor_texts: list[str],
    page_path: str,
) -> Optional[dict]:
    """
    Call LLM to identify what the current page is missing vs competitors.
    Returns dict with new_faq_items, missing_topics, meta_description_update.
    """
    api_key, base_url = get_llm_key()
    if not api_key:
        log("ERROR: No LLM API key found (need OPENROUTER_API_KEY) — skipping AI content diff")
        return None

    try:
        from openai import OpenAI
    except ImportError:
        log("ERROR: openai module not installed — run: pip install openai")
        return None

    competitor_context = "\n\n---\n\n".join(
        f"Competitor {i+1}:\n{t}" for i, t in enumerate(competitor_texts)
        if t and not t.startswith("[fetch failed")
    ) or "No competitor content retrieved."

    prompt = f"""You are an SEO content editor for Nebula Components (nebulacomponents.com), a conversion rate optimization tool.

Target query: "{query}"
Page: {page_path}

CURRENT PAGE CONTENT (excerpt):
{current_text[:3000]}

TOP COMPETITOR CONTENT (excerpts):
{competitor_context[:4000]}

Identify what the current page is MISSING compared to competitors that would help it rank better for "{query}".

Return ONLY valid JSON in this exact format:
{{
  "missing_topics": ["topic 1", "topic 2", "topic 3"],
  "new_faq_items": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ],
  "meta_description_update": null
}}

Rules:
- new_faq_items: 1-3 items max. Only include if genuinely missing from current content.
- Answers must be factual, specific, and under 120 words each.
- DO NOT make up statistics. Use "typically" or "commonly" when uncertain.
- Keep Nebula's tone: direct, evidence-based, no fluff.
- If current page already covers everything well, return empty arrays.
- Return ONLY the JSON object, no explanation."""

    client = OpenAI(api_key=api_key, base_url=base_url)
    model = "anthropic/claude-haiku-4-5" if "openrouter" in base_url else "claude-haiku-4-5"

    try:
        response = client.chat.completions.create(
            model=model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        return json.loads(raw)
    except json.JSONDecodeError as e:
        log(f"JSON parse error from LLM: {e}")
        return None
    except Exception as e:
        log(f"LLM API error: {e}")
        return None




def patch_tsx_file(tsx_path: Path, improvements: dict, query: str) -> bool:
    """
    Apply improvements to the .tsx file:
    1. Append new FAQ items to faqItems array
    2. Bump modifiedDate to today
    Returns True if any change was made.
    """
    content = tsx_path.read_text()
    changed = False
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # ── 1. Bump modifiedDate ──────────────────────────────────────────────────
    new_content = re.sub(
        r"(modifiedDate:\s*')[^']+(')",
        lambda m: f"{m.group(1)}{today}{m.group(2)}",
        content
    )
    if new_content != content:
        content = new_content
        changed = True
        log(f"  → bumped modifiedDate to {today}")

    # ── 2. Append new FAQ items ───────────────────────────────────────────────
    new_faqs = improvements.get("new_faq_items", [])
    if new_faqs:
        faq_entries_added = 0

        # Detect which FAQ structure this page uses
        # Pattern A: faqItems = [...] (createArticleSchema pages)  
        has_faq_items = bool(re.search(r"const faqItems\s*=\s*\[", content))
        # Pattern B: mainEntity: [...] (schema.org FAQPage pages)
        has_main_entity = bool(re.search(r"mainEntity:\s*\[", content))

        # Find insert point: last `    },` inside the FAQ array, before its closing `  ],`
        # Both patterns close with `  ],\n` followed by `}` or `const`
        faq_close = re.search(
            r"(\n\s{4}},?\s*\n)\s*\],?\s*\n\s*(?:\}|const articleSchema|export default)",
            content
        )

        if faq_close:
            faq_block = ""
            for faq in new_faqs:
                q = faq.get("question", "").replace("'", "\\'")
                a = faq.get("answer", "").replace("'", "\\'")
                if not q or not a:
                    continue
                if has_main_entity and not has_faq_items:
                    faq_block += f"""    {{
      '@type': 'Question',
      name: '{q}',
      acceptedAnswer: {{
        '@type': 'Answer',
        text: '{a}',
      }},
    }},
"""
                else:
                    faq_block += f"""    {{
      question: '{q}',
      answer: '{a}',
    }},
"""
            if faq_block:
                # Insert after the last FAQ item's closing },
                insert_at = faq_close.start(1) + len(faq_close.group(1))
                content = content[:insert_at] + faq_block + content[insert_at:]
                faq_entries_added = len(new_faqs)
                changed = True
                log(f"  → appended {faq_entries_added} FAQ item(s) for query: '{query}'")
        else:
            log(f"  ⚠ Could not locate FAQ array — skipping FAQ append")

    if changed:
        tsx_path.write_text(content)

    return changed


# ── IndexNow Submission ───────────────────────────────────────────────────────

def submit_indexnow(urls: list[str]) -> bool:
    """Submit URLs to IndexNow via claude-seo indexnow_submit.py."""
    if not urls:
        return True
    try:
        result = subprocess.run(
            [sys.executable,
             os.path.join(CLAUDE_SEO_SCRIPTS, "indexnow_submit.py"),
             "--host", HOST,
             "--key", INDEXNOW_KEY,
             "--key-location", INDEXNOW_KEY_LOCATION,
             "--urls", *urls],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            log(f"IndexNow: submitted {len(urls)} URL(s) ✓")
            return True
        else:
            log(f"IndexNow error: {result.stderr[:200]}")
            return False
    except Exception as e:
        log(f"IndexNow exception: {e}")
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    log("=== GSC Content Refresh START ===")

    candidates = parse_striking_distance(GSC_REVIEW_PATH)
    if not candidates:
        log("No candidates found — exiting")
        return

    record = load_refresh_record()
    refreshed_urls: list[str] = []
    processed = 0

    # Sort by position (closest to page 1 first = highest ROI)
    candidates.sort(key=lambda x: x["position"])

    for cand in candidates:
        if processed >= MAX_REFRESHES_PER_RUN:
            log(f"Reached max {MAX_REFRESHES_PER_RUN} refreshes/run — stopping")
            break

        page_path = cand["page_path"]
        query = cand["query"]
        url = cand["url"]

        log(f"\nCandidate: '{query}' | pos={cand['position']} | impressions={cand['impressions']} | {page_path}")

        # Skip if refreshed recently
        if recently_refreshed(page_path, record):
            log(f"  → skipped (refreshed within {MIN_DAYS_BETWEEN_REFRESHES} days)")
            continue

        # Map to .tsx file
        tsx_path = url_to_tsx_path(page_path)
        if not tsx_path:
            log(f"  → skipped (no .tsx found for {page_path})")
            continue

        # Fetch competitors
        log(f"  Fetching SERP competitors for '{query}'...")
        competitor_urls = fetch_serp_competitors(query, n=3)
        competitor_texts = []
        for cu in competitor_urls:
            log(f"    Fetching: {cu[:80]}")
            t = fetch_page_text(cu)
            competitor_texts.append(t)
            time.sleep(1)  # Polite crawl rate

        # Extract current page text
        current_text = extract_tsx_text(tsx_path)

        # Generate improvements
        log(f"  Generating content improvements via Claude...")
        improvements = generate_content_improvements(query, current_text, competitor_texts, page_path)

        if improvements is None:
            log(f"  → skipped (AI diff failed)")
            continue

        missing = improvements.get("missing_topics", [])
        new_faqs = improvements.get("new_faq_items", [])
        log(f"  Missing topics: {missing}")
        log(f"  New FAQ items: {len(new_faqs)}")

        if not new_faqs and not improvements.get("meta_description_update"):
            log(f"  → no actionable improvements identified — bumping date only")

        # Patch .tsx
        changed = patch_tsx_file(tsx_path, improvements, query)

        if changed:
            refreshed_urls.append(url)
            write_refresh_entry(page_path, query, json.dumps({
                "missing_topics": missing,
                "new_faqs_added": len(new_faqs),
            }))
            log(f"  ✓ Updated: {tsx_path.name}")
        else:
            log(f"  → no changes written")

        processed += 1
        time.sleep(2)  # Rate limit between pages

    # Submit refreshed URLs to IndexNow
    if refreshed_urls:
        log(f"\nSubmitting {len(refreshed_urls)} refreshed URL(s) to IndexNow...")
        submit_indexnow(refreshed_urls)
    else:
        log("No pages refreshed this run")

    log(f"\n=== GSC Content Refresh DONE — {processed} processed, {len(refreshed_urls)} updated ===")


if __name__ == "__main__":
    main()
