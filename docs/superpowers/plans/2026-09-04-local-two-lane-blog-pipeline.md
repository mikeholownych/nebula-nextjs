# Local Two-Lane Blog Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a self-hosted, evidence-gated, two-lane Nebula blog and remove Opinly from the target blog architecture after local parity is verified.

**Architecture:** Markdown or MDX files in Git are the canonical source. A focused Next.js loader renders approved acquisition and feature posts as server HTML, while Python validation scripts produce provenance and publish-readiness artifacts. The existing Opinly route remains only as a temporary migration bridge and is removed in the final task.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Markdown/MDX parser using existing dependencies where possible, Python 3.11, JSONL ledgers, Jest, Playwright, existing GSC/GA4/Bing/PostHog and acquisition recommendation tools.

## Global Constraints

- No external content-generation, CMS, or publishing dependency in the target architecture.
- Opinly is migration-only. No new content workflow may depend on Opinly.
- `RECOMMEND != APPROVE != EXECUTE`.
- No autonomous publishing or automatic production SEO rewrites.
- No invented testimonials, customer stories, spend, conversion, recovery, or audit outcomes.
- Original data requires source, method, date, sample, and limitation.
- Competitor rankings remain separate from first-party analytics.
- All 14 requirements from the attached blog specification must be validated or explicitly reported.
- No em dashes in shipped content.
- Nebula accent is `#c7ff2f`; use existing design tokens.
- Use `One-Leak Repair Sprint` in new copy, not `Fix Pack`.
- Never create live Stripe sessions, payments, synthetic leads, or fake analytics events during verification.
- Production changes require build, restart, live HTTP, rendered HTML, sitemap, and service-log evidence.

---

## Task 1: Establish the local content contract and provenance ledgers

**Blocks:** none (can start immediately)
**Demoable:** A fixture acquisition post and fixture feature post parse into the same typed model, while missing or unsupported evidence fails validation.

**Files:**
- Create: `customer-portal/app/lib/blog/types.ts`
- Create: `customer-portal/app/lib/blog/loader.ts`
- Create: `content/README.md`
- Create: `content/briefs/.gitkeep`
- Create: `content/drafts/.gitkeep`
- Create: `content/published/.gitkeep`
- Create: `content/archived/.gitkeep`
- Create: `content-ledger/opportunities.jsonl`
- Create: `content-ledger/claims.jsonl`
- Create: `content-ledger/approvals.jsonl`
- Create: `content-ledger/publication-events.jsonl`
- Create: `customer-portal/__tests__/blog-loader.test.ts`

**Interfaces:**
- `BlogArticle`: typed frontmatter plus rendered source.
- `loadArticle(slug: string): Promise<BlogArticle | null>`.
- `listArticles(filter?: { lane?: 'acquisition' | 'feature'; status?: ArticleStatus }): Promise<BlogArticle[]>`.
- `validateSourceRefs(article, sourceIndex): ValidationResult`.
- Public routes may load only `status: 'approved'` or `status: 'published'`; drafts must be excluded.

- [ ] Write failing tests for valid frontmatter, both lanes, invalid status, missing source reference, and draft exclusion.
- [ ] Run `cd customer-portal && npm test -- --runInBand __tests__/blog-loader.test.ts`; confirm the new contract tests fail before implementation.
- [ ] Implement typed parsing with a strict allowlist for `content_lane`, `post_type`, and status values.
- [ ] Implement deterministic slug lookup, path traversal rejection, and draft exclusion.
- [ ] Run the focused tests and require all to pass.
- [ ] Commit: `feat(blog): add local article contract and loader`.

---

## Task 2: Build the evidence, claim, and timing validation CLI

**Blocks:** Task 1
**Demoable:** A valid article produces a PASS report; fabricated evidence, unsupported claims, unresolved intent overlap, and premature timing produce explicit BLOCKED results.

**Files:**
- Create: `scripts/content_pipeline/validate_claims.py`
- Create: `scripts/content_pipeline/score_opportunities.py`
- Create: `scripts/content_pipeline/publish_readiness.py`
- Create: `tests/test_content_pipeline_validation.py`
- Modify: `customer-portal/package.json` to add `check:blog-content` if consistent with existing scripts
- Modify: `docs/content-to-pipeline-operational-guide.md` to reference this pipeline and retire blog-specific external-service assumptions

**Interfaces:**
- `validate_claims.py --article <path> --claims <path>` returns nonzero on unsupported or synthetic evidence.
- `publish_readiness.py --article <path> --sources <path> --output <path>` writes JSON and Markdown reports.
- Reports expose `status`, `blocked_reasons`, `claim_results`, `timing_gate`, `canonical_url`, and `source_refs`.
- `score_opportunities.py` consumes existing keyword registry, audit findings, first-party exports, and SERP reports without writing analytics data.

