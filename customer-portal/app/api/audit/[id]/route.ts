import { NextRequest, NextResponse } from 'next/server'

/**
 * Fetch audit by ID from database
 * GET /api/audit/[id]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Call FastAPI to fetch audit
    const response = await fetch(`http://127.0.0.1:8001/audit/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Audit not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch audit' },
        { status: 500 }
      )
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      audit_id: data.id,
      url: data.url,
      status: data.status,
      score: data.score ? data.score / 10 : null, // Convert from integer
      grade: data.grade,
      findings: data.findings || [],
      email: data.email,
      name: data.name,
      created_at: data.created_at,
      completed_at: data.completed_at
    })
  } catch (error) {
    console.error('Audit fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
