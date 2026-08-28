import { NextResponse } from 'next/server'
import { createABTest, activateABTest, stopABTest, getABTestResults } from '@/app/lib/ab-tests'
import { auditPool } from '@/app/lib/audit-db'

export async function GET() {
  try {
    const tests = await auditPool.query(`
      SELECT id, name, status, created_at, started_at, completed_at
      FROM ab_tests
      ORDER BY created_at DESC
      LIMIT 50
    `)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tests: tests.rows,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const test = await createABTest({
      name: body.name,
      description: body.description,
      url: body.url,
      originalContent: body.originalContent,
      variantContent: body.variantContent,
      targetMetric: body.targetMetric || 'conversion_rate',
      trafficSplit: body.trafficSplit || 0.5,
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...test,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
