import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

/**
 * Fix Implementation Library - provides social proof and effectiveness data for fixes
 * GET /api/fix-library?finding_key=...  (get effectiveness for a specific fix)
 * GET /api/fix-library?limit=...        (get top fixes by effectiveness)
 * GET /api/fix-library/history?email=... (get user's fix implementation history)
 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  
  try {
    const { searchParams } = new URL(request.url)
    const email = auth.user.email
    const finding_key = searchParams.get('finding_key')
    const limitParam = searchParams.get('limit')
    const history = searchParams.get('history')
    
    if (history) {
      // Get user's fix implementation history
      if (!email || email.length < 3 || email.length > 320) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
      }
      
      const limit = history === 'true' ? 10 : parseInt(history)
      const response = await fetch(
        `${process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/fix-history?email=${encodeURIComponent(email)}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      )
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to load fix history' },
          { status: response.status }
        )
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    } else if (finding_key) {
      // Get effectiveness for a specific finding
      const response = await fetch(
        `${process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/fix-effectiveness?finding_key=${encodeURIComponent(finding_key)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      )
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to load fix effectiveness' },
          { status: response.status }
        )
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // Get top fixes by effectiveness (library view)
      const limit = limitParam ? parseInt(limitParam) : 10
      const response = await fetch(
        `${process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/fix-library?limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      )
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to load fix library' },
          { status: response.status }
        )
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Fix library error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}