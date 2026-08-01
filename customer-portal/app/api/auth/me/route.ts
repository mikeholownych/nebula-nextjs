/**
 * GET /api/auth/me
 * Returns the current logged-in user. Used by the frontend to check session state.
 * Returns 401 if not authenticated (unauthenticated = no session cookie or expired).
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') ? { Cookie: request.headers.get('cookie')! } : {}),
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    })

    const data = await upstream.text()
    return new NextResponse(data, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    })
  } catch (err) {
    console.error('[auth/me proxy]', err)
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 })
  }
}
