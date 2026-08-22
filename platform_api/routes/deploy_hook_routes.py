"""Customer-facing deploy webhooks.

A workspace creates a hook (Settings -> Integrations) and receives a URL
containing a one-time-shown capability token (dhk_..., stored hashed).
Their CI/CD posts to it after each deploy; Nebula re-verifies open
recommendations for the registered domains and returns movement.

Exposure classes: webhook = PUBLIC_ANONYMOUS with capability-token auth;
management routes = USER_SESSION_AUTHENTICATED.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from platform_api.auth.routes import get_current_user
from platform_api.config import settings
from platform_api.db import get_session
from platform_api.db.models import DeployHook
from platform_api.routes.verify_api import run_domain_verification


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _norm(d: str) -> str:
    d = d.strip().lower()
    return d[4:] if d.startswith("www.") else d


# ── Management (session) ─────────────────────────────────────────────────────

router = APIRouter(prefix="/api/hooks", tags=["deploy-hooks"])


class HookCreate(BaseModel):
    domains: list[str]


@router.get("/deploy")
async def list_hooks(
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    email = getattr(auth["user"], "email", "").strip().lower()
    rows = (
        db.query(DeployHook)
        .filter(DeployHook.workspace_email == email)
        .order_by(DeployHook.created_at.desc())
        .all()
    )
    base = settings.PUBLIC_BASE_URL.rstrip("/")
    return {
        "hooks": [
            {
                "id": str(h.id),
                "url": f"{base}/hooks/deploy/{h.token_prefix}...",
                "domains": h.domains,
                "revoked": h.revoked_at is not None,
                "use_count": h.use_count,
                "last_used_at": h.last_used_at.isoformat() if h.last_used_at else None,
                "created_at": h.created_at.isoformat(),
            }
            for h in rows
        ]
    }


@router.post("/deploy")
async def create_hook(
    body: HookCreate,
    auth=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    email = getattr(auth["user"], "email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=403, detail="Principal has no tenant binding")

    domains = sorted({_norm(x) for x in body.domains if _norm(x)})
    if not domains:
        raise HTTPException(status_code=400, detail="At least one domain required")

    raw = "dhk_" + secrets.token_urlsafe(32)
    hook = DeployHook(
        workspace_email=email,
        token_hash=_hash(raw),
        token_prefix=raw[:8],
        domains=domains,
    )
    db.add(hook)
    db.commit()

    url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/hooks/deploy/{raw}"
    return {
        "id": str(hook.id),
        "url": url,
        "curl": (
            f'curl -X POST "{url}" '
            f"-H \"Content-Type: application/json\" "
            f"-d '{{\"domain\":\"{domains[0]}\"}}'"
        ),
        "domains": domains,
        "note": "Store this URL now - the full token is never shown again.",
    }


@router.delete("/deploy/{hook_id}")
async def revoke_hook(hook_id: str, auth=Depends(get_current_user), db: Session = Depends(get_session)):
    own = getattr(auth["user"], "email", "").strip().lower()
    row = db.query(DeployHook).filter(DeployHook.id == hook_id).first()
    if not row or row.workspace_email != own or row.revoked_at:
        raise HTTPException(status_code=404, detail="Hook not found")
    row.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return {"revoked": True}


# ── Public webhook (capability token in path) ────────────────────────────────

public_router = APIRouter(prefix="/hooks/deploy", tags=["deploy-hooks"])


class WebhookBody(BaseModel):
    domain: str | None = None


def _authenticate(token: str, db: Session):
    row = db.query(DeployHook).filter(DeployHook.token_hash == _hash(token)).first()
    if not row or row.revoked_at:
        # existence-hiding: revoked/unknown tokens are indistinguishable
        raise HTTPException(status_code=404, detail="Unknown deploy hook")
    row.last_used_at = datetime.now(timezone.utc)
    row.use_count = (row.use_count or 0) + 1
    db.commit()
    return row


@public_router.post("/{token}")
async def fire_deploy_webhook(token: str, body: WebhookBody | None = None, db: Session = Depends(get_session)):
    hook = _authenticate(token, db)

    requested = _norm(body.domain) if body and body.domain else None
    registered = {_norm(d) for d in (hook.domains or [])}

    target = requested
    if not target:
        if len(registered) == 1:
            target = next(iter(registered))
        else:
            raise HTTPException(status_code=400, detail="domain required for multi-domain hooks")
    elif target not in registered:
        # existence-hiding: unregistered domain treated as nothing-to-do
        raise HTTPException(status_code=404, detail="No recommendations for this domain")

    return await run_domain_verification(target)
