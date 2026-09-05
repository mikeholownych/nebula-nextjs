# Task 3 verification report

## Scope

Created the local server-rendered two-lane blog index and article route. The route uses the approved local blog loader, reads the two fixture articles from `app/blog/content`, excludes non-public statuses, emits canonical metadata and Article, Organization, Person, and conditional FAQPage JSON-LD, and relies on the existing root layout for navigation and footer. No production deployment, publish, push, payment, lead, credential, or analytics action was performed.

## Exact files

Created:
- `customer-portal/app/blog/page.tsx`
- `customer-portal/app/blog/[slug]/page.tsx`
- `customer-portal/app/blog/lib/render-markdown.tsx`
- `customer-portal/app/blog/content/paid-traffic-not-converting.md`
- `customer-portal/app/blog/content/what-we-got-wrong-about-filter-based-targeting.md`
- `customer-portal/__tests__/blog-routes.test.tsx`
- `.superpowers/sdd/task-3-report.md`

Modified:
- `customer-portal/app/lib/blog/loader.ts`, local `app/blog/content` fallback while preserving the approved configured-root behavior
- `customer-portal/app/sitemap.ts`, public local article entries

Pre-existing dirty files were not staged or modified by this task.

## TDD evidence

RED command:

```text
npm test -- --runInBand __tests__/blog-routes.test.tsx
```

Output before implementation:

```text
FAIL __tests__/blog-routes.test.tsx
Cannot find module '../app/blog/page'
Tests: 0 total
EXIT 1
```

GREEN focused command:

```text
npm test -- --runInBand __tests__/blog-routes.test.tsx
```

Output:

```text
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
EXIT 0
```

Regression loader plus route command:

```text
npm test -- --runInBand __tests__/blog-loader.test.ts __tests__/blog-routes.test.tsx
```

Output:

```text
Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total
EXIT 0
```

## Verification commands and outputs

```text
npm run typecheck
```

```text
EXIT 0
```

```text
npm run lint
```

```text
EXIT 0
```

```text
npm run check:sitemap-routes
```

```text
Sitemap route check passed: 184 routes returned HTTP 200 with nonempty bodies.
EXIT 0
```

```text
npm run build
```

```text
Compiled successfully
Finished TypeScript
Generating static pages using 11 workers (358/358)
EXIT 0
```

The build route table includes `○ /blog` and `ƒ /blog/[slug]`.

## Requirement checks

- Index discovers both acquisition and feature lanes: covered by route test.
- Acquisition and feature filtering: covered by route test and loader regression suite.
- Missing slug 404: covered by route test.
- Draft exclusion: approved loader filters drafts and route test verifies missing unpublished slug behavior.
- Canonical metadata, author, dates: covered by route test.
- Article, Organization, Person, conditional FAQPage JSON-LD: emitted by article route.
- Question H1: both fixtures use question-style or question-answer title H1s, rendered once by the route.
- Answer blocks: fixture answer blocks are 52 words and 50 words respectively.
- Question H2s: included in both fixtures.
- Self-contained sections and extractable sentences: included in both fixtures.
- Source links: included in both fixtures as internal Nebula source and related-reading links.
- FAQ: visible FAQ sections included in both fixtures and mapped to FAQPage JSON-LD.
- Internal links: included in both fixtures.
- Commercial CTA: acquisition route emits one clear `/audit` CTA; feature route does not emit it.
- No duplicate navigation or footer: route files contain neither and use the root layout-owned chrome.
- Opinly: no Opinly import or request exists in the new route files.
- No em dash character exists in the new route, test, fixture, or report content.

## Commit

Commit message: `feat(blog): render local two-lane article routes`

Commit SHA: `2d4277de377847755cb98810ccc99375ac6ccfaa`.

## Concerns

- The existing sitemap retains its pre-existing Opinly integration. In the test environment without `OPINLY_API_KEY`, it logs `Opinly is not configured: OPINLY_API_KEY is missing` and continues with local and other sitemap entries. The new `/blog` route does not call Opinly.
- The requested fixture location is `app/blog/content`, while the approved loader's configured default is the repository `content` root. The loader now adds a narrow fallback for the exact local fixture directory; explicit `NEBULA_CONTENT_ROOT` behavior remains unchanged.
- The requested live-service verification was not performed because the brief explicitly forbids deployment and external side effects. Local build, route checks, focused tests, typecheck, and lint were run.

