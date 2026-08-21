import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function platformApiUrl(): string {
  return (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')
}

/**
 * Public status probe for the processing page. Returns only status — never findings.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${platformApiUrl()}/audit/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    if (upstream.status === 404) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Audit service unavailable' }, { status: 503 })
    }
    const data = await upstream.json() as { status?: string }
    const status = typeof data.status === 'string' ? data.status : 'pending'
    return NextResponse.json({ audit_id: id, status })
  } catch {
    return NextResponse.json({ error: 'Audit service unavailable' }, { status: 503 })
  }
}
