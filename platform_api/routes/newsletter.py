"""Newsletter subscription API — backed by PostgreSQL via crm service."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from platform_api.services.crm import (
    newsletter_subscribe,
    newsletter_unsubscribe,
    newsletter_subscriber_count,
)

router = APIRouter()


class NewsletterSignupRequest(BaseModel):
    email: EmailStr
    name: str | None = None
    role: str | None = None
    referrer: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None


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
    resubscribed = row.get("unsubscribed_at") is None and row.get("subscribed_at") is not None
    return {
        "success": True,
        "message": "Subscribed! First newsletter arrives Monday 8 AM ET.",
        "subscriber_id": str(row["id"]),
    }


@router.post("/newsletter/unsubscribe")
async def unsubscribe(email: str):
    ok = await newsletter_unsubscribe(email.lower().strip())
    if not ok:
        raise HTTPException(404, "Email not found")
    return {"success": True, "message": "Unsubscribed"}


@router.get("/newsletter/subscribers/count")
async def subscriber_count():
    n = await newsletter_subscriber_count()
    return {"total_subscribers": n}
