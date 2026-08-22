# Wave 7 Report — Cleanup
Removed: legacy rate limiter (+package exports), stray .bak files (page.tsx, sitemap.ts, faq-schemas.ts, self-implementation-kit-offer.ts), .legacy untracked from git (archive inventory retained on disk), dead customer-portal workflows.
Fixed: follow-up selector tz-aware + 30-day aging cap.
Documented as deliberate design choices (NOT_A_FINDING): FastAPI checkout 410 stub (second-writer guard), static HTML provenance retention behind proxy blocker, vitest scope = Storybook tooling.
Contention note: checkout-v2/-impulse page-family removal (TD-4) intentionally deferred while a parallel workstream actively redesigns those marketing surfaces — deleting in-flight work would be destructive.
