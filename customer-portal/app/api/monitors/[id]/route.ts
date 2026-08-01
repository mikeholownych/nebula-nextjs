import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Monitor actions
 * PATCH /api/monitors/[id]  { cadence?, active? }
 * DELETE /api/monitors/[id]
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  try {
    const res = await fetch(`${API_BASE}/audit/monitors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch {
    return NextResponse.json({ error: 'Monitor update failed' }, { status: 502 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await fetch(`${API_BASE}/audit/monitors/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch {
    return NextResponse.json({ error: 'Monitor delete failed' }, { status: 502 })
  }
}
