import { NextResponse } from 'next/server'
import { getTenantWeakSpots } from '@/app/lib/multi-tenant-reporting'

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
    const weakSpots = await getTenantWeakSpots(tenantId, days)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tenantId,
      days,
      weakSpots: weakSpots.weakSpots ?? weakSpots,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
