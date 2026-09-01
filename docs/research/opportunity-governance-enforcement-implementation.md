# Opportunity Governance Enforcement Implementation

**Status:** CONDITIONAL GO
**Baseline:** `5882902ac`
**Scope:** I1 claim expiry/review, I2 Observatory source binding, I3 offer-to-gate enforcement
**Commit:** enforcement-layer commit (SHA reported in the release receipt)

## 1. Executive result

I1, I2, and I3 are implemented and proven by executable tests. The first I2 implementation was rejected because it scanned `app/observatory/page.tsx` for `evidence_id` text, found zero references, and passed vacuously. The corrected implementation binds the actual Observatory source path through the existing `app/lib/datasets.ts` registry and requires a non-empty, consumed, resolvable source set.

The result is **CONDITIONAL GO**. The governance controls pass. The repository's authoritative `npm run ci` is not green because of verified baseline failures unrelated to this enforcement work.

## 2. Why the first I2 implementation was rejected

The first checker treated an empty result from a fragile text scan as success. The real Observatory page obtains data from:

- `platform_api/services/audit_db.py`, through `/audit/stats/observatory`
- `/home/mike/nebula/seo-reports/ai-traffic-ledger.json`
- `/home/mike/nebula/reports/ai_visibility/*/summary.json`
- `/home/mike/nebula/ledgers/repair_verification.json`
- `/home/mike/nebula/ledgers/epistemic_observatory.json`

The page also consumes `/audit/stats/benchmarks` and publishes aggregate dataset statistics. No `.citable/evidence.yaml` ID references existed in that render path. Therefore the first implementation did not govern the actual evidence path and was removed from the acceptance basis.

## 3. Actual Observatory data/evidence path

```text
Rendered Observatory assertion
  -> app/observatory/page.tsx
     -> OBSERVATORY_SOURCES imported from app/lib/datasets.ts
     -> source IDs emitted into Dataset JSON-LD isBasedOn

Aggregate audit assertions
  -> PLATFORM_API_URL/audit/stats/observatory
     -> platform_api/services/audit_db.py aggregation
     -> completed audit rows and finding JSON
     -> existing cross-surface invariant tests and DatasetRecord contract

AI retrieval assertions
  -> seo-reports/ai-traffic-ledger.json
     -> server access-log classification and daily aggregation

AI answer/citation assertions
  -> reports/ai_visibility/<run>/summary.json
     -> committed visibility run summary

Repair verification assertions
  -> ledgers/repair_verification.json
     -> repair/re-audit verification ledger

Epistemic and gate assertions
  -> ledgers/epistemic_observatory.json
     -> epistemic state and gate ledger

Governance metadata
  -> OBSERVATORY_SOURCES in app/lib/datasets.ts
     -> observatory_status: publishing_authorized
     -> sourcePath existence
     -> linked DatasetRecord IDs
  -> .citable/evidence.yaml for any future evidence-package reference
     -> observatory_status: publishing_authorized
     -> verification_status must be verified/reviewed
```

Content classification:

- Aggregate dataset statistic: governed by canonical source records, dataset registry, API aggregation, and existing cross-surface tests.
- Operational ledger statistic: governed by a canonical ledger path and source status.
- Epistemic/verification statistic: governed by its canonical ledger and source status.
- Citable evidence-package reference: governed by `observatory_status` plus existing evidence validity and claim checks.
- Static explanatory or capability copy: not treated as an evidence-package reference by I2.

## 4. Final I2 binding

`app/lib/datasets.ts` now extends the existing registry with `OBSERVATORY_SOURCES`. `app/observatory/page.tsx` imports the registry and emits every source ID in the Observatory Dataset JSON-LD `isBasedOn` field.

`check-opportunity-governance.mjs` validates the real binding by:

1. Requiring the Observatory page to import and consume `OBSERVATORY_SOURCES`.
2. Requiring `OBSERVATORY_SOURCES.map` to emit the governed source IDs.
3. Parsing the canonical source declarations from `datasets.ts`.
4. Failing if the source set is empty or unparseable.
5. Requiring `observatory_status: publishing_authorized`.
6. Requiring every source path to resolve from the repository root.
7. Requiring linked dataset IDs to resolve in the existing dataset registry.
8. Validating any explicit `.citable` evidence references for existence, authorization, and valid evidence state.

This is a source binding, not rendered-prose scraping. The current Observatory has five governed sources, so zero-source success is impossible without the checker failing.

## 5. I1 non-vacuity review

I1 validates the real Markdown tables in `customer-portal/docs/governance/CLAIM_REGISTER.md`. The register was extended, without replacing its Markdown format, with:

- Claim ID
- Class
- Expiry
- Review Due
- Evidence State
- Dependency

`commercial` and `empirical` claims require all governed metadata. The checker rejects expired or overdue claims, malformed dates, missing required metadata, invalid evidence states, invalid dependencies, and published Observatory claims without verified evidence.

Positioning and descriptive claims remain exempt from empirical expiry metadata, matching the current classification model.

Anti-vacuity: if active claim sections contain table content but parsing produces zero rows, the checker fails with a specific discovery error. Focused fixtures cover valid claims, expiry, review overdue, malformed dates, missing metadata, dependency invalidity, evidence regression, and unsupported published claims.

