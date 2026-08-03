# Nebula Landing Page Intelligence Stack

Six manual workflows for inspecting the rendered evidence on a paid-traffic landing page.

## What this stack does

The stack records what was observed, where it appeared, what it may mean, and what still cannot be proven. It does not promise a conversion outcome.

## Operating rules

1. Run the workflows only against pages you are allowed to inspect.
2. Record the page URL, observation time, stable CSS selector, and raw observation.
3. Keep observation separate from interpretation.
4. Assign confidence from the evidence actually available.
5. Use `not_testable` when a required input is missing. Never manufacture evidence.
6. Do not submit forms, create leads, access private analytics, or infer revenue loss.

## Sequence

Run workflows 1–4 to collect evidence. Use workflow 5 to rank supported defects. After a change, use workflow 6 to compare the same page, viewport, and interaction path.

Records can follow `evidence-record.schema.json`. The live Nebula audit is available at https://nebulacomponents.com/audit.
