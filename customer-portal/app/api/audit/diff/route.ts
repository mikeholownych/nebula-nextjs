import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const audit_a = searchParams.get('audit_a')
    const audit_b = searchParams.get('audit_b')

    if (!audit_a || !audit_b) {
      return NextResponse.json({ error: 'audit_a and audit_b params required' }, { status: 400 })
    }

    const res = await fetch(
      `${PLATFORM_API}/api/audit/schedules/diff?audit_a=${encodeURIComponent(audit_a)}&audit_b=${encodeURIComponent(audit_b)}`,
      {
        headers: authHeaders(req),
        cache: 'no-store',
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Diff unavailable' }))
      return NextResponse.json(err, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Diff service unavailable' }, { status: 503 })
  }
}
