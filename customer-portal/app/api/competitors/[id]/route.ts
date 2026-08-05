import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await fetch(`${PLATFORM_API}/api/competitors/${id}`, {
      method: 'DELETE',
      headers: authHeaders(req),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Delete failed' }))
      return NextResponse.json(err, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Competitor service unavailable' }, { status: 503 })
  }
}
