import type { NextConfig } from 'next'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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
  // Skip ESLint during build — run `npm run lint` as a separate gate
  eslint: { ignoreDuringBuilds: true },
  // Explicit workspace root to silence Turbopack lockfile ambiguity warning
  turbopack: { root: __dirname },
  // 301/410 map for legacy static .html URLs indexed by Google (GSC 2026-07-21)
  // Frees crawl budget from dead URLs; preserves any query association on equity-bearing pages.
  // Rule: content pages → nearest current equivalent (301); true orphans → /gone (410).
  async redirects() {
    return [
      // www → apex (duplicate host, both returning 200 — kills authority split)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nebulacomponents.shop' }],
        destination: 'https://nebulacomponents.shop/:path*',
        permanent: true,
      },
      // Legacy .html → current app routes (301)
      { source: '/blog-trigger-aware-outreach.html',    destination: '/learning-centre', permanent: true },
      { source: '/why-landing-pages-dont-convert.html', destination: '/learning-centre/landing-page-not-converting', permanent: true },
      { source: '/cta-optimization.html',               destination: '/cta-optimization',   permanent: true },
      { source: '/roas-cliff.html',                     destination: '/roas-cliff',          permanent: true },
      { source: '/ai-sdr-vs-audit.html',                destination: '/ai-sdr-vs-audit',     permanent: true },
      { source: '/primer.html',                         destination: '/learning-centre',      permanent: true },
      { source: '/7-systems.html',                      destination: '/learning-centre',      permanent: true },
      { source: '/audit.html',                          destination: '/audit',               permanent: true },
      { source: '/self-audit.html',                     destination: '/audit',               permanent: true },
      { source: '/case-studies/self-audit.html',         destination: '/case-studies',         permanent: true },
      { source: '/audit_dashboard.html',                destination: '/audit',               permanent: true },
      { source: '/agency-partner.html',                 destination: '/pricing',             permanent: true },
      { source: '/ai-ops-retainer.html',                destination: '/pricing',             permanent: true },
      { source: '/beta-tester.html',                    destination: '/pricing',             permanent: true },
      // True orphans → 410 Gone (no equity to preserve, no equivalent page)
      { source: '/ad-burn-leaderboard.html',            destination: '/gone',                permanent: true },
      { source: '/og-card-source.html',                 destination: '/gone',                permanent: true },
      { source: '/component-showcase.html',             destination: '/gone',                permanent: true },
    ]
  },

  // Serve static HTML files from public folder
  async rewrites() {
    return [
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
        ],
      },
      // Disable Cloudflare email obfuscation and other CDN transforms site-wide
      // Cache-Control: no-transform prevents CF from rewriting email addresses into cdn-cgi links
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate, no-transform',
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
              '</.well-known/mcp/server-card.json>; rel="service"',
              '</.well-known/agent.json>; rel="https://a2a-protocol.org/rel/agent-card"',
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
      // /.well-known/mcp/server-card.json
      {
        source: '/.well-known/mcp/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // /.well-known/agent.json — A2A agent card
      {
        source: '/.well-known/agent.json',
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

export default nextConfig
