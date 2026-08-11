#!/usr/bin/env python3
"""LLM-backed generation of COMPLETE, runnable prompts for paying customers.

The $97 deliverable is a prompt the customer pastes into Claude/ChatGPT/Gemini
and runs themselves. The old implementation was a static template with
fill-in-the-blank placeholders (customer count, rating, etc.) - a form, not a
deliverable.

This module uses an LLM (AWS Bedrock via IAM Roles Anywhere primary,
OpenRouter fallback) to WRITE the prompt from real page/audit data, so the
customer gets a complete, self-contained prompt: real URL, real headline,
real CTA text, the actual audit finding, explicit output format, and
[REPLACE:...] markers only for facts an audit genuinely cannot know (real
customer names, review counts). The user runs the prompt; they never fill
in blanks.

If the LLM is unavailable, we fall back to the static templates in
audit_pipeline/prompts/templates/ so the $97 flow never fails to deliver.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

NEBULA_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(NEBULA_DIR))

from audit_pipeline.prompts.generator import (  # noqa: E402
    DIM_LABELS,
    TEMPLATE_MAP,
    _load_template,
    _parse_signals,
    _platform_from_page,
)
from audit_pipeline.prompts.generator import build_prompt_pack as build_template_pack  # noqa: E402

# ── LLM client (Bedrock primary, OpenRouter fallback) ───────────────────────

_LLM_MODEL = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
_LLM_REGION = "us-east-1"
_LLM_PROFILE = "hermes-runtime"


def _read_key_from_env_files(env_name: str) -> str:
    """Read a key from the usual env files without loading dotenv."""
    for env_path in [
        Path.home() / ".hermes" / ".env",
        Path.home() / ".env",
        NEBULA_DIR / ".env",
        NEBULA_DIR / ".env.local",
    ]:
        try:
            if not env_path.exists():
                continue
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                if key.strip() == env_name:
                    val = val.strip().strip('"').strip("'")
                    if len(val) > 10:
                        return val
        except Exception:
            continue
    return os.environ.get(env_name, "")


def _openrouter_llm(prompt: str, system: str) -> str | None:
    """Call OpenRouter (OpenAI-compatible) and return the text or None."""
    try:
        from openai import OpenAI
    except ImportError:
        return None
    api_key = _read_key_from_env_files("OPENROUTER_API_KEY")
    if not api_key:
        return None
    try:
        client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
        response = client.chat.completions.create(
            model="anthropic/claude-haiku-4-5",
            max_tokens=1400,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[llm] openrouter failed: {e}", file=sys.stderr)
        return None


def _bedrock_llm(prompt: str, system: str) -> str | None:
    """Call AWS Bedrock via IAM Roles Anywhere and return the text or None."""
    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        print("[llm] boto3 not installed", file=sys.stderr)
        return None
    try:
        session = boto3.Session(profile_name=_LLM_PROFILE, region_name=_LLM_REGION)
        bedrock = session.client(
            "bedrock-runtime",
            config=Config(region_name=_LLM_REGION, read_timeout=90, connect_timeout=15),
        )
        messages = []
        if system:
            messages.append({"role": "user", "content": [{"text": f"{system}\n\n{prompt}"}]})
        else:
            messages.append({"role": "user", "content": [{"text": prompt}]})
        resp = bedrock.converse(
            modelId=_LLM_MODEL,
            messages=messages,
            inferenceConfig={"maxTokens": 1800},
        )
        return resp["output"]["message"]["content"][0]["text"].strip()
    except Exception as e:
        print(f"[llm] bedrock failed: {e}", file=sys.stderr)
        return None


def _call_llm(prompt: str, system: str = "") -> str | None:
    """Primary Bedrock, fallback OpenRouter."""
    out = _bedrock_llm(prompt, system)
    if out:
        return out
    return _openrouter_llm(prompt, system)


def _safe_json(text: str) -> dict | None:
    """Parse a JSON object out of an LLM response (tolerates code fences)."""
    text = text.strip()
    # Strip outer code fences (```json ... ``` or ``` ... ```)
    fence = re.match(r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find the FIRST balanced JSON object in the response
    for m in re.finditer(r"\{", text):
        start = m.start()
        depth = 0
        in_str = False
        esc = False
        for i in range(start, len(text)):
            ch = text[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
                continue
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[start:i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break
    return None


# ── Prompt-writer prompt builders ───────────────────────────────────────────

_SYSTEM_WRITER = (
    "You are Nebula Components' conversion engineer. Your job is to WRITE a "
    "complete, self-contained prompt that a paying customer will hand to an "
    "autonomous terminal coding agent (Claude Code, Cursor, Codex, etc.) "
    "running IN THEIR REPOSITORY, so the agent can actually implement the fix.\n\n"
    "STORY FRAMEWORK - every finding you write must follow these four beats:\n"
    "1. RECOGNITION: Describe what the visitor experiences on this page right now, "
    "in the visitor's voice, not the engineer's. 'A stranger lands here and...' "
    "Make the founder feel what their customer feels.\n"
    "2. THE VILLAIN NAMED: Identify the specific structural problem causing this "
    "experience. Not 'poor CTA copy' - 'The button says what to do, not what changes "
    "for them when they do it. Visitors do not click buttons that do not promise them something.'\n"
    "3. THE COST: One sentence. What is this costing them, concretely.\n"
    "4. THE FIX: Exactly what the agent implements, in plain language.\n\n"
    "RULES:\n"
    "- The prompt you write must be actionable BY AN AGENT WITH TERMINAL + "
    "FILE EDIT ACCESS in the customer's repo. It must name the exact file(s) "
    "to change, the exact change, and how to verify it (git diff, build, "
    "lint, browser check, console command).\n"
    "- Use a goal → verify → constraints structure.\n"
    "- Include ALL real context provided (URL, headline, CTA text, platform, "
    "audience, the audit finding). The customer adds NOTHING.\n"
    "- Never invent metrics, testimonials, customer names, or review counts. "
    "For facts an audit cannot know, instruct the agent to ask the user.\n"
    "- Keep the prompt under ~550 words.\n"
    "- Output ONLY valid JSON: {\"title\": \"short label\", \"prompt_md\": "
    "\"the complete prompt text\"}. No code fences, no extra fields."
)


def _dimension_context(key: str, dim: dict, page: dict, params: dict) -> str:
    """Build the real data context for one dimension."""
    url = page.get("url", "")
    h1 = page.get("h1", "(none)")
    issue = dim.get("issue", "")
    fix = dim.get("fix", "")
    ctas = params.get("cta_list", "")
    platform = params.get("platform", "your CMS")
    audience = params.get("audience", "your target customer")
    offer = params.get("offer", "your core offer")
    goal = params.get("page_goal", "conversions")

    base = (
        f"PAGE URL: {url}\n"
        f"HEADLINE (H1): {h1}\n"
        f"ACTUAL CTA BUTTONS/LINKS: {ctas}\n"
        f"PLATFORM/CMS: {platform}\n"
        f"AUDIENCE: {audience}\n"
        f"OFFER: {offer}\n"
        f"PAGE GOAL: {goal}\n"
        f"AUDIT FINDING: {issue}\n"
        f"RECOMMENDED FIX DIRECTION: {fix}\n"
    )
    if key == "social_proof":
        trust_words = params.get("trust_words_found", "(not detected)")
        base += f"TRUST WORDS FOUND ON PAGE: {trust_words}\n"
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) locate the landing page component "
            "in the repo (ask the user for the file path if not inferable), "
            "(2) add ONE concrete social-proof element near the page's real "
            "primary CTA with copy-paste-ready HTML, (3) verify with a build "
            "/ lint / git diff. Instruct the agent to ask the user for a real "
            "customer name/number if none exists on the page, never invent "
            "testimonials, and keep the change minimal."
        )
    elif key == "cta":
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) find the CTA button/link in the "
            "repo, (2) produce 8 finished CTA copy variants across low/medium/"
            "high commitment, 2-5 words, action-verb first, outcome-hinting, "
            "(3) apply the top recommendation in-place with the exact file "
            "path, (4) verify with a build / git diff. Include anti-patterns "
            "(no 'Submit', no 'Click Here')."
        )
    elif key == "headline":
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) locate the headline element in the "
            "repo, (2) produce 5 finished replacement headlines (under 90 "
            "chars) naming the concrete outcome for the audience, (3) apply "
            "the top pick in-place, (4) verify with a build / git diff."
        )
    elif key == "above_fold":
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) locate the above-fold component, "
            "(2) build a complete above-fold section (headline, subheadline, "
            "primary CTA, one trust/value signal) fitting one mobile viewport, "
            "adapted to the page's real headline/CTA, (3) apply it, (4) verify "
            "with a build / browser check / git diff."
        )
    elif key == "ad_signals":
        found, missing = _parse_signals(dim)
        base += f"SIGNALS FOUND: {found or 'none detected'}\n"
        base += f"SIGNALS MISSING: {missing or 'not checked'}\n"
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) locate the layout/head files, (2) "
            "add exact snippets for each MISSING tracker (GA4, Facebook Pixel, "
            "UTM links, conversion event) in the right files, (3) add a "
            "browser-console verification step, (4) note platform-specific "
            "plugin/settings paths where applicable. Never fabricate "
            "measurement IDs - instruct the agent to ask for them."
        )
    elif key == "seo_foundations":
        base += f"CURRENT TITLE: {params.get('title_tag', '(none)')}\n"
        base += f"CURRENT META DESCRIPTION: {params.get('meta_description', '(none)')}\n"
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) locate the metadata files (app/"
            "layout.tsx, next.config, head, etc.), (2) produce finished title "
            "(30-60 chars, keyword + brand), meta description (120-160 chars, "
            "value prop + CTA), and H1 (one, matching title intent), (3) apply "
            "them in the correct files, (4) verify with a build / git diff."
        )
    elif key == "load_speed":
        base += f"HTML SIZE: {params.get('html_size', '?')}KB\n"
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) identify the performance blockers "
            "(render-blocking scripts, unoptimized images, missing caching), "
            "(2) apply the highest-impact fixes it can (lazy-load, image "
            "dimensions, defer non-critical JS), (3) verify with a build and "
            "a re-test instruction (e.g. PageSpeed URL)."
        )
    elif key == "mobile":
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) locate the viewport/layout files, "
            "(2) fix mobile issues (viewport meta, touch-target sizes, font "
            "sizes, spacing, horizontal scroll), (3) apply, (4) verify with a "
            "build / browser resize check / git diff."
        )
    elif key == "ai_readiness":
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo. It must: (1) locate the head/layout files, (2) "
            "add the missing JSON-LD Organization schema, complete OpenGraph "
            "tags, Twitter card, and canonical link as copy-paste-ready <head> "
            "additions, (3) verify with a build / rich-results test / git diff."
        )
    else:
        base += (
            "TASK: Write a prompt an autonomous terminal agent runs in the "
            "customer's repo to implement a precise fix for this finding, with "
            "goal / verify / constraints and exact file paths."
        )
    return base


def generate_dimension_prompt(key: str, dim: dict, page: dict, params: dict) -> dict | None:
    """Generate a COMPLETE runnable prompt for one dimension. dict or None."""
    context = _dimension_context(key, dim, page, params)
    raw = _call_llm(context, _SYSTEM_WRITER)
    if not raw:
        return None
    data = _safe_json(raw)
    if not data:
        print(f"[llm] non-JSON response for {key}: {raw[:120]}", file=sys.stderr)
        return None
    data.setdefault("label", DIM_LABELS.get(key, key.replace("_", " ").title()))
    data.setdefault("key", key)
    data.setdefault("score", dim.get("score"))
    if not data.get("prompt_md"):
        return None
    return data


def _template_fallback(key: str, dim: dict, page: dict, params: dict) -> dict:
    """Static-template fallback when the LLM is unavailable."""
    tmpl = TEMPLATE_MAP.get(key)
    filled = None
    if tmpl:
        t = _load_template(tmpl)
        if t:
            from string import Template as _T
            filled = _T(t).safe_substitute(params)
            filled = re.sub(r"\$\{[^}]+\}", "(fill in your details here)", filled)
            filled = re.sub(r"\{[a-zA-Z_][a-zA-Z0-9_]*\}", "(fill in your details here)", filled)
    return {
        "key": key,
        "label": DIM_LABELS.get(key, key.replace("_", " ").title()),
        "score": dim.get("score"),
        "title": DIM_LABELS.get(key, key.replace("_", " ").title()),
        "prompt_md": filled or f"*Prompt generation unavailable for {key}. See template {tmpl}.*",
        "from_template": True,
    }


def generate_real_pack(audit: dict, page: dict, email: str | None = None, **kwargs) -> dict:
    """Generate complete runnable prompts for the failing dimensions.

    Falls back to the template-based pack if the LLM is entirely unavailable.
    """
    dimensions = audit.get("dimensions", {})
    need = []
    for key, dim in dimensions.items():
        score = dim.get("score", 10)
        if score >= 7:
            continue
        if key not in TEMPLATE_MAP:
            continue
        need.append((key, dim))

    need.sort(key=lambda kv: kv[1].get("score", 10))
    need = need[:3]  # top 3 worst dimensions

    if not need:
        return build_template_pack(audit, page, email=email, **kwargs)

    template_pack = build_template_pack(audit, page, email=email, **kwargs)
    params = (template_pack["teaser"]["params_used"] if template_pack["teaser"] else {}) or {}

    prompts = []
    llm_ok = False
    for key, dim in need:
        art = generate_dimension_prompt(key, dim, page, params)
        if art:
            prompts.append(art)
            llm_ok = True
        else:
            prompts.append(_template_fallback(key, dim, page, params))

    return {
        "count": len(prompts),
        "llm_generated": llm_ok,
        "teaser": prompts[0] if prompts else None,
        "full_pack": prompts[1:] if prompts else [],
        "pack_path": None,
        "prompts": prompts,
    }
