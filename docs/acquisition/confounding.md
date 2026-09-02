# Confounding Detection & Attribution Protection

**Phase:** Phase 5 (Attribution Protection & Confounding Detection)  
**Status:** Authoritative  

---

## 1. The Attribution Problem in Production Systems

In a live production service, multiple changes occur across content, routing, navigation, and marketing. If an unrecorded change modifies target pages while an experiment is observing search traffic, post-change deltas cannot be defensibly attributed to the original intervention.

The acquisition engine avoids false causal attribution by detecting overlapping interventions and classifying the experiment outcome as `CONFOUNDED`.

---

## 2. Confounding Severity Classification

| Confounding Level | Criteria | Impact on Evaluation |
|:---|:---|:---|
| **CRITICAL** | Emergency rollback occurred on target page or experiment's own change was rolled back. | Evaluation outcome forced to `CONFOUNDED`, confidence = `NONE`. |
| **MATERIAL** | Another change directly modified one or more target pages, or a structural change (`INTERNAL_LINKING`, `NAVIGATION`) affected the target cohort. | Evaluation outcome forced to `CONFOUNDED`, confidence = `NONE`. |
| **LOW** | Non-structural copy update on an adjacent page within the same cohort. | Evaluation proceeds with caveat noted in `confounding_details`. |
| **NONE** | Zero overlapping changes on target pages or cohorts during holdout. | Clean evaluation eligible. |

---

## 3. Confounded Outcome Semantics

When an experiment is evaluated as `CONFOUNDED`, it indicates:
> Post-change movement cannot be attributed with sufficient confidence because another material intervention occurred during the observation window.

This outcome preserves epistemic honesty and prevents erroneous strategy decisions based on corrupted causality.
