import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { industries, days = 30 } = data

    if (!industries || !Array.isArray(industries) || industries.length === 0) {
      return NextResponse.json(
        { error: 'industries array is required' },
        { status: 400 }
      )
    }

    const result = await auditPool.query(`
      SELECT 
        a.source as industry,
        COUNT(*) as count,
      AVG(a.score) as avg_score,
      COUNT(*) as count
      FROM audits a
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      AND a.source = ANY($1)
      GROUP BY a.source
      ORDER BY avg_score DESC
    `, [industries])

    const comparisons = result.rows.map((row: any) => ({
      industry: row.industry,
      count: parseInt(row.count),
      avgScore: parseFloat(row.avg_score?.toFixed(1) || '0'),
    }))

    return NextResponse.json({
      comparisons,
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
