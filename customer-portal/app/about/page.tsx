import type { Metadata } from 'next'
import Link from 'next/link'
import BreadcrumbSchema from '@/app/components/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'About Nebula Components | Evidence-Backed CRO',
  description:
    'Evidence-backed landing page diagnosis for founders running paid ads. We identify message-match, trust, and CTA problems that waste clicks.',
  alternates: {
    canonical: 'https://nebulacomponents.com/about',
  },
}

export default function AboutPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg text-fg pt-24">
      <BreadcrumbSchema />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-6 heading-1">About Nebula Components</h1>
        <p className="mb-8 text-lg leading-relaxed text-fg-muted">
          Nebula Components provides evidence-backed landing page conversion diagnosis and bounded implementation work for founders running paid traffic.
        </p>

        {/* Founder section with photo and why-I-built-this narrative */}
        <section className="mb-10 rounded-md border border-border bg-bg-panel p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <img
              src="/mike-holownych-founder.jpg"
              alt="Mike Holownych, Founder of Nebula Components"
              width={112}
              height={140}
              className="rounded-xl object-cover shrink-0 border border-border"
            />
            <div>
              <h2 className="mb-1 text-2xl font-bold">Founded by Mike Holownych</h2>
              <p className="mb-3 text-sm font-medium text-accent">Founder, Nebula Components</p>
              <p className="mb-3 text-fg-muted leading-relaxed text-sm">
                Before founding Nebula, I worked with founders running paid traffic whose landing pages weren&apos;t converting. The same failures showed up page after page: message-match gaps, missing trust signals, hidden mobile CTAs, and slow load times.
              </p>
              <p className="mb-4 text-fg-muted leading-relaxed text-sm">
                Founders were spending thousands on traffic to pages with broken headlines and no proof above the fold, then changing the ad without checking the page first. I built Nebula to surface exact, verifiable page-side fixes without needing an expensive consulting retainer.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="https://www.linkedin.com/in/mikeholownych"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3.5 py-1.5 font-semibold text-xs text-fg-muted transition-colors hover:border-accent hover:text-accent"
                >
                  LinkedIn ↗
                </a>
                <Link
                  href="/about/team"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3.5 py-1.5 font-semibold text-xs text-fg-muted transition-colors hover:border-accent hover:text-accent"
                >
                  Founder Profile →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-md border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold">What we do</h2>
          <p className="mb-4 text-fg-muted">
            We run a structured audit against your landing page - checking message-match, trust signals, mobile layout, form friction, load time, and compliance - and deliver a prioritised fix list with specific instructions. If you want implementation, we do that too, at a flat rate, with no retainer required.
          </p>
          <p className="text-fg-muted">
            When we publish a specific outcome claim, it comes with a recorded case behind it -
            not just a number in a box. We don't have a verified case study to publish yet;
            see <a href="/case-studies" className="underline hover:text-fg">why</a>.
          </p>
        </section>

        <section className="mb-10 rounded-md border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold">Who we work with</h2>
          <p className="mb-4 text-fg-muted">
            Founders and operators who are actively spending on paid ads - Google, Meta, LinkedIn - and not seeing the conversions the click-through rate should produce. In our audits, the landing page is very often part of the problem - but we won't tell you it's the only variable. Traffic quality, offer, and price matter too; the audit tells you specifically what we can see on the page itself.
          </p>
          <ul className="space-y-2 text-fg-muted">
            {
              [
                'Ecommerce brands with strong CTR and weak checkout conversion',
                'B2B SaaS companies with high demo-request bounce rates',
                'Coaches and consultants with zero form fills from paid campaigns',
                'Agencies managing client accounts with disapproval and quality score problems',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))
            }
          </ul>
        </section>

        {/* Explicit Who We Are NOT For Section (D2.B) */}
        <section className="mb-10 rounded-md border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold">Who Nebula is NOT for</h2>
          <p className="mb-4 text-fg-muted">
            We are intentional about our scope. Nebula is not the right fit if:
          </p>
          <ul className="space-y-2 text-fg-muted">
            {[
              'You have no paid traffic or ad spend yet - the audit is calibrated for visitors arriving with ad-driven expectations',
              'You want a full agency redesign, brand repositioning, or subjective design feedback',
              'You are looking for guaranteed conversion lift without a controlled traffic experiment',
              'You need unmonitored post-checkout funnel or backend CRM optimization',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 shrink-0 text-signal-fail font-bold">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10 rounded-md border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold">Current audit status</h2>
          <p className="text-fg-muted">
            Automated URL submission and scoring are live. Drop in a URL and get a scored, evidence-backed diagnosis - no signup required.
          </p>
          <Link href="/audit?utm_source=content&utm_medium=organic-content" className="mt-4 inline-block font-semibold text-accent hover:underline">
            Run a free audit →
          </Link>
        </section>

        <section className="mb-10 rounded-md border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold">Contact</h2>
          <p className="text-fg-muted">
            Email is a reliable way to reach us. Response time is typically within one business day.
          </p>
          <p className="mt-3 text-fg">
            <a href="mailto:hello@nebulacomponents.com" className="text-fg hover:text-accent underline">
              hello@nebulacomponents.com
            </a>
          </p>
        </section>

        <div className="flex gap-4">
          <Link href="/audit?utm_source=content&utm_medium=organic-content" className="inline-block rounded bg-accent px-6 py-3 font-semibold text-bg hover:opacity-90 transition-opacity">
            Run Free Audit
          </Link>
          <Link href="/learning-centre" className="inline-block rounded-xl border border-border px-6 py-3 font-semibold text-fg hover:border-accent transition-colors">
            Learning Centre
          </Link>
        </div>
      </div>
    </main>
  )
}