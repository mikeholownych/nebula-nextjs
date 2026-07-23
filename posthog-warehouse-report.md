# PostHog Data Warehouse — Source Setup Report

**Date:** 2026-07-23  
**Project:** Nebula (ID: 525183)

## Summary

Three data sources were detected in this project. All three require browser-based setup because credentials were not provided during the CLI session.

## Sources

### PostgreSQL — Browser setup required

Credentials were not supplied. Complete setup in the PostHog app:

**[Open setup URL](https://us.posthog.com/project/525183/data-warehouse/new-source?kind=Postgres&utm_source=wizard&utm_campaign=warehouse-source)**

**Before you start:**
- The database host must be publicly reachable from PostHog's network. `localhost` and private IPs (`10.x`, `172.16–31.x`, `192.168.x`) are rejected.
- If using Supabase, use the Session pooler host (`aws-0-<region>.pooler.supabase.com`), port `6543`, and username `postgres.<project-ref>`.
- PostHog's egress IPs to allowlist: `44.205.89.55`, `52.4.194.122`, `44.208.188.173` (US)

**Fields to enter:**
- Host (public hostname)
- Port (default: 5432)
- Database name
- User
- Password
- Schema (optional, defaults to all schemas)

---

### Stripe — Browser setup required

Credentials were not supplied. Complete setup in the PostHog app:

**[Open setup URL](https://us.posthog.com/project/525183/data-warehouse/new-source?kind=Stripe&utm_source=wizard&utm_campaign=warehouse-source)**

**Before you start:**
- Use a **restricted** API key starting with `rk_live_` — not your secret key (`sk_live_`).
- Create one at Stripe Dashboard > Developers > API Keys > Restricted keys, with:
  - Read on Core, Billing, Connect
  - Write on Webhooks (enables automatic real-time webhook sync)
- After creating the source, enable webhook syncing from the source's Webhook tab for reliable real-time updates (catches updates/deletes that incremental sync misses).

---

### SendGrid — Browser setup required

Credentials were not supplied. Complete setup in the PostHog app:

**[Open setup URL](https://us.posthog.com/project/525183/data-warehouse/new-source?kind=SendGrid&utm_source=wizard&utm_campaign=warehouse-source)**

**Before you start:**
- The `SENDGRID_API_KEY` in your `.env` is likely a send-only key with restricted scopes. The warehouse import needs a separate key with **Read** access to:
  - Suppressions (bounces, blocks, spam reports, unsubscribes)
  - Marketing (lists)
  - Template Engine (templates)
- Create a new restricted key at SendGrid Dashboard > Settings > API Keys.

---

## Files Modified

- `posthog-warehouse-report.md` — created (this file)

No application source files were modified. This skill only configures external data connections.

## Next Steps

1. Open each setup URL above in your browser while logged into PostHog.
2. Enter the credentials described for each source.
3. Select the tables you want to sync and choose sync methods (incremental where available, otherwise full refresh).
4. For Stripe: after source creation, go to the source's **Webhook** tab and click **Create webhook** for real-time sync.
