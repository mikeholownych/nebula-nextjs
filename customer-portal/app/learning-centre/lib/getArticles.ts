import fs from 'fs'
import path from 'path'

export type ArticleMeta = {
  slug: string
  title: string
  category: string
  description: string
}

const LC_DIR = path.join(process.cwd(), 'app', 'learning-centre')

// Directories that are not article slugs
const SKIP = new Set(['lib', 'citable'])
const HUBS = new Set(['topic-guides'])

function isArticleMeta(meta: unknown, slug: string): meta is ArticleMeta {
  if (typeof meta !== 'object' || meta === null) return false

  const candidate = meta as Record<string, unknown>
  return (
    candidate.slug === slug &&
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    typeof candidate.category === 'string' &&
    candidate.category.trim().length > 0 &&
    typeof candidate.description === 'string' &&
    candidate.description.trim().length > 0
  )
}

function readArticleMeta(metaPath: string, slug: string): ArticleMeta | null {
  try {
    const raw = fs.readFileSync(metaPath, 'utf-8')
    const meta = JSON.parse(raw) as unknown
    const directorySlug = path.basename(path.dirname(metaPath))
    if (!isArticleMeta(meta, directorySlug) && !isArticleMeta(meta, slug)) {
      throw new Error('must provide a non-empty slug, title, description, and category matching its directory')
    }

    return { ...meta, slug }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      const detail = error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid Learning Centre metadata for "${slug}": ${detail}`)
    }

    // Keep production rendering available if a malformed sidecar reaches a deployment.
    return null
  }
}

function collectArticles(directory: string, prefix = ''): ArticleMeta[] {
  const articles: ArticleMeta[] = []

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (SKIP.has(entry.name)) continue
    if (entry.name.startsWith('[')) continue

    const relativeSlug = prefix ? `${prefix}/${entry.name}` : entry.name
    const articleDir = path.join(directory, entry.name)
    const pagePath = path.join(articleDir, 'page.tsx')
    const metaPath = path.join(articleDir, 'meta.json')
    const hasArticleSidecars = fs.existsSync(pagePath) && fs.existsSync(metaPath)

    // Hubs may have their own metadata, but they are navigation containers,
    // never article records. Continue scanning them for nested articles.
    if (hasArticleSidecars && !HUBS.has(relativeSlug)) {
      const meta = readArticleMeta(metaPath, relativeSlug)
      if (meta) articles.push(meta)
    }

    if (!hasArticleSidecars || HUBS.has(relativeSlug)) {
      articles.push(...collectArticles(articleDir, relativeSlug))
    }
  }

  return articles
}

export function getArticles(directory = LC_DIR): ArticleMeta[] {
  return collectArticles(directory)
}
