import { NextResponse } from 'next/server'
import { calculateChurnRisk, getChurningCustomers, getRetentionMetrics } from '@/app/lib/churn-prediction'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '90')
  const customerId = searchParams.get('customer_id')

  try {
    if (customerId) {
      // Single customer risk assessment
      const risk = await calculateChurnRisk(customerId, days)
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        ...risk,
      })
    }

    // Get all churning customers
    const churning = await getChurningCustomers(days)
    const retention = await getRetentionMetrics(days)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      churning,
      retention,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
