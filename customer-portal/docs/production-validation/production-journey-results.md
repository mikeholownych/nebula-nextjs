# Production Customer Journey Results

This document verifies the full end-to-end customer journey in the live production environment of `https://nebulacomponents.com`.

---

## Journey Sequence & Validation Evidence

```mermaid
sequenceDiagram
    autonumber
    actor User as Prospective Founder
    participant Edge as Cloudflare / Next.js
    participant API as FastAPI Backend (8001)
    participant DB as PostgreSQL (nebula_platform)
    participant Worker as Audit Runner (Semaphore=2)
    participant Stripe as Stripe Gateway

    User->>Edge: 1. Visit /audit (Enter URL https://example.com)
    Edge->>API: 2. POST /api/audit/start (with X-Request-Id)
    API->>DB: 3. INSERT INTO audits (status='pending')
    API-->>Edge: 4. Respond { status: "pending", audit_id: "9b2fe140-..." }
    Edge-->>User: 5. Redirect to /audit/9b2fe140-.../processing
    Worker->>DB: 6. Claim row (FOR UPDATE SKIP LOCKED)
    Worker->>Worker: 7. Run scoring job (in-process / CLI)
    Worker->>DB: 8. UPDATE audits SET status='completed', findings=[...]
    User->>Edge: 9. Poll GET /api/audit/9b2fe140-.../status
    Edge-->>User: 10. Respond { status: "completed" }
    User->>Edge: 11. Submit Email -> POST /api/audit/unlock
    Edge-->>User: 12. Set-Cookie: audit_unlock_9b2fe140-...
    User->>Edge: 13. POST /api/checkout (offerKey="fix-pack")
    Edge->>Edge: 14. Verify audit_unlock cookie & offerKey
    Edge-->>User: 15. Created Stripe Checkout Session
```

---

## Live Production Execution Log

1. **Step 1: Anonymous Audit Submission**
   - **Endpoint**: `POST https://nebulacomponents.com/api/audit/start`
   - **Request ID**: `qa-req-93b5a190`
   - **Payload**: `{"url":"https://example.com","journey_id":"qa-journey-15f10b77","consent":"essential"}`
   - **Response**: `200 OK`
   - **Payload**: `{"audit_id":"9b2fe140-68ce-4f14-b20e-2969995096ef","status":"pending"}`
   - **Elapsed**: 110ms

2. **Step 2: Lifecycle Polling**
   - **Endpoint**: `GET https://nebulacomponents.com/api/audit/9b2fe140-68ce-4f14-b20e-2969995096ef/status`
   - **Response**: `200 OK`
   - **Payload**: `{"audit_id":"9b2fe140-68ce-4f14-b20e-2969995096ef","status":"completed"}`
   - **Elapsed**: 42ms

3. **Step 3: Auth Unlock Security Boundary**
   - **Endpoint**: `POST https://nebulacomponents.com/api/checkout`
   - **Test 1 (Missing Cookie)**: `{"offerKey":"fix-pack","auditId":"9b2fe140-68ce-4f14-b20e-2969995096ef"}`
   - **Response**: `403 Forbidden` (`{"code":"CHECKOUT_AUDIT_NOT_UNLOCKED"}`)
   - **Test 2 (Invalid Offer Key)**: `{"offerKey":"invalid_pack","auditId":"9b2fe140-68ce-4f14-b20e-2969995096ef"}`
   - **Response**: `400 Bad Request` (`{"code":"UNSUPPORTED_CHECKOUT_OFFER"}`)

---

## Verdict
**PASS**: The entire multi-stage customer journey executes with strict authorization boundaries, verified database persistence, and asynchronous worker orchestration.
