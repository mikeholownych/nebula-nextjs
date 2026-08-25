import type { NextConfig } from 'next'
import path from 'path'

// BFF surface shared with the legacy portal. The ported workspace views fetch
// these relatively; this app forwards them (cookies included) to the portal
// app on :3000 via a catch-all route handler, which owns session validation
// and data access. Native routes here (auth, findings, overview) resolve
// locally because Next matches real routes before a catch-all.
const PORTAL_BFF_URL = process.env.PORTAL_BFF_URL ?? 'http://127.0.0.1:3000'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so multiple lockfiles (parent repo + this app) don't
  // make Next infer /home/mike/nebula as root and load the wrong .env.
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-App-Revision', value: process.env.APP_REVISION || 'dev' },
        ],
      },
    ]
  },
}

export { PORTAL_BFF_URL }
export default nextConfig
