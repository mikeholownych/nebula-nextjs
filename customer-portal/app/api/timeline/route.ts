import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const INTERNAL_SECRET = (process.env.INTERNAL_API_SECRET || '').trim()

export async function GET(req: NextRequest) {
  // Check for internal API secret authorization (for workspace-app proxy)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ') && INTERNAL_SECRET) {
    const token = authHeader.slice(7)
    if (token === INTERNAL_SECRET) {
      const email = req.nextUrl.searchParams.get('email')
      if (!email || email.length < 3 || email.length > 320) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
      }
      try {
        const headers = new Headers()
        headers.set('Authorization', `Bearer ${INTERNAL_SECRET}`)
        const upstream = await fetch(
          `${PLATFORM_API}/audit/timeline?email=${encodeURIComponent(email)}`,
          { cache: 'no-store', headers }
        )
        const data = await upstream.json()
        if (!upstream.ok) {
          return NextResponse.json({ email, events: [] }, { status: 200 })
        }
        return NextResponse.json(data)
      } catch {
        return NextResponse.json({ email, events: [] }, { status: 200 })
      }
    }
  }

  // Fall back to regular workspace user authentication
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
