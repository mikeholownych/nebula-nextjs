import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import {
  ACQUISITION_POST_TYPES,
  ARTICLE_STATUSES,
  FEATURE_POST_TYPES,
  type ArticleStatus,
  type BlogArticle,
  type ContentLane,
} from './types'

export type SourceIndex = ReadonlySet<string> | readonly string[] | Record<string, unknown>

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const PUBLIC_STATUSES = new Set<ArticleStatus>(['approved', 'published'])
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_CONTENT_ROOT = path.resolve(MODULE_DIR, '../../../../content')
const LOCAL_BLOG_CONTENT_ROOT = path.resolve(MODULE_DIR, '../../blog/content')
const CONTENT_DIRS = ['published', 'drafts', 'briefs', 'archived'] as const
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function contentRoot(): string {
  const configuredRoot = process.env.NEBULA_CONTENT_ROOT?.trim()
  return configuredRoot ? path.resolve(configuredRoot) : DEFAULT_CONTENT_ROOT
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid article field: ${field}`)
  }
}

function assertOptionalString(value: unknown, field: string): asserts value is string | undefined {
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`Invalid article field: ${field}`)
  }
}

function assertNullableString(value: unknown, field: string): asserts value is string | null | undefined {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new Error(`Invalid article field: ${field}`)
  }
}

function assertEnum<T extends string>(value: unknown, field: string, values: readonly T[]): asserts value is T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`Unsupported ${field}: ${String(value)}`)
  }
}

function parseFrontmatter(source: string, sourcePath: string): { data: Record<string, unknown>; body: string } {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/)
  if (!match) throw new Error(`Missing frontmatter: ${sourcePath}`)
  const data = parseYaml(match[1])
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Frontmatter must be an object: ${sourcePath}`)
  }
  return { data: data as Record<string, unknown>, body: match[2] }
}

export function parseArticle(source: string, sourcePath = 'article.md'): BlogArticle {
  const { data, body } = parseFrontmatter(source, sourcePath)
  assertString(data.slug, 'slug')
  if (!SLUG_PATTERN.test(data.slug)) throw new Error(`Invalid article slug: ${data.slug}`)
  assertEnum(data.status, 'article status', ARTICLE_STATUSES)
  assertEnum(data.content_lane, 'content lane', ['acquisition', 'feature'] as const)
  const postTypes = data.content_lane === 'acquisition' ? ACQUISITION_POST_TYPES : FEATURE_POST_TYPES
  assertEnum(data.post_type, 'post type', postTypes)
  assertString(data.author_id, 'author_id')
  assertString(data.category, 'category')
  assertString(data.purpose, 'purpose')
  assertString(data.commercial_role, 'commercial_role')
  assertString(data.evidence_level, 'evidence_level')
  assertOptionalString(data.primary_query, 'primary_query')
  assertNullableString(data.published_at, 'published_at')
  assertNullableString(data.updated_at, 'updated_at')
  assertNullableString(data.reviewed_by, 'reviewed_by')
  if (!Array.isArray(data.source_refs) || data.source_refs.length === 0 || !data.source_refs.every((ref) => typeof ref === 'string' && ref.trim())) {
    throw new Error('Invalid source_refs: at least one source reference is required')
  }
  if (data.supporting_queries !== undefined && (!Array.isArray(data.supporting_queries) || !data.supporting_queries.every((query) => typeof query === 'string'))) {
    throw new Error('Invalid article field: supporting_queries')
  }

  return {
    slug: data.slug,
    status: data.status,
    content_lane: data.content_lane,
    post_type: data.post_type,
    author_id: data.author_id,
    category: data.category,
    primary_query: data.primary_query,
    supporting_queries: data.supporting_queries as string[] | undefined,
    purpose: data.purpose,
    commercial_role: data.commercial_role,
    evidence_level: data.evidence_level,
    source_refs: data.source_refs as string[],
    published_at: data.published_at ?? null,
    updated_at: data.updated_at ?? null,
    reviewed_by: data.reviewed_by ?? null,
    body,
    sourcePath,
  }
}

function hasSource(sourceIndex: SourceIndex, ref: string): boolean {
  if (sourceIndex instanceof Set) return sourceIndex.has(ref)
  if (Array.isArray(sourceIndex)) return sourceIndex.includes(ref)
  return Object.prototype.hasOwnProperty.call(sourceIndex, ref)
}

export function validateSourceRefs(article: BlogArticle, sourceIndex: SourceIndex): ValidationResult {
  const errors = article.source_refs.filter((ref) => !hasSource(sourceIndex, ref)).map((ref) => `Missing source reference: ${ref}`)
  return { valid: errors.length === 0, errors }
}

function assertSafeSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug) || slug.includes('..')) throw new Error(`Invalid article slug: ${slug}`)
}

async function articleFiles(): Promise<string[]> {
  const files: string[] = []
  const root = contentRoot()
  const roots = root === DEFAULT_CONTENT_ROOT ? [root, LOCAL_BLOG_CONTENT_ROOT] : [root]
  for (const candidateRoot of roots) {
    const directories = candidateRoot === LOCAL_BLOG_CONTENT_ROOT ? [''] : CONTENT_DIRS
    for (const directory of directories) {
      const dir = path.join(candidateRoot, directory)
      let entries
      try { entries = await readdir(dir, { withFileTypes: true }) } catch { continue }
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) files.push(path.join(dir, entry.name))
      }
    }
  }
  return [...new Set(files)].sort()
}

export async function loadArticle(slug: string): Promise<BlogArticle | null> {
  assertSafeSlug(slug)
  const files = await articleFiles()
  for (const file of files) {
    if (path.basename(file, path.extname(file)) !== slug) continue
    const article = parseArticle(await readFile(file, 'utf8'), path.relative(contentRoot(), file))
    return PUBLIC_STATUSES.has(article.status) ? article : null
  }
  return null
}

export async function listArticles(filter?: { lane?: ContentLane; status?: ArticleStatus }): Promise<BlogArticle[]> {
  const articles: BlogArticle[] = []
  for (const file of await articleFiles()) {
    const article = parseArticle(await readFile(file, 'utf8'), path.relative(contentRoot(), file))
    if (!PUBLIC_STATUSES.has(article.status)) continue
    if (filter?.lane && article.content_lane !== filter.lane) continue
    if (filter?.status && article.status !== filter.status) continue
    articles.push(article)
  }
  return articles.sort((a, b) => a.slug.localeCompare(b.slug))
}
