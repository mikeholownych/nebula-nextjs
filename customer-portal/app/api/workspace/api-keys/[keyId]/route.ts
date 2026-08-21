import { NextRequest, NextResponse } from 'next/server'
import { authHeaders, requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  const { keyId } = await params
  const res = await fetch(
    `${API_BASE}/workspace/api-keys/${keyId}`,
    { method: 'DELETE', headers: authHeaders(request), signal: AbortSignal.timeout(8000) }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
