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
