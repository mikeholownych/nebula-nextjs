import { NextResponse } from 'next/server'
import { buildTeardownMarkdown } from '@/app/lib/llms-markdown'

/**
 * Internal route backing the /teardowns/:slug.md rewrite.
 * Public URL: /teardowns/<slug>.md  (see next.config.ts rewrites)
 * Content is generated from the same data.ts source as the HTML page.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const content = buildTeardownMarkdown(slug)
  if (!content) {
    return new NextResponse('Not found', { status: 404 })
  }
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
