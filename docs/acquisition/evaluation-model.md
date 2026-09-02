# Experiment Evaluation Model & Decision Semantics

**Phase:** Phase 5 (Experiment Evaluation & Decision Review)  
**Status:** Authoritative  
**Rule Set ID:** `ruleset_2_0_0` (Decision Rule Registry)  

---

## 1. Six Canonical Outcome Classes

The acquisition engine evaluates experiments deterministically into one of six mutually exclusive outcomes:

1. **`SUPPORTED`:** Target metric moved in the pre-registered direction by $\ge 10\%$ (or met `expected_magnitude`), holdout criteria were met, window was clean, and zero material confounds were detected.
2. **`PARTIALLY_SUPPORTED`:** Target metric moved in the pre-registered direction but did not reach the $10\%$ threshold, or low-volume sample size limited confidence.
3. **`NOT_SUPPORTED`:** Full holdout and evidence gates were satisfied, but the target metric showed no material movement ($|\Delta| < 10\%$) or remained static.
4. **`INCONCLUSIVE`:** Evidence was insufficient to make a determination (e.g. zero traffic in both windows, or metric count remained below low-volume threshold).
5. **`CONFOUNDED`:** A material or critical overlapping production change modified the target pages/cohort during holdout, or the post-change window was contaminated with pre-change dates.
6. **`REGRESSED`:** Target metric moved opposite to the pre-registered direction by $\ge 10\%$ under sufficient evidence.

---

## 2. Low-Volume & Tiny Denominator Protection

To prevent misleading percentage claims on sparse events (e.g. $0 \rightarrow 1$ purchase = $+\infty\%$ or $1 \rightarrow 2$ purchases = $+100\%$):

- If both pre-change and post-change metric counts are $< 5$, the engine sets `low_volume_warning: True` in `learning_accumulated`.
- Confidence level is automatically downgraded to `LOW` or `NONE`.
- Minor movements are classified as `PARTIALLY_SUPPORTED` or `INCONCLUSIVE` rather than definitive confirmation.

---

## 3. Epistemic Separation: Support vs Causality

An outcome of `SUPPORTED` means:
> Observed post-change evidence is consistent with the pre-registered hypothesis under the defined observation parameters.

It does **not** assert isolated laboratory causality. All evaluations explicitly record this epistemic boundary.
