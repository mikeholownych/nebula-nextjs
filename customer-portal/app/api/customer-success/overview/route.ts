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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
