import { NextResponse } from 'next/server'
import { redeemReferralCode } from '@/app/lib/referral-program'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    // Get current user from session (stub)
    const currentUserId = '00000000-0000-0000-0000-000000000001'

    const result = await redeemReferralCode(code, currentUserId)

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const body = await request.json()
  const { newCustomerId } = body

  try {
    const result = await redeemReferralCode(code, newCustomerId)

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
