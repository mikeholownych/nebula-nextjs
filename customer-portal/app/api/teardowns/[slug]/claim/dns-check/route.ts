import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const body = await req.json().catch(() => ({}))
    const upstream = await fetch(
      `${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}/claim/dns-check`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...internalHeaders() },
        body: JSON.stringify(body),
      },
    )
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Claim unavailable' }, { status: 502 })
  }
}
