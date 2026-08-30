import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { url } = data

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      )
    }

    let lead = await auditPool.query(`
      SELECT id, url, score, factors FROM leads WHERE url = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [url])

    let leadRecordId: string
    if (lead.rows.length === 0) {
      const result = await auditPool.query(`
        INSERT INTO leads (url, score, factors)
        VALUES ($1, 0, '{}')
        RETURNING id
      `, [url])
      leadRecordId = result.rows[0].id
    } else {
      leadRecordId = lead.rows[0].id
    }

    const factors = {
      industry_fit: 10,
      page_speed: 10,
      ad_spend: 10,
      content_quality: 10,
      technical_health: 10,
    }
    const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0)

    const grade = getGradeFromScore(totalScore)

    await auditPool.query(`
      UPDATE leads
      SET score = $1,
          factors = $2,
          last_scored_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
    `, [totalScore, JSON.stringify(factors), leadRecordId])

    return NextResponse.json({
      leadId: leadRecordId,
      url,
      score: totalScore,
      maxScore: 100,
      grade,
      factors,
      last_updated: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

function getGradeFromScore(score: number): string {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}
