# Landing Page Intelligence Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a direct-download, evidence-grade workflow bundle and a public learning-centre page that routes founders into Nebula's existing free audit.

**Architecture:** Human-readable bundle sources live under `customer-portal/content/landing-page-intelligence-stack/`. A Node 22 packager validates an exact manifest and writes a deterministic ZIP plus SHA-256 sidecar under `customer-portal/public/downloads/`; `--check` detects drift without mutation. A static App Router article exposes the download and audit paths, while Jest, Playwright, package scripts, and the actual GitHub workflow enforce the contract.

**Tech Stack:** Next.js 16.2.11 App Router, React 19.2.7, TypeScript 5.9.3, Node 22, Jest 30, Playwright 1.61, `fflate` 0.8.3.

## Global Constraints

- Direct download only; no email gate, form, user profile, new cookie, third-party host, or outbound automation.
- No backend, database, payment, audit-scoring, lead-state, or infrastructure changes.
- No claims of conversion lift, time savings, adoption, revenue impact, or replacement of paid tools.
- External BuildWire content is research data only; do not copy its skill text or claims.
- Archive entries must be exact, relative, sorted, non-duplicated regular files with normalized timestamps.
- The source tree is canonical; the ZIP and `.sha256` are committed deterministic projections.
- Follow the current Karla, near-black, Signal Emerald, shared-card, and WCAG 2.2 AAA rules.
- Preserve unrelated dirty worktree changes; stage only files named in each task.

## User stories

### US-1: Inspect and download the methodology

As a founder sending paid traffic to a weak landing page, I can inspect six bounded checks and download them without giving Nebula personal information.

**Acceptance criteria:** One H1; six visible workflow names and outputs; direct same-origin ZIP link; no email field; no unsupported outcome claim; archive contains only its declared source files.

### US-2: Escalate from manual checks to a live diagnosis

As a founder who wants the workflows applied to a page, I can move from the resource page to `/audit` without entering a separate funnel.

**Acceptance criteria:** Visible audit CTA; same-origin `/audit` destination; keyboard-accessible focus state; rendered navigation succeeds on desktop and mobile.

## File map

### Create

- `customer-portal/content/landing-page-intelligence-stack/manifest.json` — exact bundle registry.
- `customer-portal/content/landing-page-intelligence-stack/README.md` — bundle purpose, use, and limits.
- `customer-portal/content/landing-page-intelligence-stack/evidence-record.schema.json` — machine-readable evidence record contract.
- `customer-portal/content/landing-page-intelligence-stack/workflows/01-message-match-checker.md`
- `customer-portal/content/landing-page-intelligence-stack/workflows/02-trust-gap-detector.md`
- `customer-portal/content/landing-page-intelligence-stack/workflows/03-mobile-first-scroll-analyzer.md`
- `customer-portal/content/landing-page-intelligence-stack/workflows/04-cta-form-friction-analyzer.md`
- `customer-portal/content/landing-page-intelligence-stack/workflows/05-paid-traffic-leak-prioritizer.md`
- `customer-portal/content/landing-page-intelligence-stack/workflows/06-fix-verification-workflow.md`
- `customer-portal/scripts/package-landing-page-intelligence-stack.mjs` — validator, deterministic generator, and drift checker.
- `customer-portal/public/downloads/nebula-landing-page-intelligence-stack-v1.zip` — generated projection.
- `customer-portal/public/downloads/nebula-landing-page-intelligence-stack-v1.zip.sha256` — generated digest sidecar.
- `customer-portal/__tests__/landing-page-intelligence-stack.test.ts` — source, archive, determinism, adversarial, and page-source contracts.
- `customer-portal/components/ui/LinkButton.tsx` — centralized anchor CTA variants.
- `customer-portal/app/learning-centre/landing-page-intelligence-stack/page.tsx` — public article/download surface.
- `customer-portal/app/learning-centre/landing-page-intelligence-stack/meta.json` — automatic learning-centre and sitemap discovery.
- `customer-portal/e2e/landing-page-intelligence-stack.spec.ts` — rendered and download verification.

