import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const upstream = await fetch(
      `${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}`,
      {
        headers: { ...internalHeaders() },
        next: { revalidate: 300 },
      },
    )
    if (!upstream.ok) return NextResponse.json({}, { status: upstream.status })
    const data = await upstream.json()
    if (data.claim) {
      delete data.claim.claimed_by_email
      delete data.claim.verification_method
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Teardown unavailable' }, { status: 502 })
  }
}
