import { NextResponse } from 'next/server'

/**
 * Public audit email capture is disabled while the deterministic audit and
 * authenticated persistence path are rebuilt. Do not accept or persist PII.
 */
export async function POST() {
  return NextResponse.json(
    { code: 'AUDIT_EMAIL_CAPTURE_REBUILD_IN_PROGRESS' },
    { status: 503 },
  )
}
