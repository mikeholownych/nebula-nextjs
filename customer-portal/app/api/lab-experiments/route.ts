import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

const INTERNAL_SECRET = (process.env.INTERNAL_API_SECRET || '').trim()

/**
 * Lab experiments (Component Lab History)
 * GET /api/lab-experiments?email=...   → list saved experiments
 * POST /api/lab-experiments            → save a lab run
 */
export async function GET(request: NextRequest) {
  // Check for internal API secret authorization (for workspace-app proxy)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ') && INTERNAL_SECRET) {
    const token = authHeader.slice(7)
    if (token === INTERNAL_SECRET) {
      // Internal auth successful, get email from query param
      const email = request.nextUrl.searchParams.get('email')
      if (!email || email.length < 3 || email.length > 320) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
      }
      try {
        const response = await fetch(
          `${API_BASE}/audit/lab-experiments?email=${encodeURIComponent(email)}`,
          { signal: AbortSignal.timeout(10000) }
        )

        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to load experiments' },
            { status: response.status }
          )
        }
        const data = await response.json()
        return NextResponse.json(data)
      } catch (error) {
        console.error('Lab experiments list error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  }

  // Fall back to regular workspace user authentication
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const email = auth.user.email
    if (!email || email.length < 3 || email.length > 320) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const response = await fetch(
      `${API_BASE}/audit/lab-experiments?email=${encodeURIComponent(email)}`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to load experiments' },
        { status: response.status }
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Lab experiments list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { url, label, score, grade, components, adCopy } = body
    const email = auth.user.email

    const response = await fetch(`${API_BASE}/audit/lab-experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
      body: JSON.stringify({ url, label, score, grade, components, adCopy, email }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to save experiment' },
        { status: response.status }
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Lab experiment save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const { id } = await request.json()
    const response = await fetch(`${API_BASE}/audit/lab-experiments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete experiment' },
        { status: response.status }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lab experiment delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
