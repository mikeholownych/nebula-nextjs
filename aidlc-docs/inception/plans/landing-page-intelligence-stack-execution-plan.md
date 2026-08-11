# Landing Page Intelligence Stack Execution Plan

## Detailed analysis

- **Transformation type:** Single Next.js application feature.
- **User-facing change:** Yes - new learning-centre resource and direct download.
- **Structural change:** Limited - one deterministic static-asset projection pipeline.
- **Data model change:** No.
- **API change:** No.
- **Infrastructure change:** No.
- **Risk level:** Medium because public claims, archive integrity, and CI drift behavior are release-critical.
- **Rollback complexity:** Easy; remove the isolated route, source bundle, projection files, package script, and CI step.

## Stage decisions

### Inception

- [x] Workspace detection - reused completed brownfield analysis.
- [x] Requirements analysis - approved bounded requirements.
- [x] User stories - two stories with acceptance criteria generated.
- [x] Workflow planning - this document and the canonical implementation plan.
- [x] Application design - skipped as a separate stage; the approved design stays within existing App Router, static assets, and shared UI boundaries.
- [x] Units generation - one independently releasable unit; further decomposition would add coordination without an independent release boundary.

### Construction

- [x] Functional design - embedded in exact bundle manifest, packager contracts, page contract, and tests.
- [x] NFR requirements - embedded: deterministic output, fail-closed validation, accessibility, privacy, security, and maintainability.
- [x] NFR design - embedded in the approved design and implementation plan.
- [x] Infrastructure design - skipped; existing Next.js service and domain are unchanged.
- [ ] Code generation - execute after explicit plan approval.
- [ ] Build and test - execute after code generation.

### Operations

- [ ] Operations - repository stage is a placeholder; deployment verification is included in the build-and-test release task.

## Execution sequence

1. Build and adversarially test deterministic bundle packaging.
2. Build and test the public article, download CTA, and audit CTA.
3. Wire the actual GitHub workflow and run rendered desktop/mobile E2E tests.
4. Run the full release matrix, deploy, verify production, and require independent PASS.

## Canonical plan

`docs/superpowers/plans/2026-07-25-landing-page-intelligence-stack.md`

## Extension compliance

- **Nebula audit pipeline:** Compliant; link-only integration, no scoring/delivery/state changes.
- **Nebula lead pipeline:** N/A; no lead creation, send, suppression, or ledger write.
- **Nebula compliance sovereignty:** Compliant; no inference call, personal data, or certification claim.
- **Security baseline:** Disabled in AI-DLC state; deterministic adversarial archive checks remain part of normal product validation.
- **Property-based testing:** Disabled; table-driven malformed-manifest fixtures provide bounded adversarial coverage.
- **Resiliency baseline:** Disabled; no new runtime service exists.

## Success criteria

All approved functional requirements, local quality gates, production rendered checks, archive-digest comparison, production Citable regression, and independent read-only review pass.
