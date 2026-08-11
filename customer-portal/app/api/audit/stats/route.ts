import { NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Proxy: GET /api/audit/stats
 *
 * Forwards to the FastAPI /audit/stats/aggregate endpoint. Real counts only -
 * no fabricated volume. Short revalidate window since this is a public,
 * non-personal aggregate - safe to cache briefly rather than hit the DB on
 * every homepage load.
 */
export async function GET() {
  try {
    const upstream = await fetch(`${API_BASE}/audit/stats/aggregate`, {
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Stats unavailable' }, { status: upstream.status })
    }

    const stats = await upstream.json()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[audit stats proxy]', err)
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
