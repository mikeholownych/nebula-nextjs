# Next.js Public Site Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Next.js 16.2.10 and migrate Nebula's public HTML estate into reusable, tested pages without changing external URLs or Python API behavior.

**Architecture:** A `web/` Next.js application uses App Router route groups, server-rendered marketing layouts, typed content loaders, and a request proxy for legacy `.html` compatibility. Existing Python routes remain authoritative until each page family passes parity and Cloudflare routing switches that family to Next.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, Zod, Vitest, Testing Library, Playwright, existing Python server.

## Global Constraints

- External `.html` paths and canonicals remain unchanged during migration.
- Marketing pages prerender unless request-time tenant branding is required.
- Do not move existing Python APIs into Next.js.
- Preserve GA4 event names: `audit_submit`, `free_kit_download`, `newsletter_signup`, `roi_calc`, and `scroll_depth`.
- Preserve verified Stripe payment links and existing accessibility contracts.

---

### Task 1: Freeze the public compatibility baseline

**Files:**
- Create: `config/public-route-manifest.json`
- Create: `scripts/capture_public_baseline.py`
- Create: `tests/test_public_route_manifest.py`
- Modify: `tests/platform-critical-flows.spec.ts`

**Interfaces:**
- Produces: `PublicRoute { path, status, canonical, title, description, h1, analyticsEvents, stripeLinks }` records used by every migration task.

- [ ] **Step 1: Write the failing manifest contract test**

```python
def test_manifest_has_unique_paths():
    rows = json.loads((ROOT / "config/public-route-manifest.json").read_text())
    paths = [row["path"] for row in rows]
    assert paths
    assert len(paths) == len(set(paths))
    assert all(path.startswith("/") for path in paths)
```

- [ ] **Step 2: Run the test and verify failure**

Run: `venv/bin/python3 -m pytest tests/test_public_route_manifest.py -q`
Expected: FAIL because the manifest does not exist.

- [ ] **Step 3: Implement baseline capture**

The script must enumerate tracked and generated HTML, normalize root/public aliases, fetch the running origin, parse metadata and JSON-LD, and write deterministic sorted JSON. It must exclude admin-protected pages unless an authorization header is supplied from the environment.

```python
@dataclass(frozen=True)
class PublicRoute:
    path: str
    status: int
    canonical: str
    title: str
    description: str
    h1: str
    analytics_events: tuple[str, ...]
    stripe_links: tuple[str, ...]
```

- [ ] **Step 4: Capture and verify the baseline**

Run:

```bash
venv/bin/python3 scripts/capture_public_baseline.py --origin http://127.0.0.1:8765
venv/bin/python3 -m pytest tests/test_public_route_manifest.py -q
```

Expected: manifest generated; test PASS; route count is non-zero and all paths unique.

- [ ] **Step 5: Commit**

```bash
git add config/public-route-manifest.json scripts/capture_public_baseline.py tests/test_public_route_manifest.py tests/platform-critical-flows.spec.ts
git commit -m "test: freeze public route compatibility baseline"
```

### Task 2: Create the isolated Next.js application

**Files:**
- Create: `web/package.json`
- Create: `web/package-lock.json`
- Create: `web/next.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/eslint.config.mjs`
- Create: `web/vitest.config.ts`
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/page.tsx`
- Create: `web/src/app/globals.css`
- Create: `web/src/app/healthz/route.ts`
- Create: `web/src/app/readyz/route.ts`
- Test: `web/src/app/healthz/route.test.ts`

**Interfaces:**
- Produces: Next server on `127.0.0.1:3000`; `GET /healthz -> {status:"ok"}`; `GET /readyz -> 200` after configuration validation.

- [ ] **Step 1: Write failing health-route tests**

```ts
import { GET } from './route'

