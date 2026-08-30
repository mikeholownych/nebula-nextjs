import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitorId: string }> }
) {
  const { competitorId } = await params
  
  try {
    const data = await request.json()
    const { newPrice } = data

    if (newPrice === undefined) {
      return NextResponse.json(
        { error: 'newPrice is required' },
        { status: 400 }
      )
    }

    const currentResult = await auditPool.query(`
      SELECT id, price FROM competitor_pricing WHERE id = $1
    `, [competitorId])

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const currentPrice = parseFloat(currentResult.rows[0].price)

    if (currentPrice === newPrice) {
      await auditPool.query(`
        UPDATE competitor_pricing SET last_checked_at = NOW() WHERE id = $1
      `, [competitorId])

      return NextResponse.json({
        competitor: currentResult.rows[0],
        changed: false,
        message: 'No price change',
      })
    }

    const percentChange = ((newPrice - currentPrice) / currentPrice) * 100

    await auditPool.query(`
      INSERT INTO competitor_price_changes (competitor_id, old_price, new_price, percent_change)
      VALUES ($1, $2, $3, $4)
    `, [competitorId, currentPrice, newPrice, percentChange])

    const result = await auditPool.query(`
      UPDATE competitor_pricing 
      SET price = $1, last_checked_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [newPrice, competitorId])

    return NextResponse.json({
      competitor: result.rows[0],
      change: {
        oldPrice: currentPrice,
        newPrice,
        percentChange,
      },
      changed: true,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
