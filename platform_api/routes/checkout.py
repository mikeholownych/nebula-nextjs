"""Legacy FastAPI checkout — POST /api/checkout.

Checkout sessions are created by the Next.js BFF. This route is a 410 stub
so leftover callers cannot create a second Stripe session writer.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("")
async def create_checkout_session() -> None:
    """Checkout is owned by the Next.js BFF (`POST /api/checkout`).

    Kept as a 410 stub so leftover callers fail closed instead of creating
    unpaid dual sessions.
    """
    raise HTTPException(status_code=410, detail="Checkout is served by the portal BFF")
