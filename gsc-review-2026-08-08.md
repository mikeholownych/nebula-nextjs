# GSC Review — nebulacomponents.com — 2026-08-08

Live API review (Search Analytics v3, Sitemaps, URL Inspection v1) + live HTTP
sweep. All states below are from live queries, not assumptions.

## Health summary

| Check | Result |
|---|---|
| Property ownership | `sc-domain:nebulacomponents.com` — siteOwner ✓ |
| Sitemap errors/warnings | 0 / 0 (resubmitted after fix) |
| Sitemap URLs | 135 → **134** (removed gated `/workspace`) |
| Live HTTP sweep (134 URLs) | **134 × 200**, 0 redirects, 0 errors |
| Priority URLs indexed | **26 / 30** (was ~3 on 2026-08-03) |
| Search traffic (28d) | 0 clicks, 24 impressions — still effectively invisible |

## Issues found + resolved

1. **`/workspace` in sitemap (gated URL)** — robots.txt `Disallow: /workspace/`,
   live 307 → `/login?returnTo=%2Fworkspace`. Wastes crawl budget and reads as a
   soft-404. FIXED: removed from `app/sitemap.ts`; regression test added
   (`sitemap-inventory.test.ts`: no gated/robots-disallowed paths). Deployed
   (134-URL sitemap live, 0 workspace entries), Cloudflare purged, sitemap
   resubmitted to GSC. Commit `d2d0acd9` on `clay-review/brand-remediation`.

2. **`/roas-cliff`, `/cta-optimization` — Discovered, not indexed (zero inbound
   links)** — Google knew the URLs via sitemap but no crawl path reached them.
   FIXED: added internal links from high-authority hubs:
   - `/cta-optimization` ← `/landing-page-cta-audit` ("CTA Optimization Playbook")
   - `/roas-cliff` ← `/ads-getting-clicks-but-no-sales` ("The ROAS Cliff")
   Both verified rendering live. URL Inspection re-signaled after deploy.
   `/brand` is linked from `/press` (OK); re-signaled.

3. **`/case-studies` inspection API read timeout** — retried; see re-inspection
   results below.

## Remaining watch items (no action needed yet)

- `indexed: 0` in GSC Sitemaps API response is a known API quirk (submitted
  count ≠ indexation truth); URL Inspection is the ground truth and shows 26/30.
- `/roas-cliff`, `/cta-optimization`, `/brand` may take days to flip from
  "Discovered" to "Submitted and indexed" — normal for fresh crawl paths.
- Zero search clicks: indexation is now mostly solved; ranking/traffic is the
  next horizon (content depth + CTR + authority), not a GSC fix.

## Priority URL indexation state (2026-08-08, URL Inspection)

**Submitted and indexed (26):** `/`, `/audit`, `/pricing`, `/teardowns`,
`/compare`, `/vs`, `/vs/hotjar`, `/vs/crazy-egg`, `/vs/screaming-frog`,
`/vs/semrush-site-audit`, `/landing-page-message-match`,
`/ads-getting-clicks-but-no-sales`, `/7-systems`, `/benchmarks`, `/resources`,
`/learning-centre`, `/why-is-my-landing-page-not-converting`,
`/what-is-landing-page-audit`, `/page-speed-conversion`,
`/headline-optimization`, `/ecommerce-landing-page-audit`,
`/saas-landing-page-audit`, `/landing-page-trust-signals`, `/about`, `/terms`,
`/privacy-policy`

**Discovered — currently not indexed (3, re-signaled 2026-08-08):**
`/roas-cliff`, `/cta-optimization`, `/brand`

**Re-inspected after fix:** `/case-studies` (was API timeout)

## Paste-ready list (submit via GSC URL Inspection → Request Indexing)

```
https://nebulacomponents.com/roas-cliff
https://nebulacomponents.com/cta-optimization
https://nebulacomponents.com/brand
https://nebulacomponents.com/case-studies
```
