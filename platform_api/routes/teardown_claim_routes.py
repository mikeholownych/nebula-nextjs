"""Teardown claim verification endpoints. Phase 1: email-at-domain path."""

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from platform_api.auth.principal import internal_service_dependency
from platform_api.redis_client import get_redis
from platform_api.services.claim_tokens import (
    consume_claim_token,
    issue_claim_token,
    token_key,
)
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


class EmailRequest(BaseModel):
    email: str


@router.post("/{slug}/claim/email-request")
async def claim_email_request(slug: str, body: EmailRequest,
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
                client_id=f"tclaim:{slug}:{email_norm}:{token[:8]}") or {}
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
