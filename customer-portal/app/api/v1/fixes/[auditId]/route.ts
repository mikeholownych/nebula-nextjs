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
    const emailRaw = data.email || data.workspace_email
    const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : undefined
    return { valid: data.valid === true, email, plan: data.plan }
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

  if (!rawKey.startsWith('nbk_')) {
    return NextResponse.json(
      {
        error: 'Nebula API key required.',
        code: 'AUTH_REQUIRED',
        hint: 'Generate an API key in your customer workspace at https://app.nebulacomponents.com/settings',
      },
      { status: 401 }
    )
  }
  const keyAuth = await validateKey(rawKey)
  if (!keyAuth.valid) {
    return NextResponse.json(
      {
        error: 'Invalid or expired Nebula API key.',
        code: 'AUTH_REQUIRED',
        hint: 'Generate an API key in your customer workspace at https://app.nebulacomponents.com/settings',
      },
      { status: 401 }
    )
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
    const owner = typeof auditData.email === 'string' ? auditData.email.trim().toLowerCase() : ''
    const keyEmail = typeof keyAuth.email === 'string' ? keyAuth.email.trim().toLowerCase() : ''
    if (!keyEmail || !owner || owner !== keyEmail) {
      return NextResponse.json({ error: `Audit with ID '${auditId}' not found.` }, { status: 404 })
    }
    const rowStatus = typeof auditData.status === 'string' ? auditData.status : ''
    if (rowStatus === 'pending' || rowStatus === 'running') {
      return NextResponse.json(
        {
          protocol: 'nebula-agent-fix/v1',
          status: 'pending',
          audit_id: auditId,
          url: typeof auditData.url === 'string' ? auditData.url : undefined,
          message: 'Audit accepted. Poll GET /api/v1/fixes/{audit_id} when complete.',
        },
        { status: 202 },
      )
    }
    if (rowStatus === 'failed') {
      return NextResponse.json(
        {
          protocol: 'nebula-agent-fix/v1',
          status: 'failed',
          audit_id: auditId,
          error: 'Audit failed. Re-submit the URL to enqueue a new run.',
        },
        { status: 422 },
      )
    }
    if (rowStatus && rowStatus !== 'completed') {
      return NextResponse.json({ error: `Audit with ID '${auditId}' not found.` }, { status: 404 })
    }
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
