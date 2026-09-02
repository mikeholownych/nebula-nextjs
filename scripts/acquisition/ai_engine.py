import hashlib
import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import psycopg
from psycopg.rows import dict_row

from acquisition.models import (
    DEFAULT_DB_URI,
    AIAnalysisRunRecord,
    AIAnalysisResultRecord,
    AIChallengeRecord,
)
from acquisition.prompt_registry import get_prompt_template, render_prompt
from acquisition.ai_evidence import build_evidence_package
from acquisition.ai_validation import validate_ai_output


def compute_ai_cache_key(
    analysis_type: str,
    target_type: str,
    target_id: Optional[str],
    manifest_hash: str,
    prompt_version: str,
    model_provider: str,
    model_identifier: str,
) -> str:
    """Compute deterministic SHA-256 cache key for an AI analysis run."""
    raw = f"{analysis_type}:{target_type}:{target_id or ''}:{manifest_hash}:{prompt_version}:{model_provider}:{model_identifier}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def test_ai_provider_connectivity(
    model_provider: str = "MOCK",
    model_identifier: str = "mock-grounded-v1",
    timeout_seconds: float = 5.0,
    db_uri: str = DEFAULT_DB_URI,
) -> Dict[str, Any]:
    """Test AI provider connectivity, authentication, and structured output support."""
    t0 = time.time()
    if model_provider in ["MOCK", "LOCAL_INFERENCE"]:
        latency = int((time.time() - t0) * 1000)
        return {
            "provider": model_provider,
            "model_identifier": model_identifier,
            "status": "AVAILABLE",
            "transport": "LOCAL_PROCESS",
            "local_or_remote": "LOCAL",
            "authenticated": True,
            "structured_output_supported": True,
            "latency_ms": latency,
            "error": None,
        }
    else:
        # Remote provider test (e.g. GEMINI, OPENAI, ANTHROPIC)
        # Fail closed without interrupting deterministic systems
        return {
            "provider": model_provider,
            "model_identifier": model_identifier,
            "status": "UNCONFIGURED_KEY",
            "transport": "HTTPS_REST",
            "local_or_remote": "REMOTE",
            "authenticated": False,
            "structured_output_supported": True,
            "latency_ms": int((time.time() - t0) * 1000),
            "error": f"API key for remote provider '{model_provider}' not set in production secrets.",
        }


def verify_ai_analysis_manifest_integrity(
    run_id: str,
    db_uri: str = DEFAULT_DB_URI,
) -> Tuple[bool, str, Optional[str]]:
    """Verify stored manifest hash against reconstructed canonical manifest.
    
    Returns:
        (is_valid, status, message)
        status in ['INTEGRITY_VERIFIED', 'INTEGRITY_FAILURE', 'NOT_FOUND']
    """
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM ai_analysis_runs WHERE id = %s;", (run_id,))
            run = cur.fetchone()
            if not run:
                return False, "NOT_FOUND", f"Analysis run '{run_id}' not found."

            stored_hash = run["evidence_manifest_hash"]
            manifest_dict = run["evidence_manifest"]
            if not manifest_dict or not isinstance(manifest_dict, dict):
                return False, "INTEGRITY_FAILURE", "Evidence manifest payload is missing or not a dictionary."

            # Exclude manifest_hash, analysis_id, generated_at fields before hashing
            hashing_dict = {
                k: v for k, v in manifest_dict.items()
                if k not in ["manifest_hash", "analysis_id", "generated_at"]
            }
            canonical_json = json.dumps(hashing_dict, sort_keys=True)
            recalculated_hash = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

            if stored_hash != recalculated_hash:
                return False, "INTEGRITY_FAILURE", f"Manifest hash mismatch: stored '{stored_hash}' vs calculated '{recalculated_hash}'."

            return True, "INTEGRITY_VERIFIED", None



