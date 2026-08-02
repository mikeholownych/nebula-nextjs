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