## Task 3 review closure addendum

Implementation commit: `befdb702fc1325dc53553ab7fa44a57ceefeab75` (`fix(blog): close task 3 review findings`).

- Markdown destinations now allow relative paths and `https:` URLs only. `javascript:`, `data:`, protocol-relative, and other schemes are rendered as text.
- Article pages visibly render published date, updated date, author profile link, and `Founder of Nebula Components` credentials.
- Feature H1 and every article H2, including source, FAQ, and commercial CTA sections, are literal questions.
- Added a real `drafted` fixture at `customer-portal/app/blog/content/task-3-draft-fixture.md`; loader and route tests assert it is excluded.
- Route tests now parse every JSON-LD script with `JSON.parse`, assert Article, Organization, Person, and FAQPage, validate dates and attribution, no route-owned nav/footer, answer-block word counts, question headings, draft exclusion, and unsafe URL behavior.

Exact verification output after the closure changes:

```text
npm test -- --runInBand __tests__/blog-loader.test.ts __tests__/blog-routes.test.tsx
Test Suites: 2 passed, 2 total
Tests:       22 passed, 22 total
EXIT 0

npm test -- --runInBand __tests__/teardown-screenshot-integrity.test.ts
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
EXIT 0

npm run check:blog-content
27 passed
EXIT 0

npm run typecheck
EXIT 0

npm run lint
EXIT 0

npm run build
Compiled successfully
Finished TypeScript
Generating static pages using 11 workers (358/358)
Route table includes /blog and /blog/[slug]
EXIT 0

npm run check:sitemap-routes
Sitemap route check passed: 184 routes returned HTTP 200 with nonempty bodies.
EXIT 0

git diff --check
EXIT 0
```

No deployment, publish, push, payment, lead, credential, or external side effect was performed. Existing unrelated dirty worktree files were not staged.

## Latest review remediation evidence

### TDD RED before implementation

Command:

```text
npm test -- --runInBand __tests__/blog-routes.test.tsx
```

Result before the sanitizer and route changes:

```text
FAIL __tests__/blog-routes.test.tsx
Test Suites: 1 failed, 1 total
Tests:       10 failed, 6 passed, 16 total
```

The failures reproduced malformed traversal/javascript slugs escaping as `Invalid article slug`, control/newline protocol obfuscation returning a non-null href, and missing feature answer/schema assertions.

### GREEN and required gates

```text
npm test -- --runInBand __tests__/blog-routes.test.tsx
Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
EXIT 0

npm test -- --runInBand
Test Suites: 101 passed, 101 total
Tests:       8 skipped, 838 passed, 846 total
EXIT 0

npm run typecheck
EXIT 0

npm run lint
EXIT 0

npm run check:content-pipeline
27 passed
EXIT 0

npm run check:sitemap-routes
Sitemap route check passed: 184 routes returned HTTP 200 with nonempty bodies.
EXIT 0

npm test -- --runInBand __tests__/teardown-screenshot-integrity.test.ts
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
EXIT 0

npm run build
Compiled successfully
Finished TypeScript
Generating static pages using 11 workers (358/358)
Route table includes /blog and /blog/[slug]
EXIT 0

git diff --check
EXIT 0
```

The focused tests now cover real NUL/newline and percent-encoded protocol obfuscation, traversal-like and javascript-like slugs, both acquisition and feature JSON-LD validity and structures, visible/schema parity, exact 40 to 60 word answer blocks, dates, author profile, question headings, draft exclusion, and duplicate navigation/footer absence. URL handling parses and normalizes candidates, allowing only same-origin relative URLs and HTTPS URLs while rendering unsafe destinations as inert text. Invalid loader inputs are converted to `notFound()` in the route.

Implementation commit:

```text
13081538f41b2ce9fc001695c19901b490f49733 fix(blog): harden URL and slug handling
```
