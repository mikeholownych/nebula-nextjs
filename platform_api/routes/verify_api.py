from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from platform_api.services.audit_db import audit_db
from platform_api.services.signal_verifier import verify_signal
from platform_api.auth.principal import (
    Principal, bind_email, require_internal_service,
    require_principal, SCOPE_WORKSPACE_READ,
    internal_service_dependency,
)

router = APIRouter(prefix="/verify", tags=["verify"])


@router.post("/recommendation/{rec_id}")
async def verify_recommendation(
    rec_id: str,
    email: Optional[str] = Query(default=None),
    principal: Principal = Depends(require_principal(SCOPE_WORKSPACE_READ)),
):
    """Verify a single recommendation's signal against the live page.
    Tenant-bound: the recommendation must belong to the principal."""
    own = (principal.workspace_email or principal.email or "").strip().lower()
    if not own:
        raise HTTPException(status_code=403, detail="Principal has no tenant binding")
    """Verify a single recommendation's signal against the live page."""
    await audit_db.connect()

    async with audit_db.pool.acquire() as conn:
        rec = await conn.fetchrow(
            """
            SELECT r.id, r.finding_key, r.url, r.status, r.email
            FROM recommendations r
            WHERE r.id = $1
            """,
            rec_id,
        )

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    owner = (rec["email"] or "").strip().lower()
    if not owner or owner != own:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    url = rec["url"]
    if not url:
        raise HTTPException(status_code=422, detail="No URL associated with this recommendation")

    signal_key = rec["finding_key"]
    result = await verify_signal(signal_key, url)

    now = datetime.now(timezone.utc)
    async with audit_db.pool.acquire() as conn:
        if result["passed"]:
            await conn.execute(
                """
                UPDATE recommendations
                SET status = 'verified', verified_at = $2, updated_at = $2
                WHERE id = $1
                """,
                rec_id, now,
            )
        else:
            await conn.execute(
                """
                UPDATE recommendations
                SET status = 'doing', delivery_failed_at = $2, failure_reason = $3, updated_at = $2
                WHERE id = $1
                """,
                rec_id, now, result["issue"],
            )

    return {
        "rec_id": rec_id,
        "signal": signal_key,
        "url": url,
        "passed": result["passed"],
        "score": result["score"],
        "issue": result["issue"],
        "evidence": result["evidence"],
        "new_status": "verified" if result["passed"] else "doing",
        "checked_at": now.isoformat(),
    }


@router.post("/deploy-hook", dependencies=[Depends(internal_service_dependency)])
async def verify_deploy_hook(domain: str = Query(..., min_length=3), request: Request = None):
    """Verify all open recommendations for URLs matching a domain.

    INTERNAL_SERVICE: deploy hooks are CI/CD integrations, not customer
    capabilities. Requires the shared internal service secret."""
    require_internal_service(request)
    return await run_domain_verification(domain)


async def run_domain_verification(domain: str) -> dict:
    """Shared core (customer deploy webhooks + internal CI hook)."""
    await audit_db.connect()

    async with audit_db.pool.acquire() as conn:
        recs = await conn.fetch(
            """
            SELECT id, finding_key, url, status
            FROM recommendations
            WHERE status IN ('to_fix', 'doing')
              AND url LIKE '%' || $1 || '%'
            """,
            domain,
        )

    if not recs:
        return {"domain": domain, "checked": 0, "results": []}

    results = []
    now = datetime.now(timezone.utc)

    for rec in recs:
        url = rec["url"]
        if not url:
            continue

        signal_key = rec["finding_key"]
        result = await verify_signal(signal_key, url)

        async with audit_db.pool.acquire() as conn:
            if result["passed"]:
                await conn.execute(
                    """
                    UPDATE recommendations
                    SET status = 'verified', verified_at = $2, updated_at = $2
                    WHERE id = $1
                    """,
                    rec["id"], now,
                )
            else:
                await conn.execute(
                    """
                    UPDATE recommendations
                    SET status = 'doing', delivery_failed_at = $2, failure_reason = $3, updated_at = $2
                    WHERE id = $1
                    """,
                    rec["id"], now, result["issue"],
                )

        results.append({
            "rec_id": str(rec["id"]),
            "signal": signal_key,
            "url": url,
            "passed": result["passed"],
            "issue": result["issue"],
            "new_status": "verified" if result["passed"] else "doing",
        })

    verified_count = sum(1 for r in results if r["passed"])
    return {
        "domain": domain,
        "checked": len(results),
        "verified": verified_count,
        "failed": len(results) - verified_count,
        "results": results,
    }
