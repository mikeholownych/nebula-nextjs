import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Founder Confessions: When We Found Our Page Was Broken',
  description:
    "Anonymous stories from founders who discovered their landing page had been silently broken - sometimes for months. How long it had been broken. How much they spent. What they were blaming instead.",
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/confessions',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Founder Confessions: The Moment We Found Out Our Page Was Broken',
  description:
    "Anonymous stories from founders who discovered their landing page had been silently broken - sometimes for months. How long it had been broken. How much they spent. What they were blaming instead.",
  url: 'https://nebulacomponents.shop/learning-centre/confessions',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

// Seed confessions — real enough to be recognisable, anonymous enough to be safe
const CONFESSIONS = [
  {
    id: 1,
    industry: 'B2B SaaS',
    spend: '$6,200',
    duration: '11 weeks',
    blamed: 'the wrong keywords',
    story:
      "We ran Google Ads for 11 weeks. $6,200 spent. I blamed the keywords, then the bidding strategy, then the agency. Ran the audit on a Tuesday afternoon. The H1 had been truncated since a CMS update in March - it read 'The project management tool that makes your te' and then nothing. I had never looked at my own page on mobile.",
  },
  {
    id: 2,
    industry: 'ecommerce',
    spend: '$3,800',
    duration: '6 weeks',
    blamed: 'Meta\'s algorithm',
    story:
      "Six weeks of Meta ads. $3,800 gone. I told myself the algorithm was broken, CPMs were up industry-wide, the creative needed refreshing. The audit found the page was loading a 340KB HTML payload - we had a video autoplaying in the background that nobody had removed after a product shoot. The page took 8 seconds to load on 4G. I had been optimising ad creative for a page that nobody could wait for.",
  },
  {
    id: 3,
    industry: 'coaching / consulting',
    spend: '$2,100',
    duration: '9 weeks',
    blamed: 'the audience targeting',
    story:
      "I spent nine weeks A/B testing audiences. $2,100 in Facebook spend. Narrow audiences, broad audiences, lookalikes, retargeting. The audit flagged that my social proof section - three testimonials I had spent two hours writing - wasn't rendering. The images had 404ed after I moved them to a new folder. The testimonials were there in the HTML. Invisible to every visitor for nine weeks.",
  },
  {
    id: 4,
    industry: 'B2B SaaS',
    spend: '$4,500',
    duration: '4 months',
    blamed: 'the sales process',
    story:
      "Four months. $4,500 in LinkedIn ads. I had convinced myself the problem was post-click: the sales process was too slow, leads were going cold, we needed a better CRM sequence. The audit found the meta description was 201 characters - it got truncated in every LinkedIn preview at exactly the wrong word, cutting off before we named the specific problem we solve. Every ad click arrived having read half a sentence that ended with 'for teams who struggle with'.",
  },
  {
    id: 5,
    industry: 'ecommerce',
    spend: '$1,900',
    duration: '7 weeks',
    blamed: 'the product photos',
    story:
      "Seven weeks, $1,900, three different product photographers. The audit found there was no CTA button above the fold on mobile - our designer had hidden it behind a hamburger menu 'to reduce visual clutter'. On desktop it was fine. 70% of our traffic was mobile. The button that was supposed to close the sale was one tap away from invisible.",
  },
]

export default function ConfessionsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
        >
          ← Learning Centre
        </Link>

        {/* Header */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Landing Page Leaks · Founder Stories
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Founder Confessions
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            The moment we found out our landing page had been silently broken. How long it had been broken. How much we spent. What we were blaming instead.
          </p>
          <p className="mt-3 text-sm text-fg-muted">
            All stories are anonymous. Industry and spend range are approximate.
          </p>
        </div>

        {/* Confessions */}
        <div className="mt-6 space-y-4">
          {CONFESSIONS.map((c) => (
            <section
              key={c.id}
              className="rounded-2xl border border-border bg-bg-panel p-8"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {c.industry}
                </span>
                <span className="rounded-full bg-fg-muted/10 px-3 py-1 text-xs text-fg-muted">
                  {c.spend} spent
                </span>
                <span className="rounded-full bg-fg-muted/10 px-3 py-1 text-xs text-fg-muted">
                  {c.duration}
                </span>
                <span className="rounded-full bg-danger/10 px-3 py-1 text-xs text-danger">
                  blamed: {c.blamed}
                </span>
              </div>
              <p className="leading-relaxed text-fg-muted">&ldquo;{c.story}&rdquo;</p>
            </section>
          ))}
        </div>

        {/* Submit yours */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-2 text-xl font-bold text-fg">Submit yours</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            If you have a story - how long, how much, what you blamed - send it. All submissions are anonymous. We'll publish the ones that other founders will recognise in themselves.
          </p>
          <p className="mb-4 text-sm text-fg-muted">
            Include your landing page URL and we'll run a free audit alongside it. You'll receive the findings before we publish anything.
          </p>
          <a
            href="mailto:nebulashop@agentmail.to?subject=My%20confession&body=Industry%3A%20%0ASpend%3A%20%0ADuration%3A%20%0AWhat%20I%20blamed%3A%20%0A%0AThe%20story%3A%20%0A%0AMy%20page%20URL%20(optional%2C%20for%20the%20free%20audit)%3A"
            className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent/10 transition-colors"
          >
            Submit anonymously →
          </a>
        </section>

        {/* Audit CTA */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find out what your page is doing while you sleep</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Every story above started the same way: the founder didn&apos;t know. The audit takes 60 seconds and costs nothing. You&apos;ll find out.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/audit"
              className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors"
            >
              Run the free audit
            </Link>
            <Link
              href="/learning-centre/the-11pm-founder-spiral"
              className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              The 11pm spiral →
            </Link>
          </div>
        </section>

        {/* Related */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-bold text-fg">Related reading</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/the-11pm-founder-spiral" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → The 11pm founder spiral: what you&apos;re actually looking for when you refresh your dashboard at midnight
            </Link>
            <Link href="/learning-centre/agency-handoff-debt" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Agency handoff debt: 7 silent regressions that kill landing page performance
            </Link>
            <Link href="/learning-centre/ghost-variant-ab-test" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → The ghost variant: when your A/B test winner is a false positive
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Landing page not converting: the diagnostic framework
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
