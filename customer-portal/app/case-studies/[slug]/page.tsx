import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedCaseStudies } from '@/app/lib/public-facts'

export const dynamic = 'force-dynamic'

const getPublishedCaseStudy = (slug: string) =>
  getPublishedCaseStudies().find((study) => study.slug === slug)

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const study = getPublishedCaseStudy(slug)
  if (!study) return { title: 'Not Found' }
  return {
    title: `${study.title} | Nebula Components Case Study`,
    description: study.description,
    alternates: {
      canonical: `https://nebulacomponents.shop/case-studies/${study.slug}`,
    },
    openGraph: {
      title: study.title,
      description: study.description,
      url: `https://nebulacomponents.shop/case-studies/${study.slug}`,
    },
  }
}

export function generateStaticParams() {
  return getPublishedCaseStudies().map(({ slug }) => ({ slug }))
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const study = getPublishedCaseStudy(slug)
  if (!study) notFound()

  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg">

      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/case-studies" className="hover:text-fg">Case Studies</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">{study.eyebrow}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{study.eyebrow}</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">{study.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">{study.description}</p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-6 py-4">
          <span className="text-3xl font-bold text-accent">{study.outcome}</span>
          <span className="text-sm text-fg-muted">{study.outcomeLabel}</span>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Situation</h2>
          <p className="text-fg-muted leading-relaxed">{study.situation}</p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">What the Audit Found</h2>
          <p className="text-fg-muted leading-relaxed">{study.diagnosis}</p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">Fixes Applied</h2>
          <ul className="space-y-3">
            {study.fixes.map((fix, i) => (
              <li key={i} className="flex items-start gap-3 text-fg-muted">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                {fix}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-xl border border-accent/30 bg-bg-muted/40 p-6">
          <h2 className="mb-3 text-xl font-bold text-fg">Result</h2>
          <p className="text-fg-muted leading-relaxed">{study.result}</p>
        </section>

        <section className="mt-16 border-t border-border pt-12 text-center">
          <h2 className="text-2xl font-bold text-fg">Get Your Own Result</h2>
          <p className="mt-4 text-fg-muted">Run the free audit. Find your leaks. Fix them.</p>
          <Link
            href="/audit"
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Run Free Audit →
          </Link>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <Link href="/case-studies" className="text-sm text-fg-muted hover:text-fg">← All Case Studies</Link>
        </section>
      </article>

    </main>
  )
}
