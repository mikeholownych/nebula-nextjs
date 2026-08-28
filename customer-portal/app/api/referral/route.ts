import { NextResponse } from 'next/server'
import { generateReferralCode, redeemReferralCode, getReferralMetrics, createReferralTables } from '@/app/lib/referral-program'
import { auditPool } from '@/app/lib/audit-db'

// Ensure tables exist
await createReferralTables()

// GET /api/referral - Get referral link for current user
export async function GET(request: Request) {
  const url = new URL(request.url)
  const authUser = url.searchParams.get('user')

  if (!authUser) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // For now, using a fixed user ID for testing
  // In production, extract from session
  const customerId = '00000000-0000-0000-0000-000000000001'

  try {
    const metrics = await getReferralMetrics(customerId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...metrics,
      referralLink: `https://nebulacomponents.com/referral/${metrics.referralCode}`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET /api/referral/validate/[code] - Validate a referral code
export async function GET_Validate(
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

// POST /api/referral/redeem - Redeem a referral code
export async function POST(request: Request) {
  const body = await request.json()
  const { referralCode, newCustomerId } = body

  if (!referralCode || !newCustomerId) {
    return NextResponse.json(
      { error: 'referralCode and newCustomerId are required' },
      { status: 400 }
    )
  }

  try {
    const result = await redeemReferralCode(referralCode, newCustomerId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