### Modify

- `customer-portal/package.json` — direct `fflate` dev dependency and bundle scripts.
- `customer-portal/package-lock.json` — synchronized lockfile.
- `.github/workflows/ci.yml` — actual projection-check step.
- `customer-portal/__tests__/metadata/evidence-integrity.test.ts` — include the new public page in claim checks.

---

### Task 1: Deterministic, fail-closed bundle projection

**Files:**
- Create all files under `customer-portal/content/landing-page-intelligence-stack/`.
- Create `customer-portal/scripts/package-landing-page-intelligence-stack.mjs`.
- Create `customer-portal/__tests__/landing-page-intelligence-stack.test.ts`.
- Create generated ZIP and SHA-256 files under `customer-portal/public/downloads/`.
- Modify `customer-portal/package.json` and `customer-portal/package-lock.json`.

**Interfaces:**
- Consumes: source root from `STACK_SOURCE_DIR` or the canonical content directory; output root from `STACK_OUTPUT_DIR` or `public/downloads`.
- Produces: `npm run package:intelligence-stack`, `npm run check:intelligence-stack`, ZIP path `/downloads/nebula-landing-page-intelligence-stack-v1.zip`, and sidecar path with `.sha256` suffix.

- [x] **Step 1: Install the direct archive dependency**

Run:

```bash
cd customer-portal
npm install --save-dev fflate@0.8.3
```

Expected: `package.json` includes `"fflate": "^0.8.3"` directly and the lockfile changes without adding a runtime dependency.

- [x] **Step 2: Write the failing archive contract test**

Create `customer-portal/__tests__/landing-page-intelligence-stack.test.ts` with imports for `execFileSync`, `createHash`, `mkdtempSync`, `readFileSync`, `writeFileSync`, `mkdirSync`, `cpSync`, `rmSync`, `tmpdir`, `join`, and `unzipSync` from `fflate`.

The test must define these exact expected archive entries:

```ts
const EXPECTED_ENTRIES = [
  'README.md',
  'evidence-record.schema.json',
  'manifest.json',
  'workflows/01-message-match-checker.md',
  'workflows/02-trust-gap-detector.md',
  'workflows/03-mobile-first-scroll-analyzer.md',
  'workflows/04-cta-form-friction-analyzer.md',
  'workflows/05-paid-traffic-leak-prioritizer.md',
  'workflows/06-fix-verification-workflow.md',
]
```

Add tests that:

1. Run the canonical packager and assert the ZIP and sidecar exist.
2. Use `unzipSync` and assert `Object.keys(entries).sort()` equals `EXPECTED_ENTRIES`.
3. Assert every entry has non-empty content.
4. Compute SHA-256 and assert the sidecar is exactly `<digest>  nebula-landing-page-intelligence-stack-v1.zip\n`.
5. Package twice and assert identical SHA-256 digests.
6. Run `--check` and expect exit code zero.
7. Copy the source to a temporary fixture, modify `README.md`, point `STACK_SOURCE_DIR` and `STACK_OUTPUT_DIR` at the fixture, and assert `--check` exits nonzero after a pre-change projection exists.
8. Parameterize malformed fixture manifests for `../escape.md`, `/absolute.md`, duplicate paths, missing files, undeclared files, unsupported root keys, unsupported version, and a symlink; assert every build exits nonzero and writes neither ZIP nor sidecar.

Run:

```bash
npm test -- --runInBand __tests__/landing-page-intelligence-stack.test.ts
```

Expected: FAIL because the source and packager do not exist.

- [x] **Step 3: Create the exact source manifest and evidence schema**

Create `manifest.json`:

```json
{
  "version": 1,
  "bundleId": "nebula-landing-page-intelligence-stack",
  "release": "v1",
  "files": [
    "README.md",
    "evidence-record.schema.json",
    "manifest.json",
    "workflows/01-message-match-checker.md",
    "workflows/02-trust-gap-detector.md",
    "workflows/03-mobile-first-scroll-analyzer.md",
    "workflows/04-cta-form-friction-analyzer.md",
    "workflows/05-paid-traffic-leak-prioritizer.md",
    "workflows/06-fix-verification-workflow.md"
  ]
}
```

