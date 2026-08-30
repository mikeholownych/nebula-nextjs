import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tier: string }> }
) {
  const { tier } = await params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')

  // Map tier to score range
  const tierRanges: Record<string, [number, number]> = {
    'A': [80, 100],
    'B': [60, 79],
    'C': [40, 59],
    'D': [20, 39],
    'F': [0, 19],
    'all': [0, 100],
  }

  const [minScore, maxScore] = tierRanges[tier] || [0, 100]

  try {
    const result = await auditPool.query(`
      SELECT id, url, score, factors, created_at, last_scored_at
      FROM leads
      WHERE score BETWEEN $1 AND $2
      ORDER BY score DESC
      LIMIT $3
    `, [minScore, maxScore, limit])

    return NextResponse.json({
      tier,
      minScore,
      maxScore,
      leads: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
