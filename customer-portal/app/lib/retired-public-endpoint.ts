import { NextResponse } from 'next/server'

/** Integrity containment: no auth bypass, database access or upstream calls. */
export function retiredPublicEndpoint(request?: Request, context?: unknown) {
  void request
  void context
  return NextResponse.json(
    { error: 'Endpoint unavailable', code: 'ENDPOINT_RETIRED' },
    { status: 410, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  )
}
