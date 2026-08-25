import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Side-by-side signal diagnostics for one tracked rival (v2).
 * GET /api/competitors/comparison/[trackingId]
 *
 * Session identity is authoritative; headers follow the monitors-engine
 * pattern (authHeaders spread first, internal bearer last). Returns you/
 * rival payloads with per-signal pass maps, your_edge/threats lists, and a
 * paired score history series; legacy score-only rival data when either
 * side lacks a linked completed audit.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ trackingId: string }> }
) {
  const auth = await requireWorkspaceUser(req)
  if ('response' in auth) return auth.response

  const { trackingId } = await ctx.params
  if (!trackingId || !/^[0-9a-fA-F-]{36}$/.test(trackingId)) {
    return NextResponse.json({ error: 'Invalid competitor ID' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${PLATFORM_API}/api/competitors/comparison/${encodeURIComponent(trackingId)}`,
      {
        headers: { 'Content-Type': 'application/json', ...authHeaders(req), ...internalHeaders() },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      }
    )
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Competitor comparison v2 proxy error:', error)
    return NextResponse.json({ error: 'Comparison unavailable' }, { status: 503 })
  }
}