- [ ] Write tests for fabricated testimonial blocking, unsupported numeric claim blocking, primary-source acceptance, `<100` impression `OBSERVE`, single competitor win `OBSERVE`, repeated competitor evidence review, and 28-day prerequisite enforcement.
- [ ] Run the focused Python tests and confirm failure before implementation.
- [ ] Implement claim classification, source reference validation, synthetic-story blocking, cannibalization warning, and timing outcomes.
- [ ] Implement atomic report writes and nonzero failure exit codes.
- [ ] Run tests, `py_compile`, and a valid plus invalid fixture command.
- [ ] Commit: `feat(content): add provenance and publish-readiness gates`.

---

## Task 3: Create the server-rendered local blog routes and two-lane index

**Blocks:** Task 1, Task 2
**Demoable:** The blog index, one acquisition article, and one feature article render from local files with no Opinly request or client-side article dependency.

**Files:**
- Create: `customer-portal/app/blog/page.tsx`
- Create: `customer-portal/app/blog/[slug]/page.tsx`
- Create: `customer-portal/app/blog/lib/render-markdown.tsx` or the smallest focused renderer compatible with existing dependencies
- Create: `customer-portal/app/blog/content/paid-traffic-not-converting.md`
- Create: `customer-portal/app/blog/content/what-we-got-wrong-about-filter-based-targeting.md`
- Create: `customer-portal/__tests__/blog-routes.test.tsx`
- Modify: `customer-portal/app/sitemap.ts`

**Interfaces:**
- `/blog` displays both lanes with visible lane labels and links.
- `/blog/[slug]` renders only approved or published local articles.
- `generateMetadata` returns canonical URL, title, description, author, and dates.
- Article pages expose `Article`, `Organization`, `Person`, and valid `FAQPage` JSON-LD when visible FAQ content exists.

- [ ] Write route tests for index discovery, acquisition and feature filtering, missing slug 404, draft exclusion, metadata, schema, and CTA destination.
- [ ] Run focused route tests and confirm failure before implementation.
- [ ] Implement server-only loading and rendering with semantic headings and Nebula design tokens.
- [ ] Implement the attached requirements: question H1, 40 to 60 word answer block, question H2s, self-contained sections, extractable sentences, source links, FAQ, internal links, and one clear `/audit` CTA where commercially relevant.
- [ ] Add fixture articles with real or clearly labelled evidence. Do not fabricate customer history.
- [ ] Update sitemap generation to include only approved or published local articles.
- [ ] Run focused tests, `npm run typecheck`, and `npm run lint`.
- [ ] Commit: `feat(blog): render local two-lane article routes`.

---

## Task 4: Integrate content opportunity generation with existing acquisition metrics

**Blocks:** Task 2, Task 3
**Demoable:** A report-only run consumes existing local evidence and produces a ranked opportunity queue without publishing or mutating analytics.

**Files:**
- Create: `scripts/content_pipeline/collect_sources.py`
- Create: `scripts/content_pipeline/generate_brief.py`
- Create: `scripts/content_pipeline/refresh_review.py`
- Create: `tests/test_content_pipeline_sources.py`
- Modify: `scripts/weekly_marketing_orchestrator.py`
- Modify: `MEASUREMENT_PROTOCOL.md`
- Modify: `docs/acquisition/operations.md`

**Interfaces:**
- `collect_sources.py --days 7` reads existing local audit, GSC, GA4, Bing, PostHog, keyword, and SERP artifacts.
- `generate_brief.py --opportunity <id>` writes a brief with lane, post type, question H1, answer target, sections, sources, internal links, CTA, and timing gate.
- `refresh_review.py --days 28` emits `NO_CHANGE`, `OBSERVE`, `REVIEW`, `CONSOLIDATE`, or `RETIRE` without editing article files.

- [ ] Write tests for source separation, missing-source reporting, acquisition versus feature classification, and report-only behavior.
- [ ] Run focused tests and confirm failure before implementation.
- [ ] Implement source adapters around existing files and reports, preserving first-party versus competitor boundaries.
- [ ] Implement fixed scoring with explainable factors: trigger fit, evidence strength, intent ownership, commercial role, and timing eligibility.
- [ ] Generate briefs without invoking an external content service.
- [ ] Run one real report-only command against available local artifacts and capture its output.
- [ ] Commit: `feat(content): connect local briefs to acquisition evidence`.

---

## Task 5: Add the active create, review, edit, and approval workflow

**Blocks:** Task 3, Task 4
**Demoable:** A validated opportunity produces a local draft, automated review returns named findings, approved edits produce a new draft revision, and publication remains blocked until an explicit human approval record exists.