## 6. I3 non-vacuity review

I3 parses the actual `checkout.offerKey` structure in `app/lib/public-facts.ts`. The baseline is the parent Git revision by default, not the current file, so a newly added key cannot hide by becoming its own baseline.

The checker:

- discovers the real current offer key set and fails if discovery returns zero keys;
- preserves the explicit grandfathered `fix-pack` baseline;
- detects new keys and material changes under existing keys;
- requires an `opportunity_id` source reference;
- requires a corresponding gate record with `offer_key` linkage;
- requires `gate_outcome: PASS`, non-null `adr_ref`, and PASS for C1 through C7;
- fails closed for missing, malformed, unrelated, indeterminate, failed, or unauthorized records.

A material term change under the grandfathered `fix-pack` key is covered by a regression test and requires the same gate path. Price presence is never used as authorization.

## 7. Non-vacuity tests added

`customer-portal/__tests__/opportunity-governance-enforcement.test.ts`

- 32 tests pass.
- I1 valid and exempt claim behavior.
- I1 all required failure fixtures.
- I1 zero-row discovery failure.
- I2 authorized evidence reference.
- I2 missing, unauthorized, unknown, unresolved, and invalid evidence states.
- I2 Citable-only evidence exclusion.
- I2 actual production path using the real Observatory page and datasets registry.
- I2 omitted binding, empty source set, and unresolved source path failures.
- I3 grandfathered offer and authorized new offer.
- I3 missing, wrong, malformed, indeterminate, failed, and unauthorized gate cases.
- I3 material-term identity reuse failure.
- Cross-control separation tests.

## 8. Tests and verification run

Passed:

```text
npm test -- --runInBand __tests__/opportunity-governance-enforcement.test.ts
Test Suites: 1 passed, 1 total
Tests: 32 passed, 32 passed

npm run check:opportunity-governance
Opportunity governance enforcement passed (I1/I2/I3, as of 2026-09-01)

npm run typecheck
exit code 0
```

Existing governance/data tests passed in the combined run:

```text
4 suites passed, 77 tests passed
```

Those suites were:

- `citable-proof-integrity.test.ts`
- `public-facts.test.ts`
- `dataset-registry.test.ts`
- `evidence-atoms.test.ts`

The combined run also included `site-surface-integrity.test.ts`, which failed only on the baseline em-dash issue below.

## 9. Baseline failures

### PRE-EXISTING BASELINE FAILURE: site integrity

`site-surface-integrity.test.ts` fails on:

- `app/checkout/page.tsx`, existing em-dash comment
- `app/observatory/page.tsx`, existing em-dash comments

The exact content is present at baseline commit `5882902ac`. The Observatory line numbers shifted because this implementation added the registry import and JSON-LD binding; the offending content itself predates this work.

### PRE-EXISTING BASELINE FAILURE: claim lint

`npm run check:claims` fails on four existing `conversion-impact` matches:

- `app/checkout/page.tsx`
- `app/audit/[id]/results/ResultsClient.tsx` at three existing locations

The exact matches are present in those files at `5882902ac`. No claim-lint file was changed in this implementation.

### Authoritative CI result

```text
npm run ci
CI_EXIT=1
Stopped at npm run lint
app/observatory/page.tsx:271:9
'topConditions' is assigned a value but never used
```

`topConditions` is present at the same line in baseline commit `5882902ac`. This is a baseline lint failure, not a governance regression. `npm run ci` therefore cannot be called green.

## 10. Control classification after verification

Changed to MACHINE-ENFORCED:

- I1 governed claim expiry/review and evidence-state checks.
- I2 Observatory source binding and `.citable` evidence-reference authorization.
- I3 new/materially changed commercial offer gate linkage.

Still PROCESS-ENFORCED or DOCUMENTARY / DELIBERATIVE:

- C1-C7 evidence quality and assessor judgment.
- C5 economic-buyer independence and provenance truthfulness.
- Refuse-list strategic coherence review.
- Adverse-result disclosure completeness.
- Gate record immutability convention.
- Customer-demand append-only semantics.
- General ADR workflow requirements outside offer authorization.

## 11. Residual risks

- The Observatory source registry records publication authorization for the existing public data paths, but it does not independently prove the factual correctness of the underlying ledgers. Existing source-specific and cross-surface controls remain responsible for those semantics.
- The current page contains fallback display values when dependencies are unavailable. This was outside I1-I3 scope and remains a separate evidence-integrity concern.
- The checker intentionally does not infer commercialization from Citable capability, price, customer-demand thresholds, convergence, or ADR presence alone.
- The parent-Git baseline comparison assumes CI evaluates a commit with a parent revision. Initial-history fallback is fail-safe only for the absence of a parent and should not be used as a release baseline.

## 12. What was not built

- No database.
- No service or workflow engine.
- No dashboard.
- No scoring system.
- No new lifecycle states.
- No unrelated em-dash or claim-lint cleanup.
- No CI controls for C5 independence, convergence independence, adverse disclosure completeness, or gate immutability.
- No modification to the `system_setup` submodule.

## 13. Final status

**CONDITIONAL GO.**

The governance controls pass. The repository is not globally CI-green because existing baseline lint and site-integrity failures remain. The enforcement layer is committed as `89b7c7272`.
