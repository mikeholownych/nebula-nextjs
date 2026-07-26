import Link from 'next/link'
import { getPublishedCaseStudies } from '@/app/lib/public-facts'

export const metadata = {
  title: 'Case Studies | Nebula Components',
  description: "We don't publish a case study until we have a real, verifiable client outcome. Here's why, and what you get in the meantime.",
  alternates: {
    canonical: 'https://nebulacomponents.shop/case-studies',
  },
}

export default function CaseStudiesIndex() {
  const publishedCaseStudies = getPublishedCaseStudies()

  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg">

      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Case Studies</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          {publishedCaseStudies.length === 0
            ? 'We don\u2019t have one yet — on purpose.'
            : 'Published, evidence-backed case studies'}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          A case study means a real client, a real before-and-after number, and dates you could
          check if you wanted to. We don&apos;t have one of those to publish yet, so instead of
          inventing one, this page says so.
        </p>
      </section>

      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-fg">What goes here, and when</h2>
          <p className="mt-4 max-w-2xl text-fg-muted leading-7">
            The first case study we publish will name the client (or explain why it&apos;s
            anonymized), state the actual before/after metric, give the measurement window, and
            link the underlying evidence — not just a number in a box. If we can&apos;t show our
            work, it doesn&apos;t go here.
          </p>
          <p className="mt-4 max-w-2xl text-fg-muted leading-7">
            Until then, the fairest way to evaluate the audit is to run it on a page you already
            know well and see whether the findings hold up against what you already know is true.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-fg">See it for yourself</h2>
        <p className="mt-4 text-fg-muted">Run the free audit on your own page. No signup required to see the findings.</p>
        <Link
          href="/audit"
          className="mt-8 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
        >
          Run Free Audit →
        </Link>
      </section>

    </main>
  )
}
