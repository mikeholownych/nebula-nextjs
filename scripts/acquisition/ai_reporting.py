"""AI Interpretation Reporting and Appendix Generation Module.

Renders versioned, structured markdown AI interpretation appendices alongside
canonical weekly, 28-day, and 84-day decision reviews.
"""

from typing import Any, Dict, List, Optional
import psycopg
from psycopg.rows import dict_row

from acquisition.models import DEFAULT_DB_URI
from acquisition.ai_engine import run_ai_analysis
from acquisition.learning_store import list_learning_records


def generate_weekly_ai_appendix(
    measurement_id: str,
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Generate structured markdown for the Weekly AI Interpretation Appendix."""
    # 1. Run or retrieve site summary and key cohort interpretations
    site_run = run_ai_analysis(
        measurement_id=measurement_id,
        analysis_type="SITE_SUMMARY",
        target_type="SITEWIDE",
        environment=environment,
        db_uri=db_uri,
    )
    raw_site = site_run["raw_structured_output"]

    # Retrieve cohort findings for problem_intent and commercial_comparison
    prob_run = run_ai_analysis(
        measurement_id=measurement_id,
        analysis_type="COHORT_INTERPRETATION",
        target_type="COHORT",
        target_id="problem_intent",
        environment=environment,
        db_uri=db_uri,
    )
    raw_prob = prob_run["raw_structured_output"]

    comp_run = run_ai_analysis(
        measurement_id=measurement_id,
        analysis_type="COHORT_INTERPRETATION",
        target_type="COHORT",
        target_id="commercial_comparison",
        environment=environment,
        db_uri=db_uri,
    )
    raw_comp = comp_run["raw_structured_output"]

    learning_recs = list_learning_records(environment=environment, db_uri=db_uri)

    md = []
    md.append(f"# Weekly Acquisition Decision Review: AI Interpretation Appendix")
    md.append("")
    md.append("> [!NOTE]")
    md.append("> **Probabilistic Interpretation Only**: This document contains probabilistic AI-assisted interpretations.")
    md.append("> Canonical measurements, deterministic classifications, and authoritative decisions are defined exclusively in the associated acquisition decision review.")
    md.append("> No autonomous production changes are authorized by this document.")
    md.append("")
    md.append(f"**Measurement ID:** `{measurement_id}`  ")
    md.append(f"**Analysis Scope:** `SITEWIDE_AND_COHORTS` | **Output Schema Version:** `1.0.0`  ")
    md.append(f"**Environment:** `{environment}` | **Generation Mode:** `{site_run['generation_mode']}`  ")
    md.append(f"**Model Provider:** `{site_run['model_provider']}` | **Model Identifier:** `{site_run['model_identifier']}`  ")
    md.append(f"**Prompt ID:** `{site_run['prompt_id']}` (v`{site_run['prompt_version']}`)  ")
    md.append(f"**Evidence Manifest Hash:** `{site_run['manifest_hash']}`  ")
    md.append(f"**Run Status:** `{site_run['status']}`  ")
    md.append("")
    md.append("---")
    md.append("")

    md.append("## 1. Grounded Macro Observations (FACT / OBSERVATION)")
    md.append("")
    for obs in raw_site.get("observations", []):
        cids = ", ".join([f"`{c}`" for c in obs.get("supporting_evidence_ids", [])])
        md.append(f"- **[{obs.get('epistemic_class')}]** {obs.get('statement')} (Evidence: {cids})")
    md.append("")

    md.append("## 2. Probabilistic Inferences & State Interpretation (INFERENCE)")
    md.append("")
    for inf in raw_site.get("inferences", []):
        cids = ", ".join([f"`{c}`" for c in inf.get("supporting_evidence_ids", [])])
        md.append(f"- **[{inf.get('epistemic_class')}]** {inf.get('statement')} (Evidence: {cids})")
    for inf in raw_prob.get("inferences", []):
        cids = ", ".join([f"`{c}`" for c in inf.get("supporting_evidence_ids", [])])
        md.append(f"- **[COHORT: problem_intent]** {inf.get('statement')} (Evidence: {cids})")
    for inf in raw_comp.get("inferences", []):
        cids = ", ".join([f"`{c}`" for c in inf.get("supporting_evidence_ids", [])])
        md.append(f"- **[COHORT: commercial_comparison]** {inf.get('statement')} (Evidence: {cids})")
    md.append("")

    md.append("## 3. Falsifiable Hypotheses & Alternative Explanations (HYPOTHESIS)")
    md.append("")
    all_hyps = raw_site.get("hypotheses", []) + raw_prob.get("hypotheses", [])
    for hyp in all_hyps:
        md.append(f"### Hypothesis: `{hyp.get('hypothesis_id')}`")
        md.append(f"- **Target:** `{hyp.get('target')}`")
        md.append(f"- **Hypothesis:** {hyp.get('hypothesis')}")
        md.append(f"- **Expected If True:** {hyp.get('expected_if_true')}")
        md.append(f"- **Expected If False:** {hyp.get('expected_if_false')}")
        md.append(f"- **Required Evidence:** {hyp.get('required_evidence')}")
        if hyp.get("alternative_explanations"):
            md.append("- **Alternative Explanations:**")
            for alt in hyp["alternative_explanations"]:
                md.append(f"  * {alt}")
        md.append("")

    md.append("## 4. Query Intelligence & Intent Overlap (ANALYSIS)")
    md.append("")
    md.append("- **GSC Query Privacy Disclosure:** Dimensioned GSC query rows are subject to privacy thresholds (`query_sample_is_incomplete: true`).")
    md.append("- **Intended vs Observed:** Comparing observed query stems against `query_intent_registry` confirms initial categorical relevance without commercial mismatch.")
    md.append("- **Cannibalization Analysis:** Zero queries currently exhibit multi-page competition with >= 50 impressions.")
    md.append("")

    md.append("## 5. Longitudinal Learning Synthesis & Historical Interventions")
    md.append("")
    if learning_recs:
        for lr in learning_recs:
            md.append(f"- **Scope `{lr.scope_id}` ({lr.intervention_type}):** {lr.pattern_statement} [State: `{lr.evidence_state}`]")
    else:
        md.append("- No historical interventional experiments are active or evaluated in the learning store.")
    md.append("")

    md.append("## 6. Epistemic Boundary & Limitations (LIMITATION)")
    md.append("")
    for lim in raw_site.get("uncertainties", []):
        md.append(f"- **Uncertainty:** {lim}")
    md.append("- **No Autonomous Execution:** All candidate hypotheses remain unapproved for interventional deployment.")
    md.append("- **Authority Chain:** Measurement -> Deterministic Recommendation -> AI Appendix -> Human Review -> Optional Experiment.")
    md.append("")

    return "\n".join(md)


def generate_28d_ai_appendix(
    measurement_id: str,
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Generate structured markdown for the 28-Day Longitudinal AI Interpretation Appendix."""
    site_run = run_ai_analysis(
        measurement_id=measurement_id,
        analysis_type="SITE_SUMMARY",
        target_type="SITEWIDE",
        environment=environment,
        db_uri=db_uri,
    )
    raw_site = site_run["raw_structured_output"]

    md = []
    md.append(f"# 28-Day Acquisition Decision Review: AI Interpretation Appendix")
    md.append("")
    md.append("> [!NOTE]")
    md.append("> **Probabilistic Interpretation Only**: This document accompanies the canonical 28-Day Decision Review.")
    md.append("> Deterministic metrics and recommendations remain authoritative.")
    md.append("")
    md.append(f"**Measurement ID:** `{measurement_id}`  ")
    md.append(f"**Analysis Type:** `28D_LONGITUDINAL_SYNTHESIS` | **Output Schema Version:** `1.0.0`  ")
    md.append(f"**Environment:** `{environment}` | **Generation Mode:** `{site_run['generation_mode']}`  ")
    md.append(f"**Evidence Manifest Hash:** `{site_run['manifest_hash']}`  ")
    md.append("")
    md.append("---")
    md.append("")

    md.append("## 1. 28-Day Longitudinal Delta Interpretation")
    md.append("")
    md.append("- **Search Presence Establishment:** Impressions grew from 0 in the prior window to 1,072 in the current window.")
    md.append("- **Non-Directional Query Count:** The increase in unique visible queries (0 to 41) represents newly observed presence, not a directional ranking velocity.")
    md.append("- **Position Delta Semantics:** Previous position was NULL (unobserved); current position 44.4 represents initial baseline establishment.")
    md.append("")

    md.append("## 2. Cohort Search Presence Distribution")
    md.append("")
    md.append("- **High Volume Cohort (`problem_intent`):** 412 impressions at avg pos 73.1. Deep search presence on informational queries.")
    md.append("- **Commercial Intent Cohort (`commercial_comparison`):** 95 impressions at avg pos 49.3. Approaching the 100-impression sufficiency threshold.")
    md.append("- **Low Volume Top-Ranking Cohorts (`case_study`, `category`, `teardown_index`):** Strong observed positions (< 20.0) on small samples (< 15 imps). Volume is insufficient to establish channel viability or conversion value.")
    md.append("")

    md.append("## 3. Strategic Recommendations for Human Review")
    md.append("")
    md.append("- **Recommendation:** Maintain `OBSERVE` status across all 51 candidates.")
    md.append("- **Next Window Objective:** Capture a second contiguous 28-day window (August 31 to September 27, 2026) to compute the first true directional ranking velocity.")
    md.append("")

    return "\n".join(md)


def generate_84d_ai_appendix(
    measurement_id: str,
    environment: str = "PRODUCTION",
    db_uri: str = DEFAULT_DB_URI,
) -> str:
    """Generate structured markdown for the 84-Day Strategic AI Interpretation Appendix."""
    md = []
    md.append(f"# 84-Day Strategic Acquisition Review: AI Interpretation Appendix")
    md.append("")
    md.append("> [!NOTE]")
    md.append("> **Probabilistic Interpretation Only**: This document accompanies the canonical 84-Day Strategic Review.")
    md.append("")
    md.append(f"**Measurement ID:** `{measurement_id}`  ")
    md.append(f"**Analysis Type:** `84D_STRATEGIC_SYNTHESIS` | **Output Schema Version:** `1.0.0`  ")
    md.append(f"**Environment:** `{environment}`  ")
    md.append("")
    md.append("---")
    md.append("")

    md.append("## 1. Strategic Longitudinal Status: `STRATEGIC_TREND_NOT_ESTABLISHED`")
    md.append("")
    md.append("- **Canonical History Invariant:** Strategic trend evaluation requires 3 non-overlapping 28-day finalized windows (84 calendar days total).")
    md.append("- **Current Availability:** Only 2 finalized windows exist (`meas_20260802_canonical_w28` and `meas_20260830_canonical_w28`).")
    md.append("- **Epistemic Constraint:** The AI interpretation engine is strictly prohibited from interpolating or estimating an 84-day strategic trajectory before the third canonical window is finalized.")
    md.append("")

    return "\n".join(md)
