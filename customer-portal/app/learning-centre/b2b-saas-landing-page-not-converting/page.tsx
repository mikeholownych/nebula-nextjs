import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'B2B SaaS Landing Page Not Converting: Fix Message-Match First | Nebula Components',
  description: 'When a B2B SaaS landing page is not converting paid traffic, message-match is the first thing to audit. Learn the 3-step fix.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/b2b-saas-landing-page-not-converting' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why does a B2B SaaS landing page not convert?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The most common cause is asking for high-commitment action (demo, trial, sales call) before providing evidence that the product solves the visitor's specific problem. Enterprise B2B buyers are typically 57% through the purchase decision before engaging with a vendor — they are evaluating multiple options simultaneously and need to self-qualify before investing time in a call. When the page leads with the demo CTA before proof, case studies, or a clear value proposition, visitors bounce because the ask arrived before the value was established. The fix is to resequence: hero → problem statement → case studies with outcome numbers → ROI or self-assessment tool → demo CTA.",
      },
    },
    {
      '@type': 'Question',
      name: 'What do enterprise B2B buyers need to see on a landing page before they will book a demo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Enterprise buyers need four things before they will invest time in a demo: (1) Case studies from companies in their industry, with specific measurable outcomes — not logos, actual numbers. (2) ROI calculator or business case tool that lets them model the value internally without a sales call. (3) Technical specifications — architecture, security certifications, integration capabilities — so technical evaluators can shortlist without escalating to procurement. (4) Competitive differentiation — substantive comparison showing where the product fits and where it does not, written for someone who has already evaluated three other tools. Pages that skip these steps and lead with the demo button are asking for commitment before earning it.",
      },
    },
    {
      '@type': 'Question',
      name: 'Should a B2B SaaS landing page have a free trial or a demo CTA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "It depends on product complexity and sales motion. For product-led growth (PLG) SaaS where the product is self-explanatory and onboarding is guided, a free trial or freemium CTA typically outperforms a demo request because it requires less commitment from the visitor. For complex enterprise SaaS with significant setup requirements, long sales cycles, or compliance considerations, a demo is appropriate — but only after the page has provided sufficient proof that the product is worth 30 minutes of a senior buyer's time. A secondary CTA ('See how it works' linking to an interactive tour or video walkthrough) is an effective middle-ground that converts visitors who are not yet ready for the demo ask.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the correct page structure for a B2B SaaS landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Value-first structure: (1) Hero — specific value proposition with one trust signal (G2 badge, logo, outcome stat). (2) Problem statement — show understanding of the specific pain, not a generic industry problem. (3) Solution overview — how you solve it differently, not a feature list. (4) Case studies — real outcomes with numbers from companies similar to the visitor. (5) Interactive value — ROI calculator or self-assessment that lets the visitor model their own case. (6) Demo CTA — by this point, you have earned it. The demo button can also appear in the hero as a secondary option for high-intent visitors who arrive pre-qualified, but the primary page structure should build evidence before the ask.",
      },
    },
  ],
}

const articleSchema = createArticleSchema({
  headline: 'B2B SaaS Landing Page Not Converting: Fix Message-Match First',
  description: 'When a B2B SaaS landing page is not converting paid traffic, message-match is the first thing to audit. Learn the 3-step fix.',
  url: 'https://nebulacomponents.shop/learning-centre/b2b-saas-landing-page-not-converting',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-19',
})

