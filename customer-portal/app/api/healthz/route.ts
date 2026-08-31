import { NextResponse } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function deployedBuildId(): string {
  const configured = process.env.BUILD_ID || process.env.NEBULA_BUILD_REVISION
  if (configured) return configured
  try {
    const parsed = JSON.parse(
      readFileSync(join(process.cwd(), 'app/lib/build-info.json'), 'utf8'),
    ) as { revision?: unknown }
    if (typeof parsed.revision === 'string' && parsed.revision.length > 0) return parsed.revision
  } catch {
    // Health remains available even when build metadata is absent in development.
  }
  return 'development'
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      build_id: deployedBuildId(),
      message: 'Customer portal health check',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
