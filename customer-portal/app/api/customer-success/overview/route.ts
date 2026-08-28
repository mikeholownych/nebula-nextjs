import { NextResponse } from 'next/server'
import { getCustomerSuccessOverview } from '@/app/lib/customer-success'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '30')

  try {
    const overview = await getCustomerSuccessOverview(days)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      ...overview,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
