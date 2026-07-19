import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Case Studies | Nebula Components',
  description: 'Real landing page optimization results from founders who stopped bleeding ad spend and started converting paid traffic.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/case-studies',
  },
}

export default function CaseStudiesIndex() {
  const caseStudies = [
    {
      slug: 'founder-ecommerce-48x-roas',
      title: 'Ecommerce: 48x ROAS From Landing Page Fixes',
      eyebrow: 'Ecommerce',
      summary: 'Founder spent $12k on Meta ads with zero sales. Audit revealed 5 landing page leaks. Fixed leaks → $147 spend, $7,100 revenue.',
      outcome: '48x ROAS'
    },
    {
      slug: 'b2b-saas-cut-cpc-in-half',
      title: 'B2B SaaS: Cut CPC In Half By Fixing Quality Score',
      eyebrow: 'B2B SaaS',
      summary: 'Google Quality Score was 3/10. Audit revealed message-match breaks. Fixed landing page alignment → Quality Score 8/10, CPC dropped 50%.',
      outcome: '-50% CPC'
    },
    {
      slug: 'agency-client-compliance-recovery',
      title: 'Agency: Recovered Disapproved Ads Account',
      eyebrow: 'Agency',
      summary: 'Google Ads disapproved for policy violations. Audit flagged landing page trust signals and compliance gaps. After fixes: ads running, client retained.',
      outcome: 'Account Restored'
    },
    {
      slug: 'coaching-business-form-fills-from-zero',
      title: 'Coaching: First Form Fills From Paid Traffic',
      eyebrow: 'Coaching',
      summary: 'Coach spent $5k on Meta with 0 form fills. Audit found CTA above proof and mobile friction. Fixed → 23 form fills at $12.40 each.',
      outcome: '23 Leads'
    }
  ]

  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg">
      <header className="border-b border-border px-6 py-4">
        <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-fg">Nebula</Link>
          <div className="flex items-center gap-5">
            <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded">Learning</Link>
            <Link href="/pricing" className="text-sm text-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded">Pricing</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Case Studies</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          Founders Who Stopped Bleeding Ad Spend
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Real results from founders who ran the audit, found the leaks, and fixed their landing pages — without hiring an agency or rewriting their entire funnel.
        </p>
      </section>

      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8">
            {caseStudies.map((study) => (
              <Link
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                className="group block rounded-xl border border-border bg-bg p-6 hover:border-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{study.eyebrow}</p>
                <h2 className="text-xl font-semibold text-fg group-hover:text-accent transition-colors">{study.title}</h2>
                <p className="mt-3 text-fg-muted">{study.summary}</p>
                <p className="mt-4 text-sm font-semibold text-accent">Outcome: {study.outcome}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-fg">Get Your Own Results</h2>
        <p className="mt-4 text-fg-muted">Run the free audit. Find your leaks. Fix them.</p>
        <Link
          href="/audit"
          className="mt-8 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
        >
          Run Free Audit →
        </Link>
      </section>

      <Footer />
    </main>
  )
}
