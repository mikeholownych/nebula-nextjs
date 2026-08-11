/**
 * GET  /api/auth/google - initiates Google OAuth server-side redirect flow
 * POST /api/auth/google - proxies client-side ID token exchange (legacy)
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
// Behind the Cloudflare tunnel Next.js derives request.url as localhost:3000.
// Redirects MUST use the public site URL or the browser lands on localhost.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.com'

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, SITE_URL))
}

export async function GET(_request: NextRequest) {
  try {
    const upstream = await fetch(`${API_BASE}/api/auth/google/authorize`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!upstream.ok) {
      console.error('[auth/google] authorize failed:', await upstream.text().catch(() => ''))
      return redirectTo('/login?error=google_unavailable')
    }

    const data = await upstream.json() as { url?: string }
    if (!data.url) {
      return redirectTo('/login?error=google_unavailable')
    }

    return NextResponse.redirect(data.url)
  } catch (err) {
    console.error('[auth/google] error:', err)
    return redirectTo('/login?error=google_unavailable')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const upstream = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    const data = await upstream.text()
    const response = new NextResponse(data, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    })

    const setCookie = upstream.headers.get('set-cookie')
    if (setCookie) response.headers.set('set-cookie', setCookie)

    return response
  } catch (err) {
    console.error('[auth/google proxy]', err)
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 })
  }
}
