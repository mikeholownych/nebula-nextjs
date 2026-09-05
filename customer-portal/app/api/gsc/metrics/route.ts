import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const siteUrl = searchParams.get('site_url')
  const days = searchParams.get('days') || '28'
  const projectDomain = searchParams.get('project_domain')

  if (!siteUrl) {
    return NextResponse.json({ error: 'site_url is required' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({ site_url: siteUrl, days })
    if (projectDomain) params.set('project_domain', projectDomain)
    const res = await fetch(`${PLATFORM_API}/api/gsc/metrics?${params}`, {
      headers: authHeaders(req),
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'GSC metrics unavailable' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'GSC service unavailable' }, { status: 503 })
  }
}
