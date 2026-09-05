import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = (process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')

export async function GET(req: NextRequest) {
  const res = await fetch(`${PLATFORM_API}/api/gsc/sites`, { headers: authHeaders(req), cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
