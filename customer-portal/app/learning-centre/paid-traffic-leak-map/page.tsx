import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Paid Traffic Leak Map: Where Your Ad Budget Disappears | Nebula Components',
  description:
    'A diagnostic map of every stage where paid traffic leaks before converting. Identify which leak is bleeding your ad budget, then get the fix.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/paid-traffic-leak-map',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Paid Traffic Leak Map: Where Your Ad Budget Disappears',
  description:
    'A diagnostic map of every stage where paid traffic leaks before converting. Identify which leak is bleeding your ad budget, then get the fix.',
  url: 'https://nebulacomponents.shop/learning-centre/paid-traffic-leak-map',
  publishedDate: '2026-07-19',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Where does most paid traffic get lost before converting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The highest-volume leak in most paid traffic funnels is the landing page itself — specifically the first 5 seconds after arrival. If the landing page headline does not match the ad promise (message-match break), or if the page loads slowly on mobile, the visitor exits before engaging with any content. A secondary high-volume leak is the absence of proof before the CTA: the visitor reads the page but abandons because they have no evidence that the offer is credible. The first leak (arrival) is confirmed by bounce rate combined with low time-on-page. The second (trust) is confirmed by page engagement without form starts.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the most common reason paid traffic does not convert?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Message-match break between the ad and the landing page is the most common root cause. The ad creates a specific expectation — a keyword, an offer, a tone — and the page does not fulfil it. The visitor arrives, scans the first screen, does not recognise the promise they clicked on, and leaves. This is confirmed when CTR on the ad is healthy (above 3-5% for search) but bounce rate on the landing page is above 70% with under 15 seconds time-on-page. The second most common cause is mobile load time: a visitor who abandons while the page is loading is recorded as a bounce before seeing anything.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I identify which stage is leaking my paid traffic?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Work through the leak map in stage order, using analytics signals to confirm each: (1) Check ad CTR — if under 3% for high-intent search, the problem is the ad, not the page. (2) Check bounce rate and time-on-page for paid traffic — high bounce + under 15 seconds confirms message-match or load time failure. (3) Check mobile vs desktop conversion split — if mobile is 50%+ lower, the problem is mobile layout or mobile LCP. (4) Check form starts vs form submissions — if visitors are starting but not completing forms, the form is the leak. (5) Check checkout abandonment rate — if add-to-cart rate is healthy but purchase rate is low, the leak is at checkout (shipping reveal, trust, friction). The first stage that fails in sequence is the first fix.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to fix a paid traffic conversion leak?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Depends on the leak. Message-match fixes — rewriting the headline to mirror the ad — can be live in under an hour. Mobile LCP fixes — converting the hero image to WebP and adding correct sizing attributes — typically take 2–4 hours including testing. Form friction fixes — removing optional fields — take under an hour. Layout fixes for mobile — implementing a sticky CTA bar or restructuring the above-fold section — typically take 4–8 hours of development time. The most time-consuming fix is trust signal work — gathering, formatting, and placing new testimonials or case study content. The Nebula Fix Pack addresses all confirmed leaks within 48 hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should I pause my ads while fixing conversion leaks?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Generally no — unless your budget is very small and you cannot afford to continue accumulating data during the fix period. Pausing and restarting ads resets learning phases in automated bidding strategies (Google Smart Bidding, Meta Advantage+), which can cost 1–2 weeks of re-optimisation. If your daily budget is under $20 and you are confident the fix will take 48 hours or less, a pause is acceptable. For most advertisers, continuing to run at current budget while implementing fixes gives you a before/after comparison on the same audience, which is the most useful validation of whether the fix worked.',
      },
    },
  ],
}

