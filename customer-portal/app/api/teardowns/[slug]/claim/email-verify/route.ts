import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

// Unguarded upstream: the token in the query string is the capability (same
// pattern as GET /auth/verify). Forward the query verbatim; no bearer needed.
// Phase 1 returns the upstream JSON as-is.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const query = req.nextUrl.search
    const upstream = await fetch(
      `${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}/claim/email-verify${query}`,
      { headers: { Accept: 'application/json' } },
    )
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Claim unavailable' }, { status: 502 })
  }
}
