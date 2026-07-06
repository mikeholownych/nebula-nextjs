# Contributing Guidelines

## Code Review Checklist

When submitting a PR, ensure the diff meets the following criteria:

- [ ] **Guard Clauses** – Use early returns instead of nested `if` blocks.
- [ ] **Error Handling** – Replace generic `raise Exception` with `AppError` from `nebula.errors.app_error`.
- [ ] **Small Commits** – Keep each commit focused on a single logical change (< 200 lines).
- [ ] **Tests** – Add or update unit tests for new behavior; all tests must pass.
- [ ] **Static Analysis** – Run `flake8`/`golint` and address any warnings.
- [ ] **Documentation** – Update docstrings and markdown docs if public API changes.

## Pull Request Process

1. Fork the repository and create a feature branch.
2. Ensure `make lint && make test` passes locally.
3. Open a PR and tag `@reviewer` for review.
4. Address review comments, rebasing if necessary.
5. Merge after approvals.
