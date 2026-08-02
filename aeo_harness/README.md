# Nebula AEO Retrieval QA Harness

Independent implementation inspired by the public self-improving AEO methodology. No source code is copied from that repository.

## Commands

```bash
venv/bin/python3 aeo_harness/aeo_eval.py snapshot
venv/bin/python3 aeo_harness/aeo_eval.py score --source original
venv/bin/python3 aeo_harness/aeo_eval.py candidate
venv/bin/python3 aeo_harness/aeo_eval.py compare
```

## Design

- `corpus/dev/` is the working set.
- `corpus/holdout/` is frozen and evaluated but never used to author candidate rules.
- Each snapshot records its source URL and SHA-256 hash.
- Retrieval uses bounded 120-word chunks.
- Questions have explicit answer variants.
- Candidate output is separate from canonical production content.
- A candidate is not deployable without factual diff, rendered QA, and human approval.

The first evaluator is deterministic and model-free. It measures whether the retrieved fragment contains an explicit answer. This gives Nebula a cheap regression gate before adding model-based semantic judging.

## Semantic claims and engine captures

`reference_claims.json` defines atomic claims with importance levels. Run the offline semantic rubric against captured answer JSONL:

```bash
venv/bin/python3 aeo_harness/semantic_judge.py score --answers /path/to/answers.jsonl
```

For an OpenAI-compatible judge, set `AEO_JUDGE_URL`, `AEO_JUDGE_API_KEY`, and `AEO_JUDGE_MODEL`, then add `--mode model`. Credentials are read only from the environment and never written to reports.

Real AI-engine capture rows must follow `citation_schema.json`. Measure them with:

```bash
venv/bin/python3 aeo_harness/citation_metrics.py --captures /path/to/captures.jsonl
```

An empty capture file returns `status: no_data`; it is never mislabeled as zero visibility.

The broader prompt behavior contract is documented in `../docs/prompt-evaluation-playbook.md` and machine-readable at `prompt-evaluation-contract.json`. It covers factuality, citation correctness, adversarial inputs, structured tool use, claim-level grading, and accept/revert gates.
