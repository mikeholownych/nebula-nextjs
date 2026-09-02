# Holdout Semantics, Temporal Clocks & Window Purity

**Phase:** Phase 5 (Controlled Experiments & Holdout Enforcement)  
**Status:** Authoritative  

---

## 1. Wall-Clock vs Finalized Evidence Clocks

Experiment evaluation eligibility requires strict separation between two independent temporal clocks:

1. **Wall-Clock Duration:** Real-world elapsed time since `effective_change_at` ($T_{\text{now}} - T_{\text{deploy}} \ge 28\text{ days}$).
2. **Finalized Evidence Duration:** Actual finalized source dates available from Google Search Console and GA4 ($(T_{\text{source\_end}} - T_{\text{source\_start}}) + 1 \ge 28\text{ days}$).

An experiment is not evaluable merely because 28 wall-clock days have elapsed if source finalization lag limits available finalized dates to 25 days.

---

## 2. Window Purity & Contamination Prevention

A valid post-change measurement window must satisfy the purity condition:
$$\text{effective\_period\_start} \ge \text{effective\_change\_at}.\text{date()}$$

If a 28-day measurement window begins prior to the deployment timestamp ($\text{start} < \text{deploy}$), the window is classified as **Contaminated** (containing a mixture of pre-change and post-change evidence).

The evaluation engine detects window contamination and marks evaluation attempts on contaminated windows as `CONFOUNDED` / `NOT_CLEAN`.

---

## 3. Holdout Protection & "Do Not Change" Period

When an experiment is activated:
- `do_not_change_until` is calculated as $\text{effective\_change\_at} + \text{minimum\_holdout\_days}$.
- `scheduled_evaluation_at` is calculated as $\text{do\_not_change_until} + 3\text{ days}$ (to account for GSC 3-day holdback finalization).
- Operators and automated systems are alerted against modifying target routes during this observation window.
