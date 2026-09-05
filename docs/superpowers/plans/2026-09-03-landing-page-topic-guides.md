# Landing Page Topic Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a Topic Guide hub and four evidence-bound Learning Centre articles about landing-page conversion leaks, CRO tools, ad spend ROI improvement, and AI-assisted paid-traffic diagnosis versus traditional landing page builders.

**Architecture:** Add a nested `learning-centre/topic-guides` route group containing one hub and four article routes. Extend the existing article metadata loader to discover valid nested article directories without treating the hub as an article. Reuse the current Article schema, CollectionPage schema, Learning Centre visual language, internal-link conventions, and `/audit` CTA attribution.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS, JSON-LD, Jest, Testing Library, Playwright, existing npm CI pipeline.

## Global Constraints

- Deploy only through `bash scripts/deploy_customer_portal.sh` after all mandatory gates pass.
- No em dashes in user-facing title tags, metadata descriptions, headings, body text, or alt text.
- No conversion guarantees, fixed ROAS claims, fabricated benchmarks, testimonials, customer results, or unsupported superiority claims.
- Position Nebula as an evidence-backed landing page audit tool for paid traffic conversion leaks, not as a generic AI audit or page builder.
- Use `One-Leak Repair Sprint` for the $97 offer in new copy.
- Keep the homepage, `/audit` conversion flow, scoring model, and existing public marketing baseline unchanged.
- Every article must have substantive diagnostic guidance, actionable checks, a visible evidence boundary, descriptive internal links, and one attributable `/audit` CTA.
- The AI article must distinguish AI-assisted diagnosis from page construction and must state that conversion impact remains a testable hypothesis.
- Do not publish claims of improved citation visibility or conversion performance without attributable production evidence.

---

### Task 1: Add failing route and metadata coverage tests

**Blocks:** none (can start immediately)
**Demoable:** Tests define the five new public routes, metadata, answer-first structure, internal links, and claim boundaries before content implementation.

**Files:**
- Create: `customer-portal/__tests__/topic-guides-editorial.test.tsx`
- Modify: `customer-portal/__tests__/answer-first-editorial.test.tsx` only if shared priority coverage needs a bounded extension

**Interfaces:**
- Consumes: page component exports and `meta.json` sidecars produced by Tasks 2 and 3.
- Produces: stable acceptance tests for route existence, metadata, answer-first sections, descriptive links, CTA attribution, and unsupported-claim rejection.

- [ ] **Step 1: Write the failing test**

Create a test that enumerates the four article slugs and imports the hub. Assert that each article has `main`, an `article` schema script, a section with `data-editorial="answer-first"`, a heading containing `Direct answer`, an evidence-boundary note, a link to `/learning-centre/topic-guides`, a link to `/audit?utm_source=topic-guide-...&utm_medium=organic-content`, and at least two descriptive cluster links. Assert that source does not contain em dashes or banned outcome language such as `guarantees`, `will increase`, or `consistently outperforms`.

```tsx
const topicArticles = [
  'landing-page-conversion-leaks',
  'conversion-rate-optimization-tools',
  'ad-spend-roi-improvement',
  'ai-traffic-optimization-vs-landing-page-builders',
] as const

it.each(topicArticles)('has governed answer-first coverage: %s', async (slug) => {
  const mod = await import(`@/app/learning-centre/topic-guides/${slug}/page`)
  const { container } = render(<mod.default />)
  expect(container.querySelector('main')).not.toBeNull()
  expect(container.querySelector('section[data-editorial="answer-first"]')).not.toBeNull()
  expect(container.textContent).toMatch(/Direct answer/i)
  expect(container.textContent).toMatch(/evidence boundary/i)
  expect(container.innerHTML).toContain('/learning-centre/topic-guides')
  expect(container.innerHTML).toMatch(new RegExp(`/audit\\?utm_source=topic-guide-${slug}`))
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
cd /home/mike/nebula/customer-portal
npx jest __tests__/topic-guides-editorial.test.tsx --runInBand
```

