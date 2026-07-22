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
    const file = join(process.cwd(), 'public/resources/citable/resource-data.json')
    return createHash('sha256').update(readFileSync(file)).digest('hex')
  } catch {
    return null
  }
}

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
    const projectionHash = citableProjectionHash()
    return [
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
      {
        // Receipt probes hash the exact body; keep intermediary caching short
        // so a redeploy propagates within one probe interval.
        source: '/resources/citable/:file(llms\\.txt|resource-data\\.json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate, no-transform',
          },
        ],
      },
      {
        source: '/:path*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
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
