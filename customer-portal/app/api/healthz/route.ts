import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      build_id: process.env.BUILD_ID || 'unknown',
      message: 'Customer portal health check',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