Create `evidence-record.schema.json` as JSON Schema draft 2020-12. Require `workflow_id`, `page_url`, `observed_at`, `selector`, `observation`, `interpretation`, `confidence`, and `status`; disallow unknown fields. `page_url` must be an HTTP(S) URI, `observed_at` an ISO date-time, `confidence` one of `low`, `medium`, `high`, and `status` one of `observed`, `not_observed`, `not_testable`.

- [x] **Step 4: Create the README and six bounded workflow files**

`README.md` must state:

- The stack records observations; it does not promise outcomes.
- Run only against pages the user is allowed to inspect.
- Capture URL, timestamp, selector, raw observation, interpretation, and confidence separately.
- `not_testable` is preferable to invented evidence.
- The live Nebula audit is available at `https://nebulacomponents.shop/audit`.

Every workflow file must use these exact headings:

```markdown
# [Workflow Name]

## Purpose
## Inputs
## Evidence boundary
## Procedure
## Output contract
## Fail-closed conditions
## Verification checklist
```

Use these workflow-specific contracts:

| ID | Inputs | Output | Fail-closed rule |
|---|---|---|---|
| `message-match` | ad headline/body, landing URL, rendered H1/hero/CTA | mismatch map | mark `not_testable` when ad copy is absent |
| `trust-gap` | rendered page, visible proof elements, destination links | evidence inventory | never infer customer identity, endorsement, or outcome |
| `mobile-first-scroll` | 375×812 rendered viewport, first interactive element, visible text | viewport failure report | do not infer below-fold content from source order |
| `cta-form-friction` | visible CTA labels, destination behavior, form fields/errors | friction sequence | do not submit forms or create leads |
| `paid-traffic-prioritizer` | outputs from workflows 1–4 | ranked fix map | rank by observed severity/confidence; no invented revenue loss |
| `fix-verification` | before record, changed page, same viewport/test path | before/after evidence packet | no improvement claim without comparable before/after observation |

Procedures must be executable manually, separate observation from interpretation, and avoid numerical benchmarks not supplied by the user's own data.

- [x] **Step 5: Implement the fail-closed deterministic packager**

Create `scripts/package-landing-page-intelligence-stack.mjs` with:

```js
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { zipSync } from 'fflate'

const ROOT = process.cwd()
const SOURCE_DIR = path.resolve(process.env.STACK_SOURCE_DIR || path.join(ROOT, 'content', 'landing-page-intelligence-stack'))
const OUTPUT_DIR = path.resolve(process.env.STACK_OUTPUT_DIR || path.join(ROOT, 'public', 'downloads'))
const ZIP_NAME = 'nebula-landing-page-intelligence-stack-v1.zip'
const ZIP_PATH = path.join(OUTPUT_DIR, ZIP_NAME)
const HASH_PATH = `${ZIP_PATH}.sha256`
const ALLOWED_ROOT_KEYS = ['bundleId', 'files', 'release', 'version']
const NORMALIZED_MTIME = new Date('1980-01-01T00:00:00.000Z')
```

Implement these functions with exact behavior:

