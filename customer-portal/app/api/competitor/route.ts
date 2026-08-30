import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET() {
  try {
    const result = await auditPool.query(`
      SELECT * FROM competitor_pricing
      WHERE status = 'active'
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      competitors: result.rows,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, url, currentPrice } = data

    if (!name || !url || currentPrice === undefined) {
      return NextResponse.json(
        { error: 'name, url, and currentPrice are required' },
        { status: 400 }
      )
    }

    const result = await auditPool.query(`
      INSERT INTO competitor_pricing (name, url, price, interval, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, url, currentPrice, 'monthly', 'active'])

    return NextResponse.json({
      competitor: result.rows[0],
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
