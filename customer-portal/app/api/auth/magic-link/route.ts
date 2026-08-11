/**
 * POST /api/auth/magic-link
 * Proxies to the platform API. Forwards cookies for session context.
 * The platform API stub returns 501 until magic link is implemented -
 * this proxy means the frontend wiring is complete and will work
 * automatically when the platform API ships the implementation.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const upstream = await fetch(`${API_BASE}/api/auth/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') ? { Cookie: request.headers.get('cookie')! } : {}),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    const data = await upstream.text()
    const response = new NextResponse(data, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    })

    // Forward Set-Cookie headers if any
    const setCookie = upstream.headers.get('set-cookie')
    if (setCookie) response.headers.set('set-cookie', setCookie)

    return response
  } catch (err) {
    console.error('[auth/magic-link proxy]', err)
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 })
  }
}
