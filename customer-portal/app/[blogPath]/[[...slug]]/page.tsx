import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import { OpinlyContent } from '@opinly/react'
import {
  OpinlyJsonLd,
  buildBlogPostingJsonLd,
  buildFaqJsonLd,
  generateOpinlyMetadata,
} from '@opinly/next'
import type { FullPost, Post } from '@opinly/backend'
import {
  OPINLY_BLOG_PATH,
  getOpinlyClient,
  opinlyRenderConfig,
} from '@/app/lib/opinly'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = { blogPath: string; slug?: string[] }

function postHref(slug: string) {
  return `${OPINLY_BLOG_PATH}/${slug}`
}

function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 transition-colors hover:border-[#c7ff2f]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#c7ff2f]">Nebula Components</p>
      <h2 className="text-2xl font-semibold tracking-tight text-white">
        <a className="hover:text-[#c7ff2f]" href={postHref(post.slug)}>{post.title}</a>
      </h2>
      <p className="mt-3 text-zinc-400">{post.description}</p>
    </article>
  )
}

async function resolveContent(slug: string[] | undefined) {
  const opinly = getOpinlyClient()
  if (!slug?.length) return { type: 'home' as const, posts: (await opinly.posts({ limit: 50 })).data }

  const [first, second] = slug
  if (second && first === 'category') {
    const category = (await opinly.categories()).find((item) => item.slug === second)
    return category ? { type: 'archive' as const, title: category.title, description: category.description, posts: category.posts } : null
  }
  if (second && first === 'tag') {
    const posts = (await opinly.posts({ tag: second, limit: 50 })).data
    return { type: 'archive' as const, title: `Posts tagged ${second}`, description: null, posts }
  }
  if (second && first === 'authors') {
    const author = await opinly.author(second)
    return author.type === 'author'
      ? { type: 'archive' as const, title: author.data.name, description: author.data.bio, posts: author.data.posts }
      : null
  }

  const post = await opinly.post(slug.join('/'))
  return post ? { type: 'post' as const, post } : null
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { blogPath, slug } = await params
  if (`/${blogPath}` !== OPINLY_BLOG_PATH) return {}
  const resolved = await resolveContent(slug)
  if (!resolved) return {}
  if (resolved.type === 'post') {
    return generateOpinlyMetadata({ type: 'post', data: resolved.post }, parent)
  }
  return {
    title: resolved.type === 'archive' ? `${resolved.title} | Nebula Components` : 'Nebula Components Blog',
    description: resolved.type === 'archive' ? resolved.description ?? undefined : 'Evidence-led conversion and growth insights from Nebula Components.',
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.com'}${OPINLY_BLOG_PATH}` },
  }
}

export default async function OpinlyBlogPage({ params }: { params: Promise<Params> }) {
  const { blogPath, slug } = await params
  if (`/${blogPath}` !== OPINLY_BLOG_PATH) notFound()
  const resolved = await resolveContent(slug)
  if (!resolved) notFound()

  if (resolved.type === 'post') {
    const post: FullPost = resolved.post
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-zinc-100">
        <a className="text-sm text-[#c7ff2f] hover:underline" href={OPINLY_BLOG_PATH}>← All posts</a>
        <article className="mt-10">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{post.category?.name ?? 'Insights'}</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">{post.title}</h1>
          <p className="mt-5 text-xl text-zinc-400">{post.description}</p>
          <div className="prose prose-invert mt-12 max-w-none prose-a:text-[#c7ff2f]">
            <OpinlyContent content={post.content} config={opinlyRenderConfig} />
          </div>
          <OpinlyJsonLd data={buildBlogPostingJsonLd(post)} />
          {post.faqs?.length ? <OpinlyJsonLd data={buildFaqJsonLd(post.faqs)} /> : null}
        </article>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-20 text-zinc-100">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c7ff2f]">Nebula Components</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">{resolved.type === 'archive' ? resolved.title : 'The Nebula blog'}</h1>
      <p className="mt-5 max-w-2xl text-xl text-zinc-400">
        {resolved.type === 'archive' ? resolved.description : 'Practical evidence on conversion, acquisition, and fixing leaks in the funnel.'}
      </p>
      <section className="mt-12 grid gap-5 md:grid-cols-2">
        {resolved.posts.map((post) => <PostCard key={post.slug} post={post} />)}
      </section>
    </main>
  )
}
