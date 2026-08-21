# Production Technical Debt Register

**Policy**: Zero-Tolerance / Zero Unmanaged Technical Debt.

---

## Technical Debt Items & Disposition

| ID | Category | Description | Discovered In | Status / Disposition |
| :--- | :--- | :--- | :--- | :--- |
| **DEBT-001** | Performance / Tests | Unbounded recursive directory traversal in Python tests | `tests/test_offer_integrity.py` | **RESOLVED / FIXED** |
| **DEBT-002** | Time-Decay Bugs | Hardcoded static dates in freshness assertion logic | `tests/test_newsletter_autopilot.py` | **RESOLVED / FIXED** |
| **DEBT-003** | Architecture Drift | Stale subprocess mocks for decoupled background worker | `tests/test_audit_funnel_correlation.py` | **RESOLVED / FIXED** |
| **DEBT-004** | Syntax / Standards | Non-standard trailing comments in prototype tsconfig | `prototypes/questly-landing/tsconfig.json` | **RESOLVED / FIXED** |
| **DEBT-005** | Linting Configuration | Broad ESLint flat config ingestion of backup/doc folders | `customer-portal/eslint.config.mjs` | **RESOLVED / FIXED** |
| **DEBT-006** | Outdated Payment Link | Retired `STRIPE_97_LINK` reference in email templates | `deliver_audit.py` | **RESOLVED / FIXED** |
| **DEBT-007** | Dependency Currency | Outdated packages in Node (`package.json`) and Python (`pyproject.toml`) | `customer-portal/package.json` | **RESOLVED / MODERNIZED** |
| **DEBT-008** | Codebase Markers | Legacy TODO/FIXME markers in platform API | `platform_api/middleware/rate_limit.py`, `models.py` | **RESOLVED / CLEANED** |
| **DEBT-009** | SDK API Version | Stripe API Version string mismatch with SDK 22.5.0 | `customer-portal/app/api/billing/summary/route.ts` | **RESOLVED / FIXED** |
| **DEBT-010** | Python Syntax | Invalid regex escape sequence in docstring | `scripts/book_to_skill.py` | **RESOLVED / FIXED** |

---

## Final Technical Debt Count
- **Open Items**: 0
- **Deferred Items**: 0
- **Remediated Items**: 10
