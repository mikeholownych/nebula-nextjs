import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')

export async function GET(request: NextRequest) {
  // OAuth requires a real browser redirect: forward session creds upstream,
  // then relay FastAPI's 302 Location (Google consent URL).
  const upstream = await fetch(`${PLATFORM_API}/api/ga4/connect`, {
    headers: { ...authHeaders(request) },
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  const location = upstream.headers.get('location')
  if (!location || upstream.status >= 400) {
    return NextResponse.json(
      { error: 'GA4 connect unavailable' },
      { status: upstream.status === 200 ? 502 : upstream.status },
    )
  }
  return NextResponse.redirect(location, 302)
}
