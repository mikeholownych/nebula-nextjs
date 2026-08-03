import type { NextConfig } from 'next'
import { withPostHogConfig } from '@posthog/nextjs-config'
import { createHash } from 'node:crypto'
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
  // Skip TypeScript check during build — run `npm run typecheck` as a separate gate
  typescript: { ignoreBuildErrors: true },
  // Explicit workspace root to silence Turbopack lockfile ambiguity warning
  turbopack: { root: __dirname },
  // Required to support PostHog trailing-slash API requests through the /ingest proxy
  skipTrailingSlashRedirect: true,
  // Don't advertise the framework in responses
  poweredByHeader: false,
  // Enable gzip/brotli compression at the Next.js origin layer.
  // Cloudflare sits in front but HTML pages have Cache-Control: no-transform
  // (prevents CF email obfuscation), which also blocks CF-level compression.
  // Enabling origin compression ensures HTML responses are compressed regardless.
  compress: true,
  // 301/410 map for legacy static .html URLs indexed by Google (GSC 2026-07-21)
  // Frees crawl budget from dead URLs; preserves any query association on equity-bearing pages.
  // Rule: content pages → nearest current equivalent (301); true orphans → /gone (410).
  async redirects() {
    return [
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
      // Legacy .html → current app routes (301)
      { source: '/blog-trigger-aware-outreach.html',    destination: '/learning-centre', permanent: true },
      { source: '/why-landing-pages-dont-convert.html', destination: '/learning-centre/landing-page-not-converting', permanent: true },
      { source: '/why-landing-pages-dont-convert',      destination: '/learning-centre/landing-page-not-converting', permanent: true },
      { source: '/cta-optimization.html',               destination: '/cta-optimization',   permanent: true },
      { source: '/roas-cliff.html',                     destination: '/roas-cliff',          permanent: true },
      { source: '/ai-sdr-vs-audit.html',                destination: '/ai-sdr-vs-audit',     permanent: true },
      // NOT a legacy orphan — this is the live "Details + FAQ" link embedded
      // in every free audit email (deliver_audit.py), served from
      // public/primer.html. A previous pass in this same redirect map
      // mistook it for a dead pre-migration URL and 301'd it to
      // /learning-centre for ~3 days, sending every real lead who clicked
      // "Details + FAQ" mid-purchase-decision somewhere unrelated. Canonical
      // URL is now the clean /primer (see the matching rewrite below).
      { source: '/primer.html',                         destination: '/primer',              permanent: true },
      { source: '/7-systems.html',                      destination: '/learning-centre',      permanent: true },
      { source: '/audit.html',                          destination: '/audit',               permanent: true },
      { source: '/self-audit.html',                     destination: '/audit',               permanent: true },
      { source: '/case-studies/self-audit.html',         destination: '/case-studies',         permanent: true },
      { source: '/audit_dashboard.html',                destination: '/audit',               permanent: true },
      { source: '/agency-partner.html',                 destination: '/pricing',             permanent: true },
      { source: '/ai-ops-retainer.html',                destination: '/pricing',             permanent: true },
      { source: '/beta-tester.html',                    destination: '/pricing',             permanent: true },
      // Relocated out of /learning-centre (2026-07-27): founder-productivity/
      // AI-ops content, not landing-page conversion diagnosis — topically
      // off-hub per the Cluster audit, given its own /playbooks section
      // instead of being pruned, since all three had live inbound traffic.
      { source: '/learning-centre/founder-second-brain',        destination: '/playbooks/founder-second-brain',        permanent: true },
      { source: '/learning-centre/linkedin-skill-engine',       destination: '/playbooks/linkedin-skill-engine',       permanent: true },
      { source: '/learning-centre/specialist-ai-agent-library', destination: '/playbooks/specialist-ai-agent-library', permanent: true },
      // Consolidated into proof-before-cta (2026-07-27): near-duplicate
      // thin article covering the same proof-before-ask argument — see
      // the Content audit's cannibalization finding.
      { source: '/learning-centre/no-testimonials-on-landing-page', destination: '/learning-centre/proof-before-cta', permanent: true },
      // True orphans → 410 Gone (no equity to preserve, no equivalent page)
      { source: '/ad-burn-leaderboard.html',            destination: '/gone',                permanent: true },
      { source: '/og-card-source.html',                 destination: '/gone',                permanent: true },
      { source: '/component-showcase.html',             destination: '/gone',                permanent: true },
      // Additional .html → clean URL (GSC 2026-07-30 audit)
      { source: '/headline-optimization.html',          destination: '/headline-optimization',           permanent: true },
      { source: '/mobile-landing-page-optimization.html', destination: '/mobile-landing-page-optimization', permanent: true },
      { source: '/page-speed-conversion.html',          destination: '/page-speed-conversion',           permanent: true },
      { source: '/social-proof-landing-page.html',      destination: '/social-proof-landing-page',       permanent: true },
      { source: '/privacy-policy.html',                 destination: '/privacy-policy',                  permanent: true },
      // Dead pages → closest equivalent or /gone
      { source: '/pricing-generator.html',              destination: '/pricing',                permanent: true },
      { source: '/demo.html',                           destination: '/audit',                   permanent: true },
      { source: '/dashboard.html',                      destination: '/gone',                    permanent: true },
      { source: '/lead-dashboard.html',                 destination: '/gone',                    permanent: true },
      { source: '/generator.html',                      destination: '/gone',                    permanent: true },
      { source: '/growth-launch.html',                  destination: '/gone',                    permanent: true },
      { source: '/growth-launch-confirmation.html',     destination: '/gone',                    permanent: true },
      { source: '/marketing-ops.html',                  destination: '/gone',                    permanent: true },
    ]
  },

  // Serve static HTML files from public folder
  async rewrites() {
  return [
  // llms.txt proposal: markdown variant of teardown pages at URL + ".md".
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
  // PostHog reverse proxy — routes ingest through Next.js to avoid ad blockers
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
      // Rewrite root to index.html
      {
        source: '/',
        destination: '/index.html',
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
      // (the assumption above turned out false for direct-hit .html requests —
      // Next doesn't fall through to public/ for an exact single-word `.html`
      // path here, so single-word public/*.html files need an explicit rewrite
      // like the one below, same as the hyphenated ones get automatically.
      // /primer is the one link that actually matters — it's the "Details +
      // FAQ" URL embedded in every free audit email.)
      {
        source: '/primer',
        destination: '/primer.html',
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
          // Report-Only: observe real violations before enforcing. GA4 loads
          // gtag.js from googletagmanager.com; PostHog is proxied same-origin
          // through /ingest (see CookieConsent.tsx) so it needs no separate
          // script-src entry, only connect-src for its API/asset hosts.
          // Stripe checkout is a plain-link navigation to buy.stripe.com, not
          // an embedded script/iframe, so it needs no CSP entry either.
          // Cloudflare Web Analytics: beacon.min.js is injected by CF edge
          // from static.cloudflareinsights.com — must be in script-src and
          // connect-src or it logs a CSP violation in DevTools (Best Practices -4).
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self' data:",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://us.posthog.com https://us.i.posthog.com https://cloudflareinsights.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://buy.stripe.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      // CF email obfuscation: previously blocked via no-transform in Cache-Control,
      // but no-transform also stops the compression middleware (RFC 7230 §5.7.2 compliance).
      // Removed no-transform — CF compresses HTML at the edge AND Next.js compresses at origin.
      // CF email obfuscation (cdn-cgi link rewriting) is harmless anti-spam; disable it
      // in the CF dashboard (Scrape Shield → Email Address Obfuscation → Off) if needed.
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'X-Nebula-Revision',
            value: getBuildRevision(),
          },
        ],
      },
      // Next.js static chunks: immutable long cache (content-hashed filenames)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
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
      // /.well-known/api-catalog — RFC 9727 linkset+json
      {
        source: '/.well-known/api-catalog',
        headers: [
          { key: 'Content-Type', value: 'application/linkset+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /api/build-info — immutable deployment attestation
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
      // /.well-known/openid-configuration
      {
        source: '/.well-known/openid-configuration',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/oauth-protected-resource — RFC 9728
      {
        source: '/.well-known/oauth-protected-resource',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/acp.json — Agentic Commerce Protocol
      {
        source: '/.well-known/acp.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/ucp — Universal Commerce Protocol
      {
        source: '/.well-known/ucp',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/http-message-signatures-directory — Web Bot Auth JWKS
      {
        source: '/.well-known/http-message-signatures-directory',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /openapi.json — MPP payment discovery
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

const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY
export default posthogApiKey
  ? withPostHogConfig(nextConfig, {
      personalApiKey: posthogApiKey,
      projectId: '525183',
      host: 'https://us.posthog.com',
      sourcemaps: { deleteAfterUpload: true },
    })
  : nextConfig
