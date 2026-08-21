import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

/**
 * GET /api/gsc/connect
 *
 * Proxies the browser to the backend GSC OAuth start endpoint which redirects
 * to Google's consent screen. We pass the session cookie so the backend can
 * identify the user and bind the CSRF state to their user_id.
 */
export async function GET(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  const backendUrl = `${PLATFORM_API}/api/gsc/connect`

  // Follow the redirect chain that the backend initiates
  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: { cookie },
    redirect: 'manual', // Let us forward the 302 rather than following it server-side
  })

  // Backend returns 302 → Google OAuth URL
  const location = res.headers.get('location')
  if (location) {
    return NextResponse.redirect(location, { status: 302 })
  }

  // Unexpected - forward whatever the backend returned
  return NextResponse.json({ error: 'Failed to initiate GSC OAuth' }, { status: 500 })
}
