import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadArticle } from '@/app/lib/blog/loader'
import { articleTitle, renderMarkdown, answerDescription } from '../lib/render-markdown'
import { BlogAuditCTA } from '../components/BlogAuditCTA'

const BASE_URL = 'https://nebulacomponents.com'
const author = { name: 'Mike Holownych', url: `${BASE_URL}/about/team` }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let article
  try {
    article = await loadArticle((await params).slug)
  } catch {
    return { title: 'Article not found | Nebula Components' }
  }
  if (!article) return { title: 'Article not found | Nebula Components' }
  const title = articleTitle(article)
  const canonical = `${BASE_URL}/blog/${article.slug}`
  return {
    title,
    description: answerDescription(article),
    authors: [{ name: author.name }],
    alternates: { canonical },
    openGraph: { type: 'article', title, description: answerDescription(article), url: canonical, publishedTime: article.published_at || undefined, modifiedTime: article.updated_at || undefined, authors: [author.name] },
  }
}

function schemaFor(article: NonNullable<Awaited<ReturnType<typeof loadArticle>>>) {
  const title = articleTitle(article)
  const canonical = `${BASE_URL}/blog/${article.slug}`
  const faq = article.body.match(/##\s+(?:FAQ|What questions does this FAQ answer\?)\s*\n([\s\S]*)$/i)?.[1]
  const questions = faq ? [...faq.matchAll(/###\s+(.+?)\n([\s\S]*?)(?=\n###\s+|$)/g)].map(([, question, answer]) => ({ '@type': 'Question', name: question.trim(), acceptedAnswer: { '@type': 'Answer', text: answer.trim().replace(/\s+/g, ' ') } })) : []
  return [
    { '@context': 'https://schema.org', '@type': 'Article', headline: title, description: answerDescription(article), url: canonical, datePublished: article.published_at, dateModified: article.updated_at || article.published_at, author: { '@type': 'Person', name: author.name, url: author.url }, publisher: { '@type': 'Organization', name: 'Nebula Components', url: BASE_URL } },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Nebula Components', url: BASE_URL },
    { '@context': 'https://schema.org', '@type': 'Person', name: author.name, url: author.url },
    ...(questions.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions }] : []),
  ]
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  let article
  try {
    article = await loadArticle((await params).slug)
  } catch {
    notFound()
  }
  if (!article) notFound()
  const isCommercial = article.commercial_role === 'audit-entry'
  return <main id="main-content" className="min-h-screen bg-bg"><article className="nebula-frame px-6 pb-20 pt-28 lg:px-12">
    <header className="max-w-3xl border-b border-border pb-10"><p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{article.content_lane} / {article.category}</p><h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">{articleTitle(article)}</h1><p className="mt-5 text-sm text-fg-muted">By <a href={author.url} className="underline underline-offset-4">{author.name}</a>, Founder of Nebula Components. Published: {article.published_at || 'not available'}. Updated: {article.updated_at || article.published_at || 'not available'}.</p>{article.header_image && <div className="mt-8 overflow-hidden rounded-lg"><img src={article.header_image} alt={articleTitle(article)} width={1200} height={630} className="w-full object-cover" /></div>}</header>
    <div className="blog-prose mt-10 max-w-3xl">{renderMarkdown(article.body.replace(/^#\s+.+\n+/, ''))}</div>
    {isCommercial && <BlogAuditCTA slug={article.slug} contentLane={article.content_lane} postType={article.post_type} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFor(article)) }} />
  </article></main>
}
