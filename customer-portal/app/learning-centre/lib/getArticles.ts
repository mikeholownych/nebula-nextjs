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

export function getArticles(): ArticleMeta[] {
  const entries = fs.readdirSync(LC_DIR, { withFileTypes: true })
  const articles: ArticleMeta[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (SKIP.has(entry.name)) continue
    if (entry.name.startsWith('[')) continue

    const metaPath = path.join(LC_DIR, entry.name, 'meta.json')
    if (!fs.existsSync(metaPath)) continue

    try {
      const raw = fs.readFileSync(metaPath, 'utf-8')
      const meta = JSON.parse(raw) as unknown
      if (!isArticleMeta(meta, entry.name)) {
        throw new Error('must provide a non-empty slug, title, description, and category matching its directory')
      }

      articles.push(meta)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        const detail = error instanceof Error ? error.message : String(error)
        throw new Error(`Invalid Learning Centre metadata for "${entry.name}": ${detail}`)
      }

      // Keep production rendering available if a malformed sidecar reaches a deployment.
    }
  }

  return articles
}
