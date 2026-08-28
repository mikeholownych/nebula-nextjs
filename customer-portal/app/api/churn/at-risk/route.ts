import { NextResponse } from 'next/server'
import { getChurningCustomers } from '@/app/lib/churn-prediction'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '90')

  try {
    const churning = await getChurningCustomers(days)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      ...churning,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
