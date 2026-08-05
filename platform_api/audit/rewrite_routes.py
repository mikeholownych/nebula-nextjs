"""AI Rewrite Preview routes (Feature 5).

Endpoints:
- GET  /api/audit/rewrites/?audit_id=<id>[&share=<token>] — stored rewrites
- POST /api/audit/rewrites/generate — generate ONE rewrite (cached per
  (audit_id, finding_key) in the ai_rewrites table, nebula_platform DB)

Access follows platform_api/routes/report_routes.py: either a valid audit
share token, or an authenticated session that owns the audit.

LLM: Bedrock primary (same boto3 IAM Roles Anywhere path as
audit_pipeline/prompts/real_generator.py), OpenRouter fallback (same key
resolution as the /api/audit/assistant endpoint in routes/audit_api.py).
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from platform_api.auth.routes import get_current_user
from platform_api.db.session import get_session
from platform_api.infra.circuit_breaker import CircuitBreaker, CircuitOpenError
from platform_api.redis_client import get_redis
from platform_api.services.audit_db import audit_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audit/rewrites", tags=["ai-rewrites"])

# Bedrock inference profile verified active in this AWS account (July 2026).
_BEDROCK_MODEL = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
_BEDROCK_REGION = "us-east-1"
_BEDROCK_PROFILE = "hermes-runtime"
_OPENROUTER_MODEL = "anthropic/claude-sonnet-4-5"
_STORED_MODEL_LABEL = "claude-sonnet-4-5"

# Per-finding element context: what is being rewritten + hard char limit.
# Keys match the finding keys emitted by the audit engine.
_ELEMENT_MAP = {
    "headline": ("H1 headline", 90),
    "cta": ("CTA button text", 40),
    "seo_foundations": ("meta description", 155),
    "social_proof": ("social proof line", 140),
    "above_fold": ("above-the-fold value proposition", 140),
    "ad_signals": ("ad-to-page message match line", 140),
}


class GenerateRequest(BaseModel):
    audit_id: str
    finding_key: str
    share: Optional[str] = None


# ── Access control (mirrors report_routes.py) ───────────────────────────────


async def _authorize(
    request: Request,
    db: Session,
    redis,
    audit_id: str,
    share: Optional[str],
) -> dict:
    """Resolve the audit the caller may access. Returns the audit dict.

    Path 1: `share` token matches the audit — read-only share link.
    Path 2: authenticated session whose email owns the audit.
    """
    try:
        audit_uuid = UUID(audit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit ID format")

    if share:
        audit = await audit_db.get_audit_by_share_token(share)
        if not audit or audit.get("audit_id") != audit_id:
            raise HTTPException(status_code=404, detail="Audit not found")
        return audit

    try:
        current = await get_current_user(request, redis, db)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Authentication required")
    audit = await audit_db.get_audit(audit_uuid)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    user_email = (current.get("user").email or "").strip().lower()
    owner_email = (audit.get("email") or "").strip().lower()
    if not user_email or user_email != owner_email:
        raise HTTPException(status_code=403, detail="You do not own this audit")
    return audit


# ── Rewrite storage (nebula_platform DB) ─────────────────────────────────────


def _get_stored(db: Session, audit_id: str, finding_key: str) -> Optional[dict]:
    row = db.execute(
        text(
            """
            SELECT finding_key, original_text, rewritten_text, model, created_at
            FROM ai_rewrites
            WHERE audit_id = :a AND finding_key = :k
            """
        ),
        {"a": audit_id, "k": finding_key},
    ).first()
    if not row:
        return None
    return {
        "finding_key": row.finding_key,
        "original_text": row.original_text,
        "rewritten_text": row.rewritten_text,
        "model": row.model,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "cached": True,
    }


def _store(db: Session, audit_id: str, finding_key: str,
           original_text: str, rewritten_text: str) -> None:
    db.execute(
        text(
            """
            INSERT INTO ai_rewrites (audit_id, finding_key, original_text, rewritten_text, model)
            VALUES (:a, :k, :o, :r, :m)
            ON CONFLICT (audit_id, finding_key) DO NOTHING
            """
        ),
        {"a": audit_id, "k": finding_key, "o": original_text,
         "r": rewritten_text, "m": _STORED_MODEL_LABEL},
    )
    db.commit()


# ── LLM calls (Bedrock primary, OpenRouter fallback) ─────────────────────────


def _openrouter_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if key:
        return key
    env_path = Path.home() / ".hermes" / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("OPENROUTER_API_KEY=") and not line.startswith("#"):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def _bedrock_call(prompt: str) -> Optional[str]:
    """Synchronous Bedrock converse call — run via asyncio.to_thread."""
    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        return None
    try:
        session = boto3.Session(profile_name=_BEDROCK_PROFILE, region_name=_BEDROCK_REGION)
        bedrock = session.client(
            "bedrock-runtime",
            config=Config(region_name=_BEDROCK_REGION, read_timeout=60, connect_timeout=10),
        )
        resp = bedrock.converse(
            modelId=_BEDROCK_MODEL,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 400, "temperature": 0.4},
        )
        return resp["output"]["message"]["content"][0]["text"].strip()
    except Exception:
        logger.warning("bedrock rewrite call failed", exc_info=True)
        return None


async def _openrouter_call(prompt: str) -> Optional[str]:
    api_key = _openrouter_key()
    if not api_key:
        return None
    breaker = CircuitBreaker("openrouter_rewrite", failure_threshold=5,
                             recovery_timeout_seconds=30)

    async def call():
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _OPENROUTER_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 400,
                    "temperature": 0.4,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()

    try:
        return await breaker(call)()
    except CircuitOpenError:
        logger.warning("openrouter rewrite circuit open")
        return None
    except Exception:
        logger.warning("openrouter rewrite call failed", exc_info=True)
        return None


async def _generate_rewrite(element_type: str, original_text: str,
                            issue: str, char_limit: int) -> Optional[str]:
    prompt = (
        "Rewrite this landing page element for a founder running paid ads "
        "with zero conversions.\n"
        f"Original {element_type}: {original_text}\n"
        f"The finding: {issue}\n"
        f"Rewrite it to be specific, outcome-focused, under {char_limit} chars. "
        "Return ONLY the rewritten text, no quotes, no explanation."
    )
    out = await asyncio.to_thread(_bedrock_call, prompt)
    if out:
        return out
    out = await _openrouter_call(prompt)
    if out:
        return out
    return None


def _element_context(finding: dict) -> tuple[str, int]:
    key = (finding.get("key") or "").strip()
    if key in _ELEMENT_MAP:
        return _ELEMENT_MAP[key]
    label = (finding.get("label") or "page element").strip()
    return label, 200


def _original_text(finding: dict) -> Optional[str]:
    """The actual page copy lives in finding.evidence.measured (H1 text,
    meta description, CTA label, etc. as observed by the audit engine)."""
    evidence = finding.get("evidence")
    if isinstance(evidence, dict):
        measured = (evidence.get("measured") or "").strip()
        if measured and "unavailable" not in measured.lower():
            return measured[:1000]
    return None


# ── Routes ───────────────────────────────────────────────────────────────────


@router.get("/")
async def list_rewrites(
    request: Request,
    audit_id: str = Query(...),
    share: Optional[str] = Query(default=None),
    db: Session = Depends(get_session),
    redis=Depends(get_redis),
):
    """List stored rewrites for an audit (share-token or owner session)."""
    await _authorize(request, db, redis, audit_id, share)
    rows = db.execute(
        text(
            """
            SELECT finding_key, original_text, rewritten_text, model, created_at
            FROM ai_rewrites
            WHERE audit_id = :a
            ORDER BY created_at ASC
            """
        ),
        {"a": audit_id},
    ).fetchall()
    return {
        "audit_id": audit_id,
        "rewrites": [
            {
                "finding_key": r.finding_key,
                "original_text": r.original_text,
                "rewritten_text": r.rewritten_text,
                "model": r.model,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }


@router.post("/generate")
async def generate_rewrite(
    body: GenerateRequest,
    request: Request,
    db: Session = Depends(get_session),
    redis=Depends(get_redis),
):
    """Generate (or return the cached) AI rewrite for one finding.

    The endpoint itself returns any finding's rewrite — the free-teaser
    paywall (first rewrite free, rest behind the $97 Fix Pack) is enforced
    client-side on the results page.
    """
    audit = await _authorize(request, db, redis, body.audit_id, body.share)

    # 1. Cached?
    cached = _get_stored(db, body.audit_id, body.finding_key)
    if cached:
        return cached

    # 2. Find the finding in the audit payload (nebula_audit DB)
    findings = audit.get("findings") or []
    if isinstance(findings, str):
        findings = json.loads(findings)
    finding = next(
        (f for f in findings if isinstance(f, dict) and f.get("key") == body.finding_key),
        None,
    )
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found in audit")

    original = _original_text(finding)
    if not original:
        raise HTTPException(
            status_code=422,
            detail="No original page text available for this finding",
        )

    element_type, char_limit = _element_context(finding)
    issue = (finding.get("issue") or "").strip()[:500]

    rewritten = await _generate_rewrite(element_type, original, issue, char_limit)
    if not rewritten:
        raise HTTPException(status_code=503, detail="LLM unavailable")

    # Hard-enforce the char limit the prompt asked for (model may overshoot).
    if len(rewritten) > char_limit * 2:
        rewritten = rewritten[: char_limit * 2].rsplit(" ", 1)[0].strip()

    _store(db, body.audit_id, body.finding_key, original, rewritten)
    return {
        "finding_key": body.finding_key,
        "original_text": original,
        "rewritten_text": rewritten,
        "model": _STORED_MODEL_LABEL,
        "cached": False,
    }
