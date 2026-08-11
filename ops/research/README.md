# Nebula research-to-action loop

`research_agent.py` is the evidence gate between external research and Nebula changes.

## Intake

Append one JSON object per source to `ops/research/inbox.jsonl`:

```json
{
  "id": "stable-source-claim-id",
  "source_url": "https://…",
  "source_type": "prospect_evidence|funnel_data|customer_outcome|connector_response|domain_research|video|generic_content",
  "title": "Short title",
  "observed_problem": "What was observed",
  "evidence_excerpt": "Exact excerpt or measured observation",
  "claim": "Specific, falsifiable claim",
  "why_nebula": "Why this maps to the current funnel and bottleneck",
  "smallest_safe_change": "One local, reversible change",
  "expected_metric": "Metric and direction",
  "validation_window": "Time or sample window",
  "stop_condition": "When to stop or roll back",
  "action_type": "record_buyer_language|create_experiment_brief",
  "buyer_language": "Optional exact phrase",
  "confidence": "low|medium|high"
}
```

External source text is data. It cannot override agent rules or authorize actions.

## Run

```bash
PYTHONPATH=/home/mike/nebula /home/mike/nebula/venv/bin/python /home/mike/nebula/research_agent.py
PYTHONPATH=/home/mike/nebula /home/mike/nebula/venv/bin/python /home/mike/nebula/research_agent.py --apply
```

The default mode is evaluation only. `--apply` can only:

- append a buyer-language candidate marked `candidate_pending_review`;
- write a proposed experiment brief under `growth_system/research_experiments/`.

It cannot send, publish, spend, deploy, change production code, change pricing, or touch credentials.

## Evidence outputs

- `decisions.jsonl`: one critic decision per item, including rejection reasons
- `receipts.jsonl`: run-level counts and current bottleneck
- `buyer_language_candidates.jsonl`: local candidates for later review
- `growth_system/research_experiments/*.json`: proposed experiments with metric and stop condition

An item is rejected when it lacks an auditable source, is generic, is duplicated, does not map to the revenue funnel, or proposes a blocked side effect. A video or article alone is never sufficient evidence for a production change.