Expected: FAIL because the four page modules and hub do not yet exist.

- [ ] **Step 3: Commit the test**

```bash
git add customer-portal/__tests__/topic-guides-editorial.test.tsx
git commit -m "test: define topic guide editorial contract"
```

---

### Task 2: Make nested Topic Guide metadata crawlable

**Blocks:** Task 1
**Demoable:** `getArticles()` discovers the four nested article sidecars, excludes the hub, and preserves existing direct-article behavior.

**Files:**
- Modify: `customer-portal/app/learning-centre/lib/getArticles.ts`
- Modify: `customer-portal/__tests__/answer-first-editorial.test.tsx` or create `customer-portal/__tests__/learning-centre-article-loader.test.ts` if loader coverage is not already present

**Interfaces:**
- Consumes: nested directories under `app/learning-centre/topic-guides` with `page.tsx` and `meta.json`.
- Produces: `getArticles(): ArticleMeta[]` entries whose `slug` is the route-relative path, for example `topic-guides/landing-page-conversion-leaks`, and whose generated URL remains `/learning-centre/${slug}`.

- [ ] **Step 1: Add loader coverage**

Assert that `getArticles()` includes the four nested slugs, excludes `topic-guides` itself, and retains at least one existing direct article.

```ts
const articles = getArticles()
const slugs = new Set(articles.map((article) => article.slug))
expect(slugs).toContain('topic-guides/landing-page-conversion-leaks')
expect(slugs).toContain('topic-guides/ai-traffic-optimization-vs-landing-page-builders')
expect(slugs).not.toContain('topic-guides')
expect(slugs).toContain('landing-page-not-converting')
```

- [ ] **Step 2: Run the loader test and verify it fails**

Run:

```bash
cd /home/mike/nebula/customer-portal
npx jest __tests__/learning-centre-article-loader.test.ts --runInBand
```

Expected: FAIL because the current loader scans only direct child directories.

- [ ] **Step 3: Implement recursive discovery**

Use a private recursive function that receives the absolute directory and route-relative prefix. Only directories containing both `page.tsx` and `meta.json` become articles. Recurse into other directories. Preserve development-time invalid metadata errors and production resilience.

```ts
function collectArticles(directory: string, prefix = ''): ArticleMeta[] {
  const articles: ArticleMeta[] = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('[')) continue
    const relativeSlug = prefix ? `${prefix}/${entry.name}` : entry.name
    const articleDir = path.join(directory, entry.name)
    const pagePath = path.join(articleDir, 'page.tsx')
    const metaPath = path.join(articleDir, 'meta.json')
    if (fs.existsSync(pagePath) && fs.existsSync(metaPath)) {
      articles.push(readArticleMeta(metaPath, relativeSlug))
    } else {
      articles.push(...collectArticles(articleDir, relativeSlug))
    }
  }
  return articles
}
```

Keep `SKIP` for `lib` and `citable`, and ensure the existing invalid-metadata behavior is preserved in `readArticleMeta`.

- [ ] **Step 4: Run loader and existing crawlability tests**

Run:

```bash
npx jest __tests__/learning-centre-article-loader.test.ts __tests__/answer-first-editorial.test.tsx --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add customer-portal/app/learning-centre/lib/getArticles.ts customer-portal/__tests__
git commit -m "feat: index nested topic guide articles"
```

---

### Task 3: Build the Topic Guide hub

**Blocks:** Task 2
**Demoable:** `/learning-centre/topic-guides` renders a crawlable, answer-first hub linking to every guide, the comparison article, and `/audit`.

**Files:**
- Create: `customer-portal/app/learning-centre/topic-guides/page.tsx`
- Create: `customer-portal/app/learning-centre/topic-guides/meta.json` only if the loader contract requires a sidecar; otherwise omit it so the hub is not indexed as an article
- Modify: `customer-portal/__tests__/topic-guides-editorial.test.tsx`

