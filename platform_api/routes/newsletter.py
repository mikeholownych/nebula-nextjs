"""Newsletter subscription API - backed by PostgreSQL via crm service."""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from urllib.parse import quote

import asyncio
import hashlib
from pydantic import BaseModel, EmailStr

from platform_api.services.crm import (
    newsletter_subscribe,
    newsletter_mark_confirmation_sent,
    newsletter_confirm,
    newsletter_unsubscribe,
    newsletter_subscriber_count,
)

router = APIRouter()

BUSINESS_NAME = "Nebula Components"
BUSINESS_ADDRESS = "Nebula Components, 66 Sonneck Square, Scarborough, ON M1E 1A9"
UNSUBSCRIBE_URL = "https://nebulacomponents.com/unsubscribe"


class NewsletterSignupRequest(BaseModel):
    email: EmailStr
    name: str | None = None
    role: str | None = None
    referrer: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None


class NewsletterUnsubscribeRequest(BaseModel):
    email: EmailStr


@router.post("/newsletter/subscribe")
async def subscribe(req: NewsletterSignupRequest):
    email = req.email.lower().strip()
    row = await newsletter_subscribe(
        email,
        name=req.name,
        role=req.role,
        utm_source=req.utm_source or req.referrer,
        utm_medium=req.utm_medium,
        utm_campaign=req.utm_campaign,
    )
    token = row["confirmation_token"]
    confirm_url = f"https://nebulacomponents.com/api/newsletter/confirm?token={quote(token)}"
    unsubscribe_url = f"{UNSUBSCRIBE_URL}?email={quote(email)}"
    text = f"""Confirm your Nebula Components newsletter subscription

You requested the Nebula Components newsletter from our website. Confirm your subscription here:
{confirm_url}

If you did not request this email, ignore it. You will not receive newsletter issues unless you confirm.

You can unsubscribe at any time:
{unsubscribe_url}

{BUSINESS_NAME}
{BUSINESS_ADDRESS}
"""
    html = f"""
    <html><body style="margin:0;background:#071014;color:#e8f1f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
        <div style="font-size:13px;letter-spacing:2px;color:#5eead4;font-weight:700;">NEBULA COMPONENTS</div>
        <h1 style="font-size:30px;line-height:1.15;margin:28px 0 14px;color:#ffffff;">Your page has a leak.</h1>
        <p style="font-size:17px;line-height:1.6;color:#b8c9cc;">Confirm your subscription and get the next practical finding for founders spending money on traffic that does not convert.</p>
        <p style="margin:32px 0;"><a href="{confirm_url}" style="display:inline-block;background:#5eead4;color:#071014;padding:15px 22px;border-radius:8px;text-decoration:none;font-weight:700;">Confirm my subscription</a></p>
        <p style="font-size:13px;line-height:1.5;color:#7f989d;">If the button does not work, copy and paste this URL into your browser:<br><a href="{confirm_url}" style="color:#5eead4;word-break:break-all;">{confirm_url}</a></p>
        <p style="font-size:13px;line-height:1.5;color:#7f989d;">You requested this newsletter from our website. If you did not request it, ignore this email. <a href="{unsubscribe_url}" style="color:#5eead4;">Unsubscribe</a></p>
        <hr style="border:0;border-top:1px solid #203238;margin:32px 0;">
        <p style="font-size:12px;color:#688087;">{BUSINESS_NAME}<br>{BUSINESS_ADDRESS}<br><a href="https://nebulacomponents.com" style="color:#5eead4;">nebulacomponents.com</a></p>
      </div>
    </body></html>
    """

    def _send_confirmation() -> dict:
        from agentmail_client import AgentMailClient
        return AgentMailClient(inbox="hello@nebulacomponents.com").send_transactional(
            [email],
            "Confirm your Nebula newsletter subscription",
            text=text,
            html=html,
            headers={
                "List-Unsubscribe": f"<{unsubscribe_url}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
            client_id=f"txn:newsletter-confirm:{email}:{hashlib.sha256(token.encode()).hexdigest()[:24]}",
        )

    result = await asyncio.to_thread(_send_confirmation)
    if result.get("_error"):
        raise HTTPException(502, "Could not send confirmation email")
    await newsletter_mark_confirmation_sent(email)
    return {
        "success": True,
        "message": "Check your email to confirm your subscription.",
        "subscriber_id": str(row["id"]),
    }


@router.get("/newsletter/confirm")
async def confirm(token: str):
    if not token or not await newsletter_confirm(token):
        raise HTTPException(400, "Invalid or expired confirmation link")
    return RedirectResponse("https://nebulacomponents.com/newsletter/confirmed")


@router.post("/newsletter/unsubscribe")
async def unsubscribe(req: NewsletterUnsubscribeRequest | None = None, email: str | None = None):
    recipient = str(req.email if req else email or "").lower().strip()
    if not recipient:
        raise HTTPException(400, "Email is required")
    ok = await newsletter_unsubscribe(recipient)
    if not ok:
        # Idempotent suppression is safer than revealing subscriber existence.
        return {"status": "unsubscribed", "success": True, "message": "Unsubscribed"}
    return {"status": "unsubscribed", "success": True, "message": "Unsubscribed"}


@router.post("/newsletter/unsubscribe-one-click")
async def unsubscribe_one_click(request: Request):
    """RFC 8058 endpoint for mailbox-provider one-click unsubscribe."""
    email = request.query_params.get("email", "").lower().strip()
    if not email:
        raise HTTPException(400, "Missing unsubscribe identity")
    await newsletter_unsubscribe(email)
    return {"status": "unsubscribed"}


@router.get("/newsletter/subscribers/count")
async def subscriber_count():
    n = await newsletter_subscriber_count()
    return {"total_subscribers": n}
