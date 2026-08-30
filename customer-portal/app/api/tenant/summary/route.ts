import { NextResponse } from 'next/server'
import { getTenantAuditSummary } from '@/app/lib/multi-tenant-reporting'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const days = parseInt(searchParams.get('days') || '30')

  if (!tenantId) {
    return NextResponse.json(
      { error: 'tenant_id query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const summary = await getTenantAuditSummary(tenantId, days)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      ...summary,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
