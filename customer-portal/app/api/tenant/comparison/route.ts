import { NextResponse } from 'next/server'
import { getTenantComparison } from '@/app/lib/multi-tenant-reporting'

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
    const comparison = await getTenantComparison(tenantId, days)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      ...comparison,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
