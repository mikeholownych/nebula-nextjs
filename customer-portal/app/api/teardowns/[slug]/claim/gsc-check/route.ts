import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

// Session-guarded upstream: forward the browser cookie so session auth works.
// Deliberately no internal bearer here.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const upstream = await fetch(
      `${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}/claim/gsc-check`,
      {
        method: 'POST',
        headers: {
          Cookie: req.headers.get('cookie') || '',
        },
      },
    )
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Claim unavailable' }, { status: 502 })
  }
}
