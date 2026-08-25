/**
 * GET /api/auth/google/callback?code=...&state=...
 * Handles the Google OAuth callback. Proxies to platform API which
 * exchanges the code, verifies the ID token, creates/finds the user,
 * and returns a JWT. Sets the JWT as an HTTP-only cookie and redirects
 * to /workspace.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
// Behind the Cloudflare tunnel Next.js derives request.url as localhost:3000.
// Redirects MUST use the public site URL or the browser lands on localhost.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.nebulacomponents.com'

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, SITE_URL))
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')

  if (!code || !state) {
    return redirectTo('/login?error=google_missing_params')
  }

  try {
    const upstream = await fetch(
      `${API_BASE}/api/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
      }
    )

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      console.error('[auth/google/callback] upstream failed:', upstream.status, detail)
      return redirectTo('/login?error=google_auth_failed')
    }

    const data = await upstream.json() as { access_token?: string }
    const accessToken = data.access_token

    if (!accessToken) {
      return redirectTo('/login?error=google_no_token')
    }

    // Redirect to workspace and set persistent HTTP-only cookie
    const redirectResponse = NextResponse.redirect(new URL('/', SITE_URL))

    redirectResponse.cookies.set('access_token', accessToken, {
      domain: '.nebulacomponents.com',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return redirectResponse
  } catch (err) {
    console.error('[auth/google/callback] error:', err)
    return redirectTo('/login?error=google_service_unavailable')
  }
}
