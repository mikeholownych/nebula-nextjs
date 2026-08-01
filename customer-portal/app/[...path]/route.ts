import { NextResponse } from 'next/server'
import { LLMS_MARKDOWN, buildTeardownMarkdown } from '@/app/lib/llms-markdown'

/**
 * Markdown variant catch-all — serves clean markdown at any public page
 * URL + ".md" per the llms.txt proposal (https://llmstxt.org/):
 * "pages that have information that might be useful for LLMs to read
 * provide a clean markdown version of those pages at the same URL as the
 * original page, but with .md appended."
 *
 * Examples:
 *   /audit.md            → markdown mirror of /audit
 *   /teardowns.md        → teardown index (generated from TEARDOWNS data)
 *   /teardowns/knallhart.md → per-teardown markdown (generated from data)
 *   /resources/citable.md  → markdown mirror of the Citable docs page
 *
 * Next.js does not register dynamic segments containing dots ([slug].md),
 * so we match any path and parse the trailing ".md" here. Non-.md paths
 * that fall through to this catch-all return 404, which matches the
 * behavior of an unmatched route.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  if (!path || path.length === 0) {
    return new NextResponse('Not found', { status: 404 })
  }

  const last = path[path.length - 1]
  if (!last.endsWith('.md')) {
    return new NextResponse('Not found', { status: 404 })
  }
  const slug = last.slice(0, -3)

  // Teardown pages: /teardowns/<slug>.md
  if (path.length === 2 && path[0] === 'teardowns') {
    const content = buildTeardownMarkdown(slug)
    if (content) {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
    return new NextResponse('Not found', { status: 404 })
  }

  // Single-segment pages: /audit.md, /teardowns.md, ...
  // Multi-segment pages (e.g. /resources/citable.md) map by joining segments.
  if (path.length === 1) {
    const content = LLMS_MARKDOWN[slug]
    if (content) {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
  }

  // Multi-segment pages: /resources/citable.md
  if (path.length === 2 && path[0] === 'resources') {
    const content = LLMS_MARKDOWN[`${path[0]}/${slug}`]
    if (content) {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
  }

  return new NextResponse('Not found', { status: 404 })
}
