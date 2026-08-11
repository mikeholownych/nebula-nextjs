# Implementation Baseline - Nebula Components Technical & Strategic SEO

**Domain**: `nebulacomponents.shop`
**Date**: July 2026
**Auditor**: Senior Technical SEO Engineer & Information Architect

---

## 1. System Architecture & Technical Stack

| Dimension | Implementation |
|---|---|
| **Framework** | Next.js 16.2.11 (App Router), React 19.2.7, TypeScript 5.9.3 |
| **Rendering Model** | Hybrid SSR/SSG with dynamic edge/node routes for audit evaluation |
| **Routing System** | Next.js App Router (`app/` directory structure) |
| **Content Sources** | Local typed content modules (`getArticles.ts`, `public-facts.ts`, `citable` release projections) |
| **Metadata Engine** | Native Next.js `Metadata` export API with dynamic canonical & social card resolution |
| **Structured Data** | Validated JSON-LD blocks (`Organization`, `WebSite`, `SoftwareApplication`, `Product`, `Offer`, `BreadcrumbList`, `FAQPage`, `Article`) |
| **Sitemap Generation** | Native `app/sitemap.ts` routing manifest evaluated at build and request time |
| **Robots Policy** | `public/robots.txt` enforcing AI model training restrictions while granting answer-engine and search indexing access |
| **Analytics & Telemetry** | PostHog reverse-proxy (`/ingest`) + PostHog Node server-side event tracking + GA4 client integration |
| **Deployment Model** | Cloudflare Tunnel / Node.js Next.js production web server |
| **Audit Backend** | Python FastAPI DOM & evidence analyzer (`audit_evidence.py`, `deliver_audit.py`) |

---

## 2. Product Truth Model

### What Nebula Component Does
Nebula Components provides an evidence-backed landing page audit tool for founders and businesses already paying for ad traffic (Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads) who are not getting conversions.

### Core Audit Capabilities (7 Observable Signals)
1. **Message Match**: Headline presence, text character length, alignment with ad offer promises.
2. **Trust & Credibility**: Presence of authentic testimonials, security seals, company identity details, proof proximity to CTA.
3. **Mobile Layout & Viewport**: Viewport meta configuration, mobile tap target sizes, horizontal overflow, responsive breakpoints.
4. **Load Time & Page Speed**: Resource counts, script blocking, image optimization signals (WebP/AVIF), DOM element depth.
5. **CTA Clarity & Hierarchy**: Contrast ratios, CTA element count, competing actions, expectation setting.
6. **Form Friction**: Form field count, required inputs, label accessibility, qualification burden.
7. **Social Proof Proximity**: Verification of proof elements positioned directly adjacent to primary decision points.

### Bounded Scope & Explicit Non-Capabilities
- **Public URL Inspection Only**: The audit inspects observable HTML and DOM structures fetched via public HTTP/HTTPS requests.
- **No Private Data Access**: Does NOT access ad accounts, Google Analytics data, checkout backends, or form submission endpoints.
- **No Causal Lift Guarantees**: Surface observable risk indicators. Does NOT claim or guarantee conversion rate lift or revenue numbers.
- **No Instant / Sub-60s Promises**: Operations rely on network fetch latency (typically 3-15 seconds). Hard timeout is capped at 120s.

---

## 3. Pre-Implementation Route Baseline

| Route | Primary Keyword Intent | Initial Status | Target Action |
|---|---|---|---|
| `/` | Landing page audit for paid traffic | Active | Refine positioning, update H1/Title, add internal links |
| `/audit` | Free landing page audit | Active | Clarify scope, remove 60s claims, refine validation |
| `/pricing` | Landing page audit pricing / Fix Pack | Active | Define $97 One-Leak Repair Sprint deliverable |
| `/why-is-my-landing-page-not-converting` | Why is my landing page not converting | Missing | Create diagnostic landing page |
| `/ads-getting-clicks-but-no-sales` | Ads getting clicks but no sales | Missing | Create diagnostic landing page |
| `/landing-page-message-match` | Landing page message match | Missing | Create diagnostic landing page |
| `/landing-page-trust-signals` | Landing page trust signals | Missing | Create diagnostic landing page |
| `/landing-page-cta-audit` | Landing page CTA audit | Missing | Create diagnostic landing page |
| `/mobile-landing-page-audit` | Mobile landing page audit | Missing | Create diagnostic landing page |
| `/saas-landing-page-audit` | SaaS landing page audit | Missing | Create buyer-specific page |
| `/ecommerce-landing-page-audit` | Ecommerce landing page audit | Missing | Create buyer-specific page |
| `/lead-generation-landing-page-audit` | Lead generation landing page audit | Missing | Create buyer-specific page |

---

## 4. Test & Quality Gates Baseline

All changes must pass:
1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run check:sitemap-routes`
5. `npm run check:evidence-atoms`
6. `npm run check:public-proof`
7. `npm run check:citable-projection`
8. `npm run check:intelligence-stack`
9. `npm run build`