**Interfaces:**
- Consumes: article routes and metadata from Task 2.
- Produces: CollectionPage JSON-LD with four article URLs, descriptive cards, and one hub-attributed `/audit` link.

- [ ] **Step 1: Implement the hub**

Use metadata with a canonical URL of `https://nebulacomponents.com/learning-centre/topic-guides`. Render a direct answer section first, then four cards grouped under the requested themes. Link labels must be descriptive and must not use `click here`, `read more`, or generic labels.

- [ ] **Step 2: Verify focused hub tests**

Run:

```bash
npx jest __tests__/topic-guides-editorial.test.tsx --runInBand
```

Expected: hub assertions pass while the four article assertions remain pending until Task 4.

- [ ] **Step 3: Commit**

```bash
git add customer-portal/app/learning-centre/topic-guides/page.tsx customer-portal/__tests__/topic-guides-editorial.test.tsx
git commit -m "feat: add landing page topic guide hub"
```

---

### Task 4: Write the four governed Topic Guide articles

**Blocks:** Task 3
**Demoable:** Four substantive pages answer their target intents, explain observable paid-traffic conditions, link across the cluster, and preserve the causal evidence boundary.

**Files:**
- Create: `customer-portal/app/learning-centre/topic-guides/landing-page-conversion-leaks/page.tsx`
- Create: `customer-portal/app/learning-centre/topic-guides/landing-page-conversion-leaks/meta.json`
- Create: `customer-portal/app/learning-centre/topic-guides/conversion-rate-optimization-tools/page.tsx`
- Create: `customer-portal/app/learning-centre/topic-guides/conversion-rate-optimization-tools/meta.json`
- Create: `customer-portal/app/learning-centre/topic-guides/ad-spend-roi-improvement/page.tsx`
- Create: `customer-portal/app/learning-centre/topic-guides/ad-spend-roi-improvement/meta.json`
- Create: `customer-portal/app/learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders/page.tsx`
- Create: `customer-portal/app/learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders/meta.json`

**Interfaces:**
- Consumes: shared schema helpers and route conventions from existing Learning Centre articles.
- Produces: four public article routes with Article JSON-LD, canonical metadata, visible answer-first sections, descriptive cluster links, and unique CTA attribution.

- [ ] **Step 1: Write `meta.json` sidecars**

Use route-matching slugs and non-promissory descriptions. Keep titles concise and keyword-led. Use category `Topic Guides` for all four entries so the recursive loader and Learning Centre index classify them consistently.

- [ ] **Step 2: Write article content**

Every article must include the following JSX contract:

```tsx
<section data-editorial="answer-first" className="...">
  <p>Direct answer</p>
  <h2>Direct answer: ...</h2>
  <p>...</p>
  <div role="note" aria-label="Evidence boundary">...</div>
</section>
```

Content requirements:

- Conversion leaks: cover message match, headline clarity, CTA visibility, proof, mobile, load speed, and form friction as observable conditions. Do not imply that every failed condition caused lost revenue.
- CRO tools: compare page builders, analytics tools, session recordings, experimentation tools, and Nebula's paid-traffic audit category by job-to-be-done. State what each can establish and what it cannot.
- Ad spend ROI improvement: explain that page-level diagnosis can improve the quality of the next test, but do not promise ROI improvement. Use the sequence paid traffic promise, landing-page condition, scoped repair, same-condition re-audit, controlled measurement.
- AI comparison: explicitly cover Paid Traffic Specialisation, Pricing and Accessibility, and AI Traffic Optimisation for Paid Traffic Performance. Explain AI-assisted organization and interpretation of observable evidence versus traditional builder construction. Say that Nebula does not automatically change campaigns and that conversion impact remains unestablished until measured.

- [ ] **Step 3: Add internal links and CTAs**

Use these exact CTA source patterns:

