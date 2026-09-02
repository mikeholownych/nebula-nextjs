# Citable Information Architecture Design

## Status

Approved through the Claude SEO full-site action plan and the user’s instruction to proceed.

## Purpose

Citable needs a small, legible public information architecture that explains distinct user jobs without copying Claude SEO’s command-page aesthetic or turning package capabilities into unsupported outcome claims.

The system must establish what Citable can observe and preserve as evidence. It must not promise rankings, citations, conversions, workflow success, deployment success, customer outcomes, or benchmark results that do not have governed evidence.

## Approaches considered

### 1. Keep one long overview

This minimizes routes, but preserves the current problems: mixed intent, duplicated release facts, weak search entry points, and an overview that tries to be documentation, comparison, changelog, and proof page simultaneously.

### 2. Create one page per detector or command

This maximizes route count but creates templated, overlapping pages and copies the competitor’s most obvious information-architecture pattern. It also raises thin-content and maintenance risk.

### 3. Use a bounded job-led hub and spokes

This is the approved approach. One overview explains the product; a quick start teaches the first successful workflow; five job pages answer materially different evidence questions; a comparison page explains category fit; and one release page projects current package facts. A single route registry drives navigation, static parameters, metadata, and sitemap entries.

## Route map

| Route | Ownership | Primary question |
|---|---|---|
| `/resources/citable` | Product overview | What can Citable establish without promising rankings or citations? |
| `/resources/citable/quick-start` | First-run workflow | How do I install, audit, inspect evidence, decide, and verify? |
| `/resources/citable/jobs/technical-retrieval-audit` | Retrieval evidence | Is this site technically retrievable? |
| `/resources/citable/jobs/claim-evidence-governance` | Claim governance | Can this claim be published and defended? |
| `/resources/citable/jobs/answer-extractability-audit` | Answer extraction | Can an answer engine reliably extract this answer? |
| `/resources/citable/jobs/entity-narrative-audit` | Entity consistency | Is the entity represented consistently? |
| `/resources/citable/jobs/release-deployment-verification` | Release evidence | Did this release reach its controlled surfaces? |
| `/resources/citable/compare` | Category decision | When is Citable a verification layer rather than a monitoring replacement? |
| `/resources/citable/releases` | Current release | What changed in the synchronized published release? |

The job pages own evidence/governance intent. Existing Learning Centre pages continue to own landing-page conversion diagnosis, so the estates do not cannibalize one another.

## Architecture

`app/resources/citable/content.ts` is the route and editorial registry. It imports current package facts from `data/citable-release.json`; render files may not duplicate version or count literals.

Shared rendering units:

- `CitablePageShell` owns breadcrumbs, width, page header, and related-route navigation.
- `CitableProofPanel` distinguishes documented package facts from unavailable customer, benchmark, workflow, and deployment proof.
- `CitableJobTemplate` renders the answer-first job structure from a typed record.

The registry, route implementations, overview navigation, and sitemap projection ship atomically. No public link or sitemap entry may point to a route that is not implemented in the same commit series.

## Page content contract

Every job page contains:

1. a direct answer to its primary question;
2. what Citable observes;
3. which evidence artifacts it produces or checks;
4. what the observation cannot establish;
5. the next operational step;
6. related routes selected from the bounded registry.

The quick start follows install → audit → inspect → decide → verify. Commands come from the current synchronized package documentation, not memory.

The overview remains the canonical `SoftwareApplication` entity with `@id=https://nebulacomponents.com/resources/citable#software`. Supporting pages use article and breadcrumb schema.

## Proof and error behavior

- Package version/count/license facts come from the deterministic release projection.
- Workflow and deployment state remain `unknown` unless a fresh committed receipt exists.
- Customer cases and benchmark outcomes render as not published while their governed projections are empty.
- Missing or invalid job slugs return 404.
- Duplicate paths, titles, H1s, or primary questions fail tests.
- A new registry route that lacks a page/sitemap entry fails tests.

## Visual direction

Use Nebula’s existing typography, spacing, borders, cards, and restrained emerald accent. The pages should feel like an evidence handbook, not a terminal, command catalog, or imitation of Claude SEO. Dense capability inventories belong in structured summaries; the main reading path stays editorial and answer-first.

## Verification

- Registry uniqueness and exact route coverage.
- Overview links every supporting route.
- Static params and sitemap derive from the registry.
- No hard-coded release facts in render files.
- Each route has canonical metadata, one H1, evidence limits, and schema.
- Raw route checks confirm 200 responses and the explicit unavailable-proof disclosure.
- Existing Citable projection, evidence, containment, typecheck, lint, and build gates remain green.
