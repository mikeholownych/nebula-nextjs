/**
 * POST /api/auth/logout  — revoke current session
 * GET  /api/auth/me      — return current user (used to check logged-in state)
 *
 * Both proxy to the platform API, forwarding the session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

async function proxy(request: NextRequest, path: string, method: string): Promise<NextResponse> {
  try {
    const body = method !== 'GET' ? await request.text() : undefined
    const upstream = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') ? { Cookie: request.headers.get('cookie')! } : {}),
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}),
      },
      ...(body !== undefined ? { body } : {}),
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
    console.error(`[auth${path} proxy]`, err)
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  return proxy(request, '/api/auth/logout', 'POST')
}
