# Weekly Acquisition Decision Review: `meas_20260830_canonical_w28`

**Measurement ID:** `meas_20260830_canonical_w28`  
**Measurement Version:** `2.0.0`  
**Decision Rule Set ID:** `ruleset_2_0_0`  
**Environment:** `PRODUCTION` | **Generation Mode:** `PRODUCTION`  
**Generated At:** 2026-09-02 14:01:31 UTC  
**Code Commit:** `24776a0557c4ee7bbe9c95eeee4777da195927ab`  
**Observation Period:** 2026-08-03 to 2026-08-30 (28 days)  
**Data Quality Status:** `COMPLETE`

---

## 1. Quantitative Evidence Summary (FACT)

- **GSC Total Impressions:** 1,072
- **GSC Total Clicks:** 3
- **GSC Dimensionless Average Position:** 44.40
- **Dimensioned Impression-Weighted Position:** 64.31
- **Unique Visible Landing Pages:** 41
- **Unique Visible Queries:** 79
- **GA4 Organic Sessions:** 16
- **Completed Purchases ($97):** 0

## 2. Active Experiments & Protected Targets (FACT)

*Zero active production experiment holdouts currently running.*

## 3. Page Coverage Reconciliation & Invariant (FACT)

- **Total Canonical Pages Registered:** 95
- **Visible Pages (Impressions > 0):** 41
- **Page Recommendation Targets Evaluated:** 41
- **Excluded Pages (Handled at Cohort Level / Zero Presence):** 54
- **Blocked Pages:** 0
- **Unaccounted Pages:** 0 (Invariant: `unaccounted == 0`)

## 4. Intervention Candidates & Decisions (RECOMMENDATION)

Total Recommendations Generated: **51**

| Target Type | Target ID / Cohort | Recommendation Class | Evidence Status | Reason Code | Confidence |
|:---|:---|:---|:---|:---|:---|
| `COHORT` | `problem_intent` | `OBSERVE` | `SUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `product_core` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `resources` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `teardown_index` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `commercial_comparison` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `case_study` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `category` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `vertical_use_case` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `COHORT` | `individual_teardown` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `bc82184f-2b5b-418e-9f4f-fad14f1b77b9` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `344c3f76-f1fb-4fb8-b347-3f5b4129e552` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `1d2f0704-7660-41c1-a1cc-31d63b31522a` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `fcba8c45-9d8f-47ec-9164-25c1659dc0a1` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `02003a70-848b-4106-b937-75a275551145` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `808abc4e-3e91-4805-b9fc-6bc644f13926` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `c2e83e68-5a44-4ea0-bd24-dfb464bf818b` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `83260c06-2b7c-48aa-a718-44f0f0594fcf` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `ac82cb30-8581-49ae-ba8e-7fc7420190cc` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `2079e3e1-d030-44c6-bbce-969bcf8d132c` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `21da781a-d38b-4437-a8c1-d0dfcae482b7` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `415f6637-d022-49d5-ad14-8eee2f680142` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `36bd23cf-ec1a-4345-83b8-cd47bb5e4154` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `ed725193-9d9b-48de-9e73-4d8ac3b659ae` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `9b7c7b96-a03d-4176-ad93-fe7bb89a17e6` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `d9d91956-2af9-49e0-8b78-2675f9a25c23` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `0e78856e-6ab1-4fa0-bc4f-8d71016c173f` | `OBSERVE` | `SUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `1ae1d0ee-7119-4775-99c0-9ac3d90d6743` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `3111551a-21b0-4135-b8b4-5ed8da6a0a0d` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `253ad253-7452-475f-9539-67e332e74709` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `748da5cb-cc19-4f27-b991-3a04f788bf66` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `990615a6-270f-4960-917c-3ec3b15a9290` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `fc6372b0-56d8-4cc2-b341-70bea8f84312` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `08145b29-34da-411f-ab31-b3586695f51e` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `819f7c6d-eb83-4900-810f-f038f8f38942` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `ca7f7b11-1864-43e1-9524-9c29164ccd1d` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `39956f37-b8c0-4ee5-b757-4a583b3f7030` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |
| `PAGE` | `4748ff40-f804-4378-9c60-7b276aeb2000` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `40f530b5-bde6-4de4-b0b3-28b802012c63` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `cbe238c2-9370-4a17-a6bf-90e572d48882` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `bdc83597-d34f-4fed-a69f-e1cd2dd855db` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `55be99cb-7cf6-4a6a-b921-47866113de0d` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `a955440a-c5dc-475a-92e9-d734259a9521` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `0a09c38f-8b25-4efc-8f66-b5df6ccc5ba3` | `OBSERVE` | `SUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `0f7ddc6d-ed18-43eb-af5c-58f33daaac19` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `eab20c40-311a-4ae7-9e51-e98755ab752a` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `238bb60e-dffd-455e-8462-63d249365098` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `0c212a92-cd83-4f19-8e6b-85c4dc89329d` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `a167af6c-be5a-491f-a107-3f197c5acd19` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `46279ef6-8e09-48f0-be55-0057fd6b2fe0` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `PAGE` | `be4d40e8-9536-4f18-96a2-abb46a51a6ab` | `OBSERVE` | `INSUFFICIENT` | `LOW_RANKING_EXPOSURE` | `HIGH` |
| `SITEWIDE` | `None` | `OBSERVE` | `INSUFFICIENT` | `INSUFFICIENT_OBSERVATION` | `MEDIUM` |

## 5. Epistemic Boundary & Limitations (LIMITATION)

- Recommendations represent deterministic candidate classifications based on pre-registered decision rules.
- Recommendations do not constitute authorization to modify production without formal approval.
- Absence of clicks at ranking positions > 20 is expected distribution behavior, not evidence of copy deficiency.
