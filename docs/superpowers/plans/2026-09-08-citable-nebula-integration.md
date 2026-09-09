# Citable v1.17.0 Nebula Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dirty Nebula Citable integration production-complete, version-safe, provenance-preserving, and verifiable through the paid audit and re-audit paths.

**Architecture:** Keep Citable as the bounded evidence engine and Nebula as the commercial orchestration layer. The platform API will normalize and persist Citable's v1.17.0 envelope, the results surface will expose evidence and deliverables, and the re-audit path will retain explicit same-condition verification rather than claiming conversion outcomes.

**Tech Stack:** FastAPI, Python 3.12, PostgreSQL, Next.js, TypeScript, Jest, Playwright, Citable CLI v1.17.0, systemd.

## Global Constraints

- This is a live production service; no partial or unverified deployment is acceptable.
- Citable must be pinned to `@nebulacomponents/citable@1.17.0` or a newer explicitly reviewed release.
- Nebula must not claim conversion lift, ranking, citation, or revenue outcomes from Citable observations alone.
- No site access is required for the Fix Pack; generated artifacts must include rollback and re-audit instructions.
- Preserve existing dirty work; do not delete or overwrite unrelated user changes.
- No em-dashes in shipped content; canonical commercial facts remain `$97`, `48 hours`, and the governed signal set.

### Task 1: Reconcile and version the Citable service

**Blocks:** none
**Demoable:** The service reports and enforces the installed Citable version, and generated briefs no longer contain stale release literals.

**Files:**
- Modify: `platform_api/services/citable_service.py`
- Test: `tests/test_citable_cro_integration.py`

- [x] Write a failing test for version discovery and rejection of a stale binary.
- [x] Run the focused Python test and confirm the failure is caused by missing version enforcement.
- [x] Implement version discovery, minimum-version enforcement, and dynamic release metadata.
- [x] Run the focused test and the platform integration tests.

### Task 2: Preserve v1.17 provenance and sealed artifacts

**Blocked by:** Task 1
**Demoable:** A completed audit stores Citable version, release commit, run ID, finding provenance, and an integrity hash alongside its existing output.

**Files:**
- Modify: `platform_api/services/citable_service.py`, `platform_api/services/audit_db.py`, `platform_api/services/audit_runner.py`
- Test: `tests/test_citable_cro_integration.py`

- [x] Write failing tests for provenance normalization and deterministic artifact hashing.
- [x] Run them and confirm the missing fields fail.
- [x] Implement the normalized envelope and sealed run manifest without changing existing audit signal semantics.
- [x] Run focused tests and database-backed audit tests.

### Task 3: Connect implementation-kit and remediation verification contracts

**Blocked by:** Task 2
**Demoable:** An eligible paid audit can expose a customer implementation kit and a same-condition verification result through authenticated/share-token report paths.

**Files:**
- Modify: `platform_api/routes/report_routes.py`, `customer-portal/app/api/report/citable/route.ts`, `customer-portal/app/audit/[id]/results/ResultsClient.tsx`
- Test: `tests/test_citable_cro_integration.py`, `customer-portal/__tests__/citable-cro-governance.test.ts`, relevant E2E specs

- [x] Write failing route and UI contract tests for the kit and verification links.
- [x] Run focused tests and confirm the contracts are absent.
- [x] Implement bounded artifact delivery with ownership/share authorization and no automatic source write.
- [x] Run focused tests and browser tests.

### Task 4: Full dirty-tree validation and production promotion

**Blocked by:** Task 3
**Demoable:** All dirty files are accounted for, full CI passes, the production build is deployed, and live routes and logs confirm the result.

**Files:**
- Modify only files proven incomplete by validation.
- Test: repository CI and production probes.

- [x] Run full CI and classify every failure as fixed, unrelated, or blocking.
- [x] Run build and restart affected systemd units.
- [x] Verify `/`, `/audit`, `/pricing`, `/checkout`, `/resources/citable`, and touched report routes.
- [x] Inspect platform and Next.js journals for new errors and report exact artifacts.
