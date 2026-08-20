import { NextRequest, NextResponse } from 'next/server'
import { formatAgentPayload } from '../route'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

async function validateKey(rawKey: string): Promise<{ valid: boolean; email?: string; plan?: string }> {
  if (!rawKey || !rawKey.startsWith('nbk_')) return { valid: false }
  try {
    const res = await fetch(`${API_BASE}/workspace/api-keys/validate`, {
      headers: { Authorization: `Bearer ${rawKey}` },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { valid: false }
    const data = await res.json()
    return { valid: data.valid === true, email: data.email, plan: data.plan }
  } catch {
    return { valid: false }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params
  const authHeader = request.headers.get('authorization') || ''
  const apiKeyHeader = request.headers.get('x-api-key') || ''
  const apiKeyQuery = request.nextUrl.searchParams.get('api_key') || ''
  const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim() || apiKeyHeader || apiKeyQuery

  const format = request.nextUrl.searchParams.get('format') || ''
  const acceptHeader = request.headers.get('accept') || ''
  const isMarkdown = format === 'md' || format === 'markdown' || acceptHeader.includes('text/markdown')

  // Check auth
  if (rawKey) {
    const keyAuth = await validateKey(rawKey)
    if (!keyAuth.valid) {
      return NextResponse.json(
        {
          error: 'Invalid or expired Nebula API key.',
          hint: 'Generate an API key in your customer workspace at https://nebulacomponents.com/workspace?tab=settings',
        },
        { status: 401 }
      )
    }
  }

  try {
    const res = await fetch(`${API_BASE}/audit/${auditId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: `Audit with ID '${auditId}' not found.` }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch audit data.' }, { status: res.status })
    }

    const auditData = await res.json()
    const payload = formatAgentPayload(auditData, isMarkdown)

    if (isMarkdown && typeof payload === 'string') {
      return new NextResponse(payload, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      })
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: 'Internal server error while generating agent fix instructions.',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
