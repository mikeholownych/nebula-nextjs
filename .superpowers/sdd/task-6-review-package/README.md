# Task 6 review package

Scope: review blockers for the local blog migration only.

Commit under review: `2617fbf1b` (`test(blog): close Task 6 review blockers`)

Included files:

- `task-6-report.md`
- `docs/releases/2026-09-05-local-blog-migration.md`
- `customer-portal/__tests__/blog-routes.test.tsx`

This package intentionally excludes all unrelated dirty worktree paths. The repository report and release record contain the complete Task 6 commit chain and fresh verification summary. This package contains the raw local verification evidence.

Verification recorded from `/home/mike/nebula/customer-portal`:

- Focused Jest: 3 suites, 38 passed
- Full Jest: 102 suites, 844 passed, 8 skipped, 852 total
- Playwright: 54 passed
- Typecheck and lint: exit 0
- Build: exit 0 after `npm ci --ignore-scripts` repaired the incomplete local dependency installation; 358/358 static pages generated
- Sitemap route probe: local sitemap HTTP 200; 186 unique local paths returned HTTP 200 with nonempty bodies
- Local blog probes: `/blog` and both published article routes returned 200 with canonical, JSON-LD, and CTA markers; stale article URL returned 404
- Full Jest skips: exactly 8 unrelated planned topic-guide assertions, unchanged; no Task 6 tests skipped or bypassed
- Raw command logs, including the initial `slash` failure and the first no-server sitemap probe, are in `verification/`
- Source scan and `git diff --check`: clean for scoped changes

No deployment or production restart was performed.
