import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: "Landing Page Bounce Rate High? It's Usually 3 Things | Nebula Components",
  description: 'A high bounce rate on paid traffic means visitors are deciding to leave immediately. These are the 6 most common causes.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/landing-page-bounce-rate-high' },
}

const articleSchema = createArticleSchema({
  headline: "Landing Page Bounce Rate High? It's Usually 3 Things",
  description: 'A high bounce rate on paid traffic means visitors are deciding to leave immediately. These are the 6 most common causes.',
  url: 'https://nebulacomponents.shop/learning-centre/landing-page-bounce-rate-high',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-19',
})

export default function LandingPageBounceRateHigh() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-[72px]">

        <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/learning-centre" className="hover:text-fg">Learning Centre</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">Bounce Rate High</li>
          </ol>
        </nav>

        <article className="mx-auto max-w-4xl px-6 py-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Landing Page Leaks</p>
          <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
            Landing Page Bounce Rate High? It&apos;s Usually 3 Things
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
            A bounce rate above 70% on paid traffic means the first screen isn&apos;t delivering on the promise that brought visitors there. Bounce is a symptom. The cause is almost always offer mismatch, slow load, or wrong audience.
          </p>

          {/* Bounce vs Exit */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-fg">Bounce vs Exit: What&apos;s the Difference</h2>
            <p className="mt-4 leading-relaxed text-fg-muted">
              <strong className="text-fg">Bounce</strong> means someone landed on your page and left without clicking anything. They didn&apos;t explore. They didn&apos;t convert. They arrived, decided the page wasn&apos;t what they expected, and left.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              <strong className="text-fg">Exit</strong> means they visited multiple pages and this was their last stop. High exit rate on a landing page is normal — if they explored and then left, the page did its job.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              High <em>bounce</em> on a paid traffic landing page is the problem. The first screen failed to match what the ad promised.
            </p>
          </section>

          {/* The 3 culprits */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-fg">The 3 Culprits</h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  label: '1. Offer Mismatch',
                  body: 'The ad promised one thing. The page delivered another. If visitors don\'t see what they came for within 3 seconds, they leave. Generic headline, buried CTA, unclear value prop — any of these break the chain.',
                },
                {
                  label: '2. Slow Load Time',
                  body: '53% of mobile users abandon pages that take longer than 3 seconds to load. Heavy scripts, unoptimised images, and third-party tools cause visitors to bounce before they see your offer. Speed is free conversion.',
                },
                {
                  label: '3. Wrong Audience',
                  body: 'Broad targeting, irrelevant keywords, or clickbait ads bring people who were never going to convert. When that\'s the cause, the fix isn\'t the page — it\'s the targeting. Segment analytics by source to confirm.',
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
                  <h3 className="text-lg font-bold text-accent">{item.label}</h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick diagnosis */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-fg">Quick Diagnosis</h2>
            <p className="mt-4 leading-relaxed text-fg-muted">Segment your analytics by source, device, and traffic type to find which segment is bouncing:</p>
            <ul className="mt-6 space-y-3">
              {[
                { label: 'By source', detail: 'Google Ads vs Meta Ads vs Organic. One may be misconfigured or attracting the wrong audience.' },
                { label: 'By device', detail: 'Mobile bounce above 80% = your mobile layout is the problem, not the ad.' },
                { label: 'By traffic type', detail: 'Cold traffic bounces more than warm. Adjust expectations — and landing pages — accordingly.' },
              ].map((item) => (
                <li key={item.label} className="flex items-baseline gap-3 text-sm text-fg-muted">
                  <span className="shrink-0 font-semibold text-fg">{item.label}:</span>
                  {item.detail}
                </li>
              ))}
            </ul>
          </section>

          {/* 60-second fix */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-fg">The 60-Second Fix</h2>
            <ol className="mt-6 space-y-4">
              {[
                { step: 'Match headline to source', detail: 'If the ad says "Fix your landing page," the H1 should say "Fix your landing page" — not "Welcome to Our Platform."' },
                { step: 'Cut load time', detail: 'Compress images, lazy-load below-fold content, remove unused scripts. Test with PageSpeed Insights. Aim under 2 seconds on mobile.' },
                { step: 'Put the CTA above fold', detail: 'If visitors have to scroll to see what to do next, they\'ll use the back button instead.' },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 rounded-xl border border-border bg-bg-muted/20 p-5">
                  <span className="shrink-0 font-bold text-accent">{i + 1}.</span>
                  <div>
                    <p className="font-semibold text-fg">{item.step}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* CTA */}
          <section className="mt-16 rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
            <h2 className="text-xl font-bold text-fg">Find the Leak on Your Page</h2>
            <p className="mt-3 text-fg-muted">
              The free audit checks your landing page URL and returns the specific cause of your bounce problem.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/audit" className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg transition-colors hover:bg-accent-light">
                Run the free audit →
              </Link>
              <Link href="/learning-centre/landing-page-not-converting" className="inline-block rounded-xl border border-accent px-8 py-4 font-semibold text-accent transition-colors hover:bg-accent/5">
                View leak map →
              </Link>
            </div>
          </section>

          {/* Related */}
          <section className="mt-12 border-t border-border pt-10">
            <h3 className="mb-4 text-sm font-semibold text-fg">Related leak checks</h3>
            <div className="flex flex-col gap-3">
              {[
                { slug: 'landing-page-not-converting', title: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { slug: 'message-match-checklist', title: 'Message Match Checklist For Paid Traffic Landing Pages' },
                { slug: 'mobile-landing-page-leaks', title: 'Mobile Landing Page Leaks That Kill Paid Traffic' },
              ].map((a) => (
                <Link key={a.slug} href={`/learning-centre/${a.slug}`} className="text-sm text-accent hover:underline">
                  → {a.title}
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-10">
            <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg">← Learning Centre</Link>
          </div>
        </article>
      </main>
    </>
  )
}
