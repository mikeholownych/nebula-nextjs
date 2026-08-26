import type { NextConfig } from 'next'
import { createHash } from 'node:crypto'
import { LEGACY_HTML_ROUTES } from './app/lib/legacy-routes'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function getBuildRevision(): string {
  try {
    const filePath = join(__dirname, 'app/lib/build-info.json')
    if (existsSync(filePath)) {
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.revision && typeof data.revision === 'string') {
        return data.revision
      }
    }
  } catch {
    // fallback
  }
  return 'development'
}

// Citable release governance: /resources/citable must answer with the sha256
// of the vendored resource-data.json release projection so publisher-controlled
// deployment receipts can verify the deployed surface against the release
// manifest. The vendored files under public/resources/citable/ are byte-exact
// copies of the citable GitHub release assets for the deployed version.
function citableProjectionHash(): string | null {
  try {
    const file = join(__dirname, 'public/resources/citable/resource-data.json')
    return createHash('sha256').update(readFileSync(file)).digest('hex')
  } catch {
    return null
  }
}

const nextConfig: NextConfig = {
  // Alternate distDir lets deploy build into .next-incoming while the live
  // process keeps serving .next. See scripts/deploy_customer_portal.sh.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Fail `next build` on type errors. `npm run typecheck` remains a separate CI gate.
  typescript: { ignoreBuildErrors: false },
  // Explicit workspace root to silence Turbopack lockfile ambiguity warning
  turbopack: { root: __dirname },
  // Required to support PostHog trailing-slash API requests through the /ingest proxy
  skipTrailingSlashRedirect: true,
  // Don't advertise the framework in responses
  poweredByHeader: false,
  // Enable gzip/brotli compression at the Next.js origin layer.
  compress: true,
  // Keep native and DB drivers external so Node runtime loads them directly
  // without Turbopack hashing/bundling issues.
  serverExternalPackages: ['pdfkit', 'pg', 'pg-pool', 'pg-types', 'pgpass', 'posthog-node'],
  // 301/410 map for legacy static .html URLs indexed by Google (GSC 2026-07-21)
  // Frees crawl budget from dead URLs; preserves any query association on equity-bearing pages.
  // Rule: content pages → nearest current equivalent (301); true orphans → /gone (410).
  async redirects() {
    return [
      // HeyCatch channel attribution short links (single-character paths)
      {
        source: '/:l([a-z0-9])',
        destination: '/?utm_source=heycatch&utm_campaign=:l',
        permanent: false,
      },
      // www variants → canonical .com apex (single hop)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nebulacomponents.shop' }],
        destination: 'https://nebulacomponents.com/:path*',
        statusCode: 301,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nebulacomponents.com' }],
        destination: 'https://nebulacomponents.com/:path*',
        statusCode: 301,
      },
      // Trailing-slash duplicate (skipTrailingSlashRedirect is on globally for
      // the PostHog /ingest proxy, so this one page needs its own explicit rule)
      { source: '/pricing/', destination: '/pricing', permanent: true },
      { source: '/billing', destination: 'https://app.nebulacomponents.com/billing', permanent: false },
      // Legacy .html -> live equivalents (301). Single source of truth in
      // app/lib/legacy-routes.ts - proxy.ts must match these BEFORE its
      // generic .html blocker or the 301s never fire (D9 incident).
      ...LEGACY_HTML_ROUTES.map((r) => ({ source: r.source, destination: r.destination, permanent: true })),
      // Relocated out of /learning-centre (2026-07-27): founder-productivity/
      // AI-ops content, not landing-page conversion diagnosis - topically
      // off-hub per the Cluster audit, given its own /playbooks section
      // instead of being pruned, since all three had live inbound traffic.
      { source: '/learning-centre/founder-second-brain',        destination: '/playbooks/founder-second-brain',        permanent: true },
      { source: '/learning-centre/linkedin-skill-engine',       destination: '/playbooks/linkedin-skill-engine',       permanent: true },
      { source: '/learning-centre/specialist-ai-agent-library', destination: '/playbooks/specialist-ai-agent-library', permanent: true },
      // Consolidated into proof-before-cta (2026-07-27): near-duplicate
      // thin article covering the same proof-before-ask argument - see
      // the Content audit's cannibalization finding.
      { source: '/learning-centre/no-testimonials-on-landing-page', destination: '/learning-centre/proof-before-cta', permanent: true },
      // True orphans → 410 Gone (no equity to preserve, no equivalent page)
      // True-orphan and dead .html URLs are intentionally NOT listed here:
      // proxy.ts 404s (noindex) any .html path not in LEGACY_HTML_ROUTES, so
      // listing them as redirects would be dead code (D9 lesson).
      // GSC 404 remediation (2026-08-17) - bare-route versions of pages
      // whose .html counterparts were already redirected above, plus orphaned
      // external links and missing compare slugs.
      { source: '/dashboard',         destination: '/gone',    permanent: true },
      { source: '/audit-dashboard',   destination: '/audit',   permanent: true },
      { source: '/audit/dashboard',   destination: '/audit',   permanent: true },
      { source: '/organization',      destination: '/gone',    permanent: true },
      { source: '/subscription',      destination: '/pricing', permanent: true },
      { source: '/beta-tester',       destination: '/pricing', permanent: true },
      { source: '/ai-ops-retainer',   destination: '/pricing', permanent: true },
      // /why-evidence is linked from the MailCheck site → redirect to the
      // closest equivalent content on the Nebula site
      { source: '/why-evidence',      destination: '/editorial-standards', permanent: true },
      // /learn-more is linked from external sources with no internal equivalent
      { source: '/learn-more',        destination: '/audit',   permanent: true },
      // Missing compare slugs - redirect to the generic compare index
      { source: '/compare/semrush',   destination: '/vs/semrush-site-audit', permanent: true },
      { source: '/compare/hotjar',    destination: '/vs/hotjar',             permanent: true },
      { source: '/compare/woorank',   destination: '/compare',               permanent: true },
    ]
  },

  // Serve static HTML files from public folder
  async rewrites() {
  return [
  {
    source: '/.well-known/bimi.svg',
    destination: '/api/bimi',
  },
  // Must precede the dynamic /teardowns/[slug] route, which would otherwise
  // capture "knallhart.md" as a slug and 404.
  {
    source: '/teardowns/:slug.md',
    destination: '/md/teardowns/:slug',
  },
  // llms.txt proposal: markdown variant of learning-centre articles at
  // URL + ".md". Precedes the dynamic /learning-centre/[slug] route.
  {
    source: '/learning-centre/:slug.md',
    destination: '/md/learning-centre/:slug',
  },
  // PostHog reverse proxy - routes ingest through Next.js to avoid ad blockers
  {
    source: '/ingest/static/:path*',
    destination: 'https://us-assets.i.posthog.com/static/:path*',
  },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      // Rewrite HTML pages with 3+ word paths
      {
        source: '/:path(\\w+-\\w+-\\w+)',
        destination: '/:path.html',
      },
      // Rewrite HTML pages with 2 word paths
      {
        source: '/:path(\\w+-\\w+)',
        destination: '/:path.html',
      },
      // DO NOT rewrite single-word paths - let static files and app routes handle them
      // (the assumption above turned out false for direct-hit .html requests -
      // Next doesn't fall through to public/ for an exact single-word `.html`
      // path here, so single-word public/*.html files need an explicit rewrite
      // like the one below, same as the hyphenated ones get automatically.
      // /primer is the one link that actually matters - it's the "Details +
      // FAQ" URL embedded in every free audit email.)
      {
        source: '/primer',
        destination: '/primer.html',
      },
      // Widget demo page - same .html fall-through quirk as /primer; nested
      // public .html files need an explicit extensionless rewrite.
      {
        source: '/widget/demo',
        destination: '/widget/demo.html',
      },
    ]
  },
  // Allow serving static HTML
  async headers() {
    const projectionHash = citableProjectionHash()
    return [
      // Citable release governance surfaces (see public/resources/citable/README.md)
      ...(projectionHash
        ? [
            {
              source: '/resources/citable',
              headers: [
                {
                  key: 'x-citable-projection-sha256',
                  value: projectionHash,
                },
              ],
            },
          ]
        : []),
      // Security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Enforced policy. GA4 loads
          // gtag.js from googletagmanager.com; PostHog is proxied same-origin
          // through /ingest (see CookieConsent.tsx) so it needs no separate
          // script-src entry, only connect-src for its API/asset hosts.
          // GA4 also fires an image beacon to googletagmanager.com/td and
          // google-analytics.com collect endpoints, plus regional beacons to
          // www.google.com (ccm/g collect). Those must be allowlisted or
          // Chrome blocks them (visible on /teardowns and every page).
          // Stripe checkout is a plain-link navigation to buy.stripe.com, not
          // an embedded script/iframe, so it needs no CSP entry either.
          // Cloudflare Web Analytics beacon is allowlisted - it defaults on
          // with general analytics consent (non-EU: accepted by default).
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com https://searchable-tracker.searchable.workers.dev https://in.heycatch.ai",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://indieascent.com https://nicklaunches.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com",
              "font-src 'self' data:",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://us.posthog.com https://us.i.posthog.com https://cloudflareinsights.com https://searchable-tracker.searchable.workers.dev https://tracker.searchableanalytics.com https://in.heycatch.ai",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://buy.stripe.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      // HTML pages: browser always revalidates, CDN caches for 5 minutes (SSG content).
      // s-maxage lets Cloudflare serve from edge for 5 minutes before revalidating.
      // After static generation lands, bump s-maxage to 300+ for content pages.
      // Dynamic pages (force-dynamic) override this with no-store via Next.js.
      {
        source: '/((?!_next|workspace).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=60, must-revalidate',
          },
          {
            key: 'X-Nebula-Revision',
            value: getBuildRevision(),
          },
        ],
      },
      // Next.js static chunks: immutable long cache (content-hashed filenames).
      // Also sets Cloudflare-CDN-Cache-Control to prevent CF from caching 404s
      // that occur during the brief window between build deploy and service restart.
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Images and brand assets: 1-day cache with revalidation
      {
        source: '/brand/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      // RFC 8288 Link headers for agent discovery on every HTML response
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Link',
            value: [
              '</llms.txt>; rel="describedby"; type="text/plain"',
              '</.well-known/api-catalog>; rel="https://www.rfc-editor.org/rfc/rfc9727#section-3"',
              '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
              '</openapi.json>; rel="describedby"; type="application/json"',
              '</.well-known/acp.json>; rel="https://agenticcommerce.dev/rel/discovery"',
              '</.well-known/ucp>; rel="https://ucp.dev/rel/discovery"',
              '</.well-known/http-message-signatures-directory>; rel="https://ietf.org/rel/jwks"',
              '</auth.md>; rel="https://workos.com/auth-md"',
            ].join(', '),
          },
        ],
      },
      // HTML pages: cache + Markdown negotiation hint
      {
        source: '/:path*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
          {
            key: 'Vary',
            value: 'Accept',
          },
        ],
      },
      // /.well-known/api-catalog - RFC 9727 linkset+json
      {
        source: '/.well-known/api-catalog',
        headers: [
          { key: 'Content-Type', value: 'application/linkset+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /api/build-info - immutable deployment attestation
      {
        source: '/api/build-info',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // Liveness/readiness must never be CDN-cached. The HTML catch-all
      // s-maxage=300 would otherwise win for these JSON probes.
      {
        source: '/api/healthz',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/api/readyz',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
        ],
      },
      // /.well-known/openid-configuration
      {
        source: '/.well-known/openid-configuration',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/oauth-protected-resource - RFC 9728
      {
        source: '/.well-known/oauth-protected-resource',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/acp.json - Agentic Commerce Protocol
      {
        source: '/.well-known/acp.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/ucp - Universal Commerce Protocol
      {
        source: '/.well-known/ucp',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/http-message-signatures-directory - Web Bot Auth JWKS
      {
        source: '/.well-known/http-message-signatures-directory',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /openapi.json - MPP payment discovery
      {
        source: '/openapi.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/agent-skills/
      {
        source: '/.well-known/agent-skills/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /auth.md
      {
        source: '/auth.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /llms.txt
      {
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/oauth-protected-resource
      {
        source: '/.well-known/oauth-protected-resource',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/oauth-authorization-server
      {
        source: '/.well-known/oauth-authorization-server',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

// NOTE: withPostHogConfig injects a runAfterProductionCompile hook that requires
// the personal API key to have 'error_tracking:write' scope for sourcemap upload.
// Until the key is rotated with that scope, bypass withPostHogConfig to keep
// production builds working. Re-enable once the key is updated.
// const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY
export default nextConfig
