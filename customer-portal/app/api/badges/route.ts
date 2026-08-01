import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || ''
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  try {
    const upstream = await fetch(
      `http://127.0.0.1:8001/audit/badges?email=${encodeURIComponent(email)}`,
      { cache: 'no-store' }
    )
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
