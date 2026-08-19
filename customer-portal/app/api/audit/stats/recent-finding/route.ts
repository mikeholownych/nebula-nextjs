import { NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Proxy: GET /api/audit/stats/recent-finding
 *
 * Forwards to the FastAPI /audit/stats/recent-finding endpoint.
 * Returns the highest-priority finding from the most recently completed audit -
 * label, issue, impact, and time-ago. No URL is ever exposed.
 */
export async function GET() {
  try {
    const upstream = await fetch(`${API_BASE}/audit/stats/recent-finding`, {
      next: { revalidate: 120 },
    })

    if (upstream.status === 404) {
      return NextResponse.json({ error: 'No recent findings' }, { status: 404 })
    }

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Finding unavailable' }, { status: upstream.status })
    }

    const finding = await upstream.json()
    return NextResponse.json(finding)
  } catch (err) {
    console.error('[recent-finding proxy]', err)
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
