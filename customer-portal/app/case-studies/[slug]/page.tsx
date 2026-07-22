import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type CaseStudy = {
  slug: string
  title: string
  eyebrow: string
  description: string
  outcome: string
  outcomeLabel: string
  situation: string
  diagnosis: string
  fixes: string[]
  result: string
  publishedDate: string
  modifiedDate: string
}

const CASE_STUDIES: Record<string, CaseStudy> = {
  'founder-ecommerce-48x-roas': {
    slug: 'founder-ecommerce-48x-roas',
    title: 'Ecommerce: 48x ROAS From Landing Page Fixes',
    eyebrow: 'Ecommerce',
    description:
      'Founder spent $12k on Meta ads with zero sales. A landing page audit revealed 5 conversion leaks. After fixing: $97 ad spend produced $7,100 revenue — 48x ROAS.',
    outcome: '48x ROAS',
    outcomeLabel: 'Return on Ad Spend',
    situation:
      'A DTC ecommerce founder had been running Meta ads for four months, spending approximately $12,000, with zero completed purchases. Click-through rates looked healthy. The problem was on the landing page.',
    diagnosis:
      'The audit identified five leaks: no above-fold social proof, a CTA that appeared before any product explanation, mobile layout breaking product images, checkout link pointing to a third-party domain with no trust signals, and page load over 4.8 seconds.',
    fixes: [
      'Added customer photo testimonials above the fold',
      'Moved CTA below the product benefit block',
      'Fixed mobile image overflow and compressed hero image from 1.4MB to 68KB',
      'Added SSL badge and money-back guarantee near checkout link',
      'Eliminated two blocking third-party scripts',
    ],
    result:
      'Next Meta campaign: $97 spend → $7,100 revenue. 48x ROAS. The landing page, not the ad creative, had been the bottleneck the entire time.',
    publishedDate: '2025-09-01',
    modifiedDate: '2026-07-18',
  },
  'b2b-saas-cut-cpc-in-half': {
    slug: 'b2b-saas-cut-cpc-in-half',
    title: 'B2B SaaS: Cut CPC In Half By Fixing Quality Score',
    eyebrow: 'B2B SaaS',
    description:
      'Google Quality Score was 3/10. Audit revealed message-match breaks between ad copy and landing page. Fixing alignment raised Quality Score to 8/10 and cut CPC by 50%.',
    outcome: '−50% CPC',
    outcomeLabel: 'Cost Per Click Reduction',
    situation:
      'A B2B SaaS company running Google Search ads had a Quality Score of 3/10 on their primary keywords. They were paying a CPC premium every single auction.',
    diagnosis:
      'The audit found critical message-match breaks: the ad promised "free 14-day trial — no credit card" but the landing page required a credit card upfront. The headline on the page did not repeat the keyword phrase from the ad group. Load time was 5.2 seconds.',
    fixes: [
      'Rewrote landing page headline to echo the exact search keyword',
      'Removed credit card requirement from the trial sign-up form',
      'Added keyword-matched subheading reinforcing the ad promise',
      'Reduced page weight by deferring analytics scripts',
      'Added FAQ addressing trial-to-paid conversion concern',
    ],
    result:
      'Quality Score rose from 3/10 to 8/10 within two weeks. CPC dropped 50%. Monthly ad budget stretched twice as far without increasing spend.',
    publishedDate: '2025-10-15',
    modifiedDate: '2026-07-18',
  },
  'agency-client-compliance-recovery': {
    slug: 'agency-client-compliance-recovery',
    title: 'Agency: Recovered Disapproved Ads Account',
    eyebrow: 'Agency',
    description:
      'Google Ads account suspended for policy violations. Audit identified landing page trust-signal and compliance gaps. After fixes: ads reinstated, client retained.',
    outcome: 'Account Restored',
    outcomeLabel: 'Ads Account Reinstated',
    situation:
      'A digital agency managing a client\'s Google Ads account received a suspension notice. The disapproval cited "untrustworthy promotions" policy. The account had been running for two years without issue.',
    diagnosis:
      'The audit flagged the landing page as the trigger: missing physical address, no clear refund/cancellation policy, a countdown timer with no stated basis, earnings claims with no disclaimers, and a phone number that went to voicemail without a callback option.',
    fixes: [
      'Added registered business address and contact email to the footer',
      'Published a clear refund and cancellation policy page, linked from the landing page',
      'Removed countdown timer entirely (no verifiable scarcity basis)',
      'Added FTC-compliant earnings disclaimer below all outcome claims',
      'Added a contact form as a fallback to the phone number',
    ],
    result:
      'Appeals submitted post-fix. Account reinstated within 6 business days. Client retained. No repeat suspension in the following 90 days.',
    publishedDate: '2025-11-01',
    modifiedDate: '2026-07-18',
  },
  'coaching-business-form-fills-from-zero': {
    slug: 'coaching-business-form-fills-from-zero',
    title: 'Coaching: First Form Fills From Paid Traffic',
    eyebrow: 'Coaching',
    description:
      'Business coach spent $5k on Meta ads with 0 form fills. Audit found CTA above proof and mobile friction. After fixes: 23 form fills at $12.40 each.',
    outcome: '23 Leads',
    outcomeLabel: 'Form Fills at $12.40 Each',
    situation:
      'A business coach ran a $5,000 Meta campaign over six weeks targeting founders. Zero form fills. The creative had good engagement — links were being clicked — but nobody completed the form.',
    diagnosis:
      'The audit found three conversion killers: the booking form appeared above any credibility content; on mobile the form was partially obscured by a sticky cookie banner; and the form asked for phone number (high friction) before establishing any trust.',
    fixes: [
      'Moved the form below a social proof section with three testimonials and a client logo row',
      'Fixed cookie banner z-index and reduced its mobile footprint',
      'Removed phone number field; made it optional in a second step',
      'Added a "What happens next" explanation adjacent to the form CTA',
      'Compressed hero image and eliminated a render-blocking font load',
    ],
    result:
      '23 form fills in the next 30-day campaign. Cost per lead: $12.40. The audience was qualified the entire time — the page had been filtering them out.',
    publishedDate: '2025-12-01',
    modifiedDate: '2026-07-18',
  },
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const study = CASE_STUDIES[slug]
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
  return Object.keys(CASE_STUDIES).map((slug) => ({ slug }))
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const study = CASE_STUDIES[slug]
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