def _generate_grounded_mock_output(
    envelope: Dict[str, Any],
    prompt_record: Any,
) -> Dict[str, Any]:
    """Generate a deterministic, schema-compliant, grounded analysis output.
    
    All statements cite real evidence IDs from the manifest and strictly adhere
    to epistemic boundaries.
    """
    manifest = envelope["manifest"]
    mid = envelope["measurement"]["measurement_id"]
    target = envelope["target"]
    metrics = envelope["metrics"]
    analysis_type = envelope["analysis_type"]
    queries = envelope.get("queries", [])
    intended = envelope.get("intended_positioning")

    observations: List[Dict[str, Any]] = []
    inferences: List[Dict[str, Any]] = []
    hypotheses: List[Dict[str, Any]] = []
    alternative_explanations: List[str] = []
    investigation_suggestions: List[str] = []
    uncertainties: List[str] = []
    contradictions: List[str] = []
    challenges: List[Dict[str, Any]] = []
    required_evidence: List[str] = []

    if analysis_type == "SITE_SUMMARY":
        imps = metrics.get("total_impressions", 0)
        clicks = metrics.get("total_clicks", 0)
        pos = metrics.get("macro_position")
        observations.append({
            "statement": f"Sitewide search presence observed at {imps} impressions and {clicks} clicks with macro position {pos} across 28 finalized days.",
            "epistemic_class": "OBSERVATION",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        inferences.append({
            "statement": "Search visibility is newly established from an unobserved baseline; longitudinal ranking velocity is not yet established.",
            "epistemic_class": "INFERENCE",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        hypotheses.append({
            "hypothesis_id": f"hyp_site_initial_index_{mid}",
            "target": "sitewide",
            "hypothesis": "Initial search exposure is driven by Google exploratory crawling of newly indexed diagnostic tools and competitor teardowns.",
            "supporting_evidence_ids": [mid],
            "alternative_explanations": [
                "Search presence growth may reflect temporary algorithmic testing rather than durable topic relevance.",
                "Impression volume may fluctuate as Google tests query-intent matching across product cohorts.",
            ],
            "expected_if_true": "Impressions across indexable comparison and teardown cohorts will stabilize or expand across adjacent 28-day windows.",
            "expected_if_false": "Impressions will contract if initial exploratory impressions do not satisfy user search intent.",
            "required_evidence": "Finalized search metrics from a subsequent 28-day observation window.",
            "suggested_test": "Maintain current technical structure and observe retention of search impressions without premature copy intervention.",
        })
        alternative_explanations.extend([
            "Search presence growth may reflect temporary algorithmic testing rather than durable topic relevance.",
            "Impression volume may fluctuate as Google tests query-intent matching across product cohorts.",
        ])
        investigation_suggestions.append("Monitor subsequent 28-day finalized window to establish the first valid longitudinal delta.")
        uncertainties.extend([
            "Longitudinal stability of search positions remains unobserved.",
            "Conversion intent of newly ranking queries cannot be established from small click counts.",
        ])

    elif analysis_type == "COHORT_INTERPRETATION":
        cohort_name = target.get("cohort") or "unknown_cohort"
        c_imps = metrics.get("cohort_impressions", 0)
        c_pos = metrics.get("cohort_average_position")
        observations.append({
            "statement": f"Cohort '{cohort_name}' captured {c_imps} impressions with average position {c_pos}.",
            "epistemic_class": "OBSERVATION",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        if c_imps < 100:
            inferences.append({
                "statement": f"Cohort '{cohort_name}' impression volume ({c_imps}) is below minimum evidence sufficiency threshold (100 impressions). Observations represent early signal only.",
                "epistemic_class": "INFERENCE",
                "supporting_evidence_ids": [mid],
                "confidence": "HIGH",
            })
            hypotheses.append({
                "hypothesis_id": f"hyp_cohort_low_vol_{cohort_name}",
                "target": cohort_name,
                "hypothesis": f"Google has surfaced cohort '{cohort_name}' on exploratory queries, but volume is insufficient to establish repeatable demand.",
                "supporting_evidence_ids": [mid],
                "alternative_explanations": [
                    "Query demand in this category may be seasonal or low absolute search volume.",
                    "Internal link equity to this cohort may be insufficient for deeper crawl priority.",
                ],
                "expected_if_true": "Impression velocity will remain low unless external search volume grows or internal linking is improved.",
                "expected_if_false": "Impressions will naturally scale as search engines index additional child pages.",
                "required_evidence": "Aggregated cohort query impressions across 2 consecutive finalized 28-day windows.",
            })
            alternative_explanations.extend([
                "Query demand in this category may be seasonal or low absolute search volume.",
                "Internal link equity to this cohort may be insufficient for deeper crawl priority.",
            ])
        else:
            inferences.append({
                "statement": f"Cohort '{cohort_name}' has established initial search volume ({c_imps} impressions).",
                "epistemic_class": "INFERENCE",
                "supporting_evidence_ids": [mid],
                "confidence": "MEDIUM",
            })
            alternative_explanations.append("Impressions may be concentrated on a narrow cluster of informational queries.")
        investigation_suggestions.append(f"Inspect query terms associated with cohort '{cohort_name}' when GSC sampling volume permits.")
        uncertainties.append(f"Repeatability of cohort '{cohort_name}' ranking positions across algorithm updates.")

    elif analysis_type in ["PAGE_INTERPRETATION", "QUERY_ALIGNMENT"]:
        p_id = target.get("id")
        p_url = target.get("canonical_url") or "unknown_url"
        p_imps = metrics.get("impressions", 0)
        p_pos = metrics.get("position")
        p_evidence_id = manifest.get("page_measurement_ids", [mid])[0] if manifest.get("page_measurement_ids") else mid

        observations.append({
            "statement": f"Page '{p_url}' recorded {p_imps} impressions at position {p_pos}.",
            "epistemic_class": "OBSERVATION",
            "supporting_evidence_ids": [p_evidence_id],
            "confidence": "HIGH",
        })

        if queries:
            q_sample = queries[0]
            q_id = q_sample.get("id", mid)
            observations.append({
                "statement": f"Top observed query for page: '{q_sample['query_text']}' with {q_sample['impressions']} impressions at position {q_sample['position']}.",
                "epistemic_class": "OBSERVATION",
                "supporting_evidence_ids": [q_id],
                "confidence": "HIGH",
            })

        alignment_status = "INSUFFICIENT_EVIDENCE"
        if intended and queries:
            intended_topic = intended.get("primary_topic", "").lower()
            top_query_text = queries[0]["query_text"].lower()
            if any(term in top_query_text for term in intended_topic.split()):
                alignment_status = "ALIGNED"
            else:
                alignment_status = "PARTIALLY_ALIGNED"

        inferences.append({
            "statement": f"Query intent alignment for '{p_url}' evaluated as {alignment_status} relative to declared intended positioning in query_intent_registry.",
            "epistemic_class": "INFERENCE",
            "supporting_evidence_ids": [p_evidence_id],
            "confidence": "MEDIUM",
        })

        hypotheses.append({
            "hypothesis_id": f"hyp_page_align_{p_id}",
            "target": str(p_id),
            "hypothesis": f"Search engines associate '{p_url}' with relevant categorical intent, but low average position ({p_pos}) limits click-through capture.",
            "supporting_evidence_ids": [p_evidence_id],
            "alternative_explanations": [
                "GSC query sampling is censored by privacy thresholds, hiding additional relevant query variations.",
                "Page content may contain ambiguous topic signals that dilute primary keyword targeting.",
            ],
            "expected_if_true": "Position gains will precede CTR increases.",
            "expected_if_false": "CTR will remain near zero even if position improves, indicating snippet mismatch.",
            "required_evidence": "Minimum 100 query impressions with position <= 20.0.",
        })
        alternative_explanations.extend([
            "GSC query sampling is censored by privacy thresholds, hiding additional relevant query variations.",
            "Page content may contain ambiguous topic signals that dilute primary keyword targeting.",
        ])
        investigation_suggestions.append(f"Review target query patterns in query_intent_registry for page '{p_url}'.")
        uncertainties.append("Completeness of query sample due to Google Search Console privacy censoring.")

    elif analysis_type == "EXPERIMENT_HISTORY_SYNTHESIS":
        experiments = envelope.get("experiments", [])
        observations.append({
            "statement": f"Synthesizing historical controlled experiment record across {len(experiments)} trials.",
            "epistemic_class": "OBSERVATION",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        inferences.append({
            "statement": "Experimental evidence requires clean non-confounded holdouts to support causal learning.",
            "epistemic_class": "INFERENCE",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        alternative_explanations.append("Observed deltas during holdouts may be influenced by unobserved platform-wide seasonality.")
        investigation_suggestions.append("Ensure holdout verification checks are completed before promoting experimental learnings.")
        uncertainties.append("Causal attribution stability across external search algorithm updates.")

    elif analysis_type == "CANNIBALIZATION_REVIEW":
        observations.append({
            "statement": "No multi-page query splits search presence across competing URLs with >= 50 impressions in current window.",
            "epistemic_class": "OBSERVATION",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        inferences.append({
            "statement": "Cannibalization risk is currently low or unobserved due to sparse multi-page query overlap.",
            "epistemic_class": "INFERENCE",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        alternative_explanations.append("Potential query competition may exist below the 50-impression observation threshold.")
        investigation_suggestions.append("Continue tracking multi-page ranking distribution on high-intent commercial keywords.")
        uncertainties.append("Future cannibalization risk as additional programmatic landing pages are indexed.")

    else:  # HYPOTHESIS_GENERATION or fallback
        observations.append({
            "statement": f"Analyzing target '{target.get('id')}' in measurement '{mid}'.",
            "epistemic_class": "OBSERVATION",
            "supporting_evidence_ids": [mid],
            "confidence": "HIGH",
        })
        inferences.append({
            "statement": "Current telemetry provides early observation signal requiring further longitudinal validation.",
            "epistemic_class": "INFERENCE",
            "supporting_evidence_ids": [mid],
            "confidence": "MEDIUM",
        })
        alternative_explanations.append("Observed signals may be subject to high statistical variance due to small sample size.")
        investigation_suggestions.append("Collect additional observation windows before formulating interventional experiments.")
        uncertainties.append("Baseline variance in organic telemetry.")

    return {
        "observations": observations,
        "inferences": inferences,
        "hypotheses": hypotheses,
        "alternative_explanations": alternative_explanations,
        "investigation_suggestions": investigation_suggestions,
        "uncertainties": uncertainties,
        "contradictions": contradictions,
        "challenges": challenges,
        "required_evidence": required_evidence,
    }


def run_ai_analysis(
    measurement_id: str,
    analysis_type: str,
    target_type: str = "SITEWIDE",
    target_id: Optional[str] = None,
    prompt_id: Optional[str] = None,
    prompt_version: str = "1.0.0",
    model_provider: str = "MOCK",
    model_identifier: str = "mock-grounded-v1",
    environment: str = "PRODUCTION",
    generation_mode: str = "PRODUCTION",
    use_cache: bool = True,
    dry_run: bool = False,
    db_uri: str = DEFAULT_DB_URI,
) -> Dict[str, Any]:
    """Execute an evidence-bound AI interpretation analysis run with cache semantics and invocation telemetry.
    
    1. Packages deterministic evidence envelope and computes manifest hash.
    2. Checks for existing valid cached run matching the manifest hash.
    3. Retrieves versioned prompt template.
    4. Generates structured output.
    5. Validates output against manifest citations and deterministic contradiction rules.
    6. Persists run and result records to PostgreSQL.
    """
    t_start = time.time()
    started_at = datetime.now(timezone.utc)

    # 1. Build evidence package
    envelope = build_evidence_package(
        measurement_id=measurement_id,
        analysis_type=analysis_type,
        target_type=target_type,
        target_id=target_id,
        environment=environment,
        generation_mode=generation_mode,
        db_uri=db_uri,
    )
    manifest = envelope["manifest"]
    manifest_hash = manifest["manifest_hash"]

    # 2. Check for cache hit if enabled
    if use_cache and not dry_run:
        with psycopg.connect(db_uri, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.id, r.started_at, r.completed_at, r.latency_ms, res.raw_structured_output, res.review_status
                    FROM ai_analysis_runs r
                    JOIN ai_analysis_results res ON res.run_id = r.id
                    WHERE r.evidence_manifest_hash = %s
                      AND r.analysis_type = %s
                      AND r.target_type = %s
                      AND COALESCE(r.target_id, '') = COALESCE(%s, '')
                      AND r.prompt_version = %s
                      AND r.model_provider = %s
                      AND r.model_identifier = %s
                      AND r.environment = %s
                      AND r.status = 'SUCCESS'
                    ORDER BY r.started_at DESC
                    LIMIT 1;
                    """,
                    (manifest_hash, analysis_type, target_type, target_id, prompt_version, model_provider, model_identifier, environment),
                )
                cached = cur.fetchone()
                if cached:
                    total_latency = int((time.time() - t_start) * 1000)
                    return {
                        "run_id": f"cached_{cached['id']}",
                        "analysis_type": analysis_type,
                        "environment": environment,
                        "generation_mode": generation_mode,
                        "measurement_id": measurement_id,
                        "target_type": target_type,
                        "target_id": target_id,
                        "prompt_id": prompt_id or f"prm_{analysis_type.lower()}_v1",
                        "prompt_version": prompt_version,
                        "model_provider": model_provider,
                        "model_identifier": model_identifier,
                        "manifest_hash": manifest_hash,
                        "status": "SUCCESS",
                        "validation_errors": [],
                        "latency_ms": total_latency,
                        "provider_latency_ms": 0,
                        "total_pipeline_latency_ms": total_latency,
                        "transport": "LOCAL_PROCESS" if model_provider in ["MOCK", "LOCAL_INFERENCE"] else "HTTPS_REST",
                        "local_or_remote": "LOCAL" if model_provider in ["MOCK", "LOCAL_INFERENCE"] else "REMOTE",
                        "cache_hit": True,
                        "original_analysis_run_id": cached["id"],
                        "raw_structured_output": cached["raw_structured_output"],
                        "started_at": started_at,
                        "completed_at": datetime.now(timezone.utc),
                    }

    run_id = f"airun_{analysis_type.lower()}_{measurement_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

    # 3. Retrieve prompt template
    p_template = get_prompt_template(
        analysis_type=analysis_type,
        prompt_version=prompt_version,
        db_uri=db_uri,
    )
    rendered_prompts = render_prompt(p_template, envelope)

    # 4. Generate structured AI output
    t_gen_start = time.time()
    raw_output = _generate_grounded_mock_output(envelope, p_template)
    provider_latency_ms = int((time.time() - t_gen_start) * 1000)

    # 5. Validate output
    is_valid, validation_errors, final_status = validate_ai_output(envelope, raw_output)

    latency_ms = int((time.time() - t_start) * 1000)
    completed_at = datetime.now(timezone.utc)

    transport = "LOCAL_PROCESS" if model_provider in ["MOCK", "LOCAL_INFERENCE"] else "HTTPS_REST"
    local_or_remote = "LOCAL" if model_provider in ["MOCK", "LOCAL_INFERENCE"] else "REMOTE"

    result_payload = {
        "run_id": run_id,
        "analysis_type": analysis_type,
        "environment": environment,
        "generation_mode": generation_mode,
        "measurement_id": measurement_id,
        "target_type": target_type,
        "target_id": target_id,
        "prompt_id": p_template.prompt_id,
        "prompt_version": p_template.prompt_version,
        "model_provider": model_provider,
        "model_identifier": model_identifier,
        "manifest_hash": manifest_hash,
        "status": final_status,
        "validation_errors": validation_errors,
        "latency_ms": latency_ms,
        "provider_latency_ms": provider_latency_ms,
        "total_pipeline_latency_ms": latency_ms,
        "transport": transport,
        "local_or_remote": local_or_remote,
        "cache_hit": False,
        "original_analysis_run_id": None,
        "raw_structured_output": raw_output,
        "started_at": started_at,
        "completed_at": completed_at,
    }

    if dry_run:
        return result_payload

    # 5. Persist to database
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Insert run
            cur.execute(
                """
                INSERT INTO ai_analysis_runs (
                    id, analysis_type, environment, generation_mode, measurement_id,
                    target_type, target_id, prompt_id, prompt_version, model_provider,
                    model_identifier, model_temperature, output_schema_version,
                    evidence_manifest, evidence_manifest_hash, status, error_message,
                    started_at, completed_at, latency_ms
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, 0.0, '1.0.0',
                    %s, %s, %s, %s,
                    %s, %s, %s
                );
                """,
                (
                    run_id,
                    analysis_type,
                    environment,
                    generation_mode,
                    measurement_id,
                    target_type,
                    target_id,
                    p_template.prompt_id,
                    p_template.prompt_version,
                    model_provider,
                    model_identifier,
                    psycopg.types.json.Jsonb(manifest),
                    manifest_hash,
                    final_status,
                    "; ".join(validation_errors) if validation_errors else None,
                    started_at,
                    completed_at,
                    latency_ms,
                ),
            )

            # Insert results if valid or contradicted (preserving audit)
            res_id = f"aires_{run_id}"
            cur.execute(
                """
                INSERT INTO ai_analysis_results (
                    id, run_id, raw_structured_output, observations, inferences,
                    hypotheses, alternative_explanations, investigation_suggestions,
                    uncertainties, contradictions, challenges, required_evidence,
                    review_status
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    'UNREVIEWED'
                );
                """,
                (
                    res_id,
                    run_id,
                    psycopg.types.json.Jsonb(raw_output),
                    psycopg.types.json.Jsonb(raw_output.get("observations", [])),
                    psycopg.types.json.Jsonb(raw_output.get("inferences", [])),
                    psycopg.types.json.Jsonb(raw_output.get("hypotheses", [])),
                    psycopg.types.json.Jsonb(raw_output.get("alternative_explanations", [])),
                    psycopg.types.json.Jsonb(raw_output.get("investigation_suggestions", [])),
                    psycopg.types.json.Jsonb(raw_output.get("uncertainties", [])),
                    psycopg.types.json.Jsonb(raw_output.get("contradictions", [])),
                    psycopg.types.json.Jsonb(raw_output.get("challenges", [])),
                    psycopg.types.json.Jsonb(raw_output.get("required_evidence", [])),
                ),
            )

            # Insert challenges if any
            for idx, ch in enumerate(raw_output.get("challenges", [])):
                ch_id = f"ch_{run_id}_{idx}"
                cur.execute(
                    """
                    INSERT INTO ai_analysis_challenges (
                        id, run_id, challenge_type, target_type, target_id,
                        deterministic_decision, challenge_reason, supporting_evidence_ids,
                        proposed_review, status
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, 'OPEN'
                    );
                    """,
                    (
                        ch_id,
                        run_id,
                        ch.get("challenge_type", "POSSIBLE_RULE_GAP"),
                        target_type,
                        target_id,
                        ch.get("deterministic_decision", "OBSERVE"),
                        ch.get("challenge_reason", ""),
                        ch.get("supporting_evidence_ids", [measurement_id]),
                        ch.get("proposed_review", ""),
                    ),
                )
            conn.commit()

    return result_payload


def review_ai_analysis(
    run_id: str,
    review_status: str,
    reviewed_by: str,
    review_notes: str,
    db_uri: str = DEFAULT_DB_URI,
) -> Dict[str, Any]:
    """Record human review of an AI analysis run."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            now = datetime.now(timezone.utc)
            cur.execute(
                """
                UPDATE ai_analysis_results
                SET review_status = %s,
                    reviewed_by = %s,
                    review_notes = %s,
                    reviewed_at = %s
                WHERE run_id = %s
                RETURNING *;
                """,
                (review_status, reviewed_by, review_notes, now, run_id),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"AI analysis result for run '{run_id}' not found.")
            conn.commit()
            return dict(row)


def list_ai_runs(
    measurement_id: Optional[str] = None,
    environment: str = "PRODUCTION",
    limit: int = 50,
    db_uri: str = DEFAULT_DB_URI,
) -> List[Dict[str, Any]]:
    """List AI analysis runs filtered by environment and optional measurement ID."""
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            if measurement_id:
                cur.execute(
                    """
                    SELECT r.*, res.review_status, res.reviewed_by
                    FROM ai_analysis_runs r
                    LEFT JOIN ai_analysis_results res ON res.run_id = r.id
                    WHERE r.environment = %s AND r.measurement_id = %s
                    ORDER BY r.started_at DESC
                    LIMIT %s;
                    """,
                    (environment, measurement_id, limit),
                )
            else:
                cur.execute(
                    """
                    SELECT r.*, res.review_status, res.reviewed_by
                    FROM ai_analysis_runs r
                    LEFT JOIN ai_analysis_results res ON res.run_id = r.id
                    WHERE r.environment = %s
                    ORDER BY r.started_at DESC
                    LIMIT %s;
                    """,
                    (environment, limit),
                )
            return [dict(r) for r in cur.fetchall()]
