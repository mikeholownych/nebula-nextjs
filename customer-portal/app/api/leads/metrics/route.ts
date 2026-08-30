import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const totalResult = await auditPool.query(`
      SELECT COUNT(*) as total
      FROM leads
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `)

    const scoredResult = await auditPool.query(`
      SELECT COUNT(*) as scored
      FROM leads
      WHERE last_scored_at > NOW() - INTERVAL '${days} days'
    `)

    const gradesResult = await auditPool.query(`
      SELECT 
        CASE 
          WHEN score >= 80 THEN 'A'
          WHEN score >= 60 THEN 'B'
          WHEN score >= 40 THEN 'C'
          WHEN score >= 20 THEN 'D'
          ELSE 'F'
        END as grade,
        COUNT(*) as count
      FROM leads
      GROUP BY grade
      ORDER BY grade DESC
    `)

    const avgResult = await auditPool.query(`
      SELECT AVG(score) as avg
      FROM leads
      WHERE last_scored_at IS NOT NULL
    `)

    const grades = gradesResult.rows.reduce((acc: Record<string, number>, row: { grade: string; count: string }) => {
      acc[row.grade] = parseInt(row.count)
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalLeads: parseInt(totalResult.rows[0].total),
      scoredLeads: parseInt(scoredResult.rows[0].scored),
      grades,
      avgScore: parseFloat(String(avgResult.rows[0].avg))?.toFixed(1) || '0',
      days,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
