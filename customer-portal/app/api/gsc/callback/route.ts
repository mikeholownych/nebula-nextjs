import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

/**
 * GET /api/gsc/callback
 *
 * Google OAuth redirects here after the user grants/denies GSC access.
 * We forward the full query string (code, state, error) to the FastAPI backend
 * which validates state, exchanges the code, and saves the tokens.
 * The backend then redirects to the workspace settings surface
 * (https://app.nebulacomponents.com/settings, or an error URL).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const qs = searchParams.toString()
  const cookie = req.headers.get('cookie') || ''

  const backendUrl = `${PLATFORM_API}/api/gsc/callback${qs ? `?${qs}` : ''}`

  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: { cookie },
    redirect: 'manual',
  })

  // Backend responds with a 302 redirect to the workspace settings surface.
  const location = res.headers.get('location')
  if (location) {
    // Pass through absolute URLs to other origins (the app host) untouched;
    // relativize same-origin backend URLs onto the current host.
    if (location.startsWith('http')) {
      const parsed = new URL(location)
      if (parsed.host !== req.headers.get('host')) {
        return NextResponse.redirect(location, { status: 302 })
      }
      const dest = parsed.pathname + parsed.search
      return NextResponse.redirect(new URL(dest, req.url), { status: 302 })
    }
    return NextResponse.redirect(new URL(location, req.url), { status: 302 })
  }

  // Forward error response from backend
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  })
}
