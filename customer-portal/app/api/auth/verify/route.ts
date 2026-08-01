/**
 * GET /api/auth/verify?token=...
 * Proxies to the platform API magic link verification endpoint.
 * On success: sets the JWT as an HTTP-only cookie and redirects to /workspace.
 * On failure: redirects to /login?error=invalid_token.
 */
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
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
      // Verification failed — redirect to login with error
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    const data = await upstream.json() as { access_token?: string; email?: string }
    const accessToken = data.access_token

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login?error=no_token', request.url))
    }

    // Redirect to workspace and set cookie
    const redirectResponse = NextResponse.redirect(new URL('/workspace', request.url))

    redirectResponse.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches platform API JWT_EXPIRATION_DAYS)
      path: '/',
    })

    // Also forward any cookies the platform API set directly
    const setCookie = upstream.headers.get('set-cookie')
    if (setCookie) {
      redirectResponse.headers.set('set-cookie', setCookie)
    }

    return redirectResponse
  } catch (err) {
    console.error('[auth/verify proxy]', err)
    return NextResponse.redirect(new URL('/login?error=service_unavailable', request.url))
  }
}
