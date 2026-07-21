import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'No Testimonials on Landing Page: How Proof Placement Changes Conversion | Nebula Components',
  description: 'Missing or misplaced testimonials are one of the most common reasons landing pages do not convert paid traffic.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/no-testimonials-on-landing-page' },
}

export default function LearningCentrePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>

        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Trust Leaks · no testimonials on landing page
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            No Testimonials On Landing Page? Add Proof Before CTA
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Pages ask before they prove. No testimonials means no trust. Add social proof above the CTA to earn the ask.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Proof-First Principle</h2>
          <p className="leading-relaxed text-fg-muted">
            Trust before ask. A visitor who has seen no evidence that you deliver results will not hand over their email, phone number, or credit card. Every landing page makes a promise. The testimonials are the receipt. Without them, the promise feels like risk.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Most pages put the CTA above the fold and bury the proof somewhere below. That backwards loading order creates friction. The visitor sees the ask before they see the reason to say yes.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">What Counts as Proof</h2>
          <ul className="space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Testimonials:</strong> Real quotes from named customers with specific results. &quot;Great to work with&quot; proves nothing. &quot;Cut our cost per lead by 62% in 3 weeks&quot; proves everything.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Logos:</strong> Recognizable brand badges signal that others trusted you. Best for B2B where the buyer knows the names.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Case results:</strong> Before/after metrics, screenshots, or outcome snapshots that show the transformation.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Numbers:</strong> &quot;47 companies fixed this leak last month&quot; beats vague claims of being an expert.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Proof that works is specific, verifiable, and relevant to the problem your visitor has right now.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Where to Place It</h2>
          <ul className="space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Above the CTA:</strong> The visitor should see at least one proof element before the first major ask.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Near objection points:</strong> If price is a concern, show ROI proof nearby. If credibility is a concern, show logos or accreditations.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">In the confirmation zone:</strong> Right before the final CTA, remind them why others said yes.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Placement is not about decoration. It is about answering the silent &quot;Why should I trust you?&quot; that plays in the background of every landing page visit.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Quick Wins</h2>
          <ul className="space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Add 3 testimonials with specific results, not generic praise.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Put the strongest proof element above the fold if possible.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Use real names and companies. &quot;Marketing Director at SaaS company&quot; is weaker than &quot;Sarah Chen, VP Marketing at Vercel.&quot;
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              If you have no testimonials yet, use numbers: &quot;X customers,&quot; &quot;Y results delivered,&quot; or &quot;Z years of fixing this exact problem.&quot;
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A page with proof above the CTA converts higher than a page that asks first and explains later.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the free Nebula audit first. Buy the $97 Fix Pack only when the leak is obvious.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/paid-traffic-leak-map" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Open leak map
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/proof-before-cta" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Proof Before CTA: The Simple Fix Most Landing Pages Miss
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
