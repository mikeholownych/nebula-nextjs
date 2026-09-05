import Link from 'next/link'
import { listArticles } from '@/app/lib/blog/loader'
import { type BlogArticle } from '@/app/lib/blog/types'
import { articleTitle, answerDescription } from './lib/render-markdown'

const laneCopy = {
  acquisition: 'Acquisition',
  feature: 'Feature',
} as const

function Card({ article }: { article: BlogArticle }) {
  return <article className="rounded-lg border border-border bg-bg-panel p-6">
    <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">{laneCopy[article.content_lane]}</p>
    <h3 className="mt-3 text-xl font-semibold"><Link href={`/blog/${article.slug}`} className="hover:text-accent">{articleTitle(article)}</Link></h3>
    <p className="mt-3 text-sm text-fg-muted">{answerDescription(article)}</p>
    <Link href={`/blog/${article.slug}`} className="mt-5 inline-block text-sm text-accent underline underline-offset-4">Read the field note</Link>
  </article>
}

export default async function BlogIndex() {
  const [acquisition, feature] = await Promise.all([
    listArticles({ lane: 'acquisition' }),
    listArticles({ lane: 'feature' }),
  ])
  return <main id="main-content" className="min-h-screen bg-bg">
    <section className="nebula-frame border-b border-border px-6 pb-16 pt-28 lg:px-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Nebula Components / Blog</p>
      <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">The Nebula field notes</h1>
      <p className="mt-6 max-w-2xl text-lg text-fg-muted">Practical answers about landing-page conversion, paid traffic, and the product decisions behind an evidence-backed audit.</p>
    </section>
    <div className="nebula-frame grid gap-12 px-6 py-14 lg:grid-cols-2 lg:px-12">
      <section aria-labelledby="acquisition-heading"><h2 id="acquisition-heading" className="mb-6 text-2xl font-semibold">Acquisition</h2><div className="grid gap-5">{acquisition.map((article) => <Card key={article.slug} article={article} />)}</div></section>
      <section aria-labelledby="feature-heading"><h2 id="feature-heading" className="mb-6 text-2xl font-semibold">Feature</h2><div className="grid gap-5">{feature.map((article) => <Card key={article.slug} article={article} />)}</div></section>
    </div>
  </main>
}

export const metadata = { title: 'Blog | Nebula Components', description: 'Evidence-backed field notes on landing-page conversion and product progress.', alternates: { canonical: 'https://nebulacomponents.com/blog' } }
