import { NextResponse } from 'next/server'

// Returns HTTP 410 Gone for legacy URLs that have no current equivalent.
// Linked from next.config.ts redirects for orphaned static HTML pages.
export function GET() {
  return new NextResponse(
    '<html><body><h1>410 Gone</h1><p>This page has been removed.</p></body></html>',
    {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}
