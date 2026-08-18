"""
Exit-intent lead capture endpoint.
Registers a popup email capture in the lead store.
"""

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging
import time

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
            url="",
            stage="discovered",
            source=body.source or "exit_intent_popup",
            trigger_context=f"exit_intent|page={body.page}",
        )
        logger.info("[exit-intent] captured %s from %s", body.email, body.page)
    except Exception as exc:
        logger.error("[exit-intent] lead store error: %s", exc)
        # Don't surface to caller - frontend always shows success

    return {"status": "captured"}


class VisitorProfileRequest(BaseModel):
    email: Optional[EmailStr] = None
    pages_visited: list[str] = []
    total_dwell_s: Optional[int] = 0
    utm_source: Optional[str] = "organic"
    last_visit: Optional[str] = None
    user_agent: Optional[str] = ""
    ip_hint: Optional[str] = ""


@router.post("/visitor-profile")
async def capture_visitor_profile(body: VisitorProfileRequest):
    """
    First-party page visit telemetry from layout.tsx.
    Stores pages_visited, dwell time, UTM source for cohort analysis.
    Linked to email only if audit_unlock_email cookie is present.
    
    Privacy: 90-day retention, subject to /data-rights form.
    See docs/governance/DATA_REGISTER.md for full register.
    """
    # Store as lightweight lead intelligence (not full lead until email known)
    # If email is present, upsert to lead_store; otherwise log for analytics
    try:
        if body.email:
            store = LeadStore()
            # Determine engagement level from pages_visited
            pages = set(body.pages_visited or [])
            engagement = "high" if "audit" in pages and "pricing" in pages else \
                         "medium" if "audit" in pages or "fix-pack" in pages else "low"
            
            store.upsert_lead(
                email=body.email,
                url="",
                stage="discovered",
                source=body.utm_source or "organic",
                trigger_context=f"visitor_profile|pages={','.join(body.pages_visited[:5])}|dwell={body.total_dwell_s}s|engagement={engagement}",
            )
            logger.info("[visitor-profile] captured %s: %d pages, %ds dwell, %s", 
                        body.email, len(body.pages_visited), body.total_dwell_s, engagement)
        else:
            # Anonymous visitor — log for aggregate analytics only
            logger.info("[visitor-profile] anonymous: %d pages, %ds dwell, utm=%s",
                        len(body.pages_visited), body.total_dwell_s, body.utm_source)
    except Exception as exc:
        logger.error("[visitor-profile] error: %s", exc)
        # Fail silent — visitor tracking is non-critical

    return {"status": "received", "ts": int(time.time())}
