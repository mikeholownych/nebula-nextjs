# Fastest-growth SEO application (2026-09-09)

Status: implemented locally. Not production-live until guarded deploy.

## Evidence used

- GSC shop export: 26 queries, 60 total impressions. Only ranking query with a commercial page is `landing page audit` at position 2 on `/audit` (10 impressions, 1 click).
- Live origin (UA required; unauthenticated Python urllib gets Cloudflare 403): sitemap, robots, llms.txt, `/audit`, `/what-is-landing-page-audit`, `/ai-info`, `/checkout`, `/lab`, `/how-nebula-audits` all 200. `/research` was 404.
- Citable run `20260909T101107-audit---scope-usns`: incomplete (50-page crawl cap). Treat TECH-016, AGENT-003, and most LINK-001 rows as crawl artifacts unless independently verified.

## Applied now

1. `/audit` title and H1 lead with `landing page audit`. Informational `/what-is-landing-page-audit` stays on its own canonical.
2. `/research` hub created so the Q3 report no longer links to a 404.
3. `/ai-info` and `/research` added to footer crawl strip. `/research` added to sitemap.
4. Four Learning Centre articles now link to `/blog/paid-traffic-not-converting`.
5. Title/H1 language on above-fold, message-match, and bounce articles aligned to observed GSC query variants, including a homepage bounce section.

## Explicitly not applied

- Do not publish `app/blog/content/landing-page-audit.md`. A third URL on `landing page audit` would compete with `/audit` at position 2.
- Do not 301 `/what-is-landing-page-audit` onto `/audit`. Intent split is definition vs tool.
- Do not flip GPTBot/ClaudeBot/Google-Extended from registry `block` to `allow` without a legal owner decision (CRAWL-001).
- Do not treat Citable 616 findings as 616 defects. Re-run with a full URL set before remediating LINK-001 at volume.
- Homepage remains frozen.

## Re-evaluate

Raise `NEBULA_IMPRESSIONS_FLOOR` when monthly GSC impressions pass 1,000. Re-check `/audit` vs `/what-is-landing-page-audit` cannibalization after the next complete GSC window.