- `assertExactKeys(record, allowed, label)`: reject arrays, null, missing keys, and unknown keys.
- `assertSafeRelativePath(value)`: require a non-empty string; reject `\`, absolute paths, `.`/`..` segments, NUL, and paths whose normalized POSIX form differs from input.
- `walkRegularFiles(dir, prefix = '')`: recursively return sorted relative file paths; reject symlinks and non-file/non-directory entries.
- `loadManifest()`: parse JSON; enforce exact keys, `version === 1`, exact bundle ID and release, non-empty unique sorted `files`, and mandatory inclusion of `manifest.json`.
- `buildProjection()`: assert manifest paths equal the actual source file list exactly, read every file, and pass entries to `zipSync` in manifest order as `[Uint8Array, { mtime: NORMALIZED_MTIME, level: 9, os: 3, attrs: 0o644 << 16 }]`.
- `digest(bytes)`: return lowercase SHA-256 hex.
- `writeProjection(zipBytes)`: create output directory and write ZIP plus sidecar.
- `checkProjection(zipBytes)`: compare both committed files byte-for-byte; throw `Landing page intelligence stack projection drift detected` on difference or absence.

Wrap execution in `main().catch(...)`, print errors to stderr, and set exit code 1. Do not write any output until all validation and ZIP construction succeeds.

Add package scripts:

```json
"package:intelligence-stack": "node scripts/package-landing-page-intelligence-stack.mjs",
"check:intelligence-stack": "node scripts/package-landing-page-intelligence-stack.mjs --check"
```

Insert `npm run check:intelligence-stack` into `ci` before `npm run build`.

- [x] **Step 6: Generate, test, and commit Task 1**

Run:

```bash
npm run package:intelligence-stack
npm run check:intelligence-stack
npm test -- --runInBand __tests__/landing-page-intelligence-stack.test.ts
sha256sum public/downloads/nebula-landing-page-intelligence-stack-v1.zip
```

Expected: projection current; targeted Jest PASS; printed digest equals the sidecar digest.

Commit only Task 1 files:

```bash
git add customer-portal/content/landing-page-intelligence-stack \
  customer-portal/scripts/package-landing-page-intelligence-stack.mjs \
  customer-portal/public/downloads/nebula-landing-page-intelligence-stack-v1.zip \
  customer-portal/public/downloads/nebula-landing-page-intelligence-stack-v1.zip.sha256 \
  customer-portal/__tests__/landing-page-intelligence-stack.test.ts \
  customer-portal/package.json customer-portal/package-lock.json
git commit -m "feat: package landing page intelligence stack"
```

---

### Task 2: Public acquisition and conversion surface

**Files:**
- Create `customer-portal/components/ui/LinkButton.tsx`.
- Create `customer-portal/app/learning-centre/landing-page-intelligence-stack/page.tsx`.
- Create `customer-portal/app/learning-centre/landing-page-intelligence-stack/meta.json`.
- Modify `customer-portal/__tests__/landing-page-intelligence-stack.test.ts`.
- Modify `customer-portal/__tests__/metadata/evidence-integrity.test.ts`.

**Interfaces:**
- Consumes: static ZIP path from Task 1, `createArticleSchema`, shared Tailwind tokens, and `/audit`.
- Produces: canonical route `/learning-centre/landing-page-intelligence-stack`, stable test IDs `intelligence-stack-download-link` and `intelligence-stack-audit-link`.

- [ ] **Step 1: Add failing public-surface tests**

Extend the targeted Jest file to read `page.tsx` and `meta.json`, then assert:

```ts
expect(meta).toEqual({
  slug: 'landing-page-intelligence-stack',
  title: 'Landing Page Intelligence Stack: 6 Evidence-Grade Workflows',
  category: 'Conversion Systems',
  description: 'Download six inspectable workflows for message match, trust, mobile layout, CTA friction, prioritization, and fix verification.',
})
expect(pageSource.match(/<h1/g)).toHaveLength(1)
expect(pageSource).toContain('/downloads/nebula-landing-page-intelligence-stack-v1.zip')
expect(pageSource).toContain('data-testid="intelligence-stack-download-link"')
expect(pageSource).toContain('href="/audit"')
expect(pageSource).toContain('data-testid="intelligence-stack-audit-link"')
expect(pageSource).not.toMatch(/<input|type="email"|guarantee|replaces paid|conversion lift/i)
```

Add the new page path to the evidence-integrity combined files and superlative checks.

Run the targeted test and expect FAIL because the route does not exist.

- [ ] **Step 2: Create a centralized link-button primitive**

Create `components/ui/LinkButton.tsx` using `AnchorHTMLAttributes<HTMLAnchorElement>` with variants `primary`, `secondary`, `outline`, `ghost` and sizes `sm`, `md`, `lg`. Render an `<a>` directly, accept `href: string`, preserve `download`, and use the same variant/size class strings as `Button.tsx`. Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg` and stable caller-supplied `data-testid` support through native anchor props.

