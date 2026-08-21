import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceUser(req)
  if ('response' in auth) return auth.response
  const email = auth.user.email
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
