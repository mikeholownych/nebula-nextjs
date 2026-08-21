import { NextRequest, NextResponse } from 'next/server'
import { authHeaders, requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  const res = await fetch(`${API_BASE}/workspace/api-keys`, {
    headers: authHeaders(request),
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  let body: { label?: string } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const res = await fetch(`${API_BASE}/workspace/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
    body: JSON.stringify({ label: typeof body.label === 'string' ? body.label : 'Default' }),
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
