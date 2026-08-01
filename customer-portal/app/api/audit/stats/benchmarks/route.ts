import { NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Proxy: GET /api/audit/stats/benchmarks
 *
 * Forwards to the FastAPI /audit/stats/benchmarks endpoint. Real aggregates
 * only — per-component failure rates from completed audits. Revalidate
 * briefly; this is public, non-personal aggregate data.
 */
export async function GET() {
  try {
    const upstream = await fetch(`${API_BASE}/audit/stats/benchmarks`, {
      next: { revalidate: 300 },
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Benchmarks unavailable' }, { status: upstream.status })
    }

    const stats = await upstream.json()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[audit benchmarks proxy]', err)
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
