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
      const meta = JSON.parse(raw) as ArticleMeta
      if (meta.title && meta.category) {
        articles.push({ ...meta, slug: entry.name })
      }
    } catch {
      // malformed meta.json — skip silently
    }
  }

  return articles
}
