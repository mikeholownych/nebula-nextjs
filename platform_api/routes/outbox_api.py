"""Internal outbox enqueue. Kit send is claimed on the webhook, drained here."""

from __future__ import annotations

import asyncio
import os
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from platform_api.infra.outbox import outbox

router = APIRouter()


def _require_internal_secret(request: Request) -> None:
    secret = (os.getenv("INTERNAL_API_SECRET") or "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="INTERNAL_API_SECRET not configured")
    auth = request.headers.get("authorization", "")
    if auth != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")


class EnqueueIn(BaseModel):
    channel: str
    recipient: str
    payload: dict[str, Any] = {}


@router.post("/outbox/enqueue")
async def enqueue_outbox(body: EnqueueIn, request: Request):
    _require_internal_secret(request)
    if not body.channel or not body.recipient:
        raise HTTPException(status_code=400, detail="channel and recipient required")
    existing = await outbox.find_open(body.channel, body.recipient)
    if existing:
        asyncio.create_task(outbox.drain())
        return {"id": existing, "deduped": True}
    msg_id = await outbox.enqueue(body.channel, body.recipient, body.payload)
    asyncio.create_task(outbox.drain())
    return {"id": msg_id, "deduped": False}
