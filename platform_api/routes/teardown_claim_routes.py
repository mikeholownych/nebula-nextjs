"""Teardown claim verification endpoints. Phase 1: email-at-domain path."""

import asyncio
import hashlib
import secrets

import dns.asyncresolver as dns_async
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from platform_api.auth.principal import internal_service_dependency
from platform_api.auth.routes import get_current_user
from platform_api.db import get_session
from platform_api.redis_client import get_redis
from platform_api.services.claim_tokens import (
    consume_claim_token,
    issue_claim_token,
    token_key,
)
from platform_api.services.rate_limit import enforce_rate_limit
from platform_api.services.domains import email_domain, is_freemail, registered_domain
from platform_api.services.teardown_db import (
    ClaimConflict,
    get_teardown_db,
)

router = APIRouter(prefix="/teardowns",
                   dependencies=[Depends(internal_service_dependency)])

# Unguarded: emailed to humans as a clickable link; the token in the URL is
# the capability (same pattern as GET /auth/verify).
router_verify = APIRouter(prefix="/teardowns")

# Session-authenticated: uses the same cookie/JWT dependency as /auth/me,
# with no internal-service guard.
router_session = APIRouter(prefix="/teardowns")


class EmailRequest(BaseModel):
    email: str


@router.post("/{slug}/claim/email-request")
async def claim_email_request(slug: str, body: EmailRequest,
                              request: Request,
                              redis=Depends(get_redis)):
    email_norm = body.email.strip().lower()
    dom = email_domain(email_norm)
    if dom is None or is_freemail(dom):
        raise HTTPException(status_code=400,
                            detail="Use a work email at your company domain")
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    if dom != registered_domain(rec["domain"]):
        raise HTTPException(status_code=400,
                            detail="Email domain does not match this teardown")
    ip = request.headers.get("x-forwarded-for", "local").split(",")[0].strip()
    await enforce_rate_limit(redis, f"tclaimreq:{ip}", 10, 3600)
    await enforce_rate_limit(redis, f"tclaimdom:{dom}", 5, 3600)
    token = await issue_claim_token(redis, slug, email_norm)
    verify_url = f"https://nebulacomponents.com/api/teardowns/{slug}/claim/email-verify?token={token}"
    html_body = f"""
    <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#1a1a1a;">Claim your {rec['name']} teardown</h1>
      <p>Confirm you represent {dom} to manage this teardown in your workspace. Link expires in 15 minutes.</p>
      <p style="margin:2rem 0;"><a href="{verify_url}"
         style="background:#c7ff2f;color:#111;padding:0.875rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Verify ownership</a></p>
      <p style="color:#666;font-size:0.9rem;">If you didn't request this, ignore this email.</p>
    </body></html>"""
    text_body = (f"Confirm you represent {dom} for the {rec['name']} teardown:\n\n"
                 f"{verify_url}\n\nExpires in 15 minutes.").strip()

    def _send() -> dict:
        from agentmail_client import AgentMailClient
        try:
            return AgentMailClient().send_transactional(
                [email_norm], f"Claim the {rec['name']} teardown",
                text=text_body, html=html_body,
                client_id=f"txn:tclaim:{slug}:{email_norm}:{token[:8]}") or {}
        except Exception as exc:
            return {"_error": str(exc)}

    result = await asyncio.to_thread(_send)
    if result.get("_error"):
        await redis.delete(token_key(slug, token))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send verification email: "
                   f"{result.get('_body', result.get('_error'))}")
    return {"sent": True}


