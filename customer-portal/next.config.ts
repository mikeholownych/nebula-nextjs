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
      // Rewrite all HTML pages
      {
        source: '/:path(\\w+-\\w+-\\w+)',
        destination: '/:path.html',
      },
      {
        source: '/:path(\\w+-\\w+)',
        destination: '/:path.html',
      },
      {
        source: '/:path(\\w+)',
        destination: '/:path.html',
      },
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
    ]
  },
}

export default nextConfig
