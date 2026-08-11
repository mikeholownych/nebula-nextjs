"""
Exit-intent lead capture endpoint.
Registers a popup email capture in the lead store.
"""

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

from lead_store import LeadStore

logger = logging.getLogger(__name__)
router = APIRouter()


class ExitIntentRequest(BaseModel):
    email: EmailStr
    page: Optional[str] = "/"
    source: Optional[str] = "exit_intent_popup"


@router.post("/leads/exit-intent")
async def capture_exit_intent(body: ExitIntentRequest):
    """
    Register an email captured from the exit-intent popup.
    Upserts into lead_state.db at stage 'discovered' so the
    nurture pipeline can pick it up.
    """
    try:
        store = LeadStore()
        store.upsert_lead(
            email=body.email,
            url=None,
            stage="discovered",
            source=body.source or "exit_intent_popup",
            trigger_context=f"exit_intent|page={body.page}",
        )
        logger.info("[exit-intent] captured %s from %s", body.email, body.page)
    except Exception as exc:
        logger.error("[exit-intent] lead store error: %s", exc)
        # Don't surface to caller - frontend always shows success

    return {"status": "captured"}
