import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Traffic But No Form Fills: Fix The Real Leak Before The Form | Nebula Components',
  description: 'Getting traffic but no form fills? The form is almost never the first problem. Here\'s how to diagnose where trust broke down before visitors ever reached the form.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/traffic-but-no-form-fills' },
}

const articleSchema = createArticleSchema({
  headline: 'Traffic But No Form Fills: The Form Is Usually Not The First Leak',
  description: 'Getting traffic but no form fills? The form is almost never the first problem. Here\'s how to diagnose where trust broke down before visitors ever reached the form.',
  url: 'https://nebulacomponents.shop/learning-centre/traffic-but-no-form-fills',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function TrafficButNoFormFillsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Form Leaks · Conversion Diagnosis</p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">Traffic But No Form Fills: The Form Is Usually Not The First Leak</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">When visitors land but don't fill out the form, the reflex is to redesign the form — more fields, fewer fields, a different layout. That's solving the wrong problem. The form is the last thing a visitor reaches. By the time they get there, they've already decided whether they trust you enough to hand over their details. That decision happens well before the form.</p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Form Is The Last Gate, Not The First</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">Think of the conversion path as a chain: the click brings someone with a specific intent, the hero earns the right to keep them reading, the body builds the case with proof and specifics, and the form closes the argument. If the chain breaks anywhere before the form, no amount of form optimisation will recover the conversion.</p>
          <p className="leading-relaxed text-fg-muted">The most common form-fill failures have nothing to do with the form itself. They're failures of trust, clarity, or credibility that happened in the first 10 seconds — and the visitor who didn't fill out your form left 40 seconds before they even scrolled far enough to see it.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Four Reasons Forms Don't Get Filled</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-fg">1. The Page Hasn't Earned The Ask Yet</h3>
              <p className="leading-relaxed text-fg-muted">If your form appears before there's any proof — testimonials, outcomes, specifics, credibility signals — you're asking for trust you haven't built. The visitor's internal calculation is: "I don't know if this works, I don't know if this person delivers, and they're asking me for my information." That's a no. Proof belongs above the form. Always. One specific result or a named outcome immediately before the form field lifts completion rates measurably because it answers the doubt that was stalling the click.</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-fg">2. The Form Asks Too Much</h3>
              <p className="leading-relaxed text-fg-muted">Every field you add to a form costs approximately 10% of completions. That's not a metaphor — it's the consistent pattern across form optimisation data. A form with name, email, phone, company, company size, and "tell us about your situation" is a five-decision obstacle, not a form. For most B2B lead gen, the minimum viable form is name and email. If you need a phone number, ask for it after the initial conversion — in a follow-up email or on a thank-you page. You can earn additional information once there's already a relationship.</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-fg">3. Friction Language On The Button</h3>
              <p className="leading-relaxed text-fg-muted">"Submit" is the single worst word on a conversion button. It communicates nothing about what happens next and subtly frames the action as something being done to the visitor. Button copy should describe the outcome the visitor receives: <span className="font-semibold text-fg">"Get my free audit"</span> instead of "Submit." <span className="font-semibold text-fg">"Send my leak report"</span> instead of "Send." The copy should answer: what do I get when I click this? If the answer isn't in the button, the button is working against you.</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-fg">4. No Privacy Reassurance Near The Field</h3>
              <p className="leading-relaxed text-fg-muted">Visitors who hesitate at a form are often running a quick threat model: "If I give them my email, am I going to get spammed?" A single line directly below the email field — <span className="italic text-fg">"No spam. One email with your results."</span> — reduces that hesitation significantly. It doesn't need to be a long privacy policy link. It needs to be a plain-language promise positioned exactly where the doubt arises: right below the input field, not buried in a footer.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">How To Diagnose Where The Real Leak Is</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">Before you touch the form, get the diagnostic data:</p>
          <ul className="space-y-3 text-fg-muted">
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span><span><span className="font-semibold text-fg">Heatmaps:</span> Where are visitors dropping off before the form? If scroll depth shows most visitors leave at the 30% mark and your form is at 70%, you have an above-the-fold trust problem — not a form problem.</span></li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span><span><span className="font-semibold text-fg">Session recordings:</span> Watch 10 recordings of visitors who didn't convert. Look for rage-clicks (repeated frustrated clicking), back-navigation immediately after scroll, and hover-then-abandon on the CTA button. Each of these signals a different break in the chain.</span></li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span><span><span className="font-semibold text-fg">Form scroll depth:</span> Are visitors reaching the form at all? If fewer than 30% of sessions scroll to the form, the problem isn't the form — it's everything above it. If 70% reach the form but only 2% fill it, the form and its surrounding context is the issue.</span></li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Form Fix Checklist</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">Once you've confirmed the form zone itself is the leak (visitors reach it but don't fill it), work through this in order:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent text-accent text-xs font-bold">✓</span>
              <span className="text-fg-muted"><span className="font-semibold text-fg">Reduce to minimum viable fields.</span> Name + email for most B2B. Add phone only if your follow-up is exclusively by phone and you can justify the ask.</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent text-accent text-xs font-bold">✓</span>
              <span className="text-fg-muted"><span className="font-semibold text-fg">Rewrite the submit button to name the outcome.</span> "Get my free audit," "Send my leak report," "Start the diagnosis" — specific, outcome-oriented, first person.</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent text-accent text-xs font-bold">✓</span>
              <span className="text-fg-muted"><span className="font-semibold text-fg">Add a single line of proof directly above the form.</span> One specific outcome from a real user. Not a logo wall — a specific result that makes the decision feel safer.</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent text-accent text-xs font-bold">✓</span>
              <span className="text-fg-muted"><span className="font-semibold text-fg">Remove competing navigation.</span> Header nav links and footer menus near the form give the visitor an exit option at the moment of peak intent. Strip them from the conversion zone.</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent text-accent text-xs font-bold">✓</span>
              <span className="text-fg-muted"><span className="font-semibold text-fg">Add a no-spam line directly below the email field.</span> Short, plain, positioned precisely at the point of doubt. "No spam. Your results, once." is enough.</span>
            </div>
          </div>
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
            <Link href="/learning-centre/cta-not-working" className="block text-accent hover:text-accent-light transition-colors">CTA Not Working: The Five Most Common Button Leaks →</Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block text-accent hover:text-accent-light transition-colors">Landing Page Not Converting: The Full Diagnostic Checklist →</Link>
            <Link href="/learning-centre/proof-before-cta" className="block text-accent hover:text-accent-light transition-colors">Proof Before CTA: The Ordering Rule That Lifts Conversions →</Link>
            <Link href="/learning-centre/mobile-landing-page-leaks" className="block text-accent hover:text-accent-light transition-colors">Mobile Landing Page Leaks: Why Mobile Visitors Don't Convert →</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
