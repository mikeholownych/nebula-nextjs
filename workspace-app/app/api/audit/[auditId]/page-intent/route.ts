/**
 * PATCH /api/audit/:auditId/page-intent
 * Proxy to platform_api's manual intent-override endpoint.
 * Forwards the session cookie so platform_api can verify ownership.
 */
import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

type Ctx = { params: Promise<{ auditId: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { auditId } = await ctx.params
  try {
    const body = await request.text()
    const cookie = request.headers.get('cookie') ?? ''
    const upstream = await fetch(`${API_BASE}/audit/${auditId}/page-intent`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body,
      signal: AbortSignal.timeout(15_000),
    })
    const data = await upstream.text()
    return new NextResponse(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[page-intent proxy]', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