**Files:**
- Modify: `customer-portal/package.json`
- Modify: `customer-portal/package.json` to add the publish-readiness check to the existing `ci` script
- Create: `scripts/content_pipeline/create_draft.py`
- Create: `scripts/content_pipeline/review_draft.py`
- Create: `scripts/content_pipeline/apply_edits.py`
- Create: `scripts/content_pipeline/publish_article.py`
- Create: `customer-portal/__tests__/blog-publish-readiness.test.tsx`
- Create: `tests/test_content_pipeline_workflow.py`
- Create: `docs/content-pipeline-runbook.md`
- Modify: `docs/superpowers/specs/2026-09-04-local-blog-content-pipeline-design.md` only if implementation clarifies an interface

**Interfaces:**
- `create_draft.py --opportunity <id>` creates a versioned local draft from a validated brief and records provenance without calling an external content service.
- `review_draft.py --draft <path>` runs the 14 requirement checks, claim/provenance checks, link/schema checks, and returns named findings without silently editing the draft.
- `apply_edits.py --draft <path> --edits <path>` creates a new immutable draft revision, preserving the prior revision and recording each edit.
- `publish_article.py --draft <path> --approval <path>` publishes only when the approval record names the exact draft hash, reviewer, timestamp, and passed readiness report. It must fail closed otherwise.
- `npm run check:blog-content` returns nonzero for blocked content and zero for valid content.
- CI checks content before build.
- Report-only scheduled runs write artifacts but never deploy.
- Publication is a guarded execution step, not an automatic consequence of recommendation or review.

- [ ] Add tests for all 14 attached requirements that can be checked statically.
- [ ] Add tests for no em dash, no banned claims, no duplicate navigation/footer, no inline styles, valid internal links, and sitemap parity.
- [ ] Add tests for draft creation provenance, review findings, immutable edit revisions, approval hash matching, missing approval rejection, and publish report-only behavior.
- [ ] Run the invalid fixture and verify nonzero exit with named reasons.
- [ ] Run the valid fixture and verify zero exit with a PASS report.
- [ ] Add the command to the existing CI sequence without weakening current checks.
- [ ] Demonstrate one complete local create, review, edit, approval-gate, and publish dry run without deploying.
- [ ] Document supervised proof, failure behavior, rollback, and approval records.
- [ ] Commit: `test(blog): enforce local publish-readiness and supervised workflow`.

---

## Task 6: Prove local parity, remove Opinly blog dependency, and deploy

**Blocks:** Task 5
**Demoable:** Production serves both local blog lanes, and no blog runtime path imports or calls Opinly.

**Files:**
- Modify: `customer-portal/app/sitemap.ts`
- Delete or replace: `customer-portal/app/[blogPath]/[[...slug]]/page.tsx`
- Delete: `customer-portal/app/api/opinly/route.ts` only after webhook dependency is confirmed unused
- Modify: `customer-portal/app/lib/opinly.ts` and `customer-portal/app/layout.tsx` only as required to remove blog/runtime coupling, preserving unrelated analytics behavior until separately reviewed
- Modify: `customer-portal/package.json` and `package-lock.json` to remove unused Opinly packages only after source search proves no remaining consumers
- Create: `docs/releases/YYYY-MM-DD-local-blog-migration.md`

**Interfaces:**
- Local `/blog` and article routes are canonical.
- Sitemap contains local article URLs.
- No local blog route performs an Opinly API request.
- The Opinly analytics pixel is not removed unless separately authorized and verified as unrelated to blog delivery.

- [ ] Run a repository search for all Opinly imports, API calls, configuration, and webhook references.
- [ ] Run local parity checks for index, one acquisition route, one feature route, 404 behavior, metadata, schema, rendered HTML, and sitemap.
- [ ] Run the full portal CI suite and production build.
- [ ] Deploy with the existing guarded customer-portal deployment script.
- [ ] Verify production homepage `/`, `/audit`, `/blog`, both article routes, `/sitemap.xml`, canonical links, JSON-LD, rendered H1s, and `/audit` CTA.
- [ ] Check `journalctl -u nebula-nextjs.service` after restart for new errors.
- [ ] Record the exact release commit, live build revision, HTTP statuses, and rollback reference.
- [ ] Commit: `chore(blog): remove temporary Opinly blog dependency`.

## Execution checkpoints

After Tasks 1, 3, and 6, stop for review. Do not deploy before Task 6. Do not schedule autonomous report generation before one valid and one invalid supervised run have been inspected.

## Final proof boundary

This plan proves a local, validated publishing mechanism and live route delivery. It does not prove organic traffic, AI citations, ranking improvements, assisted conversions, or purchases. Those require completed measurement windows and attributable commercial evidence.