export default function B2BSaaSLandingPageNotConverting() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-[72px]">

        <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/learning-centre" className="hover:text-fg">Learning Centre</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">B2B SaaS Landing Page Not Converting</li>
          </ol>
        </nav>

        <article className="mx-auto max-w-4xl px-6 py-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Industry Specific</p>
          <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
            B2B SaaS Landing Page Not Converting? The Demo Ask Is Too Soon
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
            B2B SaaS pages ask for demos before proving value. Enterprise buyers are 57% through the purchase process before they engage with sales. Lead with the demo ask and you lose them before the page loads.
          </p>

          {/* Problem / solution */}
          <div className="mt-10 grid gap-6 rounded-2xl border border-border bg-bg-muted/30 p-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">The Problem</p>
              <p className="text-sm leading-relaxed text-fg-muted">Demo CTA before any proof. Buyer has no context, no evidence, no reason to give 30 minutes to a salesperson they don&apos;t trust yet.</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">The Fix</p>
              <p className="text-sm leading-relaxed text-fg-muted">Restructure the page so value comes first. Earn the demo ask with case studies, outcomes, and ROI proof placed before the CTA.</p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-fg">1. Why Demo-First Fails</h2>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The median B2B buyer is 57% through the purchase decision before they speak to a vendor. They&apos;re researching independently—evaluating 3 to 5 vendors simultaneously—and need to shortlist before investing time in a call.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              When a visitor arrives and the first thing they see is a "Request a Demo" button, before they understand what the product does or whether it fits their situation, they bounce. The ask arrived before the value.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The downstream effect: pipeline full of demos that never convert, or no demos booked at all. Both symptoms point to the same root cause—the page asked for commitment before earning it.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-fg">2. What Enterprise Buyers Need Before the Ask</h2>
            <ul className="mt-6 space-y-4">
              {[
                { label: 'Case studies', detail: 'Results from companies in their industry. Measurable outcomes. Not logos—actual numbers.' },
                { label: 'ROI calculator', detail: 'Enterprise buyers need to build an internal business case. Give them the tool to do it without the sales call.' },
                { label: 'Technical specs', detail: 'Architecture, security certifications, integration capabilities. Technical evaluators need this to shortlist.' },
                { label: 'Competitive differentiation', detail: "Substantive comparison—not marketing copy. Where do you fit and where don't you." },
              ].map((item) => (
                <li key={item.label} className="flex gap-4 rounded-xl border border-border bg-bg-muted/20 p-5">
                  <span className="mt-0.5 shrink-0 text-accent">→</span>
                  <div>
                    <p className="font-semibold text-fg">{item.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 — page structure */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-fg">3. Value-First Page Structure</h2>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Don&apos;t remove the demo CTA—move it. The page earns the ask by building evidence before it arrives.
            </p>
            <ol className="mt-6 space-y-3">
              {[
                'Hero — clear value prop + one trust signal (logo, stat, G2 badge)',
                'Problem statement — show you understand the specific pain',
                'Solution overview — how you solve it differently',
                'Case studies — real outcomes from similar companies',
                'Interactive value — ROI calc or self-assessment',
                'Demo CTA — now you\'ve earned it',
              ].map((step, i) => (
                <li key={i} className="flex items-baseline gap-3 text-fg-muted">
                  <span className="shrink-0 text-xs font-bold text-accent">{i + 1}</span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Section 4 — quick wins */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-fg">4. Quick Wins (No Redesign Required)</h2>
            <ul className="mt-6 space-y-3">
              {[
                'Add a proof banner above the fold: "#1 rated on G2 for [category]" or "Trusted by [recognizable logos]"',
                'Add a secondary CTA: "See How It Works" leading to a product tour or explainer video',
                'Add one case study link below the hero — headline with a quantified result',
                'Include one outcome stat in your H1: "How [Company] hit [result] in [timeframe]"',
              ].map((win, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
                  <span className="mt-0.5 shrink-0 text-accent">✓</span>
                  {win}
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="mt-16 rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
            <h2 className="text-xl font-bold text-fg">Is Your SaaS Page Asking Too Early?</h2>
            <p className="mt-3 text-fg-muted">
              The free audit checks message-match, proof placement, and CTA timing on your actual landing page URL.
            </p>
            <Link
              href="/audit"
              className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg transition-colors hover:bg-accent-light"
            >
              Run Free Audit →
            </Link>
          </section>

          {/* Related */}
          <section className="mt-12">
            <h3 className="mb-4 text-sm font-semibold text-fg">Related articles</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { slug: 'landing-page-not-converting', title: 'Landing Page Not Converting', desc: 'Diagnose and fix the root causes of low conversion.' },
                { slug: 'proof-before-cta', title: 'Proof Before CTA', desc: 'Build credibility before asking for commitment.' },
              ].map((a) => (
                <Link
                  key={a.slug}
                  href={`/learning-centre/${a.slug}`}
                  className="rounded-xl border border-border p-5 transition-colors hover:border-accent/40"
                >
                  <p className="font-semibold text-fg">{a.title}</p>
                  <p className="mt-1 text-sm text-fg-muted">{a.desc}</p>
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
