import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceUser(req)
  if ('response' in auth) return auth.response
  const email = auth.user.email
  try {
    const upstream = await fetch(
      `${PLATFORM_API}/audit/timeline?email=${encodeURIComponent(email)}`,
      { cache: 'no-store', headers: authHeaders(req) }
    )
    const data = await upstream.json()
    if (!upstream.ok) return NextResponse.json({ email, events: [] }, { status: 200 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ email, events: [] }, { status: 200 })
  }
}
