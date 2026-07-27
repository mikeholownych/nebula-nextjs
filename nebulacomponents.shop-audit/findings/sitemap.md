# Sitemap Audit — nebulacomponents.shop

Source: `https://nebulacomponents.shop/sitemap.xml` (declared in `robots.txt`, HTTP 200, single `urlset`, no sitemap index). 33 `<url>` entries, 6.4 KB uncompressed. Repo generator: `customer-portal/app/sitemap.ts` (+ `customer-portal/app/learning-centre/lib/getArticles.ts`).

## What Works

- Valid XML: well-formed `urlset`, correct `UTF-8` declaration, no BOM, served with `Content-Type: application/xml` and `X-Content-Type-Options: nosniff`.
- Correctly declared in `robots.txt` (`Sitemap: https://nebulacomponents.shop/sitemap.xml`), and discoverable at the standard path.
- No sitemap-index complexity needed and none present — appropriate for this size.
- Hard limits: 33 URLs / 50,000 and 6.4 KB / 50 MB — nowhere near the per-file cap. No `news:` namespace in use.
- No location-page doorway pattern present — the 30+/50+ location-page quality gate does not apply to this site (not a multi-location business).
- All 33 sitemap URLs spot-checked return HTTP 200 live — no dead links, no redirect chains, no noindexed URLs *inside* the sitemap itself.
- `priority`/`changefreq` are correctly ignored by Google (deprecated), so their presence is informational risk only, not a ranking issue.

## Findings

### 1. Sitemap generator is stale relative to actual site content — 5 live, indexable articles missing from sitemap.xml
**Severity:** High
**Description:** Cross-referencing the live sitemap against every `learning-centre/*` directory that has a committed `meta.json` (the article-eligibility marker used by `getArticles()`) shows 5 pages that return HTTP 200 in production, have no `noindex`, and are missing from `sitemap.xml`:
- `/learning-centre/above-fold-landing-page` (also linked from the `/learning-centre` index page itself — this one is doubly confirmed)
- `/learning-centre/coach-consultant-landing-page`
- `/learning-centre/landing-page-conversion-rate-benchmark`
- `/learning-centre/linkedin-ads-not-converting`
- `/learning-centre/tiktok-ads-not-converting`

Root cause identified in the repo: the **deployed** `sitemap.ts` is running an older, hand-maintained hardcoded array of learning-centre slugs (visible via `git diff HEAD -- customer-portal/app/sitemap.ts`, which shows an uncommitted local rewrite from a hardcoded `learningArticles` array to a `getArticles()` filesystem scan). The hardcoded array was never updated when these 5 articles were added, so they shipped as live pages but never entered the sitemap. This is a deployment/process gap, not a one-off content mistake — it will keep recurring under the old mechanism.

