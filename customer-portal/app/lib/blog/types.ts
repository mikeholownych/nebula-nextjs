export const ARTICLE_STATUSES = [
  'idea',
  'briefed',
  'drafted',
  'evidence_review',
  'editorial_review',
  'approved',
  'published',
  'refresh_due',
  'archived',
] as const

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number]
export type ContentLane = 'acquisition' | 'feature'

export const ACQUISITION_POST_TYPES = [
  'diagnostic-guide',
  'symptom-explainer',
  'checklist',
  'comparison',
  'evidence-backed-listicle',
] as const

export const FEATURE_POST_TYPES = [
  'product-progress',
  'building-in-public',
  'assumption-report',
  'failure-and-correction-report',
  'field-note',
  'evidence-backed-listicle',
] as const

export type PostType = (typeof ACQUISITION_POST_TYPES)[number] | (typeof FEATURE_POST_TYPES)[number]

export interface ArticleFrontmatter {
  slug: string
  status: ArticleStatus
  content_lane: ContentLane
  post_type: PostType
  author_id: string
  category: string
  primary_query?: string
  supporting_queries?: string[]
  purpose: string
  commercial_role: string
  evidence_level: string
  source_refs: string[]
  published_at?: string | null
  updated_at?: string | null
  reviewed_by?: string | null
  header_image?: string | null
}

export interface BlogArticle extends ArticleFrontmatter {
  body: string
  sourcePath: string
}
