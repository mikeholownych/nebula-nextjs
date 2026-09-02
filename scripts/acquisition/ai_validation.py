import json
import re
from typing import Any, Dict, List, Set, Tuple


def extract_all_valid_manifest_ids(manifest: Dict[str, Any]) -> Set[str]:
    """Extract all legitimate evidence IDs present in the manifest."""
    valid_ids: Set[str] = set()
    for key in [
        "measurement_ids",
        "page_measurement_ids",
        "query_measurement_ids",
        "recommendation_ids",
        "experiment_ids",
        "anomaly_ids",
    ]:
        for item in manifest.get(key, []):
            valid_ids.add(str(item))
    return valid_ids


def validate_ai_output(
    envelope: Dict[str, Any],
    output_dict: Dict[str, Any],
) -> Tuple[bool, List[str], str]:
    """Validate structured AI output against the evidence envelope and deterministic boundaries.
    
    Returns:
        (is_valid, error_messages, final_status)
        final_status in ['SUCCESS', 'INVALID_OUTPUT', 'CONTRADICTED']
    """
    errors: List[str] = []
    manifest = envelope.get("manifest", {})
    valid_ids = extract_all_valid_manifest_ids(manifest)

    # 1. Required top-level schema fields
    required_keys = [
        "observations",
        "inferences",
        "hypotheses",
        "alternative_explanations",
        "investigation_suggestions",
        "uncertainties",
    ]
    for key in required_keys:
        if key not in output_dict:
            errors.append(f"Missing required top-level key: '{key}'")

    if errors:
        return False, errors, "INVALID_OUTPUT"

    # 2. Grounding & Evidence Citation Validation
    cited_ids_checked = 0
    for section_name in ["observations", "inferences", "hypotheses", "challenges"]:
        items = output_dict.get(section_name, [])
        if not isinstance(items, list):
            errors.append(f"Section '{section_name}' must be a list.")
            continue
        for idx, item in enumerate(items):
            if isinstance(item, dict):
                c_ids = item.get("supporting_evidence_ids", [])
                for cid in c_ids:
                    cited_ids_checked += 1
                    if cid not in valid_ids:
                        errors.append(
                            f"Invented evidence ID '{cid}' cited in {section_name}[{idx}]. Not present in manifest."
                        )

    if errors:
        return False, errors, "INVALID_OUTPUT"

    # 3. Deterministic Contradiction Checks
    det_state = envelope.get("deterministic_state", {})
    comparison = envelope.get("comparison", {})
    metrics = envelope.get("metrics", {})
    all_text_blob = " ".join([
        str(output_dict.get("observations", [])),
        str(output_dict.get("inferences", [])),
        str(output_dict.get("hypotheses", [])),
        str(output_dict.get("alternative_explanations", [])),
        str(output_dict.get("investigation_suggestions", [])),
    ]).lower()

    # Contradiction A: Claiming ranking loss/gain when trend is TREND_NOT_ESTABLISHED or prior presence was NONE
    if det_state.get("trend_classification") == "TREND_NOT_ESTABLISHED" or comparison.get("search_presence_transition") == "ESTABLISHED_FROM_NONE":
        if re.search(r"\b(rankings? (are|have been) (improving|declining|dropping|falling|gaining))\b", all_text_blob):
            errors.append(
                "Contradiction: AI claims ranking trend direction when deterministic state is TREND_NOT_ESTABLISHED / search presence is newly established from NONE."
            )
        if re.search(r"\b(improved (average )?rank by|ranking improved from 0)\b", all_text_blob):
            errors.append(
                "Contradiction: AI calculated ranking improvement from NULL/0 unobserved baseline."
            )

    # Contradiction B: Claiming CTR optimization on position > 20
    pos = metrics.get("macro_position") or metrics.get("position") or metrics.get("cohort_average_position")
    if pos is not None and pos > 20.0:
        if re.search(r"\b(ctr is (bad|poor|low)|optimize (snippets?|titles?|meta) to improve ctr|serp presentation issue)\b", all_text_blob):
            errors.append(
                f"Contradiction: AI diagnosed CTR/snippet failure on page/cohort with average position {pos} (> 20.0)."
            )

    # Contradiction C: Claiming causal proof on CONFOUNDED experiments
    experiments = envelope.get("experiments", [])
    confounded_eids = {e["experiment_id"] for e in experiments if e.get("outcome") == "CONFOUNDED"}
    if confounded_eids:
        if re.search(r"\b(the experiment proved|the change caused|established causal effect)\b", all_text_blob):
            # Check if any cited ID is confounded
            for item in output_dict.get("inferences", []) + output_dict.get("hypotheses", []):
                if isinstance(item, dict):
                    if any(cid in confounded_eids for cid in item.get("supporting_evidence_ids", [])):
                        errors.append(
                            "Contradiction / Causal Overclaim: AI claims causal proof using a CONFOUNDED experiment."
                        )

    # Contradiction D: Direct imperative production execution claims
    if re.search(r"\b(execute (the )?(change|rewrite|deploy) immediately|autonomous action authorized|deploying now)\b", all_text_blob):
        errors.append(
            "Contradiction: AI claims direct production execution authority. Only human-reviewed experiment drafts are permitted."
        )

    # Contradiction E: 84-day strategic trend claim when not established
    if envelope.get("analysis_type") == "84D_STRATEGIC" or envelope.get("target", {}).get("type") == "84D_STRATEGIC":
        if re.search(r"\b(84-day strategic trend is (established|improving|declining))\b", all_text_blob):
            errors.append(
                "Contradiction: AI claims 84-day strategic trend when deterministic system reports STRATEGIC_TREND_NOT_ESTABLISHED."
            )

    if errors:
        return False, errors, "CONTRADICTED"

    # 4. Check for NaN, Infinity, Malformed Types, and Excessive Bounds
    for section_name in ["observations", "inferences", "hypotheses", "challenges"]:
        items = output_dict.get(section_name, [])
        if len(items) > 100:
            errors.append(f"Oversized array in section '{section_name}' ({len(items)} items > 100 max).")
            return False, errors, "INVALID_OUTPUT"
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                errors.append(f"Item in '{section_name}[{idx}]' must be a JSON object, got {type(item).__name__}.")
                return False, errors, "INVALID_OUTPUT"
            stmt = item.get("statement") or item.get("hypothesis")
            if stmt and not isinstance(stmt, str):
                errors.append(f"Statement in '{section_name}[{idx}]' must be a string.")
                return False, errors, "INVALID_OUTPUT"

    # Check for NaN / Infinity in JSON representation
    raw_str = json.dumps(output_dict)
    if "NaN" in raw_str or "Infinity" in raw_str or "-Infinity" in raw_str:
        errors.append("Invalid floating point values (NaN/Infinity) detected in structured output.")
        return False, errors, "INVALID_OUTPUT"

    # Check for fake approval or direct modification instructions
    if re.search(r"\b(approved experiment\s+[a-z0-9_\-]+|approved recommendation\s+[a-z0-9_\-]+|production mutation approved|authorized live deployment)\b", all_text_blob):
        errors.append("Contradiction: AI asserted unauthorized fake approval or deployment authorization.")
        return False, errors, "CONTRADICTED"

    # 5. Alternative Explanations Requirement for Hypotheses
    hypotheses = output_dict.get("hypotheses", [])
    alt_explanations = output_dict.get("alternative_explanations", [])
    if len(hypotheses) > 0 and len(alt_explanations) == 0:
        errors.append("Hypotheses generated without any alternative explanations.")
        return False, errors, "INVALID_OUTPUT"

    return True, [], "SUCCESS"
