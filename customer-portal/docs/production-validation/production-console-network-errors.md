# Production Console & Network Errors Report

**Target URL**: `https://nebulacomponents.com`  
**Date**: August 21, 2026  

---

## Network Error Status Analysis

During production validation, all HTTP status codes were analyzed for expected vs. unexpected behaviors:

| HTTP Status | Trigger / Scenario | Expected / Compliant? | Root Cause & Security Implication |
| :--- | :--- | :--- | :--- |
| **200 OK** | Standard page routes, health checks, completed audits | **YES** | Normal traffic resolution |
| **401 Unauthorized** | `GET /api/v1/fixes/:auditId` without API Key | **YES** | Agent API protocol correctly blocks unauthenticated requests from public scraping |
| **403 Forbidden** | `POST /api/checkout` without signed audit unlock cookie | **YES** | Strict security boundary prevents checkout creation for unverified audits |
| **400 Bad Request** | `POST /api/checkout` with unsupported `offerKey` | **YES** | Prevents parameter tampering or retired pricing injection |
| **404 Not Found** | `GET /this-route-does-not-exist-qa-test` | **YES** | Clean 404 response without leaking stack traces or internal routing |
| **500 / 502 / 503** | Concurrency test & heavy load | **NONE OBSERVED** | 0 server errors observed across all testing tiers |

---

## Security Headers & Content Security Policy (CSP)

Probing `https://nebulacomponents.com` verified that the following security headers are enforced in production:

```http
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
x-nebula-revision: f1046bde91b924bdcccfcf3e1a2436bb631d3f4a
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com https://searchable-tracker.searchable.workers.dev https://in.heycatch.ai; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://indieascent.com https://nicklaunches.com https://www.googletagmanager.com https://www.google-analytics.com; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://us.posthog.com https://us.i.posthog.com https://cloudflareinsights.com https://searchable-tracker.searchable.workers.dev https://tracker.searchableanalytics.com https://in.heycatch.ai; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com; frame-ancestors 'self'
```

---

## Browser Console & Hydration Validation

- **React 19 Hydration**: 0 hydration mismatch errors.
- **Client Analytics Consent Routing**: PostHog initializes with default `'essential'` consent gating; server events respect consent headers.
- **Console Errors**: 0 uncaught client exceptions or script errors on page load.
