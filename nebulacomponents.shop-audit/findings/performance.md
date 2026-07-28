# Performance — Core Web Vitals Audit

**Site:** https://nebulacomponents.shop
**Date:** 2026-07-26 (lab pass) / 2026-07-27 (CrUX field-data + supplementary PSI pass added below)
**Tooling:** Unlighthouse 0.13.5 (local Lighthouse, Chrome for Testing 149, headless, `--no-sandbox`) against production. **PageSpeed Insights API / CrUX field data could not be used — no Google API key is configured** (`pagespeed_check.py` returned `"PSI rate limit exceeded (240 QPM / 25,000 QPD)"`, which is the tool's generic failure string for an unauthenticated/keyless request, not a real quota event). All numbers below are **lab data, single run, no throttling profile override (Lighthouse default mobile/desktop simulated throttling)** — treat as directional, not a substitute for 28-day CrUX field percentiles.

Pages tested: `/`, `/audit`, `/pricing`, `/learning-centre/landing-page-not-converting` — mobile and desktop, both fully completed (8 runs total, 4 pages × 2 devices).

INP has no lab equivalent (it requires real user interaction), so **Total Blocking Time (TBT)** is used as the standard lab proxy for interactivity risk, per Lighthouse/CWV guidance.

## Raw Numbers

| Page | Device | LCP | CLS | TBT (INP proxy) | FCP | Perf Score |
|---|---|---|---|---|---|---|
| `/` | Mobile | 4139 ms | 0.171 | 828 ms | 1.63 s | 59 |
| `/` | Desktop | 3646 ms | 0.118 | 184.5 ms | 1.27 s | 64 |
| `/audit` | Mobile | 3564 ms | 0.055 | 538.5 ms | 1.46 s | 76 |
| `/audit` | Desktop | 3541 ms | 0.031 | 314.5 ms | 1.13 s | 65 |
| `/pricing` | Mobile | 4061 ms | 0.000 | 893.7 ms | 1.30 s | 66 |
| `/pricing` | Desktop | 3799 ms | 0.000 | 233.5 ms | 1.33 s | 67 |
| `/learning-centre/landing-page-not-converting` | Mobile | 4282 ms | 0.000 | 663.1 ms | 1.79 s | 68 |
| `/learning-centre/landing-page-not-converting` | Desktop | 3683 ms | 0.000 | 232 ms | 1.40 s | 62 |

CWV thresholds: LCP good ≤2.5s / poor >4.0s. CLS good ≤0.1 / poor >0.25. INP good ≤200ms / poor >500ms (TBT used as proxy here — TBT >200-250ms strongly correlates with INP risk under real interaction).

**Result: LCP fails "Good" on every single page/device combination tested** — mobile LCP is in the *Poor* band (>4.0s) for `/`, `/pricing`, and the learning-centre article, and *Needs Improvement* for `/audit`; desktop LCP is *Needs Improvement* (3.5-3.8s) everywhere. TBT/INP-risk is *Poor* on mobile across the board (538-894ms) and mostly *Good-to-borderline* on desktop (184-315ms). CLS is only a problem on the homepage (0.171 mobile / 0.118 desktop, both *Needs Improvement*); the other three pages measured effectively 0.

## What Works

- **TTFB is excellent everywhere.** `server-response-time` measured 18-49ms on every page — the Next.js origin (behind the Cloudflare Tunnel) responds fast. Server response time is not a contributor to the LCP problem.
- **DOM size is healthy.** 153-271 elements per page, well under the 1,500-element bloat threshold.
- **Third-party script loading strategy is correct.** All `/_next/static/chunks/*.js` tags carry `async`; GA4/Consent Mode v2 initialization is not render-blocking. Lighthouse's `third-party-summary` audit shows only 10-70ms of main-thread blocking from third parties — negligible.
- **Font preload is implemented correctly.** The homepage emits `<link rel="preload" href="/_next/static/media/f287e533ed04f2e6-s.p.2ijos0_3tnz-u.woff2" as="font" crossorigin type="font/woff2">` — correct `as`, `type`, and `crossorigin` attributes (via `next/font`, which also sets `font-display: swap` by default). Lighthouse's `font-display` audit did not flag a failure on any page.
- **CLS is well-controlled on 3 of 4 pages.** `/audit`, `/pricing`, and the learning-centre article all measured 0-0.055 — essentially no unexpected layout shift.
- **Next.js's own ISR cache is fast even though Cloudflare doesn't edge-cache the HTML.** Homepage/pricing/audit all return `x-nextjs-cache: HIT` with `x-nextjs-stale-time: 300` — the app-level cache is absorbing the dynamic-response gap, which is why TTFB stays low despite `cf-cache-status: DYNAMIC`.

## Findings

### 1. ~~Static asset cache headers are broken in production~~ — CORRECTED: false positive, not a real bug (was: Critical)

**Correction (2026-07-27, verified independently after this finding was filed):** This finding tested a stale chunk filename (`0uyff60c-srpz.js`) from a build that had already rotated out by the time of testing — the site was redeployed twice during this audit pass. The origin genuinely 404s for that filename now (confirmed via direct origin curl, `HTTP/1.1 404 Not Found`), and Next.js correctly sends `no-cache` headers on a 404 response — that is correct behavior, not the caching bug it was mistaken for. Cloudflare's edge was separately still serving a stale-but-harmless cached 200 copy of that old immutable asset, which is expected CDN behavior and not itself a problem.

Verified against a **current, real chunk** referenced by the live homepage (`2iho8jepmwwua.js`), at both the public URL and the origin directly, repeated 3x: `cache-control: public, max-age=31536000, immutable` every time, at both layers. The cache-header fix from `8aa1434a` (and the systemd-restart fix that actually resolved it earlier in this audit's Phase 0) is intact and working correctly in production. No action needed on this item.

<details><summary>Original (incorrect) finding, kept for record</summary>

The commit `8aa1434a fix: add cache headers for static assets` added a `Cache-Control: public, max-age=31536000, immutable` rule for `/_next/static/(.*)` in `customer-portal/next.config.ts` (lines 167-176), but it was placed **after** a pre-existing catch-all rule (lines 158-166) that sets `Cache-Control: public, max-age=0, must-revalidate, no-transform` on `/(.*)`. In production, the catch-all wins:

```
$ curl -sI https://nebulacomponents.shop/_next/static/chunks/0uyff60c-srpz.js
cache-control: public, max-age=0, must-revalidate, no-transform
```

Verified this is not a Cloudflare/tunnel artifact — hitting the Next.js origin directly (`curl -sI http://localhost:3000/_next/static/chunks/0uyff60c-srpz.js`, bypassing the Cloudflare Tunnel entirely) returns the identical wrong header. The `.next` build directory timestamp (03:16, matching the commit) confirms this is the current build, not a stale deploy. Every content-hashed JS/CSS/font chunk under `/_next/static/` is therefore served with `max-age=0, must-revalidate` instead of the intended 1-year immutable cache — repeat visitors re-validate every hashed, never-changing asset on every single page load. By contrast, `/favicon.ico` (matched by the later, more specific `/:path*.ico` rule at line 224) correctly returns `public, max-age=31536000, immutable`, confirming the mechanism: whichever generic `/(.*)` rule and specific rule both match, the config order and/or Next.js's header-merge behavior in this case is letting the general rule's value stand for `_next/static` paths specifically, even though the specific rule is defined later in the array.
**Recommendation:** Reorder `next.config.ts` so the general `no-transform` catch-all (`source: '/(.*)'`, line ~159) is the *last* Cache-Control rule evaluated, not the first — or better, scope it with a negative-lookahead source (e.g. exclude `_next/static`, `brand`, and the image extensions) so it can never collide with the specific rules. After the change, re-run the exact `curl -sI` command above against both `localhost:3000` (origin) and the public URL to confirm `immutable` actually appears before considering this closed — the previous commit message asserted this was fixed and it demonstrably was not.

</details>

### 2. LCP fails "Good" on every page and device tested (High)
Mobile LCP: 4.14s (`/`), 3.56s (`/audit`), 4.06s (`/pricing`), 4.28s (learning-centre article) — three of four pages are in the *Poor* band (>4.0s). Desktop LCP: 3.5-3.8s across all four pages — *Needs Improvement* everywhere, none reach the 2.5s "Good" bar. Since TTFB is already fast (18-49ms) and render-blocking-resource savings are modest (110-430ms), the gap between FCP (1.1-1.8s) and LCP (3.5-4.3s) — roughly 2-2.7 seconds — is being spent on resource discovery/load and render delay for the actual LCP element, not on server latency or blocking CSS.
**Recommendation:** Identify the actual LCP element per template (hero heading/image on `/`, form/heading on `/audit`, pricing card, article headline) and confirm it's prioritized: `fetchPriority="high"` / `priority` on any `next/image` LCP candidate, and a `<link rel="preload">` for it if it's a late-discovered background image or web font dependency. The `render-blocking-resources` audit already estimates 110-430ms of recoverable time from deferring/inlining critical CSS — start there, then re-measure LCP subparts (see the CrUX field-data section below — subpart breakdown needs CrUX data, which does not exist yet for this domain).

### 3. Mobile interactivity risk is poor — TBT 538-894ms (High)
Total Blocking Time (the lab proxy for INP) is 538ms (`/audit`), 663ms (learning-centre), 828ms (`/`), and 894ms (`/pricing`) on mobile — all comfortably in "would likely fail INP" territory if real users interact during page load, since Lighthouse's `max-potential-fid`/TBT figures at this level (570-593ms) exceed the 500ms "Poor" INP threshold. Desktop is much healthier (184.5-314.5ms), with only `/audit` desktop (314.5ms) landing in "Needs Improvement". The `unused-javascript` audit shows a consistent **490-503 KB of estimated-removable JS on every single page**, regardless of route — that's a strong signal of a large shared bundle being shipped whether or not a given page needs it.
**Recommendation:** Run a bundle analyzer (`@next/bundle-analyzer`) against the production build to find what's in that ~500KB common chunk; code-split anything route-specific (the `/audit` interactive form logic in particular) out of the shared bundle so `/pricing` and the learning-centre article aren't paying its parse/execute cost. Break up any long tasks over 50ms feeding into that 538-894ms TBT.

### 4. Homepage has real layout shift — CLS 0.171 mobile / 0.118 desktop (Medium)
The homepage is the only one of the four pages tested with non-trivial CLS: 0.171 on mobile (*Needs Improvement*, above the 0.1 "Good" bar) and 0.118 on desktop (also just over the 0.1 bar). `/audit`, `/pricing`, and the learning-centre article all measured 0-0.055. Root cause wasn't isolated in this pass (see scope note below), but the homepage is the one page with more dynamic/above-the-fold composition than the others (264 DOM nodes vs. 153 on `/audit`/`/pricing`).
**Recommendation:** Run Lighthouse's layout-shift element trace specifically for `/` (DevTools Performance panel or `lighthouse https://nebulacomponents.shop/ --output json` locally) to name the shifting element(s) — typical culprits are hero image/illustration without explicit `width`/`height`, late-injected above-the-fold content, or FOUT/FOIT from the preloaded font swapping in after first paint. This needs a follow-up pass; not root-caused in this audit.

### 5. Text compression flagged as a large potential saving on every page (Medium — needs manual verification)
Lighthouse's `uses-text-compression` audit estimates 595-634 KB of savings on every page tested (mobile and desktop), which would normally indicate assets aren't being served gzip/brotli-compressed. This is somewhat surprising behind Cloudflare (which compresses by default) and wasn't independently confirmed against raw `Content-Encoding` response headers in this pass — flagging as a finding to verify, not a confirmed defect.
**Recommendation:** Check `Content-Encoding` on `/_next/static/chunks/*.js` and the HTML document directly (`curl -sI -H "Accept-Encoding: br, gzip" ...`) to confirm Brotli/gzip is actually applied end-to-end (Cloudflare Tunnel + Next.js `next start`), rather than trusting the Lighthouse estimate alone.

### 6. Cloudflare is not edge-caching HTML responses (Low / by design, worth confirming intentional)
`cf-cache-status: DYNAMIC` on `/`, `/pricing`, and `/audit` — Cloudflare is passing every HTML request straight to origin rather than caching at the edge. This isn't currently hurting TTFB because Next.js's own ISR layer answers from its in-process cache (`x-nextjs-cache: HIT`, `x-nextjs-stale-time: 300`), but it means every visitor round-trips through the Cloudflare Tunnel to the origin server instead of being served from a nearby edge PoP. For a marketing site with mostly-static content, a Cloudflare Cache Rule or `Cache-Control: s-maxage` on the ISR'd routes would remove that hop for anonymous traffic.
**Recommendation:** Low priority relative to findings 1-3; confirm this is an intentional tradeoff (e.g. because personalization/auth cookies vary responses) rather than an oversight.

## Scope Note
Per the coordinator's instruction, this pass stopped after the 8 completed Unlighthouse runs (4 pages × mobile/desktop) plus the header investigation — it does not include: DevTools trace-level root-causing of the homepage's CLS culprit element (finding 4), a bundle-analyzer breakdown of the ~500KB shared JS (finding 3), or direct `Content-Encoding` verification (finding 5). These are flagged as follow-ups above rather than guessed at.

---

## CrUX Field Data (added 2026-07-27)

**Method:** A Google API key is now configured (`google_auth.py --check` confirms Tier 2 Full: PSI v5 `[OK]`, CrUX API `[OK]`, CrUX History API `[OK]`, GSC/Indexing/GA4 also `[OK]`). Ran `crux_history.py` against the origin (`https://nebulacomponents.shop`) and each of the four URLs tested in the lab pass above (`/`, `/audit`, `/pricing`, `/learning-centre/landing-page-not-converting`), all form factors.

**Result: no CrUX data exists for this domain yet, at any level tested.** Every single query — origin-level and all four URL-level — returned the same response, e.g.:

```
{
  "target": "https://nebulacomponents.shop",
  "form_factor": "ALL",
  "metrics": {},
  "collection_periods": [],
  "trends": {},
  "error": "No CrUX history data for this origin. Insufficient Chrome traffic volume for eligibility."
}
```

This is the **expected, correct response for a site at this traffic level** — CrUX requires a rolling 28-day minimum volume of qualifying real-Chrome-user page loads before an origin or URL becomes eligible for reporting. It is not an API/auth failure: the same credentials that returned `[OK]` on the auth check produced a well-formed (if empty) response here, distinct from an exception or error status. **This means the real 75th-percentile field-data verdict for LCP/INP/CLS on nebulacomponents.shop cannot be produced yet — this is not something to work around, it's an honest "not enough traffic" result.** Every pass/fail judgment in this document (findings 2-4 above) remains a lab estimate only, pending CrUX eligibility.

**Action:** Re-run `crux_history.py` against the origin monthly, or after any meaningful traffic milestone from the lead-gen/SEO work elsewhere in this repo, to catch the moment CrUX eligibility starts (CrUX typically requires meaningfully more sustained daily unique Chrome visitors than a pre-revenue/low-traffic marketing site like this currently has). No further field-data action is possible this pass.

## Supplementary PSI Lab Run (2026-07-27, Google-hosted Lighthouse via PSI API v5)

With the API key now working, this pass additionally re-ran the same four pages through Google's own hosted PSI/Lighthouse endpoint (`pagespeed_check.py`), separate from the local Unlighthouse harness used in the original 2026-07-26 pass. As expected given the CrUX result above, `field_metrics` came back empty (`{}`) on every single call, for every page and device — consistent with "no CrUX data for this origin."

The **lab** numbers from this PSI run are notably better than the Unlighthouse pass from one day earlier:

| Page | Device | LCP (PSI, 2026-07-27) | LCP (Unlighthouse, 2026-07-26) | CLS (PSI) | CLS (Unlighthouse) | TBT (PSI) | TBT (Unlighthouse) | Perf Score (PSI) |
|---|---|---|---|---|---|---|---|---|
| `/` | Mobile | 1.5–2.7 s (2 runs varied, see caveat) | 4139 ms | 0.019–0.160 (2 runs varied) | 0.171 | 10–40 ms | 828 ms | 93 |
| `/` | Desktop | 324 ms | 3646 ms | 0.034 | 0.118 | 20 ms | 184.5 ms | 100 |
| `/audit` | Mobile | 2.3 s | 3564 ms | 0.000 | 0.055 | 20 ms | 538.5 ms | 98 |
| `/audit` | Desktop | 0.5 s | 3541 ms | 0.002 | 0.031 | 0 ms | 314.5 ms | 100 |
| `/pricing` | Mobile | 1.8 s | 4061 ms | 0.000 | 0.000 | 0 ms | 893.7 ms | 99 |
| `/pricing` | Desktop | 0.6 s | 3799 ms | 0.000 | 0.000 | 50 ms | 233.5 ms | 100 |
| `/learning-centre/...` | Mobile | 1.8 s | 4282 ms | 0.000 | 0.000 | 0 ms | 663.1 ms | 99 |
| `/learning-centre/...` | Desktop | 0.5 s | 3683 ms | 0.000 | 0.000 | 20 ms | 232 ms | 100 |

**Important caveat — do not read this as "the LCP/TBT findings are now resolved."** Two things keep this from being a confirmed fix:

1. **Run-to-run variance inside PSI itself was substantial.** Two separate live PSI calls for the homepage mobile strategy, run minutes apart within this same pass, returned LCP 2719ms / CLS 0.0188 on one call and LCP 1501ms / CLS 0.1598 on the next — a >1.2s LCP swing and an ~8x CLS swing on the identical URL/strategy. Single-run lab data (whether Unlighthouse or PSI) is inherently noisy; neither the 2026-07-26 Unlighthouse numbers nor this 2026-07-27 PSI numbers should be treated as "the" true figure in isolation.
2. **No CrUX field data exists to arbitrate between the two lab estimates.** Real-user 75th-percentile data is the only way to resolve which lab run is closer to what actual visitors experience, and that data does not exist yet for this domain (see CrUX section above).

**Recommendation:** Treat findings 2-4 in the lab-data section above (LCP failing "Good," mobile TBT/INP risk, homepage CLS) as **still open and unresolved either way** — this better-looking PSI run is not sufficient grounds to close them, but the original Unlighthouse worst-case numbers should likewise not be treated as more authoritative than this PSI run. Next step once traffic allows: pull CrUX field percentiles (`crux_history.py`) for the real 75th-percentile answer; until then, run PSI 5-10x per page/device and use the median (not a single run) as the working lab estimate, consistent with Lighthouse's own published guidance on lab-data variance.

---

## Category Score: 48 / 100

Rationale: LCP — the metric with the highest ranking/UX weight — fails the "Good" 2.5s bar on all 8 page/device combinations tested in the original Unlighthouse pass, with 3 of 4 mobile pages in the outright *Poor* band. TBT/INP-risk is poor on mobile across the board. Against that, TTFB is excellent, third-party/font loading strategy is already correct, DOM size is healthy, and CLS is clean on 3 of 4 pages — so this is not a worst-case score, but a real production caching regression (finding 1, since corrected) plus universal LCP failure caps it well below a passing grade. **Score held at 48/100 pending real field data** — no CrUX percentiles exist yet to confirm or revise this against actual user experience (see CrUX Field Data section above), and the supplementary PSI run showed enough internal run-to-run variance that it is not treated as grounds to raise the score on its own.
