import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Why CRO Agencies Don\'t Work (And What Does) | Nebula',
  description:
    'CRO agencies sell 90-day retainers before diagnosing what\'s broken. Evidence-first audits find the specific leak in under two minutes. Here\'s the structural difference.',
  alternates: {
    canonical: 'https://nebulacomponents.com/why-cro-agencies-dont-work',
  },
  openGraph: {
    title: 'Why CRO Agencies Don\'t Work (And What Does) | Nebula',
    description:
      'CRO agencies sell 90-day retainers before diagnosing what\'s broken. Evidence-first audits find the specific leak in under two minutes.',
    url: 'https://nebulacomponents.com/why-cro-agencies-dont-work',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Why CRO Agencies Don\'t Work - and What the Evidence Standard Looks Like',
  description:
    'The optimization industry sells retainers before diagnosis, generic recommendations over specific evidence, and multi-month timelines for problems fixable in a week.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/why-cro-agencies-dont-work',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    { '@type': 'ListItem', position: 2, name: 'Why CRO Agencies Don\'t Work', item: 'https://nebulacomponents.com/why-cro-agencies-dont-work' },
  ],
}

const faqItems = [
  {
    q: 'Do CRO agencies actually improve conversion rates?',
    a: 'Some do, over long engagements with sufficient traffic. But the industry model - retainer before diagnosis, generic recommendations, 90-day timelines - means most founders pay for months before any measurable change is implemented. For pages receiving under 5,000 visits per month, the statistical power for A/B testing doesn\'t exist anyway. The right first step is a diagnostic audit, not an engagement.',
  },
  {
    q: 'What\'s the difference between a CRO audit and a CRO retainer?',
    a: 'An audit diagnoses what is observable and measurable on your page right now - specific, verifiable defects with evidence attached. A retainer is an ongoing engagement that usually bundles diagnosis, strategy, creative, testing, and reporting into a monthly fee. The audit should come first, cost less, and determine whether the retainer is even necessary.',
  },
  {
    q: 'What should I do before hiring a CRO agency?',
    a: 'Run an evidence-grade diagnostic audit of your landing page. If the page fails observable checks - message mismatch, CTA not visible on mobile, no social proof above the fold - fix those first. They are structural defects, not optimization opportunities. Fix structural issues yourself, then hire for testing and creative if conversion still underperforms.',
  },
  {
    q: 'Why doesn\'t A/B testing work for most landing pages?',
    a: 'A/B testing requires statistical significance - typically 1,000+ conversions per variant. Most landing pages for founders running paid ads don\'t have that traffic. Running a split test on a page with 200 monthly visitors will take 18 months to reach significance, and the result will still be uncertain. Fix the structural defects first. Then test when volume exists.',
  },
  {
    q: 'What is an evidence-grade landing page audit?',
    a: 'An audit where every finding is traceable to a specific, observable condition on the page - an H1 that doesn\'t match the ad, a CTA that is below the fold on 375px, a meta description that is 197 characters. Not an opinion. Not a best practice recommendation. A finding you can verify yourself by looking at the source.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const FAILURES = [
  {
    n: '01',
    signal: 'Business model',
    heading: 'Retainer before diagnosis',
    body: 'The standard agency model starts with a discovery call and a monthly engagement. The diagnosis comes after you\'ve signed. This means you pay for the agency to learn what\'s wrong - information that should be the starting point, not the output of month one.',
    fix: 'The audit comes first. It costs less than an hour of agency time, takes under two minutes, and tells you whether there is a structural problem before any money changes hands.',
  },
  {
    n: '02',
    signal: 'Evidence standard',
    heading: 'Generic recommendations over specific findings',
    body: '"Improve your CTA" appears in every CRO report, written for every page, without reference to your actual CTA. The finding that matters is: "Your primary CTA is below the fold on a 375px viewport. 64% of your paid traffic is mobile. The visitor never sees it." The first is advice. The second is evidence.',
    fix: 'Evidence-grade findings cite the source: the actual H1 text, the pixel dimensions, the character count, the specific element. You can verify every finding yourself by looking at the page source.',
  },
  {
    n: '03',
    signal: 'Statistical methodology',
    heading: 'A/B testing on pages with insufficient traffic',
    body: 'Running a split test on a landing page with 300 monthly visitors will take 18 months to reach statistical significance at 95% confidence. Most agencies run these tests anyway. The results are noise presented as insight. The founder pauses ad spend and changes nothing, or changes the wrong thing.',
    fix: 'Fix structural defects before testing. Structural problems - wrong headline, buried CTA, no proof - are not optimization opportunities. They are defects. Fix them with evidence, not experiments.',
  },
  {
    n: '04',
    signal: 'Scope',
    heading: '90-day timelines for problems fixable in a week',
    body: 'A meta description that is 197 characters can be fixed in 90 seconds. A CTA that doesn\'t contrast against its background can be fixed in one CSS line. A headline that doesn\'t match the ad that sent the traffic can be rewritten in an afternoon. Agencies bundle these fixes into multi-month roadmaps because the engagement model requires it.',
    fix: 'The highest-priority page fixes are almost always structural and fast. Run the audit, find the highest-priority failing signal, fix it, re-audit. The whole loop runs in days, not quarters.',
  },
  {
    n: '05',
    signal: 'Attribution',
    heading: 'Claiming credit for conversion lift they didn\'t cause',
    body: 'If conversion rate increases during a CRO engagement, the agency takes credit. If it decreases, the issue is attributed to traffic quality or seasonality. Without a defined experiment protocol and a measurement window agreed before the fix is implemented, before/after comparisons are stories, not evidence.',
    fix: 'The Nebula approach: run the audit, document the failing signal and its evidence, implement the specific fix, run the audit again after a defined window, compare the signal scores. The before/after is the product, not the retainer.',
  },
  {
    n: '06',
    signal: 'Cost structure',
    heading: 'Paying for strategy when the problem is structural',
    body: 'A $3,000/month CRO retainer is the right investment when: you have sufficient traffic to test, your page passes structural checks, and you need creative and copy iteration. It is the wrong investment when your H1 doesn\'t match your ad, your CTA is invisible on mobile, and your page has no trust signals above the fold. That\'s a $97 problem, not a $36,000/year one.',
    fix: 'Sequence the investment. Structural audit first ($0). Fix the structural defects ($97 per leak). Then consider ongoing optimization once the structural layer is clean.',
  },
]

export default function WhyCROAgenciesDontWork() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24">

        {/* ── Header ── */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-fg-muted">
            <Link href="/" className="hover:text-fg transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span>Why CRO Agencies Don&apos;t Work</span>
          </nav>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            The optimization industry&apos;s structural problem
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-fg md:text-5xl">
            Why CRO agencies don&apos;t work - and what the evidence standard looks like.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-7 text-fg-muted">
            The industry model sells retainers before diagnosis, A/B tests on pages without enough
            traffic to reach significance, and 90-day timelines for problems fixable in a week.
            This is not a critique of individual agencies. It is a structural analysis of the model.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted">
            The alternative is not a different agency. It is a different sequence: diagnose first,
            with evidence you can verify, before paying anyone anything.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="rounded-xl bg-accent px-7 py-3.5 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Run the free audit first &rarr;
            </Link>
            <Link href="/benchmarks" className="text-sm text-fg-muted hover:text-fg transition-colors">
              See industry benchmark data &rarr;
            </Link>
          </div>
        </section>

        {/* ── Framing callout ── */}
        <section className="border-y border-border bg-bg-surface px-6 py-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-base leading-7 text-fg-muted max-w-3xl">
              <span className="font-semibold text-fg">The current completed-audit benchmark averages 6.3/10 and 4.6 recorded findings per page.</span>{' '}
              Every one of those failures is observable, specific, and fixable - without a retainer, without a discovery call, and without running an A/B test that won&apos;t reach significance for six months.
              The audit takes under two minutes. The fix takes a day.
              The retainer is optional.
            </p>
          </div>
        </section>

        {/* ── Six failure patterns ── */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              Six ways the model fails founders.
            </h2>
            <p className="mb-10 max-w-2xl text-base text-fg-muted leading-7">
              These are structural failures, not individual agency failures. The model produces them reliably.
            </p>
            <div className="space-y-6">
              {FAILURES.map((f) => (
                <div key={f.n} className="rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
                  <div className="mb-4 flex items-start gap-4">
                    <span className="font-mono text-xs text-fg-muted shrink-0 mt-1">{f.n}</span>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">{f.signal}</p>
                      <h3 className="text-lg font-bold text-fg">{f.heading}</h3>
                    </div>
                  </div>
                  <p className="text-base text-fg-muted leading-7 mb-4">{f.body}</p>
                  <div className="border-l-2 border-accent/40 pl-4">
                    <p className="text-sm text-fg-muted leading-6">
                      <span className="font-semibold text-fg">The alternative: </span>
                      {f.fix}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The evidence standard ── */}
        <section className="border-t border-border bg-bg-muted/10 px-6 py-16">
          <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-2 md:items-start">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">The alternative</p>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg">
                What the evidence standard looks like.
              </h2>
              <p className="text-base text-fg-muted leading-7">
                Every finding from a Nebula audit traces to a specific, observable condition:
                the actual H1 text, the computed contrast ratio, the character count, the pixel
                dimensions, the presence or absence of a specific HTML element. Not a best practice.
                Not an opinion. A finding you can verify by looking at the source.
              </p>
              <p className="mt-4 text-base text-fg-muted leading-7">
                When the finding is specific, the fix is specific. When the fix is specific, the
                before/after is measurable. When the before/after is measurable, you know whether
                the fix worked. That loop - audit, fix, re-audit - is the product.
              </p>
              <p className="mt-4 text-base text-fg-muted leading-7">
                The retainer comes after the loop is proven, not before.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-muted/30 p-6 font-mono text-sm">
              <p className="mb-4 text-xs text-fg-muted uppercase tracking-wider">Example finding</p>
              <div className="space-y-3 text-xs">
                <div className="border-b border-border pb-3">
                  <p className="text-accent mb-1">Signal: Message Match</p>
                  <p className="text-signal-fail">FAIL</p>
                </div>
                <div className="border-b border-border pb-3">
                  <p className="text-fg-muted mb-1">Evidence:</p>
                  <p className="text-fg">H1: &ldquo;The AI SEO agency that makes you the answerin AI O&rdquo;</p>
                  <p className="text-fg-muted mt-1">(H1 truncated mid-word at 53 chars)</p>
                </div>
                <div className="border-b border-border pb-3">
                  <p className="text-fg-muted mb-1">Ad keyword targeted:</p>
                  <p className="text-fg">&ldquo;AI SEO agency&rdquo;</p>
                </div>
                <div>
                  <p className="text-fg-muted mb-1">Fix:</p>
                  <p className="text-fg">Rewrite H1 to under 90 chars. Confirm it contains the exact ad keyword. Verify on mobile viewport.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The sequence ── */}
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              The right sequence.
            </h2>
            <div className="grid gap-0 md:grid-cols-4">
              {[
                {
                  n: '01',
                  heading: 'Audit first',
                  body: 'Run an evidence-grade diagnostic on the page. Free, under two minutes. Find the specific failing signals before spending anything.',
                },
                {
                  n: '02',
                  heading: 'Fix structural defects',
                  body: 'Message match, CTA visibility, social proof placement. These are not optimisation opportunities - they are defects. Fix them with the evidence report.',
                },
                {
                  n: '03',
                  heading: 'Re-audit',
                  body: 'Run the audit again after the fix is live. Compare signal scores. Document the before/after. This is the evidence that the fix worked.',
                },
                {
                  n: '04',
                  heading: 'Then consider testing',
                  body: 'Once the structural layer is clean and you have sufficient traffic, A/B testing is meaningful. Not before.',
                },
              ].map((step, i) => (
                <div key={step.n} className={`border-border p-6 ${i < 3 ? 'md:border-r' : ''}`}>
                  <p className="mb-3 font-mono text-xs text-fg-muted">{step.n}</p>
                  <h3 className="mb-2 font-semibold text-fg">{step.heading}</h3>
                  <p className="text-sm text-fg-muted leading-6">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-border bg-bg-muted/10 px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 text-2xl font-bold text-fg">
              Run the diagnostic before you hire anyone.
            </h2>
            <p className="mb-8 text-base text-fg-muted leading-7">
              If the page fails structural checks, fix those first. The free audit takes under two minutes;
              the score and initial findings appear before email.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Find the Leak &rarr;
            </Link>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-xl font-bold tracking-tight text-fg">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqItems.map(({ q, a }) => (
                <div key={q} className="rounded-xl border border-border bg-bg-muted/10 p-5">
                  <h3 className="mb-2 font-semibold text-fg">{q}</h3>
                  <p className="text-sm text-fg-muted leading-6">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Related ── */}
        <section className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-fg-muted">Related</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                ['/why-is-my-landing-page-not-converting', 'Why Is My Landing Page Not Converting?'],
                ['/ads-getting-clicks-but-no-sales', 'Ads Getting Clicks But No Sales'],
                ['/landing-page-message-match', 'Message Match Diagnostic'],
                ['/benchmarks', 'Conversion Health Index'],
                ['/pricing', 'Pricing'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="rounded-lg border border-border px-4 py-2 text-fg-muted hover:text-fg hover:border-accent/40 transition-colors">
                  {label} &rarr;
                </Link>
              ))}
            </div>
          </div>
        </section>

        <RelatedContent heading="Related resources" items={[
            { href: '/what-is-landing-page-audit', label: 'What is a landing page audit?', type: 'guide' },
          { href: '/best-landing-page-audit-tools', label: 'Best audit tools compared', type: 'tool' },
          { href: '/audit', label: 'Get your free audit', type: 'cta' }
          ]} />

      </main>
    </>
  )
}
