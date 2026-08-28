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
        AVG(a.score) as avg_score,
        AVG(a.load_time) as avg_load_time,
        AVG(a.fcp) as avg_fcp,
        AVG(a.lcp) as avg_lcp,
        AVG(a.cls) as avg_cls
      FROM audits a
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      GROUP BY a.source
      ORDER BY count DESC
    `)

    const industries = result.rows.map((row: any) => ({
      industry: row.industry,
      count: parseInt(row.count),
      avgScore: parseFloat(row.avg_score?.toFixed(1) || '0'),
      avgLoadTime: parseFloat(row.avg_load_time?.toFixed(1) || '0'),
      avgFcp: parseFloat(row.avg_fcp?.toFixed(1) || '0'),
      avgLcp: parseFloat(row.avg_lcp?.toFixed(1) || '0'),
      avgCls: parseFloat(row.avg_cls?.toFixed(4) || '0'),
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
