import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ competitorId: string }> }
) {
  const { competitorId } = await params
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const historyResult = await auditPool.query(`
      SELECT * FROM competitor_price_changes
      WHERE competitor_id = $1
      AND change_date > NOW() - INTERVAL '${days} days'
      ORDER BY change_date DESC
    `, [competitorId])

    return NextResponse.json({
      competitorId,
      days,
      history: historyResult.rows,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
