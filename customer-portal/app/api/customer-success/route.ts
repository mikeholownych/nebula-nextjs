import { NextResponse } from 'next/server'
import { getCustomerSuccessDashboard } from '@/app/lib/customer-success'

export async function GET() {
  // For now, using a fixed customer ID
  // In production, extract from session
  const customerId = '00000000-0000-0000-0000-000000000001'

  try {
    const dashboard = await getCustomerSuccessDashboard(customerId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...dashboard,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