it('returns a healthy response', async () => {
  const response = await GET()
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})
```

- [ ] **Step 2: Install exact framework dependencies**

Run:

```bash
mkdir -p web
cd web
npm init -y
npm install --save-exact next@16.2.10 react@19 react-dom@19 zod
npm install --save-dev typescript @types/node @types/react @types/react-dom eslint eslint-config-next vitest jsdom @testing-library/react
```

Expected: `package-lock.json` pins Next.js 16.2.10 and installation exits `0`.

- [ ] **Step 3: Add scripts and strict configuration**

```json
{
  "scripts": {
    "dev": "next dev --hostname 127.0.0.1 --port 3000",
    "build": "next build",
    "start": "next start --hostname 127.0.0.1 --port 3000",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

`next.config.ts` must set `output: 'standalone'`, `poweredByHeader: false`, `productionBrowserSourceMaps: false`, and strict security headers. It must not define backend rewrites yet.

- [ ] **Step 4: Implement health and readiness routes**

```ts
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 })
}
```

Readiness validates required public configuration and returns `503` with machine-readable missing keys; it never returns secret values.

- [ ] **Step 5: Verify**

```bash
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run test
npm --prefix web run build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "feat: establish Next.js frontend foundation"
```

### Task 3: Prove legacy `.html` compatibility before migration

**Files:**
- Create: `web/src/proxy.ts`
- Create: `web/src/lib/routing/legacy-routes.ts`
- Create: `web/src/lib/routing/legacy-routes.test.ts`
- Create: `web/src/app/(marketing)/compatibility-probe/page.tsx`
- Test: `tests/next-route-compatibility.spec.ts`

**Interfaces:**
- Produces: `rewriteLegacyPath(pathname: string): string | null` and an internal rewrite from `/compatibility-probe.html` to `/compatibility-probe` without changing the browser URL.

- [ ] **Step 1: Write failing route-transform tests**

```ts
expect(rewriteLegacyPath('/audit.html')).toBe('/audit')
expect(rewriteLegacyPath('/case-studies/example.html')).toBe('/case-studies/example')
expect(rewriteLegacyPath('/assets/logo.svg')).toBeNull()
expect(rewriteLegacyPath('/api/stats')).toBeNull()
```

- [ ] **Step 2: Implement a strict transform**

```ts
const EXCLUDED_PREFIXES = ['/api/', '/.well-known/', '/_next/']

export function rewriteLegacyPath(pathname: string): string | null {
  if (EXCLUDED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return null
  if (!pathname.endsWith('.html')) return null
  return pathname.slice(0, -'.html'.length) || '/'
}
```

`proxy.ts` performs `NextResponse.rewrite()` only when this function returns a path. It preserves query strings and rejects encoded traversal.

- [ ] **Step 3: Verify the browser contract**

Playwright must assert:

```ts
await page.goto('/compatibility-probe.html')
await expect(page).toHaveURL(/compatibility-probe\.html$/)
await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /compatibility-probe\.html$/)
```

- [ ] **Step 4: Run tests**

```bash
npm --prefix web run test
npx playwright test tests/next-route-compatibility.spec.ts
```

Expected: PASS. If the browser URL or canonical changes, stop the migration and revise routing before Task 4.

- [ ] **Step 5: Commit**

```bash
git add web/src/proxy.ts web/src/lib/routing web/src/app/'(marketing)'/compatibility-probe tests/next-route-compatibility.spec.ts
git commit -m "feat: preserve legacy html routes in Next.js"
```

### Task 4: Build shared marketing primitives

**Files:**
- Create: `web/src/components/shared/SiteHeader.tsx`
- Create: `web/src/components/shared/SiteFooter.tsx`
- Create: `web/src/components/shared/Analytics.tsx`
- Create: `web/src/components/shared/CookieConsent.tsx`
- Create: `web/src/components/shared/JsonLd.tsx`
- Create: `web/src/lib/metadata/create-metadata.ts`
- Create: `web/src/styles/tokens.css`
- Create: `web/src/styles/components.css`
- Test: `web/src/components/shared/shared.test.tsx`

**Interfaces:**
- Produces: `createMetadata(input: PageMetadataInput): Metadata`; `JsonLd({value}: {value: JsonValue})`; stable component APIs consumed by every page.

- [ ] **Step 1: Write component and metadata tests**

```ts
expect(createMetadata({ title: 'Audit', description: 'D', canonicalPath: '/audit.html' }).alternates?.canonical)
  .toBe('https://nebulacomponents.shop/audit.html')
```

Test that header/footer landmarks exist, one `<main>` is left to page layouts, consent controls have accessible names, and JSON-LD serializes `<` safely.

- [ ] **Step 2: Implement tokens and components**

Tokens must define colors, spacing, type scale, radius, shadows, and focus ring once. Components must not embed page-specific copy or inline event handlers.

- [ ] **Step 3: Verify**

```bash
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run test
```

Expected: PASS with no accessibility-query failure.

- [ ] **Step 4: Commit**

```bash
git add web/src/components web/src/lib/metadata web/src/styles
git commit -m "feat: add shared marketing layout primitives"
```

### Task 5: Migrate case studies into a typed collection

**Files:**
- Create: `web/src/content/case-studies/schema.ts`
- Create: `web/src/content/case-studies/load.ts`
- Create: `web/src/components/marketing/CaseStudyPage.tsx`
- Create: `web/src/app/(marketing)/case-studies/[slug]/page.tsx`
- Create: `web/src/app/(marketing)/case-studies/page.tsx`
- Modify: `audit_to_case_study.py`
- Test: `web/src/content/case-studies/load.test.ts`
- Test: `tests/test_case_study_export.py`
- Test: `tests/case-study-parity.spec.ts`

**Interfaces:**
- Consumes: normalized JSON entries exported by `audit_to_case_study.py --format json`.
- Produces: `CaseStudy` validated by Zod and `generateStaticParams()` for every public slug.

- [ ] **Step 1: Write failing schema and export tests**

```ts
expect(() => CaseStudySchema.parse({ slug: '../bad' })).toThrow()
expect(CaseStudySchema.parse(validEntry).score).toBeGreaterThanOrEqual(0)
```

Python test requires JSON export to contain no email, full audited domain, raw lead text, or private identifiers.

- [ ] **Step 2: Add a privacy-safe JSON export**

`audit_to_case_study.py` must emit structured content only. Keep legacy HTML generation available behind its existing command until cutover; do not delete it in this task.

- [ ] **Step 3: Implement collection pages**

The detail template owns metadata, JSON-LD, score presentation, issue sections, and CTA. It must use external legacy canonical paths ending in `.html`.

- [ ] **Step 4: Run parity tests**

```bash
venv/bin/python3 -m pytest tests/test_case_study_export.py -q
npm --prefix web run test
npm --prefix web run build
npx playwright test tests/case-study-parity.spec.ts
```

Expected: all generated slugs build; sampled old/new pages match title, canonical, H1, score, CTA URL, and robots policy.

- [ ] **Step 5: Commit**

```bash
git add audit_to_case_study.py tests/test_case_study_export.py web/src/content/case-studies web/src/components/marketing/CaseStudyPage.tsx web/src/app/'(marketing)'/case-studies tests/case-study-parity.spec.ts
git commit -m "feat: migrate case studies to typed Next.js content"
```

### Task 6: Migrate learning centre and repeatable content families

**Files:**
- Create: `web/src/content/learning-centre/schema.ts`
- Create: `web/src/content/learning-centre/load.ts`
- Create: `web/src/app/(marketing)/learning-center/[slug]/page.tsx`
- Create: `web/src/app/(marketing)/learning-center/page.tsx`
- Create: `web/src/content/articles/`
- Create: `web/src/content/comparisons/`
- Create: `web/src/content/products/`
- Modify: `learning_centre_engine.py`
- Test: `tests/test_learning_centre_export.py`
- Test: `tests/content-family-parity.spec.ts`

**Interfaces:**
- Produces: validated entries with `slug`, `title`, `description`, `canonicalPath`, `publishedAt`, `updatedAt`, `body`, and schema-specific fields.

- [ ] **Step 1: Write failing export and content tests**
- [ ] **Step 2: Add deterministic structured exports while retaining legacy HTML output**
- [ ] **Step 3: Implement shared list/detail layouts and aliases for UK/US learning-centre paths**
- [ ] **Step 4: Run `pytest`, Next unit/build, and Playwright parity suites**
- [ ] **Step 5: Commit as `feat: migrate repeatable content families to Next.js`**

Each code step must use the same explicit schema/loader pattern from Task 5; entries failing schema validation must fail the build rather than render partial pages.

### Task 7: Migrate interactive marketing pages

**Files:**
- Create: `web/src/components/marketing/AuditForm.tsx`
- Create: `web/src/components/marketing/RoiCalculator.tsx`
- Create: `web/src/components/marketing/PricingGenerator.tsx`
- Create: `web/src/lib/api/legacy-api-client.ts`
- Create: `web/src/app/(marketing)/audit/page.tsx`
- Create: `web/src/app/(marketing)/pricing-generator/page.tsx`
- Modify: `tests/platform-critical-flows.spec.ts`

**Interfaces:**
- Produces: `legacyApi.fetchJson<T>(path, init)` constrained to same-origin allowlisted endpoints; components preserve existing request/response contracts and GA4 events.

- [ ] **Step 1: Write failing component tests for validation, loading, success, and server-error states**
- [ ] **Step 2: Implement an allowlisted same-origin API adapter with timeout and abort handling**
- [ ] **Step 3: Implement forms without changing Python payloads**
- [ ] **Step 4: Verify keyboard use, labels, error announcements, duplicate-submit prevention, and exact analytics events**
- [ ] **Step 5: Run Next tests, existing pytest contracts, and Playwright critical flows**
- [ ] **Step 6: Commit as `feat: migrate interactive marketing flows to Next.js`**

### Task 8: Migrate homepage last and enable route-family canaries

**Files:**
- Modify: `web/src/app/page.tsx`
- Create: `web/src/components/marketing/home/`
- Create: `config/frontend-route-flags.json`
- Create: `scripts/verify_frontend_parity.py`
- Test: `tests/homepage-parity.spec.ts`

**Interfaces:**
- Produces: route-family flags consumed by deployment routing and a parity command returning non-zero on route, canonical, metadata, Stripe-link, accessibility, or analytics mismatch.

- [ ] **Step 1: Write failing homepage and route-flag tests**
- [ ] **Step 2: Decompose the 2,477-line homepage into section components with one responsibility each**
- [ ] **Step 3: Preserve every existing conversion event and CTA destination**
- [ ] **Step 4: Run the complete parity suite against legacy and Next origins**
- [ ] **Step 5: Enable homepage canary only after all checks pass**
- [ ] **Step 6: Commit as `feat: complete Next.js public site migration`**
