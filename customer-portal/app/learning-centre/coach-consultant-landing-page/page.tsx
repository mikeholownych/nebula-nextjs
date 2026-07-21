import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Coach Consultant Landing Page Not Converting: Fix The Discovery Call Ask | Nebula Components',
  description: 'Coaches and consultants lose clients on the landing page before the sales call. Here\'s why the discovery call ask is the leak — and what to fix first.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/coach-consultant-landing-page' },
}

const articleSchema = createArticleSchema({
  headline: 'Coach Or Consultant Landing Page Not Converting? The Discovery Call Ask Is The Leak',
  description: 'Coaches and consultants lose clients on the landing page before the sales call. Here\'s why the discovery call ask is the leak — and what to fix first.',
  url: 'https://nebulacomponents.shop/learning-centre/coach-consultant-landing-page',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function CoachConsultantLandingPagePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Industry Specific · Service Businesses</p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">Coach Or Consultant Landing Page Not Converting? The Discovery Call Ask Is The Leak</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">You're running ads or posting content. Traffic is coming in. But almost nobody books the call. The instinct is to tweak the ad creative or try a different platform. The actual problem is on the page — and it almost always starts with asking too much, too soon.</p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Asking For 30–60 Minutes From A Stranger Is A High-Commitment Ask</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">A discovery call is not a low-friction CTA. You're asking someone who has known you for 45 seconds to block out their calendar, show up at a specific time, and have a conversation about their business or life with a person they've never spoken to. That's a significant commitment — and your landing page is doing nothing to make that leap feel safe.</p>
          <p className="leading-relaxed text-fg-muted">The fix isn't to remove the discovery call. It's to stop leading with it. Your page should sell the <em>next smallest step</em> — a free resource, a 15-minute clarity call framed as low-stakes, a quiz that shows them where they're stuck. One step that earns trust. The discovery call happens after that.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Your Bio Is In The Wrong Place</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">On most coach and consultant pages, the structure is: hero → long bio → credentials → testimonials → CTA. Visitors read the bio, feel nothing, and leave. They didn't come to your page to read about you — they came because they have a problem they want solved.</p>
          <p className="leading-relaxed text-fg-muted">Flip the order. Lead with the transformation you deliver. Lead with the specific outcome: not "live your best life" but "book 3 new clients in the next 30 days without cold outreach." Then show proof that you've done it for others. Then introduce yourself as the person who made that possible. Bio earns authority only after the visitor believes the outcome is real.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Vague Transformation Language Is Costing You Qualified Leads</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">Phrases like "unlock your potential," "create aligned success," or "live with intention" don't convert because they don't describe a result anyone can picture. Your ideal client has a specific, urgent problem. Name it specifically.</p>
          <p className="mb-4 leading-relaxed text-fg-muted">The test: can a stranger read your hero headline and tell you — in one sentence — what they will have or be able to do after working with you? If the answer requires interpretation, the headline is the leak.</p>
          <p className="leading-relaxed text-fg-muted">Compare: <span className="font-semibold text-fg">"I help coaches build sustainable businesses"</span> vs <span className="font-semibold text-fg">"I help 1:1 coaches go from 2 clients/month to a waitlist in 60 days — without paid ads."</span> The second one self-selects the right person and filters out everyone else. That's the goal.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Testimonials Without Specifics Are Almost Worthless</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">For personal services — coaching, consulting, advisory — social proof is load-bearing. Visitors need to believe before they'll book. But most testimonials are vague: "Working with [Name] changed my life." That's not proof. That's noise.</p>
          <p className="mb-4 leading-relaxed text-fg-muted">Specific testimonials convert. The format: <span className="font-semibold text-fg">who they were before → what specifically changed → the measurable result → the timeframe.</span> "I'd been stuck at $4k months for a year. Three months in, I hit $11k and hired my first assistant." That's a proof asset. Collect it, feature it prominently, and put it above the CTA — not buried in a carousel at the bottom.</p>
          <p className="leading-relaxed text-fg-muted">If you don't have strong testimonials yet, use case outcomes with permission: "Client A went from 2 to 9 clients in 6 weeks." Named or anonymous, the specifics are what carry the weight.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Not Showing Pricing Forces An Awkward Conversation</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">Hiding pricing to "encourage a discovery call" is a mistake for most coaches and consultants. Visitors who can't afford you will book the call anyway, waste both your time, and leave frustrated. Visitors who can afford you but are unsure of the value will ghost because there's no way to self-qualify.</p>
          <p className="leading-relaxed text-fg-muted">You don't need to show exact pricing. But showing a range ("Investment starts at $X/month"), a starting point, or a clear anchor ("3-month engagement") gives qualified visitors something to calibrate against — and filters out those who were never a fit. Every minute you spend on an unqualified discovery call is a minute not spent on the page that generated it.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">Run the free Nebula audit to see exactly where your page breaks the chain from click to conversion.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">Run the free audit</Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/no-testimonials-on-landing-page" className="block text-accent hover:text-accent-light transition-colors">Why Missing Testimonials Kill Personal-Service Pages →</Link>
            <Link href="/learning-centre/proof-before-cta" className="block text-accent hover:text-accent-light transition-colors">Proof Before CTA: The Ordering Rule That Lifts Conversions →</Link>
            <Link href="/learning-centre/pricing-page-not-converting" className="block text-accent hover:text-accent-light transition-colors">Pricing Page Not Converting: What The Page Is Hiding →</Link>
            <Link href="/learning-centre/cta-not-working" className="block text-accent hover:text-accent-light transition-colors">CTA Not Working: The Five Most Common Button Leaks →</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