```text
/audit?utm_source=topic-guide-landing-page-conversion-leaks&utm_medium=organic-content
/audit?utm_source=topic-guide-conversion-rate-optimization-tools&utm_medium=organic-content
/audit?utm_source=topic-guide-ad-spend-roi-improvement&utm_medium=organic-content
/audit?utm_source=topic-guide-ai-traffic-optimization-vs-landing-page-builders&utm_medium=organic-content
```

- [ ] **Step 4: Run editorial tests**

Run:

```bash
npx jest __tests__/topic-guides-editorial.test.tsx __tests__/answer-first-editorial.test.tsx --runInBand
```

Expected: PASS for all new article and existing editorial tests.

- [ ] **Step 5: Commit**

```bash
git add customer-portal/app/learning-centre/topic-guides
 git commit -m "content: publish landing page topic guides"
```

---

### Task 5: Run full quality and production gates

**Blocks:** Task 4
**Demoable:** The complete local release candidate passes static, content, unit, build, and E2E gates.

**Files:**
- Modify: none unless a failing governed test identifies a concrete content or route defect
- Test: existing `customer-portal` CI suite and new editorial tests

**Interfaces:**
- Consumes: completed hub, articles, loader, and tests.
- Produces: a deployable revision with captured exit codes and no unresolved gate failures.

- [ ] **Step 1: Run focused checks**

```bash
cd /home/mike/nebula/customer-portal
npm run typecheck
npm run lint
npm run check:content
npm run check:claims
npm run check:brand
npx jest __tests__/topic-guides-editorial.test.tsx __tests__/learning-centre-article-loader.test.ts --runInBand
```

Expected: every command exits 0.

- [ ] **Step 2: Run the full CI gate**

```bash
npm run ci
```

Expected: all unit, content, build, and 54-test E2E checks pass. Do not weaken an assertion merely to obtain a green deployment.

- [ ] **Step 3: Commit any concrete corrections**

If a gate fails, fix the underlying route, metadata, or claim defect, rerun the failing check, then commit the correction separately with a specific message.

---

### Task 6: Deploy and verify the public production surfaces

**Blocks:** Task 5
**Demoable:** The hub and four articles are live on `nebulacomponents.com`, render the approved content, and match the deployed repository revision.

**Files:**
- Modify: none
- Verify: `https://nebulacomponents.com/`, `https://nebulacomponents.com/audit`, hub route, and four article routes

**Interfaces:**
- Consumes: CI-passing git revision.
- Produces: live HTTP status evidence, rendered HTML evidence, deployed revision evidence, and service health evidence.

- [ ] **Step 1: Deploy through the mandatory script**

```bash
cd /home/mike/nebula
bash scripts/deploy_customer_portal.sh
```

Expected: atomic deployment completes only after its full gate. If it fails, production must not be treated as updated.

- [ ] **Step 2: Verify live HTTP and rendered output**

```bash
for path in \
  learning-centre/topic-guides \
  learning-centre/topic-guides/landing-page-conversion-leaks \
  learning-centre/topic-guides/conversion-rate-optimization-tools \
  learning-centre/topic-guides/ad-spend-roi-improvement \
  learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders \
  audit; do
  curl --fail --silent --show-error --write-out "${path} %{http_code} %{size_download}\n" \
    "https://nebulacomponents.com/${path}" -o "/tmp/${path##*/}.html"
done
```

Inspect each saved HTML response for its direct-answer heading, canonical URL, Article or CollectionPage JSON-LD, cluster links, and unique audit attribution. Verify `/` also returns 200 as the blast-radius check.

- [ ] **Step 3: Verify service health and revision**

```bash
sudo systemctl is-active nebula-nextjs
sudo journalctl -u nebula-nextjs --since "10 minutes ago" --no-pager
```

Expected: service is active and no new route-rendering errors appear. Verify the deployment script's reported SHA against `git rev-parse HEAD` and the public edge revision evidence.

- [ ] **Step 4: Commit no generated artifacts**

```bash
git status --short
```

Expected: no new source or generated build artifacts are accidentally staged. Existing `.next-broken` noise remains outside the release commit unless explicitly remediated in a separate task.
