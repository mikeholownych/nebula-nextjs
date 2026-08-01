import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || ''
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }
  try {
    const res = await fetch(
      `${PLATFORM_API}/audit/team?email=${encodeURIComponent(email)}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch team data' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Team API unavailable' }, { status: 503 })
  }
}
