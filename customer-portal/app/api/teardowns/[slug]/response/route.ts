import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

// Session-guarded upstream: the browser cookie is the capability.
// Deliberately no internal bearer here.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const body = await req.text()
    const upstream = await fetch(
      `${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}/response`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: req.headers.get('cookie') || '',
        },
        body,
      },
    )
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Claim unavailable' }, { status: 502 })
  }
}
