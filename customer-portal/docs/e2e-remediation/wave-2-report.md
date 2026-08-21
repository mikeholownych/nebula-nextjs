# Wave 2 Report — Resilience & Resource Bounds

Deployed: commits `d2a5b64b` (batch A), chunked-body correction, RES-3/RES-5 batch. pytest 107 green; rehearsal-gated deploys passed.

| Finding | Fix | Validation |
| --- | --- | --- |
| RES-1 | 15s timeout on Stripe checkout creation; 10s on webhook GA4 forward | typecheck + suites |
| SEC-P2-2 | Body-size middleware enforces actual received bytes (buffer+replay); chunked no-Clen bodies capped | test_body_size_chunked.py ×2 (2MB no-Clen → 413; normal flow intact) |
| RES-2 | Outbox dedup: open messages always suppress; `sent` suppresses within 7-day window only (permanent-suppression defect fixed). SendGrid mail/send has no provider idempotency key → documented at-least-once contract with bounded-window dedup as the compensating control | code + suite green |
| RES-4 | `/audit/run` waiter polls back off 0.25s→2.0s (≈5x pressure cut at depth) | suite green |
| RES-5 | Result email moved to outbox channel `audit_result` w/ retry/backoff + email_sent_at marking | suite green |
| RES-6 | Startup refuses production boot when required settings missing | live deploy booted clean under ENVIRONMENT=production |
| INF-2 (code) | TTLs on circuit-breaker state/failures/opened_at + maintenance flag (6h) | suite green |
| INF-2 (infra) | Redis maxmemory=256mb applied runtime + persisted (was 0 runtime despite conf) | CONFIG GET verified |
| INF-3 | nebula-nextjs: MemoryMax=6G, ReadWritePaths narrowed to portal tree | systemctl show verified; restart healthy |

Connection budget note (documented): SQLAlchemy 30 max + audit_db 10 + CRM 5 + analytics 5 + AB 3 + alerts 3 + lead_scoring 3 (now shared) + newsletter 2 (now shared) ≈ **61 worst case** vs `max_connections=100`, leaving headroom for docker/honcho clients and operator sessions.
