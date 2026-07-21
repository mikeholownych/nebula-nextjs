import type { Metadata } from 'next'
import Link from 'next/link'

import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Founder Second Brain: Capture and Reuse Your Best Thinking | Nebula Components',
  description: 'How founders can build an AI-assisted second brain to capture decisions, frameworks, and content that compounds over time.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/founder-second-brain' },
}

const articleSchema = createArticleSchema({
  headline: 'Founder Second Brain: Capture and Reuse Your Best Thinking',
  description: 'How founders can build an AI-assisted second brain to capture decisions, frameworks, and content that compounds over time.',
  url: 'https://nebulacomponents.shop/learning-centre/founder-second-brain',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-19',
})

export default function FounderSecondBrainPage() {
  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg pt-[72px]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/learning-centre" className="hover:text-fg">Learning Centre</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">Founder Second Brain</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Content Systems</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          Founder Second Brain: Turn Your Expertise Into Compounding Output
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Most founders hold a decade of hard-won insight in their head that never gets used outside a Zoom call. The Founder Second Brain is a system for extracting that expertise and converting it into content, offers, and decision frameworks that work for you continuously.
        </p>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Problem: Expertise That Does Not Compound</h2>
          <p className="text-fg-muted leading-relaxed">
            Every founder has specific, earned knowledge that their audience needs. But without a capture system, that expertise sits dormant — delivered once in a sales call, lost after a client engagement, or buried in an email no one will find again. The result is that marketing becomes a chore: starting from scratch each week, producing content that sounds generic because it is not grounded in real experience.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">What the Second Brain Does</h2>
          <ul className="space-y-4">
            {[
              { label: 'Capture', desc: 'Every insight, client story, objection handled, and decision made gets added to a structured vault with context and date.' },
              { label: 'Tag and connect', desc: 'Entries are tagged by topic, audience, and outcome so related ideas surface together.' },
              { label: 'Generate', desc: 'The vault feeds an AI that drafts LinkedIn posts, emails, lead magnets, and landing page copy from your actual voice and your actual results.' },
              { label: 'Approve', desc: 'Every output goes through a one-touch approval gate before publishing — you review, not rewrite.' },
            ].map(({ label, desc }) => (
              <li key={label} className="flex items-start gap-4 rounded-xl border border-border bg-bg-muted/30 p-4">
                <span className="mt-0.5 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">{label}</span>
                <p className="text-fg-muted">{desc}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">What Goes Into the Vault</h2>
          <p className="mb-4 text-fg-muted">The raw material is anything that helped a real person solve a real problem:</p>
          <ul className="space-y-2 text-fg-muted">
            {[
              'Client wins: outcome, starting condition, fix applied',
              'Objections you handled and what actually worked',
              'Frameworks you use repeatedly that you have never written down',
              'Mistakes that cost you time or money and what you learned',
              'Positions you hold that most people in your industry get wrong',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Output Format</h2>
          <p className="mb-4 text-fg-muted">One vault entry gets processed into multiple formats:</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { format: 'LinkedIn post', note: 'Hook from the outcome, story from the diagnosis, CTA to the audit' },
              { format: 'Email nurture', note: 'Problem-first, experience-backed, low-pressure' },
              { format: 'Landing page copy', note: 'Claims grounded in documented case stories' },
              { format: 'FAQ content', note: 'Objections answered in the founder\'s real voice' },
            ].map(({ format, note }) => (
              <div key={format} className="rounded-xl border border-border bg-bg-muted/30 p-4">
                <p className="font-semibold text-fg">{format}</p>
                <p className="mt-1 text-sm text-fg-muted">{note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-xl border border-accent/30 bg-accent/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-fg">Start With the Audit</h2>
          <p className="mt-4 max-w-xl mx-auto text-fg-muted">
            Before building content systems, understand what is leaking on your landing page. Fix the conversion floor first so new content has somewhere to land.
          </p>
          <Link
            href="/audit"
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors"
          >
            Run Free Audit →
          </Link>
        </section>

        <div className="mt-8">
          <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg">← Learning Centre</Link>
        </div>
      </article>


    </main>
  )
}
