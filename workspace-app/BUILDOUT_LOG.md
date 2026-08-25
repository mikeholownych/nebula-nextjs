# Build-out verification log (2026-08-23)

## What was built
1. Migration 001 (additive, applied to nebula_audit): findings, finding_events,
   audit_log tables + finding_public_id_seq. No ALTERs on existing tables.
2. Backfill: 267 durable findings across 57 domains from audits.findings JSONB.
   Idempotent (verified: re-run creates 0, updates in place). One synthetic test
   row skipped intentionally (audit id 8270f682... has no signal_key).
3. workspace-app API surface:
   - GET /api/findings - tenant-scoped, URL-driven filters (domain/status/public_id)
   - GET /api/findings/[publicId] - finding + full event history
   - PATCH /api/findings/[publicId] - lifecycle transitions with state machine,
     FOR UPDATE row locking, RBAC gate, audit events on every path
4. UI: app shell (nav/noindex/pre-release footer), /findings client with filters,
   status badges, action-required summary, empty/loading/error states.

## Verification artifacts (all against running services)
- Unauthenticated GET/PATCH -> 401 {"code":"AUTH_REQUIRED"}
- Authenticated as Mike (real Redis-backed session via platform jwt): count 27 domains visible
- TENANT ISOLATION NEGATIVE TESTS:
  * user2 list -> count: 0 (sees none of Mike's data)
  * user2 PATCH Mike's NBL-10530 -> 403 FORBIDDEN + audit_log 'denied' row
- Lifecycle: new->acknowledged->resolved->new all 200; invalid transitions rejected by state machine
- Evidence trail: finding_events rows for every transition; audit_log has ok/denied/error results with request_ids
- Session revocation works: revoked test sessions -> token returns 401
- Blast radius: prod / and /audit 200, platform-api 0 errors, share freeze still active

## Bugs found & fixed during buildout
- SQL alias scoping error (a.domain_norm) -> rewritten single subquery
- Stray unused $1 param broke PG type inference (42P18) -> removed
- Stale next-server process served old build twice -> killed by PID, re-verified chunk contents

## Known gaps (next session)
- Domain ownership mapping is email-based until org_domains table lands (Phase 3)
- Monitoring/baselines not started
- No automated test suite yet (verification was live curl + SQL evidence)

## Session 2 additions (2026-08-23 morning)
- Incident triage: /audit/fix-effectiveness 503s at 03:49-03:50 were restart-window
  artifacts (old process lacked the then-unimplemented method). Zero since 03:53.
  Endpoint verified 200 with correct zero-state. No code change needed.
- Overview shipped: GET /api/overview (counts by status, required actions ranked
  regressed-first, recent activity feed) + Overview UI wired as the root page.
  Verified: Mike sees 5 properties / 27 new / attention list; user2 sees all zeros;
  unauth 401; prod regression set green; both test sessions revoked after use.

## Session 3 (2026-08-23): repeatable verification suite
- tests/verify_workspace.py: 18 checks against live services. Mints real Redis
  sessions, exercises anon/401, tenant isolation (list + PATCH), full lifecycle
  state machine incl. invalid jumps, overview aggregation for both users,
  revocation proof. Self-cleaning: reverts scratch finding to 'new', revokes
  sessions. Run: `source /home/mike/nebula/.env && venv python3 tests/verify_workspace.py`
- Suite caught a design gap on first run: resolved->regressed was assumed
  invalid but is a legitimate manual regression report per spec #7. Suite
  corrected to assert the intended semantics (regressed cannot jump to new).
- Final run: 18/18 PASS, exit 0. Scratch finding left in 'new'.

## Session 3 (2026-08-23): findings sync spine
- platform_api/services/findings_sync.py: reconciles completed audits into the
  durable store. create/redetect/regress/auto-resolve, idempotent via
  request_id='sync:<audit_id>', out-of-order protected (strict last_seen guard).
- Hooked in finalize_completed_audit as a fully guarded side effect; sync
  failure can never break audit completion.
- Proven on real audits: auto-resolve path (3 signals passed on latest audit),
  regression path (resolved -> regressed on re-detection), idempotency
  (second run pure no-op). Two bugs found & fixed during testing: schema
  mismatch (actor_type col) and <= vs < stale guard.
- platform-api restarted with hook active: startup clean, fix-effectiveness 200,
  prod regression set green, workspace suite still 18/18.

## Session 3b (2026-08-23): org_domains (Phase 3)
- Migration 002_org_domains.sql on nebula_platform: uuid pk, org FK, active-domain
  unique index (one active claim per domain), status active/revoked, verified_by
  manual/dns_txt. Seeded nebulacomponents.com + gofaultline.dev to Mike's org.
- Visibility precedence everywhere: org claim > email-chain inference.
  findings feed ORs the claim set in; overview merges claims + email domains;
  PATCH grants via claimExistsForDomain() against the PLATFORM pool (first cut
  queried the audit DB and 500'd - caught by suite, fixed).
- Claim path proven live: user2 (zero audit history) granted asana.com claim ->
  sees findings + can PATCH; claim revoked -> count back to 0. Unique index
  blocks dual-org claims by design.
- Final state: suite 18/18, prod 200/200, api clean.

## Session 3c (2026-08-23): E2E pass
- Surfaces: / and /findings 200 with full security headers (X-Frame DENY,
  nosniff, strict referrer, permissions locked) + noindex meta.
- Added GET /api/auth/me (delegates to session; returns id/email/name).
- Authed journey verified live: me -> overview -> filtered feeds (status,
  domain, public_id all correct) -> finding detail with 29-event history.
- Error handling: invalid status -> 400 INVALID_STATUS; unknown/malformed
  public_id -> 404; oversized limit clamped.
- Concurrency: two identical PATCHes in flight both 200, no duplicate events
  at the same timestamp (row lock + transition check hold under race).
- Final gate: 18/18, prod 200/200, e2e session dead afterwards.

## Session 3d (2026-08-23): CUTOVER EXECUTED
- app.nebulacomponents.com is LIVE: systemd service enabled (ExecStart fixed to
  node binary; npx not on systemd PATH), tunnel ingress rule added above
  catch-all, CNAME app -> <tunnel>.cfargotunnel.com proxied created.
- Auth BFF ported from customer-portal (google/github + callbacks, magic-link,
  verify, logout) with SITE_URL pointed at the app host; login page copied.
- Root cause fixed for apex-redirect bug: Next inferred /home/mike/nebula as
  workspace root (multiple lockfiles), loading the wrong .env at build.
  Fixed via outputFileTracingRoot pin + explicit env at build. URL now inlined.
- Magic-link E2E through real hostname: request -> verify -> 307 to app host,
  cookie set, /api/auth/me + findings feed live on public host.
- Final: app surface 200/200/401(unauth), apex untouched 200/200, suite 18/18.

## Session 3e (2026-08-23): auth UX hardening (Mike's screenshot finding)
- Mike hit the app signed-out and got "Authentication required" + Retry instead
  of a login screen. Fixed properly:
  1. middleware.ts gates all page routes on cookie presence -> 307 to
     /login?returnTo=<path>. /login and ALL /api/* stay open (APIs enforce auth
     themselves; first cut gated /api and broke 401 JSON contract - suite caught
     it, fixed by allowing /api prefix).
  2. Overview/Findings clients redirect to /login?error=session_expired on 401
     instead of dead-end error boxes.
  3. Cache-Control private,no-store on all routes (Next default s-maxage=1yr let
     CF edge cache a signed-in response and serve it to a signed-out visitor).
     CF purge_everything run after fix.
- Verified public host: anon / -> 307 /login, /login 200, magic-link flow ->
  cookie -> signed-in pages render data. Suite 18/18. Apex 200/200.

## Session 3f (2026-08-23): OAuth dual-surface fix (Google login landed in OLD workspace)
- Mike used Google login on app host; authorize URL carried apex redirect_uri
  (PUBLIC_BASE_URL), so Google bounced to apex callback -> old /workspace.
- platform_api/auth/routes.py: _resolve_authorize_redirect_uri() allowlists
  apex + app callback URIs, binds the chosen one into CSRF state; google and
  github callbacks reuse the state-bound URI for the token exchange (exact
  match required). Legacy no-param callers unchanged (apex default).
- workspace-app BFF: google/github authorize calls pass their own callback
  URIs; magic-link BFF tags surface:"app" so the email's verify link points
  at the app host (MagicLinkRequest.surface, allowlisted, default apex).
- Rebuild gotcha hit AGAIN: turbopack chunk cache kept stale SITE_URL; rm -rf
  .next + env-inline build fixed it. Verify redirect now app host, cookie on
  app host, /api/auth/me live.
- Negative tests: foreign redirect_uri 400; surface=evil -> apex fallback.
- Regression: suite 18/18, anon app / -> 307 login, apex 200/200, 0 api errors.
- STILL REQUIRED FROM MIKE: add both callback URIs in Google Console:
  https://nebulacomponents.com/api/auth/google/callback (exists)
  https://app.nebulacomponents.com/api/auth/google/callback (NEW - required)

## Session 3g (2026-08-23): shared session cookie across surfaces
- Mike: "no session set if manually return to app after login". Root cause:
  access_token was a HOST-ONLY cookie; apex login never carried to app.
  and vice versa.
- Fix: all issuers now set Domain=.nebulacomponents.com (platform_api 3x
  set_cookie; portal google/verify/both-callbacks/logout; workspace-app
  verify/both-callbacks/logout). Verified Set-Cookie carries the attribute;
  one cookie jar authenticates BOTH hosts (/api/auth/me 200 on each).
- Second bug found: apex /workspace emitted public s-maxage=300 -> CF served
  cached anonymous render to signed-in user (307 to login). Fixed: portal
  proxy stamps private,no-store on /workspace*, next.config excludes
  /workspace from shared-cache header, page is force-dynamic. Same fix
  applied to workspace-app pages + purge. Signed-in /workspace 200 with
  no-store, signed-out still gated 307.

## Session 3h (2026-08-23): visual parity with legacy workspace
- Mike: app was "supposed to look exactly like the old workspace", and tabs
  should be real pages, not ?tab= params.
- AppShell rebuilt to legacy WorkspaceClient chrome: pt-24 page, max-w-[1440],
  w-60 border-r sticky sidebar, hex project pill, categorized mono nav groups
  with dot indicators + active bg-bg-panel/border treatment, Tier card,
  email + Sign out row. Real routes (/ = Site Health, /findings) replace
  ?tab=; mobile horizontal tab row matches legacy.
- Overview: legacy header pattern (eyebrow "Executive Overview" + h1 +
  findings counter pill + accent "+ Audit URL" CTA), MetricCard anatomy
  (rounded-md border-border bg-bg-elevated p-5, uppercase tracking eyebrow,
  3xl semibold value, #b33d38 red tone), activity card.
- Findings: same header pattern, legacy select/button treatments
  (rounded-lg border-border bg-bg-panel px-3 py-2 text-sm), AuditsView-style
  empty state with accent CTA.
- Verified: 11-point HTML anatomy check (7 SSR markers pass; 4 data-rendered
  markers confirmed present in shipped client bundle). Suite 18/18. Prod 200s.

## Session 3i (2026-08-23): double-sidebar + zero-audits fixes (Mike's screenshot)
- Screenshot showed TWO sidebars: root layout wrapped AppShell around the
  ported WorkspaceClient, which draws its own complete chrome. Fix: root
  layout is bare; /findings gets AppShell via its own layout; / renders
  WorkspaceClient's chrome alone.
- "0 pages/audits" despite 200 audits: native /api/auth/me returned nested
  {user:{email}} but ported WorkspaceClient reads flat user.email (legacy
  shape). Flattened auth/me response to legacy form; AppShell consumer
  updated to match.
- Verified: auth/me flat shape live, 200 audits through proxy chain,
  single sidebar in source, suite 18/18, prod 200/200.

## Session 3j (2026-08-23): tabs as real routes
- Mike: tabs still showed ?tab=pages URLs. Fixed:
  - TAB_ROUTES map (tab id -> human path: /pages, /audits, /fix-queue,
    /competitor-intel, /aeo-citability, /ai-fix-agent, ...). goTab does a
    real route navigation; project filter stays a query param.
  - makeWorkspacePage(tabId) factory + 18 route folders rendering
    WorkspaceClient with initialTab preselected. One source of truth.
  - Legacy ?tab= deep links resolve once on mount then URL is cleaned.
  - CF edge cached a signed-in static render of /pages -> purge run;
    no-store header confirmed on responses.
- Verified: signed-in tab routes 200 with correct view preselected, anon
  gated to /login (307), legacy deep links resolve, suite 18/18, prod 200s.
