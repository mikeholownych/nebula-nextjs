import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }
  try {
    const upstream = await fetch(
      `${PLATFORM_API}/audit/timeline?email=${encodeURIComponent(email)}`,
      { cache: 'no-store' }
    )
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Timeline unavailable' }, { status: 503 })
  }
}
