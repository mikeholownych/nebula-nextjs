"""Lead Gen Webhook Endpoints - FastAPI routes for RB2B + n8n integration.

Mount these in platform_api/main.py:
  from lead_gen.webhook_endpoints import setup_lead_gen_routes
  setup_lead_gen_routes(app)  # FastAPI app
"""
from fastapi import APIRouter, Depends, HTTPException, Request
import json


from platform_api.auth.principal import internal_service_dependency

# INTERNAL_SERVICE: these are n8n automation intake endpoints, not public
# customer capabilities. Callers must present the shared service secret.
router = APIRouter(prefix="/api/lead-gen", tags=["lead-gen"],
                   dependencies=[Depends(internal_service_dependency)])


@router.post("/rb2b-event")
async def handle_rb2b_event(payload: dict):
    """RB2B visitor identification webhook.

    Expected payload:
    {
        "pages_visited": ["audit", "fix-pack"],
        "total_dwell_s": 245,
        "last_visit": "2026-08-09T14:30:00Z",
        "utm_source": "organic"
    }
    """
    try:
        from lead_gen.rb2b_handler import handle_rb2b_event as handle_rb2b
        result = handle_rb2b(payload)
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/outbound-reply")
async def handle_outbound_reply(payload: dict):
    """n8n reply classification webhook.

    Expected payload:
    {
        "prospect_id": "stripe_founder1",
        "email": "patrick@stripe.com",
        "reply_text": "Yeah, interested. Can you send details?",
        "reply_timestamp": "2026-08-10T09:15:00Z"
    }
    """
    try:
        from lead_gen.n8n_reply_handler import handle_reply_webhook
        result = handle_reply_webhook(payload)
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def setup_lead_gen_routes(app):
    """Register lead_gen routes in a FastAPI app."""
    app.include_router(router)
