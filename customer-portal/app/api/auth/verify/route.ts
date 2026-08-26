/**
 * GET /api/auth/verify?token=...
 * Proxies to the platform API magic link verification endpoint.
 * On success: sets the JWT as an HTTP-only cookie and redirects to /workspace.
 * On failure: redirects to /login?error=invalid_token.
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
  const token = request.nextUrl.searchParams.get('token') ?? ''
  if (!token) {
    return redirectTo('/login?error=missing_token')
  }

  try {
    const upstream = await fetch(`${API_BASE}/api/auth/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!upstream.ok) {
      // Verification failed - redirect to login with error
      return redirectTo('/login?error=invalid_token')
    }

    const data = await upstream.json() as { access_token?: string; email?: string }
    const accessToken = data.access_token

    if (!accessToken) {
      return redirectTo('/login?error=no_token')
    }

    // Redirect to workspace and set persistent HTTP-only cookie
    const redirectResponse = NextResponse.redirect(new URL('/', 'https://app.nebulacomponents.com'))

    redirectResponse.cookies.set('access_token', accessToken, {
      domain: '.nebulacomponents.com',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches platform API JWT_EXPIRATION_DAYS)
      path: '/',
    })

    return redirectResponse
  } catch (err) {
    console.error('[auth/verify proxy]', err)
    return redirectTo('/login?error=service_unavailable')
  }
}
