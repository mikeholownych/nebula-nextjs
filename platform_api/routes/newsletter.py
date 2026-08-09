"""Newsletter subscription API endpoint.

POST /api/newsletter/subscribe
  - Validate email
  - Register in lead_state.db (newsletter_subscribers table)
  - Send welcome email (Stripe trigger or manual)
  - Return 200 + confirmation message
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

router = APIRouter()


class NewsletterSignupRequest(BaseModel):
    email: EmailStr
    role: str | None = None  # founder, marketer, product, designer, developer, agency, other
    referrer: str | None = None  # utm_source, audit_id, page referrer


class NewsletterSignupResponse(BaseModel):
    success: bool
    message: str
    subscriber_id: str = None


@router.post("/newsletter/subscribe", response_model=NewsletterSignupResponse)
async def subscribe_newsletter(request: NewsletterSignupRequest):
    """Subscribe email to newsletter."""
    
    email = request.email.lower().strip()
    
    # Validate email format (pydantic does this, but double-check)
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Check if already subscribed
    existing = await _get_subscriber(email)
    if existing:
        if existing.get("unsubscribed_at"):
            # Re-subscribe
            await _resubscribe(email)
            return NewsletterSignupResponse(
                success=True,
                message="Welcome back! You've been re-subscribed.",
                subscriber_id=existing.get("id"),
            )
        else:
            # Already subscribed
            return NewsletterSignupResponse(
                success=True,
                message="You're already subscribed to our newsletter.",
                subscriber_id=existing.get("id"),
            )
    
    # Create new subscriber
    subscriber_id = str(uuid.uuid4())
    subscriber = {
        "id": subscriber_id,
        "email": email,
        "role": request.role,
        "referrer": request.referrer,
        "subscribed_at": datetime.utcnow().isoformat(),
        "unsubscribed_at": None,
        "last_email_sent_at": None,
    }
    
    await _save_subscriber(subscriber)
    
    # Send welcome email (via AgentMail or Stripe trigger)
    # TODO: Wire to AgentMail or email service
    print(f"[TODO] Send welcome email to {email}")
    
    return NewsletterSignupResponse(
        success=True,
        message=f"Subscribed! You'll get the first newsletter on Monday morning.",
        subscriber_id=subscriber_id,
    )


@router.post("/newsletter/unsubscribe")
async def unsubscribe_newsletter(email: str):
    """Unsubscribe email from newsletter."""
    
    email = email.lower().strip()
    subscriber = await _get_subscriber(email)
    
    if not subscriber:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Mark as unsubscribed
    await _unsubscribe(email)
    
    return {"success": True, "message": "Unsubscribed"}


@router.get("/newsletter/subscribers/count")
async def get_subscriber_count():
    """Get total newsletter subscribers (public endpoint for dashboard)."""
    count = await _count_subscribers()
    return {"total_subscribers": count}


# Database layer (TODO: Replace with real DB)
async def _get_subscriber(email: str):
    """Get subscriber by email."""
    # TODO: Query lead_state.db / newsletter_subscribers table
    return None


async def _save_subscriber(subscriber: dict):
    """Save subscriber to DB."""
    # TODO: Insert into lead_state.db / newsletter_subscribers table
    pass


async def _resubscribe(email: str):
    """Resubscribe unsubscribed email."""
    # TODO: Update lead_state.db / newsletter_subscribers table
    # Set unsubscribed_at = NULL
    pass


async def _unsubscribe(email: str):
    """Mark email as unsubscribed."""
    # TODO: Update lead_state.db / newsletter_subscribers table
    # Set unsubscribed_at = now()
    pass


async def _count_subscribers(active_only: bool = True):
    """Count active subscribers."""
    # TODO: Query lead_state.db / newsletter_subscribers table
    # Return count of rows where unsubscribed_at IS NULL (if active_only)
    return 0