**Recommendation:** Add these exact blocks to `sitemap.xml` (or, better, ship the already-drafted `getArticles()`-based `sitemap.ts` — see Finding #2 for the caveat that must be fixed first):
```xml
<url>
  <loc>https://nebulacomponents.shop/learning-centre/above-fold-landing-page</loc>
  <lastmod>2026-07-26</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://nebulacomponents.shop/learning-centre/coach-consultant-landing-page</loc>
  <lastmod>2026-07-26</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://nebulacomponents.shop/learning-centre/landing-page-conversion-rate-benchmark</loc>
  <lastmod>2026-07-26</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://nebulacomponents.shop/learning-centre/linkedin-ads-not-converting</loc>
  <lastmod>2026-07-26</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://nebulacomponents.shop/learning-centre/tiktok-ads-not-converting</loc>
  <lastmod>2026-07-26</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

### 2. The uncommitted sitemap.ts fix will silently drop 3 currently-live articles that lack meta.json
**Severity:** High (regression risk — flagging before it ships makes this a near-miss, not an incident)
**Description:** The working-tree rewrite of `sitemap.ts` (uncommitted) switches from the hardcoded array to `getArticles()`, which requires a `meta.json` file per article directory (`getArticles.ts` line 26: `if (!fs.existsSync(metaPath)) continue`). Three articles are live in production (HTTP 200, confirmed) and are in the *current* live sitemap (because they're still in the old hardcoded array) but have **no `meta.json`** in the repo at all:
- `/learning-centre/founder-second-brain`
- `/learning-centre/linkedin-skill-engine`
- `/learning-centre/specialist-ai-agent-library`

If `sitemap.ts` is deployed as currently drafted, without adding `meta.json` to these three directories first, all three will silently disappear from the sitemap on the next deploy — a self-inflicted coverage regression introduced by the very fix meant to solve Finding #1.
**Recommendation:** Before merging/deploying the new `sitemap.ts`: add a `meta.json` (title, category, description) to `founder-second-brain`, `linkedin-skill-engine`, and `specialist-ai-agent-library`, matching the schema `ArticleMeta` in `getArticles.ts`. Add a CI/test guard (e.g. extend `customer-portal/__tests__/metadata/sitemap-inventory.test.ts`, which already exists in this checkout) that fails the build if any `learning-centre/*/page.tsx` exists without a sibling `meta.json`, so this class of drift can't recur silently.

### 3. lastmod is uniform across all 33 URLs and reflects build time, not content freshness
**Severity:** Medium
**Description:** Every entry in the live sitemap carries the identical timestamp `2026-07-26T01:10:37.057Z`, confirmed by direct fetch. This is the build/deploy timestamp, not a genuine per-page last-significant-change date. Google explicitly discounts `lastmod` signals it judges untrustworthy (e.g., uniformly identical across an entire sitemap, or updated on every deploy regardless of content change), so this field is currently providing no crawl-prioritization value and could actively cause Google to distrust `lastmod` site-wide going forward.

Notably, the in-progress `sitemap.ts` rewrite has already anticipated this: it *intentionally omits* `lastModified` entirely, with the code comment "lastModified is intentionally omitted until each content object has a truthful, durable publication/update timestamp. Build time is not freshness." That is the correct interim call — omitting the field is better than emitting a dishonest one — but it is not yet deployed (see Finding #1/#2), so production is currently in the worse state (dishonest uniform timestamp) rather than the better one (no timestamp).
**Recommendation:** Ship the `lastModified`-omitting version once Finding #2 is resolved. Longer term, wire real per-article `updatedAt` (or `publishedAt` as a floor) into each `meta.json` and re-introduce `lastmod` only once it reflects genuine content-change dates — do not reintroduce a synthetic/build-time value.

### 4. Legal/utility pages share top-tier priority (0.9) with primary commercial pages
**Severity:** Low
**Description:** `sitemap.ts`'s `corePages` array gives `/privacy-policy` and `/data-rights` the same `priority: 0.9` as `/pricing` and `/audit` (the two commercial conversion pages). `priority` is a deprecated, Google-ignored tag, so this has no live ranking impact, but it is a stale/incorrect authoring signal that misrepresents actual page importance and could mislead other crawlers/tools (or a future engineer) that still weight it.
**Recommendation:** If keeping `priority` at all (see Finding #5), lower legal pages to 0.1–0.3 and keep 0.9–1.0 reserved for `/`, `/pricing`, `/audit`.

### 5. priority and changefreq tags are deprecated/ignored by Google
**Severity:** Info
**Description:** Google has publicly stated both `<priority>` and `<changefreq>` are ignored for ranking/crawl-scheduling purposes. They add bytes with zero functional benefit for the dominant search engine (other engines' support is inconsistent and generally also weak).
**Recommendation:** Optional cleanup: remove both tags entirely in a future `sitemap.ts` revision to simplify the generator and avoid maintaining values (like Finding #4) that no consumer actually trusts. Not urgent — no harm from leaving them, only no benefit.

### 6. `/terms`, `/about`, `/about/team` missing from sitemap; `/about` and `/about/team` are also fully orphaned (no internal links anywhere)
**Severity:** Medium
**Description:** All three return HTTP 200 in production but are absent from `sitemap.xml`:
- `/terms` — linked from the site footer, so it is at least discoverable via crawl, just missing from the sitemap.
- `/about` and `/about/team` — confirmed not linked from the homepage, footer, or nav. The only internal reference found site-wide is in `/llms.txt`, and even there it points to a different, redirecting URL (`https://nebulacomponents.shop/company/about` → 308 → `/about`, and `/company/team` → 308 → `/about/team`) rather than the canonical final path. These pages are true orphans for a standard crawler with no sitemap entry and no followable on-site link.
**Recommendation:** Add all three to `sitemap.ts`'s `corePages` (or an equivalent low-priority static list), and add at least one real internal link to `/about` (e.g., in the footer or nav) so it isn't sitemap-only-discoverable. Separately, update `/llms.txt`'s "Key URLs" section to reference the canonical `/about` and `/about/team` paths directly instead of the redirecting `/company/*` aliases — not a sitemap defect per se, but adjacent and cheap to fix alongside this:
```xml
<url>
  <loc>https://nebulacomponents.shop/terms</loc>
  <lastmod>2026-07-26</lastmod>
  <priority>0.3</priority>
</url>
<url>
  <loc>https://nebulacomponents.shop/about</loc>
  <lastmod>2026-07-26</lastmod>
  <priority>0.5</priority>
</url>
<url>
  <loc>https://nebulacomponents.shop/about/team</loc>
  <lastmod>2026-07-26</lastmod>
  <priority>0.4</priority>
</url>
```

## Quality Gates Applied

- **Per-file limit (≤50,000 URLs / ≤50MB):** PASS — 33 URLs, 6.4 KB.
- **`news:` sitemap 1,000-URL cap:** N/A — no `news:` namespace sitemap present.
- **Location-page doorway thresholds (30+/50+):** N/A — not a multi-location business; no location-page pattern detected in the sitemap or crawl. No warning triggered.

## Coverage Summary

| Category | Count |
|---|---|
| URLs in live sitemap | 33 |
| Live (200) pages confirmed missing from sitemap | 8 (`above-fold-landing-page`, `coach-consultant-landing-page`, `landing-page-conversion-rate-benchmark`, `linkedin-ads-not-converting`, `tiktok-ads-not-converting`, `/terms`, `/about`, `/about/team`) |
| Sitemap URLs that are dead/redirected/noindexed | 0 |
| Articles at risk of silent future removal (pending code deploy) | 3 (`founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library`) |

## Category Score: 62/100

Scoring rationale: valid, well-formed, in-limits sitemap with zero dead/redirected/noindexed entries inside it (would otherwise score higher), but marked down for: 8 confirmed live pages missing from the index (including 2 fully orphaned pages with no discovery path at all besides direct URL knowledge), a uniform/dishonest `lastmod` across every entry, a mis-prioritized legal-page signal, and — most importantly — an identified process gap (hand-maintained slug list) that already caused the coverage gap once and, in its currently-drafted fix, is one merge away from causing a new regression for 3 other live articles.
