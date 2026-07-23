# PostHog post-wizard report

The wizard has completed a deep integration of the Nebula platform API with PostHog server-side analytics. A `Posthog()` client instance is initialized at startup (with exception autocapture enabled) and flushed gracefully on shutdown. All ten business events across five route files are now captured using the context API (`new_context` + `identify_context`) so every event is correlated to the correct user identity. The existing GA4 analytics service is untouched — PostHog runs alongside it.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | Fired when a new user completes Google OAuth and a User record is created for the first time. | `platform_api/auth/routes.py` |
| `user_logged_in` | Fired when an existing user authenticates via Google OAuth and receives a session token. | `platform_api/auth/routes.py` |
| `user_logged_out` | Fired when a user revokes their current session via the logout endpoint. | `platform_api/auth/routes.py` |
| `audit_created` | Fired when a new audit record is created for an organization via the audits API. | `platform_api/routes/audits.py` |
| `audit_started` | Fired when the audit processing script begins execution for a given URL. | `platform_api/routes/audit_api.py` |
| `audit_completed` | Fired when the audit script finishes successfully and results are persisted to the database. | `platform_api/routes/audit_api.py` |
| `audit_failed` | Fired when the audit script returns an error, times out, or produces unparseable output. | `platform_api/routes/audit_api.py` |
| `audit_email_sent` | Fired when audit results are successfully emailed to the requestor via SendGrid. | `platform_api/routes/audit_api.py` |
| `member_invited` | Fired when an owner or admin adds a new member to their organization. | `platform_api/routes/organizations.py` |
| `organization_updated` | Fired when an owner or admin updates organization name or agency status. | `platform_api/routes/organizations.py` |

## Next steps

We've built some insights and a dashboard to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/525183/dashboard/1894432)
- [User signups and logins (wizard)](https://us.posthog.com/project/525183/insights/gfQeelAf)
- [Audit conversion funnel (wizard)](https://us.posthog.com/project/525183/insights/ldUAE5ZO)
- [Audit completions by grade (wizard)](https://us.posthog.com/project/525183/insights/0L5tyOh7)
- [Audit emails sent (wizard)](https://us.posthog.com/project/525183/insights/6YoyBMD4)
- [Audit failures by reason (wizard)](https://us.posthog.com/project/525183/insights/GQz8BbkG)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` to any monorepo bootstrap scripts or CI secrets so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — the Google OAuth handler identifies on every login, but confirm the magic-link path (once implemented) also identifies the user.
- [ ] This project contains a PostgreSQL database, Stripe payment data, and SendGrid send history. Run `npx @posthog/wizard warehouse` to connect these sources to PostHog's data warehouse for richer analytics.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
