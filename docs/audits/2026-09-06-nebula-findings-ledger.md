# Nebula Components Audit Findings Ledger

## Finding NEB-AUDIT-20260906-001
**Title:** Multiple public pages return identical documentation content
**Category:** Content Delivery / Routing
**Severity:** P1 - High
**Status:** RESOLVED - FALSE POSITIVE (see correction below)
**Observation:** When accessing pages such as /about, /pricing, /learning-centre, /blog, /teardowns via a markdown-preferring client, the server returns identical documentation content instead of page-specific information.
**Evidence:**
- Fetching https://nebulacomponents.com/about returned the same llms.txt markdown as /pricing and /learning-centre
- The homepage (https://nebulacomponents.com/) returned distinct HTML content
- All affected pages returned HTTP 200 with identical markdown bodies

**Correction (root cause identified - 2026-09-06):**
The observed behavior is not a routing defect. It is the "Markdown for Agents" content-negotiation feature in `customer-portal/proxy.ts`. The middleware's `preferMarkdown(accept)` (proxy.ts:155-177) detects an `Accept: text/markdown` header and rewrites every non-asset, non-API request to `/llms.txt` (proxy.ts:129-145). The audit tooling (webfetch) sends a markdown-preferred `Accept` header, so every page URL returned the same llms.txt document.

Human browsers and search engines send `Accept: text/html` and receive the correct, page-specific HTML. All five target routes exist as distinct, working page components (`app/about/page.tsx`, `app/pricing/page.tsx`, `app/learning-centre/page.tsx`, `app/blog/page.tsx`, `app/teardowns/page.tsx`), each with its own metadata and content. There is no duplicate-content SEO exposure to search engines, and no user-facing defect.

**User/Business Impact:** None for human visitors or search engines. Only markdown-first agents receive the single overview document by design.
**Confidence:** High (root cause verified against proxy.ts source)
**Remediation applied:** Added `X-Robots-Tag: noindex, nofollow` to the markdown content-negotiation response so agent-facing markdown variants are never indexed. Documented the behavior in `llms.txt`.

## Finding NEB-AUDIT-20260906-002
**Title:** Markdown content-negotiation responses lacked a robots directive
**Category:** Technical SEO / Indexability
**Severity:** P2 - Medium
**Status:** RESOLVED
**Observation:** The `/llms.txt` rewrite performed for markdown-preferring clients set `Content-Type: text/markdown` but no `X-Robots-Tag`. These markdown variants are intended for agents, not search results.
**Evidence:** proxy.ts markdown branch (lines ~129-145) headers did not include X-Robots-Tag.
**User/Business Impact:** Low. A crawler that accepts markdown could theoretically index the markdown variant.
**Remediation applied:** Added `X-Robots-Tag: noindex, nofollow` to the markdown response headers.
**Validation:** `npm run typecheck` passes; restart `nebula-nextjs` then curl with `Accept: text/markdown` and confirm the header. (Deployment and restart are intentionally NOT performed in this audit scope.)

## Finding NEB-AUDIT-20260906-003
**Title:** Audit methodology note - HTTP client Accept header influences observed output
**Category:** Audit Integrity / Reproducibility
**Severity:** INFO
**Status:** Recorded
**Observation:** Automated audits that fetch pages with a markdown-preferring `Accept` header will observe identical markdown content across distinct URLs, which is easy to mislabel as a broken-sites defect.
**Recommendation:** Future audits should send `Accept: text/html` (or a browser user-agent) when assessing HTML page content, and should distinguish content-negotiated responses from genuine routing failures.