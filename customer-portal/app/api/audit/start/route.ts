import { NextRequest, NextResponse } from 'next/server'
import { getPostHogClient } from '@/app/lib/posthog-server'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'

/**
 * Start an audit by calling FastAPI directly
 * POST /api/audit/start
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, email, name } = body

    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Process URL
    let processedUrl = url.trim()
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(processedUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Ensure public HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'URL must be HTTP or HTTPS' },
        { status: 400 }
      )
    }

    // Block loopback/link-local/private/cloud-metadata targets (SSRF guard)
    try {
      await assertPublicHttpUrl(parsedUrl)
    } catch {
      return NextResponse.json(
        { error: 'URL is not a public address' },
        { status: 400 }
      )
    }

    // Call FastAPI directly
    const apiResponse = await fetch('http://127.0.0.1:8001/audit/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: processedUrl,
        email: email || 'pending@example.com',
        name: name || null
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout
    })
    
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: 'Audit service unavailable' },
        { status: 503 }
      )
    }
    
    const data = await apiResponse.json()

    const distinctId = request.headers.get('X-POSTHOG-DISTINCT-ID') ?? `anon_audit_${data.audit_id}`
    try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId,
        event: 'audit_started',
        properties: {
          audit_id: data.audit_id,
          page_url: processedUrl,
          page_domain: parsedUrl.hostname,
          score: data.score,
          grade: data.grade,
        },
      })
      await ph.flush()
    } catch {
      // Non-fatal — never let analytics block the response
    }

    return NextResponse.json({
      audit_id: data.audit_id,
      url: data.url,
      status: data.status,
      score: data.score,
      grade: data.grade,
      findings: data.findings,
      message: 'Audit completed'
    })
  } catch (error) {
    console.error('Audit start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
