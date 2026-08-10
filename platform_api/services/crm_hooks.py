"""CRM integration hooks — wires every sales, marketing, and support touchpoint.

Imported and called at the right place in each pipeline stage.
All calls are async, non-blocking, fail-silent (never break main flow).

Touchpoints wired:
  Marketing:
    audit_created()     — called in audit_api.py on every audit start
    audit_completed()   — called in audit_api.py on every completed audit
    newsletter_signup() — called in newsletter.py (already done via crm.newsletter_subscribe)

  Sales:
    outreach_sent()     — called in sequence_engine.py on D1/D7/D17 sends
    reply_received()    — called in reply_monitor.py and n8n_reply_handler.py

  Support (post-purchase):
    purchase_completed()  — called in Stripe webhook on charge.succeeded
    support_feedback()    — called when feedback/objection logged

Usage pattern (fail-silent):
    from platform_api.services.crm_hooks import audit_created
    try:
        await audit_created(email=email, url=url, utm_source=source)
    except Exception:
        pass  # never block main flow
"""
from __future__ import annotations

import logging
from typing import Optional

log = logging.getLogger(__name__)


async def _safe(coro):
    """Run a CRM coroutine, swallow all errors so callers never block."""
    try:
        return await coro
    except Exception as exc:
        log.warning("CRM hook failed (non-fatal): %s", exc)
        return None


# ── Marketing touchpoints ─────────────────────────────────────────────────

async def audit_created(
    email: str,
    url: str,
    utm_source: Optional[str] = None,
    utm_medium: Optional[str] = None,
    utm_campaign: Optional[str] = None,
) -> None:
    """Called when any audit starts. Upserts prospect with first-touch UTM.
    
    Wire in: audit_api.py → run_audit() — after audit row is created.
    """
    if not email or "@invalid" in email:
        return  # anonymous audit — skip
    from platform_api.services.crm import upsert_prospect
    await _safe(upsert_prospect(
        email=email,
        utm_source=utm_source or "direct",
        utm_medium=utm_medium,
        utm_campaign=utm_campaign,
    ))


async def audit_completed(
    email: str,
    score: int,
    finding_count: int = 0,
) -> None:
    """Called when audit finishes with a score. Updates last_score + audit_count.
    
    Wire in: audit_api.py → run_audit() — after score is computed.
    """
    if not email or "@invalid" in email:
        return
    from platform_api.services.crm import upsert_prospect
    await _safe(upsert_prospect(
        email=email,
        audit_score=score,
    ))
    # Low score = high intent — bump to "interested" if still cold
    if score <= 5:
        from platform_api.services.crm import update_crm_status
        from platform_api.services.audit_db import AuditDB
        # Only upgrade, never downgrade
        pool = None
        try:
            from platform_api.services.crm import get_pool
            pool = await get_pool()
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT crm_status FROM customers WHERE email = $1", email
                )
                if row and row["crm_status"] == "cold":
                    await conn.execute(
                        "UPDATE customers SET crm_status = 'interested', updated_at = now() WHERE email = $1",
                        email,
                    )
        except Exception as exc:
            log.warning("audit_completed status upgrade failed: %s", exc)


# ── Sales touchpoints ─────────────────────────────────────────────────────

async def outreach_sent(
    email: str,
    first_name: Optional[str] = None,
    product_url: Optional[str] = None,
    sequence_step: str = "d1",
    signal_notes: Optional[str] = None,
) -> None:
    """Called when any outreach email is sent (D1/D7/D17).
    
    Wire in: sequence_engine.py → send_d1(), and in run_sequence() D7/D17 sends.
    """
    if not email:
        return
    from platform_api.services.crm import upsert_prospect, update_crm_status
    # Ensure they're in CRM as a prospect
    await _safe(upsert_prospect(email=email, utm_source="outreach"))
    # Mark as "interested" if still cold (we reached out = they're a target)
    try:
        from platform_api.services.crm import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT crm_status FROM customers WHERE email = $1", email
            )
            if row and row["crm_status"] == "cold":
                await conn.execute(
                    """UPDATE customers
                       SET crm_status = 'interested',
                           last_contact_at = now(),
                           updated_at = now()
                       WHERE email = $1""",
                    email,
                )
    except Exception as exc:
        log.warning("outreach_sent status update failed: %s", exc)


