import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const result = await auditPool.query(`
      SELECT 
        COALESCE(a.source, 'unknown') as industry,
        COUNT(*) as count,
        AVG(a.score) as avg_score
      FROM audits a
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      GROUP BY a.source
      ORDER BY count DESC
    `)

    const industries = result.rows.map((row: any) => ({
      industry: row.industry,
      count: parseInt(row.count),
      avgScore: parseFloat((row.avg_score || '0').toString().replace(/[^0-9.-]+/g, "")),
    }))

    return NextResponse.json({
      industries,
      days,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
