# Technical SEO Findings — nebulacomponents.shop

Audit date: 2026-07-26
Scope: Crawlability, Indexability, Security, URL Structure, Mobile, Core Web Vitals (lab/source-inspection), Structured Data (crawl-validity), JS Rendering, IndexNow.

**Overall Technical Score: 58 / 100**

The score is dragged down almost entirely by one live, site-wide production defect (broken CSS delivery, see Critical #1) that would otherwise not exist in a technical-SEO-only audit of this codebase's markup/headers, which are largely well-built (clean URLs, correct canonicals on every sitemap page, sound crawl directives, HTTP/3, SSR-first rendering).

---

## What Works

- **robots.txt** is well-formed and intentional: per-bot allow/disallow split (AI-training bots disallowed, AI-answer-engine bots and standard search bots allowed), single `Sitemap:` declaration, no accidental blanket `Disallow`. Confirmed via `sitemap_discovery.py`: the declared sitemap resolves 200, parses as a valid `urlset`, contains 33 URLs.
- **Canonical tags are correct and self-referencing on all 33 URLs listed in sitemap.xml** — verified individually, zero mismatches. `/pricing` and `/pricing/` (trailing-slash variant) both correctly canonicalize to the non-trailing-slash URL.
- **Protocol/host redirects are correct and single-hop**: `http://` → `https://` is a 301, `https://www.` → `https://` (apex) is a 308, both landing directly on the canonical host with no chain.
- **No noindex leakage**: scanned all 33 sitemap URLs plus the 3 known off-sitemap pages plus `/api/audit/run` for `<meta name="robots">` and `X-Robots-Tag` — none found anywhere (default index,follow), so nothing is accidentally deindexed via a robots directive.
- **Security headers are mostly solid**: `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `permissions-policy` locks camera/mic/geolocation, `referrer-policy: strict-origin-when-cross-origin`. Served over HTTP/2 with HTTP/3 advertised (`alt-svc: h3`).
- **Mobile viewport tag is correct**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` on every page checked, including `viewport-fit=cover` for notched devices.
- **Rendering is SSR/SSG-first, not client-only**: `render_page.py --mode auto` returned `is_spa: false` / `mode_used: raw` on both `/` and `/audit` — meaningful content (extracted_text) is present in the raw, un-rendered HTML via Next.js prerendering (`x-nextjs-prerender: 1`), so crawlers without JS execution still see full content. No CSR-dependent content gap detected.
- **Agent/LLM discovery surface is real, not just header noise**: every `.well-known/` path and top-level file advertised in the `Link:` response header resolves 200 with correct content-type (`agent.json`, `mcp/server-card.json`, `api-catalog`, `acp.json`, `ucp`, `http-message-signatures-directory`, `agent-skills/index.json`, `openapi.json`, `llms.txt`, `auth.md`) — verified individually, not assumed from the header alone.
- **No thin/duplicate content from case-sensitivity or stray paths**: `/Pricing` (wrong case) returns a clean 404, not a soft-404 or duplicate render.
- **x402 payment API (`/api/v1`) correctly returns 402** with a well-formed payment-required payload; it is not leaking into the sitemap or returning indexable HTML.
- **Structured data is technically valid** (crawl-validity only — content/type-choice correctness is the seo-schema agent's remit): JSON-LD on homepage (3 blocks) and `/pricing` (4 blocks) all parse as valid JSON with no truncation.

---

## Findings

### CRITICAL

**1. Site-wide CSS delivery is broken in production right now — every page renders unstyled**
- **Evidence**: The homepage (and `/pricing`, `/audit`, `/learning-centre`) all reference `<link rel="stylesheet" href="/_next/static/chunks/1mmbcl4bayr4n.css">`. Requesting that URL directly returns `HTTP/2 500`, `content-type: text/plain`, body `Internal Server Error`. Confirmed reproducible on 3 consecutive retries. Rendering the homepage with a real browser engine (`render_page.py --mode always`, Playwright/Chromium) surfaces the console error directly: `Refused to apply style from '.../1mmbcl4bayr4n.css' because its MIME type ('text/plain') is not a supported stylesheet MIME type, and strict MIME checking is enabled.` A screenshot of the rendered homepage (saved at `/home/mike/nebula/nebulacomponents.shop-audit/screenshots/homepage-broken-css.png/nebulacomponents_shop_desktop.png`) confirms the page is rendering as plain unstyled HTML — no layout, no brand system, no design at all.
- **It's worse than one broken file**: `/about` references a *different* CSS chunk (`/_next/static/chunks/1x9hofplatikt.css`) which returns a flat **404**, not a 500 — meaning at least two different, mutually inconsistent build artifacts are being served across the site simultaneously. This is a classic Next.js ISR/ hosting symptom: cached page HTML from an old build is referencing static asset hashes that no longer exist (or exist in a corrupted state) after a subsequent deployment invalidated/replaced `_next/static/` without revalidating the cached HTML that points to it.
- **Why this belongs in a technical SEO report**: this directly degrades every source-inspectable signal this audit covers — mobile-friendliness (no responsive layout is actually applied), Core Web Vitals (CLS/visual stability is meaningless when no CSS loads; Google's renderer, which does honor CSS/MIME rules like Chromium, will also fail to apply styles, materially changing what Googlebot's rendered-HTML snapshot and page-experience signals look like vs. what the raw HTML implies), and overall page-experience ranking signals. It also undermines the entire product being sold (Nebula audits *other people's* broken landing pages; theirs is currently broken).
- **Recommendation**: Treat as a P0 production incident, not a backlog SEO item. Force a full redeploy that regenerates and revalidates all ISR-cached pages against the new `_next/static/` asset manifest (e.g., `next build` output fully synced before cutover, or purge/revalidate all cached HTML on deploy so no page can reference a stale chunk hash). Confirm the CDN/Cloudflare Tunnel layer isn't independently caching an old asset directory. Re-run this same curl/Playwright check post-fix to confirm the console error is gone and a real screenshot shows the styled page.

### HIGH

**2. Two live, indexable pages have a broken canonical tag pointing to the homepage instead of themselves**
- **Evidence**: `/terms` → `<link rel="canonical" href="https://nebulacomponents.shop"/>`. `/about/team` → `<link rel="canonical" href="https://nebulacomponents.shop"/>`. Both pages return HTTP 200, have unique `<title>` tags, and carry no `noindex` directive — so the intent is clearly for them to be indexable, but the canonical actively tells Google they are duplicates of the homepage. This will cause Google to consolidate/drop them from the index in favor of `/`, meaning Terms of Service and the founder bio page (an E-E-A-T trust signal) will not surface independently in search. Cross-checked all 33 sitemap URLs individually — zero canonical mismatches found there; the bug is isolated specifically to the two pages absent from the sitemap, consistent with a metadata-generation fallback that wasn't overridden for these routes (`/about` itself, one directory up, is correctly self-canonicalized).
- **Recommendation**: Fix the metadata export for `/terms` and `/about/team` to self-canonicalize, and add both to `sitemap.xml` (they are legitimate, indexable, unique-content pages — there's no reason for them to be sitemap-excluded given they carry no noindex).

**3. HSTS is actively disabled (`max-age=0`) rather than absent**
- **Evidence**: `strict-transport-security: max-age=0` on every response checked. This is not merely "no HSTS" — it is an explicit instruction telling browsers to **forget** any previously cached HSTS policy for this origin, effectively downgrading protection for repeat visitors who may have had HSTS/preload enrollment from an earlier deployment.
- **Recommendation**: Confirm whether this is an intentional rollback (e.g., mid-migration) or a leftover debug header. If HTTPS is meant to be enforced (redirects already confirm it is, at the edge), set a real `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` and submit to the HSTS preload list once confirmed stable.

### MEDIUM

**4. No Content-Security-Policy header anywhere observed**
- **Evidence**: Checked homepage and multiple internal pages — no `content-security-policy` or `content-security-policy-report-only` header on any response. Given the site handles Stripe checkout and an x402/USDC payment flow, a CSP would meaningfully reduce third-party script/injection risk. Not itself an indexability blocker, but a page-experience/trust-signal gap worth closing given the transactional nature of the site.
- **Recommendation**: Add a CSP (start with `Content-Security-Policy-Report-Only` to tune without breaking Stripe/GA4/consent-mode scripts, then enforce).

**5. Trailing-slash URL variants return 200 instead of redirecting (relying on canonical alone to prevent duplication)**
- **Evidence**: `/pricing` and `/pricing/` both return `200` with identical `etag`/content-length; no redirect occurs between them. The canonical tag correctly points both at the non-slash version, so this is not actively causing duplicate indexing today, but it leaves crawl-budget and duplicate-URL exposure (e.g., in backlinks, analytics, or third-party crawlers that don't respect canonicals) resting entirely on one signal instead of a hard redirect.
- **Recommendation**: Add a normalizing 308 redirect from trailing-slash to non-trailing-slash (or configure Next.js `trailingSlash` behavior explicitly) so the canonical isn't the only line of defense.

**6. `x-powered-by: Next.js` framework-fingerprint header is exposed**
- **Evidence**: Present on every response. Not an SEO ranking factor, but unnecessary information disclosure (helps attackers target known Next.js CVEs faster).
- **Recommendation**: Set `poweredByHeader: false` in `next.config`.

### LOW / INFO

**7. No IndexNow key/integration detected**
- **Evidence**: Checked common IndexNow key-file conventions (`/indexnow.txt`, `/<host>.txt`, `/.well-known/indexnow.txt`) — all 404. No Bing/Yandex site-verification meta tags found in homepage `<head>`. Given the `/learning-centre` hub publishes content on an ongoing cadence, IndexNow would give Bing/Yandex/Naver near-real-time discovery instead of waiting on their own crawl schedule.
- **Recommendation**: Generate an IndexNow key, publish the key file, and wire a post-publish hook (e.g., on deploy or on new learning-centre page) using the bundled `indexnow_submit.py`. Low priority relative to the Critical/High items above.

**8. `/api/audit/run` is publicly crawlable JSON with no explicit noindex header**
- **Evidence**: Returns `200`, `content-type: application/json`, body `{"status":"ok","service":"audit-api"}` on a bare GET, with no `X-Robots-Tag`. Not currently appearing in the sitemap, and Google generally doesn't index bare JSON as a search result, but there's no explicit defense-in-depth signal either.
- **Recommendation**: Add `X-Robots-Tag: noindex` on `/api/*` routes as a low-cost belt-and-suspenders measure. Not urgent.

**9. Sitemap `<lastmod>` is a single build-time timestamp identical across all 33 URLs**
- **Evidence**: Every entry carries `<lastmod>2026-07-26T01:10:37.057Z</lastmod>` — matches build/deploy time, not true per-page content-modification tracking. This is primarily a sitemap-freshness-signal issue (seo-sitemap-agent's territory), flagged here only because it slightly weakens the crawl-priority signal Google derives from lastmod deltas (with everything stamped identically, Google has no basis to prioritize re-crawling genuinely-changed pages over unchanged ones).
- **Recommendation**: Generate `lastmod` per-page from actual content/frontmatter modification time rather than a global build timestamp.

**10. Core Web Vitals lab data unavailable this run**
- **Evidence**: `pagespeed_check.py` returned `PSI rate limit exceeded (240 QPM / 25,000 QPD)` on every attempt (3 tries across the session) — this is Google's PageSpeed Insights API quota, not a site issue, and reset timing is outside this session's control. `lcp_subparts.py` additionally requires a configured Google API key (`google_auth.py --setup`), which isn't provisioned in this environment.
- **Source-inspection substitute performed instead**: Homepage has no `<img>` tags at all (hero is text/CSS-only, so no LCP-image risk from missing `fetchpriority="high"`), one render-blocking-adjacent stylesheet reference (currently broken — see Critical #1) and one font preload, all JS chunks load `async`, and total initial HTML payload is 66KB with sub-100ms TTFB. In isolation (i.e., once Critical #1 is fixed) these signals suggest a *lean* CWV profile; `preload_check.py` scored 50/100, docked specifically for no `<script type="speculationrules">` prefetch/prerender and no `fetchpriority="high"` LCP hint — both legitimate but secondary optimizations once the CSS defect is resolved.
- **Recommendation**: Re-run `pagespeed_check.py` once PSI quota resets (or provide a PSI API key) to get real lab LCP/INP/CLS numbers, ideally after Critical #1 is fixed since the current broken-CSS state would produce meaningless/artificially-good CLS numbers (nothing shifts if nothing renders) that don't reflect the real production experience.

---

## Category Scores (component of overall 58/100)

| Category | Status | Notes |
|---|---|---|
| Crawlability | Pass | robots.txt clean, sitemap valid, no accidental disallow |
| Indexability | Fail | 2 broken canonicals (High); trailing-slash duplication risk (Medium) |
| Security | Partial | Good baseline headers; HSTS disabled (High), no CSP (Medium), framework leak (Low) |
| URL Structure | Pass | Clean paths, correct redirects, no case-duplication |
| Mobile | Pass (markup-level) | Correct viewport tag; visual mobile-friendliness currently undermined by Critical #1 |
| Core Web Vitals | Blocked/Unverifiable | PSI quota exhausted; source signals otherwise favorable but invalidated by Critical #1 |
| Structured Data (crawl-validity) | Pass | All JSON-LD blocks parse validly, no truncation |
| JS Rendering | Pass | SSR/SSG-first, full content in raw HTML, no CSR dependency |
| IndexNow | Not implemented | No key file or verification tags found |

Files referenced:
- `/home/mike/nebula/nebulacomponents.shop-audit/screenshots/homepage-broken-css.png/nebulacomponents_shop_desktop.png` (visual proof of Critical #1)
