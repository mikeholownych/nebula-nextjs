/**
 * GET /api/auth/github
 * Initiates GitHub OAuth flow by fetching the authorization URL from
 * the platform API and redirecting the browser to GitHub.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
// Behind the Cloudflare tunnel Next.js derives request.url as localhost:3000.
// Redirects MUST use the public site URL or the browser lands on localhost.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.com'

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, SITE_URL))
}

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(`${API_BASE}/api/auth/github/authorize`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!upstream.ok) {
      const err = await upstream.text().catch(() => 'Unknown error')
      console.error('[auth/github] authorize failed:', err)
      return redirectTo('/login?error=github_unavailable')
    }

    const data = await upstream.json() as { url?: string }
    if (!data.url) {
      return redirectTo('/login?error=github_unavailable')
    }

    return NextResponse.redirect(data.url)
  } catch (err) {
    console.error('[auth/github] error:', err)
    return redirectTo('/login?error=github_unavailable')
  }
}