const LEAKS = [
  {
    stage: 'Ad → Landing Page',
    title: 'Message-Match Break',
    signal: 'Healthy CTR on the ad, high bounce rate on the page (above 70%), under 15 seconds time-on-page',
    description:
      'The ad creates a specific expectation — a keyword, an offer, a tone — and the landing page does not fulfil it. The visitor scans the first screen, does not recognise what they clicked on, and leaves before processing any content. This is the highest-volume leak in most paid funnels because it affects every ad group pointing to a generic page.',
    why: "Google's Quality Score algorithm uses message match as a signal for Landing Page Experience. A poor match raises your effective CPC in the ad auction — meaning you pay a premium per click to drive traffic to a page that then fails immediately. The leak costs twice: once in wasted clicks, once in higher cost per click.",
    fix: 'Mirror the exact noun phrase from your top-traffic ad groups in the page H1. If the ad is targeting "landing page audit tool" and the H1 says "Transform Your Marketing," the visitor cannot confirm they are in the right place. Change the H1 to echo the keyword — exactly or semantically. Do this for every major ad group separately if volume justifies it.',
    relatedHref: '/learning-centre/message-match-checklist',
    relatedLabel: 'Run the 60-second message-match audit →',
  },
  {
    stage: 'Landing Page Load',
    title: 'Slow Mobile Load Time',
    signal: 'Normal CTR, high exit rate (particularly on mobile), mobile conversion significantly below desktop',
    description:
      "A visitor who abandons while the page is loading is recorded as a bounce before they saw your headline. Portent's 2022 analysis of over 100 million page views found that pages loading in 1 second convert at roughly 3× the rate of pages loading in 5 seconds for B2B lead generation. Google's Core Web Vitals define LCP over 4 seconds as 'Poor.' The Chrome UX Report consistently shows LCP scores 40–60% worse on mobile than desktop for the same URL — because mobile devices have less processing power and are often on slower networks.",
    why: "Landing Page Experience — one of Quality Score's three components — includes page load speed. A poor mobile LCP receives a 'Below Average' rating, raising CPC for mobile-originated traffic. The fix improves both conversion rate and Quality Score simultaneously.",
    fix: 'Run Google PageSpeed Insights (pagespeed.web.dev) on the Mobile preset. Identify the LCP element — almost always the hero image. Convert it to WebP or AVIF format (40–60% file size reduction), add a correct `sizes` attribute so mobile devices download a smaller version, and add `fetchpriority="high"` to hint early loading. Defer non-critical scripts and remove unused third-party tools that block rendering.',
    relatedHref: '/learning-centre/landing-page-load-time-slow',
    relatedLabel: 'LCP benchmarks and detailed fix guide →',
  },
  {
    stage: 'Above Fold',
    title: 'No Proof Before the CTA',
    signal: 'Good page engagement (over 30 seconds average), low form starts or add-to-cart rate',
    description:
      'The visitor read the page but was not convinced. Asking for commitment — an email, a purchase, a demo — before providing evidence that the offer is credible forces the visitor to decide with no supporting data. Cold paid traffic has no prior relationship with the brand. A CTA that appears before any proof signals is asking for trust that has not been earned.',
    why: "Proof before CTA is a sequencing principle, not a design opinion. The visitor's hesitation peak is immediately before the first meaningful ask. A proof element placed at that moment — a specific testimonial, an outcome stat, a recognisable logo — reduces the cognitive cost of clicking by creating a micro-commitment before the macro one.",
    fix: 'Add one specific, attributed proof element above the primary CTA. A stat with context ("Used by X operators to identify the exact section killing their conversions") or a named testimonial with a result ("Booked 3 new clients in 30 days — Sarah L., Performance Marketing Manager") placed directly above the button is sufficient. Generic "5-star rated" claims without context do not count as proof.',
    relatedHref: '/learning-centre/proof-before-cta',
    relatedLabel: 'Proof placement guide and 3 no-redesign implementations →',
  },
  {
    stage: 'Form / Checkout',
    title: 'High-Friction Form',
    signal: 'Form views but low submission rate (under 20% of form views completing)',
    description:
      'Every additional form field reduces completion rate. Phone number, company size, job title, and budget fields are the most common high-friction additions. Each optional field sends a signal: "we want more from you than the minimum required to deliver the next step." The visitor interprets this as a sales process they did not sign up for and abandons.',
    why: "Form friction is the most actionable conversion lever on the page because it requires no creative judgment — you either ask for the field or you do not. The principle is: collect only the information required to deliver the immediate next step. Everything else can be collected later in the process, after the visitor has agreed to engage.",
    fix: "Remove every field that is not required to deliver the next step. For a lead capture form where the next step is sending an email, you need one field: email. For a booking form where the next step is scheduling a call, you need name, email, and phone. 'Company size,' 'how did you hear about us,' and 'message' fields are optional — remove them from the primary conversion form. Collect them post-conversion if you need them.",
    relatedHref: '/learning-centre/landing-page-not-converting',
    relatedLabel: 'Landing page conversion diagnosis guide →',
  },
  {
    stage: 'Mobile Layout',
    title: 'Mobile Friction',
    signal: 'Desktop converts at 3–5%, mobile converts at under 1% on the same page with similar traffic quality',
    description:
      'The majority of paid social traffic arrives on mobile. Broken layouts, full-size images not compressed for mobile networks, CTAs pushed below the fold by oversized hero sections, and tap targets under 44px silently filter out the majority of paid social visitors. The desktop conversion rate masks the mobile failure in blended analytics.',
    why: "Most landing pages are designed and tested on desktop. The mobile experience is treated as an afterthought — a responsive breakpoint that 'should work.' In practice, the 390px viewport on a real phone reveals failures that DevTools device emulation does not: actual touch interaction precision, real 4G network conditions, and the physical reality of reading a screen that fits in one hand.",
    fix: "Open the page on a real phone. Read the headline aloud. Is the CTA visible without scrolling? Can you tap every button on the first try with your thumb? Run PageSpeed Insights mobile. Check that LCP is under 2.5 seconds. Fix in order: layout visibility, tap targets, load time. Do not rely on DevTools 'mobile view' for this audit — use a real device.",
    relatedHref: '/learning-centre/mobile-landing-page-leaks',
    relatedLabel: 'Full mobile leak audit: 5 leaks and fixes →',
  },
  {
    stage: 'Trust Signals',
    title: 'Missing Compliance and Trust',
    signal: 'Ad disapprovals, "Below Average" Landing Page Experience in Quality Score, low Quality Score on complaint-sensitive keywords',
    description:
      'Google and Meta evaluate trust signals on your landing page when reviewing ads. Missing privacy policy, no physical address or business identification, absent or buried refund/cancellation policy, and no SSL are all trust failures that can trigger ad disapprovals or "Below Average" Landing Page Experience ratings. Beyond ad platform compliance, these missing signals erode visitor trust at the payment or commitment stage.',
    why: "Ad platforms disapprove pages that do not meet their landing page policies. Google requires that the landing page URL be accessible, match the display URL, not contain misleading content, and not require users to download software to view it. Beyond policy, visitors making a purchase or committing personal information look for standard trust signals — security badge, recognisable payment methods, clear return policy — in the same way they look for proof of competence.",
    fix: "Audit your footer and checkout page: privacy policy link, physical address or business name, email contact, and refund/cancellation terms must all be present and accessible from the landing page. Add SSL if not already present (most platforms include this). Add a trust badge row near any conversion element: payment icons, security seal, guarantee text. Run your ad destination URL through Google's Ad Preview and Policy Checker to identify any active policy flags.",
    relatedHref: '/learning-centre/landing-page-not-converting',
    relatedLabel: 'Full landing page conversion diagnosis →',
  },
]

export default function PaidTrafficLeakMapPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-[72px]">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl px-6 pt-6">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/learning-centre" className="hover:text-fg">Learning Centre</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">Paid Traffic Leak Map</li>
          </ol>
        </nav>

        <div className="mx-auto max-w-3xl px-6 py-10">
          {/* Hero */}
          <div className="rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Diagnostic Framework · Paid Traffic
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Paid Traffic Leak Map
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Every dollar spent on ads passes through a fixed sequence of stages before
              it either converts or leaks. This map identifies the stage, the signal that
              confirms it is broken, and the specific fix — in order of where traffic
              typically leaks first.
            </p>
          </div>

          {/* How to use the map */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">How to use this map</h2>
            <p className="leading-relaxed text-fg-muted">
              Work through the leaks in sequence — each stage gates the next. A visitor
              who exits at the message-match stage (Leak 1) never reaches the form
              (Leak 4). Identify the first stage where your analytics show an anomaly and
              fix that before moving further down the map.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Each leak entry includes: the funnel stage, the analytics signal that
              confirms it is active, why it causes the loss, and the specific fix.
            </p>
          </section>

          {/* Leak cards */}
          <section className="mt-6 space-y-5">
            {LEAKS.map((leak, i) => (
              <div key={i} className="rounded-2xl border border-border bg-bg-panel p-7">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full border border-accent/30 px-3 py-1 text-xs font-bold text-accent">
                    {leak.stage}
                  </span>
                  <span className="text-xs text-fg-muted font-medium">Leak {i + 1}</span>
                </div>
                <h2 className="mb-3 text-xl font-bold text-fg">{leak.title}</h2>

                <div className="mb-4 rounded-lg bg-bg p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-1">Signal</p>
                  <p className="text-sm text-fg">{leak.signal}</p>
                </div>

                <p className="mb-4 leading-relaxed text-fg-muted text-sm">{leak.description}</p>

                <details className="mb-4">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-fg-muted hover:text-accent transition-colors">
                    Why this causes the loss ↓
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted pl-2 border-l border-border">
                    {leak.why}
                  </p>
                </details>

                <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Fix</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{leak.fix}</p>
                </div>

                <Link
                  href={leak.relatedHref}
                  className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
                >
                  {leak.relatedLabel}
                </Link>
              </div>
            ))}
          </section>

          {/* Triage table */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-5 text-2xl font-bold text-fg">
              Quick-triage table: what you see → where to look
            </h2>
            <div className="space-y-3">
              {[
                { symptom: 'High CTR, high bounce, under 15s on page', leak: 'Leak 1 (message-match) or Leak 2 (load time)', first: 'Check mobile LCP first, then H1 vs ad headline' },
                { symptom: 'High CTR, high bounce, 15–45s on page', leak: 'Leak 3 (no proof before CTA)', first: 'Check what proof element is visible before the first CTA' },
                { symptom: 'Low CTR (under 3%) on search', leak: 'Ad layer — not a page problem yet', first: 'Fix ad copy or keyword match types before the page' },
                { symptom: 'Mobile bounce 20+ points above desktop', leak: 'Leak 5 (mobile friction)', first: 'Open the page on a real phone and run mobile PageSpeed' },
                { symptom: 'Form views but low submissions', leak: 'Leak 4 (form friction)', first: 'Count form fields — remove anything not required to deliver the next step' },
                { symptom: 'Ad disapprovals or low Quality Score', leak: 'Leak 6 (trust signals)', first: "Check footer for privacy policy, address, refund terms; run Google's Ad Policy Checker" },
              ].map(({ symptom, leak, first }) => (
                <div key={symptom} className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-fg text-sm">{symptom}</p>
                  <p className="text-xs text-accent font-medium mt-0.5">{leak}</p>
                  <p className="text-xs leading-relaxed text-fg-muted mt-1">{first}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-6 text-2xl font-bold text-fg">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((item, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="mb-2 font-semibold text-fg">{item.name}</h3>
                  <p className="leading-relaxed text-fg-muted">
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg">Find your specific leak</h2>
            <p className="mt-4 max-w-xl mx-auto text-fg-muted">
              The free audit checks your landing page URL against all 6 leak patterns
              automatically and returns a specific, prioritised diagnosis.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/audit"
                className="inline-flex rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors"
              >
                Run the free audit
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-xl border border-accent px-8 py-4 font-semibold text-accent hover:bg-accent-dim transition-colors"
              >
                See the Fix Pack
              </Link>
            </div>
          </section>

          <div className="mt-10">
            <Link
              href="/learning-centre"
              className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
            >
              ← Back to Learning Centre
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
