import { NextRequest, NextResponse } from 'next/server'

/**
 * Send audit results via email
 * POST /api/audit/email
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward to FastAPI
    const response = await fetch('http://127.0.0.1:8001/audit/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: body.url,
        email: body.email,
        name: body.name,
        score: body.score,
        grade: body.grade,
        findings: body.findings,
      }),
    })

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { status: 'error', error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