@router_verify.get("/{slug}/claim/email-verify")
async def claim_email_verify(slug: str, token: str, redis=Depends(get_redis)):
    email = await consume_claim_token(redis, slug, token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    try:
        claim = await get_teardown_db().create_claim(slug, email, "email_domain")
    except ClaimConflict:
        raise HTTPException(status_code=409,
                            detail="This teardown already has an owner")
    return {"claimed": True, "email": claim["claimed_by_email"]}


class DnsCheckRequest(BaseModel):
    value: str


DNS_CHECK_TTL_SECONDS = 48 * 3600
# The DNS path has no mailbox to bind, so ownership binds to a placeholder
# identity that must be replaced by a real session email in phase 4 team work.
DNS_CHECK_EMAIL = "dns-claim@invalid.nebulacomponents.com"


@router.post("/{slug}/claim/dns-start")
async def claim_dns_start(slug: str, request: Request,
                          redis=Depends(get_redis)):
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    ip = request.headers.get("x-forwarded-for", "local").split(",")[0].strip()
    await enforce_rate_limit(redis, f"tclaimdns:{ip}", 5, 3600)
    value = f"nebula={secrets.token_hex(16)}"
    key = f"tdns:{slug}:{hashlib.sha256(value.encode()).hexdigest()[:16]}"
    await redis.set(key, {"slug": slug}, ttl=DNS_CHECK_TTL_SECONDS)
    return {"record_name": f"_nebula-verify.{rec['domain']}",
            "value": value, "ttl_hours": 48}


@router.post("/{slug}/claim/dns-check")
async def claim_dns_check(slug: str, body: DnsCheckRequest,
                          redis=Depends(get_redis)):
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    key = f"tdns:{slug}:{hashlib.sha256(body.value.encode()).hexdigest()[:16]}"
    pending = await redis.get(key)
    if not pending:
        raise HTTPException(status_code=400,
                            detail="No pending DNS challenge")
    resolver = dns_async.Resolver()
    try:
        answer = await asyncio.wait_for(
            resolver.resolve(f"_nebula-verify.{rec['domain']}", "TXT"), timeout=8)
        flat = []
        for r in answer:
            for part in getattr(r, "strings", []):
                flat.append(part.decode(errors="replace"))
        joined = "".join(flat)
    except Exception:  # noqa: BLE001 - NXDOMAIN, timeout, no TXT
        joined = ""
    if body.value not in joined.replace('"', "").replace(" ", ""):
        return {"verified": False}
    try:
        claim = await get_teardown_db().create_claim(slug, DNS_CHECK_EMAIL, "dns_txt")
    except ClaimConflict:
        raise HTTPException(status_code=409,
                            detail="This teardown already has an owner")
    await redis.delete(key)
    return {"verified": True, "email": claim["claimed_by_email"]}


def _gsc_site_for_user_model(user_id, db):
    """Row for the user's single GSC connection via the SQLAlchemy session."""
    from platform_api.db.models import GscConnection
    uid = user_id if not hasattr(user_id, "id") else user_id.id
    return (db.query(GscConnection)
              .filter(GscConnection.user_id == uid)
              .first())


async def _gsc_site_for_user(user, db) -> str | None:
    """The user's connected GSC site url, or None if no connection."""
    row = _gsc_site_for_user_model(user, db)
    return row.gsc_site_url if row else None


@router_session.post("/{slug}/claim/gsc-check")
async def claim_gsc_check(slug: str,
                          current_user: dict = Depends(get_current_user),
                          db=Depends(get_session)):
    """Session-authenticated GSC ownership proof. Mounted WITHOUT internal
    guard; the browser session cookie is the capability."""
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    site = await _gsc_site_for_user(current_user["user"], db)
    if not site:
        raise HTTPException(status_code=400,
                            detail="Connect Google Search Console first")
    site_dom = registered_domain(site.removeprefix("sc-domain:"))
    if site_dom != registered_domain(rec["domain"]):
        raise HTTPException(
            status_code=400,
            detail="Connected Search Console property does not match "
                   "this teardown")
    try:
        claim = await get_teardown_db().create_claim(
            slug, current_user["user"].email, "gsc")
    except ClaimConflict:
        raise HTTPException(status_code=409,
                            detail="This teardown already has an owner")
    return {"claimed": True, "email": claim["claimed_by_email"]}