- [ ] **Step 3: Create metadata and the complete public page**

Create the exact `meta.json` asserted in Step 1.

Create `page.tsx` as a server component with:

- `Metadata` title: `Landing Page Intelligence Stack: 6 Evidence-Grade Workflows | Nebula Components`.
- Canonical: `https://nebulacomponents.shop/learning-centre/landing-page-intelligence-stack`.
- Description matching `meta.json`.
- `createArticleSchema` using publication/modification date `2026-07-25`.
- Breadcrumb: Home → Learning Centre → Landing Page Intelligence Stack.
- One H1: `Six landing-page checks. Every conclusion tied to evidence.`
- Intro: `This free stack turns a landing page into six inspectable records: what was observed, where it appeared, what it may mean, and what still cannot be proven.`
- Primary `LinkButton` with `download`, same-origin ZIP href, test ID, and label `Download the workflow stack`.
- Adjacent plain-text note: `ZIP · Markdown + JSON · no email required`.
- Six visible workflow sections, using the names and output contracts from Task 1.
- Evidence rules section with three statements: observation and interpretation remain separate; unknowns become `not_testable`; no revenue or conversion claim is inferred.
- Usage section: collect inputs, run workflows 1–4, rank with workflow 5, verify changes with workflow 6.
- Limits section: public rendered evidence only; no private analytics; no automated form submission; no guaranteed outcome.
- Secondary `LinkButton` to `/audit`, test ID, label `Run the live audit`.
- Back link to `/learning-centre`.

Use `main#main-content`, `pt-24`, `max-w-5xl`, semantic `section` elements, one deliberate hero kicker only, and shared `Card` or matching existing shared component APIs. Do not add FAQ schema because no shared visible FAQ projection is needed.

- [ ] **Step 4: Run targeted tests and commit Task 2**

Run:

```bash
npm test -- --runInBand __tests__/landing-page-intelligence-stack.test.ts __tests__/metadata/evidence-integrity.test.ts __tests__/metadata/sitemap-inventory.test.ts
npm run typecheck
npm run lint
```

Expected: targeted Jest, typecheck, and lint PASS; sitemap inventory automatically includes the new `meta.json` route.

Commit only Task 2 files:

```bash
git add customer-portal/components/ui/LinkButton.tsx \
  customer-portal/app/learning-centre/landing-page-intelligence-stack \
  customer-portal/__tests__/landing-page-intelligence-stack.test.ts \
  customer-portal/__tests__/metadata/evidence-integrity.test.ts
git commit -m "feat: publish landing page intelligence stack"
```

---

### Task 3: Actual CI enforcement and rendered E2E coverage

**Files:**
- Modify `.github/workflows/ci.yml`.
- Create `customer-portal/e2e/landing-page-intelligence-stack.spec.ts`.
- Modify `customer-portal/__tests__/landing-page-intelligence-stack.test.ts`.

**Interfaces:**
- Consumes: Task 1 scripts and Task 2 test IDs.
- Produces: direct GitHub Actions enforcement and desktop/mobile browser proof.

- [ ] **Step 1: Add failing actual-workflow and E2E tests**

Add a Jest assertion that reads `../.github/workflows/ci.yml` and matches both a named `Verify intelligence stack projection` step and `run: npm run check:intelligence-stack`.

Create Playwright tests that, on both configured projects:

1. Navigate to `/learning-centre/landing-page-intelligence-stack`.
2. Assert one visible H1 with the approved text.
3. Assert six workflow headings are visible.
4. Assert no email input exists.
5. Assert the download link has the exact same-origin href and `download` attribute.
6. Use `page.request.get` on the ZIP URL; assert status 200, a ZIP-compatible content type or octet-stream, body begins with bytes `0x50 0x4b`, and body length is nonzero.
7. Click `intelligence-stack-audit-link`; assert URL ends in `/audit` and the audit page H1 is visible.
8. Assert there is no horizontal overflow at desktop or 375px mobile viewport.

