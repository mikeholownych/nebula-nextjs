import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

interface UpstreamMonitorEvent {
  id?: string
  audit_id?: string | null
  status?: string
  prev_score?: number | null
  new_score?: number | null
  summary?: string
  created_at?: string | null
}

interface UpstreamMonitor {
  id?: string
  url?: string
  cadence?: string
  active?: boolean
  next_run_at?: string | null
  last_run_at?: string | null
  last_score?: number | null
  created_at?: string | null
  events?: UpstreamMonitorEvent[]
}

/**
 * Workspace monitor list backed by the platform engine.
 * GET /api/monitors-engine
 *
 * Session identity is authoritative; the email is resolved server-side via
 * requireWorkspaceUser and forwarded as the explicit upstream query field
 * (matched byte-for-byte by the platform's tenant binding). Headers spread
 * authHeaders first and the internal bearer LAST so the lowercase
 * `authorization` collision resolves to the internal secret (phase 1
 * lesson); the forwarded cookie still wins upstream principal resolution.
 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  try {
    const email = auth.user.email
    const response = await fetch(
      `${API_BASE}/audit/monitors?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}))
      return NextResponse.json(detail, { status: response.status })
    }

    const data = await response.json() as { monitors?: UpstreamMonitor[] }
    const monitors = (Array.isArray(data.monitors) ? data.monitors : []).map((m) => ({
      id: String(m.id),
      url: m.url ?? '',
      cadence: m.cadence === 'monthly' ? ('monthly' as const) : ('weekly' as const),
      active: Boolean(m.active),
      nextRunAt: m.next_run_at ?? null,
      lastRunAt: m.last_run_at ?? null,
      lastScore: typeof m.last_score === 'number' ? m.last_score : null,
      createdAt: m.created_at ?? null,
      events: (Array.isArray(m.events) ? m.events : []).map((e) => ({
        id: String(e.id),
        auditId: e.audit_id ?? null,
        status: e.status ?? 'no_change',
        prevScore: typeof e.prev_score === 'number' ? e.prev_score : null,
        newScore: typeof e.new_score === 'number' ? e.new_score : null,
        summary: e.summary ?? '',
        createdAt: e.created_at ?? null,
      })),
    }))
    return NextResponse.json({ monitors })
  } catch (error) {
    console.error('Monitors engine list error:', error)
    return NextResponse.json(
      { error: 'Failed to load monitors' },
      { status: 500 }
    )
  }
}
