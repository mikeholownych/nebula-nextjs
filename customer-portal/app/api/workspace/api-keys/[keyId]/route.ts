import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params
  const email = request.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  const res = await fetch(
    `${API_BASE}/workspace/api-keys/${keyId}?email=${encodeURIComponent(email)}`,
    { method: 'DELETE', signal: AbortSignal.timeout(8000) }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
