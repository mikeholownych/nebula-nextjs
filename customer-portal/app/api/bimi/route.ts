import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const svg = await readFile(path.join(process.cwd(), 'public/.well-known/bimi.svg'), 'utf8')
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}
