import { NextResponse } from 'next/server'
import { getRetentionMetrics } from '@/app/lib/churn-prediction'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const metrics = await getRetentionMetrics(days)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      ...metrics,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
