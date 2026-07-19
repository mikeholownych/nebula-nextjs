import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
    return [
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
