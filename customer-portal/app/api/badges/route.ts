import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { authHeaders } from '@/app/lib/workspace-auth'

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceUser(req)
  if ('response' in auth) return auth.response
  const email = auth.user.email

  try {
    const upstream = await fetch(
      `${process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/badges?email=${encodeURIComponent(email)}`,
      { cache: 'no-store', headers: authHeaders(req) }
    )
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