async def reply_received(
    email: str,
    reply_text: str,
    classification: str = "unknown",
    source: str = "email",
) -> None:
    """Called when a prospect replies. Updates CRM status and logs feedback.
    
    Wire in:
      - reply_monitor.py → when human reply detected
      - n8n_reply_handler.py → when reply classified
    """
    if not email:
        return
    from platform_api.services.crm import update_crm_status, log_feedback

    # Map classification → CRM status
    if classification == "interested":
        new_status = "interested"
        interaction_type = "win"
    elif classification == "not_interested":
        new_status = "cold"
        interaction_type = "objection"
    else:
        new_status = "interested"  # any human reply = interested until proven otherwise
        interaction_type = "question"

    await _safe(update_crm_status(email, new_status, notes=f"Reply via {source}"))
    await _safe(log_feedback(
        customer_email=email,
        interaction_type=interaction_type,
        source=source,
        notes=reply_text[:500] if reply_text else "",
    ))


# ── Support / Post-purchase touchpoints ───────────────────────────────────

async def purchase_completed(
    email: str,
    amount_cents: int,
    product_type: str = "fix_pack",
    stripe_payment_intent_id: Optional[str] = None,
) -> None:
    """Called on Stripe charge.succeeded. Updates CRM status + recalculates LTV.
    
    Wire in: platform_api/routes/stripe_webhook.py → charge.succeeded handler.
    """
    if not email:
        return
    from platform_api.services.crm import (
        upsert_prospect, update_crm_status, update_lifetime_value
    )
    # Ensure prospect row exists
    await _safe(upsert_prospect(email=email))
    # Mark as purchased
    await _safe(update_crm_status(
        email,
        "purchased",
        notes=f"{product_type} ${amount_cents/100:.2f} purchased"
    ))
    # Recalculate LTV from purchases table
    await _safe(update_lifetime_value(email))

    # Stop any active outreach sequence
    try:
        import sqlite3
        from pathlib import Path
        from datetime import datetime, timezone
        db_path = Path(__file__).parent.parent.parent / "lead_gen" / "lead_state.db"
        if db_path.exists():
            db = sqlite3.connect(str(db_path))
            db.execute(
                """UPDATE sequence_state
                   SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                   WHERE email = ? AND status = 'active'""",
                (email,)
            )
            db.commit()
            db.close()
    except Exception as exc:
        log.warning("purchase_completed sequence stop failed: %s", exc)

    # Trigger fix pack delivery (fail-silent — never block the payment record)
    if product_type in ("fix_pack", "fix-pack", "97"):
        try:
            import asyncio as _aio
            from pathlib import Path as _Path
            import sys as _sys
            _sys.path.insert(0, str(_Path(__file__).parent.parent.parent))
            from yt_channel.delivery_workflow import DeliveryWorkflow

            async def _deliver():
                workflow = DeliveryWorkflow()
                # Construct a minimal Stripe event and pass to the existing handler
                await workflow.handle_stripe_charge_success({
                    "data": {"object": {
                        "receipt_email": email,
                        "amount": amount_cents,
                        "payment_intent": stripe_payment_intent_id or "",
                    }}
                })

            _aio.create_task(_deliver())
        except Exception as exc:
            log.warning("purchase_completed delivery trigger failed: %s", exc)

    # Write lookalike signal — teaches the scanner what 'our customer' looks like
    try:
        from platform_api.services.crm import get_pool as _get_pool
        async def _write_lookalike():
            pool = await _get_pool()
            async with pool.acquire() as conn:
                customer = await conn.fetchrow(
                    "SELECT utm_source, last_score FROM customers WHERE email=$1", email
                )
                if customer:
                    await conn.execute("""
                        INSERT INTO lookalike_signals
                            (won_email, utm_source, audit_score, icp_type, won_at)
                        VALUES ($1, $2, $3, $4, now())
                        ON CONFLICT DO NOTHING
                    """,
                        email,
                        customer.get("utm_source"),
                        customer.get("last_score"),
                        "fix_pack",
                    )
        import asyncio as _aio2
        _aio2.create_task(_write_lookalike())
    except Exception as exc:
        log.warning("purchase_completed lookalike signal failed: %s", exc)


async def support_objection(
    email: str,
    objection_reason: str,
    notes: str,
    source: str = "support_email",
) -> None:
    """Called when support identifies a price/confidence/timing objection.
    
    Wire in: support inbox monitor when classifying prospect emails.
    """
    from platform_api.services.crm import log_feedback
    await _safe(log_feedback(
        customer_email=email,
        interaction_type="objection",
        objection_reason=objection_reason,
        source=source,
        notes=notes,
    ))


async def customer_churned(email: str, reason: str = "") -> None:
    """Called when a Pro subscriber churns (subscription cancelled).
    
    Wire in: Stripe customer.subscription.deleted webhook.
    """
    from platform_api.services.crm import update_crm_status, log_feedback
    await _safe(update_crm_status(email, "churned", notes=f"Churned: {reason}"))
    await _safe(log_feedback(
        customer_email=email,
        interaction_type="churn",
        notes=reason[:500],
        source="stripe_webhook",
    ))
