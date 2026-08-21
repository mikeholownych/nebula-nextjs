# Dependency Modernization & Currency Audit

**Policy**: All direct application, runtime, test, and tooling dependencies brought to latest stable releases. Breaking changes refactored directly to contract without pinning or shimming.

---

## Node.js Dependencies (`customer-portal/package.json`)

| Package Name | Previous Version | Upgraded Stable Version | Notes & Breaking Change Handling |
| :--- | :--- | :--- | :--- |
| `next` | 16.2.11 | **16.3.1** | Upgraded with Turbopack production compiler |
| `eslint-config-next` | 16.2.11 | **16.3.1** | Synced with Next.js 16.3.1 |
| `react` | 19.2.7 | **19.2.8** | Latest stable React 19 release |
| `react-dom` | 19.2.7 | **19.2.8** | Latest stable React 19 release |
| `stripe` | 22.3.2 | **22.5.0** | Updated apiVersion contract to `'2026-07-29.dahlia'` |
| `posthog-js` | 1.407.1 | **1.418.6** | Updated client analytics SDK |
| `posthog-node` | 5.46.0 | **5.49.2** | Updated server analytics SDK |
| `@posthog/nextjs-config` | 1.9.68 | **1.9.70** | Updated Next.js PostHog integration wrapper |
| `@playwright/test` | 1.61.1 | **1.62.1** | Updated browser automation framework |
| `@x402/core` | 2.19.0 | **2.23.0** | Updated micropayment / protocol core |
| `@x402/evm` | 2.19.0 | **2.23.0** | Updated EVM settlement module |
| `@x402/extensions` | 2.19.0 | **2.23.0** | Updated x402 extension suite |
| `@x402/next` | 2.19.0 | **2.23.0** | Updated Next.js x402 routing middleware |
| `mppx` | 0.8.15 | **0.8.18** | Updated micropayment exchange provider |
| `viem` | 2.55.2 | **2.55.19** | Updated Ethereum client library |
| `fast-xml-parser` | 5.10.1 | **5.11.0** | Updated XML parser for sitemap validation |
| `framer-motion` | 13.1.0 | **13.1.1** | Updated animation library |
| `lucide-react` | 1.32.0 | **1.33.0** | Updated UI icon pack |
| `pg` | 8.22.0 | **8.23.0** | Updated PostgreSQL driver |
| `storybook` suite | 10.5.6 | **10.5.10** | Updated Storybook core, docs, a11y, vitest, and themes |
| `vite` | 8.2.0 | **8.2.2** | Updated test tooling bundler |
| `vitest` | 4.1.10 | **4.1.11** | Updated unit testing framework |

---

## Python Dependencies (`pyproject.toml`)

- **FastAPI / Uvicorn Core**: `fastapi>=0.104.0`, `uvicorn[standard]>=0.24.0`, `starlette>=1.4.1`
- **Database & Async Core**: `sqlalchemy>=2.0.0`, `asyncpg>=0.29.0`, `psycopg>=3.2.0`, `redis>=5.0.0`
- **Analytics & Outbound**: `posthog>=3.0.0`, `stripe>=10.0.0`, `agentmail>=0.5.0`
- **Test Automation**: `pytest>=8.0.0`, `pytest-asyncio>=0.24.0`, `playwright>=1.40.0`
