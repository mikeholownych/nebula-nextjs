from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from platform_api.services.audit_db import audit_db
from platform_api.services.signal_verifier import verify_signal

router = APIRouter(prefix="/verify", tags=["verify"])


@router.post("/recommendation/{rec_id}")
async def verify_recommendation(rec_id: str, email: Optional[str] = Query(default=None)):
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

    if email:
        owner = (rec["email"] or "").strip().lower()
        if not owner or owner != email.strip().lower():
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


@router.post("/deploy-hook")
async def verify_deploy_hook(domain: str = Query(..., min_length=3)):
    """Verify all open recommendations for URLs matching a domain."""
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