Run targeted Jest before workflow modification and expect FAIL.

- [ ] **Step 2: Wire the actual workflow**

In `.github/workflows/ci.yml`, add to the governance job after evidence projection checking:

```yaml
      - name: Verify intelligence stack projection
        run: npm run check:intelligence-stack
```

The package-level `ci` command already contains the check from Task 1; both layers are required.

- [ ] **Step 3: Build and execute rendered verification**

Run:

```bash
npm test -- --runInBand __tests__/landing-page-intelligence-stack.test.ts
rm -rf .next
npm run build
npx playwright test e2e/landing-page-intelligence-stack.spec.ts
```

Expected: targeted Jest PASS, clean production build PASS, and new E2E tests PASS on desktop and mobile.

Commit only Task 3 files:

```bash
git add .github/workflows/ci.yml \
  customer-portal/e2e/landing-page-intelligence-stack.spec.ts \
  customer-portal/__tests__/landing-page-intelligence-stack.test.ts
git commit -m "ci: enforce intelligence stack projection"
```

---

### Task 4: Full release, deployment, and independent gate

**Files:**
- Update the checkboxes in this plan and AI-DLC state/audit records.
- Do not modify application files unless a failing gate identifies a root cause.

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: verified live route/download, exact release proof, and independent PASS or a reopened task.

- [ ] **Step 1: Run the complete local release matrix**

Run from `customer-portal`:

```bash
npm run check:intelligence-stack
npm run check:evidence-atoms
npm run check:citable-projection
npx @nebulacomponents/citable@latest validate registries
npm run typecheck
npm run lint
npm test -- --runInBand
rm -rf .next
npm run build
npm run test:e2e
npm audit --omit=dev
cd .. && git diff --check
```

Expected: every command exits zero. Do not report counts until read from actual output.

- [ ] **Step 2: Restart and verify the live deployment**

Run:

```bash
sudo systemctl restart nebula-nextjs
systemctl is-active nebula-nextjs
systemctl show nebula-nextjs -p MainPID -p ActiveEnterTimestamp
```

Then use a rendered browser against `https://nebulacomponents.shop/learning-centre/landing-page-intelligence-stack` to verify one H1, six workflows, no email input, direct download, audit navigation, desktop/mobile layout, and clean browser console. Fetch the live ZIP and compare its SHA-256 with the committed sidecar.

- [ ] **Step 3: Run production Citable regression**

Audit the live origin with technical, page, architecture, schema, AEO, and GEO scopes. Record total and high-severity findings from the real command output; any new high-severity finding blocks release.

- [ ] **Step 4: Dispatch independent read-only adversarial review**

Require the reviewer to:

- Inspect the current worktree without modifying files.
- Reproduce deterministic packaging and drift failure.
- Try traversal, absolute paths, backslashes, NUL, duplicates, undeclared files, symlinks, malformed JSON, arrays/objects/falsy path values, and source/output substitution.
- Inspect ZIP contents for executable files, credentials, copied BuildWire text, unsupported claims, and privacy regressions.
- Verify actual CI wiring, public page semantics, download, and audit routing.
- Return PASS or reproducible FAIL with severity and file references.

A FAIL reopens the applicable task. Completion requires independent PASS.

- [ ] **Step 5: Commit governance records and report proof boundaries**

Update all completed checkboxes immediately, append the exact user interactions and results to `aidlc-docs/audit.md`, and update `aidlc-docs/aidlc-state.md` without overwriting prior initiative state.

Report:

- Shipped/committed/merged/deployed status separately.
- Branch, HEAD, URL, service PID/timestamp, and scoped files.
- Exact commands and observed counts.
- Success and failure cases proven.
- Independent-review boundary.
- Full dirty worktree status and unrelated-change boundary.
- Next bounded phase, if any.
