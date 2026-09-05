# Content pipeline validation environment

`npm run ci` runs `check:content-pipeline` and must execute the real repository validator. The package script invokes `scripts/run-content-pipeline-validation.mjs`, which calls the repository interpreter at `../.venv/bin/python` directly. It does not depend on `python`, `pytest`, or a modified `PATH`.

The repository environment is declared in the root `pyproject.toml` under the `dev` dependency group. On a clean checkout, create it with:

```sh
uv sync --dev
```

If the interpreter is absent, the package check fails closed with an actionable error. It never falls back to a help-only check.
