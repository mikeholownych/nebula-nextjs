import { NextResponse } from 'next/server'

const unavailable = () =>
  NextResponse.json({ code: 'AUDIT_REBUILD_IN_PROGRESS' }, { status: 503 })

/**
 * Audit generation is deliberately unavailable until the real audit engine is
 * enabled. Returning a stable maintenance response prevents synthetic scores
 * from being mistaken for analysis.
 */
export async function POST() {
  return unavailable()
}

export async function GET() {
  return unavailable()
}
