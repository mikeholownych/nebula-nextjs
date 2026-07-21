import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Proxy: GET /api/audit/[id]/share-token
 *
 * Forwards to the FastAPI /audit/{id}/share-token endpoint and returns
 * { share_token, share_url } so the client never needs to talk to port 8001.
 * Only returns the token — never the full audit — so there's no PII leak.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(id)) {
    return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${API_BASE}/audit/${id}/share-token`, {
      next: { revalidate: 0 },
    })

    if (!upstream.ok) {
      const body = await upstream.json().catch(() => ({}))
      return NextResponse.json(body, { status: upstream.status })
    }

    const { share_token } = await upstream.json()

    // Build the canonical share URL using the public host header if available,
    // falling back to the tunnel domain.
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://nebulacomponents.shop'
    const share_url = `${origin}/audit/${id}/results?share=${share_token}`

    return NextResponse.json({ share_token, share_url })
  } catch (err) {
    console.error('[share-token proxy]', err)
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
