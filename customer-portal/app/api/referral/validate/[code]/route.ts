import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const result = await auditPool.query(`
      SELECT c.email, rc.redeemed_at
      FROM referral_codes rc
      JOIN customers c ON rc.customer_id = c.id
      WHERE UPPER(rc.referral_code) = $1
    `, [code])

    if (result.rows.length === 0) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid referral code',
      })
    }

    const redemptionResult = await auditPool.query(`
      SELECT COUNT(*) as count FROM referral_redemptions rr
      JOIN referral_codes rc ON rr.referral_code_id = rc.id
      WHERE rc.referral_code = $1
    `, [code])

    const redemptionCount = parseInt(redemptionResult.rows[0].count)

    return NextResponse.json({
      valid: true,
      referrerEmail: result.rows[0].email,
      redemptionCount,
      creditAmount: 50,
      message: 'Referral code is valid!',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
